/**
 * Builds the summary tables the question templates read, from the raw tables.
 * Part of "npm run data:build". Safe to re-run.
 */
import { buildClubSpells } from "./derived/club-spells";
import { buildPlayerFame } from "./derived/fame";
import { buildPlayerSeasons } from "./derived/player-seasons";
import { buildAllPlayers } from "./derived/players";
import { openWarehouse } from "./warehouse";

const warehouse = openWarehouse();

buildPlayerSeasons(warehouse);
buildAllPlayers(warehouse);
buildPlayerFame(warehouse);
buildClubSpells(warehouse);

const [summary] = warehouse.query<{
  seasons: number;
  players: number;
  wikidata_only: number;
  spells: number;
  wikidata_spells: number;
}>(`
  select (select count(*) from player_seasons) as seasons,
         (select count(*) from all_players) as players,
         (select count(*) from all_players where in_transfermarkt = 0) as wikidata_only,
         (select count(*) from club_spells) as spells,
         (select count(*) from club_spells where from_wikidata = 1) as wikidata_spells
`);
warehouse.close();

const count = (value: number | undefined) => (value ?? 0).toLocaleString("en-GB");
console.log(`player_seasons: ${count(summary?.seasons)} rows`);
console.log(
  `all_players: ${count(summary?.players)} players, ${count(summary?.wikidata_only)} only in Wikidata`,
);
console.log(
  `club_spells: ${count(summary?.spells)} player and club pairs, ${count(summary?.wikidata_spells)} known to Wikidata`,
);
