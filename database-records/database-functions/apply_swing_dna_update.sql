
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
