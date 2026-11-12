import { adminGate } from "@/features/admin/server";
import { listPrices, priceChangeSchema, setPrice } from "@/features/shop/server";
import { jsonError, readJsonBody } from "@/lib/http";

/** Every kit and avatar item with its current price and whether it is on sale. */
export async function GET() {
  const gate = await adminGate();
  if ("reply" in gate) return gate.reply;
  return Response.json(await listPrices());
}

/** Changes one item's price, or takes it on or off sale. */
export async function POST(request: Request) {
  const gate = await adminGate();
  if ("reply" in gate) return gate.reply;

  const body = await readJsonBody(request, priceChangeSchema);
  if ("reply" in body) return body.reply;

  const { slot, itemId, priceCoins, onSale } = body.data;
  const saved = await setPrice(slot, itemId, priceCoins, onSale);
  return saved ? Response.json({ saved: true }) : jsonError(404, "That item was not found.");
}
