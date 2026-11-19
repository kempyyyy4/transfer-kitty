/**
 * Everything sold for real money, in pence. Prices are from the brief. Stripe Checkout is
 * sent these amounts by the server; nothing in the browser can change them.
 */
export const LIFETIME_UNLOCK = {
  key: "lifetime",
  name: "Transfer Kitty lifetime unlock",
  description: "Unlimited, Archive, Nine Lives and no ads, for good.",
  pricePence: 399,
} as const;

/** Every themed pack costs the same. */
export const PACK_PRICE_PENCE = 199;

/**
 * Stripe's product tax code for everything sold: "General - Electronically Supplied
 * Services", which is how EU VAT treats digital content (docs.stripe.com/tax/tax-codes).
 */
export const STRIPE_TAX_CODE = "txcd_10000000";
