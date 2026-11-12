import { TIERS } from "@/config/tiers";
import type { AnswerOutcome } from "../types";

/** The tier name for a result, from the one tier config. */
export function tierName(level: number): string {
  return TIERS.find((tier) => tier.level === level)?.name ?? "";
}

/** A short line saying what happened, for the player. */
export function outcomeLine(outcome: AnswerOutcome, answer: string | null): string {
  if (outcome === "timeout") return "Out of time";
  if (outcome === "wrong") return answer ? `${answer} is not a valid answer` : "Not a valid answer";
  return answer ?? "Correct";
}
