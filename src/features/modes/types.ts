/** What the Archive and Packs screens receive. */
export interface ArchiveDay {
  date: string;
  number: number;
  played: boolean;
}

export interface PackSummary {
  id: string;
  name: string;
  description: string;
  kind: "era" | "world_cup" | "player" | "other";
  questionCount: number;
}
