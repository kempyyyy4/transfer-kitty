import type { ItemSlot } from "@/features/avatar";
import type { Shop } from "./types";

/** An error the server explained, with a message fit to show the player. */
export class ShopApiError extends Error {}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
        ? body.error
        : "Something went wrong. Try again.";
    throw new ShopApiError(message);
  }
  return (await response.json()) as T;
}

export const shopApi = {
  shop: () => call<Shop>("/api/shop"),
  buy: (slot: ItemSlot, itemId: string) =>
    call<{ balance: number }>("/api/shop/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slot, itemId }),
    }),
};
