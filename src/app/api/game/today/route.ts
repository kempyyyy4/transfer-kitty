import { getTodayStatus } from "@/features/game";
import { getUserId } from "@/lib/auth";

/** Today's puzzle number and whether this visitor has played it. Creates no session. */
export async function GET() {
  const userId = await getUserId();
  return Response.json(await getTodayStatus(userId, new Date()));
}
