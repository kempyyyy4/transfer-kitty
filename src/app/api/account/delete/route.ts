import { RATE_LIMITS } from "@/config/rate-limits";
import { deleteAccount, deleteAccountSchema } from "@/features/account/server";
import { getUserId } from "@/lib/auth";
import { jsonError, readJsonBody, tooManyRequests } from "@/lib/http";
import { isWithinRateLimit } from "@/lib/rate-limit";

/** Deletes the signed-in player's account for good. The body must say DELETE. */
export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return jsonError(403, "Sign in to delete your account.");
  if (!(await isWithinRateLimit(RATE_LIMITS.accountChange, userId))) return tooManyRequests();

  const body = await readJsonBody(request, deleteAccountSchema);
  if ("reply" in body) return body.reply;

  const outcome = await deleteAccount();
  if (outcome === "not_signed_in") return jsonError(403, "Sign in to delete your account.");
  return Response.json({ deleted: true });
}
