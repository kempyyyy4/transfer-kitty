-- Stage 11: coins and the shop.
-- A player's balance is never stored: it is always the sum of their rows in coin_ledger.

create table public.coin_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  delta integer not null check (delta <> 0),
  reason text not null check (
    reason in ('daily_complete', 'galacticats', 'streak', 'purchase', 'coin_pack', 'admin')
  ),
  -- The round a reward was earned in. If that round is dropped when a guest signs in to an
  -- account that already played the day, the reward goes with it.
  session_id uuid references public.game_sessions (id) on delete cascade,
  -- "slot:item" for a purchase.
  item_key text,
  -- Stops a reward or purchase being counted twice, however often it is retried.
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

create index coin_ledger_by_user on public.coin_ledger (user_id, created_at);

-- The admin's changes to an item's price or availability. Items with no row here use the
-- price in src/config.
create table public.shop_prices (
  slot text not null check (slot in ('fur', 'breed', 'eyes', 'boots', 'kit', 'accessory')),
  item_id text not null,
  price_coins integer not null check (price_coins between 0 and 100000),
  on_sale boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (slot, item_id)
);

create table public.user_items (
  user_id uuid not null references auth.users (id) on delete cascade,
  slot text not null check (slot in ('fur', 'breed', 'eyes', 'boots', 'kit', 'accessory')),
  item_id text not null,
  ledger_id bigint references public.coin_ledger (id),
  acquired_at timestamptz not null default now(),
  primary key (user_id, slot, item_id)
);

alter table public.coin_ledger enable row level security;
alter table public.shop_prices enable row level security;
alter table public.user_items enable row level security;

revoke all on table public.coin_ledger, public.shop_prices, public.user_items
from anon, authenticated;

/** A user's coin balance: the sum of their ledger. */
create function public.coin_balance(p_user_id uuid)
returns bigint
language sql
stable
set search_path = ''
as $$
  select coalesce(sum(delta), 0)::bigint from public.coin_ledger where user_id = p_user_id;
$$;

/**
 * Credits rewards, each {"delta", "reason", "session_id", "key"}. An entry whose key was
 * already credited is skipped. Returns the coins actually added by this call.
 */
create function public.grant_coins(p_user_id uuid, p_entries jsonb)
returns integer
language sql
set search_path = ''
as $$
  with added as (
    insert into public.coin_ledger (user_id, delta, reason, session_id, idempotency_key)
    select
      p_user_id,
      (entry ->> 'delta')::integer,
      entry ->> 'reason',
      (entry ->> 'session_id')::uuid,
      entry ->> 'key'
    from jsonb_array_elements(p_entries) entry
    on conflict (idempotency_key) do nothing
    returning delta
  )
  select coalesce(sum(delta), 0)::integer from added;
$$;

/**
 * Buys one item for coins. The price comes from the server, never the browser.
 * A lock per user makes two purchases at once take turns, so a balance can never go below
 * zero. Returns 'bought', 'owned' or 'too_poor'.
 */
create function public.buy_item(p_user_id uuid, p_slot text, p_item_id text, p_price integer)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_ledger_id bigint;
begin
  if p_price <= 0 then
    raise exception 'A purchase needs a positive price';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('coins:' || p_user_id::text, 0));

  if exists (
    select 1 from public.user_items
    where user_id = p_user_id and slot = p_slot and item_id = p_item_id
  ) then
    return 'owned';
  end if;

  if public.coin_balance(p_user_id) < p_price then
    return 'too_poor';
  end if;

  insert into public.coin_ledger (user_id, delta, reason, item_key, idempotency_key)
  values (
    p_user_id, -p_price, 'purchase', p_slot || ':' || p_item_id,
    'purchase:' || p_user_id || ':' || p_slot || ':' || p_item_id
  )
  returning id into v_ledger_id;

  insert into public.user_items (user_id, slot, item_id, ledger_id)
  values (p_user_id, p_slot, p_item_id, v_ledger_id);

  return 'bought';
end;
$$;

/** Replaces the stage 7 version so a guest's coins and items follow them into the account. */
create or replace function public.merge_guest_into_account(p_guest_id uuid, p_account_id uuid)
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

  -- Rewards for a dropped game are deleted with it (coin_ledger.session_id cascades).
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

  update public.coin_ledger c set user_id = p_account_id where c.user_id = p_guest_id;

  insert into public.user_items (user_id, slot, item_id, ledger_id, acquired_at)
  select p_account_id, i.slot, i.item_id, i.ledger_id, i.acquired_at
  from public.user_items i
  where i.user_id = p_guest_id
  on conflict (user_id, slot, item_id) do nothing;
  delete from public.user_items i where i.user_id = p_guest_id;

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

revoke execute on function
  public.coin_balance(uuid),
  public.grant_coins(uuid, jsonb),
  public.buy_item(uuid, text, text, integer),
  public.merge_guest_into_account(uuid, uuid)
from public, anon, authenticated;
