/**
 * Downloads players' club histories and profiles from Wikidata, slice by slice.
 * npm run wikidata:download     Safe to stop and re-run: finished slices are skipped.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import { WIKIDATA_DIR } from "./sources";
import { runQuery, type ResultRow } from "./wikidata-query";
import {
  careerSliceQuery,
  profileSliceQuery,
  sliceFile,
  SLICES,
  type CareerSpell,
  type PlayerProfile,
  type WikidataDataset,
} from "./wikidata";

const PAUSE_BETWEEN_SLICES_MS = 2000;


function toInteger(text: string | undefined): number | null {
  if (text === undefined) return null;
  const number = Number(text);
  return Number.isInteger(number) ? number : null;
}



function toCareerSpell(row: ResultRow): CareerSpell[] {
  const playerTransfermarktId = toInteger(row.tm?.value);
  if (playerTransfermarktId === null || !row.player || !row.teamQid) return [];
  return [
    {
      playerQid: row.player.value,
      playerTransfermarktId,
      teamQid: row.teamQid.value,
      teamTransfermarktId: toInteger(row.teamTm?.value),
      startYear: toInteger(row.startYear?.value),
      endYear: toInteger(row.endYear?.value),
      appearances: toInteger(row.apps?.value),
    },
  ];
}

function toPlayerProfile(row: ResultRow): PlayerProfile[] {
  const playerTransfermarktId = toInteger(row.tm?.value);
  if (playerTransfermarktId === null || !row.player) return [];
  return [
    {
      playerQid: row.player.value,
      playerTransfermarktId,
      name: row.name?.value ?? null,
      birthYear: toInteger(row.birthYear?.value),
      sitelinks: toInteger(row.sitelinks?.value) ?? 0,
    },
  ];
}

const DATASETS: Record<
  WikidataDataset,
  { query: (slice: string) => string; convert: (row: ResultRow) => object[] }
> = {
  careers: { query: careerSliceQuery, convert: toCareerSpell },
  profiles: { query: profileSliceQuery, convert: toPlayerProfile },
};

async function download(dataset: WikidataDataset): Promise<void> {
  const { query, convert } = DATASETS[dataset];
  let downloaded = 0;

  for (const slice of SLICES) {
    const file = sliceFile(dataset, slice);
    if (existsSync(file)) continue;

    const rows = (await runQuery(query(slice), `${dataset} ${slice}`)).flatMap(convert);
    writeFileSync(file, JSON.stringify(rows));
    downloaded++;
    console.log(`${dataset} ${slice}: ${rows.length} rows`);
    await sleep(PAUSE_BETWEEN_SLICES_MS);
  }
  console.log(`${dataset}: ${downloaded} slices downloaded, ${SLICES.length - downloaded} skipped`);
}

mkdirSync(WIKIDATA_DIR, { recursive: true });
await download("careers");
await download("profiles");
