-- Make build_curriculum_queue run as definer so it can write to user_curriculum_queue
-- even when called by the edge function (authenticated user). Avoids RLS blocking the insert.

CREATE OR REPLACE FUNCTION public.build_curriculum_queue(p_capture_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_user_id uuid;
  v_issue_slug text;
  v_rank int := 0;
  v_active_lesson_id bigint;
begin
  select sc.user_id into v_user_id
  from public.swing_capture sc
  where sc.id = p_capture_id;

  if v_user_id is null then
    raise exception 'capture not found: %', p_capture_id;
  end if;

  for v_issue_slug in
    select t.key
    from jsonb_each((select sa.issue_scores from public.swing_analysis sa where sa.capture_id = p_capture_id)) as t(key, value)
    order by (t.value::numeric) desc nulls last
  loop
    v_rank := v_rank + 1;

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
      status = case
        when public.user_curriculum_queue.status in ('completed','active') then public.user_curriculum_queue.status
        else excluded.status
      end,
      updated_at = now();
  end loop;

  select lesson_id into v_active_lesson_id
  from public.user_curriculum_queue
  where user_id = v_user_id and status = 'active'
  order by queue_rank asc
  limit 1;

  if v_active_lesson_id is null then
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

  if v_active_lesson_id is not null then
    insert into public.user_lesson_progress(user_id, lesson_id, status, current_part, total_parts)
    select v_user_id, v_active_lesson_id, 'in_progress', 1, 1
    where not exists (
      select 1 from public.user_lesson_progress
      where user_id = v_user_id and lesson_id = v_active_lesson_id
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'user_id', v_user_id,
    'active_lesson_id', v_active_lesson_id
  );
end;
$$;

COMMENT ON FUNCTION public.build_curriculum_queue(bigint) IS 'Populates user_curriculum_queue from swing_analysis.issue_scores. SECURITY DEFINER so edge function (invoker) can trigger it without RLS blocking.';
