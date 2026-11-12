import "server-only";
import { itemKey, type ItemSlot } from "@/features/avatar";
import { getVisitor } from "@/lib/auth";
import {
  buyItem,
  getCoinBalance,
  getOwnedItemKeys,
  getPriceChanges,
  savePriceChange,
} from "@/lib/db";
import { canWear, catalogue, priceCatalogue, type PricedItem } from "./catalogue";
import type { Shop, ShopItem } from "./types";

/** The catalogue at today's prices, including any change made in Admin. */
export async function currentCatalogue(): Promise<PricedItem[]> {
  return priceCatalogue(catalogue(), await getPriceChanges());
}

function find(items: readonly PricedItem[], slot: ItemSlot, itemId: string) {
  return items.find((item) => item.slot === slot && item.id === itemId);
}

/** The shop as the visitor sees it: prices, what they own, and their balance. */
export async function getShop(): Promise<Shop> {
  const visitor = await getVisitor();
  const [items, owned, balance] = await Promise.all([
    currentCatalogue(),
    visitor ? getOwnedItemKeys(visitor.userId) : new Set<string>(),
    visitor ? getCoinBalance(visitor.userId) : 0,
  ]);

  const shown: ShopItem[] = items
    .filter((item) => item.onSale || owned.has(itemKey(item.slot, item.id)))
    .map((item) => ({
      slot: item.slot,
      id: item.id,
      name: item.name,
      priceCoins: item.priceCoins,
      owned: owned.has(itemKey(item.slot, item.id)),
    }));

  return {
    status: !visitor ? "none" : visitor.isGuest ? "guest" : "signed_in",
    balance,
    items: shown,
  };
}

export type BuyResult =
  | { status: "bought"; balance: number }
  | { status: "not_signed_in" | "unknown_item" | "free" | "owned" | "too_poor" };

/** Buys an item for coins at the server's own price. Guests must sign in first. */
export async function buy(slot: ItemSlot, itemId: string): Promise<BuyResult> {
  const visitor = await getVisitor();
  if (!visitor || visitor.isGuest) return { status: "not_signed_in" };

  const item = find(await currentCatalogue(), slot, itemId);
  if (!item || !item.onSale) return { status: "unknown_item" };
  if (item.priceCoins === 0) return { status: "free" };

  const outcome = await buyItem(visitor.userId, slot, itemId, item.priceCoins);
  if (outcome !== "bought") return { status: outcome };
  return { status: "bought", balance: await getCoinBalance(visitor.userId) };
}

/** The keys ("slot:id") of every item this user may wear: free today, or theirs. */
export async function wearableKeys(userId: string): Promise<Set<string>> {
  const [items, owned] = await Promise.all([currentCatalogue(), getOwnedItemKeys(userId)]);
  return new Set(
    items.filter((item) => canWear(item, owned)).map((item) => itemKey(item.slot, item.id)),
  );
}

/** Admin: the full catalogue at today's prices, including items taken off sale. */
export const listPrices = currentCatalogue;

/** Admin: changes one item's price or takes it on or off sale. */
export async function setPrice(
  slot: ItemSlot,
  itemId: string,
  priceCoins: number,
  onSale: boolean,
): Promise<boolean> {
  if (!catalogue().some((item) => item.slot === slot && item.id === itemId)) return false;
  await savePriceChange({ slot, itemId, priceCoins, onSale });
  return true;
}
