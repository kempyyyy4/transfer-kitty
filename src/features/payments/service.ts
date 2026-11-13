import "server-only";
import type Stripe from "stripe";
import { getVisitor } from "@/lib/auth";
import {
  attachStripeSession,
  fulfilPurchase,
  getLivePacks,
  getPurchase,
  getPurchaseByStripeSession,
  insertPurchase,
  type FulfilOutcome,
} from "@/lib/db";
import { getStripe, getWebhookSecret } from "@/lib/stripe";
import { getAccess } from "./access";
import { grantFor, packIdOf, productFor, type Product } from "./products";
import type { PurchaseStatus } from "./types";

async function findProduct(key: string): Promise<Product | null> {
  const packId = packIdOf(key);
  if (!packId) return productFor(key);
  const pack = (await getLivePacks()).find((live) => live.id === packId);
  return productFor(key, pack?.name ?? null);
}

export type CheckoutOutcome =
  | { status: "ready"; url: string }
  | { status: "not_signed_in" | "unknown_product" | "already_owned" | "payments_off" };

/**
 * Starts a Stripe Checkout for one product. The price is the server's own; the browser
 * only names the product. Needs a signed-in account so purchases can be restored.
 */
export async function startCheckout(productKey: string, origin: string): Promise<CheckoutOutcome> {
  const stripe = getStripe();
  if (!stripe) return { status: "payments_off" };

  const visitor = await getVisitor();
  if (!visitor || visitor.isGuest) return { status: "not_signed_in" };

  const product = await findProduct(productKey);
  if (!product) return { status: "unknown_product" };
  if (product.grant.kind === "entitlement" && (await owns(visitor.userId, product.grant.key))) {
    return { status: "already_owned" };
  }

  const purchaseId = await insertPurchase(visitor.userId, product.key, product.pricePence);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: product.pricePence,
          product_data: { name: product.name, description: product.description },
        },
      },
    ],
    client_reference_id: purchaseId,
    metadata: { purchase_id: purchaseId },
    customer_email: visitor.email ?? undefined,
    success_url: `${origin}/purchase?id=${purchaseId}`,
    cancel_url: `${origin}/shop?cancelled=1`,
  });
  if (!session.url) throw new Error("Stripe did not return a Checkout address.");

  await attachStripeSession(purchaseId, session.id);
  return { status: "ready", url: session.url };
}

async function owns(userId: string, entitlementKey: string): Promise<boolean> {
  const access = await getAccess(userId);
  if (entitlementKey === "lifetime") return access.lifetime;
  const packId = packIdOf(entitlementKey);
  return packId !== null && access.packIds.includes(packId);
}

export type WebhookOutcome = "bad_signature" | "ignored" | FulfilOutcome;

/** Events that mean a Checkout has been paid for. */
const PAID_EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
]);

/**
 * Handles one webhook from Stripe. The signature proves Stripe sent it. What is granted
 * comes from the purchase stored when Checkout started, never from the event's metadata.
 */
export async function handleStripeWebhook(
  rawBody: string,
  signature: string | null,
): Promise<WebhookOutcome> {
  const stripe = getStripe();
  const secret = getWebhookSecret();
  if (!stripe || !secret || !signature) return "bad_signature";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    return "bad_signature";
  }
  if (!PAID_EVENTS.has(event.type)) return "ignored";

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") return "ignored";

  const purchase = await getPurchaseByStripeSession(session.id);
  if (!purchase) return "unknown";
  const grant = grantFor(purchase.productKey);
  if (!grant) return "unknown";

  return fulfilPurchase({
    eventId: event.id,
    eventType: event.type,
    stripeSessionId: session.id,
    amountPence: session.amount_total ?? 0,
    entitlementKey: grant.kind === "entitlement" ? grant.key : null,
    coins: grant.kind === "coins" ? grant.coins : null,
  });
}

/** Whether the visitor's purchase has been paid for yet. Null if it is not theirs. */
export async function getPurchaseStatus(purchaseId: string): Promise<PurchaseStatus | null> {
  const visitor = await getVisitor();
  if (!visitor) return null;
  return (await getPurchase(visitor.userId, purchaseId))?.status ?? null;
}

/** The visitor's own access, for screens that change with it. */
export async function getMyAccess() {
  const visitor = await getVisitor();
  return getAccess(visitor?.userId ?? null);
}
