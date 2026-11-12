import { connection } from "next/server";
import { getAdminAccess } from "@/lib/auth";

/**
 * Whether the visitor can use the admin area, and if not, why. A signed-in visitor is
 * told their own account ID, so the admin can copy it into ADMIN_USER_ID.
 */
export async function GET() {
  await connection();
  return Response.json(await getAdminAccess());
}
