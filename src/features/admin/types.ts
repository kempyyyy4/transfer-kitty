/**
 * What the admin screens receive. Only the admin ever sees these: every admin route
 * checks the admin lock first.
 */
export type {
  AdminQuestionDetail,
  AdminQuestionList,
  OpenReport,
  PackDetail,
  PackKind,
  PackRow,
  PackStatus,
  QuestionSource,
  QuestionStatus,
  UpcomingPuzzle,
} from "@/lib/db";

export type AdminAccessStatus =
  | { status: "admin" | "locked"; accountId: string }
  | { status: "off" | "not_admin"; accountId: string | null };
