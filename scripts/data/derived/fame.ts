import {
  BIG_FIVE_LEAGUE_IDS,
  CHAMPIONS_LEAGUE_ID,
  EUROPA_LEAGUE_ID,
  FAME_WEIGHTS,
} from "@/config/fame";
import { WIKIPEDIA_FAME } from "@/config/wikidata";
import type { Warehouse } from "../warehouse";

/** Fame from matches in the data: the main signal, complete only from 2012/13. */
function buildMatchFame(warehouse: Warehouse): void {
  const bigFive = BIG_FIVE_LEAGUE_IDS.map((id) => `'${id}'`).join(", ");
  const weights = FAME_WEIGHTS;

  warehouse.run(`
    drop table if exists match_fame;
    create table match_fame as
    with totals as (
      select
        s.player_id,
        sum(case when s.competition_id in (${bigFive}) then s.appearances else 0 end) as big_five,
        sum(case when c.type = 'domestic_league' and s.competition_id not in (${bigFive})
                 then s.appearances else 0 end) as other_top_league,
        sum(case when s.competition_id = '${CHAMPIONS_LEAGUE_ID}' then s.appearances else 0 end)
          as champions_league,
        sum(case when s.competition_id = '${EUROPA_LEAGUE_ID}' then s.appearances else 0 end)
          as europa_league,
        sum(case when c.type = 'national_team_competition' then s.appearances else 0 end)
          as tournament
      from player_seasons s
      join tm_competitions c on c.competition_id = s.competition_id
      group by s.player_id
    )
    select
      p.player_id,
      coalesce(t.big_five, 0) * ${weights.bigFiveLeagueAppearance}
        + coalesce(t.other_top_league, 0) * ${weights.otherTopLeagueAppearance}
        + coalesce(t.champions_league, 0) * ${weights.championsLeagueAppearance}
        + coalesce(t.europa_league, 0) * ${weights.europaLeagueAppearance}
        + coalesce(t.tournament, 0) * ${weights.majorTournamentAppearance}
        + coalesce(p.international_caps, 0) * ${weights.internationalCap}
        + min(coalesce(p.highest_market_value_in_eur, 0) / 1000000.0,
              ${weights.peakMarketValueCapMillionEur}) * ${weights.peakMarketValuePerMillionEur}
        as fame
    from tm_players p
    left join totals t on t.player_id = p.player_id;
    create unique index match_fame_by_player on match_fame (player_id);
  `);
}

/**
 * Builds edition_fame: the fame a player gets for having a given number of Wikipedia
 * editions. It is matched by rank against players whose whole peak is inside the match
 * data: someone with more editions than 99% of them gets the match fame that beats 99%
 * of them. Matching by rank, not by a fixed rate, is what puts legends level with
 * today's stars: fame and editions do not rise in a straight line together.
 */
function buildEditionFame(warehouse: Warehouse): void {
  const years = WIKIPEDIA_FAME.calibrationBirthYears;
  const cohort = warehouse.query<{ sitelinks: number; fame: number }>(`
    select a.sitelinks, m.fame
    from all_players a
    join match_fame m on m.player_id = a.player_id
    where a.birth_year between ${years.from} and ${years.to}
      and a.wikidata_id is not null
  `);
  if (cohort.length === 0) throw new Error("No players to calibrate Wikipedia fame on.");

  const editions = cohort.map((row) => row.sitelinks).sort((a, b) => a - b);
  const fames = cohort.map((row) => row.fame).sort((a, b) => a - b);

  warehouse.run(`
    drop table if exists edition_fame;
    create table edition_fame (sitelinks integer primary key, fame real);
  `);
  const insert = warehouse.inserter("edition_fame", 2);
  const counts = warehouse.query<{ sitelinks: number }>(
    "select distinct sitelinks from all_players",
  );
  for (const { sitelinks } of counts) {
    const rank = countAtOrBelow(editions, sitelinks);
    insert([sitelinks, rank === 0 ? 0 : (fames[rank - 1] ?? 0)]);
  }
}

/** How many values in an ascending list are at or below `limit`. */
function countAtOrBelow(sorted: readonly number[], limit: number): number {
  let low = 0;
  let high = sorted.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if ((sorted[middle] ?? Infinity) <= limit) low = middle + 1;
    else high = middle;
  }
  return low;
}

/**
 * Builds player_fame for every player. Older players and players with no match data get
 * the higher of their match fame and their Wikipedia fame; everyone else keeps match
 * fame alone.
 */
export function buildPlayerFame(warehouse: Warehouse): void {
  buildMatchFame(warehouse);
  buildEditionFame(warehouse);

  warehouse.run(`
    drop table if exists player_fame;
    create table player_fame as
    select
      a.player_id,
      case
        when a.birth_year >= ${WIKIPEDIA_FAME.appliesToPlayersBornBefore}
             and coalesce(m.fame, 0) > 0
          then m.fame
        else max(coalesce(m.fame, 0), coalesce(e.fame, 0))
      end as fame
    from all_players a
    left join match_fame m on m.player_id = a.player_id
    left join edition_fame e on e.sitelinks = a.sitelinks;
    create unique index player_fame_by_player on player_fame (player_id);
  `);
}
