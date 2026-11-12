import { timingSafeEqual } from "node:crypto";
import { scheduleDailyPuzzles } from "@/features/questions";
// Server-only, so it is not in the scoring feature's index, which client screens import.
import { recalculateDueTiers } from "@/features/scoring/recalculation-job";
import { getServerEnv } from "@/lib/env";
import { jsonError } from "@/lib/http";
import { ukDayOf } from "@/lib/time/uk-day";

/**
 * Daily housekeeping, called by Vercel's scheduler (see vercel.json).
 * The puzzle itself changes at UK midnight without this: each request works out the UK
 * day for itself. This job keeps puzzles scheduled ahead and recalculates tiers from real
 * answers, skipping today's questions so fees never change mid-day. Running it twice, or
 * missing a day, does no harm.
 */
export async function GET(request: Request) {
  const secret = getServerEnv().CRON_SECRET;
  if (!secret) return jsonError(503, "The scheduled job is not configured.");
  if (!hasSecret(request, secret)) return jsonError(401, "Not allowed.");

  const today = ukDayOf(new Date());
  const created = await scheduleDailyPuzzles(today);
  const recalculated = await recalculateDueTiers(today);
  return Response.json({ puzzlesCreated: created, questionsRecalculated: recalculated });
}

/** Vercel sends the secret as a bearer token. Compared in constant time. */
function hasSecret(request: Request, secret: string): boolean {
  const sent = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return sent.length === expected.length && timingSafeEqual(sent, expected);
}
