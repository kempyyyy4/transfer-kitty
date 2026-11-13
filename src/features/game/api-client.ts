import type {
  AnswerFeedback,
  PlayerSuggestion,
  PlayState,
  PracticeRound,
  QuestionAnswers,
  StartedGame,
  TodayStatus,
} from "./types";

/** An error the server explained, with a message fit to show the player. */
export class GameApiError extends Error {}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    throw new GameApiError(messageFrom(body) ?? "Something went wrong. Try again.");
  }
  return (await response.json()) as T;
}

function messageFrom(body: unknown): string | null {
  if (typeof body === "object" && body !== null && "error" in body) {
    return typeof body.error === "string" ? body.error : null;
  }
  return null;
}

function post<T>(path: string, body?: object): Promise<T> {
  return call<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export const gameApi = {
  today: () => call<TodayStatus>("/api/game/today"),
  start: () => post<StartedGame>("/api/game/start"),
  practice: (round: PracticeRound) => post<StartedGame>("/api/game/practice", round),
  next: (sessionId: string) => post<PlayState>("/api/game/next", { sessionId }),
  answer: (sessionId: string, position: number, playerId: number | null) =>
    post<AnswerFeedback>("/api/game/answer", { sessionId, position, playerId }),
  answerLists: (sessionId: string) =>
    call<QuestionAnswers[]>(`/api/game/answers?sessionId=${encodeURIComponent(sessionId)}`),
  reportMissing: (sessionId: string, position: number, playerId: number) =>
    post<{ message: string }>("/api/game/report", { sessionId, position, playerId }),
  searchPlayers: (query: string, signal: AbortSignal) =>
    call<PlayerSuggestion[]>(`/api/players/search?q=${encodeURIComponent(query)}`, { signal }),
};
