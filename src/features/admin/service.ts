import "server-only";
import { ADMIN } from "@/config/admin";
import {
  addPackQuestion,
  deleteAnswer,
  dismissReports,
  getOpenReports,
  getPlayerFame,
  getQuestionForAdmin,
  getUpcomingPuzzles,
  insertAnswer,
  insertManualQuestion,
  insertPack,
  listQuestionsForAdmin,
  readPack,
  readPacks,
  removePackQuestion,
  saveAnswerReport,
  saveQuestionStatus,
  saveTierOverride,
  updatePack,
  type PackFields,
  type PackStatus,
  type QuestionSource,
  type QuestionStatus,
} from "@/lib/db";
import { ukDayOf } from "@/lib/time/uk-day";
import { buildManualQuestion, type ManualQuestionDraft } from "./manual-question";

const today = () => ukDayOf(new Date());

export function listQuestions(filter: {
  q?: string;
  status?: QuestionStatus;
  source?: QuestionSource;
  page: number;
}) {
  return listQuestionsForAdmin({
    search: filter.q || null,
    status: filter.status ?? null,
    source: filter.source ?? null,
    limit: ADMIN.questionsPerPage,
    offset: (filter.page - 1) * ADMIN.questionsPerPage,
  });
}

export const getQuestion = (questionId: string) => getQuestionForAdmin(questionId, today());

export const setQuestionStatus = saveQuestionStatus;

export const setTierOverride = (questionId: string, entityId: number, tier: number | null) =>
  saveTierOverride(questionId, entityId, tier, today());

export const addAnswer = (questionId: string, playerId: number, tier: number) =>
  insertAnswer(questionId, playerId, tier, today());

export const removeAnswer = (questionId: string, entityId: number) =>
  deleteAnswer(questionId, entityId, today());

export type CreateQuestionOutcome =
  | { status: "created"; id: string }
  | { status: "repeated_player" | "unknown_player" | "too_few" | "too_many" };

export async function createQuestion(draft: ManualQuestionDraft): Promise<CreateQuestionOutcome> {
  const built = buildManualQuestion(draft, await getPlayerFame(draft.playerIds));
  if (built.status !== "ok") return built;
  return { status: "created", id: await insertManualQuestion(built.question) };
}

export const listReports = () => getOpenReports(ADMIN.reportsShown);
export const dismissReport = dismissReports;

/** A player's report of a missing answer. Only possible once their round is finished. */
export const reportMissingAnswer = saveAnswerReport;

export const getSchedule = () => getUpcomingPuzzles(today(), ADMIN.upcomingPuzzleDays);

export const listPacks = () => readPacks(ADMIN.packsShown);
export const getPack = readPack;
export const createPack = (fields: PackFields) => insertPack(fields);
export const changePack = (
  packId: string,
  change: Partial<Omit<PackFields, "slug">> & { status?: PackStatus },
) => updatePack(packId, change);
export const addQuestionToPack = addPackQuestion;
export const removeQuestionFromPack = removePackQuestion;
