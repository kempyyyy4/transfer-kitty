/**
 * Downloads, from Wikidata, the nationality of players the Transfermarkt dataset leaves
 * blank (Samir Handanovic, Fabio Quagliarella and about 200 others), so questions such as
 * "a player from Slovenia" do not miss them. Run after "npm run data:build", then run
 * "npm run data:derive" to use it. Safe to re-run.
 *   npm run wikidata:nationality
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { openWarehouse } from "./warehouse";
import { NATIONALITY_FILE, WIKIDATA_DIR } from "./sources";
import type { WikidataNationality } from "./wikidata";
import { runQuery, USER_AGENT } from "./wikidata-query";

const BATCH = 100;
const SEARCH_ENDPOINT = "https://www.wikidata.org/w/api.php";

const warehouse = openWarehouse();
const blank = warehouse.query<{ player_id: number; name: string; wikidata_id: string | null }>(
  `select a.player_id, a.name, a.wikidata_id from all_players a
   join tm_players p on p.player_id = a.player_id
   where p.country_of_citizenship is null
     and exists (select 1 from player_seasons s where s.player_id = a.player_id)`,
);

/**
 * A player Wikidata does not link to his Transfermarkt ID, found by name instead. Only the
 * first result described as a footballer is taken; anyone else is left blank.
 */
async function findByName(name: string): Promise<string | null> {
  const url = new URL(SEARCH_ENDPOINT);
  for (const [key, value] of Object.entries({
    action: "wbsearchentities",
    search: name,
    language: "en",
    type: "item",
    limit: "5",
    format: "json",
  })) {
    url.searchParams.set(key, value);
  }
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) return null;
  const body = (await response.json()) as { search?: { id: string; description?: string }[] };
  return body.search?.find((item) => /football/i.test(item.description ?? ""))?.id ?? null;
}

const byNameQid = new Map<string, number>();
for (const player of blank.filter((row) => !row.wikidata_id)) {
  const qid = await findByName(player.name);
  if (qid) byNameQid.set(qid, player.player_id);
}
const qids = [
  ...blank.flatMap((row) => (row.wikidata_id ? [row.wikidata_id] : [])),
  ...byNameQid.keys(),
];

const found = new Map<string, WikidataNationality>();
for (let start = 0; start < qids.length; start += BATCH) {
  const batch = qids.slice(start, start + BATCH);
  const rows = await runQuery(
    `SELECT ?q ?sportLabel ?citizenshipLabel WHERE {
       VALUES ?p { ${batch.map((qid) => `wd:${qid}`).join(" ")} }
       BIND(STRAFTER(STR(?p), "entity/") AS ?q)
       OPTIONAL { ?p wdt:P1532 ?sport . ?sport rdfs:label ?sportLabel .
                  FILTER(LANG(?sportLabel) = "en") }
       OPTIONAL { ?p wdt:P27 ?citizenship . ?citizenship rdfs:label ?citizenshipLabel .
                  FILTER(LANG(?citizenshipLabel) = "en") }
     }`,
    `nationality ${start / BATCH + 1}`,
  );
  for (const row of rows) {
    const qid = row.q?.value;
    if (!qid) continue;
    const entry = found.get(qid) ?? { qid, playerId: byNameQid.get(qid), sport: [], citizenship: [] };
    const sport = row.sportLabel?.value;
    const citizenship = row.citizenshipLabel?.value;
    if (sport && !entry.sport.includes(sport)) entry.sport.push(sport);
    if (citizenship && !entry.citizenship.includes(citizenship)) {
      entry.citizenship.push(citizenship);
    }
    found.set(qid, entry);
  }
}

mkdirSync(WIKIDATA_DIR, { recursive: true });
writeFileSync(NATIONALITY_FILE, JSON.stringify([...found.values()]));
console.log(`nationality: ${found.size} of ${qids.length} players found on Wikidata`);
