import { FEATURED_CUPS, FEATURED_LEAGUES, type Competition } from "@/config/competitions";
import type { AnswerRow, DraftQuestion } from "./types";

type QuestionHeader = Omit<DraftQuestion, "answers">;

/**
 * Turns query rows into questions. Rows that describe the same question (same dedupe key)
 * become its answers. `fullInvolvementAt` is the row's `context` count at which a player
 * counts as fully involved; see FULL_INVOLVEMENT in src/config/fame.ts.
 */
export function groupIntoQuestions<R extends AnswerRow>(
  rows: readonly R[],
  fullInvolvementAt: number,
  describe: (row: R) => QuestionHeader,
): DraftQuestion[] {
  const questions = new Map<string, DraftQuestion>();

  for (const row of rows) {
    const header = describe(row);
    let question = questions.get(header.dedupeKey);
    if (!question) {
      question = { ...header, answers: [] };
      questions.set(header.dedupeKey, question);
    }
    question.answers.push({
      playerId: row.player_id,
      involvement: Math.min(1, row.context / fullInvolvementAt),
    });
  }
  return [...questions.values()];
}

export function sqlList(values: readonly string[]): string {
  return values.map((value) => `'${value.replaceAll("'", "''")}'`).join(", ");
}

export const LEAGUE_IDS = sqlList(FEATURED_LEAGUES.map((league) => league.id));
export const CUP_IDS = sqlList(FEATURED_CUPS.map((cup) => cup.id));

const COMPETITIONS_BY_ID = new Map<string, Competition>(
  [...FEATURED_LEAGUES, ...FEATURED_CUPS].map((competition) => [competition.id, competition]),
);
const LEAGUE_ID_SET = new Set(FEATURED_LEAGUES.map((league) => league.id));

export function competition(id: string): Competition {
  const found = COMPETITIONS_BY_ID.get(id);
  if (!found) throw new Error(`Competition ${id} is not in src/config/competitions.ts`);
  return found;
}

/** Leagues are tagged "league" and cups "competition", matching how packs filter. */
export function competitionTag(id: string): { type: "league" | "competition"; value: string } {
  return { type: LEAGUE_ID_SET.has(id) ? "league" : "competition", value: competition(id).slug };
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** The dataset writes some countries surname-first, such as "Korea, South". */
export function countryName(datasetName: string): string {
  const [main, qualifier] = datasetName.split(", ");
  return qualifier ? `${qualifier} ${main}` : datasetName;
}

export function decadeTags(
  firstYear: number,
  lastYear: number,
): { type: "decade"; value: string }[] {
  const decades = new Set<string>();
  for (let year = firstYear; year <= lastYear; year++) {
    decades.add(`${Math.floor(year / 10) * 10}s`);
  }
  return [...decades].map((value) => ({ type: "decade", value }));
}
