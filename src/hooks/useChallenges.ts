import { useState, useEffect } from 'react';
import {
  fetchActiveChallengeInstances,
  fetchMyChallengeProgress,
  fetchActiveChallengesWithProgress,
  type ChallengeInstanceWithDetails,
  type ChallengeWithProgress
} from '../api/challenges';
import type { Database } from '../lib/supabaseTypes';

type ChallengeProgress = Database['public']['Tables']['challenge_progress']['Row'];

interface UseChallengesReturn {
  data: ChallengeInstanceWithDetails[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface UseChallengeProgressReturn {
  data: ChallengeProgress[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface UseChallengesWithProgressReturn {
  data: ChallengeWithProgress[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * React hook to fetch active challenge instances.
 * 
 * @returns {UseChallengesReturn}
 */
export function useActiveChallenges(): UseChallengesReturn {
  const [data, setData] = useState<ChallengeInstanceWithDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadChallenges = async () => {
      try {
        setLoading(true);
        setError(null);
        const challenges = await fetchActiveChallengeInstances();
        
        if (isMounted) {
          setData(challenges);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load challenges'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadChallenges();

    return () => {
      isMounted = false;
    };
  }, [refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  return { data, loading, error, refetch };
}

/**
 * React hook to fetch user's challenge progress.
 * 
 * @param userId - The user ID to fetch (null to skip loading)
 * @returns {UseChallengeProgressReturn}
 */
export function useMyChallengeProgress(userId: string | null): UseChallengeProgressReturn {
  const [data, setData] = useState<ChallengeProgress[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    if (!userId) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;

    const loadProgress = async () => {
      try {
        setLoading(true);
        setError(null);
        const progress = await fetchMyChallengeProgress(userId);
        
        if (isMounted) {
          setData(progress);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load progress'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProgress();

    return () => {
      isMounted = false;
    };
  }, [userId, refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  return { data, loading, error, refetch };
}

/**
 * React hook to fetch active challenges with user's progress merged in.
 * 
 * @param userId - The user ID to fetch (null to skip loading)
 * @returns {UseChallengesWithProgressReturn}
 */
export function useChallengesWithProgress(userId: string | null): UseChallengesWithProgressReturn {
  const [data, setData] = useState<ChallengeWithProgress[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    if (!userId) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;

    const loadChallenges = async () => {
      try {
        setLoading(true);
        setError(null);
        const challenges = await fetchActiveChallengesWithProgress(userId);
        
        if (isMounted) {
          setData(challenges);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load challenges'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadChallenges();

    return () => {
      isMounted = false;
    };
  }, [userId, refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  return { data, loading, error, refetch };
}

