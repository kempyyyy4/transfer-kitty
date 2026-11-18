-- The analytics dashboard query, reworked to stay quick over a year: each day's figures
-- come from grouped passes joined to the calendar, not a lookup per day, and retention is
-- one join rather than a check per player.

/**
 * Everything the analytics dashboard shows for the UK days p_from to p_to, in one call.
 * Visits are a visitor's page views with no gap over 30 minutes.
 */
create or replace function public.admin_analytics(p_from date, p_to date)
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
  daily_views as (
    select day, count(distinct visitor) as visitors, count(*) as pageviews
    from views group by day
  ),
  daily_visits as (select day, sum(engaged_ms) as engaged_ms from visits group by day),
  daily_users as (
    select day, count(*) filter (where not is_anonymous) as accounts,
           count(*) filter (where is_anonymous) as guests
    from users group by day
  ),
  daily_sessions as (
    select day, count(*) as started, count(*) filter (where completed_at is not null) as completed,
           count(distinct user_id) as players
    from sessions group by day
  ),
  daily_paid as (select day, sum(amount_pence) as pence from paid group by day),
  cohort as (
    select f.user_id,
           bool_or(p.day = f.first_day + 1) as day1,
           bool_or(p.day is not null) as day7
    from first_play f
    left join play_days p on p.user_id = f.user_id
      and p.day between f.first_day + 1 and f.first_day + 7
    where f.first_day between p_from
      and least(p_to, (now() at time zone 'Europe/London')::date - 7)
    group by f.user_id
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
        'visitors', coalesce(v.visitors, 0),
        'pageviews', coalesce(v.pageviews, 0),
        'engagedMs', coalesce(x.engaged_ms, 0),
        'accounts', coalesce(u.accounts, 0),
        'guests', coalesce(u.guests, 0),
        'roundsStarted', coalesce(s.started, 0),
        'roundsCompleted', coalesce(s.completed, 0),
        'players', coalesce(s.players, 0),
        'revenuePence', coalesce(p.pence, 0)
      ) order by d.day)
      from days d
      left join daily_views v on v.day = d.day
      left join daily_visits x on x.day = d.day
      left join daily_users u on u.day = d.day
      left join daily_sessions s on s.day = d.day
      left join daily_paid p on p.day = d.day
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
          'day1', count(*) filter (where day1),
          'day7', count(*) filter (where day7)
        )
        from cohort
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
