/**
 * Drill/lesson completion instrumentation.
 * Updates user_review_item when drills are completed organically (not just via Smart Review).
 * 
 * Always calls the edge function - server decides what to update based on review schedule
 * and issue targeting logic. This prevents client/server logic divergence.
 */
import { submitSmartReviewResult } from './smartReview';

/**
 * Records a drill completion and updates the review schedule.
 * Call this whenever a user completes a drill session organically.
 * 
 * The edge function will:
 * - Create review item if it should exist
 * - Update schedule if it exists
 * - Update user_issue_state.last_targeted_at if drill maps to issue
 * 
 * @param drillId - The drill ID that was completed
 * @param score - Performance score 0..1 (default 0.7 for organic completion)
 * @param durationMin - Duration in minutes
 * @param issueSlug - Optional issue slug if this drill targets a specific issue
 */
export async function recordDrillCompletion(opts: {
  drillId: number;
  score?: number;
  durationMin?: number;
  issueSlug?: string | null;
}): Promise<void> {
  // Generate idempotency key to prevent duplicate completions
  const clientEventId = crypto.randomUUID();

  await submitSmartReviewResult({
    item_type: 'drill',
    item_id: opts.drillId,
    issue_slug: opts.issueSlug ?? null,
    score: opts.score ?? 0.7, // Default score for organic completion
    duration_min: opts.durationMin ?? null,
    client_event_id: clientEventId,
  });
}

/**
 * Records a lesson completion and updates the review schedule.
 * 
 * The edge function handles all logic - client just reports completion.
 */
export async function recordLessonCompletion(opts: {
  lessonId: number;
  score?: number;
  durationMin?: number;
  issueSlug?: string | null;
}): Promise<void> {
  // Generate idempotency key to prevent duplicate completions
  const clientEventId = crypto.randomUUID();

  await submitSmartReviewResult({
    item_type: 'lesson',
    item_id: opts.lessonId,
    issue_slug: opts.issueSlug ?? null,
    score: opts.score ?? 0.7,
    duration_min: opts.durationMin ?? null,
    client_event_id: clientEventId,
  });
}

