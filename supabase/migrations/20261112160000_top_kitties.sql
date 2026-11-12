create table public.leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 30),
  invite_code text not null unique check (invite_code ~ '^[A-HJ-KM-NP-Z2-9]{6}$'),
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.league_members (
  league_id uuid not null references public.leagues (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (league_id, user_id)
);

create index league_members_by_user on public.league_members (user_id);

-- Every board reads finished daily sessions by date.
create index finished_daily_sessions_by_date on public.game_sessions (puzzle_date)
  where mode = 'daily' and completed_at is not null;

-- Server only: row-level security is on with no policies, and the browser roles get no grants.
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;
revoke all on table public.leagues, public.league_members from anon, authenticated;

/**
 * A board of kitties from finished daily games between two dates (either may be null for
 * no limit), optionally only for one league's members. Ties go to the faster total time.
 * Names are placeholders until sign-up adds real ones in stage 7.
 * 'you' is the requesting user's own rank; a guest always sees theirs, even when guests are
 * left off the board itself.
 * Security definer because it reads auth.users to tell guests apart.
 */
create function public.get_leaderboard(
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
    select sc.*, coalesce(u.is_anonymous, false) as is_guest
    from scores sc
    join auth.users u on u.id = sc.user_id
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
          'name', (case when sh.is_guest then 'Guest ' else 'Player ' end)
                    || upper(left(md5(sh.user_id::text), 4)),
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

/** Creates a league with its owner as the first member. */
create function public.create_league(
  p_owner_id uuid,
  p_name text,
  p_invite_code text,
  p_max_leagues integer
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_league_id uuid;
begin
  if (select count(*) from public.league_members m where m.user_id = p_owner_id) >= p_max_leagues then
    return jsonb_build_object('status', 'too_many_leagues');
  end if;

  begin
    insert into public.leagues (name, invite_code, owner_id)
    values (p_name, p_invite_code, p_owner_id)
    returning id into v_league_id;
  exception when unique_violation then
    return jsonb_build_object('status', 'code_taken');
  end;

  insert into public.league_members (league_id, user_id) values (v_league_id, p_owner_id);
  return jsonb_build_object('status', 'created', 'id', v_league_id);
end;
$$;

/** Joins the league with this invite code. Joining a league you are already in is fine. */
create function public.join_league(
  p_user_id uuid,
  p_invite_code text,
  p_max_leagues integer,
  p_max_members integer
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_league public.leagues;
begin
  select l.* into v_league from public.leagues l where l.invite_code = p_invite_code for update;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  if exists (
    select 1 from public.league_members m
    where m.league_id = v_league.id and m.user_id = p_user_id
  ) then
    return jsonb_build_object('status', 'joined', 'id', v_league.id);
  end if;

  if (select count(*) from public.league_members m where m.user_id = p_user_id) >= p_max_leagues then
    return jsonb_build_object('status', 'too_many_leagues');
  end if;

  if (select count(*) from public.league_members m where m.league_id = v_league.id) >= p_max_members then
    return jsonb_build_object('status', 'league_full');
  end if;

  insert into public.league_members (league_id, user_id) values (v_league.id, p_user_id);
  return jsonb_build_object('status', 'joined', 'id', v_league.id);
end;
$$;

/** Leaves a league. A league nobody is left in is deleted. */
create function public.leave_league(p_user_id uuid, p_league_id uuid)
returns boolean
language plpgsql
set search_path = ''
as $$
begin
  delete from public.league_members m
  where m.league_id = p_league_id and m.user_id = p_user_id;
  if not found then
    return false;
  end if;

  delete from public.leagues l
  where l.id = p_league_id
    and not exists (select 1 from public.league_members m where m.league_id = p_league_id);
  return true;
end;
$$;

/** The leagues a user belongs to, with their invite codes and member counts. */
create function public.get_my_leagues(p_user_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', l.id,
      'name', l.name,
      'invite_code', l.invite_code,
      'members', (select count(*) from public.league_members c where c.league_id = l.id)
    )
    order by l.name
  ), '[]'::jsonb)
  from public.leagues l
  join public.league_members m on m.league_id = l.id and m.user_id = p_user_id;
$$;

revoke execute on function
  public.get_leaderboard(date, date, uuid, uuid, integer, boolean),
  public.create_league(uuid, text, text, integer),
  public.join_league(uuid, text, integer, integer),
  public.leave_league(uuid, uuid),
  public.get_my_leagues(uuid)
from public, anon, authenticated;
