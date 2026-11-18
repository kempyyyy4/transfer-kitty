-- Two changes Tom asked for on 18 November 2026:
--
-- 1. A wrong guess no longer ends a question. The player is told it is wrong and keeps
--    guessing until they are right or the time runs out, as in Krillion. Wrong guesses
--    are counted, and capped (p_max_wrong_guesses) so a script cannot try every name.
-- 2. Replays that count for nothing (Archive, Unlimited, packs) get a long server time
--    limit, so those rounds can be paused or played without a timer. Daily rounds keep
--    the strict limit, judged here by the database clock as before.

alter table public.session_questions
  add column wrong_guesses smallint not null default 0;

drop function public.serve_next_question(uuid, uuid, integer);
drop function public.submit_answer(uuid, uuid, integer, bigint, integer, bigint[]);

create function public.serve_next_question(
  p_session_id uuid,
  p_user_id uuid,
  p_time_limit_ms integer,
  p_practice_time_limit_ms integer
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_limit interval;
  v_open public.session_questions;
  v_total integer;
  v_mode public.game_mode;
begin
  select s.mode into v_mode from public.game_sessions s
  where s.id = p_session_id and s.user_id = p_user_id
  for update;
  if not found then
    return null;
  end if;

  v_limit := make_interval(secs => (
    case when v_mode = 'daily' then p_time_limit_ms else p_practice_time_limit_ms end
  ) / 1000.0);

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

    -- Only daily plays count towards the crowd figures that set tiers.
    if v_mode = 'daily' then
      update public.questions q
      set times_played = q.times_played + 1
      where q.id = v_open.question_id;
    end if;
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
    'wrong_guesses', v_open.wrong_guesses,
    'kitty', (
      select coalesce(sum(sq.fee), 0)
      from public.session_questions sq
      where sq.session_id = p_session_id
    )
  );
end;
$$;

/**
 * Judges one guess at the open question. A right answer, running out of time, or using up
 * the wrong guesses closes the question; any other wrong guess returns 'retry' and leaves
 * it open. A null p_entity_id means time ran out.
 */
create function public.submit_answer(
  p_session_id uuid,
  p_user_id uuid,
  p_position integer,
  p_entity_id bigint,
  p_time_limit_ms integer,
  p_practice_time_limit_ms integer,
  p_fees bigint[],
  p_max_wrong_guesses integer
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_limit interval;
  v_open public.session_questions;
  v_outcome public.answer_outcome;
  v_tier smallint := 0;
  v_times_given integer := 0;
  v_times_played integer;
  v_mode public.game_mode;
begin
  select s.mode into v_mode from public.game_sessions s
  where s.id = p_session_id and s.user_id = p_user_id
  for update;
  if not found then
    return null;
  end if;

  v_limit := make_interval(secs => (
    case when v_mode = 'daily' then p_time_limit_ms else p_practice_time_limit_ms end
  ) / 1000.0);

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
      v_tier := 0;
      -- A wrong guess: say so and keep the question open, until the guesses run out.
      if v_open.wrong_guesses + 1 < p_max_wrong_guesses then
        update public.session_questions sq
        set wrong_guesses = sq.wrong_guesses + 1
        where sq.session_id = p_session_id and sq.position = p_position;
        return jsonb_build_object(
          'status', 'retry',
          'guesses_left', p_max_wrong_guesses - v_open.wrong_guesses - 1
        );
      end if;
      v_outcome := 'wrong';
    end if;
  end if;

  update public.session_questions sq
  set outcome = v_outcome,
      tier = v_tier,
      -- Postgres arrays count from 1, so tier level 0 is the first fee.
      fee = p_fees[v_tier + 1],
      entity_id = p_entity_id,
      wrong_guesses = sq.wrong_guesses + case when v_outcome = 'wrong' then 1 else 0 end,
      answered_at = least(now(), v_open.served_at + v_limit)
  where sq.session_id = p_session_id and sq.position = p_position;

  -- Only daily plays count towards the crowd figures that set tiers. Replays in Archive,
  -- Unlimited and packs are judged against them but leave them unchanged.
  if v_mode = 'daily' then
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
  else
    select q.times_played into v_times_played from public.questions q where q.id = v_open.question_id;
    select coalesce(max(a.times_given), 0) into v_times_given from public.question_answers a
    where a.question_id = v_open.question_id and a.entity_id = p_entity_id;
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

revoke execute on function
  public.serve_next_question(uuid, uuid, integer, integer),
  public.submit_answer(uuid, uuid, integer, bigint, integer, integer, bigint[], integer)
from public, anon, authenticated;
