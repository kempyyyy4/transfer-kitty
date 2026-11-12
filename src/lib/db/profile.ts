import "server-only";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase/server";

const historySchema = z.array(
  z.object({ date: z.string(), total_fee: z.number(), puzzle_number: z.number() }),
);

export interface HistoryRow {
  date: string;
  totalFee: number;
  puzzleNumber: number;
}

/** A user's finished daily games, oldest first. */
export async function getPlayerHistory(userId: string): Promise<HistoryRow[]> {
  const { data, error } = await getServiceClient().rpc("get_player_history", {
    p_user_id: userId,
  });
  if (error) throw new Error(`Reading the game history failed: ${error.message}`);

  return historySchema.parse(data).map((row) => ({
    date: row.date,
    totalFee: row.total_fee,
    puzzleNumber: row.puzzle_number,
  }));
}

/** The stored avatar, unchecked: the caller parses it. Null if the user has no profile. */
export async function getStoredAvatar(userId: string): Promise<unknown> {
  const { data, error } = await getServiceClient()
    .from("profiles")
    .select("avatar")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`Reading the avatar failed: ${error.message}`);

  return data?.avatar ?? null;
}

/**
 * Saves an avatar that the caller has already checked. Returns "no_profile" if the user
 * has not chosen a display name yet, since a profile starts with one.
 */
export async function saveAvatar(userId: string, avatar: object): Promise<"saved" | "no_profile"> {
  const { data, error } = await getServiceClient()
    .from("profiles")
    .update({ avatar, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .select("user_id");
  if (error) throw new Error(`Saving the avatar failed: ${error.message}`);

  return data.length > 0 ? "saved" : "no_profile";
}
