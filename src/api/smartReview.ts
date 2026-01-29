import { supabase } from '../lib/supabaseClient';
import { DEV_USER_ID } from '../config/devUser';

export interface SmartReviewPlanItem {
  item_type: 'drill' | 'lesson';
  item_id: number;
  minutes: number;
  issue_slug: string | null;
  why: string;
  source: 'due_review' | 'issue_target' | 'maintenance';
  due_at: string | null;
}

export interface SmartReviewPlan {
  generated_at: string;
  budget_min: number;
  environment: string | null;
  retention_score: number | null; // 0..1 average retention score
  items: SmartReviewPlanItem[];
}

export interface SubmitReviewResultInput {
  item_type: 'drill' | 'lesson';
  item_id: number;
  issue_slug?: string | null;
  score: number; // 0..1
  duration_min?: number | null;
  client_event_id?: string | null;
}

export interface SubmitReviewResultResponse {
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
  };
  xp_awarded: number;
}

/**
 * Fetches a smart review plan from the edge function.
 */
export async function fetchSmartReviewPlan(
  budgetMin?: number,
  environment?: string | null
): Promise<SmartReviewPlan> {
  const { data, error } = await supabase.functions.invoke('smart-review-plan', {
    body: {
      budget_min: budgetMin ?? 10,
      environment: environment ?? null,
      include_lessons: true,
    },
  });

  if (error) throw new Error(`Failed to fetch smart review plan: ${error.message}`);
  return data as SmartReviewPlan;
}

/**
 * Submits a review result (completion) to the edge function.
 */
export async function submitSmartReviewResult(
  input: SubmitReviewResultInput
): Promise<SubmitReviewResultResponse> {
  const { data, error } = await supabase.functions.invoke('submit-review-result', {
    body: {
      item_type: input.item_type,
      item_id: input.item_id,
      issue_slug: input.issue_slug ?? null,
      score: input.score,
      duration_min: input.duration_min ?? null,
      client_event_id: input.client_event_id ?? null,
    },
  });

  if (error) throw new Error(`Failed to submit review result: ${error.message}`);
  return data as SubmitReviewResultResponse;
}

/**
 * Fetches the review queue for debugging (optional).
 * 
 * NOTE: This requires RLS to allow read access, or should be moved to an edge function
 * with service role for admin/debug use only. For normal app usage, clients should
 * not need raw queue access - use the smart-review-plan edge function instead.
 */
export async function fetchReviewQueue(): Promise<any[]> {
  // Using DEV_USER_ID for dev only - this will break with real auth unless RLS allows it
  // Consider moving to edge function with service role for production
  const { data, error } = await supabase
    .from('user_review_item' as 'user_review_item')
    .select('*')
    .eq('user_id', DEV_USER_ID)
    .eq('is_active', true)
    .order('due_at', { ascending: true });

  if (error) throw new Error(`Failed to fetch review queue: ${error.message}`);
  return (data || []) as any[];
}

