/**
 * TanStack Query hooks for bottom-nav screens. Cache-first so tab switches don't show loaders.
 * Use: show full-page loading only when (isLoading && !data). Otherwise render cached data.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserProfile } from '@/api/profile';
import { edgeFunctions } from '@/api/edge';
import { supabase } from '@/lib/supabase';
import { fetchTierLeaderboardData } from '@/hooks/useTierLeaderboard';
import type { Database } from '@/lib/supabaseTypes';

type Profile = Database['public']['Tables']['profiles']['Row'];
type LeaderboardRow = Database['public']['Views']['weekly_xp_leaderboard']['Row'];

// Shared query fns for prefetch (must match useQuery queryFn)
const fetchProfile = (userId: string) => getUserProfile(userId);
const fetchDailyPlan = () =>
  edgeFunctions.getDailyPlan({ include_lessons: true, max_drills: 2, max_cues: 2 });
const fetchSmartReviewPlan = () =>
  edgeFunctions.getSmartReviewPlan({ budget_min: 10, environment: null, include_lessons: true });
const fetchLeaderboard = async (limit: number) => {
  const { data, error } = await supabase
    .from('weekly_xp_leaderboard')
    .select('*')
    .order('rank_week', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as LeaderboardRow[];
};
const fetchMyRank = async (userId: string) => {
  const { data, error } = await supabase
    .from('weekly_xp_leaderboard')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data as LeaderboardRow;
};

// --- Profile ---
export function useProfileQuery(userId: string | null) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
  });
}

// --- Daily plan (Home) ---
export function useDailyPlanQuery() {
  return useQuery({
    queryKey: ['dailyPlan'],
    queryFn: fetchDailyPlan,
  });
}

// --- Smart review plan (Review tab) ---
export function useSmartReviewPlanQuery() {
  return useQuery({
    queryKey: ['smartReviewPlan'],
    queryFn: fetchSmartReviewPlan,
  });
}

// --- Leaderboard (Challenge tab) ---
export function useLeaderboardQuery(limit: number = 50) {
  return useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: () => fetchLeaderboard(limit),
  });
}

export function useMyRankQuery(userId: string | null) {
  return useQuery({
    queryKey: ['myRank', userId],
    queryFn: () => fetchMyRank(userId!),
    enabled: !!userId,
  });
}

// --- Challenges (Challenge tab) ---
type ChallengeInstanceWithDetails = Database['public']['Tables']['challenge_instance']['Row'] & {
  challenge: Database['public']['Tables']['challenge']['Row'];
};
type ChallengeProgress = Database['public']['Tables']['challenge_progress']['Row'];

const fetchChallenges = async (userId: string) => {
  const { data: instancesRaw, error: instancesError } = await supabase
    .from('challenge_instance')
    .select('*, challenge:challenge_id(*)')
    .eq('is_active', true)
    .gte('ends_at', new Date().toISOString())
    .order('ends_at', { ascending: true });
  if (instancesError) throw instancesError;
  const instances = (instancesRaw ?? []) as ChallengeInstanceWithDetails[];
  const instanceIds = instances.map((i) => i.id);
  const { data: progressData, error: progressError } = await supabase
    .from('challenge_progress')
    .select('*')
    .eq('user_id', userId)
    .in('challenge_instance_id', instanceIds);
  if (progressError) throw progressError;
  const progressList = (progressData ?? []) as ChallengeProgress[];
  return instances.map((instance) => ({
    instance,
    progress: progressList.find((p) => p.challenge_instance_id === instance.id) ?? null,
  }));
};

const fetchSessions = async (userId: string, limit: number) => {
  const { data, error } = await supabase
    .from('practice_session')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Database['public']['Tables']['practice_session']['Row'][];
};

const fetchUserAchievements = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_achievement')
    .select('*, achievement:achievement_id(*)')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []) as any[];
};

const fetchAllAchievements = async () => {
  const { data, error } = await supabase
    .from('achievement')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Database['public']['Tables']['achievement']['Row'][];
};

export function useChallengesQuery(userId: string | null) {
  return useQuery({
    queryKey: ['challenges', userId],
    queryFn: () => fetchChallenges(userId!),
    enabled: !!userId,
  });
}

// --- Profile screen: sessions, achievements ---
export function useSessionsQuery(userId: string | null, limit: number = 3) {
  return useQuery({
    queryKey: ['sessions', userId, limit],
    queryFn: () => fetchSessions(userId!, limit),
    enabled: !!userId,
  });
}

export function useUserAchievementsQuery(userId: string | null) {
  return useQuery({
    queryKey: ['achievements', userId],
    queryFn: () => fetchUserAchievements(userId!),
    enabled: !!userId,
  });
}

export function useAllAchievementsQuery() {
  return useQuery({
    queryKey: ['allAchievements'],
    queryFn: fetchAllAchievements,
  });
}

/** Prefetch core tab data so switching to Home/Review/Leaderboard/Profile is instant. Call after auth. */
export function usePrefetchAppQueries() {
  const queryClient = useQueryClient();

  return (userId: string) => {
    queryClient.prefetchQuery({ queryKey: ['profile', userId], queryFn: () => fetchProfile(userId) });
    queryClient.prefetchQuery({ queryKey: ['dailyPlan'], queryFn: fetchDailyPlan });
    queryClient.prefetchQuery({ queryKey: ['smartReviewPlan'], queryFn: fetchSmartReviewPlan });
    queryClient.prefetchQuery({ queryKey: ['tierLeaderboard', 50], queryFn: () => fetchTierLeaderboardData(50) });
    queryClient.prefetchQuery({ queryKey: ['challenges', userId], queryFn: () => fetchChallenges(userId) });
    queryClient.prefetchQuery({ queryKey: ['sessions', userId, 3], queryFn: () => fetchSessions(userId, 3) });
    queryClient.prefetchQuery({ queryKey: ['achievements', userId], queryFn: () => fetchUserAchievements(userId) });
    queryClient.prefetchQuery({ queryKey: ['allAchievements'], queryFn: fetchAllAchievements });
  };
}
