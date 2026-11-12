export interface DailyCandidate {
  id: string;
  templateKey: string;
  /** The clubs the question is about, so one day does not ask about the same club twice. */
  clubIds: readonly number[];
}

interface Limits {
  count: number;
  maxPerTemplate: number;
}

/**
 * Chooses a day's questions from candidates, taken in the order given.
 * It aims for variety: no club twice, and not too many from one template. If the
 * candidates cannot give a full day that way, the club rule is dropped first, then the
 * template rule. Returns null if there are not enough candidates at all.
 */
export function pickDailyQuestions(
  candidates: readonly DailyCandidate[],
  limits: Limits,
): DailyCandidate[] | null {
  const attempts = [
    { avoidRepeatedClubs: true, maxPerTemplate: limits.maxPerTemplate },
    { avoidRepeatedClubs: false, maxPerTemplate: limits.maxPerTemplate },
    { avoidRepeatedClubs: false, maxPerTemplate: limits.count },
  ];

  for (const rules of attempts) {
    const picked = pickWithRules(candidates, limits.count, rules);
    if (picked.length === limits.count) return picked;
  }
  return null;
}

function pickWithRules(
  candidates: readonly DailyCandidate[],
  count: number,
  rules: { avoidRepeatedClubs: boolean; maxPerTemplate: number },
): DailyCandidate[] {
  const picked: DailyCandidate[] = [];
  const pickedIds = new Set<string>();
  const usedClubs = new Set<number>();
  const perTemplate = new Map<string, number>();

  for (const candidate of candidates) {
    if (picked.length === count) break;
    if (pickedIds.has(candidate.id)) continue;

    const fromTemplate = perTemplate.get(candidate.templateKey) ?? 0;
    if (fromTemplate >= rules.maxPerTemplate) continue;
    if (rules.avoidRepeatedClubs && candidate.clubIds.some((club) => usedClubs.has(club))) {
      continue;
    }

    picked.push(candidate);
    pickedIds.add(candidate.id);
    perTemplate.set(candidate.templateKey, fromTemplate + 1);
    for (const club of candidate.clubIds) usedClubs.add(club);
  }
  return picked;
}
