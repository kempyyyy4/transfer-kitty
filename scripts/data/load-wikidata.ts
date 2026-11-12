/**
 * Loads the downloaded Wikidata slices into the local warehouse.
 * Part of "npm run data:build". Run "npm run wikidata:download" first.
 */
import { existsSync, readFileSync } from "node:fs";
import { openWarehouse, type Warehouse } from "./warehouse";
import {
  sliceFile,
  SLICES,
  type CareerSpell,
  type PlayerProfile,
  type WikidataDataset,
} from "./wikidata";

function readSlices<T>(dataset: WikidataDataset): T[] {
  const missing = SLICES.filter((slice) => !existsSync(sliceFile(dataset, slice)));
  if (missing.length > 0) {
    throw new Error(
      `${missing.length} Wikidata ${dataset} slices are missing. Run "npm run wikidata:download" first.`,
    );
  }
  return SLICES.flatMap((slice) => JSON.parse(readFileSync(sliceFile(dataset, slice), "utf8")));
}

async function loadCareers(warehouse: Warehouse): Promise<number> {
  const spells = readSlices<CareerSpell>("careers");
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
  await warehouse.transaction(async () => {
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
  });

  // Player and team together, so checking one player's spell at one club is a single lookup.
  warehouse.run(`
    create index wd_careers_by_player_team on wd_careers (player_tm_id, team_tm_id);
    create index wd_careers_by_team on wd_careers (team_tm_id);
    analyze wd_careers;
  `);
  return spells.length;
}

async function loadProfiles(warehouse: Warehouse): Promise<number> {
  const profiles = readSlices<PlayerProfile>("profiles");
  warehouse.run(`
    drop table if exists wd_profiles;
    create table wd_profiles (
      player_tm_id integer,
      player_qid text,
      name text,
      birth_year integer,
      sitelinks integer
    )
  `);

  const insert = warehouse.inserter("wd_profiles", 5);
  await warehouse.transaction(async () => {
    for (const profile of profiles) {
      insert([
        profile.playerTransfermarktId,
        profile.playerQid,
        profile.name,
        profile.birthYear,
        profile.sitelinks,
      ]);
    }
  });

  warehouse.run("create index wd_profiles_by_player on wd_profiles (player_tm_id)");
  return profiles.length;
}

const warehouse = openWarehouse();
console.log(`wd_careers: ${(await loadCareers(warehouse)).toLocaleString("en-GB")} club spells`);
console.log(`wd_profiles: ${(await loadProfiles(warehouse)).toLocaleString("en-GB")} players`);
warehouse.close();
