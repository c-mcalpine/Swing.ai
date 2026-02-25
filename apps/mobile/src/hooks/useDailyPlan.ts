import { useState, useCallback, useEffect } from 'react';
import { edgeFunctions, EdgeFunctionError } from '@/api/edge';

export type DailyPlanItem =
  | { type: 'lesson'; lesson_id: number; title: string; summary?: string | null }
  | { type: 'drill'; drill_id: number; name: string; issue_slug?: string | null; reason: string }
  | { type: 'cue'; cue_id: number; text: string; cue_type?: string | null; issue_slug?: string | null; reason: string };

export interface DailyPlanResponse {
  ok: boolean;
  active_lesson: {
    id: number;
    title: string;
    summary: string | null;
    issue_slug: string | null;
  } | null;
  today: {
    lesson_id: number;
    drill_ids: number[];
    cue_ids: number[];
  };
  items: DailyPlanItem[];
}

/**
 * Hook to fetch the daily plan (new learning: lesson, drills, cues from curriculum).
 * Use on Home screen only. For spaced repetition use useSmartReviewPlan on Review screen.
 */
export function useDailyPlan(options?: {
  include_lessons?: boolean;
  max_drills?: number;
  max_cues?: number;
}) {
  const [plan, setPlan] = useState<DailyPlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await edgeFunctions.getDailyPlan({
        include_lessons: options?.include_lessons ?? true,
        max_drills: options?.max_drills ?? 2,
        max_cues: options?.max_cues ?? 2,
      });
      setPlan(result);
      setLoading(false);
      return result;
    } catch (err: any) {
      const edgeError = err as EdgeFunctionError;
      setError(edgeError.message || edgeError.error || 'Failed to load daily plan');
      setLoading(false);
      return null;
    }
  }, [options?.include_lessons, options?.max_drills, options?.max_cues]);

  useEffect(() => {
    refetch().catch((e) => {
      console.error('[useDailyPlan] fetch failed', e);
    });
  }, [refetch]);

  return {
    plan,
    loading,
    error,
    refetch,
  };
}
