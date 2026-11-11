/**
 * Builds the summary tables the question templates read, from the raw tables.
 * Run after "npm run data:build". Safe to re-run.
 */
import {
  BIG_FIVE_LEAGUE_IDS,
  CHAMPIONS_LEAGUE_ID,
  EUROPA_LEAGUE_ID,
  FAME_WEIGHTS,
} from "@/config/fame";
import { openWarehouse, type Warehouse } from "./warehouse";

/** One row per player, club, competition and season: the unit most questions are built from. */
function buildPlayerSeasons(warehouse: Warehouse): void {
  warehouse.run(`
    drop table if exists player_seasons;
    create table player_seasons as
    select
      a.player_id,
      a.player_club_id as club_id,
      a.competition_id,
      g.season,
      count(*) as appearances,
      sum(a.goals) as goals,
      sum(a.red_cards) as red_cards
    from tm_appearances a
    join tm_games g on g.game_id = a.game_id
    group by a.player_id, a.player_club_id, a.competition_id, g.season;

    create index player_seasons_by_club on player_seasons (club_id, competition_id, season);
    create index player_seasons_by_player on player_seasons (player_id);
    create index player_seasons_by_competition on player_seasons (competition_id, season);
  `);
}

function buildPlayerFame(warehouse: Warehouse): void {
  const bigFive = BIG_FIVE_LEAGUE_IDS.map((id) => `'${id}'`).join(", ");
  const weights = FAME_WEIGHTS;

  warehouse.run(`
    drop table if exists player_fame;
    create table player_fame as
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

    create unique index player_fame_by_player on player_fame (player_id);
  `);
}

const warehouse = openWarehouse();
buildPlayerSeasons(warehouse);
buildPlayerFame(warehouse);

const [summary] = warehouse.query<{ seasons: number; players: number }>(
  `select (select count(*) from player_seasons) as seasons,
          (select count(*) from player_fame where fame > 0) as players`,
);
console.log(`player_seasons: ${summary?.seasons ?? 0} rows`);
console.log(`player_fame: ${summary?.players ?? 0} players with a fame score above zero`);
warehouse.close();
