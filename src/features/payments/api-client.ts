import type { Access, PurchaseStatus } from "./types";

/** An error the server explained, with a message fit to show the player. */
export class PaymentsApiError extends Error {}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
        ? body.error
        : "Something went wrong. Try again.";
    throw new PaymentsApiError(message);
  }
  return (await response.json()) as T;
}

export const paymentsApi = {
  access: () => call<Access>("/api/access"),
  checkout: (product: string) =>
    call<{ url: string }>("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product }),
    }),
  purchase: (id: string) =>
    call<{ status: PurchaseStatus }>(`/api/purchases/${encodeURIComponent(id)}`),
};
