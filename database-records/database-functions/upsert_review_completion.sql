-- database_records/database_functions/upsert_review_completion.sql
DECLARE
  v_id bigint;
  v_at timestamptz;
BEGIN
  -- 1) Try insert; de-dupe is enforced by unique constraints
  BEGIN
    INSERT INTO public.review_completion (
      user_id, item_type, item_id, issue_slug,
      score, duration_min, client_event_id, occurred_at
    )
    VALUES (
      p_user_id, p_item_type, p_item_id, p_issue_slug,
      p_score, p_duration_min, p_client_event_id, p_occurred_at
    )
    ON CONFLICT ON CONSTRAINT review_completion_day_unique DO NOTHING
    RETURNING review_completion.id, review_completion.occurred_at
    INTO v_id, v_at;

    IF v_id IS NOT NULL THEN
      RETURN QUERY SELECT v_id, v_at, true;
      RETURN;
    END IF;

  EXCEPTION WHEN unique_violation THEN
    -- Most likely client_event_id conflict; fall through to fetch existing
    NULL;
  END;

  -- 2) Exact replay by client_event_id
  IF p_client_event_id IS NOT NULL THEN
    SELECT rc.id, rc.occurred_at
      INTO v_id, v_at
    FROM public.review_completion rc
    WHERE rc.client_event_id = p_client_event_id
    LIMIT 1;

    IF v_id IS NOT NULL THEN
      RETURN QUERY SELECT v_id, v_at, false;
      RETURN;
    END IF;
  END IF;

  -- 3) Semantic duplicate by day uniqueness (fetch the existing row for today)
  SELECT rc.id, rc.occurred_at
    INTO v_id, v_at
  FROM public.review_completion rc
  WHERE rc.user_id = p_user_id
    AND rc.item_type = p_item_type
    AND rc.item_id = p_item_id
    AND rc.completion_day = ((p_occurred_at AT TIME ZONE 'UTC')::date)
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    RETURN QUERY SELECT v_id, v_at, false;
  END IF;

  RETURN;
END;
