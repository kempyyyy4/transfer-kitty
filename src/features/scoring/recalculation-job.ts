import "server-only";
import { GAME_RULES } from "@/config/game";
import {
  getAnswerPlayCounts,
  getQuestionsDueForRecalculation,
  saveRecalculatedTiers,
} from "@/lib/db";
import { recalculateTiers } from "./recalculate-tiers";

/**
 * Recalculates tiers from real answers for every question that is due.
 * Today's daily questions are skipped, so fees never change during a day's game.
 * Returns how many questions were recalculated.
 */
export async function recalculateDueTiers(today: string): Promise<number> {
  const due = await getQuestionsDueForRecalculation(GAME_RULES.tierRecalculationThreshold, today);

  for (const { questionId, timesPlayed } of due) {
    const answers = await getAnswerPlayCounts(questionId);
    await saveRecalculatedTiers(questionId, recalculateTiers(answers), timesPlayed);
  }
  return due.length;
}
