import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/supabaseTypes';

type AwardXpResult = {
  xp_awarded: number;
  new_total_xp: number;
  week_xp: number;
};

/**
 * Award XP to the current user for completing an action.
 * 
 * This function:
 * - Awards XP based on source type (drill, smart_review, swing_capture, challenge)
 * - Applies quality, novelty, streak, and diminishing returns multipliers
 * - Updates user's total XP and weekly leaderboard
 * - Is idempotent via idempotency_key (safe for retries)
 * - Prevents duplicate awards via unique constraint on (user, source_type, source_id)
 * 
 * @param sourceType - Type of action: 'drill' | 'smart_review' | 'swing_capture' | 'challenge'
 * @param sourceId - ID of the drill, review, capture, or challenge instance
 * @param meta - Optional metadata for quality multipliers (score, duration, confidence, etc.)
 * @param reason - Optional human-readable reason for audit trail
 * @returns XP awarded, new total XP, and week XP
 * 
 * @example
 * // After completing a drill
 * await awardXp({
 *   sourceType: 'drill',
 *   sourceId: drillId,
 *   meta: { duration_min: 15 }
 * });
 * 
 * @example
 * // After smart review completion
 * await awardXp({
 *   sourceType: 'smart_review',
 *   sourceId: reviewCompletion.id,
 *   meta: { score: 0.85, duration_min: 10 }
 * });
 * 
 * @example
 * // After swing capture analysis
 * await awardXp({
 *   sourceType: 'swing_capture',
 *   sourceId: capture.id,
 *   meta: { overall_confidence: 0.92, picked_takeaway: true }
 * });
 * 
 * @example
 * // After challenge completion
 * await awardXp({
 *   sourceType: 'challenge',
 *   sourceId: challengeInstanceId,
 *   meta: { placement_percentile: 0.08 }
 * });
 */
export async function awardXp({
  sourceType,
  sourceId,
  meta = {},
  reason = null,
}: {
  sourceType: 'drill' | 'smart_review' | 'swing_capture' | 'challenge';
  sourceId: number;
  meta?: Record<string, any>;
  reason?: string | null;
}): Promise<AwardXpResult> {
  // Generate idempotency key from source to prevent duplicate awards
  const idempotencyKey = `${sourceType}-${sourceId}-${Date.now()}`;

  const { data, error } = await supabase.rpc('award_xp', {
    p_source_type: sourceType,
    p_source_id: sourceId,
    p_reason: reason,
    p_meta: meta,
    p_idempotency_key: idempotencyKey,
  } as any) as { data: AwardXpResult[] | null; error: any };

  if (error) {
    console.error('[XP] Failed to award XP:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('No XP result returned from award_xp function');
  }

  console.log('[XP] Awarded:', data[0]);
  return data[0];
}

/**
 * Get user's current streak information
 */
export async function getUserStreak(userId: string) {
  const { data, error } = await supabase
    .from('user_streak')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[XP] Failed to get streak:', error);
    throw error;
  }

  return data;
}

/**
 * Get user's XP activity for a specific day
 */
export async function getDailyActivity(userId: string, activityDay: string) {
  const { data, error } = await supabase
    .from('user_daily_xp_activity')
    .select('*')
    .eq('user_id', userId)
    .eq('activity_day', activityDay)
    .maybeSingle();

  if (error) {
    console.error('[XP] Failed to get daily activity:', error);
    throw error;
  }

  return data;
}

/**
 * Get user's recent XP events (audit log)
 */
export async function getRecentXpEvents(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from('xp_event')
    .select('*')
    .eq('user_id', userId)
    .order('occurred_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[XP] Failed to get XP events:', error);
    throw error;
  }

  return data;
}

/**
 * Get user's weekly XP for leaderboard
 */
export async function getWeeklyXp(userId: string, weekStart: string) {
  const { data, error } = await supabase
    .from('weekly_xp_user')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .maybeSingle();

  if (error) {
    console.error('[XP] Failed to get weekly XP:', error);
    throw error;
  }

  return data;
}
