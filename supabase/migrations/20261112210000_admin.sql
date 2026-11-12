-- Stage 10: the admin area. Packs, missing-answer reports, and the functions the admin
-- screens call. Everything here is server only, like every other table.

create type public.pack_status as enum ('draft', 'live', 'retired');
create type public.pack_kind as enum ('era', 'world_cup', 'player', 'other');
create type public.report_status as enum ('open', 'added', 'dismissed');

-- A themed set of questions players will be able to buy (stage 12). Price is added then.
create table public.packs (
  id uuid primary key default gen_random_uuid(),
  -- Used in the pack's web address. Never change it once a pack is live.
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 3 and 40),
  description text not null default '' check (char_length(description) <= 200),
  kind public.pack_kind not null,
  status public.pack_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pack_questions (
  pack_id uuid not null references public.packs (id) on delete cascade,
  question_id uuid not null references public.questions (id),
  added_at timestamptz not null default now(),
  primary key (pack_id, question_id)
);

create index pack_questions_by_question on public.pack_questions (question_id);

-- A player saying a valid answer was missing from a question they finished.
-- Players pick from the player search, so a report never holds free text.
create table public.answer_reports (
  id bigint generated always as identity primary key,
  question_id uuid not null references public.questions (id) on delete cascade,
  player_id bigint not null references public.players (id),
  user_id uuid not null references auth.users (id) on delete cascade,
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (question_id, player_id, user_id)
);

create index answer_reports_open on public.answer_reports (status, question_id, player_id);

alter table public.packs enable row level security;
alter table public.pack_questions enable row level security;
alter table public.answer_reports enable row level security;

revoke all on table public.packs, public.pack_questions, public.answer_reports
from anon, authenticated;

/** True if the question is in the given day's daily puzzle. Its answers are frozen that day. */
create function public.is_question_live(p_question_id uuid, p_today date)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.daily_puzzle_questions
    where question_id = p_question_id and puzzle_date = p_today
  );
$$;

/**
 * One page of questions for the admin list, newest first, with the total that match.
 * p_search matches anywhere in the prompt; null filters are ignored.
 */
create function public.admin_list_questions(
  p_search text,
  p_status public.question_status,
  p_source public.question_source,
  p_limit integer,
  p_offset integer
)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with matching as (
    select q.*
    from public.questions q
    where (p_search is null or q.prompt ilike '%' || p_search || '%')
      and (p_status is null or q.status = p_status)
      and (p_source is null or q.source = p_source)
  )
  select jsonb_build_object(
    'total', (select count(*) from matching),
    'rows', coalesce((
      select jsonb_agg(row_data)
      from (
        select jsonb_build_object(
          'id', m.id,
          'prompt', m.prompt,
          'source', m.source,
          'status', m.status,
          'answer_count', m.answer_count,
          'times_played', m.times_played,
          'prominence', m.prominence,
          'puzzle_date', (
            select d.puzzle_date from public.daily_puzzle_questions d where d.question_id = m.id
          )
        ) as row_data
        from matching m
        order by m.created_at desc, m.id
        limit p_limit offset p_offset
      ) page
    ), '[]'::jsonb)
  );
$$;

/** Everything about one question for the admin detail screen. Null if there is no such question. */
create function public.admin_get_question(p_question_id uuid, p_today date)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', q.id,
    'prompt', q.prompt,
    'source', q.source,
    'status', q.status,
    'data_source', q.data_source,
    'template_key', q.template_key,
    'times_played', q.times_played,
    'prominence', q.prominence,
    'tiers_recalculated_at', q.tiers_recalculated_at,
    'puzzle_date', (
      select d.puzzle_date from public.daily_puzzle_questions d where d.question_id = q.id
    ),
    'live_today', public.is_question_live(q.id, p_today),
    'tags', coalesce((
      select jsonb_agg(jsonb_build_object('type', t.tag_type, 'value', t.tag_value)
                       order by t.tag_type, t.tag_value)
      from public.question_tags t where t.question_id = q.id
    ), '[]'::jsonb),
    'packs', coalesce((
      select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name) order by p.name)
      from public.pack_questions pq join public.packs p on p.id = pq.pack_id
      where pq.question_id = q.id
    ), '[]'::jsonb),
    'answers', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', a.entity_id,
          'name', pl.name,
          'birth_year', pl.birth_year,
          'starting_tier', a.starting_tier,
          'current_tier', a.current_tier,
          'override', a.admin_tier_override,
          'times_given', a.times_given
        )
        order by coalesce(a.admin_tier_override, a.current_tier), a.times_given desc, pl.name
      )
      from public.question_answers a
      join public.players pl on pl.id = a.entity_id
      where a.question_id = q.id
    ), '[]'::jsonb)
  )
  from public.questions q
  where q.id = p_question_id;
