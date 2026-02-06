// supabase/functions/swing-analysis/index.ts
// @ts-nocheck - Deno Edge Function - types are provided at runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================
// VERSIONING CONSTANTS - Update these when you change the analysis
// ============================================
const ANALYSIS_CONFIG = {
  model: "gpt-5-mini",           // OpenAI model
  prompt_version: "1",             // Bump when prompt changes
  schema_version: "1",             // Bump when output schema changes  
  pose_extractor_version: "mediapipe-pose-lite-1.0",  // Client-side pose extraction version
} as const;

type ReqBody = { capture_id: number };

Deno.serve(async (req) => {
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
    const KEY_PHASES = ["address", "top", "impact", "follow_through"];
    const keyFrames = frames.filter((f: any) => KEY_PHASES.includes(f.phase));
    
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

    // 5) Build prompt (strict JSON output)
    const poseSummary = capture.pose_summary ?? {};
    const prompt = buildPrompt({ poseSummary, signedImages });

    // 6) Call OpenAI (Responses API; vision)
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
        // Force JSON (the model should return a single JSON object)
        response_format: { type: "json_object" },
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

    // 7) Persist swing_analysis with full versioning
    const issue_scores = parsed.issue_scores ?? {};
    const mechanic_scores = parsed.mechanic_scores ?? {};
    const club_angle_refs = parsed.club_angle_refs ?? {};
    const recommended_lesson_ids = parsed.recommended_lesson_ids ?? null;
    const recommended_drill_ids = parsed.recommended_drill_ids ?? null;
    const overall_confidence = parsed.confidence ?? null;
    const issue_confidence = parsed.issue_confidence ?? {};

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

    // 7) Update skill vector via RPC
    const { error: rpcErr } = await supabase.rpc("apply_swing_issue_update", {
      p_capture_id: capture_id,
      p_issue_scores: issue_scores,
    });

    if (rpcErr) {
      await supabase.from("swing_capture").update({ status: "failed" }).eq("id", capture_id);
      return json({ error: "rpc_failed", detail: rpcErr }, 500);
    }

    // 8) Done
    await supabase.from("swing_capture").update({ status: "analyzed" }).eq("id", capture_id);

    return json({ ok: true, capture_id, analysis: parsed });
  } catch (e) {
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

function buildPrompt(args: { poseSummary: any; signedImages: Array<{ phase: string; url: string; kind: string }> }) {
  // Keep this tight. The model MUST output exactly one JSON object.
  // IMPORTANT: issue_scores keys must match swing_error.slug values in your DB.
  const phaseList = args.signedImages.map((x) => `${x.phase}:${x.kind}`).join(", ");
  return `
You are a golf swing coach + analyst. You will be given keyframe images and pose overlays for a single swing.
You MUST output exactly one JSON object and nothing else.

Context:
- Images represent phases (some may repeat): ${phaseList}
- pose_summary (derived from MediaPipe Pose): ${JSON.stringify(args.poseSummary)}

Task:
1) Identify likely swing issues using the provided images + pose_summary.
2) Output severity scores 0..1 for each issue in issue_scores.
3) For each issue, also provide a confidence score in issue_confidence (how sure you are about that issue).
4) Provide recommended_drill_ids and recommended_lesson_ids ONLY if confident; otherwise return empty arrays.
5) Provide club_angle_refs as weak reference signals only (0..1 or -1..1), not strict measurements.
6) Provide short coach_notes for UI.

OUTPUT JSON SCHEMA (exact keys):
{
  "confidence": number,                     // overall analysis confidence 0..1
  "issue_scores": { [issue_slug: string]: number },   // severity 0..1; keys should match your swing_error.slug set
  "issue_confidence": { [issue_slug: string]: number }, // per-issue confidence 0..1 (same keys as issue_scores)
  "mechanic_scores": { [mechanic_slug: string]: number }, // optional 0..1
  "club_angle_refs": { [name: string]: number },      // weak signals only
  "recommended_drill_ids": number[],        // drill.id values
  "recommended_lesson_ids": number[],       // lesson.id values
  "coach_notes": string
}

Rules:
- Do NOT output prose outside JSON.
- Keep issue_scores limited to the top ~3-6 issues you actually see.
- If uncertain about an issue, set its issue_confidence value lower.
- If overall uncertain, lower confidence and keep recommendations empty arrays.
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
