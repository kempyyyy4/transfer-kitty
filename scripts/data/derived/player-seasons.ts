import type { Warehouse } from "../warehouse";

/**
 * One row per player, club, competition and season, from Transfermarkt's match data.
 * Most season-based questions are built from this.
 */
export function buildPlayerSeasons(warehouse: Warehouse): void {
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
