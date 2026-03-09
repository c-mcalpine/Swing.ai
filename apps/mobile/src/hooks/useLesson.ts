import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabaseTypes';

type LessonRow = Database['public']['Tables']['lesson']['Row'];

export interface UseLessonReturn {
  lesson: LessonRow | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetch a single lesson by id from the lesson table.
 */
export function useLesson(lessonId: number | undefined | null): UseLessonReturn {
  const [lesson, setLesson] = useState<LessonRow | null>(null);
  const [loading, setLoading] = useState<boolean>(!!lessonId);
  const [error, setError] = useState<Error | null>(null);

  const fetchLesson = async () => {
    if (lessonId == null || lessonId === 0) {
      setLesson(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('lesson')
        .select('*')
        .eq('id', lessonId)
        .maybeSingle();

      if (err) throw err;
      setLesson(data ?? null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load lesson'));
      setLesson(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLesson();
  }, [lessonId]);

  return { lesson, loading, error, refetch: fetchLesson };
}
