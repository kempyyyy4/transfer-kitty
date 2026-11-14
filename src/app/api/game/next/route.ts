import { RATE_LIMITS } from "@/config/rate-limits";
import { advanceGame, nextQuestionSchema } from "@/features/game/server";
import { getUserId } from "@/lib/auth";
import { notFound, notSignedIn, readJsonBody, tooManyRequests } from "@/lib/http";
import { isWithinRateLimit } from "@/lib/rate-limit";

/** The question the player should see now, with the server's clock started on it. */
export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return notSignedIn();
  if (!(await isWithinRateLimit(RATE_LIMITS.gamePlay, userId))) return tooManyRequests();

  const body = await readJsonBody(request, nextQuestionSchema);
  if ("reply" in body) return body.reply;

  const state = await advanceGame(userId, body.data.sessionId);
  return state ? Response.json(state) : notFound();
}
