create type public.game_mode as enum ('daily', 'archive', 'unlimited', 'pack');
create type public.answer_outcome as enum ('correct', 'wrong', 'timeout');

-- How well known a question's best answers are: the starting popularity of its third most
-- popular answer. Daily puzzles are drawn from questions where even that answer is famous.
alter table public.questions add column prominence real not null default 0;
create index questions_by_prominence on public.questions (status, prominence);

create table public.daily_puzzles (
  -- The UK calendar day the puzzle is live for.
  puzzle_date date primary key,
  puzzle_number integer not null unique,
  created_at timestamptz not null default now()
);

create table public.daily_puzzle_questions (
  puzzle_date date not null references public.daily_puzzles (puzzle_date) on delete cascade,
  position smallint not null check (position >= 1),
  -- Unique: a question is used in at most one daily puzzle.
  question_id uuid not null unique references public.questions (id),
  primary key (puzzle_date, position)
);

create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mode public.game_mode not null,
  puzzle_date date references public.daily_puzzles (puzzle_date),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  total_fee bigint not null default 0,
  total_answer_ms integer not null default 0,
  constraint daily_sessions_have_a_date check (mode <> 'daily' or puzzle_date is not null)
);

-- The one-attempt rule: a user can never have two daily sessions for the same day.
create unique index one_daily_session_per_user
  on public.game_sessions (user_id, puzzle_date)
  where mode = 'daily';

create table public.session_questions (
  session_id uuid not null references public.game_sessions (id) on delete cascade,
  position smallint not null,
  question_id uuid not null references public.questions (id),
  -- Set by the database clock when the question is handed out. This is the timer.
  served_at timestamptz,
  answered_at timestamptz,
  entity_id bigint,
  outcome public.answer_outcome,
  -- Tier and fee are locked here at the moment of answering.
  tier smallint,
  fee bigint,
  primary key (session_id, position)
);

create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  request_count integer not null default 1,
  primary key (key, window_start)
);

-- Server only: row-level security is on with no policies, and the browser roles get no grants.
alter table public.daily_puzzles enable row level security;
alter table public.daily_puzzle_questions enable row level security;
alter table public.game_sessions enable row level security;
alter table public.session_questions enable row level security;
alter table public.rate_limits enable row level security;

revoke all on table
  public.daily_puzzles,
  public.daily_puzzle_questions,
  public.game_sessions,
  public.session_questions,
  public.rate_limits
from anon, authenticated;

/**
 * Counts one request against a limit and says whether it is allowed.
 * Requests are counted in fixed windows of p_window_seconds.
 */
create function public.consume_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  v_window timestamptz := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );
  v_used integer;
begin
  insert into public.rate_limits (key, window_start)
  values (p_key, v_window)
  on conflict (key, window_start) do update
    set request_count = public.rate_limits.request_count + 1
  returning request_count into v_used;

  -- First request of a new window: clear this key's old windows so the table stays small.
  if v_used = 1 then
    delete from public.rate_limits where key = p_key and window_start < v_window;
  end if;

  return v_used <= p_limit;
end;
$$;

/** Creates a day's puzzle from an ordered list of questions. Does nothing if the day has one. */
create function public.create_daily_puzzle(
  p_puzzle_date date,
  p_puzzle_number integer,
  p_question_ids uuid[]
)
returns boolean
language plpgsql
set search_path = ''
as $$
begin
  insert into public.daily_puzzles (puzzle_date, puzzle_number)
  values (p_puzzle_date, p_puzzle_number)
  on conflict (puzzle_date) do nothing;

  if not found then
    return false;
  end if;

  insert into public.daily_puzzle_questions (puzzle_date, position, question_id)
  select p_puzzle_date, listed.position, listed.question_id
  from unnest(p_question_ids) with ordinality as listed (question_id, position);

  return true;
end;
$$;

/** A random handful of well-known questions that no daily puzzle has used yet. */
create function public.sample_daily_candidates(p_min_prominence real, p_sample_size integer)
returns table (id uuid, template_key text, template_params jsonb)
language sql
set search_path = ''
as $$
  select q.id, q.template_key, q.template_params
  from public.questions q
  where q.status = 'active'
    and q.prominence >= p_min_prominence
    and not exists (
      select 1 from public.daily_puzzle_questions used where used.question_id = q.id
    )
  order by random()
  limit p_sample_size;
$$;

/**
 * Starts a user's attempt at a day's puzzle, or returns the one they already started.
 * The unique index on game_sessions is what makes a second attempt impossible.
 */
create function public.start_daily_session(p_user_id uuid, p_puzzle_date date)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_session_id uuid;
begin
  insert into public.game_sessions (user_id, mode, puzzle_date)
  values (p_user_id, 'daily', p_puzzle_date)
  on conflict (user_id, puzzle_date) where mode = 'daily' do nothing
  returning id into v_session_id;

  if v_session_id is null then
    select s.id into v_session_id
    from public.game_sessions s
    where s.user_id = p_user_id and s.mode = 'daily' and s.puzzle_date = p_puzzle_date;
    return v_session_id;
  end if;

  insert into public.session_questions (session_id, position, question_id)
  select v_session_id, d.position, d.question_id
  from public.daily_puzzle_questions d
  where d.puzzle_date = p_puzzle_date;

  return v_session_id;
