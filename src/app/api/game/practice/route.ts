import { RATE_LIMITS } from "@/config/rate-limits";
import { practiceRoundSchema, startPracticeGame } from "@/features/game/server";
import { getUserId } from "@/lib/auth";
import { jsonError, readJsonBody, tooManyRequests } from "@/lib/http";
import { isWithinRateLimit } from "@/lib/rate-limit";

const MESSAGES = {
  locked: "That needs the lifetime unlock or the pack.",
  not_found: "That puzzle is not in the archive.",
  empty: "There are no questions left to play here right now.",
} as const;

const STATUS = { locked: 403, not_found: 404, empty: 409 };

/** Starts an Archive, Unlimited or pack round for a player who has paid for it. */
export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return jsonError(403, MESSAGES.locked);
  if (!(await isWithinRateLimit(RATE_LIMITS.gameStart, userId))) return tooManyRequests();

  const body = await readJsonBody(request, practiceRoundSchema);
  if ("reply" in body) return body.reply;

  const outcome = await startPracticeGame(userId, body.data, new Date());
  if (outcome.status === "started") return Response.json(outcome.game);
  return jsonError(STATUS[outcome.status], MESSAGES[outcome.status]);
}
