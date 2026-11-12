import type { ItemSlot } from "@/features/avatar";

/** What the shop API sends to the browser. Only the visitor's own balance and items. */
export interface ShopItem {
  slot: ItemSlot;
  id: string;
  name: string;
  priceCoins: number;
  owned: boolean;
}

export interface Shop {
  status: "none" | "guest" | "signed_in";
  balance: number;
  items: ShopItem[];
}
