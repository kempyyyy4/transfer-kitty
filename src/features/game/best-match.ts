import { toSearchName } from "@/lib/search-name";

interface Named {
  name: string;
}

/**
 * A player whose name clearly fits what was typed: an exact name first, then a name
 * containing every typed word. Null if none fits.
 */
export function confidentMatch<T extends Named>(
  typed: string,
  suggestions: readonly T[],
): T | null {
  const query = toSearchName(typed);
  if (query === "") return null;

  const exact = suggestions.find((player) => toSearchName(player.name) === query);
  if (exact) return exact;

  const words = query.split(" ");
  const allWords = suggestions.find((player) => {
    const name = toSearchName(player.name);
    return words.every((word) => name.includes(word));
  });
  return allWords ?? null;
}

/**
 * The player a typed name most likely means, from search suggestions in best-known-first
 * order. Used when time runs out before the player picked from the list.
 * A clear fit wins; otherwise the best-known suggestion.
 */
export function bestMatch<T extends Named>(typed: string, suggestions: readonly T[]): T | null {
  if (toSearchName(typed) === "") return null;
  return confidentMatch(typed, suggestions) ?? suggestions[0] ?? null;
}
