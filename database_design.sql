-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.achievement (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon text,
  color text,
  unlock_criteria jsonb,
  sort_order integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT achievement_pkey PRIMARY KEY (id)
);
CREATE TABLE public.challenge (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  challenge_type text NOT NULL,
  metric_type text NOT NULL,
  target_value numeric NOT NULL,
  reward_xp integer NOT NULL DEFAULT 0,
  rules jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT challenge_pkey PRIMARY KEY (id)
);
CREATE TABLE public.challenge_instance (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  challenge_id bigint NOT NULL,
  starts_at timestamp with time zone NOT NULL,
  ends_at timestamp with time zone NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT challenge_instance_pkey PRIMARY KEY (id),
  CONSTRAINT challenge_instance_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenge(id)
);
CREATE TABLE public.challenge_participation (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  challenge_instance_id bigint NOT NULL,
  status text NOT NULL DEFAULT 'joined'::text,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT challenge_participation_pkey PRIMARY KEY (id),
  CONSTRAINT challenge_participation_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT challenge_participation_challenge_instance_id_fkey FOREIGN KEY (challenge_instance_id) REFERENCES public.challenge_instance(id)
);
CREATE TABLE public.challenge_progress (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  challenge_instance_id bigint NOT NULL,
  progress_value numeric NOT NULL DEFAULT 0,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  last_updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT challenge_progress_pkey PRIMARY KEY (id),
  CONSTRAINT challenge_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT challenge_progress_challenge_instance_id_fkey FOREIGN KEY (challenge_instance_id) REFERENCES public.challenge_instance(id)
);
CREATE TABLE public.coaching_cue (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  slug text NOT NULL UNIQUE,
  text text NOT NULL,
  phase_id bigint,
  mechanic_id bigint,
  level integer,
  cue_type text,
  notes text,
  CONSTRAINT coaching_cue_pkey PRIMARY KEY (id),
  CONSTRAINT coaching_cue_phase_id_fkey FOREIGN KEY (phase_id) REFERENCES public.swing_phase(id),
  CONSTRAINT coaching_cue_mechanic_id_fkey FOREIGN KEY (mechanic_id) REFERENCES public.swing_mechanic(id)
);
CREATE TABLE public.cue_drill (
  cue_id bigint NOT NULL,
  drill_id bigint NOT NULL,
  CONSTRAINT cue_drill_pkey PRIMARY KEY (cue_id, drill_id),
  CONSTRAINT cue_drill_cue_id_fkey FOREIGN KEY (cue_id) REFERENCES public.coaching_cue(id),
  CONSTRAINT cue_drill_drill_id_fkey FOREIGN KEY (drill_id) REFERENCES public.drill(id)
);
CREATE TABLE public.cue_error (
  cue_id bigint NOT NULL,
  error_id bigint NOT NULL,
  CONSTRAINT cue_error_pkey PRIMARY KEY (cue_id, error_id),
  CONSTRAINT cue_error_cue_id_fkey FOREIGN KEY (cue_id) REFERENCES public.coaching_cue(id),
  CONSTRAINT cue_error_error_id_fkey FOREIGN KEY (error_id) REFERENCES public.swing_error(id)
);
CREATE TABLE public.drill (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  objective text,
  description text,
  tips text,
  difficulty integer,
  min_duration_min integer,
  environment text,
  equipment text,
  xp_reward integer,
  is_beginner_friendly boolean,
  CONSTRAINT drill_pkey PRIMARY KEY (id)
);
CREATE TABLE public.drill_error (
  drill_id bigint NOT NULL,
  error_id bigint NOT NULL,
  role text,
  weight numeric,
  notes text,
  CONSTRAINT drill_error_pkey PRIMARY KEY (drill_id, error_id),
  CONSTRAINT drill_error_drill_id_fkey FOREIGN KEY (drill_id) REFERENCES public.drill(id),
  CONSTRAINT drill_error_error_id_fkey FOREIGN KEY (error_id) REFERENCES public.swing_error(id)
);
CREATE TABLE public.drill_mechanic (
  drill_id bigint NOT NULL,
  mechanic_id bigint NOT NULL,
  role text,
  weight numeric,
  notes text,
  CONSTRAINT drill_mechanic_pkey PRIMARY KEY (drill_id, mechanic_id),
  CONSTRAINT drill_mechanic_drill_id_fkey FOREIGN KEY (drill_id) REFERENCES public.drill(id),
  CONSTRAINT drill_mechanic_mechanic_id_fkey FOREIGN KEY (mechanic_id) REFERENCES public.swing_mechanic(id)
);
CREATE TABLE public.error_mechanic (
  swing_mechanic_id bigint NOT NULL,
  swing_error_id bigint NOT NULL,
  role text,
  weight numeric,
  notes text,
  CONSTRAINT error_mechanic_pkey PRIMARY KEY (swing_mechanic_id, swing_error_id),
  CONSTRAINT error_mechanic_swing_mechanic_id_fkey FOREIGN KEY (swing_mechanic_id) REFERENCES public.swing_mechanic(id),
  CONSTRAINT error_mechanic_swing_error_id_fkey FOREIGN KEY (swing_error_id) REFERENCES public.swing_error(id)
);
CREATE TABLE public.issue_event (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  issue_slug text NOT NULL,
  delta numeric NOT NULL,
  source_type text NOT NULL,
  source_id bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT issue_event_pkey PRIMARY KEY (id),
  CONSTRAINT issue_event_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.lesson (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text,
  level integer,
  primary_phase_id bigint,
  lesson_type text NOT NULL,
  duration_min integer,
  is_course boolean DEFAULT false,
  tags text,
  primary_error_id bigint,
  CONSTRAINT lesson_pkey PRIMARY KEY (id),
  CONSTRAINT lesson_primary_phase_id_fkey FOREIGN KEY (primary_phase_id) REFERENCES public.swing_phase(id),
  CONSTRAINT lesson_primary_error_id_fkey FOREIGN KEY (primary_error_id) REFERENCES public.swing_error(id)
);
CREATE TABLE public.lesson_step (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  lesson_id bigint NOT NULL,
  step_order integer NOT NULL,
  step_type text NOT NULL,
  title text,
  body text,
  drill_id bigint,
  mechanic_id bigint,
  error_id bigint,
  estimated_min integer,
  CONSTRAINT lesson_step_pkey PRIMARY KEY (id),
  CONSTRAINT lesson_step_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lesson(id),
  CONSTRAINT lesson_step_drill_id_fkey FOREIGN KEY (drill_id) REFERENCES public.drill(id),
  CONSTRAINT lesson_step_mechanic_id_fkey FOREIGN KEY (mechanic_id) REFERENCES public.swing_mechanic(id),
  CONSTRAINT lesson_step_error_id_fkey FOREIGN KEY (error_id) REFERENCES public.swing_error(id)
);
CREATE TABLE public.mechanic_key_point (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  mechanic_id bigint NOT NULL,
  sort_order integer,
  point_type text,
  text text NOT NULL,
  CONSTRAINT mechanic_key_point_pkey PRIMARY KEY (id),
  CONSTRAINT mechanic_key_point_mechanic_id_fkey FOREIGN KEY (mechanic_id) REFERENCES public.swing_mechanic(id)
);
CREATE TABLE public.mechanic_tip (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  mechanic_id bigint NOT NULL,
  sort_order integer,
  tip_type text,
  text text NOT NULL,
  CONSTRAINT mechanic_tip_pkey PRIMARY KEY (id),
  CONSTRAINT mechanic_tip_mechanic_id_fkey FOREIGN KEY (mechanic_id) REFERENCES public.swing_mechanic(id)
);
CREATE TABLE public.practice_session (
  id bigint NOT NULL DEFAULT nextval('practice_session_id_seq'::regclass),
  user_id uuid NOT NULL,
  title text NOT NULL,
  swings_count integer,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  duration_min integer,
  grade text,
  grade_color text,
  avg_speed_mph numeric,
  thumbnail_url text,
  swing_diagnostic_id bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  lesson_id bigint,
  session_type text,
  CONSTRAINT practice_session_pkey PRIMARY KEY (id),
  CONSTRAINT practice_session_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT practice_session_swing_diagnostic_id_fkey FOREIGN KEY (swing_diagnostic_id) REFERENCES public.swing_diagnostic(id),
  CONSTRAINT practice_session_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lesson(id)
);
CREATE TABLE public.profiles (
  user_id uuid NOT NULL,
  username text NOT NULL UNIQUE,
  location text,
  member_since date,
  avatar_url text,
  badge text,
  level integer,
  rank_title text,
  xp integer DEFAULT 0,
  xp_to_next integer DEFAULT 0,
  next_rank_title text,
  overall_score integer,
  tempo_score integer,
  speed_score integer,
  plane_score integer,
  rotation_score integer,
  balance_score integer,
  power_score integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (user_id),
  CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.swing_analysis (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  capture_id bigint NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  -- Versioning fields for reproducibility
  model text NOT NULL,                              -- e.g., "gpt-5.2-mini"
  prompt_version text NOT NULL DEFAULT '1',         -- bump when prompt changes
  schema_version text NOT NULL DEFAULT '1',         -- bump when output schema changes
  input_fingerprint text,                           -- hash of frame ids + overlays + pose version
  -- Analysis results
  raw_json jsonb NOT NULL,
  issue_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  issue_confidence jsonb NOT NULL DEFAULT '{}'::jsonb, -- per-issue confidence scores
  mechanic_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  club_angle_refs jsonb NOT NULL DEFAULT '{}'::jsonb,
  overall_confidence numeric,                       -- 0..1 overall analysis confidence
  recommended_lesson_ids ARRAY,
  recommended_drill_ids ARRAY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT swing_analysis_pkey PRIMARY KEY (id),
  CONSTRAINT swing_analysis_capture_id_fkey FOREIGN KEY (capture_id) REFERENCES public.swing_capture(id),
  CONSTRAINT swing_analysis_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Index for querying by model/version for analysis comparisons
CREATE INDEX IF NOT EXISTS swing_analysis_version_idx 
ON public.swing_analysis(model, prompt_version, schema_version);
CREATE TABLE public.swing_capture (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'uploaded'::text,
  camera_angle text,
  environment text,
  pose_summary jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT swing_capture_pkey PRIMARY KEY (id),
  CONSTRAINT swing_capture_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.swing_diagnostic (
  id bigint NOT NULL DEFAULT nextval('swing_diagnostic_id_seq'::regclass),
  user_id uuid NOT NULL,
  video_url text,
  phase_scores jsonb,
  mechanic_scores jsonb,
  error_scores jsonb,
  recommended_lesson_ids ARRAY,
  recommended_drills jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT swing_diagnostic_pkey PRIMARY KEY (id),
  CONSTRAINT swing_diagnostic_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.swing_error (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  phase_id bigint,
  typical_miss text,
  description text,
  cause_notes text,
  fix text,
  severity_scale integer,
  CONSTRAINT swing_error_pkey PRIMARY KEY (id),
  CONSTRAINT swing_error_phase_id_fkey FOREIGN KEY (phase_id) REFERENCES public.swing_phase(id)
);
CREATE TABLE public.swing_frame (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  capture_id bigint NOT NULL,
  phase text NOT NULL,
  timestamp_ms integer,
  frame_path text NOT NULL,
  overlay_path text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT swing_frame_pkey PRIMARY KEY (id),
  CONSTRAINT swing_frame_capture_id_fkey FOREIGN KEY (capture_id) REFERENCES public.swing_capture(id)
);
CREATE TABLE public.swing_mechanic (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  phase_id bigint NOT NULL,
  category text,
  body_part text,
  mechanic_type text,
  statuc_or_dynamic text,
  difficulty integer,
  is_fundamental boolean,
  measurable boolean,
  description_short text,
  measurement_notes text,
  CONSTRAINT swing_mechanic_pkey PRIMARY KEY (id),
  CONSTRAINT swing_mechanic_phase_id_fkey FOREIGN KEY (phase_id) REFERENCES public.swing_phase(id)
);
CREATE TABLE public.swing_phase (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  sort_order integer,
  CONSTRAINT swing_phase_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_achievement (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  achievement_id bigint NOT NULL,
  unlocked_at timestamp with time zone,
  progress integer DEFAULT 0,
  max_progress integer DEFAULT 100,
  is_unlocked boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_achievement_pkey PRIMARY KEY (id),
  CONSTRAINT user_achievement_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_achievement_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.achievement(id)
);
CREATE TABLE public.user_drill_assignment (
  id bigint NOT NULL DEFAULT nextval('user_drill_assignment_id_seq'::regclass),
  user_id uuid NOT NULL,
  drill_id bigint NOT NULL,
  status text DEFAULT 'active'::text,
  due_at timestamp with time zone,
  last_practiced_at timestamp with time zone,
  is_active boolean DEFAULT true,
  sort_order integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_drill_assignment_pkey PRIMARY KEY (id),
  CONSTRAINT user_drill_assignment_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_drill_assignment_drill_id_fkey FOREIGN KEY (drill_id) REFERENCES public.drill(id)
);
CREATE TABLE public.user_goal (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  goal_type text NOT NULL,
  title text NOT NULL,
  target_value numeric NOT NULL,
  current_value numeric,
  progress_percentage integer,
  icon text,
  color text,
  is_active boolean DEFAULT true,
  target_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_goal_pkey PRIMARY KEY (id),
  CONSTRAINT user_goal_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_issue_state (
  user_id uuid NOT NULL,
  issue_slug text NOT NULL,
  severity numeric NOT NULL DEFAULT 0,
  evidence_count integer NOT NULL DEFAULT 0,
  last_seen_at timestamp with time zone,
  last_targeted_at timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_issue_state_pkey PRIMARY KEY (user_id, issue_slug),
  CONSTRAINT user_issue_state_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_lesson_progress (
  id bigint NOT NULL DEFAULT nextval('user_lesson_progress_id_seq'::regclass),
  user_id uuid NOT NULL,
  lesson_id bigint NOT NULL,
  current_part integer DEFAULT 1,
  total_parts integer DEFAULT 1,
  status text DEFAULT 'in_progress'::text,
  last_practiced_at timestamp with time zone,
  due_at timestamp with time zone,
  retention_score numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_lesson_progress_pkey PRIMARY KEY (id),
  CONSTRAINT user_lesson_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_lesson_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lesson(id)
);
CREATE TABLE public.review_completion (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  item_type text NOT NULL,
  item_id bigint NOT NULL,
  issue_slug text,
  score numeric NOT NULL CHECK (score >= 0 AND score <= 1),
  duration_min integer,
  client_event_id text UNIQUE,
  completion_fingerprint text NOT NULL,
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT review_completion_pkey PRIMARY KEY (id),
  CONSTRAINT review_completion_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  -- Semantic de-dupe: one completion per day per item per user
  CONSTRAINT review_completion_fingerprint_unique UNIQUE (user_id, item_type, item_id, completion_fingerprint)
);

-- Note: completion_fingerprint should be YYYY-MM-DD format (day bucket)
-- This ensures one completion per day per item per user

-- Index for fast fingerprint lookups
CREATE INDEX IF NOT EXISTS review_completion_fingerprint_idx 
ON public.review_completion(completion_fingerprint);

-- Index for client_event_id lookups
CREATE INDEX IF NOT EXISTS review_completion_client_event_id_idx 
ON public.review_completion(client_event_id) 
WHERE client_event_id IS NOT NULL;

CREATE TABLE public.user_review_item (
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
  CONSTRAINT user_review_item_unique UNIQUE (user_id, item_type, item_id)
);

CREATE TABLE public.user_review_event (
  id bigint NOT NULL DEFAULT nextval('user_review_event_id_seq'::regclass),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  icon text,
  color text,
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  priority integer DEFAULT 0,
  is_active boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_review_event_pkey PRIMARY KEY (id),
  CONSTRAINT user_review_event_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.weekly_xp_user (
  week_start timestamp with time zone NOT NULL,
  user_id uuid NOT NULL,
  xp_week bigint NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT weekly_xp_user_pkey PRIMARY KEY (week_start, user_id),
  CONSTRAINT weekly_xp_user_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.xp_event (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  source_type text NOT NULL,
  source_id bigint,
  reason text,
  xp integer NOT NULL CHECK (xp >= 0),
  idempotency_key text UNIQUE,
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT xp_event_pkey PRIMARY KEY (id),
  CONSTRAINT xp_event_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Idempotency key patterns:
-- capture:<captureId>              - XP for capturing a swing
-- analysis:<captureId>             - XP for completing analysis
-- challenge_complete:<progressId>  - XP for challenge completion
-- drill_complete:<assignmentId>    - XP for drill completion
-- lesson_complete:<progressId>     - XP for lesson completion