import "server-only";
import { checkChoice, parseStoredChoice, type AvatarChoice } from "@/features/avatar";
import { getVisitor } from "@/lib/auth";
import { getDisplayName, getPlayerHistory, getStoredAvatar, saveAvatar } from "@/lib/db";
import { ukDayOf } from "@/lib/time/uk-day";
import { computeStats } from "./stats";
import type { Profile } from "./types";

/** The visitor's profile. A visitor who has never played gets an empty one. */
export async function getProfile(now: Date): Promise<Profile> {
  const today = ukDayOf(now);
  const visitor = await getVisitor();
  if (!visitor) {
    return {
      status: "none",
      displayName: null,
      avatar: parseStoredChoice(null),
      stats: computeStats([], today),
      history: [],
      today,
    };
  }

  const [history, displayName, storedAvatar] = await Promise.all([
    getPlayerHistory(visitor.userId),
    visitor.isGuest ? null : getDisplayName(visitor.userId),
    visitor.isGuest ? null : getStoredAvatar(visitor.userId),
  ]);

  return {
    status: visitor.isGuest ? "guest" : "signed_in",
    displayName,
    avatar: parseStoredChoice(storedAvatar),
    stats: computeStats(history, today),
    history,
    today,
  };
}

export type AvatarOutcome =
  | { status: "saved" }
  | {
      status: "not_signed_in" | "needs_name" | "unknown_item" | "not_owned" | "repeated_accessory";
    };

/**
 * Saves the signed-in player's avatar after checking every item exists and is theirs to
 * wear. Until the shop opens in stage 11 nobody owns a priced item, so only free ones pass.
 */
export async function setAvatar(choice: AvatarChoice): Promise<AvatarOutcome> {
  const visitor = await getVisitor();
  if (!visitor || visitor.isGuest) return { status: "not_signed_in" };

  const owned = new Set<string>();
  const problem = checkChoice(choice, owned);
  if (problem) return { status: problem };

  const saved = await saveAvatar(visitor.userId, choice);
  return saved === "saved" ? { status: "saved" } : { status: "needs_name" };
}
