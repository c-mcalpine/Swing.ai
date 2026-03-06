-- Ensure review_completion has completion_fingerprint and the RPC exists.
-- Run this in Supabase SQL Editor if submit-review-result fails with
-- "Could not find the function public.upsert_review_completion(...)".
--
-- Prerequisite: public.review_completion table must exist. If it does not,
-- run 20260125_review_completion_idempotency.sql first (creates table + policies).

-- 1) Add completion_fingerprint if table exists but column is missing
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'review_completion') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'review_completion' AND column_name = 'completion_fingerprint') THEN
      ALTER TABLE public.review_completion ADD COLUMN completion_fingerprint text;
      UPDATE public.review_completion SET completion_fingerprint = to_char(occurred_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') WHERE completion_fingerprint IS NULL;
      ALTER TABLE public.review_completion ALTER COLUMN completion_fingerprint SET NOT NULL;
    END IF;
  END IF;
END $$;

-- 2) Drop old constraint if present (e.g. day-based)
ALTER TABLE public.review_completion DROP CONSTRAINT IF EXISTS review_completion_day_unique;

-- 3) Add fingerprint unique constraint if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'review_completion_fingerprint_unique'
    AND conrelid = 'public.review_completion'::regclass
  ) THEN
    ALTER TABLE public.review_completion
    ADD CONSTRAINT review_completion_fingerprint_unique
    UNIQUE (user_id, item_type, item_id, completion_fingerprint);
  END IF;
END $$;

-- 4) Create the RPC the edge function calls
CREATE OR REPLACE FUNCTION public.upsert_review_completion(
  p_user_id uuid,
  p_item_type text,
  p_item_id bigint,
  p_issue_slug text,
  p_score numeric,
  p_duration_min integer,
  p_client_event_id text,
  p_completion_fingerprint text
)
RETURNS TABLE (
  id bigint,
  occurred_at timestamp with time zone,
  is_new boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inserted_id bigint;
  v_inserted_at timestamp with time zone;
  v_existing_id bigint;
  v_existing_at timestamp with time zone;
BEGIN
  BEGIN
    INSERT INTO public.review_completion (
      user_id, item_type, item_id, issue_slug,
      score, duration_min, client_event_id, completion_fingerprint
    )
    VALUES (
      p_user_id, p_item_type, p_item_id, p_issue_slug,
      p_score, p_duration_min, p_client_event_id, p_completion_fingerprint
    )
    ON CONFLICT ON CONSTRAINT review_completion_fingerprint_unique DO NOTHING
    RETURNING review_completion.id, review_completion.occurred_at
    INTO v_inserted_id, v_inserted_at;

    IF v_inserted_id IS NOT NULL THEN
      RETURN QUERY SELECT v_inserted_id, v_inserted_at, true;
      RETURN;
    END IF;
  EXCEPTION
    WHEN unique_violation THEN
      NULL;
  END;

  IF v_inserted_id IS NOT NULL THEN
    RETURN QUERY SELECT v_inserted_id, v_inserted_at, true;
    RETURN;
  END IF;

  IF p_client_event_id IS NOT NULL THEN
    SELECT rc.id, rc.occurred_at INTO v_existing_id, v_existing_at
    FROM public.review_completion rc
    WHERE rc.client_event_id = p_client_event_id
    LIMIT 1;
  END IF;

  IF v_existing_id IS NULL THEN
    SELECT rc.id, rc.occurred_at INTO v_existing_id, v_existing_at
    FROM public.review_completion rc
    WHERE rc.user_id = p_user_id
      AND rc.item_type = p_item_type
      AND rc.item_id = p_item_id
      AND rc.completion_fingerprint = p_completion_fingerprint
    LIMIT 1;
  END IF;

  IF v_existing_id IS NOT NULL THEN
    RETURN QUERY SELECT v_existing_id, v_existing_at, false;
  ELSE
    RETURN;
  END IF;
END;
$$;
