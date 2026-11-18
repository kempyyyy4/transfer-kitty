import { existsSync, readFileSync } from "node:fs";
import { COUNTRY_ALIASES, WIKIDATA_COUNTRY_NAMES } from "@/config/countries";
import type { WikidataNationality } from "../wikidata";
import { NATIONALITY_FILE } from "../sources";
import type { Warehouse } from "../warehouse";

/** A country under the one name questions use for it. */
export function canonicalCountry(name: string): string {
  return COUNTRY_ALIASES[name] ?? name;
}

/**
 * Builds player_nationality: each player's country under one spelling, from Transfermarkt,
 * or from Wikidata where Transfermarkt is blank. A Wikidata country is only used if the
 * dataset itself knows that country, so a stray name never becomes a question of its own.
 */
export function buildPlayerNationality(warehouse: Warehouse): void {
  const players = warehouse.query<{ player_id: number; country: string | null; qid: string | null }>(
    `select p.player_id, p.country_of_citizenship as country, a.wikidata_id as qid
     from tm_players p left join all_players a on a.player_id = p.player_id`,
  );
  const known = new Set(
    players.flatMap((player) => (player.country ? [canonicalCountry(player.country)] : [])),
  );
  const fromWikidata = readWikidata(known);

  warehouse.run(`
    drop table if exists player_nationality;
    create table player_nationality (player_id integer primary key, country text, source text);
  `);
  const insert = warehouse.inserter("player_nationality", 3);
  let filled = 0;
  for (const player of players) {
    if (player.country) {
      insert([player.player_id, canonicalCountry(player.country), "transfermarkt"]);
      continue;
    }
    const country =
      (player.qid ? fromWikidata.get(player.qid) : undefined) ??
      fromWikidata.get(`player:${player.player_id}`);
    if (country) {
      insert([player.player_id, country, "wikidata"]);
      filled++;
    }
  }
  warehouse.run(`
    update all_players set country = (
      select n.country from player_nationality n where n.player_id = all_players.player_id
    ) where in_transfermarkt = 1;
  `);
  console.log(`player_nationality: ${filled} blank nationalities filled from Wikidata`);
}

/** Wikidata's country for each player it knows, mapped onto the dataset's own names. */
function readWikidata(known: ReadonlySet<string>): Map<string, string> {
  if (!existsSync(NATIONALITY_FILE)) return new Map();
  const entries = JSON.parse(readFileSync(NATIONALITY_FILE, "utf8")) as WikidataNationality[];
  const toKnown = (name: string) => {
    const mapped = canonicalCountry(WIKIDATA_COUNTRY_NAMES[name] ?? name);
    return known.has(mapped) ? mapped : null;
  };
  const result = new Map<string, string>();
  for (const entry of entries) {
    const country = [...entry.sport, ...entry.citizenship].map(toKnown).find(Boolean);
    if (!country) continue;
    // Players found by name are keyed by their Transfermarkt ID, as they have no link.
    result.set(entry.playerId ? `player:${entry.playerId}` : entry.qid, country);
  }
  return result;
}
