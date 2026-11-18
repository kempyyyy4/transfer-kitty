/** Running queries against Wikidata's query service, shared by the download scripts. */
import { setTimeout as sleep } from "node:timers/promises";
import { z } from "zod";
import { WIKIDATA_ENDPOINT } from "./sources";

/** The query service asks automated clients to identify themselves and to go gently. */
export const USER_AGENT = "TransferKittyDataBuild/0.1 (football trivia question generator)";
const MAX_ATTEMPTS = 5;

const value = z.object({ value: z.string() });
const rowSchema = z.record(z.string(), value.optional());
const resultSchema = z.object({ results: z.object({ bindings: z.array(rowSchema) }) });
export type ResultRow = z.infer<typeof rowSchema>;

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

/** Runs one query, waiting and retrying when the service is busy or rate-limiting. */
export async function runQuery(query: string, label: string): Promise<ResultRow[]> {
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
