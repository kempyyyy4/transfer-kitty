import "server-only";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase/server";

const dueSchema = z.array(z.object({ id: z.string(), times_played: z.number() }));

/** Questions whose tiers are due to be recalculated. See the database function for the rules. */
export async function getQuestionsDueForRecalculation(
  minPlays: number,
  today: string,
): Promise<{ questionId: string; timesPlayed: number }[]> {
  const { data, error } = await getServiceClient().rpc("questions_due_for_recalculation", {
    p_min_plays: minPlays,
    p_today: today,
  });
  if (error) throw new Error(`Finding questions to recalculate failed: ${error.message}`);

  return dueSchema
    .parse(data)
    .map((row) => ({ questionId: row.id, timesPlayed: row.times_played }));
}

const answerRowSchema = z.array(
  z.object({
    entity_id: z.number(),
    times_given: z.number(),
    starting_popularity: z.number(),
  }),
);

/** One question's answers with how often each was given. A question has at most a few hundred. */
export async function getAnswerPlayCounts(questionId: string) {
  const { data, error } = await getServiceClient()
    .from("question_answers")
    .select("entity_id, times_given, starting_popularity")
    .eq("question_id", questionId);
  if (error) throw new Error(`Reading answer counts failed: ${error.message}`);

  return answerRowSchema.parse(data).map((row) => ({
    entityId: row.entity_id,
    timesGiven: row.times_given,
    startingPopularity: row.starting_popularity,
  }));
}

/** Saves recalculated tiers for one question and records when it was done. */
export async function saveRecalculatedTiers(
  questionId: string,
  tiers: readonly { entityId: number; tier: number }[],
  timesPlayed: number,
): Promise<void> {
  const { error } = await getServiceClient().rpc("apply_recalculated_tiers", {
    p_question_id: questionId,
    p_tiers: tiers.map((answer) => ({ entity_id: answer.entityId, tier: answer.tier })),
    p_times_played: timesPlayed,
  });
  if (error) throw new Error(`Saving recalculated tiers failed: ${error.message}`);
}
