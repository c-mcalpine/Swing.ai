import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabaseTypes';

type Lesson = Database['public']['Tables']['lesson']['Row'];

export interface LessonProgressWithLesson {
  lesson: Lesson;
  progress: number;
  is_completed: boolean;
}

interface UseLessonReturn {
  data: LessonProgressWithLesson | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * React hook to fetch the daily recommended lesson for a user.
 * Returns the first available lesson for now (placeholder logic)
 * 
 * @param userId - The user ID to fetch (null to skip loading)
 * @returns {UseLessonReturn}
 */
export function useDailyLesson(userId?: string | null): UseLessonReturn {
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
        
        // Fetch first available lesson
        const { data: lessons, error: lessonError } = await supabase
          .from('lesson')
          .select('*')
          .eq('is_active', true)
          .order('order_index', { ascending: true })
          .limit(1)
          .single();

        if (lessonError) throw lessonError;
        
        if (isMounted && lessons) {
          setData({
            lesson: lessons,
            progress: 0,
            is_completed: false,
          });
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
