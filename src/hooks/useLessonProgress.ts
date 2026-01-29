import { useState, useEffect } from 'react';
import {
  fetchDailyLesson,
  fetchUpNextLesson,
  fetchReviewTimeline,
  fetchUserLessonProgress,
  type LessonProgressWithLesson,
} from '../api/lessonProgress';
import type { Database } from '../lib/supabaseTypes';

type UserLessonProgress = Database['public']['Tables']['user_lesson_progress']['Row'];
type UserReviewEvent = Database['public']['Tables']['user_review_event']['Row'];

interface UseLessonReturn {
  data: LessonProgressWithLesson | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface UseReviewTimelineReturn {
  data: UserReviewEvent[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface UseUserLessonProgressReturn {
  data: UserLessonProgress[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * React hook to fetch the daily recommended lesson for a user.
 * 
 * @param userId - The user ID to fetch (null to skip loading)
 * @returns {UseLessonReturn}
 */
export function useDailyLesson(userId: string | null): UseLessonReturn {
  const [data, setData] = useState<LessonProgressWithLesson | null>(null);
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

    const loadLesson = async () => {
      try {
        setLoading(true);
        setError(null);
        const lesson = await fetchDailyLesson(userId);
        
        if (isMounted) {
          setData(lesson);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load daily lesson'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadLesson();

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
 * React hook to fetch the "up next" lesson for Smart Review.
 * 
 * @param userId - The user ID to fetch (null to skip loading)
 * @returns {UseLessonReturn}
 */
export function useUpNextLesson(userId: string | null): UseLessonReturn {
  const [data, setData] = useState<LessonProgressWithLesson | null>(null);
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

    const loadLesson = async () => {
      try {
        setLoading(true);
        setError(null);
        const lesson = await fetchUpNextLesson(userId);
        
        if (isMounted) {
          setData(lesson);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load up next lesson'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadLesson();

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
 * React hook to fetch the review timeline/events for a user.
 * 
 * @param userId - The user ID to fetch (null to skip loading)
 * @returns {UseReviewTimelineReturn}
 */
export function useReviewTimeline(userId: string | null): UseReviewTimelineReturn {
  const [data, setData] = useState<UserReviewEvent[]>([]);
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

    const loadTimeline = async () => {
      try {
        setLoading(true);
        setError(null);
        const timeline = await fetchReviewTimeline(userId);
        
        if (isMounted) {
          setData(timeline);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load review timeline'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTimeline();

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
 * React hook to fetch all lesson progress for a user.
 * 
 * @param userId - The user ID to fetch (null to skip loading)
 * @returns {UseUserLessonProgressReturn}
 */
export function useUserLessonProgress(userId: string | null): UseUserLessonProgressReturn {
  const [data, setData] = useState<UserLessonProgress[]>([]);
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
        const progress = await fetchUserLessonProgress(userId);
        
        if (isMounted) {
          setData(progress);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load lesson progress'));
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

