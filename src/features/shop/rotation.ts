import { SHOP_ROTATION } from "@/config/coins";
import type { PricedItem } from "./catalogue";

/** A stable number from text, so the same day always shuffles the same way. */
function hash(text: string): number {
  let value = 2166136261;
  for (const char of text) {
    value ^= char.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

/**
 * The items on sale on a UK day: a handful of priced items, picked by a shuffle seeded with
 * the date, so everyone sees the same shop and it changes at midnight.
 */
export function itemsForDay(
  items: readonly PricedItem[],
  day: string,
  count: number = SHOP_ROTATION.itemsPerDay,
): PricedItem[] {
  return items
    .filter((item) => item.onSale && item.priceCoins > 0)
    .map((item) => ({ item, order: hash(`${day}:${item.slot}:${item.id}`) }))
    .sort((a, b) => a.order - b.order)
    .slice(0, count)
    .map(({ item }) => item);
}
