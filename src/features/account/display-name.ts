import { ACCOUNT } from "@/config/account";

/** Letters in any alphabet, digits, spaces, and . _ ' - between words. */
const ALLOWED = /^[\p{L}\p{N}][\p{L}\p{N} ._'-]*$/u;

export type DisplayNameCheck = { ok: true; name: string } | { ok: false; reason: string };

/**
 * Tidies a chosen name (outer spaces trimmed, runs of spaces made single) and checks it.
 * Offensive words are not checked yet: that filter comes with the launch extras.
 */
export function checkDisplayName(raw: string): DisplayNameCheck {
  const name = raw.trim().replace(/\s+/g, " ");
  const { displayNameMinLength: min, displayNameMaxLength: max } = ACCOUNT;

  if ([...name].length < min || [...name].length > max) {
    return { ok: false, reason: `Names are ${min} to ${max} characters.` };
  }
  if (!ALLOWED.test(name)) {
    return {
      ok: false,
      reason: "Use letters, numbers and spaces. Start with a letter or number.",
    };
  }
  if (/^(guest|player)\b/i.test(name)) {
    return { ok: false, reason: "That name could be mistaken for a placeholder." };
  }
  return { ok: true, name };
}
