-- Lesson verification (camera + timer): same pattern as drill.
-- All lessons and drills use verification_type so the app always requires camera (timer minimum).

-- ============================================
-- 1) Add verification columns to lesson
-- ============================================
ALTER TABLE public.lesson
  ADD COLUMN IF NOT EXISTS verification_type text NOT NULL DEFAULT 'timer',
  ADD COLUMN IF NOT EXISTS verification_config jsonb;

-- Constrain to same values as drill
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lesson_verification_type_check'
    AND conrelid = 'public.lesson'::regclass
  ) THEN
    ALTER TABLE public.lesson
      ADD CONSTRAINT lesson_verification_type_check
      CHECK (verification_type IN ('none', 'reps', 'hold', 'timer'));
  END IF;
END $$;

-- ============================================
-- 2) lesson_coach_session (telemetry for lesson verification)
-- ============================================
CREATE TABLE IF NOT EXISTS public.lesson_coach_session (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id         bigint NOT NULL REFERENCES public.lesson(id) ON DELETE CASCADE,
  started_at        timestamptz NOT NULL DEFAULT now(),
  finished_at       timestamptz,
  duration_sec      integer,
  verification_type text NOT NULL DEFAULT 'timer',
  telemetry         jsonb,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_coach_session ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lesson_coach_session_owner ON public.lesson_coach_session;
CREATE POLICY lesson_coach_session_owner ON public.lesson_coach_session
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS lesson_coach_session_user_lesson_idx
  ON public.lesson_coach_session (user_id, lesson_id, created_at DESC);

-- ============================================
-- 3) Set all lessons to timer verification
-- ============================================
UPDATE public.lesson
SET
  verification_type = 'timer',
  verification_config = jsonb_build_object(
    'timer', jsonb_build_object(
      'min_duration_ms', (COALESCE(duration_min, 3) * 60 * 1000)
    ),
    'min_confidence', 0.4
  )
WHERE verification_config IS NULL
   OR verification_config = 'null'::jsonb;

-- ============================================
-- 4) Set all drills to timer verification (if still none)
-- ============================================
UPDATE public.drill
SET
  verification_type = 'timer',
  verification_config = jsonb_build_object(
    'timer', jsonb_build_object(
      'min_duration_ms', (COALESCE(min_duration_min, 3) * 60 * 1000)
    ),
    'min_confidence', 0.4
  )
WHERE verification_type = 'none';
