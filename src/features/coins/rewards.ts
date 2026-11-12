import { COIN_REWARDS } from "@/config/coins";

export interface RoundForRewards {
  sessionId: string;
  /** How many of the round's answers were Galacticats. */
  galacticats: number;
  /** The player's streak including this round's day. */
  streak: number;
}

export interface RewardEntry {
  delta: number;
  reason: "daily_complete" | "galacticats" | "streak";
  sessionId: string;
  /** One per round and reason, so a retried grant never pays twice. */
  key: string;
}

/** The coins a finished daily round earns. */
export function roundRewards(round: RoundForRewards): RewardEntry[] {
  const entry = (reason: RewardEntry["reason"], delta: number): RewardEntry => ({
    delta,
    reason,
    sessionId: round.sessionId,
    key: `${reason}:${round.sessionId}`,
  });

  const entries = [entry("daily_complete", COIN_REWARDS.dailyComplete)];
  if (round.galacticats > 0) {
    entries.push(entry("galacticats", round.galacticats * COIN_REWARDS.perGalacticat));
  }
  const { everyDays, coins } = COIN_REWARDS.streak;
  if (round.streak > 0 && round.streak % everyDays === 0) entries.push(entry("streak", coins));
  return entries;
}
