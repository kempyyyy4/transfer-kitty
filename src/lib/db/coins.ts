import "server-only";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase/server";

/** A player's balance: the sum of every row in their coin ledger. */
export async function getCoinBalance(userId: string): Promise<number> {
  const { data, error } = await getServiceClient().rpc("coin_balance", { p_user_id: userId });
  if (error) throw new Error(`Reading the coin balance failed: ${error.message}`);
  return z.coerce.number().parse(data);
}

export interface CoinGrant {
  delta: number;
  reason: "daily_complete" | "galacticats" | "streak";
  sessionId: string;
  key: string;
}

/** Credits rewards. One already credited (same key) is skipped. Returns the coins added. */
export async function grantCoins(userId: string, grants: readonly CoinGrant[]): Promise<number> {
  const { data, error } = await getServiceClient().rpc("grant_coins", {
    p_user_id: userId,
    p_entries: grants.map((grant) => ({
      delta: grant.delta,
      reason: grant.reason,
      session_id: grant.sessionId,
      key: grant.key,
    })),
  });
  if (error) throw new Error(`Granting coins failed: ${error.message}`);
  return z.number().parse(data);
}

/** The coins a user was credited for one round. */
export async function getCoinsForSession(userId: string, sessionId: string): Promise<number> {
  const { data, error } = await getServiceClient()
    .from("coin_ledger")
    .select("delta")
    .eq("user_id", userId)
    .eq("session_id", sessionId);
  if (error) throw new Error(`Reading the round's coins failed: ${error.message}`);
  return z
    .array(z.object({ delta: z.number() }))
    .parse(data)
    .reduce((sum, row) => sum + row.delta, 0);
}

const buyOutcomeSchema = z.enum(["bought", "owned", "too_poor"]);
export type BuyOutcome = z.infer<typeof buyOutcomeSchema>;

/** See the buy_item database function. `price` must come from the server's own catalogue. */
export async function buyItem(
  userId: string,
  slot: string,
  itemId: string,
  price: number,
): Promise<BuyOutcome> {
  const { data, error } = await getServiceClient().rpc("buy_item", {
    p_user_id: userId,
    p_slot: slot,
    p_item_id: itemId,
    p_price: price,
  });
  if (error) throw new Error(`Buying the item failed: ${error.message}`);
  return buyOutcomeSchema.parse(data);
}

/** The items a user owns, as "slot:id" keys. */
export async function getOwnedItemKeys(userId: string): Promise<Set<string>> {
  const { data, error } = await getServiceClient()
    .from("user_items")
    .select("slot, item_id")
    .eq("user_id", userId);
  if (error) throw new Error(`Reading owned items failed: ${error.message}`);
  const rows = z.array(z.object({ slot: z.string(), item_id: z.string() })).parse(data);
  return new Set(rows.map((row) => `${row.slot}:${row.item_id}`));
}

const priceRowSchema = z.array(
  z.object({
    slot: z.enum(["fur", "breed", "eyes", "boots", "kit", "accessory"]),
    item_id: z.string(),
    price_coins: z.number(),
    on_sale: z.boolean(),
  }),
);

export interface StoredPriceChange {
  slot: "fur" | "breed" | "eyes" | "boots" | "kit" | "accessory";
  itemId: string;
  priceCoins: number;
  onSale: boolean;
}

/** Every price or availability change made in Admin. */
export async function getPriceChanges(): Promise<StoredPriceChange[]> {
  const { data, error } = await getServiceClient()
    .from("shop_prices")
    .select("slot, item_id, price_coins, on_sale");
  if (error) throw new Error(`Reading shop prices failed: ${error.message}`);
  return priceRowSchema.parse(data).map((row) => ({
    slot: row.slot,
    itemId: row.item_id,
    priceCoins: row.price_coins,
    onSale: row.on_sale,
  }));
}

export async function savePriceChange(change: StoredPriceChange): Promise<void> {
  const { error } = await getServiceClient().from("shop_prices").upsert({
    slot: change.slot,
    item_id: change.itemId,
    price_coins: change.priceCoins,
    on_sale: change.onSale,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Saving the price failed: ${error.message}`);
}
