-- Stage 12: payments, the lifetime unlock, Archive, Unlimited and packs.

-- What a player has paid for: 'lifetime', or 'pack:<pack id>'. Only the Stripe webhook
-- (or an admin) writes here, through server code.
create table public.entitlements (
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null check (key = 'lifetime' or key ~ '^pack:[0-9a-f-]{36}$'),
  source text not null check (source in ('stripe', 'admin')),
  stripe_ref text,
  created_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- One row per Stripe Checkout started. It is marked paid by the webhook, never the browser.
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_key text not null,
  amount_pence integer not null check (amount_pence > 0),
  stripe_session_id text unique,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index purchases_by_user on public.purchases (user_id, created_at);

-- Every Stripe event handled, so one sent twice is only acted on once.
create table public.stripe_events (
  event_id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);

alter table public.game_sessions add column pack_id uuid references public.packs (id);

alter table public.entitlements enable row level security;
alter table public.purchases enable row level security;
alter table public.stripe_events enable row level security;

revoke all on table public.entitlements, public.purchases, public.stripe_events
from anon, authenticated;

/**
 * Marks a paid Checkout as fulfilled and grants what was bought: an entitlement, or coins
 * added to the ledger. The event ID and the purchase's own status both stop a repeat.
 * Returns 'fulfilled', 'duplicate', 'unknown' or 'amount_mismatch'.
 */
create function public.fulfil_purchase(
  p_event_id text,
  p_event_type text,
  p_stripe_session_id text,
  p_amount_pence integer,
  p_entitlement_key text,
  p_coins integer
)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_purchase public.purchases;
begin
  insert into public.stripe_events (event_id, type) values (p_event_id, p_event_type)
  on conflict do nothing;
  if not found then
    return 'duplicate';
  end if;

  select * into v_purchase from public.purchases
  where stripe_session_id = p_stripe_session_id
  for update;
  if not found then
    return 'unknown';
  end if;
  if v_purchase.status = 'paid' then
    return 'duplicate';
  end if;
  if v_purchase.amount_pence <> p_amount_pence then
    return 'amount_mismatch';
  end if;

  update public.purchases set status = 'paid', paid_at = now() where id = v_purchase.id;

  if p_entitlement_key is not null then
    insert into public.entitlements (user_id, key, source, stripe_ref)
    values (v_purchase.user_id, p_entitlement_key, 'stripe', p_stripe_session_id)
    on conflict do nothing;
  end if;

  if coalesce(p_coins, 0) > 0 then
    insert into public.coin_ledger (user_id, delta, reason, idempotency_key)
    values (v_purchase.user_id, p_coins, 'coin_pack', 'coin_pack:' || p_stripe_session_id)
    on conflict do nothing;
  end if;

  return 'fulfilled';
end;
$$;

/**
 * Up to p_count questions for an Unlimited or pack round, ones the player has not seen first.
 * Never a question in today's or a coming daily puzzle, whose answers must stay secret.
 * A pack round draws only from that pack. Unlimited leaves out pack questions, and famous
 * questions (prominence p_reserve and up) still waiting for their turn as a daily.
 */
create function public.pick_practice_questions(
  p_user_id uuid,
  p_pack_id uuid,
  p_today date,
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

/** Starts a round that is not the daily: Archive, Unlimited or a pack. */
create function public.start_practice_session(
  p_user_id uuid,
  p_mode public.game_mode,
  p_puzzle_date date,
  p_pack_id uuid,
  p_question_ids uuid[]
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_session_id uuid;
begin
  if p_mode = 'daily' then
    raise exception 'Daily rounds start with start_daily_session';
  end if;

  insert into public.game_sessions (user_id, mode, puzzle_date, pack_id)
  values (p_user_id, p_mode, p_puzzle_date, p_pack_id)
  returning id into v_session_id;

  insert into public.session_questions (session_id, position, question_id)
  select v_session_id, listed.position, listed.question_id
  from unnest(p_question_ids) with ordinality as listed (question_id, position);

  return v_session_id;
end;
$$;

/** Replaces the stage 4 version: a question in any pack is kept out of the daily puzzle. */
create or replace function public.sample_daily_candidates(p_min_prominence real, p_sample_size integer)
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
    and not exists (select 1 from public.pack_questions pq where pq.question_id = q.id)
  order by random()
  limit p_sample_size;
$$;

/** Past daily puzzles, newest first, with whether the user has played each. */
create function public.get_archive(p_user_id uuid, p_today date)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'date', d.puzzle_date,
      'number', d.puzzle_number,
      'played', exists (
        select 1 from public.game_sessions s
        where s.user_id = p_user_id and s.puzzle_date = d.puzzle_date
          and s.completed_at is not null
      )
    )
    order by d.puzzle_date desc
  ), '[]'::jsonb)
  from public.daily_puzzles d
  where d.puzzle_date < p_today;
$$;

/** Replaces the stage 4 versions: only daily rounds change the crowd figures. */
create or replace function public.serve_next_question(
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
  v_mode public.game_mode;
begin
  select s.mode into v_mode from public.game_sessions s
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
    'kitty', (
      select coalesce(sum(sq.fee), 0)
      from public.session_questions sq
      where sq.session_id = p_session_id
    )
  );
end;
$$;

create or replace function public.submit_answer(
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
  v_mode public.game_mode;
begin
  select s.mode into v_mode from public.game_sessions s
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

/** Replaces the stage 4 version: also says which mode the round is, and its pack. */
create or replace function public.get_session_summary(p_session_id uuid, p_user_id uuid)
returns jsonb
language sql
set search_path = ''
as $$
  select jsonb_build_object(
    'mode', s.mode,
    'pack_name', (select p.name from public.packs p where p.id = s.pack_id),
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

revoke execute on function
  public.fulfil_purchase(text, text, text, integer, text, integer),
  public.pick_practice_questions(uuid, uuid, date, real, integer),
  public.start_practice_session(uuid, public.game_mode, date, uuid, uuid[]),
  public.sample_daily_candidates(real, integer),
  public.get_archive(uuid, date),
  public.serve_next_question(uuid, uuid, integer),
  public.submit_answer(uuid, uuid, integer, bigint, integer, bigint[]),
  public.get_session_summary(uuid, uuid)
from public, anon, authenticated;
