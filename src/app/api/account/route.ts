import { getAccountStatus } from "@/features/account/server";

/** Whether the visitor is a guest or signed in, with their email and display name. */
export async function GET() {
  return Response.json(await getAccountStatus());
}
