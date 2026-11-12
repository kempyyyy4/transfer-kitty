import { z } from "zod";
import { ITEM_SLOTS } from "@/features/avatar";

const slot = z.enum(ITEM_SLOTS);
const itemId = z.string().min(1).max(40);

export const buySchema = z.object({ slot, itemId });

export const priceChangeSchema = z.object({
  slot,
  itemId,
  priceCoins: z.number().int().min(0).max(100_000),
  onSale: z.boolean(),
});
