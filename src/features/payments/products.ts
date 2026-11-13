import { COIN_PACKS } from "@/config/coins";
import { LIFETIME_UNLOCK, PACK_PRICE_PENCE } from "@/config/products";

/**
 * What a product key buys. Keys: "lifetime", a coin pack ID such as "coins-500", or
 * "pack:<pack id>". The same key is stored on the purchase and read back by the webhook.
 */
export type Grant = { kind: "entitlement"; key: string } | { kind: "coins"; coins: number };

export interface Product {
  key: string;
  name: string;
  description: string;
  pricePence: number;
  grant: Grant;
}

const PACK_KEY = /^pack:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;

/** The pack ID in a "pack:<id>" key, or null for any other key. */
export function packIdOf(key: string): string | null {
  return PACK_KEY.exec(key)?.[1] ?? null;
}

/**
 * The product for a key. A pack needs its name, looked up by the caller; `packName` is
 * null when the pack is not on sale. Returns null for anything unknown.
 */
export function productFor(key: string, packName: string | null = null): Product | null {
  if (key === LIFETIME_UNLOCK.key) {
    return {
      key,
      name: LIFETIME_UNLOCK.name,
      description: LIFETIME_UNLOCK.description,
      pricePence: LIFETIME_UNLOCK.pricePence,
      grant: { kind: "entitlement", key },
    };
  }

  const coins = COIN_PACKS.find((pack) => pack.id === key);
  if (coins) {
    return {
      key,
      name: `${coins.coins.toLocaleString("en-GB")} Transfer Kitty coins`,
      description: "Spend them on kits and avatar items in the shop.",
      pricePence: coins.pricePence,
      grant: { kind: "coins", coins: coins.coins },
    };
  }

  if (packIdOf(key) && packName) {
    return {
      key,
      name: `${packName} (Transfer Kitty pack)`,
      description: "Rounds of 7 from this pack, yours to keep.",
      pricePence: PACK_PRICE_PENCE,
      grant: { kind: "entitlement", key },
    };
  }
  return null;
}

/**
 * What a stored purchase grants, from its key alone. Used by the webhook, so a pack taken
 * off sale after someone paid for it is still delivered.
 */
export function grantFor(key: string): Grant | null {
  if (key === LIFETIME_UNLOCK.key || packIdOf(key)) return { kind: "entitlement", key };
  const coins = COIN_PACKS.find((pack) => pack.id === key);
  return coins ? { kind: "coins", coins: coins.coins } : null;
}

export function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}
