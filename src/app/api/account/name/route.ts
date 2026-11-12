import { RATE_LIMITS } from "@/config/rate-limits";
import { displayNameSchema, setDisplayName } from "@/features/account/server";
import { getUserId } from "@/lib/auth";
import { jsonError, notSignedIn, readJsonBody, tooManyRequests } from "@/lib/http";
import { isWithinRateLimit } from "@/lib/rate-limit";

/** Sets the signed-in player's display name, shown on Top Kitties. */
export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return notSignedIn();
  if (!(await isWithinRateLimit(RATE_LIMITS.accountChange, userId))) return tooManyRequests();

  const body = await readJsonBody(request, displayNameSchema);
  if ("reply" in body) return body.reply;

  const outcome = await setDisplayName(body.data.name);
  switch (outcome.status) {
    case "saved":
      return Response.json({ displayName: outcome.name });
    case "invalid":
      return jsonError(400, outcome.reason);
    case "taken":
      return jsonError(409, "Someone already has that name.");
    case "not_signed_in":
      return jsonError(403, "Sign in to choose a name.");
  }
}
