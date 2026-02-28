-- Ensure at least one lesson has primary_error_id set so build_curriculum_queue can fill user_curriculum_queue.
-- Run this in Supabase SQL Editor if your queue stays empty after analysis (issue_scores have slugs but no lesson targets them).

-- 1) See current state: which errors exist and which lessons have primary_error_id
SELECT e.id AS error_id, e.slug AS error_slug, l.id AS lesson_id, l.title AS lesson_title, l.primary_error_id
FROM swing_error e
LEFT JOIN lesson l ON l.primary_error_id = e.id
ORDER BY e.slug;

-- 2) Fix: set one lesson to target "over-the-top" (or "casting") so the queue can get rows.
--    Pick the lesson you want as the first recommended lesson (e.g. fix-the-slice).
UPDATE lesson
SET primary_error_id = (SELECT id FROM swing_error WHERE slug = 'over-the-top' LIMIT 1)
WHERE slug = 'fix-the-slice'
  AND (primary_error_id IS NULL OR primary_error_id <> (SELECT id FROM swing_error WHERE slug = 'over-the-top' LIMIT 1));

-- If you don't have a lesson with slug 'fix-the-slice', set any one lesson to target an error that appears in your issue_scores, e.g.:
-- UPDATE lesson SET primary_error_id = (SELECT id FROM swing_error WHERE slug = 'over-the-top' LIMIT 1) WHERE id = (SELECT id FROM lesson LIMIT 1);

-- 3) Optional: backfill the queue for your latest capture so you don't need to record again.
--    Replace <CAPTURE_ID> with the capture_id from your last swing (from swing_analysis or swing_capture).
-- SELECT build_curriculum_queue(<CAPTURE_ID>);
