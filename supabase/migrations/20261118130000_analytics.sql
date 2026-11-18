-- First-party analytics with no cookies and nothing stored on the visitor's device.
--
-- Each event carries only derived, coarse facts: the page, where the visit came from,
-- the country, the kind of device. A visitor is told apart only within one UK day, by a
-- hash of their address and browser with a random salt that is thrown away after a day,
-- so nobody can be followed from one day to the next and no IP address is ever stored.
-- Game, account and money figures come from the game's own tables, aggregated only.

create table public.analytics_salts (
  day date primary key,
  salt text not null,
  created_at timestamptz not null default now()
);

create table public.analytics_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  -- The UK day the event happened on.
  day date not null,
  -- 'pageview', 'engagement', or a named event such as 'share'.
  name text not null check (name ~ '^[a-z][a-z0-9_]{1,39}$'),
  -- A hash that only tells visitors apart within one day.
  visitor text not null check (char_length(visitor) = 16),
  -- Random per page load, to tie engagement time to its page view. Never stored on the device.
  pageview_id uuid,
  path text not null check (char_length(path) <= 200),
  referrer_host text check (char_length(referrer_host) <= 100),
  utm_source text check (char_length(utm_source) <= 60),
  utm_medium text check (char_length(utm_medium) <= 60),
  utm_campaign text check (char_length(utm_campaign) <= 60),
  country text check (char_length(country) <= 2),
  device text check (device in ('phone', 'tablet', 'desktop')),
  browser text check (char_length(browser) <= 20),
  os text check (char_length(os) <= 20),
  engaged_ms integer check (engaged_ms between 0 and 1800000),
  props jsonb check (props is null or pg_column_size(props) <= 1000)
);

create index analytics_events_by_day on public.analytics_events (day, name);
create index analytics_events_by_visitor on public.analytics_events (day, visitor, created_at);

alter table public.analytics_salts enable row level security;
alter table public.analytics_events enable row level security;
revoke all on table public.analytics_salts, public.analytics_events from anon, authenticated;

/**
 * The salt for one UK day, made the first time it is asked for. Salts more than a day
 * old are deleted on the way, so yesterday's visitors can never be matched to today's.
 */
