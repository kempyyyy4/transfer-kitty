import { ACCESSORIES, BOOTS, BREEDS, EYES, FURS } from "@/config/avatar-items";
import { MONEY_EQUIVALENT_PACK } from "@/config/coins";
import { KITS } from "@/config/kits";
import { itemKey, type ItemSlot } from "@/features/avatar";

export const SLOT_LABELS: Record<ItemSlot, string> = {
  kit: "Kits",
  fur: "Fur",
  breed: "Breeds",
  eyes: "Eyes",
  boots: "Boots",
  accessory: "Accessories",
};

/** The order the shop shows its sections in. */
export const SHOP_SLOTS: readonly ItemSlot[] = [
  "kit",
  "fur",
  "breed",
  "eyes",
  "boots",
  "accessory",
];

export interface CatalogueItem {
  slot: ItemSlot;
  id: string;
  name: string;
  /** The price in src/config, before any change made in Admin. */
  configPrice: number;
}

/** Every avatar item and kit, in shop order. */
export function catalogue(): CatalogueItem[] {
  const from = (slot: ItemSlot, list: readonly { id: string; priceCoins: number }[]) =>
    list.map((item) => ({
      slot,
      id: item.id,
      name: "label" in item && typeof item.label === "string" ? item.label : nameOf(item),
      configPrice: item.priceCoins,
    }));
  const lists: Record<ItemSlot, readonly { id: string; priceCoins: number }[]> = {
    kit: KITS,
    fur: FURS,
    breed: BREEDS,
    eyes: EYES,
    boots: BOOTS,
    accessory: ACCESSORIES,
  };
  return SHOP_SLOTS.flatMap((slot) => from(slot, lists[slot]));
}

function nameOf(item: { id: string }): string {
  return "name" in item && typeof item.name === "string" ? item.name : item.id;
}

export interface PriceChange {
  slot: ItemSlot;
  itemId: string;
  priceCoins: number;
  onSale: boolean;
}

export interface PricedItem extends CatalogueItem {
  priceCoins: number;
  /** False when Admin has taken it off sale. Players who own it can still wear it. */
  onSale: boolean;
}

/** Applies the admin's price changes to the catalogue. */
export function priceCatalogue(
  items: readonly CatalogueItem[],
  changes: readonly PriceChange[],
): PricedItem[] {
  const byKey = new Map(changes.map((change) => [itemKey(change.slot, change.itemId), change]));
  return items.map((item) => {
    const change = byKey.get(itemKey(item.slot, item.id));
    return {
      ...item,
      priceCoins: change?.priceCoins ?? item.configPrice,
      onSale: change?.onSale ?? true,
    };
  });
}

/** Whether a player may wear an item: free at today's price, or theirs. */
export function canWear(item: PricedItem | undefined, owned: ReadonlySet<string>): boolean {
  if (!item) return false;
  return owned.has(itemKey(item.slot, item.id)) || (item.priceCoins === 0 && item.onSale);
}

/**
 * A coin price in real money, at the smallest coin pack's rate, rounded up to the penny so
 * it never understates the cost. "60p", "£1.19".
 */
export function moneyEquivalent(coins: number): string {
  const pence = Math.ceil((coins * MONEY_EQUIVALENT_PACK.pricePence) / MONEY_EQUIVALENT_PACK.coins);
  return pence < 100 ? `${pence}p` : `£${(pence / 100).toFixed(2)}`;
}
