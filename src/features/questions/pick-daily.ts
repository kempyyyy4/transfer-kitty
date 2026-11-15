export interface DailyCandidate {
  id: string;
  templateKey: string;
  /** The clubs the question is about, so one day does not ask about the same club twice. */
  clubIds: readonly number[];
}

interface Limits {
  count: number;
  maxPerTemplate: number;
  /** The family each template belongs to, if any. */
  families?: Readonly<Record<string, string>>;
  /** At most this many from one family. */
  familyLimits?: Readonly<Record<string, number>>;
}

interface Rules {
  avoidRepeatedClubs: boolean;
  maxPerTemplate: number;
  limitFamilies: boolean;
}

/**
 * Chooses a day's questions from candidates, taken in the order given.
 * It aims for variety: no club twice, at most `maxPerTemplate` from one template, and at
 * most a family's limit from templates that read alike. If the candidates cannot give a
 * full day that way, the club rule is dropped first, then the family rule, then the
 * template rule. Returns null if there are not enough candidates at all.
 */
export function pickDailyQuestions(
  candidates: readonly DailyCandidate[],
  limits: Limits,
): DailyCandidate[] | null {
  const attempts: Rules[] = [
    { avoidRepeatedClubs: true, maxPerTemplate: limits.maxPerTemplate, limitFamilies: true },
    { avoidRepeatedClubs: false, maxPerTemplate: limits.maxPerTemplate, limitFamilies: true },
    { avoidRepeatedClubs: false, maxPerTemplate: limits.maxPerTemplate, limitFamilies: false },
    { avoidRepeatedClubs: false, maxPerTemplate: limits.count, limitFamilies: false },
  ];

  for (const rules of attempts) {
    const picked = pickWithRules(candidates, limits, rules);
    if (picked.length === limits.count) return picked;
  }
  return null;
}

function pickWithRules(
  candidates: readonly DailyCandidate[],
  limits: Limits,
  rules: Rules,
): DailyCandidate[] {
  const count = limits.count;
  const perFamily = new Map<string, number>();
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
    const family = limits.families?.[candidate.templateKey];
    const familyLimit = family ? limits.familyLimits?.[family] : undefined;
    const fromFamily = family ? (perFamily.get(family) ?? 0) : 0;
    if (rules.limitFamilies && familyLimit !== undefined && fromFamily >= familyLimit) continue;

    picked.push(candidate);
    pickedIds.add(candidate.id);
    perTemplate.set(candidate.templateKey, fromTemplate + 1);
    if (family) perFamily.set(family, fromFamily + 1);
    for (const club of candidate.clubIds) usedClubs.add(club);
  }
  return picked;
}
