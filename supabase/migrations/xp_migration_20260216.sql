-- 1) Add columns to xp_event (safe, incremental)
alter table public.xp_event
  add column if not exists base_xp integer not null default 0,
  add column if not exists quality_mult numeric not null default 1,
  add column if not exists novelty_mult numeric not null default 1,
  add column if not exists streak_mult numeric not null default 1,
  add column if not exists diminishing_mult numeric not null default 1,
  add column if not exists meta jsonb not null default '{}'::jsonb;

-- 2) Optional: computed_xp as stored generated column
-- If you want a generated column, keep `xp` as the final award too.
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema='public'
      and table_name='xp_event'
      and column_name='computed_xp'
  ) then
    execute $sql$
      alter table public.xp_event
        add column computed_xp integer
        generated always as (
          round(base_xp * quality_mult * novelty_mult * streak_mult * diminishing_mult)
        ) stored
    $sql$;
  end if;
end$$;

-- 3) Anti double-award for same source action
do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname='public'
      and indexname='xp_event_user_source_uniq'
  ) then
    execute 'create unique index xp_event_user_source_uniq on public.xp_event(user_id, source_type, source_id) where source_id is not null;';
  end if;
end$$;

-- 4) Helpful index for analytics
create index if not exists xp_event_user_time_idx
  on public.xp_event(user_id, occurred_at desc);

create table if not exists public.user_daily_xp_activity (
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_day date not null,
  drills_count integer not null default 0,
  reviews_count integer not null default 0,
  captures_count integer not null default 0,
  challenges_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, activity_day)
);

