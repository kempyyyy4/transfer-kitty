import { TIERS } from "@/config/tiers";
import type { FinishedQuestion } from "./types";

export interface TemplateOutcome {
  templateKey: string;
  kept: FinishedQuestion[];
  tooFew: number;
  tooMany: number;
}

const TOP_TIER = TIERS.at(-1);

/** A plain-text summary of a generator run, for checking the questions by eye. */
export function buildReport(
  outcomes: readonly TemplateOutcome[],
  playerNames: ReadonlyMap<number, string>,
): string {
  const total = outcomes.reduce((sum, outcome) => sum + outcome.kept.length, 0);
  const lines = [`QUESTION REPORT: ${total} questions kept`, ""];

  lines.push("template | kept | dropped: too few | dropped: too many | answers min/median/max");
  for (const outcome of outcomes) {
    lines.push(
      [
        outcome.templateKey,
        outcome.kept.length,
        outcome.tooFew,
        outcome.tooMany,
        answerSpread(outcome.kept),
      ].join(" | "),
    );
  }

  for (const outcome of outcomes) {
    const sample = pickSample(outcome.kept);
    if (!sample) continue;
    lines.push(
      "",
      `--- ${outcome.templateKey} sample ---`,
      ...describeQuestion(sample, playerNames),
    );
  }
  return lines.join("\n");
}

function answerSpread(questions: readonly FinishedQuestion[]): string {
  if (questions.length === 0) return "-";
  const counts = questions.map((question) => question.answers.length).sort((a, b) => a - b);
  return `${counts[0]}/${counts[Math.floor(counts.length / 2)]}/${counts.at(-1)}`;
}

/** The middle question by key: stable between runs, and not cherry-picked. */
function pickSample(questions: readonly FinishedQuestion[]): FinishedQuestion | undefined {
  const sorted = [...questions].sort((a, b) => a.dedupeKey.localeCompare(b.dedupeKey));
  return sorted[Math.floor(sorted.length / 2)];
}

function describeQuestion(
  question: FinishedQuestion,
  playerNames: ReadonlyMap<number, string>,
): string[] {
  const name = (playerId: number) => playerNames.get(playerId) ?? `player ${playerId}`;
  const mostPopular = question.answers.slice(0, 5).map((answer) => name(answer.playerId));
  const rarest = question.answers
    .filter((answer) => answer.tier === TOP_TIER?.level)
    .map((answer) => name(answer.playerId));

  return [
    question.prompt,
    `  ${question.answers.length} answers`,
    `  most popular: ${mostPopular.join(", ")}`,
    `  ${TOP_TIER?.name ?? "top tier"}: ${rarest.join(", ")}`,
  ];
}
