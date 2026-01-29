import { supabase } from '../lib/supabaseClient';
import type { Database } from '../lib/supabaseTypes';

type LeaderboardRow = Database['public']['Views']['weekly_xp_leaderboard']['Row'];

/**
 * Fetches the weekly XP leaderboard from the Supabase view.
 * 
 * @param limit - Number of top users to fetch (default: 50)
 * @returns Promise<LeaderboardRow[]>
 * @throws Error if the query fails
 */
export async function fetchWeeklyLeaderboard(limit: number = 50): Promise<LeaderboardRow[]> {
  console.log('[fetchWeeklyLeaderboard] Fetching leaderboard, limit:', limit);
  
  const { data, error } = await supabase
    .from('weekly_xp_leaderboard')
    .select('*')
    .order('rank_week', { ascending: true })
    .limit(limit);

  console.log('[fetchWeeklyLeaderboard] data:', data?.length, 'rows');
  console.log('[fetchWeeklyLeaderboard] error:', error);

  if (error) {
    console.error('[fetchWeeklyLeaderboard] Database error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    throw error;
  }

  return data || [];
}

/**
 * Fetches a specific user's rank from the leaderboard.
 * 
 * @param userId - The user's ID
 * @returns Promise<LeaderboardRow | null>
 * @throws Error if the query fails
 */
export async function fetchMyWeeklyRank(userId: string): Promise<LeaderboardRow | null> {
  console.log('[fetchMyWeeklyRank] Fetching rank for user:', userId);
  
  const { data, error } = await supabase
    .from('weekly_xp_leaderboard')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  console.log('[fetchMyWeeklyRank] data:', data);
  console.log('[fetchMyWeeklyRank] error:', error);

  if (error) {
    console.error('[fetchMyWeeklyRank] Database error:', error);
    throw error;
  }

  return data;
}

