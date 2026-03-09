-- =========================================================
-- DEPRECATION NOTICE: user_curriculum_queue + build_curriculum_queue
-- =========================================================
--
-- As of this migration the unit-based curriculum engine is authoritative:
--
--   build_user_curriculum()  -> user_curriculum_unit + user_curriculum_unit_item
--   daily-plan edge fn       -> reads user_curriculum_unit first, falls back to
--                               user_curriculum_queue only when no unit rows exist
--   submit-review-result     -> writes user_curriculum_unit_item on completion
--
-- user_curriculum_queue and build_curriculum_queue are LEGACY.
--   - Tables and function are kept intact for the legacy fallback path.
--   - build_curriculum_queue is still called by swing-analysis alongside
--     build_user_curriculum so that users without unit rows (pre-migration)
--     continue to receive a daily plan via the fallback.
--   - These artifacts should be removed once all active users have unit rows
--     (i.e., after they have each recorded at least one new swing post-migration).
--
-- Do NOT add new features to user_curriculum_queue or build_curriculum_queue.
-- =========================================================

COMMENT ON TABLE public.user_curriculum_queue IS
  '[DEPRECATED] Legacy per-user lesson queue. '
  'Superseded by user_curriculum_unit + user_curriculum_unit_item. '
  'Kept for the daily-plan fallback path until all users have unit assignments.';

COMMENT ON FUNCTION public.build_curriculum_queue(bigint) IS
  '[DEPRECATED] Populates the legacy user_curriculum_queue from swing_analysis.issue_scores. '
  'Superseded by build_user_curriculum(). '
  'Still called by the swing-analysis edge function as a safety fallback. '
  'Remove once all active users have been migrated to the unit-based plan.';
