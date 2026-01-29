import { useState, useCallback } from 'react';
import {
  fetchSmartReviewPlan,
  submitSmartReviewResult,
  fetchReviewQueue,
  type SmartReviewPlan,
  type SubmitReviewResultInput,
  type SubmitReviewResultResponse,
} from '../api/smartReview';

export interface UseSmartReviewPlanReturn {
  plan: SmartReviewPlan | null;
  loading: boolean;
  error: Error | null;
  refetch: (budgetMin?: number, environment?: string | null) => Promise<void>;
}

/**
 * Hook to fetch and manage smart review plan.
 */
export function useSmartReviewPlan(
  initialBudgetMin?: number,
  initialEnvironment?: string | null
): UseSmartReviewPlanReturn {
  const [plan, setPlan] = useState<SmartReviewPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(
    async (budgetMin?: number, environment?: string | null) => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchSmartReviewPlan(budgetMin, environment);
        setPlan(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load review plan'));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { plan, loading, error, refetch };
}

export interface UseSubmitReviewResultReturn {
  submit: (input: SubmitReviewResultInput) => Promise<SubmitReviewResultResponse>;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to submit review results.
 */
export function useSubmitReviewResult(): UseSubmitReviewResultReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submit = useCallback(async (input: SubmitReviewResultInput) => {
    try {
      setLoading(true);
      setError(null);
      const result = await submitSmartReviewResult(input);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to submit review result');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { submit, loading, error };
}

/**
 * Hook to fetch review queue (for debugging).
 */
export function useReviewQueue() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchReviewQueue();
      setQueue(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load review queue'));
    } finally {
      setLoading(false);
    }
  }, []);

  return { queue, loading, error, refetch };
}