end;
$$;

/**
 * Moves a session on and reports where it stands.
 * A question left open past the time limit is closed as a timeout, the next unanswered
 * question is handed out with the clock started, and a session with none left is completed.
 * Returns null if the session is not this user's.
 */
create function public.serve_next_question(
  p_session_id uuid,
  p_user_id uuid,
  p_time_limit_ms integer
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_limit interval := make_interval(secs => p_time_limit_ms / 1000.0);
  v_open public.session_questions;
  v_total integer;
begin
  perform 1 from public.game_sessions s
  where s.id = p_session_id and s.user_id = p_user_id
  for update;
  if not found then
    return null;
  end if;

  loop
    select sq.* into v_open
    from public.session_questions sq
    where sq.session_id = p_session_id and sq.outcome is null
    order by sq.position
    limit 1;

    if not found then
      update public.game_sessions s
      set completed_at = coalesce(s.completed_at, now()),
          total_fee = totals.fee,
          total_answer_ms = totals.answer_ms
      from (
        select coalesce(sum(sq.fee), 0) as fee,
               coalesce(sum(extract(epoch from sq.answered_at - sq.served_at) * 1000), 0)::integer
                 as answer_ms
        from public.session_questions sq
        where sq.session_id = p_session_id
      ) totals
      where s.id = p_session_id;

      return jsonb_build_object('status', 'completed');
    end if;

    if v_open.served_at is null then
      update public.session_questions sq
      set served_at = now()
      where sq.session_id = p_session_id and sq.position = v_open.position;
      v_open.served_at := now();
      exit;
    end if;

    exit when now() <= v_open.served_at + v_limit;

    -- The player left this question open past the limit: it is a timeout.
    update public.session_questions sq
    set outcome = 'timeout', tier = 0, fee = 0, answered_at = v_open.served_at + v_limit
    where sq.session_id = p_session_id and sq.position = v_open.position;

    update public.questions q
    set times_played = q.times_played + 1
    where q.id = v_open.question_id;
  end loop;

  select count(*) into v_total
  from public.session_questions sq
  where sq.session_id = p_session_id;

  return jsonb_build_object(
    'status', 'question',
    'position', v_open.position,
    'total', v_total,
    'prompt', (select q.prompt from public.questions q where q.id = v_open.question_id),
    'elapsed_ms', (extract(epoch from now() - v_open.served_at) * 1000)::integer,
    'kitty', (
      select coalesce(sum(sq.fee), 0)
      from public.session_questions sq
      where sq.session_id = p_session_id
    )
  );
end;
$$;

/**
 * Judges an answer to the question currently open in a session.
 * The time is measured on the database clock from when the question was served.
 * p_entity_id is null when the player gave no answer. p_fees lists the fee for each
 * tier level, starting with level 0, and comes from the app's tier config.
 * Returns null if the session is not this user's.
 */
create function public.submit_answer(
  p_session_id uuid,
  p_user_id uuid,
  p_position integer,
  p_entity_id bigint,
  p_time_limit_ms integer,
  p_fees bigint[]
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_limit interval := make_interval(secs => p_time_limit_ms / 1000.0);
  v_open public.session_questions;
  v_outcome public.answer_outcome;
  v_tier smallint := 0;
  v_times_given integer := 0;
  v_times_played integer;
begin
  perform 1 from public.game_sessions s
  where s.id = p_session_id and s.user_id = p_user_id
  for update;
  if not found then
    return null;
  end if;

  select sq.* into v_open
  from public.session_questions sq
  where sq.session_id = p_session_id and sq.position = p_position;

  if not found or v_open.served_at is null or v_open.outcome is not null then
    return jsonb_build_object('status', 'not_open');
  end if;

  if now() > v_open.served_at + v_limit or p_entity_id is null then
    v_outcome := 'timeout';
  else
    select coalesce(a.admin_tier_override, a.current_tier) into v_tier
    from public.question_answers a
    where a.question_id = v_open.question_id and a.entity_id = p_entity_id;

    if found then
      v_outcome := 'correct';
    else
      v_outcome := 'wrong';
      v_tier := 0;
    end if;
  end if;

  update public.session_questions sq
  set outcome = v_outcome,
      tier = v_tier,
      -- Postgres arrays count from 1, so tier level 0 is the first fee.
      fee = p_fees[v_tier + 1],
      entity_id = p_entity_id,
      answered_at = least(now(), v_open.served_at + v_limit)
  where sq.session_id = p_session_id and sq.position = p_position;

  update public.questions q
  set times_played = q.times_played + 1
  where q.id = v_open.question_id
  returning q.times_played into v_times_played;

  if v_outcome = 'correct' then
    update public.question_answers a
    set times_given = a.times_given + 1
    where a.question_id = v_open.question_id and a.entity_id = p_entity_id
    returning a.times_given into v_times_given;
  end if;

  return jsonb_build_object(
    'status', 'answered',
    'outcome', v_outcome,
    'tier', v_tier,
    'fee', p_fees[v_tier + 1],
    'times_given', v_times_given,
    'times_played', v_times_played
  );
end;
$$;

/**
 * What a player has done so far in a session: one entry per question already answered.
 * Questions not yet answered are left out, so their prompts are never revealed early.
 * Returns null if the session is not this user's.
 */
create function public.get_session_summary(p_session_id uuid, p_user_id uuid)
returns jsonb
language sql
set search_path = ''
as $$
  select jsonb_build_object(
    'puzzle_date', s.puzzle_date,
    'puzzle_number', (
      select d.puzzle_number from public.daily_puzzles d where d.puzzle_date = s.puzzle_date
    ),
    'completed', s.completed_at is not null,
    'total_questions', (
      select count(*) from public.session_questions sq where sq.session_id = s.id
    ),
    'answers', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'position', sq.position,
          'prompt', q.prompt,
          'outcome', sq.outcome,
          'tier', sq.tier,
          'fee', sq.fee,
          'answer', p.name,
          'times_given', coalesce(a.times_given, 0),
          'times_played', q.times_played
        )
        order by sq.position
      )
      from public.session_questions sq
      join public.questions q on q.id = sq.question_id
      left join public.players p on p.id = sq.entity_id
      left join public.question_answers a
        on a.question_id = sq.question_id and a.entity_id = sq.entity_id
      where sq.session_id = s.id and sq.outcome is not null
    ), '[]'::jsonb)
  )
  from public.game_sessions s
  where s.id = p_session_id and s.user_id = p_user_id;
