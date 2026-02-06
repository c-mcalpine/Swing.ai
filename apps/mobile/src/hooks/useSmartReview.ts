import { useState } from 'react';
import { edgeFunctions, EdgeFunctionError } from '@/api/edge';

/**
 * Hook for smart review system (spaced repetition)
 * Frontend stays dumb - all scheduling logic happens server-side
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
