-- database_records/database_functions/apply_swing_issue_update.sql
declare
  v_user_id uuid;
  v_issue_slug text;
  v_obs numeric;
  v_prev numeric;
  v_new numeric;
  v_evidence_increment int;
begin
  -- Capture must belong to caller
  select sc.user_id into v_user_id
  from public.swing_capture sc
  where sc.id = p_capture_id;

  if v_user_id is null then
    raise exception 'capture_not_found';
  end if;

  if auth.uid() is null or auth.uid() <> v_user_id then
    raise exception 'not_authorized';
  end if;

  -- Iterate through issue scores: { "over_the_top": 0.7, ... }
  for v_issue_slug, v_obs in
    select key, (value::text)::numeric
    from jsonb_each(p_issue_scores)
  loop
    -- clamp to [0,1]
    if v_obs < 0 then v_obs := 0; end if;
    if v_obs > 1 then v_obs := 1; end if;

    -- evidence increment only if observed above threshold
    v_evidence_increment := case when v_obs >= 0.35 then 1 else 0 end;

    -- fetch previous severity if exists
    select severity into v_prev
    from public.user_issue_state
    where user_id = v_user_id and issue_slug = v_issue_slug;

    if v_prev is null then
      v_prev := 0;
    end if;

    -- EMA update: 70% previous, 30% new observation
    v_new := (0.7 * v_prev) + (0.3 * v_obs);

    insert into public.user_issue_state (
      user_id, issue_slug, severity, evidence_count, last_seen_at, updated_at
    )
    values (
      v_user_id, v_issue_slug, v_new, v_evidence_increment, now(), now()
    )
    on conflict (user_id, issue_slug) do update
      set severity = excluded.severity,
          evidence_count = public.user_issue_state.evidence_count + v_evidence_increment,
          last_seen_at = excluded.last_seen_at,
          updated_at = excluded.updated_at;

    insert into public.issue_event (
      user_id, issue_slug, delta, source_type, source_id, created_at
    )
    values (
      v_user_id, v_issue_slug, (v_new - v_prev), 'swing_analysis', p_capture_id, now()
    );
  end loop;
end;
