import { useState, useEffect } from 'react';
import {
  getUserProfile,
  getCurrentUserProfile,
} from '@/api/profile';
import type { Database } from '@/lib/supabaseTypes';
import { auth } from '@/lib/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface UseProfileReturn {
  data: Profile | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface UseStreakReturn {
  streak: number;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * React hook to fetch user profile data.
 * 
 * @param userId - The user ID to fetch (null to skip loading)
 * @returns {UseProfileReturn}
 */
export function useUserProfile(userId?: string | null): UseProfileReturn {
  const [data, setData] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // If userId provided, fetch that specific profile, otherwise get current user
        const profile = userId 
          ? await getUserProfile(userId)
          : await getCurrentUserProfile();
        
        if (isMounted) {
          setData(profile);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load profile'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

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
 * React hook to calculate and fetch user's practice streak.
 * For now, returns 0 (placeholder - streak calculation needs implementation)
 * 
 * @param userId - The user ID to fetch (null to skip loading)
 * @returns {UseStreakReturn}
 */
export function useStreak(userId?: string | null): UseStreakReturn {
  // TODO: Implement streak calculation based on practice_session data
  const [streak] = useState<number>(0);
  const [loading] = useState<boolean>(false);
  const [error] = useState<Error | null>(null);

  const refetch = () => {
    // TODO: Implement refetch
  };

  return { streak, loading, error, refetch };
}
