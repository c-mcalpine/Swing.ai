-- database_records/database_functions/apply_xp_event_to_weekly.sql
declare
  wk timestamptz;
begin
  -- Force UTC Monday 00:00 week buckets
  wk := (date_trunc('week', new.occurred_at at time zone 'UTC') at time zone 'UTC');

  insert into public.weekly_xp_user (week_start, user_id, xp_week, updated_at)
  values (wk, new.user_id, new.xp, now())
  on conflict (week_start, user_id)
  do update
    set xp_week = public.weekly_xp_user.xp_week + excluded.xp_week,
        updated_at = now();

  return new;
end;