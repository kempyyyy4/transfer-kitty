import "server-only";
import Stripe from "stripe";
import { getServerEnv } from "@/lib/env";

let client: Stripe | undefined;

/** The Stripe client, or null when STRIPE_SECRET_KEY is not set and payments are off. */
export function getStripe(): Stripe | null {
  const key = getServerEnv().STRIPE_SECRET_KEY;
  if (!key) return null;
  client ??= new Stripe(key);
  return client;
}

export function getWebhookSecret(): string | null {
  return getServerEnv().STRIPE_WEBHOOK_SECRET ?? null;
}
