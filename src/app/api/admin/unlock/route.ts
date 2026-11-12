import { RATE_LIMITS } from "@/config/rate-limits";
import { unlockSchema } from "@/features/admin/server";
import { unlockAdmin } from "@/lib/auth";
import { clientAddress, jsonError, readJsonBody, tooManyRequests } from "@/lib/http";
import { isWithinRateLimit } from "@/lib/rate-limit";

/** Checks the admin password. Counted per IP address, so guessing is slow. */
export async function POST(request: Request) {
  if (!(await isWithinRateLimit(RATE_LIMITS.adminUnlock, clientAddress(request)))) {
    return tooManyRequests();
  }

  const body = await readJsonBody(request, unlockSchema);
  if ("reply" in body) return body.reply;

  const outcome = await unlockAdmin(body.data.password);
  if (outcome === "unlocked") return Response.json({ unlocked: true });
  if (outcome === "wrong_password") return jsonError(403, "That password is not right.");
  return jsonError(404, "Not found.");
}
