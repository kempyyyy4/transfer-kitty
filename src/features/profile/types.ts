import type { AvatarChoice } from "@/features/avatar";
import type { PlayerStats } from "./stats";

export interface HistoryDay {
  date: string;
  totalFee: number;
  puzzleNumber: number;
}

/** What the profile API sends to the browser. Only the visitor's own data. */
export interface Profile {
  status: "none" | "guest" | "signed_in";
  displayName: string | null;
  avatar: AvatarChoice;
  stats: PlayerStats;
  history: HistoryDay[];
  /** Today's UK day, so the calendar lines up with the server. */
  today: string;
}
