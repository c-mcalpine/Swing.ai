-- build_user_curriculum
-- Populates user_curriculum_unit and user_curriculum_unit_item from swing_analysis.issue_scores.
--
-- Called by the swing-analysis edge function after build_curriculum_queue.
-- build_curriculum_queue continues to power the legacy daily-plan (HomeScreen).
-- build_user_curriculum powers the new unit-based MyPlanScreen.
--
-- Logic:
--   1. Corrective units: map issue_scores slugs -> swing_error -> curriculum_unit.primary_error_id
--      Priority score = issue severity (0..1) from issue_scores.
--   2. Foundation units: assign all active foundation curriculum_units to the user if not yet assigned.
--      Priority score = 0 (always lower than corrective so corrective sorts first).
--   3. Unit item rows: for each newly assigned unit, insert user_curriculum_unit_item rows
--      (one per curriculum_unit_item, status = 'not_started').
--   4. Activate the highest-priority unit that is still 'queued' if no 'active' unit exists.

CREATE OR REPLACE FUNCTION public.build_user_curriculum(p_capture_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id         uuid;
  v_issue_slug      text;
  v_issue_score     numeric;
  v_error_id        bigint;
  v_unit_id         bigint;
  v_active_unit_id  bigint;
BEGIN
  -- ── 0) Resolve user from capture ──────────────────────────────────────────
  SELECT sc.user_id INTO v_user_id
  FROM public.swing_capture sc
  WHERE sc.id = p_capture_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'build_user_curriculum: capture not found: %', p_capture_id;
  END IF;

  -- ── 1) Corrective units from issue_scores ─────────────────────────────────
  -- Walk each (slug, severity) pair sorted by severity desc.
  FOR v_issue_slug, v_issue_score IN
    SELECT t.key, (t.value::numeric)
    FROM jsonb_each(
      (SELECT sa.issue_scores FROM public.swing_analysis sa WHERE sa.capture_id = p_capture_id)
    ) AS t(key, value)
    ORDER BY (t.value::numeric) DESC NULLS LAST
  LOOP
    -- Resolve error id
    SELECT e.id INTO v_error_id
    FROM public.swing_error e
    WHERE e.slug = v_issue_slug;

    IF v_error_id IS NULL THEN
      CONTINUE; -- unknown slug, skip
    END IF;

    -- Find the corrective curriculum_unit for this error
    SELECT cu.id INTO v_unit_id
    FROM public.curriculum_unit cu
    WHERE cu.primary_error_id = v_error_id
      AND cu.unit_type = 'corrective'
      AND cu.is_active = true
    LIMIT 1;

    IF v_unit_id IS NULL THEN
      CONTINUE; -- no unit mapped to this error yet, skip
    END IF;

    -- Assign unit to user (upsert: preserve active/completed status on re-analysis)
    INSERT INTO public.user_curriculum_unit (
      user_id, unit_id, status, priority_score,
      assigned_reason, created_at, updated_at
    )
    VALUES (
      v_user_id,
      v_unit_id,
      'queued',
      v_issue_score,
      jsonb_build_object('source', 'swing_analysis', 'capture_id', p_capture_id, 'issue_slug', v_issue_slug),
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id, unit_id) DO UPDATE
      SET priority_score  = EXCLUDED.priority_score,
          assigned_reason = EXCLUDED.assigned_reason,
          updated_at      = NOW()
      -- Never demote active/completed units back to queued on re-analysis
      WHERE public.user_curriculum_unit.status NOT IN ('active', 'completed');

    -- Seed unit item progress rows for every item in this unit (idempotent)
    INSERT INTO public.user_curriculum_unit_item (
      user_id, unit_item_id, status, created_at, updated_at
    )
    SELECT
      v_user_id,
      cui.id,
      'not_started',
      NOW(),
      NOW()
    FROM public.curriculum_unit_item cui
    WHERE cui.unit_id = v_unit_id
    ON CONFLICT (user_id, unit_item_id) DO NOTHING;

  END LOOP;

  -- ── 2) Foundation units: assign all active foundation units if not yet held ─
  FOR v_unit_id IN
    SELECT cu.id
    FROM public.curriculum_unit cu
    WHERE cu.unit_type = 'foundation'
      AND cu.is_active = true
    ORDER BY cu.sort_order ASC
  LOOP
    INSERT INTO public.user_curriculum_unit (
      user_id, unit_id, status, priority_score,
      assigned_reason, created_at, updated_at
    )
    VALUES (
      v_user_id,
      v_unit_id,
      'queued',
      0,  -- always lower than corrective units so corrective sorts first
      jsonb_build_object('source', 'foundation_default', 'capture_id', p_capture_id),
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id, unit_id) DO NOTHING; -- preserve existing status/priority

    -- Seed unit item progress rows (idempotent)
    INSERT INTO public.user_curriculum_unit_item (
      user_id, unit_item_id, status, created_at, updated_at
    )
    SELECT
      v_user_id,
      cui.id,
      'not_started',
      NOW(),
      NOW()
    FROM public.curriculum_unit_item cui
    WHERE cui.unit_id = v_unit_id
    ON CONFLICT (user_id, unit_item_id) DO NOTHING;

  END LOOP;

  -- ── 3) Activate highest-priority queued unit if none active ───────────────
  SELECT ucu.unit_id INTO v_active_unit_id
  FROM public.user_curriculum_unit ucu
  WHERE ucu.user_id = v_user_id
    AND ucu.status = 'active'
  LIMIT 1;

  IF v_active_unit_id IS NULL THEN
    -- Pick the queued unit with the highest priority_score; corrective before foundation
    UPDATE public.user_curriculum_unit
    SET status      = 'active',
        started_at  = NOW(),
        updated_at  = NOW()
    WHERE (user_id, unit_id) = (
      SELECT ucu.user_id, ucu.unit_id
      FROM public.user_curriculum_unit ucu
      WHERE ucu.user_id = v_user_id
        AND ucu.status = 'queued'
      ORDER BY ucu.priority_score DESC NULLS LAST, ucu.created_at ASC
      LIMIT 1
    );

    SELECT ucu.unit_id INTO v_active_unit_id
    FROM public.user_curriculum_unit ucu
    WHERE ucu.user_id = v_user_id
      AND ucu.status = 'active'
    LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'ok',             true,
    'user_id',        v_user_id,
    'active_unit_id', v_active_unit_id
  );
END;
$$;

COMMENT ON FUNCTION public.build_user_curriculum(bigint) IS
  'Populates user_curriculum_unit + user_curriculum_unit_item from swing_analysis.issue_scores. '
  'Corrective units are mapped via swing_error.primary_error_id; all foundation units are always assigned. '
  'SECURITY DEFINER so the edge function (authenticated invoker) can write these tables without RLS blocking.';
