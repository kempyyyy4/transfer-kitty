import { connection } from "next/server";
import { isDatabaseReachable } from "@/lib/db";

export async function GET() {
  // Wait for a real request, so the build never tries to reach the database.
  await connection();

  const reachable = await isDatabaseReachable();
  return Response.json(
    { database: reachable ? "ok" : "unreachable" },
    { status: reachable ? 200 : 503 },
  );
}
