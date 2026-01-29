/**
 * Utility functions for handling review completions from drill/lesson screens.
 * Call these when a user marks a drill or lesson as complete.
 */
import { recordDrillCompletion, recordLessonCompletion } from '../api/drillCompletion';
import { submitSmartReviewResult } from '../api/smartReview';
import type { SmartReviewPlanItem } from '../api/smartReview';

/**
 * Marks a Smart Review item as complete.
 * Use this when completing an item that came from the Smart Review plan.
 */
export async function completeReviewItem(
  item: SmartReviewPlanItem,
  score: number = 0.7,
  durationMin?: number | null
): Promise<void> {
  const clientEventId = crypto.randomUUID();

  await submitSmartReviewResult({
    item_type: item.item_type,
    item_id: item.item_id,
    issue_slug: item.issue_slug ?? null,
    score,
    duration_min: durationMin ?? item.minutes ?? null,
    client_event_id: clientEventId,
  });
}

/**
 * Marks a drill as complete (for organic completions).
 * Use this when a user completes a drill outside of Smart Review.
 */
export async function completeDrill(
  drillId: number,
  score: number = 0.7,
  durationMin?: number | null,
  issueSlug?: string | null
): Promise<void> {
  await recordDrillCompletion({
    drillId,
    score,
    durationMin,
    issueSlug,
  });
}

/**
 * Marks a lesson as complete (for organic completions).
 * Use this when a user completes a lesson outside of Smart Review.
 */
export async function completeLesson(
  lessonId: number,
  score: number = 0.7,
  durationMin?: number | null,
  issueSlug?: string | null
): Promise<void> {
  await recordLessonCompletion({
    lessonId,
    score,
    durationMin,
    issueSlug,
  });
}

