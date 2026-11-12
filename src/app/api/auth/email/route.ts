import { RATE_LIMITS } from "@/config/rate-limits";
import { emailSignInSchema, rememberGuestForSignIn } from "@/features/account/server";
import { getVisitor, sendMagicLink, SignInError } from "@/lib/auth";
import { clientAddress, jsonError, readJsonBody, tooManyRequests } from "@/lib/http";
import { isWithinRateLimit } from "@/lib/rate-limit";

/** Emails a sign-in link. A guest's play follows them into the account. */
export async function POST(request: Request) {
  if (!(await isWithinRateLimit(RATE_LIMITS.signIn, `ip:${clientAddress(request)}`))) {
    return tooManyRequests();
  }

  const body = await readJsonBody(request, emailSignInSchema);
  if ("reply" in body) return jsonError(400, "Enter a valid email address.");

  await rememberGuestForSignIn(await getVisitor());
  try {
    await sendMagicLink(body.data.email, new URL("/auth/callback", request.url).toString());
  } catch (error) {
    if (!(error instanceof SignInError)) throw error;
    if (error.status === 429) {
      return jsonError(429, "Too many emails sent. Wait a while and try again.");
    }
    return jsonError(400, "We could not send a sign-in email to that address.");
  }
  return Response.json({ sent: true });
}
