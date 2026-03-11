// @ts-nocheck - Deno Edge Function - types are provided at runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type SubmitRequest = {
  item_type: "drill" | "lesson" | "cue";
  item_id: number;
  issue_slug?: string | null;
  score: number;           // 0..1
  duration_min?: number | null;
  /** "daily" = completed from home daily plan; "review" = completed from Smart Review tab */
  source?: "daily" | "review";
  client_event_id?: string | null;
};

const LESSON_COMPLETE_THRESHOLD = 0.8; // advance curriculum only when lesson + daily + score >= this; Smart Review must never advance

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function scoreToQ(score: number): number {
  if (score >= 0.9) return 5;
  if (score >= 0.75) return 4;
  if (score >= 0.6) return 3;
  if (score >= 0.4) return 2;
  return 1;
}

// SM-2-lite update
function updateSchedule(params: {
  interval_days: number;
  ease: number;
  success_streak: number;
  fail_count: number;
  reps: number;
  score: number;
}) {
  const now = new Date();
  const q = scoreToQ(params.score);

  let interval = params.interval_days;
  let ease = params.ease;
  let streak = params.success_streak;
  let fail = params.fail_count;
  let reps = params.reps + 1;

  if (q < 3) {
    fail += 1;
    streak = 0;
    interval = 1;
    ease = Math.max(1.3, ease - 0.2);
  } else {
    streak += 1;
    // SM-2 ease update
    const dq = 5 - q;
    ease = ease + (0.1 - dq * (0.08 + dq * 0.02));
    ease = clamp(ease, 1.3, 2.7);

    if (streak === 1) interval = 1;
    else if (streak === 2) interval = 3;
    else interval = Math.round(interval * ease);

    interval = clamp(interval, 1, 60);
  }

  const dueAt = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000).toISOString();
  return {
    interval_days: interval,
    ease,
    success_streak: streak,
    fail_count: fail,
    reps,
    due_at: dueAt,
    last_reviewed_at: now.toISOString(),
    last_score: params.score,
  };
}

