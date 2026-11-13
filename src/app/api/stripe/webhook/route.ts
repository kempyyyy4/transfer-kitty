import { handleStripeWebhook } from "@/features/payments/server";

/**
 * Stripe calls this when a payment completes. The signature check needs the exact body
 * Stripe sent, so it is read as text. Stripe retries anything that is not a 2xx.
 */
export async function POST(request: Request) {
  const outcome = await handleStripeWebhook(
    await request.text(),
    request.headers.get("stripe-signature"),
  );
  if (outcome === "bad_signature")
    return Response.json({ error: "Bad signature." }, { status: 400 });
  // A payment for a different amount than was asked is left for a person to look at.
  if (outcome === "amount_mismatch") {
    return Response.json({ error: "Amount does not match." }, { status: 409 });
  }
  return Response.json({ received: true, outcome });
}
