import "server-only";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase/server";

export interface PlayerMatch {
  id: number;
  name: string;
  birthYear: number | null;
  country: string | null;
}

const matchSchema = z.array(
  z.object({
    id: z.number(),
    name: z.string(),
    birth_year: z.number().nullable(),
    country: z.string().nullable(),
  }),
);

/**
 * Players whose name contains the search text, best known first.
 * It searches every player in the database and knows nothing about any question, so the
 * suggestions cannot give an answer away. `searchName` must come from toSearchName().
 */
export async function searchPlayers(searchName: string, limit: number): Promise<PlayerMatch[]> {
  const { data, error } = await getServiceClient()
    .from("players")
    .select("id, name, birth_year, country")
    .like("search_name", `%${searchName}%`)
    .order("fame_score", { ascending: false })
    .order("id")
    .limit(limit);
  if (error) throw new Error(`Searching players failed: ${error.message}`);

  return matchSchema.parse(data).map((row) => ({
    id: row.id,
    name: row.name,
    birthYear: row.birth_year,
    country: row.country,
  }));
}
