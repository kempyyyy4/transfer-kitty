import { RATE_LIMITS } from "@/config/rate-limits";
import { reportAnswer, reportAnswerSchema } from "@/features/admin/server";
import { getUserId } from "@/lib/auth";
import { jsonError, notSignedIn, readJsonBody, tooManyRequests } from "@/lib/http";
import { isWithinRateLimit } from "@/lib/rate-limit";

const MESSAGES = {
  saved: "Thanks. We'll check it.",
  already_reported: "You've already reported that player. We'll check it.",
  already_valid: "That player is already a valid answer.",
  not_listed: "That player is not on the list.",
} as const;

/**
 * A player reports, for a question in their finished round, a valid answer missing from
 * the list or a listed answer that is wrong.
 */
export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return notSignedIn();
  if (!(await isWithinRateLimit(RATE_LIMITS.answerReport, userId))) return tooManyRequests();

  const body = await readJsonBody(request, reportAnswerSchema);
  if ("reply" in body) return body.reply;

  const { kind, sessionId, position, playerId } = body.data;
  const outcome = await reportAnswer(kind, userId, sessionId, position, playerId);
  if (outcome === "not_found") return jsonError(404, "Finish the round before reporting.");
  return Response.json({ message: MESSAGES[outcome] });
}