Deno.serve(async (req) => {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const userId = authData.user.id;

    const body = (await req.json()) as SubmitRequest;
    const itemType = body.item_type;
    const itemId = body.item_id;
    const issueSlug = body.issue_slug ?? null;
    const score = clamp(Number(body.score ?? 0), 0, 1);
    const durationMin = body.duration_min ?? null;
    const source = body.source ?? "review";
    const clientEventId = body.client_event_id ?? null;

    // Generate semantic fingerprint for de-duplication (same completion intent)
    // Format: YYYY-MM-DD (one completion per day per item)
    const now = new Date();
    const dayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const completionFingerprint = dayStr; // Just the day - unique constraint handles user+item+day

    // Use database constraints + INSERT ... ON CONFLICT DO NOTHING for atomic idempotency
    // This prevents race conditions and is faster than application-level checks
    const insertData: any = {
      user_id: userId,
      item_type: itemType,
      item_id: itemId,
      issue_slug: issueSlug,
      score,
      duration_min: durationMin,
      completion_fingerprint: completionFingerprint,
    };

    if (clientEventId) {
      insertData.client_event_id = clientEventId;
    }

    // Use RPC function to handle ON CONFLICT atomically
    // This ensures database-level idempotency without race conditions
    const { data: completionResult, error: rpcErr } = await supabase.rpc(
      "upsert_review_completion",
      {
        p_user_id: userId,
        p_item_type: itemType,
        p_item_id: itemId,
        p_issue_slug: issueSlug,
        p_score: score,
        p_duration_min: durationMin,
        p_client_event_id: clientEventId,
        p_completion_fingerprint: completionFingerprint,
      }
    );

    if (rpcErr) {
      return new Response(JSON.stringify({ error: rpcErr.message }), { status: 400 });
    }

    // RPC returns array with one row: { id, occurred_at, is_new }
    const completionRow = Array.isArray(completionResult) && completionResult.length > 0
      ? completionResult[0]
      : completionResult;

    if (!completionRow || !completionRow.id) {
      // Should not happen, but handle gracefully
      return new Response(
        JSON.stringify({ error: "Failed to record completion" }),
        { status: 500 }
      );
    }

    const completion = {
      id: completionRow.id,
      occurred_at: completionRow.occurred_at,
    };

    // If not a new completion (is_new = false), return early (idempotent)
    if (completionRow.is_new === false) {
      return new Response(
        JSON.stringify({
          ok: true,
          completion_id: completion.id,
          next_schedule: null,
          xp_awarded: 0,
          message: "Completion already recorded",
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    // New completion - proceed with schedule updates

    // 3) Ensure review item exists (upsert) then update schedule
    const { data: existing } = await supabase
      .from("user_review_item")
      .select("id,interval_days,ease,success_streak,fail_count,reps")
      .eq("user_id", userId)
      .eq("item_type", itemType)
      .eq("item_id", itemId)
      .maybeSingle();

    let next: ReturnType<typeof updateSchedule> | null = null;

    if (!existing) {
      // First time: seed user_review_item. From daily plan, due tomorrow; from review, due now (already due).
      const nowMs = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;
      const firstDueAt =
        source === "daily"
          ? new Date(nowMs + oneDayMs).toISOString()
          : new Date(nowMs).toISOString();

      const { error: insErr } = await supabase
        .from("user_review_item")
        .insert({
          user_id: userId,
          item_type: itemType,
          item_id: itemId,
          issue_slug: issueSlug,
          interval_days: 1,
          ease: 2.2,
          reps: 0,
          success_streak: 0,
          fail_count: 0,
          due_at: firstDueAt,
          is_active: true,
        });

      if (insErr) {
        return new Response(JSON.stringify({ error: insErr.message }), { status: 400 });
      }
      next = {
        interval_days: 1,
        ease: 2.2,
        success_streak: 0,
        fail_count: 0,
        reps: 1,
        due_at: firstDueAt,
        last_reviewed_at: new Date().toISOString(),
        last_score: score,
      };
    } else {
      const base = existing;
      next = updateSchedule({
        interval_days: Number(base.interval_days ?? 1),
        ease: Number(base.ease ?? 2.2),
        success_streak: Number(base.success_streak ?? 0),
        fail_count: Number(base.fail_count ?? 0),
        reps: Number(base.reps ?? 0),
        score,
      });

      const { error: updErr } = await supabase
        .from("user_review_item")
        .update({
          ...next,
          issue_slug: issueSlug,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("item_type", itemType)
        .eq("item_id", itemId);

      if (updErr) {
        return new Response(JSON.stringify({ error: updErr.message }), { status: 400 });
      }
    }

    // 4) Advance chapter only when: lesson from daily plan (not Smart Review) with passing score
    if (
      itemType === "lesson" &&
      source === "daily" &&
      score >= LESSON_COMPLETE_THRESHOLD
    ) {
      const nowIso = new Date().toISOString();
      await supabase
        .from("user_curriculum_queue")
        .update({ status: "completed", completed_at: nowIso, updated_at: nowIso })
        .eq("user_id", userId)
        .eq("lesson_id", itemId);

      const { data: nextQueued } = await supabase
        .from("user_curriculum_queue")
        .select("lesson_id")
        .eq("user_id", userId)
        .eq("status", "queued")
        .order("queue_rank", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (nextQueued?.lesson_id) {
        await supabase
          .from("user_curriculum_queue")
          .update({ status: "active", activated_at: nowIso, updated_at: nowIso })
          .eq("user_id", userId)
          .eq("lesson_id", nextQueued.lesson_id);

        await supabase.from("user_lesson_progress").insert({
          user_id: userId,
          lesson_id: nextQueued.lesson_id,
          status: "in_progress",
          current_part: 1,
          total_parts: 1,
          updated_at: nowIso,
        });
        // Ignore duplicate if row already exists (e.g. from build_curriculum_queue)
      }
    }

    // 4b) Sync unit-based progress (user_curriculum_unit_item + user_curriculum_unit)
    //     Runs for all item types and sources so MyPlanScreen stays in sync.
    //     Only marks items completed when score meets the threshold (same bar as legacy queue for
    //     lessons; any non-zero submit counts as done for drills and cues).
    const unitSyncEligible =
      itemType === "lesson" ? score >= LESSON_COMPLETE_THRESHOLD : score > 0;

    if (unitSyncEligible) {
      try {
        const nowIsoUnit = new Date().toISOString();

        // Determine which FK column to filter on
        const itemFkColumn =
          itemType === "lesson" ? "lesson_id"
          : itemType === "drill" ? "drill_id"
          : "cue_id";

        // Find all curriculum_unit_item rows referencing this content item
        const { data: unitItemRows } = await supabase
          .from("curriculum_unit_item")
          .select("id, unit_id, is_required")
          .eq(itemFkColumn, itemId);

        if (unitItemRows && unitItemRows.length > 0) {
          // Group by unit so we only run one unit-completion check per unit
          const unitIds = [...new Set(unitItemRows.map((r: any) => r.unit_id as number))];

          // Mark matching user_curriculum_unit_item rows as completed (idempotent)
          const unitItemIds = unitItemRows.map((r: any) => r.id as number);
          await supabase
            .from("user_curriculum_unit_item")
            .update({ status: "completed", completed_at: nowIsoUnit, updated_at: nowIsoUnit, score })
            .eq("user_id", userId)
            .in("unit_item_id", unitItemIds)
            .neq("status", "completed");

          // For each affected unit, check if all required items are now completed
          for (const unitId of unitIds) {
            // Count total required items in this unit
            const { count: totalRequired } = await supabase
              .from("curriculum_unit_item")
              .select("id", { count: "exact", head: true })
              .eq("unit_id", unitId)
              .eq("is_required", true);

            if (!totalRequired || totalRequired === 0) continue;

            // Count completed required items for this user in this unit
            const { data: allRequiredItems } = await supabase
              .from("curriculum_unit_item")
              .select("id")
              .eq("unit_id", unitId)
              .eq("is_required", true);

            const requiredIds = (allRequiredItems ?? []).map((r: any) => r.id as number);

            const { count: completedRequired } = await supabase
              .from("user_curriculum_unit_item")
              .select("id", { count: "exact", head: true })
              .eq("user_id", userId)
              .in("unit_item_id", requiredIds)
              .eq("status", "completed");

            if (completedRequired !== null && completedRequired >= totalRequired) {
              // All required items done — mark unit completed
              await supabase
                .from("user_curriculum_unit")
                .update({ status: "completed", completed_at: nowIsoUnit, updated_at: nowIsoUnit })
                .eq("user_id", userId)
                .eq("unit_id", unitId)
                .neq("status", "completed");

              // Activate next queued unit (highest priority_score, then oldest created_at)
              const { data: nextUnit } = await supabase
                .from("user_curriculum_unit")
                .select("unit_id")
                .eq("user_id", userId)
                .eq("status", "queued")
                .order("priority_score", { ascending: false })
                .order("created_at", { ascending: true })
                .limit(1)
                .maybeSingle();

              if (nextUnit?.unit_id) {
                await supabase
                  .from("user_curriculum_unit")
                  .update({ status: "active", started_at: nowIsoUnit, updated_at: nowIsoUnit })
                  .eq("user_id", userId)
                  .eq("unit_id", nextUnit.unit_id);
              }
            }
          }
        }
      } catch (unitErr) {
        // Unit progress sync is non-critical; log but do not fail the response
        console.error("[submit-review-result] unit progress sync failed:", unitErr);
      }
    }

    // 5) If issue_slug present, update last_targeted_at
    if (issueSlug) {
      await supabase
        .from("user_issue_state")
        .update({ last_targeted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("issue_slug", issueSlug);
    }

    // 6) Deterministic XP award via canonical award_xp RPC (idempotent).
    // award_xp resolves item-type base XP (lesson=50, drill=20, cue=10),
    // applies quality/novelty/streak/diminishing multipliers, adds duration bonus,
    // and updates profiles.xp, weekly_xp_user, and user_streak atomically.
    const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const idempotencyKey =
      body.client_event_id
        ? `review:${userId}:${body.client_event_id}`
        : `review:${userId}:${itemType}:${itemId}:${completion.id}:${day}`;

    const { data: xpResult, error: xpError } = await supabase.rpc("award_xp", {
      p_source_type: "smart_review",
      p_source_id: completion.id,
      p_reason: `Smart Review (${itemType})`,
      p_meta: {
        item_type: itemType,
        score: body.score,
        duration_min: body.duration_min ?? null,
      },
      p_idempotency_key: idempotencyKey,
    });

    if (xpError) {
      console.error("[submit-review-result] award_xp RPC error:", xpError);
    }

    const xpAwarded: number = xpResult?.[0]?.xp_awarded ?? 0;

    // 7) Optional: add notification feed entry
    await supabase.from("user_review_event").insert({
      user_id: userId,
      title: "Smart Review complete",
      description: `+${xpAwarded} XP`,
      icon: "check_circle",
      color: "green",
      occurred_at: new Date().toISOString(),
      priority: 1,
      is_active: true,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        completion_id: completion.id,
        next_schedule: next,
        xp_awarded: xpAwarded,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
