import { NextResponse } from "next/server";
import { RATE_LIMITS } from "@/config/rate-limits";
import { rememberGuestForSignIn } from "@/features/account/server";
import { getVisitor, googleSignInUrl } from "@/lib/auth";
import { clientAddress, tooManyRequests } from "@/lib/http";
import { isWithinRateLimit } from "@/lib/rate-limit";

/** Sends the visitor to Google to sign in. A guest's play follows them into the account. */
export async function GET(request: Request) {
  if (!(await isWithinRateLimit(RATE_LIMITS.signIn, `ip:${clientAddress(request)}`))) {
    return tooManyRequests();
  }

  await rememberGuestForSignIn(await getVisitor());
  const googleUrl = await googleSignInUrl(new URL("/auth/callback", request.url).toString());
  // NextResponse, not Response.redirect, so the cookies set above travel with it.
  return NextResponse.redirect(googleUrl, 303);
}
