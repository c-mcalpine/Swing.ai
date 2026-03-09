begin;

-- =========================================================
-- 1) TRACKS
-- =========================================================

create table if not exists public.curriculum_track (
  id bigint generated always as identity primary key,
  slug text not null unique check (slug in ('foundation', 'corrective')),
  name text not null,
  description text,
  sort_order integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists curriculum_track_sort_order_idx
  on public.curriculum_track (sort_order);


-- =========================================================
-- 2) UNITS (this is your real chapter table)
-- =========================================================

create table if not exists public.curriculum_unit (
  id bigint generated always as identity primary key,
  track_id bigint not null references public.curriculum_track(id) on delete cascade,
  slug text not null unique,
  title text not null,
  description text,
  unit_type text not null check (unit_type in ('foundation', 'corrective')),
  primary_phase_id bigint references public.swing_phase(id),
  primary_error_id bigint references public.swing_error(id),
  difficulty smallint,
  estimated_minutes integer,
  sort_order integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- foundation units should usually have a phase
  -- corrective units should usually have an error
  constraint curriculum_unit_type_target_chk check (
    (unit_type = 'foundation' and primary_phase_id is not null)
    or
    (unit_type = 'corrective' and primary_error_id is not null)
  )
);

create index if not exists curriculum_unit_track_sort_idx
  on public.curriculum_unit (track_id, sort_order);

create index if not exists curriculum_unit_phase_idx
  on public.curriculum_unit (primary_phase_id);

create index if not exists curriculum_unit_error_idx
  on public.curriculum_unit (primary_error_id);


-- =========================================================
-- 3) UNIT ITEMS (ordered mixed-type items inside a unit)
-- =========================================================

create table if not exists public.curriculum_unit_item (
  id bigint generated always as identity primary key,
  unit_id bigint not null references public.curriculum_unit(id) on delete cascade,
  item_order integer not null,
  item_type text not null check (item_type in ('lesson', 'drill', 'cue')),
  lesson_id bigint references public.lesson(id) on delete cascade,
  drill_id bigint references public.drill(id) on delete cascade,
  cue_id bigint references public.coaching_cue(id) on delete cascade,
  is_required boolean not null default true,
  is_bonus boolean not null default false,
  unlock_rule jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- exactly one content FK must be populated
  constraint curriculum_unit_item_exactly_one_fk_chk check (
    (
      (case when lesson_id is not null then 1 else 0 end) +
      (case when drill_id is not null then 1 else 0 end) +
      (case when cue_id is not null then 1 else 0 end)
    ) = 1
  ),

  -- item_type must match populated FK
  constraint curriculum_unit_item_type_match_chk check (
    (item_type = 'lesson' and lesson_id is not null and drill_id is null and cue_id is null)
    or
    (item_type = 'drill' and drill_id is not null and lesson_id is null and cue_id is null)
    or
    (item_type = 'cue' and cue_id is not null and lesson_id is null and drill_id is null)
  ),

  constraint curriculum_unit_item_unit_order_uniq unique (unit_id, item_order)
);

create index if not exists curriculum_unit_item_unit_idx
  on public.curriculum_unit_item (unit_id, item_order);

create index if not exists curriculum_unit_item_lesson_idx
  on public.curriculum_unit_item (lesson_id)
  where lesson_id is not null;

create index if not exists curriculum_unit_item_drill_idx
  on public.curriculum_unit_item (drill_id)
  where drill_id is not null;

create index if not exists curriculum_unit_item_cue_idx
  on public.curriculum_unit_item (cue_id)
  where cue_id is not null;


-- Prevent duplicate lesson/drill/cue in same unit
create unique index if not exists curriculum_unit_item_unit_lesson_uniq
  on public.curriculum_unit_item (unit_id, lesson_id)
  where lesson_id is not null;

create unique index if not exists curriculum_unit_item_unit_drill_uniq
  on public.curriculum_unit_item (unit_id, drill_id)
  where drill_id is not null;

