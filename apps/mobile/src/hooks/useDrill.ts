import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabaseTypes';

type DrillRow = Database['public']['Tables']['drill']['Row'];

export interface UseDrillReturn {
  drill: DrillRow | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetch a single drill by id from the drill table.
 */
export function useDrill(drillId: number | undefined | null): UseDrillReturn {
  const [drill, setDrill] = useState<DrillRow | null>(null);
  const [loading, setLoading] = useState<boolean>(!!drillId);
  const [error, setError] = useState<Error | null>(null);

  const fetchDrill = async () => {
    if (drillId == null) {
      setDrill(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('drill')
        .select('*')
        .eq('id', drillId)
        .maybeSingle();

      if (err) throw err;
      setDrill((data as DrillRow) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load drill'));
      setDrill(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrill();
  }, [drillId]);

  return { drill, loading, error, refetch: fetchDrill };
}
