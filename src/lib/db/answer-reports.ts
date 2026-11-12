import "server-only";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase/server";

const reportOutcomeSchema = z.enum(["saved", "not_found", "already_valid", "already_reported"]);
export type ReportOutcome = z.infer<typeof reportOutcomeSchema>;

/** See the report_missing_answer database function: only for a round the user finished. */
export async function saveAnswerReport(
  userId: string,
  sessionId: string,
  position: number,
  playerId: number,
): Promise<ReportOutcome> {
  const { data, error } = await getServiceClient().rpc("report_missing_answer", {
    p_user_id: userId,
    p_session_id: sessionId,
    p_position: position,
    p_player_id: playerId,
  });
  if (error) throw new Error(`Saving the report failed: ${error.message}`);
  return reportOutcomeSchema.parse(data);
}

const reportsSchema = z.array(
  z
    .object({
      question_id: z.string(),
      prompt: z.string(),
      player_id: z.number(),
      player_name: z.string(),
      birth_year: z.number().nullable(),
      reports: z.number(),
      first_reported_at: z.string(),
    })
    .transform((row) => ({
      questionId: row.question_id,
      prompt: row.prompt,
      playerId: row.player_id,
      playerName: row.player_name,
      birthYear: row.birth_year,
      reports: row.reports,
      firstReportedAt: row.first_reported_at,
    })),
);

export type OpenReport = z.infer<typeof reportsSchema>[number];

/** Open reports, one row per question and reported player, most reported first. */
export async function getOpenReports(limit: number): Promise<OpenReport[]> {
  const { data, error } = await getServiceClient().rpc("admin_list_reports", { p_limit: limit });
  if (error) throw new Error(`Reading reports failed: ${error.message}`);
  return reportsSchema.parse(data);
}

/** Returns how many reports were closed. */
export async function dismissReports(questionId: string, playerId: number): Promise<number> {
  const { data, error } = await getServiceClient().rpc("admin_dismiss_reports", {
    p_question_id: questionId,
    p_player_id: playerId,
  });
  if (error) throw new Error(`Dismissing reports failed: ${error.message}`);
  return z.number().parse(data);
}
