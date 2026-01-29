import { useState, useEffect } from 'react';
import {
  fetchSwingDiagnosticById,
  fetchDiagnosticsForUser,
  type CreateDiagnosticInput,
  createSwingDiagnostic,
} from '../api/diagnostics';
import type { Database } from '../lib/supabaseTypes';

type SwingDiagnostic = Database['public']['Tables']['swing_diagnostic']['Row'];

interface UseDiagnosticReturn {
  data: SwingDiagnostic | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface UseDiagnosticsForUserReturn {
  data: SwingDiagnostic[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  createDiagnostic: (input: CreateDiagnosticInput) => Promise<SwingDiagnostic>;
}

/**
 * React hook to fetch a single swing diagnostic by ID.
 * 
 * @param id - The diagnostic ID to fetch (null to skip fetching)
 * @returns {UseDiagnosticReturn} Diagnostic data, loading state, error, and refetch function
 */
export function useDiagnostic(id: number | null): UseDiagnosticReturn {
  const [data, setData] = useState<SwingDiagnostic | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    if (id === null) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;

    const loadDiagnostic = async () => {
      try {
        setLoading(true);
        setError(null);
        const diagnostic = await fetchSwingDiagnosticById(id);
        
        if (isMounted) {
          setData(diagnostic);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load diagnostic'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDiagnostic();

    return () => {
      isMounted = false;
    };
  }, [id, refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  return { data, loading, error, refetch };
}

/**
 * React hook to fetch all swing diagnostics for a specific user.
 * Also provides a function to create new diagnostics.
 * 
 * @param userId - The user ID to fetch diagnostics for (null to skip fetching)
 * @returns {UseDiagnosticsForUserReturn} Diagnostics data, loading state, error, refetch function, and create function
 */
export function useDiagnosticsForUser(userId: string | null): UseDiagnosticsForUserReturn {
  const [data, setData] = useState<SwingDiagnostic[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    if (userId === null) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;

    const loadDiagnostics = async () => {
      try {
        setLoading(true);
        setError(null);
        const diagnostics = await fetchDiagnosticsForUser(userId);
        
        if (isMounted) {
          setData(diagnostics);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load diagnostics'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDiagnostics();

    return () => {
      isMounted = false;
    };
  }, [userId, refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  const handleCreateDiagnostic = async (input: CreateDiagnosticInput): Promise<SwingDiagnostic> => {
    const newDiagnostic = await createSwingDiagnostic(input);
    // Trigger a refetch to update the list
    refetch();
    return newDiagnostic;
  };

  return {
    data,
    loading,
    error,
    refetch,
    createDiagnostic: handleCreateDiagnostic,
  };
}

