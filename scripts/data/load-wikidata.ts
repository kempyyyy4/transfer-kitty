import { existsSync, readFileSync } from "node:fs";
import type { Warehouse } from "./warehouse";
import { CAREER_SLICES, careerSliceFile, type CareerSpell } from "./wikidata";

/** Rebuilds the wd_careers table from the downloaded slices. Returns the number of spells. */
export async function loadWikidataCareers(warehouse: Warehouse): Promise<number> {
  const missing = CAREER_SLICES.filter((slice) => !existsSync(careerSliceFile(slice)));
  if (missing.length > 0) {
    throw new Error(
      `${missing.length} Wikidata slices are missing. Run "npm run wikidata:download" first.`,
    );
  }

  warehouse.run(`
    drop table if exists wd_careers;
    create table wd_careers (
      player_tm_id integer,
      player_qid text,
      team_qid text,
      team_tm_id integer,
      start_year integer,
      end_year integer,
      appearances integer
    )
  `);

  const insert = warehouse.inserter("wd_careers", 7);
  let spellCount = 0;

  await warehouse.transaction(async () => {
    for (const slice of CAREER_SLICES) {
      const spells = JSON.parse(readFileSync(careerSliceFile(slice), "utf8")) as CareerSpell[];
      for (const spell of spells) {
        insert([
          spell.playerTransfermarktId,
          spell.playerQid,
          spell.teamQid,
          spell.teamTransfermarktId,
          spell.startYear,
          spell.endYear,
          spell.appearances,
        ]);
      }
      spellCount += spells.length;
    }
  });

  // Player and team together, so checking one player's spell at one club is a single lookup.
  warehouse.run(`
    create index wd_careers_by_player_team on wd_careers (player_tm_id, team_tm_id);
    create index wd_careers_by_team on wd_careers (team_tm_id);
    analyze wd_careers;
  `);
  return spellCount;
}
