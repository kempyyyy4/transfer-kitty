-- The spread of everyone's kitty on one day's puzzle, for the curve on the results screen.
-- Only counts leave the database: never anyone's own score or who they are.

/**
 * For the player's finished daily round: how many finished that day's puzzle, how many
 * they beat, and counts of totals in p_bins equal bands from zero to the day's best.
 * Null if the session is not the user's finished daily round.
 */
create function public.daily_kitty_distribution(
  p_session_id uuid,
  p_user_id uuid,
  p_bins integer
)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_date date;
  v_total bigint;
begin
  select s.puzzle_date, s.total_fee into v_date, v_total
  from public.game_sessions s
  where s.id = p_session_id and s.user_id = p_user_id
    and s.mode = 'daily' and s.completed_at is not null;
  if not found then
    return null;
  end if;

  return (
    with totals as (
      select s.total_fee from public.game_sessions s
      where s.mode = 'daily' and s.puzzle_date = v_date and s.completed_at is not null
    ),
    stats as (select count(*) as players, greatest(max(total_fee), 1) as best from totals)
    select jsonb_build_object(
      'players', stats.players,
      'beaten', (select count(*) from totals where total_fee < v_total),
      'yours', v_total,
      'best', stats.best,
      'bins', (
        select jsonb_agg(coalesce(c, 0) order by b)
        from generate_series(0, p_bins - 1) b
        left join (
          select least(p_bins - 1, floor(total_fee::numeric * p_bins / stats.best))::int as band,
                 count(*) as c
          from totals group by 1
        ) counted on counted.band = b
      )
    )
    from stats
  );
end;
$$;

revoke execute on function public.daily_kitty_distribution(uuid, uuid, integer)
from public, anon, authenticated;
