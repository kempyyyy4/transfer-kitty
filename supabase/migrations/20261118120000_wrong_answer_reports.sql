-- Players can now also report an answer on a question's list that should not be there.
-- Both kinds of report share one table and one admin queue.

create type public.report_kind as enum ('missing', 'wrong');

alter table public.answer_reports
  add column kind public.report_kind not null default 'missing';

-- A wrong answer the admin took off the list.
alter type public.report_status add value if not exists 'removed';

/**
 * A player reports that a listed answer to a question in their finished round is wrong.
 * Returns 'saved', 'not_found' (no such finished round), 'not_listed' (that player is not
 * an answer) or 'already_reported'.
 */
create function public.report_wrong_answer(
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

  if not found then
    return 'not_found';
  end if;

  if not exists (
    select 1 from public.question_answers
    where question_id = v_question_id and entity_id = p_player_id
  ) then
    return 'not_listed';
  end if;

  insert into public.answer_reports (question_id, player_id, user_id, kind)
  values (v_question_id, p_player_id, p_user_id, 'wrong')
  on conflict do nothing;

  return case when found then 'saved' else 'already_reported' end;
end;
$$;

revoke execute on function public.report_wrong_answer(uuid, uuid, smallint, bigint)
from public, anon, authenticated;

/** Open reports, one row per question, player and kind, most reported first. */
create or replace function public.admin_list_reports(p_limit integer)
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
      'kind', r.kind,
      'reports', count(*),
      'first_reported_at', min(r.created_at)
    ) as row_data
    from public.answer_reports r
    join public.questions q on q.id = r.question_id
    join public.players p on p.id = r.player_id
    where r.status = 'open'
    group by r.question_id, q.prompt, r.player_id, p.name, p.birth_year, r.kind
    order by count(*) desc, min(r.created_at)
    limit p_limit
  ) grouped;
$$;

/**
 * Removes a wrong answer, and closes any reports of it as removed. Rounds already played
 * keep the fee they were given. Returns 'removed', 'not_found' or 'live_today'.
 */
create or replace function public.admin_remove_answer(
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

  update public.answer_reports
  set status = 'removed', resolved_at = now()
  where question_id = p_question_id and player_id = p_entity_id
    and kind = 'wrong' and status = 'open';

  return 'removed';
end;
$$;
