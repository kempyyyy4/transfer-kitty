import { z } from "zod";

/** The browser only names a product. Its price is looked up on the server. */
export const checkoutSchema = z.object({ product: z.string().min(1).max(60) });

export const purchaseIdSchema = z.uuid();