create unique index if not exists curriculum_unit_item_unit_cue_uniq
  on public.curriculum_unit_item (unit_id, cue_id)
  where cue_id is not null;


-- =========================================================
-- 4) USER UNIT ASSIGNMENT / PROGRESS
-- =========================================================

create table if not exists public.user_curriculum_unit (
  user_id uuid not null references auth.users(id) on delete cascade,
  unit_id bigint not null references public.curriculum_unit(id) on delete cascade,
  status text not null default 'queued'
    check (status in ('queued', 'active', 'completed', 'skipped')),
  priority_score numeric,
  assigned_reason jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, unit_id)
);

create index if not exists user_curriculum_unit_status_idx
  on public.user_curriculum_unit (user_id, status, created_at);

create index if not exists user_curriculum_unit_priority_idx
  on public.user_curriculum_unit (user_id, priority_score desc nulls last);


-- =========================================================
-- 5) USER UNIT ITEM PROGRESS
-- =========================================================

create table if not exists public.user_curriculum_unit_item (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  unit_item_id bigint not null references public.curriculum_unit_item(id) on delete cascade,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'completed', 'skipped')),
  score numeric,
  started_at timestamptz,
  completed_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_curriculum_unit_item_user_item_uniq unique (user_id, unit_item_id)
);

create index if not exists user_curriculum_unit_item_status_idx
  on public.user_curriculum_unit_item (user_id, status, created_at);

create index if not exists user_curriculum_unit_item_completed_idx
  on public.user_curriculum_unit_item (user_id, completed_at desc);


-- =========================================================
-- 6) OPTIONAL: lightweight helper view
-- =========================================================

create or replace view public.curriculum_unit_item_resolved as
select
  cui.id,
  cui.unit_id,
  cui.item_order,
  cui.item_type,
  cui.is_required,
  cui.is_bonus,
  cui.unlock_rule,
  cui.notes,
  l.id as resolved_lesson_id,
  d.id as resolved_drill_id,
  c.id as resolved_cue_id,
  coalesce(l.slug, d.slug, c.slug) as content_slug,
  coalesce(l.title, d.name, c.text) as content_title
from public.curriculum_unit_item cui
left join public.lesson l on cui.lesson_id = l.id
left join public.drill d on cui.drill_id = d.id
left join public.coaching_cue c on cui.cue_id = c.id;


-- =========================================================
-- 7) CURRICULUM UNIT MECHANIC
-- =========================================================

create table if not exists public.curriculum_unit_mechanic (
  unit_id bigint not null references public.curriculum_unit(id) on delete cascade,
  mechanic_id bigint not null references public.swing_mechanic(id) on delete cascade,
  role text not null check (role in ('primary', 'secondary', 'support')),
  weight numeric not null default 1.0,
  notes text,
  primary key (unit_id, mechanic_id)
);

create index if not exists curriculum_unit_mechanic_mechanic_idx
  on public.curriculum_unit_mechanic (mechanic_id);


-- =========================================================
-- 7) OPTIONAL: updated_at triggers
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_curriculum_track_updated_at on public.curriculum_track;
create trigger trg_curriculum_track_updated_at
before update on public.curriculum_track
for each row execute function public.set_updated_at();

drop trigger if exists trg_curriculum_unit_updated_at on public.curriculum_unit;
create trigger trg_curriculum_unit_updated_at
before update on public.curriculum_unit
for each row execute function public.set_updated_at();

drop trigger if exists trg_curriculum_unit_item_updated_at on public.curriculum_unit_item;
create trigger trg_curriculum_unit_item_updated_at
before update on public.curriculum_unit_item
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_curriculum_unit_updated_at on public.user_curriculum_unit;
create trigger trg_user_curriculum_unit_updated_at
before update on public.user_curriculum_unit
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_curriculum_unit_item_updated_at on public.user_curriculum_unit_item;
create trigger trg_user_curriculum_unit_item_updated_at
before update on public.user_curriculum_unit_item
for each row execute function public.set_updated_at();

commit;