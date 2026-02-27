-- database_records/database_functions/get_tier_leaderboard.sql

create or replace function public.get_tier_leaderboard(
  p_week_start timestamptz,
  p_limit int default 50
)
returns table (
  week_start timestamptz,
  tier smallint,
  tier_name text,
  user_id uuid,
  username text,
  avatar_url text,
  xp_week bigint,
  rank int,
  is_me boolean
)
language sql
security definer
as $$
  with me as (
    select
      uts.current_tier as tier
    from public.user_tier_state uts
    where uts.user_id = auth.uid()
  ),
  base as (
    select
      p_week_start as week_start,
      uts.current_tier as tier,
      td.name as tier_name,
      uts.user_id,
      p.username,
      p.avatar_url,
      coalesce(wx.xp_week, 0)::bigint as xp_week
    from public.user_tier_state uts
    join me on me.tier = uts.current_tier
    join public.tier_definition td on td.tier = uts.current_tier
    left join public.weekly_xp_user wx
      on wx.user_id = uts.user_id
     and wx.week_start = p_week_start
    left join public.profiles p
      on p.user_id = uts.user_id
  ),
  ranked as (
    select
      *,
      dense_rank() over (order by xp_week desc, user_id) as rank
    from base
  )
  select
    week_start, tier, tier_name, user_id, username, avatar_url, xp_week, rank,
    (user_id = auth.uid()) as is_me
  from ranked
  order by rank asc
  limit p_limit;
$$;

revoke all on function public.get_tier_leaderboard(timestamptz, int) from public;
grant execute on function public.get_tier_leaderboard(timestamptz, int) to authenticated;