import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabaseTypes';

type PracticeSession = Database['public']['Tables']['practice_session']['Row'];

interface UseSessionsReturn {
  data: PracticeSession[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * React hook to fetch user's recent practice sessions.
 */
export function useRecentSessions(
  userId?: string | null,
  limit: number = 3
): UseSessionsReturn {
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

        const { data: sessions, error: sessionError } = await supabase
          .from('practice_session')
          .select('*')
          .eq('user_id', userId)
          .order('started_at', { ascending: false })
          .limit(limit);

        if (sessionError) throw sessionError;

        if (isMounted) {
          setData(sessions || []);
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
    setRefetchTrigger((prev) => prev + 1);
  };

  return { data, loading, error, refetch };
}
