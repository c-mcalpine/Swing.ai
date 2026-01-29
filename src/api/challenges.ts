import { supabase } from '../lib/supabaseClient';
import type { Database } from '../lib/supabaseTypes';

type Challenge = Database['public']['Tables']['challenge']['Row'];
type ChallengeInstance = Database['public']['Tables']['challenge_instance']['Row'];
type ChallengeProgress = Database['public']['Tables']['challenge_progress']['Row'];

export interface ChallengeInstanceWithDetails extends ChallengeInstance {
  challenge: Challenge;
}

export interface ChallengeWithProgress {
  instance: ChallengeInstanceWithDetails;
  progress: ChallengeProgress | null;
}

/**
 * Fetches all active challenge instances with their challenge details.
 * 
 * @returns Promise<ChallengeInstanceWithDetails[]>
 * @throws Error if the query fails
 */
export async function fetchActiveChallengeInstances(): Promise<ChallengeInstanceWithDetails[]> {
  console.log('[fetchActiveChallengeInstances] Fetching active challenges');
  
  const { data, error } = await supabase
    .from('challenge_instance')
    .select('*')
    .eq('is_active', true)
    .order('starts_at', { ascending: false });

  console.log('[fetchActiveChallengeInstances] data:', data?.length, 'instances');
  console.log('[fetchActiveChallengeInstances] error:', error);

  if (error) {
    console.error('[fetchActiveChallengeInstances] Database error:', error);
    throw error;
  }

  // Fetch challenge details separately for each instance
  const instancesWithChallenges: ChallengeInstanceWithDetails[] = [];
  
  for (const instance of (data || []) as ChallengeInstance[]) {
    const { data: challenge, error: challengeError } = await supabase
      .from('challenge')
      .select('*')
      .eq('id', instance.challenge_id)
      .single();
    
    if (challengeError) {
      console.error(`[fetchActiveChallengeInstances] Failed to fetch challenge ${instance.challenge_id}:`, challengeError);
      continue;
    }
    
    if (challenge) {
      instancesWithChallenges.push({
        ...instance,
        challenge: challenge as Challenge
      });
    }
  }

  return instancesWithChallenges;
}

/**
 * Fetches a user's progress for all challenges.
 * 
 * @param userId - The user's ID
 * @returns Promise<ChallengeProgress[]>
 * @throws Error if the query fails
 */
export async function fetchMyChallengeProgress(userId: string): Promise<ChallengeProgress[]> {
  console.log('[fetchMyChallengeProgress] Fetching progress for user:', userId);
  
  const { data, error } = await supabase
    .from('challenge_progress')
    .select('*')
    .eq('user_id', userId);

  console.log('[fetchMyChallengeProgress] data:', data?.length, 'progress records');
  console.log('[fetchMyChallengeProgress] error:', error);

  if (error) {
    console.error('[fetchMyChallengeProgress] Database error:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetches active challenges with the user's progress merged in.
 * 
 * @param userId - The user's ID
 * @returns Promise<ChallengeWithProgress[]>
 * @throws Error if either query fails
 */
export async function fetchActiveChallengesWithProgress(userId: string): Promise<ChallengeWithProgress[]> {
  console.log('[fetchActiveChallengesWithProgress] Fetching for user:', userId);
  
  const [instances, progressRecords] = await Promise.all([
    fetchActiveChallengeInstances(),
    fetchMyChallengeProgress(userId)
  ]);

  // Create a map of challenge_instance_id -> progress
  const progressMap = new Map<number, ChallengeProgress>();
  progressRecords.forEach(p => {
    progressMap.set(p.challenge_instance_id, p);
  });

  // Merge instances with progress
  const result: ChallengeWithProgress[] = instances.map(instance => ({
    instance,
    progress: progressMap.get(instance.id) || null
  }));

  console.log('[fetchActiveChallengesWithProgress] Merged:', result.length, 'challenges');
  return result;
}

/**
 * Updates a user's challenge progress.
 * 
 * @param userId - The user's ID
 * @param challengeInstanceId - The challenge instance ID
 * @param progressValue - The new progress value
 * @returns Promise<ChallengeProgress>
 * @throws Error if the update fails
 */
export async function updateChallengeProgress(
  userId: string,
  challengeInstanceId: number,
  progressValue: number
): Promise<ChallengeProgress> {
  const updateData: Database['public']['Tables']['challenge_progress']['Insert'] = {
    user_id: userId,
    challenge_instance_id: challengeInstanceId,
    progress_value: progressValue,
    last_updated_at: new Date().toISOString()
  };

  const { data, error } = await (supabase
    .from('challenge_progress')
    .upsert(updateData as any)
    .select()
    .single() as any);

  if (error) {
    throw new Error(`Failed to update challenge progress: ${error.message}`);
  }

  return data!;
}

