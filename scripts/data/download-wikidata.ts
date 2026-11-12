/**
 * Downloads players' club histories and profiles from Wikidata, slice by slice.
 * npm run wikidata:download     Safe to stop and re-run: finished slices are skipped.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import { z } from "zod";
import { WIKIDATA_DIR, WIKIDATA_ENDPOINT } from "./sources";
import {
  careerSliceQuery,
  profileSliceQuery,
  sliceFile,
  SLICES,
  type CareerSpell,
  type PlayerProfile,
  type WikidataDataset,
} from "./wikidata";

/** The query service asks automated clients to identify themselves and to go gently. */
const USER_AGENT = "TransferKittyDataBuild/0.1 (football trivia question generator)";
const PAUSE_BETWEEN_SLICES_MS = 2000;
const MAX_ATTEMPTS = 5;

const value = z.object({ value: z.string() });
const rowSchema = z.record(z.string(), value.optional());
const resultSchema = z.object({ results: z.object({ bindings: z.array(rowSchema) }) });
type ResultRow = z.infer<typeof rowSchema>;

function toInteger(text: string | undefined): number | null {
  if (text === undefined) return null;
  const number = Number(text);
  return Number.isInteger(number) ? number : null;
}

/** Runs one query, waiting and retrying when the service is busy or rate-limiting. */
async function runQuery(query: string, label: string): Promise<ResultRow[]> {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(WIKIDATA_ENDPOINT, {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/sparql-results+json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ query }),
    });
    const rows = response.ok ? await readRows(response) : undefined;
    if (rows) return rows;

    const problem = response.ok ? "reply cut off" : `HTTP ${response.status}`;
    if (attempt === MAX_ATTEMPTS) {
      throw new Error(`${label}: ${problem} after ${attempt} attempts`);
    }
    // Wait as long as the service asks, or longer each time if it does not say.
    const retryAfterSeconds = Number(response.headers.get("retry-after")) || attempt * 15;
    console.log(`${label}: ${problem}, retrying in ${retryAfterSeconds}s`);
    await sleep(retryAfterSeconds * 1000);
  }
}

/**
 * The service starts sending rows before a query finishes, so a query that runs out of
 * time arrives as a success with its JSON cut short. That is reported as undefined.
 */
async function readRows(response: Response): Promise<ResultRow[] | undefined> {
  try {
    return resultSchema.parse(await response.json()).results.bindings;
  } catch (error) {
    if (error instanceof SyntaxError) return undefined;
    throw error;
  }
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
