import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabaseTypes';

export type TierLeaderboardRow = Database['public']['Functions']['get_tier_leaderboard']['Returns'][number];

/** Monday 00:00 UTC of the week containing the given date (or now). */
export function getCurrentWeekStartUTC(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

async function fetchTierLeaderboardRows(weekStart: string, limit: number): Promise<TierLeaderboardRow[]> {
  const { data, error } = await supabase.rpc('get_tier_leaderboard', {
    p_week_start: weekStart,
    p_limit: limit,
  });
  if (error) throw error;
  return (data ?? []) as TierLeaderboardRow[];
}

export interface TierLeaderboardData {
  weekStart: string;
  rows: TierLeaderboardRow[];
  tierName: string;
  myRow: TierLeaderboardRow | undefined;
}

/** Used by prefetch and useTierLeaderboard. Call ensure_user_tier_state then load tier leaderboard. */
export async function fetchTierLeaderboardData(limit: number = 50): Promise<TierLeaderboardData> {
  await supabase.rpc('ensure_user_tier_state');
  const weekStart = getCurrentWeekStartUTC();
  const rows = await fetchTierLeaderboardRows(weekStart, limit);
  const tierName = rows[0]?.tier_name ?? 'Tier';
  const myRow = rows.find((r) => r.is_me);
  return { weekStart, rows, tierName, myRow };
}

export function useTierLeaderboard(limit: number = 50) {
  return useQuery({
    queryKey: ['tierLeaderboard', limit],
    queryFn: () => fetchTierLeaderboardData(limit),
    staleTime: 60_000,
    gcTime: 30 * 60_000,
  });
}
