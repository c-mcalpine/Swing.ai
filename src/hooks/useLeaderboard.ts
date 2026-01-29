import { useState, useEffect } from 'react';
import { fetchWeeklyLeaderboard, fetchMyWeeklyRank } from '../api/leaderboard';
import type { Database } from '../lib/supabaseTypes';

type LeaderboardRow = Database['public']['Views']['weekly_xp_leaderboard']['Row'];

interface UseLeaderboardReturn {
  data: LeaderboardRow[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface UseMyRankReturn {
  data: LeaderboardRow | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * React hook to fetch the weekly XP leaderboard.
 * 
 * @param limit - Number of top users to fetch
 * @returns {UseLeaderboardReturn}
 */
export function useWeeklyLeaderboard(limit: number = 50): UseLeaderboardReturn {
  const [data, setData] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const leaderboard = await fetchWeeklyLeaderboard(limit);
        
        if (isMounted) {
          setData(leaderboard);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load leaderboard'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadLeaderboard();

    return () => {
      isMounted = false;
    };
  }, [limit, refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  return { data, loading, error, refetch };
}

/**
 * React hook to fetch the user's weekly rank.
 * 
 * @param userId - The user ID to fetch (null to skip loading)
 * @returns {UseMyRankReturn}
 */
export function useMyWeeklyRank(userId: string | null): UseMyRankReturn {
  const [data, setData] = useState<LeaderboardRow | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    if (!userId) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;

    const loadRank = async () => {
      try {
        setLoading(true);
        setError(null);
        const rank = await fetchMyWeeklyRank(userId);
        
        if (isMounted) {
          setData(rank);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load rank'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadRank();

    return () => {
      isMounted = false;
    };
  }, [userId, refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  return { data, loading, error, refetch };
}

