// supabase/functions/swing-analysis/index.ts
// @ts-nocheck - Deno Edge Function - types are provided at runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// ============================================
// VERSIONING CONSTANTS - Update these when you change the analysis
// ============================================
const ANALYSIS_CONFIG = {
  model: "gpt-5-mini",           // OpenAI model
  prompt_version: "2",             // Bump when prompt changes (v2: inject DB slugs)
  schema_version: "1",             // Bump when output schema changes  
  pose_extractor_version: "mediapipe-pose-lite-1.0",  // Client-side pose extraction version
} as const;

type ReqBody = { capture_id: number };

Deno.serve(async (req) => {
  let failedCaptureId: number | null = null;
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY")!;

    // Use the caller's JWT so RLS stays correct
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "missing_auth" }, 401);

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes?.user) return json({ error: "unauthorized" }, 401);

    const { capture_id } = (await req.json()) as ReqBody;
    if (!capture_id) return json({ error: "missing_capture_id" }, 400);
    failedCaptureId = capture_id;

    // 1) Fetch capture (RLS ensures only owner can read)
    const { data: capture, error: capErr } = await supabase
      .from("swing_capture")
      .select("*")
      .eq("id", capture_id)
      .single();

    if (capErr || !capture) return json({ error: "capture_not_found" }, 404);

    // Mark analyzing (optional)
    await supabase.from("swing_capture").update({ status: "analyzing" }).eq("id", capture_id);

    // 2) Fetch frames
    const { data: frames, error: framesErr } = await supabase
      .from("swing_frame")
      .select("*")
      .eq("capture_id", capture_id);

    if (framesErr || !frames?.length) {
      await supabase.from("swing_capture").update({ status: "failed" }).eq("id", capture_id);
      return json({ error: "no_frames" }, 400);
    }

    // 3) Signed URLs for frames: ONE image per frame (overlay > frame)
    //    Filter to key phases only to reduce LLM cost/latency
    const KEY_PHASES = ["address", "top", "impact", "follow_through"] as const;
    const phaseRank = new Map(KEY_PHASES.map((p, i) => [p, i]));
    const sortedFrames = [...frames].sort((a: any, b: any) => (a.timestamp_ms ?? 0) - (b.timestamp_ms ?? 0));
    const onePerPhase: Record<string, any> = {};
    for (const phase of KEY_PHASES) {
      const candidates = sortedFrames.filter((f: any) => f.phase === phase);
      if (!candidates.length) continue;
      // Keep exactly one image per core phase to cap LLM spend.
      onePerPhase[phase] =
        phase === "follow_through"
          ? candidates[candidates.length - 1]
          : candidates[0];
    }
    const keyFrames = Object.entries(onePerPhase)
      .map(([, frame]) => frame)
      .sort((a: any, b: any) => (phaseRank.get(a.phase as any) ?? 99) - (phaseRank.get(b.phase as any) ?? 99));
    
    const signedImages: Array<{ phase: string; url: string; kind: "overlay" | "frame" }> = [];

    for (const f of keyFrames) {
      const overlayPath = f.overlay_path as string | null;
      const framePath = f.frame_path as string;

      // Prefer overlay if available
      if (overlayPath) {
        const { data: s1, error: e1 } = await supabase.storage
          .from("swing-overlays")
          .createSignedUrl(overlayPath, 60 * 10);
        if (!e1 && s1?.signedUrl) {
          signedImages.push({ phase: f.phase, url: s1.signedUrl, kind: "overlay" });
          continue; // Use overlay, skip frame
        }
      }

      // Fallback to frame
      const { data: s2, error: e2 } = await supabase.storage
        .from("swing-frames")
        .createSignedUrl(framePath, 60 * 10);
      if (!e2 && s2?.signedUrl) {
        signedImages.push({ phase: f.phase, url: s2.signedUrl, kind: "frame" });
      }
    }

    // 4) Build input fingerprint for reproducibility tracking
    const inputFingerprint = buildInputFingerprint({
      frameIds: frames.map((f: any) => f.id),
      framePaths: frames.map((f: any) => f.frame_path),
      overlayPaths: frames.map((f: any) => f.overlay_path).filter(Boolean),
      poseSummary: capture.pose_summary,
      poseExtractorVersion: ANALYSIS_CONFIG.pose_extractor_version,
    });

    // 5) Fetch allowed slugs (and ids for validation) from DB — issue_scores and mechanic_scores keys MUST match these
    const { data: errorsRows, error: errErr } = await supabase
      .from("swing_error")
      .select("id, slug, name");
    if (errErr) {
      await supabase.from("swing_capture").update({ status: "failed" }).eq("id", capture_id);
      return json({ error: "db_error", detail: "swing_error: " + errErr.message }, 500);
    }
    const allowedErrors = (errorsRows ?? []) as Array<{ id: number; slug: string; name: string }>;
    const { data: mechanicsRows, error: mechErr } = await supabase
      .from("swing_mechanic")
      .select("slug, name");
    if (mechErr) {
      await supabase.from("swing_capture").update({ status: "failed" }).eq("id", capture_id);
      return json({ error: "db_error", detail: "swing_mechanic: " + mechErr.message }, 500);
    }
    const allowedMechanics = (mechanicsRows ?? []) as Array<{ slug: string; name: string }>;

    // 6) Build prompt (strict JSON output) with allowed slugs so model uses only DB terms
    const poseSummary = capture.pose_summary ?? {};
    const prompt = buildPrompt({
      poseSummary,
      signedImages,
      allowedErrors,
      allowedMechanics,
    });

    // 7) Call OpenAI (Responses API; vision)
    const model = ANALYSIS_CONFIG.model;
    const openaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              ...signedImages.map((img) => ({
                type: "input_image",
                image_url: img.url,
              })),
            ],
          },
        ],
        // Force JSON (Responses API: format lives under text)
        text: { format: { type: "json_object" } },
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      await supabase.from("swing_capture").update({ status: "failed" }).eq("id", capture_id);
      return json({ error: "openai_failed", detail: errText }, 500);
    }

    const openaiJson = await openaiRes.json();
    const rawText = extractResponseText(openaiJson);

    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      await supabase.from("swing_capture").update({ status: "failed" }).eq("id", capture_id);
      return json({ error: "invalid_model_json", rawText }, 500);
    }

    // 8) Restrict to DB slugs only — never persist keys that don't exist in swing_error / swing_mechanic
    const allowedErrorSlugs = new Set(allowedErrors.map((e) => e.slug));
    const allowedMechanicSlugs = new Set(allowedMechanics.map((m) => m.slug));
    const rawIssueScores = parsed.issue_scores ?? {};
    const rawMechanicScores = parsed.mechanic_scores ?? {};
    const issue_scores: Record<string, number> = {};
    for (const [key, val] of Object.entries(rawIssueScores)) {
      if (allowedErrorSlugs.has(key) && typeof val === "number") issue_scores[key] = val;
    }
    const mechanic_scores: Record<string, number> = {};
    for (const [key, val] of Object.entries(rawMechanicScores)) {
      if (allowedMechanicSlugs.has(key) && typeof val === "number") mechanic_scores[key] = val;
    }

    // 8b) Restrict recommended_lesson_ids and recommended_drill_ids to real rows tied to diagnosed issues
    const diagnosedErrorIds = allowedErrors
      .filter((e) => Object.prototype.hasOwnProperty.call(issue_scores, e.slug))
      .map((e) => e.id);
    let validLessonIds: number[] = [];
    let validDrillIds: number[] = [];
    if (diagnosedErrorIds.length > 0) {
      const { data: lessonRows } = await supabase
        .from("lesson")
        .select("id")
        .in("primary_error_id", diagnosedErrorIds);
      validLessonIds = (lessonRows ?? []).map((r: { id: number }) => r.id);
      const { data: drillErrorRows } = await supabase
        .from("drill_error")
        .select("drill_id")
        .in("error_id", diagnosedErrorIds);
      validDrillIds = [...new Set((drillErrorRows ?? []).map((r: { drill_id: number }) => r.drill_id))];
    }
    const rawLessonIds = Array.isArray(parsed.recommended_lesson_ids) ? parsed.recommended_lesson_ids : [];
    const rawDrillIds = Array.isArray(parsed.recommended_drill_ids) ? parsed.recommended_drill_ids : [];
    const toNum = (x: unknown) => (typeof x === "number" ? x : typeof x === "string" ? parseInt(x, 10) : NaN);
    const recommended_lesson_ids = rawLessonIds
      .map(toNum)
      .filter((n) => !Number.isNaN(n) && validLessonIds.includes(n));
    const recommended_drill_ids = rawDrillIds
      .map(toNum)
      .filter((n) => !Number.isNaN(n) && validDrillIds.includes(n));

    // 9) Persist swing_analysis with full versioning
    const club_angle_refs = parsed.club_angle_refs ?? {};
    const overall_confidence = parsed.confidence ?? null;
    const rawIssueConfidence = parsed.issue_confidence ?? {};
    const issue_confidence: Record<string, number> = {};
    for (const [key, val] of Object.entries(rawIssueConfidence)) {
      if (allowedErrorSlugs.has(key) && typeof val === "number") issue_confidence[key] = val;
    }

    const { error: insErr } = await supabase.from("swing_analysis").insert({
      capture_id,
      user_id: userRes.user.id,
      // Versioning fields for reproducibility
      model: ANALYSIS_CONFIG.model,
      prompt_version: ANALYSIS_CONFIG.prompt_version,
      schema_version: ANALYSIS_CONFIG.schema_version,
      input_fingerprint: inputFingerprint,
      // Analysis results
      raw_json: parsed,
      issue_scores,
      issue_confidence,  // Per-issue confidence scores
      mechanic_scores,
      club_angle_refs,
      overall_confidence,
      recommended_lesson_ids,
      recommended_drill_ids,
    });

    if (insErr) {
      await supabase.from("swing_capture").update({ status: "failed" }).eq("id", capture_id);
      return json({ error: "db_insert_failed", detail: insErr }, 500);
    }

    // 10) Update skill vector via RPC
    const { error: rpcErr } = await supabase.rpc("apply_swing_issue_update", {
      p_capture_id: capture_id,
      p_issue_scores: issue_scores,
    });

    if (rpcErr) {
      await supabase.from("swing_capture").update({ status: "failed" }).eq("id", capture_id);
      return json({ error: "rpc_failed", detail: rpcErr }, 500);
    }

    // 11) Done
    await supabase.from("swing_capture").update({ status: "analyzed" }).eq("id", capture_id);

    // 12) [DEPRECATED fallback] Populate legacy lesson queue so daily-plan can still serve
    //     users who have no unit assignments yet (pre-migration swings).
    //     Remove once all active users have been migrated to the unit-based plan.
    const { error: planErr } = await supabase.rpc("build_curriculum_queue", {
      p_capture_id: capture_id,
    });
    if (planErr) {
      console.error("[swing-analysis] build_curriculum_queue failed:", planErr);
      // Do NOT fail the whole request; analysis is still valuable
    }

    // 12b) Populate unit-based plan — authoritative source for MyPlanScreen and daily-plan.
    //      Assigns corrective curriculum_units (via swing_error -> curriculum_unit.primary_error_id)
    //      and all foundation units. Writes user_curriculum_unit + user_curriculum_unit_item.
    const { error: unitPlanErr } = await supabase.rpc("build_user_curriculum", {
      p_capture_id: capture_id,
    });
    if (unitPlanErr) {
      console.error("[swing-analysis] build_user_curriculum failed:", unitPlanErr);
      // Do NOT fail the whole request
    }

    // 13) Swing DNA: compute raw 6 dimensions + overall from mechanic_scores + pose_summary, then update profile (history-aware)
    const rawDna = computeRawSwingDna(mechanic_scores, poseSummary);
    const { error: dnaErr } = await supabase.rpc("apply_swing_dna_update", {
      p_user_id: userRes.user.id,
      p_capture_id: capture_id,
      p_raw_overall: rawDna.overall,
      p_raw_tempo: rawDna.tempo,
      p_raw_speed: rawDna.speed,
      p_raw_plane: rawDna.plane,
      p_raw_rotation: rawDna.rotation,
      p_raw_balance: rawDna.balance,
      p_raw_power: rawDna.power,
    });
    if (dnaErr) {
      console.error("[swing-analysis] apply_swing_dna_update failed:", dnaErr);
      // Do NOT fail the whole request
    }

    return json({ ok: true, capture_id, analysis: parsed });
  } catch (e) {
    try {
      if (failedCaptureId != null) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (serviceRoleKey) {
          const admin = createClient(supabaseUrl, serviceRoleKey);
          await admin.from("swing_capture").update({ status: "failed" }).eq("id", failedCaptureId);
        }
      }
    } catch {
      // best-effort status update
    }
    return json({ error: "unexpected", detail: String(e) }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function extractResponseText(responsesApiPayload: any): string {
  // Responses API returns output[].content[].text in various shapes; handle robustly
  const out = responsesApiPayload?.output ?? [];
  for (const item of out) {
    const content = item?.content ?? [];
    for (const c of content) {
      if (c?.type === "output_text" && typeof c?.text === "string") return c.text;
      if (typeof c?.text === "string") return c.text;
    }
  }
  // fallback
  const t = responsesApiPayload?.output_text;
  if (typeof t === "string") return t;
  throw new Error("Could not extract model text from OpenAI response");
}

/** Compute raw Swing DNA (0-100) from mechanic_scores and pose_summary for this swing. */
function computeRawSwingDna(
  mechanicScores: Record<string, number>,
  poseSummary: any
): { overall: number; tempo: number; speed: number; plane: number; rotation: number; balance: number; power: number } {
  const toPct = (v: number | undefined) => Math.round(Math.min(100, Math.max(0, (v ?? 0.5) * 100)));
  const avg = (...vals: (number | undefined)[]) => {
    const filtered = vals.filter((x) => typeof x === "number");
    if (filtered.length === 0) return 50;
    return Math.round(
      Math.min(100, Math.max(0, (filtered.reduce((a, b) => a + b!, 0) / filtered.length) * 100))
    );
  };
  // Mechanic slugs from DB (hyphenated)
  const m = mechanicScores;
  const rotation = avg(m["hip-rotation"], m["shoulder-turn"]);
  const plane = avg(m["swing-path"], m["face-control"]);
  const balance = avg(m["stance-width"], m["weight-shift-back"], m["weight-shift-forward"]);
  const power = avg(m["weight-shift-forward"], m["shoulder-turn"]);
  // Tempo from pose (backswing:downswing ratio; ideal ~3)
  const swingTempo = typeof poseSummary?.swing_tempo === "number" ? poseSummary.swing_tempo : null;
  const tempo =
    swingTempo != null
      ? Math.round(Math.min(100, Math.max(0, 50 + (swingTempo - 2) * 25)))
      : 50;
  // Speed: no direct mechanic; use power as proxy
  const speed = power;
  const overall = Math.round(
    (tempo + speed + plane + rotation + balance + power) / 6
  );
  return {
    overall,
    tempo,
    speed,
    plane,
    rotation,
    balance,
    power,
  };
}

function buildPrompt(args: {
  poseSummary: any;
  signedImages: Array<{ phase: string; url: string; kind: string }>;
  allowedErrors: Array<{ slug: string; name: string }>;
  allowedMechanics: Array<{ slug: string; name: string }>;
}) {
  const phaseList = args.signedImages.map((x) => `${x.phase}:${x.kind}`).join(", ");
  const issueSlugList = args.allowedErrors.length
    ? args.allowedErrors.map((e) => `${e.slug} (${e.name})`).join(", ")
    : "(none in DB)";
  const mechanicSlugList = args.allowedMechanics.length
    ? args.allowedMechanics.map((m) => `${m.slug} (${m.name})`).join(", ")
    : "(none in DB)";
  return `
You are a golf swing coach + analyst. You will be given keyframe images and pose overlays for a single swing.
You MUST output exactly one JSON object and nothing else.

Context:
- Images represent phases (some may repeat): ${phaseList}
- pose_summary (derived from MediaPipe Pose): ${JSON.stringify(args.poseSummary)}

ALLOWED SLUGS (you MUST use only these exact strings as object keys):
- For issue_scores and issue_confidence, use ONLY these issue slugs: ${issueSlugList}
- For mechanic_scores, use ONLY these mechanic slugs: ${mechanicSlugList}
Do not invent any other slugs. If you see an issue that matches one of the above, use its slug exactly. If you see something that does not match any listed issue/mechanic, do not include it.

Task:
1) Identify likely swing issues using the provided images + pose_summary. For each issue you report, use exactly one of the allowed issue slugs above.
2) Output severity 0..1 for each in issue_scores (only keys from the allowed issue list).
3) For each issue, provide issue_confidence 0..1 (same keys as issue_scores).
4) For mechanics you can assess, use only the allowed mechanic slugs in mechanic_scores (0..1).
5) recommended_lesson_ids and recommended_drill_ids: use real lesson.id and drill.id values that target the issues you reported (lessons by primary_error_id, drills by drill_error). If you don't know exact IDs, return empty arrays; the server only persists IDs that exist and match the diagnosed issues.
6) Provide club_angle_refs as weak reference signals only (0..1 or -1..1).
7) Provide short coach_notes for UI.

OUTPUT JSON SCHEMA (exact keys):
{
  "confidence": number,
  "issue_scores": { [issue_slug: string]: number },
  "issue_confidence": { [issue_slug: string]: number },
  "mechanic_scores": { [mechanic_slug: string]: number },
  "club_angle_refs": { [name: string]: number },
  "recommended_drill_ids": number[],
  "recommended_lesson_ids": number[],
  "coach_notes": string
}

Rules:
- Do NOT output prose outside JSON.
- issue_scores and issue_confidence keys MUST be exactly one of: ${args.allowedErrors.map((e) => e.slug).join(", ") || "none"}.
- mechanic_scores keys MUST be exactly one of: ${args.allowedMechanics.map((m) => m.slug).join(", ") || "none"}.
- Keep issue_scores to the top ~3-6 issues you actually see from the allowed list.
- If uncertain, set issue_confidence lower or omit that issue.
`.trim();
}

/**
 * Build a fingerprint of the input data for reproducibility tracking.
 * This allows us to know exactly what inputs produced a given analysis.
 */
function buildInputFingerprint(args: {
  frameIds: number[];
  framePaths: string[];
  overlayPaths: string[];
  poseSummary: any;
  poseExtractorVersion: string;
}): string {
  // Create a deterministic string representation
  const data = {
    frames: args.frameIds.sort(),
    frame_paths: args.framePaths.sort(),
    overlay_paths: args.overlayPaths.sort(),
    pose_hash: simpleHash(JSON.stringify(args.poseSummary ?? {})),
    pose_extractor: args.poseExtractorVersion,
  };
  return simpleHash(JSON.stringify(data));
}

/**
 * Simple hash function for fingerprinting (not cryptographic).
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to hex and pad
  return Math.abs(hash).toString(16).padStart(8, '0');
}
