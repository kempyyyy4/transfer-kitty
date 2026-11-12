import "server-only";
import { RATE_LIMITS } from "@/config/rate-limits";
import { getAdminUserId } from "@/lib/auth";
import { jsonError, tooManyRequests } from "@/lib/http";
import { isWithinRateLimit } from "@/lib/rate-limit";

// Server-only parts of the admin feature, for route handlers.
export * from "./schemas";
export * from "./service";

/**
 * The first step of every admin route. Anyone who is not the unlocked admin gets a plain
 * "not found", so the routes give nothing away.
 */
export async function adminGate(): Promise<{ adminId: string } | { reply: Response }> {
  const adminId = await getAdminUserId();
  if (!adminId) return { reply: jsonError(404, "Not found.") };
  if (!(await isWithinRateLimit(RATE_LIMITS.admin, adminId))) return { reply: tooManyRequests() };
  return { adminId };
}
