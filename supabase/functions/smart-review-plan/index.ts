// supabase/functions/smart-review-plan/index.ts
// @ts-nocheck - Deno Edge Function - types are provided at runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type PlanRequest = {
  budget_min?: number;
  environment?: string | null; // 'home'|'range'|'net' etc
  include_lessons?: boolean;
};

type PlanItem = {
  item_type: "drill" | "lesson";
  item_id: number;
  minutes: number;
  issue_slug: string | null;
  why: string;
  source: "due_review" | "issue_target" | "maintenance";
  due_at: string | null;
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function parseBudget(b?: number) {
  if (!b || Number.isNaN(b)) return 10;
  return clamp(Math.round(b), 5, 60);
}

Deno.serve(async (req) => {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });

    // Auth user
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const userId = authData.user.id;

    const body = (await req.json().catch(() => ({}))) as PlanRequest;
    const budgetMin = parseBudget(body.budget_min);
    const environment = body.environment ?? null;
    const includeLessons = body.include_lessons ?? true;

    const items: PlanItem[] = [];
    const chosen = new Set<string>(); // `${type}:${id}`
    let remaining = budgetMin;

    // Helper to add if room
    const addItem = (it: PlanItem) => {
      const key = `${it.item_type}:${it.item_id}`;
      if (chosen.has(key)) return false;
      if (it.minutes > remaining) return false;
      chosen.add(key);
      items.push(it);
      remaining -= it.minutes;
      return true;
    };

    // 1) Avoid recommending same item if done in last 24h
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentCompletions } = await supabase
      .from("review_completion")
      .select("item_type,item_id")
      .eq("user_id", userId)
      .gte("occurred_at", since24h);

    const recentlyDone = new Set<string>(
      (recentCompletions ?? []).map((r: any) => `${r.item_type}:${r.item_id}`)
    );

    // 2) Fetch due review items (oldest first)
    const { data: dueItems, error: dueErr } = await supabase
      .from("user_review_item")
      .select("item_type,item_id,issue_slug,due_at")
      .eq("user_id", userId)
      .eq("is_active", true)
      .lte("due_at", new Date().toISOString())
      .order("due_at", { ascending: true })
      .limit(6);

    if (dueErr) {
      return new Response(JSON.stringify({ error: dueErr.message }), { status: 400 });
    }

    // We'll need drill metadata (min_duration) for items we choose.
    // Preload drills and lessons for due candidates in a single batch.
    const dueDrillIds = (dueItems ?? []).filter((d: any) => d.item_type === "drill").map((d: any) => d.item_id);
    const dueLessonIds = (dueItems ?? []).filter((d: any) => d.item_type === "lesson").map((d: any) => d.item_id);

    const drillsById = new Map<number, any>();
    const lessonsById = new Map<number, any>();

    if (dueDrillIds.length) {
      let q = supabase.from("drill").select("id,min_duration_min,environment,name").in("id", dueDrillIds);
      if (environment) q = q.or(`environment.is.null,environment.eq.${environment}`);
      const { data } = await q;
      (data ?? []).forEach((d: any) => drillsById.set(d.id, d));
    }
    if (includeLessons && dueLessonIds.length) {
      const { data } = await supabase.from("lesson").select("id,duration_min,title").in("id", dueLessonIds);
      (data ?? []).forEach((l: any) => lessonsById.set(l.id, l));
    }

    // Add up to 2 due items (Speak-like: always some retention)
    for (const d of dueItems ?? []) {
      const key = `${d.item_type}:${d.item_id}`;
      if (recentlyDone.has(key)) continue;

      if (d.item_type === "drill") {
        const drill = drillsById.get(d.item_id);
        if (!drill) continue;
        const minutes = drill.min_duration_min ?? 8;
        addItem({
          item_type: "drill",
          item_id: d.item_id,
          minutes,
          issue_slug: d.issue_slug ?? null,
          why: "Review due today (spaced repetition).",
          source: "due_review",
          due_at: d.due_at ?? null,
        });
      } else if (includeLessons && d.item_type === "lesson") {
        const lesson = lessonsById.get(d.item_id);
        if (!lesson) continue;
        const minutes = lesson.duration_min ?? 10;
        addItem({
          item_type: "lesson",
          item_id: d.item_id,
          minutes,
          issue_slug: d.issue_slug ?? null,
          why: "Lesson review due today (spaced repetition).",
          source: "due_review",
          due_at: d.due_at ?? null,
        });
      }

      if (items.length >= 2) break;
    }

    // 3) Pull top issues (severity + evidence, not recently targeted)
    const { data: issues } = await supabase
      .from("user_issue_state")
      .select("issue_slug,severity,evidence_count,last_targeted_at,last_seen_at")
      .eq("user_id", userId)
      .order("severity", { ascending: false })
      .limit(6);

    // Filter issues: evidence_count >= 2 OR severity high
    const filteredIssues = (issues ?? []).filter((i: any) => {
      const sev = Number(i.severity ?? 0);
      const ev = Number(i.evidence_count ?? 0);
      return ev >= 2 || sev >= 0.7;
    });

    // Pick top issue not targeted in last 48h
    const since48h = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const topIssue = filteredIssues.find((i: any) => {
      if (!i.last_targeted_at) return true;
      return new Date(i.last_targeted_at) < since48h;
    });

    // 4) Choose best drill for that issue via drill_error weights
    if (topIssue && remaining > 0) {
      // drill_error references swing_error(id), but you have issue_slug. Need swing_error.id.
      const { data: errRow } = await supabase
        .from("swing_error")
        .select("id,slug")
        .eq("slug", topIssue.issue_slug)
        .maybeSingle();

      if (errRow?.id) {
        const { data: drillLinks } = await supabase
          .from("drill_error")
          .select("drill_id,weight,role")
          .eq("error_id", errRow.id)
          .order("weight", { ascending: false })
          .limit(10);

        const candidateDrillIds = (drillLinks ?? []).map((x: any) => x.drill_id);

        if (candidateDrillIds.length) {
          let q = supabase
            .from("drill")
            .select("id,min_duration_min,environment,name")
            .in("id", candidateDrillIds);

          if (environment) q = q.or(`environment.is.null,environment.eq.${environment}`);
          const { data: drills } = await q;

          // Pick first candidate that fits time and not recently done
          for (const d of drills ?? []) {
            const key = `drill:${d.id}`;
            if (recentlyDone.has(key)) continue;
            const minutes = d.min_duration_min ?? 10;
            const ok = addItem({
              item_type: "drill",
              item_id: d.id,
              minutes,
              issue_slug: topIssue.issue_slug,
              why: "Targets your highest-priority issue and hasn’t been targeted recently.",
              source: "issue_target",
              due_at: null,
            });
            if (ok) break;
          }
        }
      }
    }

    // 5) Maintenance item (optional): pull one long-interval item once/week
    // Only if we still have time and plan is short
    if (remaining >= 6 && items.length < 3) {
      const { data: maint } = await supabase
        .from("user_review_item")
        .select("item_type,item_id,issue_slug,due_at,interval_days")
        .eq("user_id", userId)
        .eq("is_active", true)
        .gte("interval_days", 14)
        .order("due_at", { ascending: true })
        .limit(5);

      for (const m of maint ?? []) {
        const key = `${m.item_type}:${m.item_id}`;
        if (recentlyDone.has(key)) continue;
        // Only pull if it hasn't been reviewed in a while (due in future but we "pull forward" weekly)
        // (This is lightweight; you can refine later.)
        if (m.item_type === "drill") {
          const { data: d } = await supabase.from("drill").select("id,min_duration_min,environment").eq("id", m.item_id).maybeSingle();
          if (!d) continue;
          if (environment && d.environment && d.environment !== environment) continue;

          const minutes = d.min_duration_min ?? 8;
          const ok = addItem({
            item_type: "drill",
            item_id: m.item_id,
            minutes,
            issue_slug: m.issue_slug ?? null,
            why: "Weekly maintenance review to keep progress from decaying.",
            source: "maintenance",
            due_at: m.due_at ?? null,
          });
          if (ok) break;
        }
      }
    }

    // Compute retention score from active review items
    const { data: activeItems } = await supabase
      .from("user_review_item")
      .select("last_score")
      .eq("user_id", userId)
      .eq("is_active", true)
      .not("last_score", "is", null);

    let retentionScore: number | null = null;
    if (activeItems && activeItems.length > 0) {
      const scores = activeItems.map((item: any) => Number(item.last_score ?? 0));
      const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      retentionScore = clamp(avgScore, 0, 1);
    }

    return new Response(
      JSON.stringify({
        generated_at: new Date().toISOString(),
        budget_min: budgetMin,
        environment,
        retention_score: retentionScore,
        items,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
