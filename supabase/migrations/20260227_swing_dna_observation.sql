-- Swing DNA: per-swing observations and smoothed profile update
-- Observations feed the profile's overall_score and 6 dimension scores (tempo, speed, plane, rotation, balance, power).
-- Updates use prior history so scores don't jump wildly (capped delta + optional EMA).

-- Table: one row per analyzed swing with that swing's "raw" DNA (0-100 per dimension)
CREATE TABLE IF NOT EXISTS public.swing_dna_observation (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  capture_id bigint NOT NULL,
  overall smallint NOT NULL,
  tempo smallint NOT NULL,
  speed smallint NOT NULL,
  plane smallint NOT NULL,
  rotation smallint NOT NULL,
  balance smallint NOT NULL,
  power smallint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT swing_dna_observation_pkey PRIMARY KEY (id),
  CONSTRAINT swing_dna_observation_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT swing_dna_observation_capture_id_fkey FOREIGN KEY (capture_id) REFERENCES public.swing_capture(id)
);

CREATE INDEX IF NOT EXISTS idx_swing_dna_observation_user_created
  ON public.swing_dna_observation (user_id, created_at DESC);

COMMENT ON TABLE public.swing_dna_observation IS 'Per-swing DNA scores (0-100) before smoothing; used to update profile with history-aware logic.';

-- RPC: insert observation and update profile with capped, history-aware deltas.
-- Each dimension can move at most max_step points per swing (e.g. 8) so one swing doesn't cause huge jumps.
-- new_display = old_display + clamp(alpha * (raw - old_display), -max_step, max_step), then clamp to 0-100.
CREATE OR REPLACE FUNCTION public.apply_swing_dna_update(
  p_user_id uuid,
  p_capture_id bigint,
  p_raw_overall smallint,
  p_raw_tempo smallint,
  p_raw_speed smallint,
  p_raw_plane smallint,
  p_raw_rotation smallint,
  p_raw_balance smallint,
  p_raw_power smallint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alpha numeric := 0.25;
  v_max_step smallint := 8;
  v_cur record;
  v_new_overall smallint;
  v_new_tempo smallint;
  v_new_speed smallint;
  v_new_plane smallint;
  v_new_rotation smallint;
  v_new_balance smallint;
  v_new_power smallint;
BEGIN
  -- Clamp raw inputs to 0-100
  p_raw_overall := least(100, greatest(0, p_raw_overall));
  p_raw_tempo   := least(100, greatest(0, p_raw_tempo));
  p_raw_speed   := least(100, greatest(0, p_raw_speed));
  p_raw_plane   := least(100, greatest(0, p_raw_plane));
  p_raw_rotation := least(100, greatest(0, p_raw_rotation));
  p_raw_balance := least(100, greatest(0, p_raw_balance));
  p_raw_power   := least(100, greatest(0, p_raw_power));

  -- 1) Insert observation for history
  INSERT INTO public.swing_dna_observation (
    user_id, capture_id, overall, tempo, speed, plane, rotation, balance, power
  ) VALUES (
    p_user_id, p_capture_id,
    p_raw_overall, p_raw_tempo, p_raw_speed, p_raw_plane, p_raw_rotation, p_raw_balance, p_raw_power
  );

  -- 2) Get current profile DNA (may be null for new users)
  SELECT overall_score, tempo_score, speed_score, plane_score, rotation_score, balance_score, power_score
  INTO v_cur
  FROM public.profiles
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- 3) Compute new value = old + clamp(alpha * (raw - old), -max_step, max_step), then clamp 0-100
  --    If old is null, use raw as initial.
  v_new_overall := apply_dna_delta(coalesce(v_cur.overall_score, p_raw_overall)::numeric, p_raw_overall::numeric, v_alpha, v_max_step);
  v_new_tempo   := apply_dna_delta(coalesce(v_cur.tempo_score, p_raw_tempo)::numeric, p_raw_tempo::numeric, v_alpha, v_max_step);
  v_new_speed   := apply_dna_delta(coalesce(v_cur.speed_score, p_raw_speed)::numeric, p_raw_speed::numeric, v_alpha, v_max_step);
  v_new_plane   := apply_dna_delta(coalesce(v_cur.plane_score, p_raw_plane)::numeric, p_raw_plane::numeric, v_alpha, v_max_step);
  v_new_rotation := apply_dna_delta(coalesce(v_cur.rotation_score, p_raw_rotation)::numeric, p_raw_rotation::numeric, v_alpha, v_max_step);
  v_new_balance := apply_dna_delta(coalesce(v_cur.balance_score, p_raw_balance)::numeric, p_raw_balance::numeric, v_alpha, v_max_step);
  v_new_power   := apply_dna_delta(coalesce(v_cur.power_score, p_raw_power)::numeric, p_raw_power::numeric, v_alpha, v_max_step);

  -- 4) Update profile
  UPDATE public.profiles
  SET
    overall_score = v_new_overall,
    tempo_score = v_new_tempo,
    speed_score = v_new_speed,
    plane_score = v_new_plane,
    rotation_score = v_new_rotation,
    balance_score = v_new_balance,
    power_score = v_new_power,
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- Helper: one dimension update with alpha and max_step
CREATE OR REPLACE FUNCTION public.apply_dna_delta(
  p_old numeric,
  p_raw numeric,
  p_alpha numeric,
  p_max_step smallint
)
RETURNS smallint
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_delta numeric;
  v_new numeric;
BEGIN
  v_delta := p_alpha * (p_raw - p_old);
  v_delta := least(p_max_step::numeric, greatest(-(p_max_step::numeric), v_delta));
  v_new := p_old + v_delta;
  v_new := least(100, greatest(0, round(v_new)));
  RETURN v_new::smallint;
END;
$$;

COMMENT ON FUNCTION public.apply_swing_dna_update IS 'Inserts swing_dna_observation and updates profile DNA with capped, smoothed deltas (no big jumps per swing).';
COMMENT ON FUNCTION public.apply_dna_delta IS 'Helper: new = old + clamp(alpha*(raw-old), -max_step, max_step), clamped 0-100.';
