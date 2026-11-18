-- Unlimited gets Easy, Medium and Hard (Tom, 18 November 2026). Difficulty is a band of
-- question prominence: the fame of a question's third best-known answer. A ceiling is
-- added; null means none. Everything else about choosing questions is unchanged.
drop function public.pick_practice_questions(uuid, uuid, date, real, real, integer);

/**
 * Up to p_count questions for an Unlimited or pack round, ones the player has not seen first.
 * Never a question in today's or a coming daily puzzle, whose answers must stay secret.
 * A pack round draws only from that pack. Unlimited leaves out pack questions, famous
 * questions (prominence p_reserve and up) still waiting for their turn as a daily, and
 * questions outside the p_floor to p_ceiling band.
 */
create function public.pick_practice_questions(
  p_user_id uuid,
  p_pack_id uuid,
  p_today date,
  p_floor real,
  p_ceiling real,
  p_reserve real,
  p_count integer
)
returns setof uuid
language sql
set search_path = ''
as $$
  with seen as (
    select distinct sq.question_id
    from public.session_questions sq
    join public.game_sessions s on s.id = sq.session_id
    where s.user_id = p_user_id
  )
  select q.id
  from public.questions q
  where q.status = 'active'
    and not exists (
      select 1 from public.daily_puzzle_questions d
      where d.question_id = q.id and d.puzzle_date >= p_today
    )
    and (
      (p_pack_id is not null and exists (
        select 1 from public.pack_questions pq
        where pq.pack_id = p_pack_id and pq.question_id = q.id
      ))
      or (p_pack_id is null
        and not exists (select 1 from public.pack_questions pq where pq.question_id = q.id)
        and q.prominence >= p_floor
        and (p_ceiling is null or q.prominence < p_ceiling)
        and (
          q.prominence < p_reserve
          or exists (
            select 1 from public.daily_puzzle_questions d
            where d.question_id = q.id and d.puzzle_date < p_today
          )
        ))
    )
  order by q.id in (select question_id from seen), random()
  limit p_count;
$$;

revoke execute on function
  public.pick_practice_questions(uuid, uuid, date, real, real, real, integer)
from public, anon, authenticated;
