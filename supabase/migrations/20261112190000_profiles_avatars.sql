-- A player's chosen cat footballer: item IDs from src/config/avatar-items.ts and kits.ts.
-- Checked by the server before saving; an empty object means the default avatar.
alter table public.profiles add column avatar jsonb not null default '{}'::jsonb;

/**
 * A user's finished daily games, oldest first, for their profile: streaks, averages and
 * the history calendar. Only kitty totals, never answers.
 */
create function public.get_player_history(p_user_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'date', s.puzzle_date,
      'total_fee', s.total_fee,
      'puzzle_number', d.puzzle_number
    )
    order by s.puzzle_date
  ), '[]'::jsonb)
  from public.game_sessions s
  join public.daily_puzzles d on d.puzzle_date = s.puzzle_date
  where s.user_id = p_user_id and s.mode = 'daily' and s.completed_at is not null;
$$;

/** Replaces the stage 7 version so each row carries the player's avatar. */
create or replace function public.get_leaderboard(
  p_from date,
  p_to date,
  p_league_id uuid,
  p_user_id uuid,
  p_limit integer,
  p_include_guests boolean
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with scores as (
    select s.user_id,
           sum(s.total_fee) as total,
           sum(s.total_answer_ms) as answer_ms,
           count(*) as days
    from public.game_sessions s
    where s.mode = 'daily'
      and s.completed_at is not null
      and (p_from is null or s.puzzle_date >= p_from)
      and (p_to is null or s.puzzle_date <= p_to)
      and (
        p_league_id is null
        or exists (
          select 1 from public.league_members m
          where m.league_id = p_league_id and m.user_id = s.user_id
        )
      )
    group by s.user_id
  ),
  pool as (
    select sc.*, coalesce(u.is_anonymous, false) as is_guest, pr.display_name, pr.avatar
    from scores sc
    join auth.users u on u.id = sc.user_id
    left join public.profiles pr on pr.user_id = sc.user_id
    where p_include_guests or not coalesce(u.is_anonymous, false) or sc.user_id = p_user_id
  ),
  ranked as (
    select p.*, rank() over (order by p.total desc, p.answer_ms asc) as position
    from pool p
  ),
  shown as (
    select r.*
    from ranked r
    where p_include_guests or not r.is_guest
    order by r.position, r.user_id
    limit p_limit
  )
  select jsonb_build_object(
    'players', (select count(*) from ranked),
    'entries', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'rank', sh.position,
          'name', coalesce(
            sh.display_name,
            (case when sh.is_guest then 'Guest ' else 'Player ' end)
              || upper(left(md5(sh.user_id::text), 4))
          ),
          'avatar', coalesce(sh.avatar, '{}'::jsonb),
          'total', sh.total,
          'days', sh.days,
          'is_you', sh.user_id = p_user_id
        )
        order by sh.position, sh.user_id
      )
      from shown sh
    ), '[]'::jsonb),
    'you', (
      select jsonb_build_object('rank', r.position, 'total', r.total, 'days', r.days)
      from ranked r
      where r.user_id = p_user_id
    )
  );
$$;

revoke execute on function public.get_player_history(uuid) from public, anon, authenticated;
