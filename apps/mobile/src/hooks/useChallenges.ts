import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabaseTypes';

type Challenge = Database['public']['Tables']['challenge']['Row'];
type ChallengeInstance = Database['public']['Tables']['challenge_instance']['Row'];
type ChallengeProgress = Database['public']['Tables']['challenge_progress']['Row'];

export interface ChallengeInstanceWithDetails extends ChallengeInstance {
  challenge: Challenge;
}

export interface ChallengeWithProgress {
  instance: ChallengeInstanceWithDetails;
  progress: ChallengeProgress | null;
}

interface UseChallengesWithProgressReturn {
  data: ChallengeWithProgress[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * React hook to fetch active challenges with user's progress merged in.
 */
export function useChallengesWithProgress(
  userId?: string | null
): UseChallengesWithProgressReturn {
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

        // Fetch active challenge instances with their challenge details
        const { data: instances, error: instancesError } = await supabase
          .from('challenge_instance')
          .select('*, challenge:challenge_id(*)')
          .eq('is_active', true)
          .gte('end_date', new Date().toISOString())
          .order('end_date', { ascending: true });

        if (instancesError) throw instancesError;

        // Fetch user's progress for these challenges
        const instanceIds = (instances || []).map((i) => i.id);
        const { data: progressData, error: progressError } = await supabase
          .from('challenge_progress')
          .select('*')
          .eq('user_id', userId)
          .in('challenge_instance_id', instanceIds);

        if (progressError) throw progressError;

        // Merge progress with instances
        const result = (instances || []).map((instance) => {
          const progress =
            progressData?.find((p) => p.challenge_instance_id === instance.id) || null;
          return {
            instance: instance as ChallengeInstanceWithDetails,
            progress,
          };
        });

        if (isMounted) {
          setData(result);
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
    setRefetchTrigger((prev) => prev + 1);
  };

  return { data, loading, error, refetch };
}