$$;

/**
 * Sets or clears the admin's tier for one answer. Refused for a question in today's
 * puzzle, so a fee never changes during the day it is played.
 * Returns 'saved', 'not_found' or 'live_today'.
 */
create function public.admin_set_tier_override(
  p_question_id uuid,
  p_entity_id bigint,
  p_tier smallint,
  p_today date
)
returns text
language plpgsql
set search_path = ''
as $$
begin
  if public.is_question_live(p_question_id, p_today) then
    return 'live_today';
  end if;

  update public.question_answers
  set admin_tier_override = p_tier
  where question_id = p_question_id and entity_id = p_entity_id;

  if not found then
    return 'not_found';
  end if;
  update public.questions set updated_at = now() where id = p_question_id;
  return 'saved';
end;
$$;

/**
 * Adds a valid answer to a player question and marks any open reports of it as added.
 * Returns 'added', 'exists', 'not_found', 'not_player_question' or 'live_today'.
 */
create function public.admin_add_answer(
  p_question_id uuid,
  p_player_id bigint,
  p_tier smallint,
  p_today date
)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_type public.answer_type;
begin
  select answer_type into v_type from public.questions where id = p_question_id for update;
  if not found or not exists (select 1 from public.players where id = p_player_id) then
    return 'not_found';
  end if;
  if v_type <> 'player' then
    return 'not_player_question';
  end if;
  if public.is_question_live(p_question_id, p_today) then
    return 'live_today';
  end if;

  insert into public.question_answers (
    question_id, entity_id, starting_tier, current_tier, starting_popularity
  )
  values (p_question_id, p_player_id, p_tier, p_tier, 0)
  on conflict do nothing;

  if not found then
    return 'exists';
  end if;

  update public.questions
  set answer_count = answer_count + 1, updated_at = now()
  where id = p_question_id;

  update public.answer_reports
  set status = 'added', resolved_at = now()
  where question_id = p_question_id and player_id = p_player_id and status = 'open';

  return 'added';
end;
$$;

/**
 * Removes a wrong answer. Rounds already played keep the fee they were given.
 * Returns 'removed', 'not_found' or 'live_today'.
 */
create function public.admin_remove_answer(
  p_question_id uuid,
  p_entity_id bigint,
  p_today date
)
returns text
language plpgsql
set search_path = ''
as $$
begin
  if public.is_question_live(p_question_id, p_today) then
    return 'live_today';
  end if;

  delete from public.question_answers
  where question_id = p_question_id and entity_id = p_entity_id;

  if not found then
    return 'not_found';
  end if;

  update public.questions
  set answer_count = answer_count - 1, updated_at = now()
  where id = p_question_id;
  return 'removed';
end;
$$;

/**
 * Adds a hand-written player question with its answers, each
 * {"entity_id": players.id, "tier": 1-7, "popularity": number}. Returns the new question's ID.
 */
