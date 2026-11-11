import type { Warehouse } from "../data/warehouse";

export type TagType =
  "league" | "decade" | "competition" | "tournament" | "nationality" | "club" | "featured_player";

export interface QuestionTag {
  type: TagType;
  value: string;
}

export interface DraftAnswer {
  /** Transfermarkt player ID. */
  playerId: number;
  /** From 0 to 1: how much the player featured in what the question asks about. Feeds the tier. */
  involvement: number;
}

/** A question as a template produces it, before filtering and tiering. */
export interface DraftQuestion {
  /** Stable across runs, so re-generating updates the question instead of duplicating it. */
  dedupeKey: string;
  templateKey: string;
  prompt: string;
  params: Record<string, string | number>;
  tags: QuestionTag[];
  answers: DraftAnswer[];
}

export interface FinishedAnswer {
  playerId: number;
  popularity: number;
  tier: number;
}

/** A question that passed the filters, with every answer ranked and tiered. */
export interface FinishedQuestion extends Omit<DraftQuestion, "answers"> {
  /** Most popular answer first. */
  answers: FinishedAnswer[];
}

export interface Template {
  key: string;
  generate(warehouse: Warehouse): DraftQuestion[];
}

/**
 * What every template query returns per row: who the answer is, and a count (appearances,
 * goals, minutes...) showing how much they featured.
 */
export interface AnswerRow {
  player_id: number;
  context: number;
}
