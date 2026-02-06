import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabaseTypes';

// Type aliases for convenience
type SwingPhase = Database['public']['Tables']['swing_phase']['Row'];
type SwingMechanic = Database['public']['Tables']['swing_mechanic']['Row'];
type SwingError = Database['public']['Tables']['swing_error']['Row'];
type Drill = Database['public']['Tables']['drill']['Row'];
type CoachingCue = Database['public']['Tables']['coaching_cue']['Row'];
type Lesson = Database['public']['Tables']['lesson']['Row'];
type LessonStep = Database['public']['Tables']['lesson_step']['Row'];

export interface SwingTaxonomy {
  phases: SwingPhase[];
  mechanics: SwingMechanic[];
  errors: SwingError[];
  drills: Drill[];
  cues: CoachingCue[];
  lessons: Lesson[];
  lessonSteps: LessonStep[];
}

interface UseTaxonomyReturn {
  data: SwingTaxonomy | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * React hook to fetch and manage the swing taxonomy data (lessons, drills, mechanics, etc).
 * Automatically loads data on mount and provides loading/error states.
 */
export function useSwingTaxonomy(): UseTaxonomyReturn {
  const [data, setData] = useState<SwingTaxonomy | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadTaxonomy = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all taxonomy data in parallel
        const [
          phasesResult,
          mechanicsResult,
          errorsResult,
          drillsResult,
          cuesResult,
          lessonsResult,
          lessonStepsResult,
        ] = await Promise.all([
          supabase.from('swing_phase').select('*').order('sort_order', { ascending: true }),
          supabase.from('swing_mechanic').select('*'),
          supabase.from('swing_error').select('*'),
          supabase.from('drill').select('*'),
          supabase.from('coaching_cue').select('*'),
          supabase.from('lesson').select('*'),
          supabase.from('lesson_step').select('*').order('step_order', { ascending: true }),
        ]);

        // Check for errors
        if (phasesResult.error) throw phasesResult.error;
        if (mechanicsResult.error) throw mechanicsResult.error;
        if (errorsResult.error) throw errorsResult.error;
        if (drillsResult.error) throw drillsResult.error;
        if (cuesResult.error) throw cuesResult.error;
        if (lessonsResult.error) throw lessonsResult.error;
        if (lessonStepsResult.error) throw lessonStepsResult.error;

        if (isMounted) {
          setData({
            phases: phasesResult.data || [],
            mechanics: mechanicsResult.data || [],
            errors: errorsResult.data || [],
            drills: drillsResult.data || [],
            cues: cuesResult.data || [],
            lessons: lessonsResult.data || [],
            lessonSteps: lessonStepsResult.data || [],
          });
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load taxonomy'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTaxonomy();

    return () => {
      isMounted = false;
    };
  }, [refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  return { data, loading, error, refetch };
}
