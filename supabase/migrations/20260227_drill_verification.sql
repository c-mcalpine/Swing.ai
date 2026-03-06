-- Add verification columns to drill table
ALTER TABLE drill
  ADD COLUMN IF NOT EXISTS verification_type text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS verification_config jsonb;

-- Constrain verification_type to known values
ALTER TABLE drill
  ADD CONSTRAINT drill_verification_type_check
    CHECK (verification_type IN ('none', 'reps', 'hold', 'timer'));

-- drill_coach_session: stores per-session telemetry for on-device verified drills
-- No video is uploaded; only compact numeric telemetry is stored.
CREATE TABLE IF NOT EXISTS drill_coach_session (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  drill_id          bigint NOT NULL REFERENCES drill(id) ON DELETE CASCADE,
  started_at        timestamptz NOT NULL DEFAULT now(),
  finished_at       timestamptz,
  duration_sec      integer,
  reps_attempted    integer DEFAULT 0,
  reps_valid        integer DEFAULT 0,
  avg_quality       numeric(4,2),
  hold_ms           integer,
  verification_type text NOT NULL DEFAULT 'none',
  telemetry         jsonb,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- RLS: users can only see and write their own sessions
ALTER TABLE drill_coach_session ENABLE ROW LEVEL SECURITY;

CREATE POLICY drill_coach_session_owner ON drill_coach_session
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index: look up sessions by user + drill quickly
CREATE INDEX IF NOT EXISTS drill_coach_session_user_drill_idx
  ON drill_coach_session (user_id, drill_id, created_at DESC);
