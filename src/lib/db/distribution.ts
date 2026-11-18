import "server-only";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase/server";

const distributionSchema = z.object({
  players: z.coerce.number(),
  beaten: z.coerce.number(),
  yours: z.coerce.number(),
  best: z.coerce.number(),
  bins: z.array(z.coerce.number()),
});

export type KittyDistribution = z.infer<typeof distributionSchema>;

/**
 * The spread of every finished kitty on the day of the user's finished daily round. Null
 * if the session is not theirs, not a daily, or not finished. Counts only.
 */
export async function getKittyDistribution(
  sessionId: string,
  userId: string,
  bins: number,
): Promise<KittyDistribution | null> {
  const { data, error } = await getServiceClient().rpc("daily_kitty_distribution", {
    p_session_id: sessionId,
    p_user_id: userId,
    p_bins: bins,
  });
  if (error) throw new Error(`Reading the day's kitties failed: ${error.message}`);
  return data === null ? null : distributionSchema.parse(data);
}
