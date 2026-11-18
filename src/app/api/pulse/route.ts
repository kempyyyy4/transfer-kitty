import { RATE_LIMITS } from "@/config/rate-limits";
import { eventBatchSchema, identifyVisitor, recordEvents } from "@/features/analytics/server";
import { clientAddress, readJsonBody } from "@/lib/http";
import { isWithinRateLimit } from "@/lib/rate-limit";

/**
 * Page views and events from the site's own pages. No cookies are read or set, and no
 * address or browser string is stored: only coarse facts and a hash that changes daily.
 * The reply is always empty, so a page never waits on it or learns anything from it.
 */
export async function POST(request: Request) {
  const facts = {
    address: clientAddress(request),
    userAgent: request.headers.get("user-agent") ?? "",
    country: request.headers.get("x-vercel-ip-country")?.slice(0, 2).toUpperCase() || null,
    host: new URL(request.url).hostname,
  };
  const who = await identifyVisitor(facts);
  if (!who) return new Response(null, { status: 204 });
  if (!(await isWithinRateLimit(RATE_LIMITS.analytics, who.visitor))) {
    return new Response(null, { status: 429 });
  }

  const body = await readJsonBody(request, eventBatchSchema);
  if ("reply" in body) return body.reply;

  await recordEvents(who, facts, body.data.events);
  return new Response(null, { status: 204 });
}
