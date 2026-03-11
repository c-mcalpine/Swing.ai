-- Add duration_min to coaching_cue to align naming with lesson.duration_min
-- Used by award_xp for duration-bonus XP calculation on cue completions.

ALTER TABLE public.coaching_cue
  ADD COLUMN IF NOT EXISTS duration_min integer NOT NULL DEFAULT 3;

COMMENT ON COLUMN public.coaching_cue.duration_min IS
  'Suggested practice time in minutes. Used for duration-bonus XP calculation.';
