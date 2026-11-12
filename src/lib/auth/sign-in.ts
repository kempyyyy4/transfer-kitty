import "server-only";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSessionClient } from "./session";

/**
 * Emails a one-time sign-in link. A new address gets a new account.
 * The link comes back to `callbackUrl` in this same browser, which holds the matching code
 * verifier cookie, so the link must be opened on the same device.
 */
export async function sendMagicLink(email: string, callbackUrl: string): Promise<void> {
  const client = await createSessionClient();
  const { error } = await client.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: callbackUrl, shouldCreateUser: true },
  });
  if (error) throw new SignInError(error.message, error.status ?? 500);
}

/** The Google sign-in page to send the visitor to. It returns to `callbackUrl`. */
export async function googleSignInUrl(callbackUrl: string): Promise<string> {
  const client = await createSessionClient();
  const { data, error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl, skipBrowserRedirect: true },
  });
  if (error || !data.url) throw new SignInError(error?.message ?? "No sign-in page", 500);
  return data.url;
}

export type SignInProof =
  { kind: "code"; code: string } | { kind: "token"; tokenHash: string; type: EmailOtpType };

/**
 * Finishes signing in from what the callback URL carried: a code (Google, or an emailed
 * link opened in the same browser) or a token hash (an emailed link). Starts the new
 * session in the visitor's cookies and returns the signed-in user's ID.
 */
export async function completeSignIn(proof: SignInProof): Promise<string> {
  const client = await createSessionClient();
  const { data, error } =
    proof.kind === "code"
      ? await client.auth.exchangeCodeForSession(proof.code)
      : await client.auth.verifyOtp({ token_hash: proof.tokenHash, type: proof.type });

  const userId = data.user?.id;
  if (error || !userId) throw new SignInError(error?.message ?? "No user", 400);
  return userId;
}

export async function signOut(): Promise<void> {
  const client = await createSessionClient();
  await client.auth.signOut();
}

/** A sign-in problem with the status Supabase gave it, so callers can tell the visitor. */
export class SignInError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
