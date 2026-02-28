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
CREATE TABLE public.review_completion (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  item_type text NOT NULL CHECK (item_type = ANY (ARRAY['drill'::text, 'lesson'::text, 'cue'::text])),
  item_id bigint NOT NULL,
  issue_slug text,
  score numeric NOT NULL,
  duration_min integer,
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completion_day date DEFAULT ((occurred_at AT TIME ZONE 'UTC'::text))::date,
  client_event_id text UNIQUE,
  CONSTRAINT review_completion_pkey PRIMARY KEY (id),
  CONSTRAINT review_completion_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT review_completion_issue_slug_fkey FOREIGN KEY (issue_slug) REFERENCES public.swing_error(slug)
);
CREATE TABLE public.swing_analysis (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  capture_id bigint NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  model_version text NOT NULL DEFAULT 'v1'::text,
  raw_json jsonb NOT NULL,
  issue_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  mechanic_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  club_angle_refs jsonb NOT NULL DEFAULT '{}'::jsonb,
  recommended_lesson_ids ARRAY,
  recommended_drill_ids ARRAY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  model text NOT NULL,
  prompt_version text DEFAULT '1'::text,
  schema_version text DEFAULT '1'::text,
  input_fingerprint text,
  issue_confidence jsonb DEFAULT '{}'::jsonb,
  overall_confidence numeric,
  CONSTRAINT swing_analysis_pkey PRIMARY KEY (id),
  CONSTRAINT swing_analysis_capture_id_fkey FOREIGN KEY (capture_id) REFERENCES public.swing_capture(id),
  CONSTRAINT swing_analysis_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.swing_capture (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'uploaded'::text,
  camera_angle text,
  environment text,
  pose_summary jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  client_capture_id uuid NOT NULL DEFAULT gen_random_uuid(),
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
CREATE TABLE public.swing_dna_observation (
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
  pose_data jsonb,
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
CREATE TABLE public.tier_definition (
  tier smallint NOT NULL CHECK (tier >= 1 AND tier <= 10),
  name text NOT NULL,
  sort_order smallint NOT NULL UNIQUE,
  CONSTRAINT tier_definition_pkey PRIMARY KEY (tier)
);
CREATE TABLE public.tier_week_result (
  week_start timestamp with time zone NOT NULL,
  user_id uuid NOT NULL,
  prior_tier smallint NOT NULL,
  new_tier smallint NOT NULL,
  xp_week bigint NOT NULL DEFAULT 0,
  outcome text NOT NULL CHECK (outcome = ANY (ARRAY['promoted'::text, 'stayed'::text, 'demoted'::text])),
  computed_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tier_week_result_pkey PRIMARY KEY (week_start, user_id),
  CONSTRAINT tier_week_result_prior_tier_fkey FOREIGN KEY (prior_tier) REFERENCES public.tier_definition(tier),
  CONSTRAINT tier_week_result_new_tier_fkey FOREIGN KEY (new_tier) REFERENCES public.tier_definition(tier),
  CONSTRAINT tier_week_result_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
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
CREATE TABLE public.user_curriculum_queue (
  user_id uuid NOT NULL,
  lesson_id bigint NOT NULL,
  issue_slug text,
  queue_rank integer NOT NULL,
  status text NOT NULL DEFAULT 'queued'::text,
  activated_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_curriculum_queue_pkey PRIMARY KEY (user_id, lesson_id),
  CONSTRAINT user_curriculum_queue_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_curriculum_queue_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lesson(id),
  CONSTRAINT user_curriculum_queue_issue_slug_fkey FOREIGN KEY (issue_slug) REFERENCES public.swing_error(slug)
);
CREATE TABLE public.user_daily_xp_activity (
  user_id uuid NOT NULL,
  activity_day date NOT NULL,
  drills_count integer NOT NULL DEFAULT 0,
  reviews_count integer NOT NULL DEFAULT 0,
  captures_count integer NOT NULL DEFAULT 0,
  challenges_count integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_daily_xp_activity_pkey PRIMARY KEY (user_id, activity_day),
  CONSTRAINT user_daily_xp_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
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
CREATE TABLE public.user_review_item (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  item_type text NOT NULL CHECK (item_type = ANY (ARRAY['drill'::text, 'lesson'::text, 'cue'::text])),
  item_id bigint NOT NULL,
  issue_slug text,
  due_at timestamp with time zone NOT NULL DEFAULT now(),
  last_reviewed_at timestamp with time zone,
  interval_days numeric NOT NULL DEFAULT 1,
  ease numeric NOT NULL DEFAULT 2.2,
  reps integer NOT NULL DEFAULT 0,
  success_streak integer NOT NULL DEFAULT 0,
  fail_count integer NOT NULL DEFAULT 0,
  last_score numeric,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_review_item_pkey PRIMARY KEY (id),
  CONSTRAINT user_review_item_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_review_item_issue_slug_fkey FOREIGN KEY (issue_slug) REFERENCES public.swing_error(slug)
);
CREATE TABLE public.user_streak (
  user_id uuid NOT NULL,
  current_streak integer NOT NULL DEFAULT 0,
  last_active_day date,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_streak_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_streak_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_tier_state (
  user_id uuid NOT NULL,
  current_tier smallint NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_tier_state_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_tier_state_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_tier_state_current_tier_fkey FOREIGN KEY (current_tier) REFERENCES public.tier_definition(tier)
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
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  idempotency_key text UNIQUE,
  base_xp integer NOT NULL DEFAULT 0,
  quality_mult numeric NOT NULL DEFAULT 1,
  novelty_mult numeric NOT NULL DEFAULT 1,
  streak_mult numeric NOT NULL DEFAULT 1,
  diminishing_mult numeric NOT NULL DEFAULT 1,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  computed_xp integer DEFAULT round((((((base_xp)::numeric * quality_mult) * novelty_mult) * streak_mult) * diminishing_mult)),
  CONSTRAINT xp_event_pkey PRIMARY KEY (id),
  CONSTRAINT xp_event_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);