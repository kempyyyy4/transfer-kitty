import { RATE_LIMITS } from "@/config/rate-limits";
import { getAnswerLists, nextQuestionSchema } from "@/features/game/server";
import { getUserId } from "@/lib/auth";
import { jsonError, notFound, notSignedIn, tooManyRequests } from "@/lib/http";
import { isWithinRateLimit } from "@/lib/rate-limit";

/** Every valid answer to the game's questions. Refused until the round is finished. */
export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) return notSignedIn();
  if (!(await isWithinRateLimit(RATE_LIMITS.gamePlay, userId))) return tooManyRequests();

  const query = nextQuestionSchema.safeParse({
    sessionId: new URL(request.url).searchParams.get("sessionId"),
  });
  if (!query.success) return jsonError(400, "The request was not valid.");

  const lists = await getAnswerLists(userId, query.data.sessionId);
  if (lists === null) return notFound();
  if (lists === "not_completed") {
    return jsonError(403, "Finish your round to see every answer.");
  }
  return Response.json(lists);
}
