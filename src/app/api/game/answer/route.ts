import { RATE_LIMITS } from "@/config/rate-limits";
import { answerQuestion, answerSchema } from "@/features/game";
import { getUserId } from "@/lib/auth";
import { jsonError, notFound, notSignedIn, readJsonBody, tooManyRequests } from "@/lib/http";
import { isWithinRateLimit } from "@/lib/rate-limit";

/** Judges the player's answer to the question that is open. */
export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return notSignedIn();
  if (!(await isWithinRateLimit(RATE_LIMITS.gamePlay, userId))) return tooManyRequests();

  const body = await readJsonBody(request, answerSchema);
  if ("reply" in body) return body.reply;

  const { sessionId, position, playerId } = body.data;
  const feedback = await answerQuestion(userId, sessionId, position, playerId);
  if (feedback === null) return notFound();
  if (feedback === "not_open") return jsonError(409, "That question is not open for an answer.");

  return Response.json(feedback);
}
