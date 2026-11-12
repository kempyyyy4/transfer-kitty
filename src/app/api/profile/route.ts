import { RATE_LIMITS } from "@/config/rate-limits";
import { getProfile } from "@/features/profile/server";
import { getUserId } from "@/lib/auth";
import { clientAddress, tooManyRequests } from "@/lib/http";
import { isWithinRateLimit } from "@/lib/rate-limit";

/** The visitor's own profile: avatar, streaks, averages and game history. */
export async function GET(request: Request) {
  const limitKey = (await getUserId()) ?? `ip:${clientAddress(request)}`;
  if (!(await isWithinRateLimit(RATE_LIMITS.profile, limitKey))) return tooManyRequests();

  return Response.json(await getProfile(new Date()));
}
