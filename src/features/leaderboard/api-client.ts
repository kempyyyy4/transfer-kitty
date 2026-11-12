import type { Board, League, Period } from "./types";

/** An error the server explained, with a message fit to show the player. */
export class LeaderboardApiError extends Error {}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
        ? body.error
        : "Something went wrong. Try again.";
    throw new LeaderboardApiError(message);
  }
  return (await response.json()) as T;
}

function post<T>(path: string, body: object): Promise<T> {
  return call<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export const leaderboardApi = {
  board: (period: Period, leagueId: string | null) => {
    const league = leagueId ? `&league=${encodeURIComponent(leagueId)}` : "";
    return call<Board>(`/api/leaderboard?period=${period}${league}`);
  },
  myLeagues: () => call<League[]>("/api/leagues"),
  createLeague: (name: string) => post<League>("/api/leagues", { name }),
  joinLeague: (code: string) => post<{ leagueId: string }>("/api/leagues/join", { code }),
  leaveLeague: (leagueId: string) => post<{ left: true }>("/api/leagues/leave", { leagueId }),
};
