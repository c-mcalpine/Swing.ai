import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/supabaseTypes';

type Profile = Database['public']['Tables']['profiles']['Row'];

/**
 * Fetch user profile from Supabase
 * Uses RLS - automatically filtered by auth.uid()
 * Returns null if profile doesn't exist yet (during onboarding)
 */
export async function getUserProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[API] getUserProfile error:', error);
    throw error;
  }

  return data;
}

/**
 * Get current user's profile using session
 * Returns null if profile doesn't exist yet (during onboarding)
 */
export async function getCurrentUserProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('No authenticated user');
  }

  return getUserProfile(user.id);
}

/**
 * Update current user's profile
 */
export async function updateProfile(updates: Partial<Profile>): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('No authenticated user');
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', user.id)
    .select()
    .maybeSingle();

  if (error) {
    console.error('[API] updateProfile error:', error);
    throw error;
  }

  return data;
}

/**
 * Complete onboarding - creates profile if it doesn't exist
 * Note: handedness, handicap, and goals are stored in separate tables in your schema
 */
export async function completeOnboarding(data: {
  handedness?: 'left' | 'right';
  handicap?: number;
  goals?: string[];
}): Promise<Profile | null> {
  console.log('[API] completeOnboarding called with data:', data);
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('No authenticated user');
  }

  console.log('[API] User ID:', user.id);

  // First check if profile exists, if not create it
  const { data: existingProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('[API] completeOnboarding fetch error:', fetchError);
    throw fetchError;
  }

  console.log('[API] Existing profile:', existingProfile ? 'found' : 'not found');

  let result;
  if (existingProfile) {
    // Profile already exists, just return it
    console.log('[API] Using existing profile');
    result = existingProfile;
  } else {
    // Create new profile with default values
    console.log('[API] Creating new profile...');
    const { data: created, error: createError } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        username: user.email?.split('@')[0] || 'Golfer',
        level: 1,
        xp: 0,
        xp_to_next: 100,
        rank_title: 'Beginner',
        badge: 'Rookie',
        overall_score: 50,
        tempo_score: 50,
        speed_score: 50,
        plane_score: 50,
        rotation_score: 50,
        balance_score: 50,
        power_score: 50,
      })
      .select()
      .single();

    if (createError) {
      console.error('[API] completeOnboarding create error:', createError);
      throw createError;
    }
    console.log('[API] Profile created successfully');
    result = created;
  }

  // Store goals in user_goal table if provided
  if (data.goals && data.goals.length > 0) {
    console.log('[API] Inserting goals:', data.goals);
    const goalInserts = data.goals.map((goalTitle, index) => ({
      user_id: user.id,
      goal_type: 'improvement',
      title: goalTitle,
      target_value: 100,
      current_value: 0,
      progress_percentage: 0,
      is_active: true,
    }));

    const { error: goalsError } = await supabase
      .from('user_goal')
      .insert(goalInserts);

    if (goalsError) {
      console.warn('[API] Failed to insert goals:', goalsError);
      // Don't throw - profile creation succeeded
    } else {
      console.log('[API] Goals inserted successfully');
    }
  }

  console.log('[API] completeOnboarding finished, returning profile');
  return result;
}

/**
 * Check if user has completed onboarding
 * Since there's no onboarding_completed_at column, we check if profile exists
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    // Profile exists = onboarding complete
    return !!profile;
  } catch (error) {
    // If any error, assume onboarding is not complete
    return false;
  }
}
