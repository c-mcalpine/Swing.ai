-- Migration: Add review_completion table with proper idempotency
-- Run this in Supabase SQL Editor

-- ============================================
-- CREATE REVIEW_COMPLETION TABLE
-- ============================================
-- Immutable completion ledger with two-layer idempotency

CREATE TABLE IF NOT EXISTS public.review_completion (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  item_type text NOT NULL,
  item_id bigint NOT NULL,
  issue_slug text,
  score numeric NOT NULL CHECK (score >= 0 AND score <= 1),
  duration_min integer,
  -- Event-level idempotency: exact replay protection
  client_event_id text UNIQUE,
  -- Semantic de-dupe: one completion per day per item per user
  completion_fingerprint text NOT NULL,
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT review_completion_pkey PRIMARY KEY (id),
  CONSTRAINT review_completion_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  -- Semantic de-dupe constraint: one completion per day per item per user
  CONSTRAINT review_completion_fingerprint_unique UNIQUE (user_id, item_type, item_id, completion_fingerprint)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS review_completion_fingerprint_idx 
ON public.review_completion(completion_fingerprint);

CREATE INDEX IF NOT EXISTS review_completion_client_event_id_idx 
ON public.review_completion(client_event_id) 
WHERE client_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS review_completion_user_item_idx 
ON public.review_completion(user_id, item_type, item_id, occurred_at);

-- ============================================
-- CREATE USER_REVIEW_ITEM TABLE (if not exists)
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_review_item (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  item_type text NOT NULL,
  item_id bigint NOT NULL,
  issue_slug text,
  interval_days integer NOT NULL DEFAULT 1,
  ease numeric NOT NULL DEFAULT 2.2,
  success_streak integer NOT NULL DEFAULT 0,
  fail_count integer NOT NULL DEFAULT 0,
  reps integer NOT NULL DEFAULT 0,
  due_at timestamp with time zone NOT NULL,
  last_reviewed_at timestamp with time zone,
  last_score numeric,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_review_item_pkey PRIMARY KEY (id),
  CONSTRAINT user_review_item_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  -- One review item per user+item combination
  CONSTRAINT user_review_item_unique UNIQUE (user_id, item_type, item_id)
);

-- Index for due date queries
CREATE INDEX IF NOT EXISTS user_review_item_due_idx 
ON public.user_review_item(user_id, due_at) 
WHERE is_active = true;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.review_completion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own completions" ON public.review_completion;
CREATE POLICY "Users can view own completions" ON public.review_completion
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert completions" ON public.review_completion;
CREATE POLICY "Service role can insert completions" ON public.review_completion
  FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.user_review_item ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own review items" ON public.user_review_item;
CREATE POLICY "Users can view own review items" ON public.user_review_item
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own review items" ON public.user_review_item;
CREATE POLICY "Users can insert own review items" ON public.user_review_item
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own review items" ON public.user_review_item;
CREATE POLICY "Users can update own review items" ON public.user_review_item
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- RPC FUNCTION: Atomic completion insert with idempotency
-- ============================================
-- Uses INSERT ... ON CONFLICT DO NOTHING in a single atomic operation
-- Returns the inserted row if new, or existing row if conflict
-- This is atomic and prevents race conditions

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
  -- Single atomic INSERT with ON CONFLICT DO NOTHING
  -- Handle conflict on fingerprint constraint (semantic de-dupe)
  -- If client_event_id also conflicts, it will raise unique_violation which we catch
  BEGIN
    INSERT INTO public.review_completion (
      user_id,
      item_type,
      item_id,
      issue_slug,
      score,
      duration_min,
      client_event_id,
      completion_fingerprint
    )
    VALUES (
      p_user_id,
      p_item_type,
      p_item_id,
      p_issue_slug,
      p_score,
      p_duration_min,
      p_client_event_id,
      p_completion_fingerprint
    )
    -- Handle conflict on fingerprint (semantic de-dupe - one per day per item)
    ON CONFLICT ON CONSTRAINT review_completion_fingerprint_unique DO NOTHING
    RETURNING review_completion.id, review_completion.occurred_at
    INTO v_inserted_id, v_inserted_at;

    -- If insert succeeded (no conflict on fingerprint), return new row
    IF v_inserted_id IS NOT NULL THEN
      RETURN QUERY SELECT v_inserted_id, v_inserted_at, true;
      RETURN;
    END IF;
  EXCEPTION
    WHEN unique_violation THEN
      -- client_event_id conflict (exact replay) - will fetch existing below
      NULL;
  END;

  -- If insert succeeded (no conflict), return new row
  IF v_inserted_id IS NOT NULL THEN
    RETURN QUERY SELECT v_inserted_id, v_inserted_at, true;
    RETURN;
  END IF;

  -- Insert failed due to conflict - fetch existing row
  -- Try by client_event_id first (exact replay) if provided
  IF p_client_event_id IS NOT NULL THEN
    SELECT rc.id, rc.occurred_at INTO v_existing_id, v_existing_at
    FROM public.review_completion rc
    WHERE rc.client_event_id = p_client_event_id
    LIMIT 1;
  END IF;

  -- If not found by client_event_id, try by fingerprint (semantic duplicate)
  IF v_existing_id IS NULL THEN
    SELECT rc.id, rc.occurred_at INTO v_existing_id, v_existing_at
    FROM public.review_completion rc
    WHERE rc.user_id = p_user_id
      AND rc.item_type = p_item_type
      AND rc.item_id = p_item_id
      AND rc.completion_fingerprint = p_completion_fingerprint
    LIMIT 1;
  END IF;

  -- Return existing row (conflict - already processed)
  IF v_existing_id IS NOT NULL THEN
    RETURN QUERY SELECT v_existing_id, v_existing_at, false;
  ELSE
    -- Should not happen, but return empty
    RETURN;
  END IF;
END;
$$;

