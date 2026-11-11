/**
 * Downloads players' club histories from Wikidata, slice by slice.
 * npm run wikidata:download     Safe to stop and re-run: finished slices are skipped.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import { z } from "zod";
import { WIKIDATA_DIR, WIKIDATA_ENDPOINT } from "./sources";
import { CAREER_SLICES, careerSliceFile, careerSliceQuery, type CareerSpell } from "./wikidata";

/** The query service asks automated clients to identify themselves and to go gently. */
const USER_AGENT = "TransferKittyDataBuild/0.1 (football trivia question generator)";
const PAUSE_BETWEEN_SLICES_MS = 2000;
const MAX_ATTEMPTS = 5;

const value = z.object({ value: z.string() });
const resultSchema = z.object({
  results: z.object({
    bindings: z.array(
      z.object({
        player: value,
        tm: value,
        teamQid: value,
        teamTm: value.optional(),
        startYear: value.optional(),
        endYear: value.optional(),
        apps: value.optional(),
      }),
    ),
  }),
});

function toInteger(text: string | undefined): number | null {
  if (text === undefined) return null;
  const number = Number(text);
  return Number.isInteger(number) ? number : null;
}

async function fetchSlice(slice: string): Promise<CareerSpell[]> {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(WIKIDATA_ENDPOINT, {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/sparql-results+json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ query: careerSliceQuery(slice) }),
    });

    if (response.ok) {
      const parsed = resultSchema.parse(await response.json());
      return parsed.results.bindings.flatMap((row) => {
        const playerTransfermarktId = toInteger(row.tm.value);
        if (playerTransfermarktId === null) return [];
        return {
          playerQid: row.player.value,
          playerTransfermarktId,
          teamQid: row.teamQid.value,
          teamTransfermarktId: toInteger(row.teamTm?.value),
          startYear: toInteger(row.startYear?.value),
          endYear: toInteger(row.endYear?.value),
          appearances: toInteger(row.apps?.value),
        };
      });
    }

    if (attempt === MAX_ATTEMPTS) {
      throw new Error(`Slice ${slice}: HTTP ${response.status} after ${attempt} attempts`);
    }
    // Busy or rate-limited: wait as long as the service asks, or longer each time.
    const retryAfterSeconds = Number(response.headers.get("retry-after")) || attempt * 15;
    console.log(`slice ${slice}: HTTP ${response.status}, retrying in ${retryAfterSeconds}s`);
    await sleep(retryAfterSeconds * 1000);
  }
}

mkdirSync(WIKIDATA_DIR, { recursive: true });
let downloaded = 0;

for (const slice of CAREER_SLICES) {
  const file = careerSliceFile(slice);
  if (existsSync(file)) continue;

  const spells = await fetchSlice(slice);
  writeFileSync(file, JSON.stringify(spells));
  downloaded++;
  console.log(`slice ${slice}: ${spells.length} club spells`);
  await sleep(PAUSE_BETWEEN_SLICES_MS);
}

console.log(
  `Done: ${downloaded} slices downloaded, ${CAREER_SLICES.length - downloaded} already present.`,
);