$$;

/**
 * Replaces the stage 3 version so that a question's prominence is stored on import.
 * Everything else is unchanged: safe to re-run, matched on dedupe_key, and tiers that
 * players have already reshaped are left alone.
 */
create or replace function public.import_questions(payload jsonb)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  item jsonb;
  imported_id uuid;
  crowd_tiered boolean;
  imported_count integer := 0;
begin
  for item in select value from jsonb_array_elements(payload)
  loop
    insert into public.questions (
      prompt, answer_type, source, data_source, template_key, template_params, dedupe_key,
      answer_count, prominence
    )
    values (
      item ->> 'prompt',
      (item ->> 'answer_type')::public.answer_type,
      'generated',
      item ->> 'data_source',
      item ->> 'template_key',
      coalesce(item -> 'template_params', '{}'::jsonb),
      item ->> 'dedupe_key',
      jsonb_array_length(item -> 'answers'),
      coalesce((item ->> 'prominence')::real, 0)
    )
    on conflict (dedupe_key) do update set
      prompt = excluded.prompt,
      data_source = excluded.data_source,
      template_params = excluded.template_params,
      answer_count = excluded.answer_count,
      prominence = excluded.prominence,
      updated_at = now()
    returning id, tiers_recalculated_at is not null into imported_id, crowd_tiered;

    delete from public.question_answers existing
    where existing.question_id = imported_id
      and not exists (
        select 1
        from jsonb_array_elements(item -> 'answers') answer
        where (answer ->> 'entity_id')::bigint = existing.entity_id
      );

    insert into public.question_answers (
      question_id, entity_id, starting_tier, current_tier, starting_popularity
    )
    select
      imported_id,
      (answer ->> 'entity_id')::bigint,
      (answer ->> 'tier')::smallint,
      (answer ->> 'tier')::smallint,
      (answer ->> 'popularity')::real
    from jsonb_array_elements(item -> 'answers') answer
    on conflict (question_id, entity_id) do update set
      starting_tier = excluded.starting_tier,
      starting_popularity = excluded.starting_popularity,
      current_tier = case
        when crowd_tiered then public.question_answers.current_tier
        else excluded.starting_tier
      end;

    delete from public.question_tags where question_id = imported_id;

    insert into public.question_tags (question_id, tag_type, tag_value)
    select distinct imported_id, tag ->> 'type', tag ->> 'value'
    from jsonb_array_elements(coalesce(item -> 'tags', '[]'::jsonb)) tag;

    imported_count := imported_count + 1;
  end loop;

  return imported_count;
end;
$$;

revoke execute on function
  public.consume_rate_limit(text, integer, integer),
  public.create_daily_puzzle(date, integer, uuid[]),
  public.sample_daily_candidates(real, integer),
  public.start_daily_session(uuid, date),
  public.serve_next_question(uuid, uuid, integer),
  public.submit_answer(uuid, uuid, integer, bigint, integer, bigint[]),
  public.get_session_summary(uuid, uuid)
from public, anon, authenticated;
