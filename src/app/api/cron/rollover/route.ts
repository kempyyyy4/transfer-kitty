import { timingSafeEqual } from "node:crypto";
import { scheduleDailyPuzzles } from "@/features/questions";
import { getServerEnv } from "@/lib/env";
import { jsonError } from "@/lib/http";
import { ukDayOf } from "@/lib/time/uk-day";

/**
 * Daily housekeeping, called by Vercel's scheduler (see vercel.json).
 * The puzzle itself changes at UK midnight without this: each request works out the UK
 * day for itself. This job only keeps puzzles scheduled ahead, so running it twice, or
 * missing a day, does no harm.
 */
export async function GET(request: Request) {
  const secret = getServerEnv().CRON_SECRET;
  if (!secret) return jsonError(503, "The scheduled job is not configured.");
  if (!hasSecret(request, secret)) return jsonError(401, "Not allowed.");

  const created = await scheduleDailyPuzzles(ukDayOf(new Date()));
  return Response.json({ puzzlesCreated: created });
}

/** Vercel sends the secret as a bearer token. Compared in constant time. */
function hasSecret(request: Request, secret: string): boolean {
  const sent = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return sent.length === expected.length && timingSafeEqual(sent, expected);
}
