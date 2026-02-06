import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabaseTypes';

type Drill = Database['public']['Tables']['drill']['Row'];

export interface DrillAssignmentWithDrill {
  drill_id: string;
  drill: Drill;
}

interface UseDrillAssignmentsReturn {
  data: DrillAssignmentWithDrill[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * React hook to fetch quick drills for home screen.
 * Returns a limited number of available drills for now (placeholder logic)
 * 
 * @param userId - The user ID to fetch (null to skip loading)
 * @param limit - Number of drills to fetch
 * @returns {UseDrillAssignmentsReturn}
 */
export function useQuickDrills(
  userId?: string | null,
  limit: number = 2
): UseDrillAssignmentsReturn {
  const [data, setData] = useState<DrillAssignmentWithDrill[]>([]);
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

    const loadDrills = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch available drills
        const { data: drills, error: drillError } = await supabase
          .from('drill')
          .select('*')
          .eq('is_active', true)
          .limit(limit);

        if (drillError) throw drillError;
        
        if (isMounted) {
          const formattedDrills = (drills || []).map((drill) => ({
            drill_id: drill.id,
            drill,
          }));
          setData(formattedDrills);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load quick drills'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDrills();

    return () => {
      isMounted = false;
    };
  }, [userId, limit, refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  return { data, loading, error, refetch };
}
