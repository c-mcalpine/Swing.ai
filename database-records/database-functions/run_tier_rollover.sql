-- database_records/database_functions/run_tier_rollover.sql

create or replace function public.run_tier_rollover(
  p_week_start timestamptz,
  p_min_tier_size int default 20
)
returns void
language plpgsql
security definer
as $$
begin
  -- Ensure everyone has tier state
  insert into public.user_tier_state (user_id, current_tier)
  select u.id, 1
  from auth.users u
  on conflict (user_id) do nothing;

  with base as (
    select
      uts.user_id,
      uts.current_tier as prior_tier,
      coalesce(wx.xp_week, 0)::bigint as xp_week
    from public.user_tier_state uts
    left join public.weekly_xp_user wx
      on wx.user_id = uts.user_id
     and wx.week_start = p_week_start
  ),
  ranked as (
    select
      b.*,
      count(*) over (partition by prior_tier) as tier_size,
      percent_rank() over (partition by prior_tier order by xp_week desc, user_id) as pr
    from base b
  ),
  decided as (
    select
      user_id,
      prior_tier,
      xp_week,
      tier_size,
      pr,
      case
        when prior_tier = 10 then 10
        when tier_size < p_min_tier_size then prior_tier
        when pr < 0.20 then prior_tier + 1
        else prior_tier
      end as maybe_promote,
      case
        when prior_tier = 1 then 1
        when tier_size < p_min_tier_size then prior_tier
        when pr >= 0.80 then prior_tier - 1
        else prior_tier
      end as maybe_demote
    from ranked
  ),
  final as (
    select
      user_id,
      prior_tier,
      xp_week,
      case
        when maybe_promote <> prior_tier then maybe_promote
        when maybe_demote <> prior_tier then maybe_demote
        else prior_tier
      end as new_tier
    from decided
  ),
  ins as (
    insert into public.tier_week_result (week_start, user_id, prior_tier, new_tier, xp_week, outcome)
    select
      p_week_start,
      user_id,
      prior_tier,
      new_tier,
      xp_week,
      case
        when new_tier > prior_tier then 'promoted'
        when new_tier < prior_tier then 'demoted'
        else 'stayed'
      end
    from final
    on conflict (week_start, user_id) do nothing
    returning user_id, new_tier
  )
  update public.user_tier_state uts
     set current_tier = ins.new_tier,
         updated_at = now()
    from ins
   where uts.user_id = ins.user_id;

end;
$$;

revoke all on function public.run_tier_rollover(timestamptz, int) from public;
grant execute on function public.run_tier_rollover(timestamptz, int) to service_role;