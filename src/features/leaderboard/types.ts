/** What the leaderboard API sends to the browser. Other players are never identified by ID. */

export type Period = "today" | "week" | "all";

export interface BoardEntry {
  rank: number;
  name: string;
  total: number;
  days: number;
  isYou: boolean;
}

export interface Board {
  period: Period;
  leagueId: string | null;
  players: number;
  entries: BoardEntry[];
  /** Your own place, shown even when you are outside the rows on the board. */
  you: { rank: number; total: number; days: number } | null;
}

export interface League {
  id: string;
  name: string;
  inviteCode: string;
  members: number;
}
