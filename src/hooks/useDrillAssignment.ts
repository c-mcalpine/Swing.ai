import { useState, useEffect } from 'react';
import {
  fetchQuickDrills,
  fetchAssignedDrills,
  type DrillAssignmentWithDrill,
} from '../api/drillAssignment';

interface UseDrillAssignmentsReturn {
  data: DrillAssignmentWithDrill[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * React hook to fetch quick drills for home screen.
 * 
 * @param userId - The user ID to fetch (null to skip loading)
 * @param limit - Number of drills to fetch
 * @returns {UseDrillAssignmentsReturn}
 */
export function useQuickDrills(
  userId: string | null,
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
        const drills = await fetchQuickDrills(userId, limit);
        
        if (isMounted) {
          setData(drills);
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

/**
 * React hook to fetch all assigned drills for a user.
 * 
 * @param userId - The user ID to fetch (null to skip loading)
 * @returns {UseDrillAssignmentsReturn}
 */
export function useAssignedDrills(userId: string | null): UseDrillAssignmentsReturn {
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
        const drills = await fetchAssignedDrills(userId);
        
        if (isMounted) {
          setData(drills);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load assigned drills'));
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
  }, [userId, refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  return { data, loading, error, refetch };
}

