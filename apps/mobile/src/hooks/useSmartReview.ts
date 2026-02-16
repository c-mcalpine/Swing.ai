import { useState, useCallback } from 'react';
import { edgeFunctions, EdgeFunctionError } from '@/api/edge';

/** Environment filter for smart-review-plan (drill.environment: home | range | net) */
export type SmartReviewEnvironment = 'home' | 'range' | 'net' | null;

/**
 * Hook to fetch smart review plan (see supabase/functions/smart-review-plan).
 * environment filters drills by where you can practice.
 */
export function useSmartReviewPlan(
  budgetMin: number = 10,
  environment: SmartReviewEnvironment = null
) {
  const [plan, setPlan] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(
    async (budget?: number, env?: SmartReviewEnvironment) => {
      setLoading(true);
      setError(null);

      try {
        const result = await edgeFunctions.getSmartReviewPlan({
          budget_min: budget || budgetMin,
          environment: env === undefined ? environment : env,
          include_lessons: true,
        });
        setPlan(result);
        setLoading(false);
        return result;
      } catch (err: any) {
        const edgeError = err as EdgeFunctionError;
        setError(edgeError.message || edgeError.error || 'Failed to load plan');
        setLoading(false);
        throw err;
      }
    },
    [budgetMin, environment]
  );

  return {
    plan,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to submit review completion
 */
export function useSubmitReviewResult() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (params: {
    item_type: 'drill' | 'lesson';
    item_id: number;
    score: number;
    issue_slug?: string | null;
    duration_min?: number | null;
  }) => {
    setLoading(true);
    setError(null);

    try {
      // Generate client-side idempotency key
      const timestamp = Date.now();
      const clientEventId = `${params.item_type}-${params.item_id}-${timestamp}`;

      const result = await edgeFunctions.submitReviewResult({
        ...params,
        client_event_id: clientEventId,
      });

      setLoading(false);
      return result;
    } catch (err: any) {
      const edgeError = err as EdgeFunctionError;
      setError(edgeError.message || edgeError.error || 'Failed to submit result');
      setLoading(false);
      throw err;
    }
  };

  return {
    submit,
    loading,
    error,
  };
}

/**
 * Legacy hook for smart review system (spaced repetition)
 * @deprecated Use useSmartReviewPlan and useSubmitReviewResult instead
 */
export function useSmartReview() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get personalized practice plan
   */
  const getPlan = async (options?: {
    budget_min?: number;
    environment?: 'home' | 'range' | 'net' | null;
    include_lessons?: boolean;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const result = await edgeFunctions.getSmartReviewPlan(options);
      setLoading(false);
      return result;
    } catch (err: any) {
      const edgeError = err as EdgeFunctionError;
      setError(edgeError.message || edgeError.error || 'Failed to load plan');
      setLoading(false);
      throw err;
    }
  };

  /**
   * Submit review completion
   */
  const submitResult = async (params: {
    item_type: 'drill' | 'lesson';
    item_id: number;
    score: number;
    issue_slug?: string | null;
    duration_min?: number | null;
  }) => {
    setLoading(true);
    setError(null);

    try {
      // Generate client-side idempotency key
      const timestamp = Date.now();
      const clientEventId = `${params.item_type}-${params.item_id}-${timestamp}`;

      const result = await edgeFunctions.submitReviewResult({
        ...params,
        client_event_id: clientEventId,
      });
      
      setLoading(false);
      return result;
    } catch (err: any) {
      const edgeError = err as EdgeFunctionError;
      setError(edgeError.message || edgeError.error || 'Failed to submit result');
      setLoading(false);
      throw err;
    }
  };

  return {
    getPlan,
    submitResult,
    loading,
    error,
  };
}
