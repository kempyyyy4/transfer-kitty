import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { ACCOUNT } from "@/config/account";
import { completeSignIn, getVisitor, type SignInProof, type Visitor } from "@/lib/auth";
import {
  deleteUser,
  getDisplayName,
  mergeGuestIntoAccount,
  saveDisplayName,
  savePendingMerge,
  takePendingMerge,
} from "@/lib/db";
import { checkDisplayName } from "./display-name";
import type { AccountStatus } from "./types";

/** Holds the random token that links a sign-in back to the guest who started it. */
const MERGE_COOKIE = "tk_pending_merge";

export async function getAccountStatus(): Promise<AccountStatus> {
  const visitor = await getVisitor();
  if (!visitor) return { status: "none" };
  if (visitor.isGuest) return { status: "guest" };

  return {
    status: "signed_in",
    email: visitor.email,
    displayName: await getDisplayName(visitor.userId),
  };
}

/**
 * Call just before sending a guest off to sign in. Remembers who they are, so that once
 * they come back signed in their games and leagues can follow them.
 */
export async function rememberGuestForSignIn(visitor: Visitor | null): Promise<void> {
  if (!visitor?.isGuest) return;

  const token = randomBytes(24).toString("base64url");
  await savePendingMerge(token, visitor.userId);
  (await cookies()).set(MERGE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // Lax still sends the cookie when Google or an emailed link brings the visitor back.
    sameSite: "lax",
    path: "/",
    maxAge: ACCOUNT.signInWindowSeconds,
  });
}

export interface SignInResult {
  /** Games carried over from the guest, or 0 if there was no guest. */
  gamesMoved: number;
  /** Days the guest and the account both played; the account's game was kept. */
  gamesDropped: number;
  needsDisplayName: boolean;
}

/** Finishes a sign-in and carries over the guest's play, if a guest started it. */
export async function finishSignIn(proof: SignInProof): Promise<SignInResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get(MERGE_COOKIE)?.value;
  cookieStore.delete(MERGE_COOKIE);

  const accountId = await completeSignIn(proof);
  const guestId = token ? await takePendingMerge(token, ACCOUNT.signInWindowSeconds) : null;

  let gamesMoved = 0;
  let gamesDropped = 0;
  if (guestId && guestId !== accountId) {
    const merged = await mergeGuestIntoAccount(guestId, accountId);
    if (merged.status === "merged") {
      gamesMoved = merged.gamesMoved;
      gamesDropped = merged.gamesDropped;
      await deleteUser(guestId);
    }
  }

  return {
    gamesMoved,
    gamesDropped,
    needsDisplayName: (await getDisplayName(accountId)) === null,
  };
}

export type NameOutcome =
  | { status: "saved"; name: string }
  | { status: "invalid"; reason: string }
  | { status: "taken" }
  | { status: "not_signed_in" };

/** Sets the signed-in player's display name. Guests cannot have one. */
export async function setDisplayName(rawName: string): Promise<NameOutcome> {
  const visitor = await getVisitor();
  if (!visitor || visitor.isGuest) return { status: "not_signed_in" };

  const checked = checkDisplayName(rawName);
  if (!checked.ok) return { status: "invalid", reason: checked.reason };

  const saved = await saveDisplayName(visitor.userId, checked.name);
  return saved === "taken" ? { status: "taken" } : { status: "saved", name: checked.name };
}
