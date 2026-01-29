import { supabase } from '../lib/supabaseClient';
import type { Database } from '../lib/supabaseTypes';

type Profile = Database['public']['Tables']['profiles']['Row'];
type PracticeSession = Database['public']['Tables']['practice_session']['Row'];
type UserAchievement = Database['public']['Tables']['user_achievement']['Row'];
type Achievement = Database['public']['Tables']['achievement']['Row'];

export interface UserAchievementWithDetails extends UserAchievement {
  achievement: Achievement;
}

/**
 * Fetches a user's profile data including XP, level, rank, and scores.
 * 
 * @param userId - The user's ID
 * @returns Promise<Profile | null>
 * @throws Error if the query fails (RLS, permissions, etc.)
 */
export async function fetchUserProfile(userId: string): Promise<Profile | null> {
  console.log('[fetchUserProfile] userId:', userId);
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle(); // Use maybeSingle() instead of single() to avoid throwing on 0 rows

  console.log('[fetchUserProfile] data:', data);
  console.log('[fetchUserProfile] error:', error);
  const { data: sessionData } = await supabase.auth.getSession();
  console.log('[session]', sessionData.session?.user?.id ?? null);

  // If there's an error, throw it so the UI can show specific error message
  if (error) {
    console.error('[fetchUserProfile] Database error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    
    // Don't catch the error - let it bubble up so we can see if it's RLS (42501) or other
    throw error;
  }

  // If no error but data is null, the row doesn't exist
  if (!data) {
    console.warn('[fetchUserProfile] No profile row found for user:', userId);
    return null;
  }

  console.log('[fetchUserProfile] Success - found profile');
  return data;
}

/**
 * Fetches a user's recent practice sessions.
 * 
 * @param userId - The user's ID
 * @param limit - Number of sessions to return (default: 3)
 * @returns Promise<PracticeSession[]>
 * @throws Error if the query fails
 */
export async function fetchRecentSessions(
  userId: string,
  limit: number = 3
): Promise<PracticeSession[]> {
  const { data, error } = await supabase
    .from('practice_session')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch recent sessions: ${error.message}`);
  }

  return data || [];
}

/**
 * Calculates a user's current practice streak (consecutive days).
 * Returns 0 if no sessions or streak is broken.
 * 
 * @param userId - The user's ID
 * @returns Promise<number> - Number of consecutive days
 * @throws Error if the query fails
 */
export async function calculateStreak(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('practice_session')
    .select('started_at')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(100); // Look at last 100 sessions

  if (error) {
    throw new Error(`Failed to calculate streak: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return 0;
  }

  // Convert dates to days (midnight UTC)
  const getDayKey = (dateStr: string): string => {
    const date = new Date(dateStr);
    date.setUTCHours(0, 0, 0, 0);
    return date.toISOString().split('T')[0];
  };

  // Get unique practice days
  const practiceDays = [...new Set(data.map((s: any) => getDayKey(s.started_at)))].sort().reverse();

  if (practiceDays.length === 0) {
    return 0;
  }

  // Check if streak is current (practiced today or yesterday)
  const today = getDayKey(new Date().toISOString());
  const yesterday = getDayKey(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  
  if (practiceDays[0] !== today && practiceDays[0] !== yesterday) {
    return 0; // Streak is broken
  }

  // Count consecutive days
  let streak = 1;
  for (let i = 1; i < practiceDays.length; i++) {
    const currentDate = new Date(practiceDays[i]);
    const previousDate = new Date(practiceDays[i - 1]);
    const diffDays = Math.floor((previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak++;
    } else {
      break; // Streak is broken
    }
  }

  return streak;
}

/**
 * Fetches a user's achievements with their details.
 * 
 * @param userId - The user's ID
 * @returns Promise<UserAchievementWithDetails[]>
 * @throws Error if the query fails
 */
export async function fetchUserAchievements(userId: string): Promise<UserAchievementWithDetails[]> {
  const { data, error } = await supabase
    .from('user_achievement')
    .select(`
      *,
      achievement:achievement_id (*)
    `)
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch user achievements: ${error.message}`);
  }

  return (data || []).map((item: any) => ({
    ...item,
    achievement: Array.isArray(item.achievement) ? item.achievement[0] : item.achievement
  })) as UserAchievementWithDetails[];
}

/**
 * Fetches all available achievements (for showing locked badges).
 * 
 * @returns Promise<Achievement[]>
 * @throws Error if the query fails
 */
export async function fetchAllAchievements(): Promise<Achievement[]> {
  const { data, error } = await supabase
    .from('achievement')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch achievements: ${error.message}`);
  }

  return data || [];
}

/**
 * Updates a user's profile.
 * 
 * @param userId - The user's ID
 * @param updates - Partial profile data to update
 * @returns Promise<Profile>
 * @throws Error if the update fails
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Database['public']['Tables']['profiles']['Update']>
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    // @ts-expect-error - Supabase type inference issue with profiles table
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user profile: ${error.message}`);
  }

  return data;
}