create function public.analytics_salt(p_day date)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_salt text;
begin
  delete from public.analytics_salts where day < p_day - 1;

  insert into public.analytics_salts (day, salt)
  values (p_day, replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
  on conflict (day) do nothing;

  select salt into v_salt from public.analytics_salts where day = p_day;
  return v_salt;
end;
$$;

/** Deletes events older than p_keep_days. Called by the nightly job. Returns how many. */
create function public.analytics_cleanup(p_today date, p_keep_days integer)
returns integer
language sql
set search_path = ''
as $$
  with gone as (
    delete from public.analytics_events where day < p_today - p_keep_days returning 1
  )
  select count(*)::integer from gone;
$$;

/** Rows of {key, count} for one column of page views, most first. */
create function public.analytics_top(p_from date, p_to date, p_column text, p_limit integer)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if p_column not in (
    'path', 'referrer_host', 'utm_source', 'utm_campaign', 'country', 'device', 'browser', 'os'
  ) then
    raise exception 'unknown column %', p_column;
  end if;
  execute format($sql$
    select coalesce(jsonb_agg(jsonb_build_object('key', key, 'views', views,
                                                 'visitors', visitors) order by views desc), '[]')
    from (
      select coalesce(%1$I, '') as key, count(*) as views,
             count(distinct (day, visitor)) as visitors
      from public.analytics_events
      where name = 'pageview' and day between $1 and $2
      group by 1 order by 2 desc limit $3
    ) top
  $sql$, p_column)
  into v_result
  using p_from, p_to, p_limit;
  return v_result;
end;
$$;

/**
 * Everything the analytics dashboard shows for the UK days p_from to p_to, in one call.
 * Visits are a visitor's page views with no gap over 30 minutes.
 */
create function public.admin_analytics(p_from date, p_to date)
returns jsonb
language sql
stable
-- Reads auth.users for account counts; only server code can call it (see the revoke below).
security definer
set search_path = ''
as $$
  with
  days as (
    select d::date as day from generate_series(p_from, p_to, interval '1 day') d
  ),
  views as (
    select e.*,
           case when lag(e.created_at) over w is null
                  or e.created_at - lag(e.created_at) over w > interval '30 minutes'
                then 1 else 0 end as starts_visit
    from public.analytics_events e
    where e.name = 'pageview' and e.day between p_from and p_to
    window w as (partition by e.day, e.visitor order by e.created_at)
  ),
  numbered as (
    select v.*, sum(starts_visit) over (
             partition by v.day, v.visitor order by v.created_at) as visit_no
    from views v
  ),
  engagement as (
    select pageview_id, max(engaged_ms) as engaged_ms
    from public.analytics_events
    where name = 'engagement' and day between p_from and p_to and pageview_id is not null
    group by pageview_id
  ),
  visits as (
    select n.day, n.visitor, n.visit_no,
           min(n.created_at) as started_at, count(*) as pages,
           coalesce(sum(g.engaged_ms), 0) as engaged_ms,
           (array_agg(n.path order by n.created_at))[1] as entry_path,
           (array_agg(n.path order by n.created_at desc))[1] as exit_path
    from numbered n
    left join engagement g on g.pageview_id = n.pageview_id
    group by n.day, n.visitor, n.visit_no
  ),
  sessions as (
    select s.*, (s.started_at at time zone 'Europe/London')::date as day
    from public.game_sessions s
    where (s.started_at at time zone 'Europe/London')::date between p_from and p_to
  ),
  users as (
    select u.id, u.is_anonymous, (u.created_at at time zone 'Europe/London')::date as day
    from auth.users u
    where (u.created_at at time zone 'Europe/London')::date between p_from and p_to
  ),
  first_play as (
    select user_id, min((started_at at time zone 'Europe/London')::date) as first_day
    from public.game_sessions group by user_id
  ),
  play_days as (
    select distinct user_id, (started_at at time zone 'Europe/London')::date as day
    from public.game_sessions
  ),
  paid as (
    select p.*, (p.paid_at at time zone 'Europe/London')::date as day
    from public.purchases p
    where p.status = 'paid'
      and (p.paid_at at time zone 'Europe/London')::date between p_from and p_to
  ),
  answers as (
    select q.outcome, q.tier, s.mode,
           extract(epoch from (q.answered_at - q.served_at)) * 1000 as answer_ms
    from public.session_questions q
    join sessions s on s.id = q.session_id
    where q.outcome is not null
  )
  select jsonb_build_object(
    'from', p_from,
    'to', p_to,
    'traffic', jsonb_build_object(
      'visitors', (select count(distinct (day, visitor)) from views),
      'pageviews', (select count(*) from views),
      'visits', (select count(*) from visits),
      'bounceRate', (select round(100.0 * count(*) filter (where pages = 1 and engaged_ms < 10000)
                                  / nullif(count(*), 0), 1) from visits),
      'pagesPerVisit', (select round(avg(pages), 2) from visits),
      'avgVisitMs', (select round(avg(engaged_ms)) from visits),
      'avgEngagementPerVisitorMs', (
        select round(sum(engaged_ms)::numeric / nullif(count(distinct (day, visitor)), 0))
        from visits)
    ),
    'daily', (
      select jsonb_agg(jsonb_build_object(
        'day', d.day,
        'visitors', (select count(distinct visitor) from views v where v.day = d.day),
        'pageviews', (select count(*) from views v where v.day = d.day),
        'engagedMs', (select coalesce(sum(engaged_ms), 0) from visits x where x.day = d.day),
        'accounts', (select count(*) from users u where u.day = d.day and not u.is_anonymous),
        'guests', (select count(*) from users u where u.day = d.day and u.is_anonymous),
        'roundsStarted', (select count(*) from sessions s where s.day = d.day),
        'roundsCompleted', (select count(*) from sessions s
                            where s.day = d.day and s.completed_at is not null),
        'players', (select count(distinct user_id) from sessions s where s.day = d.day),
        'revenuePence', (select coalesce(sum(amount_pence), 0) from paid p where p.day = d.day)
      ) order by d.day)
      from days d
    ),
    'pages', public.analytics_top(p_from, p_to, 'path', 15),
    'referrers', public.analytics_top(p_from, p_to, 'referrer_host', 15),
    'utmSources', public.analytics_top(p_from, p_to, 'utm_source', 10),
    'utmCampaigns', public.analytics_top(p_from, p_to, 'utm_campaign', 10),
    'countries', public.analytics_top(p_from, p_to, 'country', 15),
    'devices', public.analytics_top(p_from, p_to, 'device', 3),
    'browsers', public.analytics_top(p_from, p_to, 'browser', 8),
    'systems', public.analytics_top(p_from, p_to, 'os', 8),
    'entryPages', (
      select coalesce(jsonb_agg(jsonb_build_object('key', entry_path, 'visits', n)
                                order by n desc), '[]')
      from (select entry_path, count(*) n from visits group by 1 order by 2 desc limit 10) t
    ),
    'exitPages', (
      select coalesce(jsonb_agg(jsonb_build_object('key', exit_path, 'visits', n)
                                order by n desc), '[]')
      from (select exit_path, count(*) n from visits group by 1 order by 2 desc limit 10) t
    ),
    'pageEngagement', (
      select coalesce(jsonb_agg(jsonb_build_object('key', path, 'avgMs', avg_ms, 'views', n)
                                order by n desc), '[]')
      from (
        select n.path, count(*) n, round(avg(g.engaged_ms)) avg_ms
        from numbered n join engagement g on g.pageview_id = n.pageview_id
        group by n.path order by 2 desc limit 15
      ) t
    ),
    'hours', (
      select jsonb_agg(coalesce(c, 0) order by h)
      from generate_series(0, 23) h
      left join (
        select extract(hour from created_at at time zone 'Europe/London')::int as hour, count(*) c
        from views group by 1
      ) t on t.hour = h
    ),
    'events', (
      select coalesce(jsonb_agg(jsonb_build_object('key', name, 'count', n, 'visitors', v)
                                order by n desc), '[]')
      from (
        select name, count(*) n, count(distinct (day, visitor)) v
        from public.analytics_events
        where day between p_from and p_to and name not in ('pageview', 'engagement')
        group by name
      ) t
    ),
    'game', jsonb_build_object(
      'byMode', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'mode', mode, 'started', started, 'completed', completed,
          'avgKitty', avg_kitty, 'players', players) order by started desc), '[]')
        from (
          select mode::text, count(*) started,
                 count(*) filter (where completed_at is not null) completed,
                 round(avg(total_fee) filter (where completed_at is not null)) avg_kitty,
                 count(distinct user_id) players
          from sessions group by mode
        ) t
      ),
      'tiers', (
        select coalesce(jsonb_agg(jsonb_build_object('tier', tier, 'count', n) order by tier), '[]')
        from (select tier, count(*) n from answers where mode = 'daily' group by tier) t
      ),
      'outcomes', (
        select coalesce(jsonb_agg(jsonb_build_object('outcome', outcome, 'count', n)), '[]')
        from (select outcome::text, count(*) n from answers group by 1) t
      ),
      'avgAnswerMs', (select round(avg(answer_ms)) from answers where outcome <> 'timeout'),
      'activePlayers', (select count(distinct user_id) from sessions),
      'newPlayers', (select count(*) from first_play where first_day between p_from and p_to),
      'returningPlayers', (
        select count(distinct s.user_id) from sessions s
        join first_play f on f.user_id = s.user_id where f.first_day < p_from
      ),
      'retention', (
        select jsonb_build_object(
          'cohort', count(*),
          'day1', count(*) filter (where exists (
            select 1 from play_days p where p.user_id = f.user_id and p.day = f.first_day + 1)),
          'day7', count(*) filter (where exists (
            select 1 from play_days p where p.user_id = f.user_id
              and p.day between f.first_day + 1 and f.first_day + 7))
        )
        from first_play f
        where f.first_day between p_from and least(p_to, (now() at time zone 'Europe/London')::date - 7)
      )
    ),
    'accounts', jsonb_build_object(
      'newAccounts', (select count(*) from users where not is_anonymous),
      'newGuests', (select count(*) from users where is_anonymous),
      'totalAccounts', (select count(*) from auth.users where not is_anonymous),
      'totalGuests', (select count(*) from auth.users where is_anonymous),
      'profiles', (select count(*) from public.profiles)
    ),
    'money', jsonb_build_object(
      'revenuePence', (select coalesce(sum(amount_pence), 0) from paid),
      'purchases', (select count(*) from paid),
      'checkoutsStarted', (
        select count(*) from public.purchases
        where (created_at at time zone 'Europe/London')::date between p_from and p_to),
      'byProduct', (
        select coalesce(jsonb_agg(jsonb_build_object('key', product_key, 'count', n,
                                                     'pence', pence) order by pence desc), '[]')
        from (select product_key, count(*) n, sum(amount_pence) pence from paid group by 1) t
      ),
      'coinsEarned', (
        select coalesce(sum(delta), 0) from public.coin_ledger
        where delta > 0 and (created_at at time zone 'Europe/London')::date between p_from and p_to),
      'coinsSpent', (
        select coalesce(-sum(delta), 0) from public.coin_ledger
        where delta < 0 and (created_at at time zone 'Europe/London')::date between p_from and p_to)
    ),
    'social', jsonb_build_object(
      'leaguesCreated', (
        select count(*) from public.leagues
        where (created_at at time zone 'Europe/London')::date between p_from and p_to),
      'leagueJoins', (
        select count(*) from public.league_members
        where (joined_at at time zone 'Europe/London')::date between p_from and p_to),
      'reports', (
        select count(*) from public.answer_reports
        where (created_at at time zone 'Europe/London')::date between p_from and p_to)
    )
  );
$$;

revoke execute on function
  public.analytics_salt(date),
  public.analytics_cleanup(date, integer),
  public.analytics_top(date, date, text, integer),
  public.admin_analytics(date, date)
from public, anon, authenticated;