create table if not exists public.user_streak (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak integer not null default 0,
  last_active_day date,
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.xp_event enable row level security;
alter table public.user_daily_xp_activity enable row level security;
alter table public.user_streak enable row level security;

-- Read own rows
create policy "xp_event_read_own"
on public.xp_event
for select
using (auth.uid() = user_id);

create policy "daily_xp_read_own"
on public.user_daily_xp_activity
for select
using (auth.uid() = user_id);

create policy "streak_read_own"
on public.user_streak
for select
using (auth.uid() = user_id);

-- No direct writes (do not create insert/update/delete policies)
-- Writes will be done by SECURITY DEFINER function.

create or replace function public.award_xp(
  p_source_type text,
  p_source_id bigint,
  p_reason text default null,
  p_meta jsonb default '{}'::jsonb,
  p_idempotency_key text default null
)
returns table (
  xp_awarded integer,
  new_total_xp integer,
  week_xp bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_today date := (now() at time zone 'utc')::date;
  v_week_start timestamptz := date_trunc('week', now() at time zone 'utc');

  v_existing_xp integer;

  v_base_xp integer := 0;
  v_quality_mult numeric := 1;
  v_novelty_mult numeric := 1;
  v_diminishing_mult numeric := 1;
  v_streak_mult numeric := 1;

  v_drills_count integer := 0;
  v_reviews_count integer := 0;
  v_captures_count integer := 0;
  v_challenges_count integer := 0;

  v_streak integer := 0;
  v_last_active date;

  v_pct numeric;
  v_score numeric;
  v_duration numeric;

  v_final_xp integer;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- 1) Idempotency: if we've already awarded with this key, return it.
  if p_idempotency_key is not null then
    select xe.xp
      into v_existing_xp
    from public.xp_event xe
    where xe.idempotency_key = p_idempotency_key
      and xe.user_id = v_user_id
    limit 1;

    if v_existing_xp is not null then
      select p.xp into new_total_xp from public.profiles p where p.user_id = v_user_id;
      select w.xp_week into week_xp from public.weekly_xp_user w where w.user_id = v_user_id and w.week_start = v_week_start;
      xp_awarded := v_existing_xp;
      return next;
      return;
    end if;
  end if;

  -- 2) Ensure daily counter row exists; lock it for consistent increments
  insert into public.user_daily_xp_activity(user_id, activity_day)
  values (v_user_id, v_today)
  on conflict (user_id, activity_day) do nothing;

  select drills_count, reviews_count, captures_count, challenges_count
    into v_drills_count, v_reviews_count, v_captures_count, v_challenges_count
  from public.user_daily_xp_activity
  where user_id = v_user_id and activity_day = v_today
  for update;

  -- 3) Resolve base XP from DB where applicable
  if p_source_type = 'drill' then
    select coalesce(d.xp_reward, 15) into v_base_xp
    from public.drill d
    where d.id = p_source_id;

    if v_base_xp is null then v_base_xp := 15; end if;

  elsif p_source_type = 'challenge' then
    select coalesce(c.reward_xp, 30) into v_base_xp
    from public.challenge c
    join public.challenge_instance ci on ci.challenge_id = c.id
    where ci.id = p_source_id;

    if v_base_xp is null then v_base_xp := 30; end if;

  elsif p_source_type = 'smart_review' then
    v_base_xp := 20;

  elsif p_source_type = 'swing_capture' then
    v_base_xp := 25;

  else
    raise exception 'Unsupported source_type: %', p_source_type;
  end if;

  -- 4) Quality multiplier (bounded and simple)
  if p_source_type = 'smart_review' then
    -- Expect p_meta.score either 0-1 or 0-100; normalize if > 1
    v_score := nullif((p_meta->>'score')::numeric, null);
    if v_score is not null and v_score > 1 then
      v_score := v_score / 100.0;
    end if;

    -- quality = 0.9 + 0.5*score, capped to [0.9, 1.4]
    v_quality_mult := least(1.4, greatest(0.9, 0.9 + 0.5*coalesce(v_score, 0)));

  elsif p_source_type = 'drill' then
    -- Use duration_min if provided; cap +30%
    v_duration := nullif((p_meta->>'duration_min')::numeric, null);
    if v_duration is not null then
      v_quality_mult := 1.0 + least(0.3, (v_duration / 10.0) * 0.3);
    else
      v_quality_mult := 1.0;
    end if;

  elsif p_source_type = 'swing_capture' then
    -- Use confidence 0-1 and optional picked_takeaway boolean in meta
    v_score := nullif((p_meta->>'overall_confidence')::numeric, null);
    v_quality_mult := 1.0
      + least(0.15, 0.15*coalesce(v_score, 0))
      + case when (p_meta->>'picked_takeaway') in ('true','1','t','yes') then 0.10 else 0 end;
    v_quality_mult := least(1.25, v_quality_mult);

  elsif p_source_type = 'challenge' then
    -- placement_percentile: 0 best ... 1 worst
    v_pct := nullif((p_meta->>'placement_percentile')::numeric, null);
    if v_pct is null then
      v_quality_mult := 1.0;
    else
      v_quality_mult := case
        when v_pct <= 0.01 then 2.0
        when v_pct <= 0.10 then 1.6
        when v_pct <= 0.50 then 1.2
        else 1.0
      end;
    end if;
  end if;

  -- 5) Novelty multiplier (first of type today)
  if p_source_type = 'drill' then
    v_novelty_mult := case when v_drills_count = 0 then 1.2 else 1.0 end;
  elsif p_source_type = 'smart_review' then
    v_novelty_mult := case when v_reviews_count = 0 then 1.15 else 1.0 end;
  elsif p_source_type = 'swing_capture' then
    v_novelty_mult := case when v_captures_count = 0 then 1.25 else 1.0 end;
  elsif p_source_type = 'challenge' then
    v_novelty_mult := case when v_challenges_count = 0 then 1.25 else 1.0 end;
  end if;

  -- 6) Diminishing returns multiplier by today count (pre-increment)
  if p_source_type = 'drill' then
    v_diminishing_mult := case
      when v_drills_count <= 2 then 1.0
      when v_drills_count <= 5 then 0.7
      when v_drills_count <= 9 then 0.4
      else 0.2
    end;
  elsif p_source_type = 'smart_review' then
    v_diminishing_mult := case
      when v_reviews_count <= 2 then 1.0
      when v_reviews_count <= 5 then 0.7
      when v_reviews_count <= 9 then 0.4
      else 0.2
    end;
  elsif p_source_type = 'swing_capture' then
    v_diminishing_mult := case
      when v_captures_count <= 2 then 1.0
      when v_captures_count <= 5 then 0.7
      when v_captures_count <= 9 then 0.4
      else 0.2
    end;
  elsif p_source_type = 'challenge' then
    v_diminishing_mult := case
      when v_challenges_count <= 2 then 1.0
      when v_challenges_count <= 5 then 0.7
      when v_challenges_count <= 9 then 0.4
      else 0.2
    end;
  end if;

  -- 7) Streak update + multiplier (small, capped)
  insert into public.user_streak(user_id, current_streak, last_active_day)
  values (v_user_id, 0, null)
  on conflict (user_id) do nothing;

  select current_streak, last_active_day
    into v_streak, v_last_active
  from public.user_streak
  where user_id = v_user_id
  for update;

  if v_last_active is null then
    v_streak := 1;
  elsif v_last_active = v_today then
    -- no change
    v_streak := v_streak;
  elsif v_last_active = (v_today - 1) then
    v_streak := v_streak + 1;
  else
    v_streak := 1;
  end if;

  update public.user_streak
  set current_streak = v_streak,
      last_active_day = v_today,
      updated_at = now()
  where user_id = v_user_id;

  v_streak_mult := 1.0 + least(0.15, v_streak * 0.01);

  -- 8) Final XP
  v_final_xp := round(v_base_xp * v_quality_mult * v_novelty_mult * v_streak_mult * v_diminishing_mult);
  if v_final_xp < 1 then v_final_xp := 1; end if;

  -- 9) Insert ledger row (also blocks double award for same action via indexes)
  insert into public.xp_event(
    user_id, source_type, source_id, reason, xp, occurred_at,
    idempotency_key, base_xp, quality_mult, novelty_mult, streak_mult, diminishing_mult, meta
  )
  values (
    v_user_id, p_source_type, p_source_id, p_reason, v_final_xp, now(),
    p_idempotency_key, v_base_xp, v_quality_mult, v_novelty_mult, v_streak_mult, v_diminishing_mult, coalesce(p_meta, '{}'::jsonb)
  );

  -- 10) Increment daily counters
  update public.user_daily_xp_activity
  set drills_count = drills_count + case when p_source_type='drill' then 1 else 0 end,
      reviews_count = reviews_count + case when p_source_type='smart_review' then 1 else 0 end,
      captures_count = captures_count + case when p_source_type='swing_capture' then 1 else 0 end,
      challenges_count = challenges_count + case when p_source_type='challenge' then 1 else 0 end,
      updated_at = now()
  where user_id = v_user_id and activity_day = v_today;

  -- 11) Update profile XP cache
  update public.profiles
  set xp = coalesce(xp, 0) + v_final_xp,
      updated_at = now()
  where user_id = v_user_id;

  select p.xp into new_total_xp
  from public.profiles p
  where p.user_id = v_user_id;

  -- 12) Update weekly XP cache
  insert into public.weekly_xp_user(week_start, user_id, xp_week)
  values (v_week_start, v_user_id, v_final_xp)
  on conflict (week_start, user_id) do update
    set xp_week = public.weekly_xp_user.xp_week + excluded.xp_week,
        updated_at = now();

  select w.xp_week into week_xp
  from public.weekly_xp_user w
  where w.week_start = v_week_start and w.user_id = v_user_id;

  xp_awarded := v_final_xp;
  return next;
end;
$$;

-- Lock down direct EXECUTE if you want; then grant to authenticated
revoke all on function public.award_xp(text, bigint, text, jsonb, text) from public;
grant execute on function public.award_xp(text, bigint, text, jsonb, text) to authenticated;
