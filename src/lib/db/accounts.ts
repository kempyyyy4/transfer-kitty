import "server-only";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase/server";

/** Remembers that this guest has started signing in. The token goes in their cookie. */
export async function savePendingMerge(token: string, guestId: string): Promise<void> {
  const { error } = await getServiceClient()
    .from("pending_merges")
    .insert({ token, guest_id: guestId });
  if (error) throw new Error(`Saving the sign-in failed: ${error.message}`);
}

/** The guest waiting on a token, if it is known and fresh. A token works only once. */
export async function takePendingMerge(
  token: string,
  maxAgeSeconds: number,
): Promise<string | null> {
  const { data, error } = await getServiceClient().rpc("take_pending_merge", {
    p_token: token,
    p_max_age_seconds: maxAgeSeconds,
  });
  if (error) throw new Error(`Reading the sign-in failed: ${error.message}`);

  return z.string().nullable().parse(data);
}

const mergeSchema = z.object({
  status: z.enum(["merged", "same_user", "not_a_guest"]),
  games_moved: z.number().optional(),
  games_dropped: z.number().optional(),
});

export type MergeResult =
  | { status: "merged"; gamesMoved: number; gamesDropped: number }
  | { status: "same_user" | "not_a_guest" };

/** Moves a guest's games and leagues into an account. See merge_guest_into_account. */
export async function mergeGuestIntoAccount(
  guestId: string,
  accountId: string,
): Promise<MergeResult> {
  const { data, error } = await getServiceClient().rpc("merge_guest_into_account", {
    p_guest_id: guestId,
    p_account_id: accountId,
  });
  if (error) throw new Error(`Merging the guest failed: ${error.message}`);

  const result = mergeSchema.parse(data);
  if (result.status !== "merged") return { status: result.status };
  return {
    status: "merged",
    gamesMoved: result.games_moved ?? 0,
    gamesDropped: result.games_dropped ?? 0,
  };
}

/** Removes a user entirely. Used for a guest once their play has moved to an account. */
export async function deleteUser(userId: string): Promise<void> {
  const { error } = await getServiceClient().auth.admin.deleteUser(userId);
  if (error) throw new Error(`Removing the user failed: ${error.message}`);
}

export async function getDisplayName(userId: string): Promise<string | null> {
  const { data, error } = await getServiceClient()
    .from("profiles")
    .select("display_name")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`Reading the profile failed: ${error.message}`);

  return data ? z.string().parse(data.display_name) : null;
}

/** Sets a player's name. Returns "taken" if someone else has it, in any capitals. */
export async function saveDisplayName(
  userId: string,
  displayName: string,
): Promise<"saved" | "taken"> {
  const { error } = await getServiceClient()
    .from("profiles")
    .upsert(
      { user_id: userId, display_name: displayName, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  // 23505 is Postgres's code for breaking a unique index: the name is in use.
  if (error?.code === "23505") return "taken";
  if (error) throw new Error(`Saving the name failed: ${error.message}`);
  return "saved";
}
