-- database_records/database_functions/ensure_user_tier_state.sql
create or replace function public.ensure_user_tier_state()
returns void
language plpgsql
security definer
as $$
begin
  insert into public.user_tier_state (user_id, current_tier)
  values (auth.uid(), 1)
  on conflict (user_id) do nothing;
end;
$$;

revoke all on function public.ensure_user_tier_state() from public;
grant execute on function public.ensure_user_tier_state() to authenticated;