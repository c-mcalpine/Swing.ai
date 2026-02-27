// supabase/functions/weekly-tier-rollover/index.ts
// @ts-nocheck - Deno Edge Function - types are provided at runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function lastWeekStartUtcMondayISO(): string {
  const now = new Date();

  // Find this week's Monday 00:00:00 UTC
  const day = now.getUTCDay(); // 0=Sun..6=Sat
  const daysSinceMonday = (day + 6) % 7; // Mon=0
  const thisMonday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  thisMonday.setUTCDate(thisMonday.getUTCDate() - daysSinceMonday);

  // Last week's Monday 00:00:00 UTC
  const lastMonday = new Date(thisMonday.getTime() - 7 * 24 * 60 * 60 * 1000);
  return lastMonday.toISOString(); // e.g. 2026-02-23T00:00:00.000Z
}

Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const weekStart = lastWeekStartUtcMondayISO();

  // Optional: if you keep the repair RPC, you can rebuild totals first
  // await supabase.rpc("recompute_weekly_xp_user", { p_week_start: weekStart });

  const { error } = await supabase.rpc("run_tier_rollover", {
    p_week_start: weekStart,
    p_min_tier_size: 20, // if you used this arg
  });

  if (error) {
    return new Response(JSON.stringify({ ok: false, error }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, weekStart }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
});