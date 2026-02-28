// supabase/functions/daily-plan/index.ts
// @ts-nocheck - Deno Edge Function - types are provided at runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type DailyPlanItem =
  | { type: "lesson"; lesson_id: number; title: string; summary?: string | null }
  | { type: "drill"; drill_id: number; name: string; issue_slug?: string | null; reason: string }
  | { type: "cue"; cue_id: number; text: string; cue_type?: string | null; issue_slug?: string | null; reason: string };

function json(res: unknown, status = 200) {
  return new Response(JSON.stringify(res), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getAuthHeader(req: Request) {
  return req.headers.get("Authorization") ?? "";
}

Deno.serve(async (req) => {
  try {
    const authHeader = getAuthHeader(req);
    if (!authHeader) return json({ error: "missing_auth" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "unauthorized" }, 401);
    const userId = userData.user.id;

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const includeLessons = body.include_lessons ?? true;
    const maxDrills = body.max_drills ?? 5;
    const maxCues = body.max_cues ?? 2;

    // 1) Get active lesson (chapter anchor)
    const { data: activeRows, error: activeErr } = await supabase
      .from("user_curriculum_queue")
      .select("lesson_id, issue_slug, queue_rank, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("queue_rank", { ascending: true })
      .limit(1);

    if (activeErr) return json({ error: "db_error", detail: activeErr.message }, 500);

    const active = activeRows?.[0] ?? null;

    let activeLesson: { id: number; title: string; summary?: string | null; issue_slug?: string | null } | null = null;
    const items: DailyPlanItem[] = [];

    if (active?.lesson_id) {
      const { data: lessonRow, error: lessonErr } = await supabase
        .from("lesson")
        .select("id, title, summary, primary_error_id")
        .eq("id", active.lesson_id)
        .single();

      if (lessonErr) return json({ error: "db_error", detail: lessonErr.message }, 500);

      activeLesson = {
        id: lessonRow.id,
        title: lessonRow.title,
        summary: lessonRow.summary,
        issue_slug: active.issue_slug ?? null,
      };

      if (includeLessons) {
        items.push({ type: "lesson", lesson_id: lessonRow.id, title: lessonRow.title, summary: lessonRow.summary });
      }
    }

    const issueSlug = activeLesson?.issue_slug ?? null;

    // 2) Quick Drills: map from all diagnosed issues (user_curriculum_queue) to drill_error -> drills
    if (maxDrills > 0) {
      const { data: queueRows, error: queueErr } = await supabase
        .from("user_curriculum_queue")
        .select("issue_slug")
        .eq("user_id", userId)
        .in("status", ["active", "queued"])
        .order("queue_rank", { ascending: true })
        .limit(8);

      if (queueErr) return json({ error: "db_error", detail: queueErr.message }, 500);

      const issueSlugs = [...new Set((queueRows ?? []).map((r) => r.issue_slug).filter(Boolean))] as string[];
      const seenDrillIds = new Set<number>();
      const drillsToAdd: { drill_id: number; name: string; issue_slug: string; reason: string }[] = [];

      for (const slug of issueSlugs) {
        if (drillsToAdd.length >= maxDrills) break;
        try {
          const errorId = await slugToErrorId(supabase, slug);
          const perIssue = Math.max(1, Math.ceil(maxDrills / Math.max(1, issueSlugs.length)));
          const { data: drillRows, error: drillErr } = await supabase
            .from("drill_error")
            .select("drill_id, weight, drill:drill_id (id, name)")
            .eq("error_id", errorId)
            .order("weight", { ascending: false })
            .limit(perIssue + 2);

          if (drillErr) continue;
          for (const r of drillRows ?? []) {
            if (r?.drill?.id && !seenDrillIds.has(r.drill.id)) {
              seenDrillIds.add(r.drill.id);
              drillsToAdd.push({
                drill_id: r.drill.id,
                name: r.drill.name,
                issue_slug: slug,
                reason: slug === issueSlug ? "Daily practice for your current chapter" : "Relevant to your swing focus",
              });
              if (drillsToAdd.length >= maxDrills) break;
            }
          }
        } catch (_) {
          // skip unknown slug
        }
      }

      for (const d of drillsToAdd) {
        items.push({ type: "drill", drill_id: d.drill_id, name: d.name, issue_slug: d.issue_slug, reason: d.reason });
      }
    }

    // 3) Add cues tied to issue (mix types if possible)
    if (issueSlug && maxCues > 0) {
      const errorId = await slugToErrorId(supabase, issueSlug);

      const { data: cueRows, error: cueErr } = await supabase
        .from("cue_error")
        .select("cue_id, cue:cue_id (id, text, cue_type)")
        .eq("error_id", errorId)
        .limit(50);

      if (cueErr) return json({ error: "db_error", detail: cueErr.message }, 500);

      const cues = (cueRows ?? [])
        .map((r: any) => r.cue)
        .filter(Boolean) as Array<{ id: number; text: string; cue_type?: string | null }>;

      // deterministic "daily" selection: stable per user per day
      const today = new Date().toISOString().slice(0, 10);
      const seed = hashString(`${userId}:${today}:${activeLesson?.id ?? "none"}`);
      const picked = pickCuesDeterministic(cues, maxCues, seed);

      for (const c of picked) {
        items.push({
          type: "cue",
          cue_id: c.id,
          text: c.text,
          cue_type: c.cue_type ?? null,
          issue_slug: issueSlug,
          reason: "Quick cue for today's focus",
        });
      }
    }

    // 4) Build today summary (lesson_id, drill_ids, cue_ids) from items
    const today = {
      lesson_id: activeLesson?.id ?? 0,
      drill_ids: items.filter((i) => i.type === "drill").map((i) => (i as { type: "drill"; drill_id: number }).drill_id),
      cue_ids: items.filter((i) => i.type === "cue").map((i) => (i as { type: "cue"; cue_id: number }).cue_id),
    };

    return json({
      ok: true,
      active_lesson: activeLesson,
      today,
      items,
    });
  } catch (e) {
    return json({ error: "server_error", detail: String(e?.message ?? e) }, 500);
  }
});

async function slugToErrorId(supabase: any, slug: string): Promise<number> {
  const { data, error } = await supabase.from("swing_error").select("id").eq("slug", slug).single();
  if (error) throw new Error(`Unknown issue_slug ${slug}: ${error.message}`);
  return data.id;
}

function hashString(s: string): number {
  // simple deterministic hash
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickCuesDeterministic(
  cues: Array<{ id: number; text: string; cue_type?: string | null }>,
  n: number,
  seed: number
) {
  if (cues.length <= n) return cues;

  // Prefer variety by cue_type: checkpoint, swing_thought, feel
  const byType: Record<string, any[]> = { checkpoint: [], swing_thought: [], feel: [], other: [] };
  for (const c of cues) {
    const t = c.cue_type ?? "other";
    (byType[t] ?? byType.other).push(c);
  }

  const order = ["checkpoint", "swing_thought", "feel", "other"];
  const picked: any[] = [];

  let idx = seed;
  for (const t of order) {
    if (picked.length >= n) break;
    const arr = byType[t] ?? [];
    if (arr.length === 0) continue;
    idx = (idx + 1) % 1000000;
    picked.push(arr[idx % arr.length]);
  }

  // Fill remaining slots with deterministic selection from all cues
  while (picked.length < n) {
    idx = (idx + 7) % 1000000;
    const c = cues[idx % cues.length];
    if (!picked.find((p) => p.id === c.id)) picked.push(c);
  }
  return picked;
}