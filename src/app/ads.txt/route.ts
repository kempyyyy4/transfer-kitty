import { getPublicEnv } from "@/lib/env";

/** Google's fixed ID for its AdSense seller entry in ads.txt. */
const GOOGLE_CERTIFICATION_ID = "f08c47fec0942fa0";

/**
 * ads.txt tells ad buyers which sellers may sell this site's ad space. AdSense needs it
 * before it will show ads. Built from NEXT_PUBLIC_ADSENSE_CLIENT; absent until that is set.
 */
export function GET() {
  const client = getPublicEnv().adsenseClient;
  if (!client) return new Response("Not found", { status: 404 });

  const publisher = client.replace(/^ca-/, "");
  return new Response(`google.com, ${publisher}, DIRECT, ${GOOGLE_CERTIFICATION_ID}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
