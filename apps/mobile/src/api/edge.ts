import { supabase } from '@/lib/supabase';

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
  const getValidatedAccessToken = async (): Promise<string> => {
    // Always refresh and use the returned token directly to avoid session-store races.
    const { data: refreshedData, error: refreshErr } = await supabase.auth.refreshSession();
    if (refreshErr || !refreshedData.session?.access_token) {
      // Fallback to current session if refresh is unavailable but existing token is present.
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr || !sessionData.session?.access_token) {
        throw {
          error: 'not_authenticated',
          message: 'You must be signed in to perform this action',
        } as EdgeFunctionError;
      }
      const expMs = (sessionData.session.expires_at ?? 0) * 1000;
      if (expMs > 0 && expMs < Date.now() + 15_000) {
        throw {
          error: 'not_authenticated',
          message: 'Session expired. Please sign in again.',
        } as EdgeFunctionError;
      }
      return sessionData.session.access_token;
    }

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      throw {
        error: 'not_authenticated',
        message: 'Session is invalid. Please sign in again.',
      } as EdgeFunctionError;
    }
    return refreshedData.session.access_token;
  };

  try {
    let accessToken = await getValidatedAccessToken();

    const invoke = async (token: string) =>
      supabase.functions.invoke(functionName, {
        body: payload as any,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

    let { data, error } = await invoke(accessToken);

    // One retry on Invalid JWT with forced refresh.
    if (error && `${error.message ?? ''}`.toLowerCase().includes('invalid jwt')) {
      await supabase.auth.refreshSession();
      accessToken = await getValidatedAccessToken();
      ({ data, error } = await invoke(accessToken));
    }

    // Handle error responses
    if (error) {
      let detail: string | undefined = error.name || undefined;
      let message: string | undefined = error.message || 'Failed to call edge function';

      // For FunctionsHttpError, try to parse edge-function JSON body for precise reason.
      const ctx = (error as any).context;
      if (ctx && typeof ctx.text === 'function') {
        try {
          const raw = await ctx.text();
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              message = parsed.message || parsed.error || message;
              detail = parsed.detail || raw;
            } catch {
              detail = raw;
            }
          }
        } catch {
          // ignore context parse failures
        }
      }

      console.error(`[edge:${functionName}] invoke failed`, {
        name: error.name,
        message: error.message,
        detail,
      });
      throw {
        error: 'request_failed',
        detail,
        message,
      } as EdgeFunctionError;
    }

    return (data ?? {}) as TResponse;
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
   * Get daily plan (new learning: lesson, drills, cues from curriculum queue)
   * Used by Home screen only. Not spaced repetition.
   */
  getDailyPlan: (options?: {
    include_lessons?: boolean;
    max_drills?: number;
    max_cues?: number;
  }) => {
    return callEdgeFunction<
      {
        include_lessons?: boolean;
        max_drills?: number;
        max_cues?: number;
      },
      {
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
        items: Array<
          | { type: 'lesson'; lesson_id: number; title: string; summary?: string | null }
          | { type: 'drill'; drill_id: number; name: string; issue_slug?: string | null; reason: string }
          | { type: 'cue'; cue_id: number; text: string; cue_type?: string | null; issue_slug?: string | null; reason: string }
        >;
      }
    >('daily-plan', options || {});
  },

  /**
   * Get smart review plan (spaced repetition from user_review_item.due_at)
   * Used by Review tab only.
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
        ok: boolean;
        items: Array<{
          item_type: 'drill' | 'lesson' | 'cue';
          item_id: number;
          due_at: string;
          reps: number;
          ease: number;
          interval_days: number;
          reason: string;
        }>;
        generated_at?: string;
        budget_min?: number;
        environment?: string | null;
        retention_score?: number | null;
      }
    >('smart-review-plan', options || {});
  },

  /**
   * Submit review result (updates spaced repetition schedule, awards XP)
   * Server-side: SM-2 algorithm, XP calculation, issue targeting updates
   */
  submitReviewResult: (params: {
    item_type: 'drill' | 'lesson' | 'cue';
    item_id: number;
    score: number; // 0..1
    issue_slug?: string | null;
    duration_min?: number | null;
    source?: 'daily' | 'review'; // daily = from Home daily plan; review = from Smart Review tab
    client_event_id?: string | null;
  }) => {
    return callEdgeFunction<
      {
        item_type: 'drill' | 'lesson' | 'cue';
        item_id: number;
        score: number;
        issue_slug?: string | null;
        duration_min?: number | null;
        source?: 'daily' | 'review';
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
