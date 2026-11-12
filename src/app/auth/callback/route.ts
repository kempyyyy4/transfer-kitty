import { NextResponse } from "next/server";
import { callbackQuerySchema, finishSignIn, type CallbackQuery } from "@/features/account/server";
import { SignInError, type SignInProof } from "@/lib/auth";

/**
 * Where Google and emailed sign-in links bring the visitor back. Finishes signing in,
 * carries over a guest's play, and moves on to the account page. Always redirects to a
 * fixed page on this site, never to an address taken from the link.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = callbackQuerySchema.safeParse({
    code: url.searchParams.get("code"),
    token_hash: url.searchParams.get("token_hash"),
    type: url.searchParams.get("type"),
  });
  const proof = query.success ? toProof(query.data) : null;
  if (!proof) return redirectTo(url, "/account?signin=failed");

  try {
    const result = await finishSignIn(proof);
    const params = new URLSearchParams({ signin: "ok" });
    if (result.gamesMoved > 0) params.set("moved", String(result.gamesMoved));
    if (result.needsDisplayName) params.set("name", "needed");
    return redirectTo(url, `/account?${params.toString()}`);
  } catch (error) {
    // An expired or already-used link, or one opened in a different browser.
    if (error instanceof SignInError) return redirectTo(url, "/account?signin=failed");
    throw error;
  }
}

function toProof(query: CallbackQuery): SignInProof | null {
  if (query.code) return { kind: "code", code: query.code };
  if (query.token_hash && query.type) {
    return { kind: "token", tokenHash: query.token_hash, type: query.type };
  }
  return null;
}

function redirectTo(from: URL, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, from.origin), 303);
}
