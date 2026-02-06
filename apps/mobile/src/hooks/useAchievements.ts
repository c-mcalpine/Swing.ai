import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabaseTypes';

type Achievement = Database['public']['Tables']['achievement']['Row'];
type UserAchievement = Database['public']['Tables']['user_achievement']['Row'];

export interface UserAchievementWithDetails extends UserAchievement {
  achievement?: Achievement;
}

interface UseAchievementsReturn {
  data: UserAchievementWithDetails[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface UseAllAchievementsReturn {
  data: Achievement[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * React hook to fetch user's achievements.
 */
export function useUserAchievements(userId?: string | null): UseAchievementsReturn {
  const [data, setData] = useState<UserAchievementWithDetails[]>([]);
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

    const loadAchievements = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: achievements, error: achievementError } = await supabase
          .from('user_achievement')
          .select('*, achievement:achievement_id(*)')
          .eq('user_id', userId);

        if (achievementError) throw achievementError;

        if (isMounted) {
          setData(achievements || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load achievements'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAchievements();

    return () => {
      isMounted = false;
    };
  }, [userId, refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  return { data, loading, error, refetch };
}

/**
 * React hook to fetch all available achievements.
 */
export function useAllAchievements(): UseAllAchievementsReturn {
  const [data, setData] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadAchievements = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: achievements, error: achievementError } = await supabase
          .from('achievement')
          .select('*')
          .order('sort_order', { ascending: true });

        if (achievementError) throw achievementError;

        if (isMounted) {
          setData(achievements || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load achievements'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAchievements();

    return () => {
      isMounted = false;
    };
  }, [refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  return { data, loading, error, refetch };
}
