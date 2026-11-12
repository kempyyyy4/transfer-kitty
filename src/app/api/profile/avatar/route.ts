import { RATE_LIMITS } from "@/config/rate-limits";
import { avatarChoiceSchema } from "@/features/avatar";
import { setAvatar } from "@/features/profile/server";
import { getUserId } from "@/lib/auth";
import { jsonError, notSignedIn, readJsonBody, tooManyRequests } from "@/lib/http";
import { isWithinRateLimit } from "@/lib/rate-limit";

const MESSAGES = {
  not_signed_in: "Sign in to build your avatar.",
  needs_name: "Choose your name on the Account page first.",
  unknown_item: "One of those items does not exist.",
  not_owned: "That item is in the shop. It opens soon.",
  repeated_accessory: "Each accessory can only be worn once.",
} as const;

/** Saves the signed-in player's avatar. Every item is checked on the server. */
export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return notSignedIn();
  if (!(await isWithinRateLimit(RATE_LIMITS.accountChange, userId))) return tooManyRequests();

  const body = await readJsonBody(request, avatarChoiceSchema);
  if ("reply" in body) return body.reply;

  const outcome = await setAvatar(body.data);
  if (outcome.status === "saved") return Response.json({ saved: true });
  const status = outcome.status === "not_signed_in" || outcome.status === "needs_name" ? 403 : 400;
  return jsonError(status, MESSAGES[outcome.status]);
}
