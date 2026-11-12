import { LEAGUES } from "@/config/leaderboard";

/** A random invite code. `randomIndex` returns a whole number from 0 up to (not including) n. */
export function makeInviteCode(randomIndex: (n: number) => number): string {
  const alphabet = LEAGUES.inviteCodeAlphabet;
  let code = "";
  for (let i = 0; i < LEAGUES.inviteCodeLength; i++) {
    code += alphabet[randomIndex(alphabet.length)];
  }
  return code;
}

/**
 * Tidies a code a player typed: capitals, no spaces or dashes.
 * Returns null if it cannot be a code.
 */
export function normaliseInviteCode(typed: string): string | null {
  const code = typed.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const valid = new RegExp(`^[${LEAGUES.inviteCodeAlphabet}]{${LEAGUES.inviteCodeLength}}$`);
  return valid.test(code) ? code : null;
}
