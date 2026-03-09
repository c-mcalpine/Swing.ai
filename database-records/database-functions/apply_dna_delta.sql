
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
