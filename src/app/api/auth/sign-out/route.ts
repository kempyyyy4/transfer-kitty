import { signOut } from "@/lib/auth";

/** Signs out. The next game this browser starts is played as a new guest. */
export async function POST() {
  await signOut();
  return Response.json({ signedOut: true });
}
