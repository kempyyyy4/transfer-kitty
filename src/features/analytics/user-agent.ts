/**
 * Reads the coarse facts analytics keeps from a browser's user-agent string: the kind of
 * device, the browser and the system. The string itself is never stored.
 */

export interface DeviceFacts {
  device: "phone" | "tablet" | "desktop";
  browser: string;
  os: string;
}

const BOT =
  /bot|crawl|spider|slurp|headless|lighthouse|preview|fetch|monitor|curl|wget|python|axios|node-fetch|go-http/i;

/** Search engines, link previewers, uptime checkers and scripted browsers. */
export function isBot(userAgent: string): boolean {
  return userAgent.trim() === "" || BOT.test(userAgent);
}

export function deviceFacts(userAgent: string): DeviceFacts {
  return { device: deviceOf(userAgent), browser: browserOf(userAgent), os: osOf(userAgent) };
}

function deviceOf(ua: string): DeviceFacts["device"] {
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) {
    return "tablet";
  }
  if (/Mobi|iPhone|iPod|Android/i.test(ua)) return "phone";
  return "desktop";
}

/** Order matters: Edge, Opera and Samsung Internet also say "Chrome", and Chrome says "Safari". */
function browserOf(ua: string): string {
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\/|Opera/.test(ua)) return "Opera";
  if (/SamsungBrowser/.test(ua)) return "Samsung Internet";
  if (/FBAN|FBAV|Instagram/.test(ua)) return "In-app (Meta)";
  if (/Firefox|FxiOS/.test(ua)) return "Firefox";
  if (/Chrome|CriOS/.test(ua)) return "Chrome";
  if (/Safari/.test(ua)) return "Safari";
  return "Other";
}

function osOf(ua: string): string {
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  if (/Android/.test(ua)) return "Android";
  if (/Windows/.test(ua)) return "Windows";
  if (/Mac OS X|Macintosh/.test(ua)) return "macOS";
  if (/CrOS/.test(ua)) return "ChromeOS";
  if (/Linux/.test(ua)) return "Linux";
  return "Other";
}