create function public.create_manual_question(
  p_prompt text,
  p_status public.question_status,
  p_prominence real,
  p_answers jsonb
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.questions (
    prompt, answer_type, source, data_source, dedupe_key, status, answer_count, prominence
  )
  values (
    p_prompt, 'player', 'manual', 'manual', 'manual:' || gen_random_uuid(), p_status,
    jsonb_array_length(p_answers), p_prominence
  )
  returning id into v_id;

  insert into public.question_answers (
    question_id, entity_id, starting_tier, current_tier, starting_popularity
  )
  select
    v_id,
    (answer ->> 'entity_id')::bigint,
    (answer ->> 'tier')::smallint,
    (answer ->> 'tier')::smallint,
    (answer ->> 'popularity')::real
  from jsonb_array_elements(p_answers) answer;

  return v_id;
end;
$$;

/**
 * A player reports that someone was a valid answer to a question in their finished round.
 * Returns 'saved', 'not_found' (no such finished round), 'already_valid' or 'already_reported'.
 */
create function public.report_missing_answer(
  p_user_id uuid,
  p_session_id uuid,
  p_position smallint,
  p_player_id bigint
)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_question_id uuid;
begin
  select sq.question_id into v_question_id
  from public.session_questions sq
  join public.game_sessions s on s.id = sq.session_id
  where sq.session_id = p_session_id
    and sq.position = p_position
    and s.user_id = p_user_id
    and s.completed_at is not null;

  if not found or not exists (select 1 from public.players where id = p_player_id) then
    return 'not_found';
  end if;

  if exists (
    select 1 from public.question_answers
    where question_id = v_question_id and entity_id = p_player_id
  ) then
    return 'already_valid';
  end if;

  insert into public.answer_reports (question_id, player_id, user_id)
  values (v_question_id, p_player_id, p_user_id)
  on conflict do nothing;

  return case when found then 'saved' else 'already_reported' end;
end;
$$;

/** Open reports, one row per question and reported player, most reported first. */
create function public.admin_list_reports(p_limit integer)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select coalesce(jsonb_agg(row_data), '[]'::jsonb)
  from (
    select jsonb_build_object(
      'question_id', r.question_id,
      'prompt', q.prompt,
      'player_id', r.player_id,
      'player_name', p.name,
      'birth_year', p.birth_year,
      'reports', count(*),
      'first_reported_at', min(r.created_at)
    ) as row_data
    from public.answer_reports r
    join public.questions q on q.id = r.question_id
    join public.players p on p.id = r.player_id
    where r.status = 'open'
    group by r.question_id, q.prompt, r.player_id, p.name, p.birth_year
    order by count(*) desc, min(r.created_at)
    limit p_limit
  ) grouped;
$$;

/** Closes every open report of one player on one question as not a valid answer. */
create function public.admin_dismiss_reports(p_question_id uuid, p_player_id bigint)
returns integer
language sql
set search_path = ''
as $$
  with dismissed as (
    update public.answer_reports
    set status = 'dismissed', resolved_at = now()
    where question_id = p_question_id and player_id = p_player_id and status = 'open'
    returning 1
  )
  select count(*)::integer from dismissed;
$$;

/** The daily puzzles from p_from onwards, with their questions in order. */
create function public.admin_upcoming_puzzles(p_from date, p_days integer)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select coalesce(jsonb_agg(row_data order by puzzle_date), '[]'::jsonb)
  from (
    select d.puzzle_date, jsonb_build_object(
      'date', d.puzzle_date,
      'number', d.puzzle_number,
      'questions', coalesce((
        select jsonb_agg(
          jsonb_build_object('id', q.id, 'prompt', q.prompt, 'source', q.source)
          order by dq.position
        )
        from public.daily_puzzle_questions dq
        join public.questions q on q.id = dq.question_id
        where dq.puzzle_date = d.puzzle_date
      ), '[]'::jsonb)
    ) as row_data
    from public.daily_puzzles d
    where d.puzzle_date >= p_from
    order by d.puzzle_date
    limit p_days
  ) days;
$$;

revoke execute on function
  public.is_question_live(uuid, date),
  public.admin_list_questions(text, public.question_status, public.question_source, integer, integer),
  public.admin_get_question(uuid, date),
  public.admin_set_tier_override(uuid, bigint, smallint, date),
  public.admin_add_answer(uuid, bigint, smallint, date),
  public.admin_remove_answer(uuid, bigint, date),
  public.create_manual_question(text, public.question_status, real, jsonb),
  public.report_missing_answer(uuid, uuid, smallint, bigint),
  public.admin_list_reports(integer),
  public.admin_dismiss_reports(uuid, bigint),
  public.admin_upcoming_puzzles(date, integer)
from public, anon, authenticated;
