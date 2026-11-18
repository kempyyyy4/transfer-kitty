import { adminGate } from "@/features/admin/server";
import { analyticsReport, reportRangeSchema } from "@/features/analytics/server";
import { jsonError } from "@/lib/http";

/** The analytics dashboard's figures for a range of UK days, ?from=YYYY-MM-DD&to=YYYY-MM-DD. */
export async function GET(request: Request) {
  const gate = await adminGate();
  if ("reply" in gate) return gate.reply;

  const params = new URL(request.url).searchParams;
  const range = reportRangeSchema.safeParse({ from: params.get("from"), to: params.get("to") });
  if (!range.success || range.data.from > range.data.to) {
    return jsonError(400, "Pick a valid range of days.");
  }
  return Response.json(await analyticsReport(range.data.from, range.data.to));
}
