import {
  adminGate,
  dismissReport,
  dismissReportSchema,
  listReports,
} from "@/features/admin/server";
import { readJsonBody } from "@/lib/http";

/** Open missing-answer reports, most reported first. */
export async function GET() {
  const gate = await adminGate();
  if ("reply" in gate) return gate.reply;
  return Response.json(await listReports());
}

/** Closes the reports of one player on one question: they are not a valid answer. */
export async function DELETE(request: Request) {
  const gate = await adminGate();
  if ("reply" in gate) return gate.reply;

  const body = await readJsonBody(request, dismissReportSchema);
  if ("reply" in body) return body.reply;

  return Response.json({
    dismissed: await dismissReport(body.data.questionId, body.data.playerId),
  });
}
