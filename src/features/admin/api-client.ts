import type {
  AdminAccessStatus,
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
} from "./types";

import type { ItemSlot } from "@/features/avatar";

export interface AdminShopItem {
  slot: ItemSlot;
  id: string;
  name: string;
  configPrice: number;
  priceCoins: number;
  onSale: boolean;
}

/** An error the server explained, with a message fit to show. */
export class AdminApiError extends Error {}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
        ? body.error
        : "Something went wrong. Try again.";
    throw new AdminApiError(message);
  }
  return (await response.json()) as T;
}

function send<T>(method: "POST" | "PATCH" | "DELETE", path: string, body: object = {}) {
  return call<T>(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export interface QuestionFilter {
  q: string;
  status: QuestionStatus | "";
  source: QuestionSource | "";
  page: number;
}

function filterQuery(filter: QuestionFilter): string {
  const params = new URLSearchParams({ page: String(filter.page) });
  if (filter.q.trim()) params.set("q", filter.q.trim());
  if (filter.status) params.set("status", filter.status);
  if (filter.source) params.set("source", filter.source);
  return params.toString();
}

const question = (id: string) => `/api/admin/questions/${encodeURIComponent(id)}`;
const pack = (id: string) => `/api/admin/packs/${encodeURIComponent(id)}`;

export const adminApi = {
  access: () => call<AdminAccessStatus>("/api/admin/access"),
  unlock: (password: string) => send<{ unlocked: true }>("POST", "/api/admin/unlock", { password }),
  lock: () => send<{ locked: true }>("POST", "/api/admin/lock"),

  questions: (filter: QuestionFilter) =>
    call<AdminQuestionList>(`/api/admin/questions?${filterQuery(filter)}`),
  question: (id: string) => call<AdminQuestionDetail>(question(id)),
  createQuestion: (prompt: string, status: "draft" | "active", playerIds: number[]) =>
    send<{ id: string }>("POST", "/api/admin/questions", { prompt, status, playerIds }),
  setStatus: (id: string, status: QuestionStatus) =>
    send<{ saved: true }>("PATCH", question(id), { status }),
  setTier: (id: string, entityId: number, tier: number | null) =>
    send<{ saved: true }>("POST", `${question(id)}/tier`, { entityId, tier }),
  addAnswer: (id: string, playerId: number, tier: number) =>
    send<{ added: true }>("POST", `${question(id)}/answers`, { playerId, tier }),
  removeAnswer: (id: string, entityId: number) =>
    send<{ removed: true }>("DELETE", `${question(id)}/answers`, { entityId }),

  reports: () => call<OpenReport[]>("/api/admin/reports"),
  dismissReport: (questionId: string, playerId: number) =>
    send<{ dismissed: number }>("DELETE", "/api/admin/reports", { questionId, playerId }),

  schedule: () => call<UpcomingPuzzle[]>("/api/admin/schedule"),

  packs: () => call<PackRow[]>("/api/admin/packs"),
  pack: (id: string) => call<PackDetail>(pack(id)),
  createPack: (fields: { slug: string; name: string; description: string; kind: PackKind }) =>
    send<{ id: string }>("POST", "/api/admin/packs", fields),
  changePack: (
    id: string,
    change: { name?: string; description?: string; kind?: PackKind; status?: PackStatus },
  ) => send<{ saved: true }>("PATCH", pack(id), change),
  addToPack: (packId: string, questionId: string) =>
    send<{ added: true }>("POST", `${pack(packId)}/questions`, { questionId }),
  removeFromPack: (packId: string, questionId: string) =>
    send<{ removed: true }>("DELETE", `${pack(packId)}/questions`, { questionId }),

  shopPrices: () => call<AdminShopItem[]>("/api/admin/shop"),
  setShopPrice: (slot: ItemSlot, itemId: string, priceCoins: number, onSale: boolean) =>
    send<{ saved: true }>("POST", "/api/admin/shop", { slot, itemId, priceCoins, onSale }),

  searchPlayers: (query: string, signal: AbortSignal) =>
    call<{ id: number; name: string; birthYear: number | null; country: string | null }[]>(
      `/api/players/search?q=${encodeURIComponent(query)}`,
      { signal },
    ),
};
