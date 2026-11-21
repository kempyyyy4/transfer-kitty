import { RATE_LIMITS } from "@/config/rate-limits";
import { emailCodeSchema, finishSignIn } from "@/features/account/server";
import { SignInError } from "@/lib/auth";
import { clientAddress, jsonError, readJsonBody, tooManyRequests } from "@/lib/http";
import { isWithinRateLimit } from "@/lib/rate-limit";

/**
 * Checks the code from a sign-in email, then carries over a guest's play. Limited by IP and
 * by address, so nobody can guess a code by trying many from different connections.
 */
export async function POST(request: Request) {
  if (!(await isWithinRateLimit(RATE_LIMITS.signInCode, `ip:${clientAddress(request)}`))) {
    return tooManyRequests();
  }

  const body = await readJsonBody(request, emailCodeSchema);
  if ("reply" in body) return jsonError(400, "Enter the code from your email.");

  const email = body.data.email.toLowerCase();
  if (!(await isWithinRateLimit(RATE_LIMITS.signInCode, `email:${email}`))) {
    return tooManyRequests();
  }

  try {
    const result = await finishSignIn({ kind: "email-code", email, token: body.data.code });
    const params = new URLSearchParams({ signin: "ok" });
    if (result.gamesMoved > 0) params.set("moved", String(result.gamesMoved));
    if (result.needsDisplayName) params.set("name", "needed");
    return Response.json({ next: `/account?${params.toString()}` });
  } catch (error) {
    if (error instanceof SignInError) {
      return jsonError(400, "That code is wrong or has expired. Check it or send a new one.");
    }
    throw error;
  }
}
