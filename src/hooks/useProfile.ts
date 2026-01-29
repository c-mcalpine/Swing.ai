import { useState, useEffect } from 'react';
import {
  fetchUserProfile,
  fetchRecentSessions,
  calculateStreak,
  fetchUserAchievements,
  fetchAllAchievements,
  type UserAchievementWithDetails,
} from '../api/profile';
import type { Database } from '../lib/supabaseTypes';

type Profile = Database['public']['Tables']['profiles']['Row'];
type PracticeSession = Database['public']['Tables']['practice_session']['Row'];
type Achievement = Database['public']['Tables']['achievement']['Row'];

interface UseProfileReturn {
  data: Profile | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface UseRecentSessionsReturn {
  data: PracticeSession[];
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

interface UseUserAchievementsReturn {
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
 * React hook to fetch user profile data.
 * 
 * @param userId - The user ID to fetch (null to skip loading)
 * @returns {UseProfileReturn}
 */
export function useUserProfile(userId: string | null): UseProfileReturn {
  const [data, setData] = useState<Profile | null>(null);
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

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const profile = await fetchUserProfile(userId);
        
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
 * React hook to fetch user's recent practice sessions.
 * 
 * @param userId - The user ID to fetch (null to skip loading)
 * @param limit - Number of sessions to fetch
 * @returns {UseRecentSessionsReturn}
 */
export function useRecentSessions(
  userId: string | null,
  limit: number = 3
): UseRecentSessionsReturn {
  const [data, setData] = useState<PracticeSession[]>([]);
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

    const loadSessions = async () => {
      try {
        setLoading(true);
        setError(null);
        const sessions = await fetchRecentSessions(userId, limit);
        
        if (isMounted) {
          setData(sessions);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load sessions'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSessions();

    return () => {
      isMounted = false;
    };
  }, [userId, limit, refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  return { data, loading, error, refetch };
}

/**
 * React hook to calculate and fetch user's practice streak.
 * 
 * @param userId - The user ID to fetch (null to skip loading)
 * @returns {UseStreakReturn}
 */
export function useStreak(userId: string | null): UseStreakReturn {
  const [streak, setStreak] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    if (!userId) {
      setStreak(0);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;

    const loadStreak = async () => {
      try {
        setLoading(true);
        setError(null);
        const calculatedStreak = await calculateStreak(userId);
        
        if (isMounted) {
          setStreak(calculatedStreak);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to calculate streak'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadStreak();

    return () => {
      isMounted = false;
    };
  }, [userId, refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  return { streak, loading, error, refetch };
}

/**
 * React hook to fetch user's achievements.
 * 
 * @param userId - The user ID to fetch (null to skip loading)
 * @returns {UseUserAchievementsReturn}
 */
export function useUserAchievements(userId: string | null): UseUserAchievementsReturn {
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
        const achievements = await fetchUserAchievements(userId);
        
        if (isMounted) {
          setData(achievements);
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
    setRefetchTrigger(prev => prev + 1);
  };

  return { data, loading, error, refetch };
}

/**
 * React hook to fetch all available achievements.
 * 
 * @returns {UseAllAchievementsReturn}
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
        const achievements = await fetchAllAchievements();
        
        if (isMounted) {
          setData(achievements);
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
    setRefetchTrigger(prev => prev + 1);
  };

  return { data, loading, error, refetch };
}

