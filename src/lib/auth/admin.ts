import "server-only";
import { cookies } from "next/headers";
import { ADMIN } from "@/config/admin";
import { getServerEnv } from "@/lib/env";
import { isValidAdminToken, makeAdminToken, passwordMatches } from "./admin-token";
import { getVisitor } from "./session";

const ADMIN_COOKIE = "tk_admin";

/**
 * Where the visitor stands with the admin area. Getting in needs both: signed in as
 * ADMIN_USER_ID, and the ADMIN_PASSWORD typed within the last few hours.
 * `accountId` is the visitor's own ID when signed in, so the admin can find theirs.
 */
export type AdminAccess =
  | { status: "admin"; accountId: string }
  | { status: "locked"; accountId: string }
  | { status: "off" | "not_admin"; accountId: string | null };

interface AdminSettings {
  userId: string;
  password: string;
}

function adminSettings(): AdminSettings | null {
  const env = getServerEnv();
  if (!env.ADMIN_USER_ID || !env.ADMIN_PASSWORD) return null;
  return { userId: env.ADMIN_USER_ID, password: env.ADMIN_PASSWORD };
}

export async function getAdminAccess(): Promise<AdminAccess> {
  const visitor = await getVisitor();
  const accountId = visitor && !visitor.isGuest ? visitor.userId : null;
  const settings = adminSettings();
  if (!settings) return { status: "off", accountId };
  if (accountId !== settings.userId) return { status: "not_admin", accountId };

  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const unlocked =
    token !== undefined && isValidAdminToken(token, accountId, settings.password, Date.now());
  return { status: unlocked ? "admin" : "locked", accountId };
}

/** The admin's user ID if this request may use the admin area, otherwise null. */
export async function getAdminUserId(): Promise<string | null> {
  const access = await getAdminAccess();
  return access.status === "admin" ? access.accountId : null;
}

export type UnlockOutcome = "unlocked" | "wrong_password" | "not_admin";

/** Checks the typed password and, if right, remembers it in an httpOnly cookie. */
export async function unlockAdmin(typedPassword: string): Promise<UnlockOutcome> {
  const access = await getAdminAccess();
  const settings = adminSettings();
  if (!settings || (access.status !== "admin" && access.status !== "locked")) return "not_admin";
  if (!passwordMatches(typedPassword, settings.password)) return "wrong_password";

  const expiresAt = Date.now() + ADMIN.sessionSeconds * 1000;
  (await cookies()).set(
    ADMIN_COOKIE,
    makeAdminToken(access.accountId, settings.password, expiresAt),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: ADMIN.sessionSeconds,
    },
  );
  return "unlocked";
}

export async function lockAdmin(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
}
