import { lockAdmin } from "@/lib/auth";

/** Forgets the admin password on this browser. */
export async function POST() {
  await lockAdmin();
  return Response.json({ locked: true });
}
