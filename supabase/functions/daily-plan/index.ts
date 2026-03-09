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

    // ── Strategy ──────────────────────────────────────────────────────────────
    // 1. Try the unit-based path (user_curriculum_unit + user_curriculum_unit_item).
    //    This is the new authoritative source after build_user_curriculum runs.
    // 2. If no active unit exists (user hasn't recorded a swing since the migration),
    //    fall back to the legacy user_curriculum_queue path.
    // ─────────────────────────────────────────────────────────────────────────

    let activeLesson: { id: number; title: string; summary?: string | null; issue_slug?: string | null } | null = null;
    const items: DailyPlanItem[] = [];
    let issueSlug: string | null = null;

    // ── 1) Try unit-based path ────────────────────────────────────────────────
    const { data: activeUnitRow } = await supabase
      .from("user_curriculum_unit")
      .select("unit_id, curriculum_unit:unit_id(id, title, unit_type, primary_error_id)")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    const activeUnit = activeUnitRow?.curriculum_unit ?? null;
    const activeUnitId: number | null = activeUnit?.id ?? null;

    if (activeUnitId != null) {
      // Resolve issue_slug for corrective units
      if (activeUnit.primary_error_id) {
        const { data: errRow } = await supabase
          .from("swing_error")
          .select("slug")
          .eq("id", activeUnit.primary_error_id)
          .maybeSingle();
        issueSlug = errRow?.slug ?? null;
      }

      // Load all items in the unit ordered by item_order
      const { data: unitItems, error: itemsErr } = await supabase
        .from("curriculum_unit_item_resolved")
        .select("id, item_order, item_type, resolved_lesson_id, resolved_drill_id, resolved_cue_id, content_title, content_slug")
        .eq("unit_id", activeUnitId)
        .order("item_order", { ascending: true });

      if (itemsErr) return json({ error: "db_error", detail: itemsErr.message }, 500);

      const allUnitItems = unitItems ?? [];
      const unitItemIds = allUnitItems.map((r: any) => r.id as number);

      // Load user progress for these items
      const { data: progressRows } = unitItemIds.length > 0
        ? await supabase
            .from("user_curriculum_unit_item")
            .select("unit_item_id, status")
            .eq("user_id", userId)
            .in("unit_item_id", unitItemIds)
        : { data: [] };

      const completedSet = new Set<number>(
        (progressRows ?? [])
          .filter((p: any) => p.status === "completed")
          .map((p: any) => p.unit_item_id as number)
      );

      // --- Active lesson: first incomplete lesson in the unit ---
      const nextLessonItem = allUnitItems.find(
        (item: any) => item.item_type === "lesson" && !completedSet.has(item.id)
      );

      if (nextLessonItem?.resolved_lesson_id) {
        const { data: lessonRow } = await supabase
          .from("lesson")
          .select("id, title, summary")
          .eq("id", nextLessonItem.resolved_lesson_id)
          .single();

        if (lessonRow) {
          activeLesson = {
            id: lessonRow.id,
            title: lessonRow.title,
            summary: lessonRow.summary,
            issue_slug: issueSlug,
          };
          if (includeLessons) {
            items.push({ type: "lesson", lesson_id: lessonRow.id, title: lessonRow.title, summary: lessonRow.summary });
          }
        }
      }

      // --- Drills: pull curated unit drills first, then supplement via drill_error ---
      if (maxDrills > 0) {
        const seenDrillIds = new Set<number>();

        // 1a) Curated drills from the unit (not completed, in curriculum order)
        const unitDrillItems = allUnitItems.filter(
          (item: any) => item.item_type === "drill" && !completedSet.has(item.id) && item.resolved_drill_id != null
        );

        for (const di of unitDrillItems) {
          if (items.filter((i) => i.type === "drill").length >= maxDrills) break;
          if (!seenDrillIds.has(di.resolved_drill_id)) {
            seenDrillIds.add(di.resolved_drill_id);
            items.push({
              type: "drill",
              drill_id: di.resolved_drill_id,
              name: di.content_title ?? "Drill",
              issue_slug: issueSlug,
              reason: issueSlug ? "Drill for your current corrective unit" : "Drill for your current training unit",
            });
          }
        }

        // 1b) Supplement with drill_error drills if unit is corrective and we still need more
        const drillsNeeded = maxDrills - items.filter((i) => i.type === "drill").length;
        if (drillsNeeded > 0 && issueSlug) {
          try {
            const errorId = await slugToErrorId(supabase, issueSlug);
            const { data: drillRows } = await supabase
              .from("drill_error")
              .select("drill_id, weight, drill:drill_id (id, name)")
              .eq("error_id", errorId)
              .order("weight", { ascending: false })
              .limit(drillsNeeded + 2);

            for (const r of drillRows ?? []) {
              if (items.filter((i) => i.type === "drill").length >= maxDrills) break;
              if (r?.drill?.id && !seenDrillIds.has(r.drill.id)) {
                seenDrillIds.add(r.drill.id);
                items.push({
                  type: "drill",
                  drill_id: r.drill.id,
                  name: r.drill.name,
                  issue_slug: issueSlug,
                  reason: "Daily practice for your current focus",
                });
              }
            }
          } catch (_) {
            // unknown slug — skip
          }
        }
      }

      // --- Cues: pull curated unit cues first, then supplement via cue_error ---
      if (maxCues > 0) {
        const seenCueIds = new Set<number>();

        // 2a) Curated cues from the unit (not completed, in curriculum order)
        const unitCueItems = allUnitItems.filter(
          (item: any) => item.item_type === "cue" && !completedSet.has(item.id) && item.resolved_cue_id != null
        );

        for (const ci of unitCueItems) {
          if (items.filter((i) => i.type === "cue").length >= maxCues) break;
          if (!seenCueIds.has(ci.resolved_cue_id)) {
            seenCueIds.add(ci.resolved_cue_id);
            // Fetch cue details (text, cue_type not in resolved view)
            const { data: cueRow } = await supabase
              .from("coaching_cue")
              .select("id, text, cue_type")
              .eq("id", ci.resolved_cue_id)
              .maybeSingle();

            if (cueRow) {
              items.push({
                type: "cue",
                cue_id: cueRow.id,
                text: cueRow.text,
                cue_type: cueRow.cue_type ?? null,
                issue_slug: issueSlug,
                reason: "Quick cue for today's focus",
              });
            }
          }
        }

        // 2b) Supplement with cue_error cues for corrective units
        const cuesNeeded = maxCues - items.filter((i) => i.type === "cue").length;
        if (cuesNeeded > 0 && issueSlug) {
          try {
            const errorId = await slugToErrorId(supabase, issueSlug);
            const { data: cueRows } = await supabase
              .from("cue_error")
              .select("cue_id, cue:cue_id (id, text, cue_type)")
              .eq("error_id", errorId)
              .limit(50);

            const extraCues = (cueRows ?? [])
              .map((r: any) => r.cue)
              .filter((c: any) => c && !seenCueIds.has(c.id)) as Array<{ id: number; text: string; cue_type?: string | null }>;

            const today = new Date().toISOString().slice(0, 10);
            const seed = hashString(`${userId}:${today}:${activeLesson?.id ?? "none"}`);
            const picked = pickCuesDeterministic(extraCues, cuesNeeded, seed);

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
          } catch (_) {
            // skip
          }
        }
      }
    } else {
      // ── 2) Legacy fallback: user_curriculum_queue ─────────────────────────
      //    Used when the user has no unit assignments yet (pre-migration swing).
      const { data: activeRows, error: activeErr } = await supabase
        .from("user_curriculum_queue")
        .select("lesson_id, issue_slug, queue_rank, status")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("queue_rank", { ascending: true })
        .limit(1);

      if (activeErr) return json({ error: "db_error", detail: activeErr.message }, 500);

      const active = activeRows?.[0] ?? null;

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
        issueSlug = active.issue_slug ?? null;

        if (includeLessons) {
          items.push({ type: "lesson", lesson_id: lessonRow.id, title: lessonRow.title, summary: lessonRow.summary });
        }
      }

      // Quick Drills from issue slugs in the legacy queue
      if (maxDrills > 0) {
        const { data: queueRows } = await supabase
          .from("user_curriculum_queue")
          .select("issue_slug")
          .eq("user_id", userId)
          .in("status", ["active", "queued"])
          .order("queue_rank", { ascending: true })
          .limit(8);

        const issueSlugs = [...new Set((queueRows ?? []).map((r: any) => r.issue_slug).filter(Boolean))] as string[];
        const seenDrillIds = new Set<number>();
        const drillsToAdd: { drill_id: number; name: string; issue_slug: string; reason: string }[] = [];

        for (const slug of issueSlugs) {
          if (drillsToAdd.length >= maxDrills) break;
          try {
            const errorId = await slugToErrorId(supabase, slug);
            const perIssue = Math.max(1, Math.ceil(maxDrills / Math.max(1, issueSlugs.length)));
            const { data: drillRows } = await supabase
              .from("drill_error")
              .select("drill_id, weight, drill:drill_id (id, name)")
              .eq("error_id", errorId)
              .order("weight", { ascending: false })
              .limit(perIssue + 2);

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

      // Cues from cue_error for the active issue
      if (issueSlug && maxCues > 0) {
        const errorId = await slugToErrorId(supabase, issueSlug);
        const { data: cueRows, error: cueErr } = await supabase
          .from("cue_error")
          .select("cue_id, cue:cue_id (id, text, cue_type)")
          .eq("error_id", errorId)
          .limit(50);

        if (cueErr) return json({ error: "db_error", detail: cueErr.message }, 500);

        const cues = (cueRows ?? []).map((r: any) => r.cue).filter(Boolean) as Array<{ id: number; text: string; cue_type?: string | null }>;
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
    }

    // ── 3) Build today summary ────────────────────────────────────────────────
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

  while (picked.length < n) {
    idx = (idx + 7) % 1000000;
    const c = cues[idx % cues.length];
    if (!picked.find((p) => p.id === c.id)) picked.push(c);
  }
  return picked;
}
