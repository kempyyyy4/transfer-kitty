import { adminGate, getSchedule } from "@/features/admin/server";

/** The coming days' puzzles and their questions. */
export async function GET() {
  const gate = await adminGate();
  if ("reply" in gate) return gate.reply;
  return Response.json(await getSchedule());
}
