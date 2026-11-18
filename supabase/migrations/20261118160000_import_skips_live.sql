-- Re-importing questions must never change a question in today's daily puzzle: its
-- answers and fees are frozen for the day it is played. Such a question is skipped and
-- picks up the new data on the next import after midnight UK time.

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
  v_today date := (now() at time zone 'Europe/London')::date;
begin
  for item in select value from jsonb_array_elements(payload)
  loop
    if exists (
      select 1
      from public.questions q
      join public.daily_puzzle_questions d on d.question_id = q.id
      where q.dedupe_key = item ->> 'dedupe_key' and d.puzzle_date = v_today
    ) then
      continue;
    end if;

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
