-- How many plays a question had when its tiers were last recalculated, so the nightly job
-- only revisits questions that have been played since.
alter table public.questions
  add column times_played_at_recalculation integer not null default 0;

/**
 * Every valid answer to every question in a finished session, with its tier and how often
 * it was given. This is the full answer list players see after their round.
 * Returns {"status":"not_completed"} until the session is finished, so answers never reach
 * a player who is still playing. Returns null if the session is not this user's.
 */
create function public.get_session_answer_lists(p_session_id uuid, p_user_id uuid)
returns jsonb
language sql
set search_path = ''
as $$
  select case
    when s.completed_at is null then jsonb_build_object('status', 'not_completed')
    else jsonb_build_object(
      'status', 'completed',
      'questions', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'position', sq.position,
            'prompt', q.prompt,
            'times_played', q.times_played,
            'your_answer', sq.entity_id,
            'answers', coalesce((
              select jsonb_agg(
                jsonb_build_object(
                  'id', a.entity_id,
                  'name', p.name,
                  'tier', coalesce(a.admin_tier_override, a.current_tier),
                  'times_given', a.times_given
                )
                order by coalesce(a.admin_tier_override, a.current_tier),
                         a.times_given desc, p.name
              )
              from public.question_answers a
              join public.players p on p.id = a.entity_id
              where a.question_id = sq.question_id
            ), '[]'::jsonb)
          )
          order by sq.position
        )
        from public.session_questions sq
        join public.questions q on q.id = sq.question_id
        where sq.session_id = s.id
      ), '[]'::jsonb)
    )
  end
  from public.game_sessions s
  where s.id = p_session_id and s.user_id = p_user_id;
$$;

/**
 * Questions whose tiers should be recalculated from real answers: played at least
 * p_min_plays times, played since the last recalculation, and not in p_today's daily
 * puzzle, so fees never change while a day's game is being played.
 */
create function public.questions_due_for_recalculation(p_min_plays integer, p_today date)
returns table (id uuid, times_played integer)
language sql
set search_path = ''
as $$
  select q.id, q.times_played
  from public.questions q
  where q.status = 'active'
    and q.times_played >= p_min_plays
    and q.times_played > q.times_played_at_recalculation
    and not exists (
      select 1 from public.daily_puzzle_questions d
      where d.question_id = q.id and d.puzzle_date = p_today
    );
$$;

/**
 * Writes recalculated tiers for one question. p_tiers is a list of {entity_id, tier}.
 * Admin overrides live in their own column and are left untouched, so they keep winning.
 */
create function public.apply_recalculated_tiers(
  p_question_id uuid,
  p_tiers jsonb,
  p_times_played integer
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.question_answers a
  set current_tier = (t ->> 'tier')::smallint
  from jsonb_array_elements(p_tiers) t
  where a.question_id = p_question_id
    and a.entity_id = (t ->> 'entity_id')::bigint;

  update public.questions q
  set tiers_recalculated_at = now(),
      times_played_at_recalculation = p_times_played
  where q.id = p_question_id;
end;
$$;

revoke execute on function
  public.get_session_answer_lists(uuid, uuid),
  public.questions_due_for_recalculation(integer, date),
  public.apply_recalculated_tiers(uuid, jsonb, integer)
from public, anon, authenticated;
