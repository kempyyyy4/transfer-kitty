import type { TransfermarktTable } from "./sources";

export type ColumnType = "integer" | "real" | "text";

/**
 * The columns loaded from each downloaded table, and their types.
 * Columns not listed here are left out of the warehouse.
 */
export const TABLE_COLUMNS: Record<TransfermarktTable, Record<string, ColumnType>> = {
  competitions: {
    competition_id: "text",
    name: "text",
    sub_type: "text",
    type: "text",
    country_name: "text",
  },
  clubs: {
    club_id: "integer",
    club_code: "text",
    name: "text",
    domestic_competition_id: "text",
    last_season: "integer",
  },
  players: {
    player_id: "integer",
    name: "text",
    last_season: "integer",
    country_of_birth: "text",
    country_of_citizenship: "text",
    date_of_birth: "text",
    sub_position: "text",
    position: "text",
    international_caps: "integer",
    current_national_team_id: "integer",
    highest_market_value_in_eur: "integer",
  },
  games: {
    game_id: "integer",
    competition_id: "text",
    season: "integer",
    round: "text",
    date: "text",
    home_club_id: "integer",
    away_club_id: "integer",
    home_club_goals: "integer",
    away_club_goals: "integer",
    home_club_name: "text",
    away_club_name: "text",
    competition_type: "text",
  },
  club_games: {
    game_id: "integer",
    club_id: "integer",
    own_manager_name: "text",
    opponent_id: "integer",
    is_win: "integer",
  },
  appearances: {
    game_id: "integer",
    player_id: "integer",
    player_club_id: "integer",
    date: "text",
    competition_id: "text",
    red_cards: "integer",
    goals: "integer",
    assists: "integer",
    minutes_played: "integer",
  },
  transfers: {
    player_id: "integer",
    transfer_date: "text",
    from_club_id: "integer",
    to_club_id: "integer",
    from_club_name: "text",
    to_club_name: "text",
    transfer_fee: "real",
  },
  countries: {
    country_id: "integer",
    country_name: "text",
  },
  national_teams: {
    national_team_id: "integer",
    name: "text",
    country_name: "text",
  },
};

/** Indexes that keep the generator's joins fast. */
export const TABLE_INDEXES: Partial<Record<TransfermarktTable, string[][]>> = {
  clubs: [["club_id"]],
  players: [["player_id"]],
  games: [["game_id"], ["competition_id", "season"]],
  club_games: [["game_id", "club_id"]],
  appearances: [["player_id"], ["game_id"], ["player_club_id", "competition_id"]],
  transfers: [["player_id"], ["to_club_id"]],
};
