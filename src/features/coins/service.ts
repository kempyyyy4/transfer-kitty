import "server-only";
import { getAccess } from "@/features/payments/server";
import { computeStats } from "@/features/profile/server";
import { getCoinBalance, getCoinsForSession, getPlayerHistory, grantCoins } from "@/lib/db";
import { ukDayOf } from "@/lib/time/uk-day";
import { roundRewards } from "./rewards";

/**
 * Pays a finished daily round's coins, once however often it is called, and returns what
 * the round earned in total. Called whenever the round's summary is read.
 */
export async function payRoundCoins(
  userId: string,
  sessionId: string,
  galacticats: number,
  now: Date,
): Promise<number> {
  const [history, access] = await Promise.all([getPlayerHistory(userId), getAccess(userId)]);
  const streak = computeStats(history, ukDayOf(now), { nineLives: access.lifetime }).currentStreak;
  await grantCoins(userId, roundRewards({ sessionId, galacticats, streak }));
  return getCoinsForSession(userId, sessionId);
}

export const getBalance = getCoinBalance;
