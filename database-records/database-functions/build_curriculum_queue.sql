-- database_records/database_functions/build_curriculum_queue.sql
declare
  v_user_id uuid;
  v_issue_slug text;
  v_rank int := 0;
  v_active_lesson_id bigint;
begin
  -- Identify user for capture
  select sc.user_id into v_user_id
  from public.swing_capture sc
  where sc.id = p_capture_id;

  if v_user_id is null then
    raise exception 'capture not found: %', p_capture_id;
  end if;

  -- Upsert queue from issue_scores
  -- Assumption: issue_scores keys == swing_error.slug
  for v_issue_slug in
    select key as issue_slug
    from (
      select jsonb_each((select sa.issue_scores from public.swing_analysis sa where sa.capture_id = p_capture_id))
    ) t(key, value)
    order by (t.value::numeric) desc nulls last
  loop
    v_rank := v_rank + 1;

    -- Map issue_slug -> lesson (via swing_error.id -> lesson.primary_error_id)
    insert into public.user_curriculum_queue(user_id, lesson_id, issue_slug, queue_rank, status)
    select
      v_user_id,
      l.id,
      v_issue_slug,
      v_rank,
      'queued'
    from public.swing_error e
    join public.lesson l on l.primary_error_id = e.id
    where e.slug = v_issue_slug
    on conflict (user_id, lesson_id)
    do update set
      issue_slug = excluded.issue_slug,
      queue_rank = excluded.queue_rank,
      -- don't reset status if already completed/active
      status = case
        when public.user_curriculum_queue.status in ('completed','active') then public.user_curriculum_queue.status
        else excluded.status
      end,
      updated_at = now();
  end loop;

  -- Ensure exactly one active lesson
  -- If one is already active, keep it.
  select lesson_id into v_active_lesson_id
  from public.user_curriculum_queue
  where user_id = v_user_id and status = 'active'
  order by queue_rank asc
  limit 1;

  if v_active_lesson_id is null then
    -- Activate the first queued lesson by rank
    update public.user_curriculum_queue
    set status = 'active', activated_at = now()
    where user_id = v_user_id
      and lesson_id = (
        select lesson_id
        from public.user_curriculum_queue
        where user_id = v_user_id and status = 'queued'
        order by queue_rank asc
        limit 1
      );

    select lesson_id into v_active_lesson_id
    from public.user_curriculum_queue
    where user_id = v_user_id and status = 'active'
    order by queue_rank asc
    limit 1;
  end if;

  -- Ensure user_lesson_progress exists for active lesson
  if v_active_lesson_id is not null then
    insert into public.user_lesson_progress(user_id, lesson_id, status, current_part, total_parts)
    values (v_user_id, v_active_lesson_id, 'in_progress', 1, 1)
    on conflict (id) do nothing; -- if your table doesn't have a unique(user_id,lesson_id), ignore this

    -- If you DO have unique(user_id,lesson_id), replace the above with:
    -- on conflict (user_id, lesson_id) do nothing;
  end if;

  return jsonb_build_object(
    'ok', true,
    'user_id', v_user_id,
    'active_lesson_id', v_active_lesson_id
  );
end;
