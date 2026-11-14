import { englishDataset, englishRecommendedTransformers, RegExpMatcher } from "obscenity";
import { ACCOUNT, RESERVED_NAME_PARTS } from "@/config/account";

/** Letters in any alphabet, digits, spaces, and . _ ' - between words. */
const ALLOWED = /^[\p{L}\p{N}][\p{L}\p{N} ._'-]*$/u;

/**
 * Offensive words, from the open-source obscenity library (MIT). It also catches
 * look-alike spellings such as numbers for letters and repeated letters.
 */
const offensive = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

/** "Transfer_Kitty 1" becomes "transferkitty1", so reserved names cannot hide in spacing. */
const squashed = (name: string) => name.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

export type DisplayNameCheck = { ok: true; name: string } | { ok: false; reason: string };

/**
 * Tidies a chosen name (outer spaces trimmed, runs of spaces made single) and checks it.
 * Offensive names and names that could pass for the game's staff are refused.
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
  if (offensive.hasMatch(name) || offensive.hasMatch(squashed(name))) {
    return { ok: false, reason: "Please choose a different name." };
  }
  if (RESERVED_NAME_PARTS.some((part) => squashed(name).includes(part))) {
    return { ok: false, reason: "That name could be mistaken for the game's own." };
  }
  return { ok: true, name };
}
