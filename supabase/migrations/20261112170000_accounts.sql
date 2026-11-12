-- A signed-in player's public face. Guests have no profile.
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 3 and 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Two players cannot share a name, whatever the capitals.
create unique index profiles_display_name_unique on public.profiles (lower(display_name));

/**
 * A guest who has started signing in. The browser holds only the random token, in a
 * cookie; the guest's ID stays on the server, so nobody can claim another guest's games.
 */
create table public.pending_merges (
  token text primary key,
  guest_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.pending_merges enable row level security;
revoke all on table public.profiles, public.pending_merges from anon, authenticated;

/**
 * Hands back the guest waiting on a sign-in token, and forgets the token so it works once.
 * Null if the token is unknown or older than p_max_age_seconds.
 */
create function public.take_pending_merge(p_token text, p_max_age_seconds integer)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_guest_id uuid;
begin
  delete from public.pending_merges m
  where m.token = p_token
    and m.created_at > now() - make_interval(secs => p_max_age_seconds)
  returning m.guest_id into v_guest_id;

  -- Tidy away anything stale while we are here.
  delete from public.pending_merges m
  where m.created_at <= now() - make_interval(secs => p_max_age_seconds);

  return v_guest_id;
end;
$$;

/**
 * Moves everything a guest did into a signed-in account: games, leagues and league
 * ownership. On a day both played the daily, the account's game is kept and the guest's
 * is dropped, so one person never holds two attempts at one puzzle.
 * Refuses unless p_guest_id really is a guest. Security definer to read auth.users.
 * The guest's own user is deleted afterwards by the caller, through the auth admin API.
 */
create function public.merge_guest_into_account(p_guest_id uuid, p_account_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_guest boolean;
  v_dropped integer;
  v_moved integer;
begin
  if p_guest_id = p_account_id then
    return jsonb_build_object('status', 'same_user');
  end if;

  select coalesce(u.is_anonymous, false) into v_is_guest from auth.users u where u.id = p_guest_id;
  if not coalesce(v_is_guest, false) then
    return jsonb_build_object('status', 'not_a_guest');
  end if;

  delete from public.game_sessions g
  where g.user_id = p_guest_id
    and g.mode = 'daily'
    and exists (
      select 1 from public.game_sessions a
      where a.user_id = p_account_id and a.mode = 'daily' and a.puzzle_date = g.puzzle_date
    );
  get diagnostics v_dropped = row_count;

  update public.game_sessions g set user_id = p_account_id where g.user_id = p_guest_id;
  get diagnostics v_moved = row_count;

  insert into public.league_members (league_id, user_id, joined_at)
  select m.league_id, p_account_id, m.joined_at
  from public.league_members m
  where m.user_id = p_guest_id
  on conflict (league_id, user_id) do nothing;
  delete from public.league_members m where m.user_id = p_guest_id;
  update public.leagues l set owner_id = p_account_id where l.owner_id = p_guest_id;

  return jsonb_build_object('status', 'merged', 'games_moved', v_moved, 'games_dropped', v_dropped);
end;
$$;

/** Replaces the stage 6 version so boards show players' chosen names. */
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
    select sc.*, coalesce(u.is_anonymous, false) as is_guest, pr.display_name
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

revoke execute on function
  public.take_pending_merge(text, integer),
  public.merge_guest_into_account(uuid, uuid)
from public, anon, authenticated;
