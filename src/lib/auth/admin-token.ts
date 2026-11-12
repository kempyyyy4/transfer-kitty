import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * The admin cookie proves the password was typed recently, by the admin account.
 * It is signed with the password itself, so changing the password locks every
 * existing admin session out.
 */
function signature(userId: string, expiresAt: number, password: string): string {
  return createHmac("sha256", password).update(`admin:${userId}:${expiresAt}`).digest("base64url");
}

function sameText(a: string, b: string): boolean {
  // Hashing first gives equal lengths, which timingSafeEqual needs.
  const digest = (text: string) => createHash("sha256").update(text).digest();
  return timingSafeEqual(digest(a), digest(b));
}

export function makeAdminToken(userId: string, password: string, expiresAt: number): string {
  return `${expiresAt}.${signature(userId, expiresAt, password)}`;
}

export function isValidAdminToken(
  token: string,
  userId: string,
  password: string,
  now: number,
): boolean {
  const [expiresText, signed, extra] = token.split(".");
  if (!expiresText || !signed || extra !== undefined || !/^\d+$/.test(expiresText)) return false;

  const expiresAt = Number(expiresText);
  if (expiresAt <= now) return false;
  return sameText(signed, signature(userId, expiresAt, password));
}

export function passwordMatches(typed: string, password: string): boolean {
  return sameText(typed, password);
}
