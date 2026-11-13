import "server-only";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase/server";

/** Records a Checkout about to start. Returns the purchase's ID. */
export async function insertPurchase(
  userId: string,
  productKey: string,
  amountPence: number,
): Promise<string> {
  const { data, error } = await getServiceClient()
    .from("purchases")
    .insert({ user_id: userId, product_key: productKey, amount_pence: amountPence })
    .select("id")
    .single();
  if (error) throw new Error(`Recording the purchase failed: ${error.message}`);
  return z.object({ id: z.string() }).parse(data).id;
}

export async function attachStripeSession(purchaseId: string, stripeSessionId: string) {
  const { error } = await getServiceClient()
    .from("purchases")
    .update({ stripe_session_id: stripeSessionId })
    .eq("id", purchaseId);
  if (error) throw new Error(`Linking the Stripe session failed: ${error.message}`);
}

const purchaseSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  product_key: z.string(),
  amount_pence: z.number(),
  status: z.enum(["pending", "paid"]),
});

export interface PurchaseRow {
  id: string;
  userId: string;
  productKey: string;
  amountPence: number;
  status: "pending" | "paid";
}

function toPurchase(row: z.infer<typeof purchaseSchema>): PurchaseRow {
  return {
    id: row.id,
    userId: row.user_id,
    productKey: row.product_key,
    amountPence: row.amount_pence,
    status: row.status,
  };
}

const PURCHASE_COLUMNS = "id, user_id, product_key, amount_pence, status";

export async function getPurchaseByStripeSession(
  stripeSessionId: string,
): Promise<PurchaseRow | null> {
  const { data, error } = await getServiceClient()
    .from("purchases")
    .select(PURCHASE_COLUMNS)
    .eq("stripe_session_id", stripeSessionId)
    .maybeSingle();
  if (error) throw new Error(`Reading the purchase failed: ${error.message}`);
  return data ? toPurchase(purchaseSchema.parse(data)) : null;
}

/** One of the user's own purchases. Null if it is not theirs. */
export async function getPurchase(userId: string, purchaseId: string): Promise<PurchaseRow | null> {
  const { data, error } = await getServiceClient()
    .from("purchases")
    .select(PURCHASE_COLUMNS)
    .eq("id", purchaseId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`Reading the purchase failed: ${error.message}`);
  return data ? toPurchase(purchaseSchema.parse(data)) : null;
}

const fulfilSchema = z.enum(["fulfilled", "duplicate", "unknown", "amount_mismatch"]);
export type FulfilOutcome = z.infer<typeof fulfilSchema>;

/** See the fulfil_purchase database function. */
export async function fulfilPurchase(event: {
  eventId: string;
  eventType: string;
  stripeSessionId: string;
  amountPence: number;
  entitlementKey: string | null;
  coins: number | null;
}): Promise<FulfilOutcome> {
  const { data, error } = await getServiceClient().rpc("fulfil_purchase", {
    p_event_id: event.eventId,
    p_event_type: event.eventType,
    p_stripe_session_id: event.stripeSessionId,
    p_amount_pence: event.amountPence,
    p_entitlement_key: event.entitlementKey,
    p_coins: event.coins,
  });
  if (error) throw new Error(`Fulfilling the purchase failed: ${error.message}`);
  return fulfilSchema.parse(data);
}

/** The user's entitlement keys: "lifetime" and "pack:<id>". */
export async function getEntitlementKeys(userId: string): Promise<string[]> {
  const { data, error } = await getServiceClient()
    .from("entitlements")
    .select("key")
    .eq("user_id", userId);
  if (error) throw new Error(`Reading entitlements failed: ${error.message}`);
  return z
    .array(z.object({ key: z.string() }))
    .parse(data)
    .map((row) => row.key);
}
