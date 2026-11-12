/** Letters that Unicode does not split into a base letter plus an accent. */
const SPECIAL_LETTERS: Record<string, string> = {
  ø: "o",
  ł: "l",
  đ: "d",
  ð: "d",
  ı: "i",
  ß: "ss",
  æ: "ae",
  œ: "oe",
  þ: "th",
};

/**
 * The form of a name that search compares: lower case, accents removed, punctuation
 * turned into spaces. Stored names and typed queries must both go through this, so
 * "Müller", "muller" and "MULLER" all match.
 */
export function toSearchName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[øłđðıßæœþ]/g, (letter) => SPECIAL_LETTERS[letter] ?? letter)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
