import "server-only";
import { z } from "zod";
import { toSearchName } from "@/lib/search-name";
import { getServiceClient } from "@/lib/supabase/server";
import { inBatches } from "./batches";

const WRITE_BATCH_SIZE = 1000;
/** Supabase returns at most this many rows per request. */
const READ_PAGE_SIZE = 1000;

type EntityTable = "players" | "clubs";

export interface PlayerImport {
  transfermarktId: number;
  wikidataId: string | null;
  name: string;
  country: string | null;
  birthYear: number | null;
  position: string | null;
  fameScore: number;
}

export interface ClubImport {
  transfermarktId: number;
  name: string;
  country: string | null;
}

/** Adds or updates players, matched on their Transfermarkt ID. */
export async function upsertPlayers(players: readonly PlayerImport[]): Promise<void> {
  await upsertByTransfermarktId(
    "players",
    players.map((player) => ({
      transfermarkt_id: player.transfermarktId,
      wikidata_id: player.wikidataId,
      name: player.name,
      search_name: toSearchName(player.name),
      country: player.country,
      birth_year: player.birthYear,
      position: player.position,
      fame_score: player.fameScore,
    })),
  );
}

/** Adds or updates clubs, matched on their Transfermarkt ID. */
export async function upsertClubs(clubs: readonly ClubImport[]): Promise<void> {
  await upsertByTransfermarktId(
    "clubs",
    clubs.map((club) => ({
      transfermarkt_id: club.transfermarktId,
      name: club.name,
      search_name: toSearchName(club.name),
      country: club.country,
    })),
  );
}

async function upsertByTransfermarktId(
  table: EntityTable,
  rows: readonly Record<string, string | number | null>[],
): Promise<void> {
  for (const batch of inBatches(rows, WRITE_BATCH_SIZE)) {
    const { error } = await getServiceClient()
      .from(table)
      .upsert(batch, { onConflict: "transfermarkt_id" });
    if (error) throw new Error(`Saving ${table} failed: ${error.message}`);
  }
}

const idPairSchema = z.array(z.object({ id: z.number(), transfermarkt_id: z.number() }));

/** Maps each Transfermarkt ID to the row's own ID in our database. */
export async function getIdsByTransfermarktId(table: EntityTable): Promise<Map<number, number>> {
  const ids = new Map<number, number>();

  for (let from = 0; ; from += READ_PAGE_SIZE) {
    const { data, error } = await getServiceClient()
      .from(table)
      .select("id, transfermarkt_id")
      .not("transfermarkt_id", "is", null)
      .order("id")
      .range(from, from + READ_PAGE_SIZE - 1);
    if (error) throw new Error(`Reading ${table} failed: ${error.message}`);

    const page = idPairSchema.parse(data);
    for (const row of page) ids.set(row.transfermarkt_id, row.id);
    if (page.length < READ_PAGE_SIZE) return ids;
  }
}
