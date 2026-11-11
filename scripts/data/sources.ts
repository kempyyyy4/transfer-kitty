import path from "node:path";

/** Everything downloaded or built from data lives here. The folder is not committed. */
export const DATA_DIR = path.resolve("data");
export const TRANSFERMARKT_DIR = path.join(DATA_DIR, "raw", "transfermarkt");
export const WAREHOUSE_PATH = path.join(DATA_DIR, "build", "warehouse.sqlite");

/** Public download location given in the dcaribou/transfermarkt-datasets README. */
export const TRANSFERMARKT_BASE_URL = "https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data";

/**
 * The tables the generator reads. The dataset also has game_events, game_lineups and
 * player_valuations; they are large and nothing here needs them yet.
 */
export const TRANSFERMARKT_TABLES = [
  "competitions",
  "clubs",
  "players",
  "games",
  "club_games",
  "appearances",
  "transfers",
  "countries",
  "national_teams",
] as const;

export type TransfermarktTable = (typeof TRANSFERMARKT_TABLES)[number];

export function transfermarktFile(table: TransfermarktTable): string {
  return path.join(TRANSFERMARKT_DIR, `${table}.csv.gz`);
}
