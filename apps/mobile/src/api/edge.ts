import { supabase } from '@/lib/supabase';

/**
 * Base URL for Supabase Edge Functions
 */
const EDGE_FUNCTION_BASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
  ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1`
  : '';

/**
 * Standard error shape for all edge function calls
 */
export interface EdgeFunctionError {
  error: string;
  detail?: string;
  message?: string;
}

/**
 * Generic edge function caller with auth + error normalization
 * 
 * @param functionName - Name of the edge function (e.g., 'swing-analysis')
 * @param payload - JSON payload to send
 * @returns Parsed JSON response
 * @throws EdgeFunctionError if request fails
 */
export async function callEdgeFunction<TPayload = any, TResponse = any>(
  functionName: string,
  payload: TPayload
): Promise<TResponse> {
  // Get current session for Authorization header
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    throw {
      error: 'not_authenticated',
      message: 'You must be signed in to perform this action',
    } as EdgeFunctionError;
  }

  const url = `${EDGE_FUNCTION_BASE_URL}/${functionName}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // Handle error responses
    if (!response.ok) {
      throw {
        error: data.error || 'request_failed',
        detail: data.detail,
        message: data.message || `Request failed with status ${response.status}`,
      } as EdgeFunctionError;
    }

    return data as TResponse;
  } catch (error: any) {
    // Network errors, parse errors, etc.
    if (error.error) {
      // Already an EdgeFunctionError
      throw error;
    }
    
    // Wrap unknown errors
    throw {
      error: 'network_error',
      message: error.message || 'Failed to connect to server',
      detail: String(error),
    } as EdgeFunctionError;
  }
}

/**
 * Type-safe wrapper for each edge function
 */
export const edgeFunctions = {
  /**
   * Request swing analysis from AI
   * Server-side: calls OpenAI vision API, analyzes swing, stores results
   */
  analyzeSwing: (captureId: number) => {
    return callEdgeFunction<
      { capture_id: number },
      {
        ok: boolean;
        capture_id: number;
        analysis: {
          confidence: number;
          issue_scores: Record<string, number>;
          issue_confidence: Record<string, number>;
          mechanic_scores: Record<string, number>;
          club_angle_refs: Record<string, number>;
          recommended_drill_ids: number[];
          recommended_lesson_ids: number[];
          coach_notes: string;
        };
      }
    >('swing-analysis', { capture_id: captureId });
  },

  /**
   * Get smart review plan (spaced repetition)
   * Server-side: analyzes user's issue state, review schedule, returns personalized plan
   */
  getSmartReviewPlan: (options?: {
    budget_min?: number;
    environment?: 'home' | 'range' | 'net' | null;
    include_lessons?: boolean;
  }) => {
    return callEdgeFunction<
      {
        budget_min?: number;
        environment?: string | null;
        include_lessons?: boolean;
      },
      {
        generated_at: string;
        budget_min: number;
        environment: string | null;
        retention_score: number | null;
        items: Array<{
          item_type: 'drill' | 'lesson';
          item_id: number;
          minutes: number;
          issue_slug: string | null;
          why: string;
          source: 'due_review' | 'issue_target' | 'maintenance';
          due_at: string | null;
        }>;
      }
    >('smart-review-plan', options || {});
  },

  /**
   * Submit review result (updates spaced repetition schedule, awards XP)
   * Server-side: SM-2 algorithm, XP calculation, issue targeting updates
   */
  submitReviewResult: (params: {
    item_type: 'drill' | 'lesson';
    item_id: number;
    score: number; // 0..1
    issue_slug?: string | null;
    duration_min?: number | null;
    client_event_id?: string | null; // For client-side idempotency
  }) => {
    return callEdgeFunction<
      {
        item_type: 'drill' | 'lesson';
        item_id: number;
        score: number;
        issue_slug?: string | null;
        duration_min?: number | null;
        client_event_id?: string | null;
      },
      {
        ok: boolean;
        completion_id: number;
        next_schedule: {
          interval_days: number;
          ease: number;
          success_streak: number;
          fail_count: number;
          reps: number;
          due_at: string;
          last_reviewed_at: string;
          last_score: number;
        } | null;
        xp_awarded: number;
        message?: string;
      }
    >('submit-review-result', params);
  },
};
