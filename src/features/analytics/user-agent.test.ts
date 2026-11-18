import { describe, expect, it } from "vitest";
import { deviceFacts, isBot } from "./user-agent";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36";
const IPAD =
  "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const WINDOWS_EDGE =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0";
const MAC_FIREFOX =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.0; rv:131.0) Gecko/20100101 Firefox/131.0";

describe("device facts", () => {
  it("tells phones, tablets and desktops apart", () => {
    expect(deviceFacts(IPHONE)).toEqual({ device: "phone", browser: "Safari", os: "iOS" });
    expect(deviceFacts(ANDROID_CHROME)).toEqual({
      device: "phone",
      browser: "Chrome",
      os: "Android",
    });
    expect(deviceFacts(IPAD).device).toBe("tablet");
    expect(deviceFacts(WINDOWS_EDGE)).toEqual({
      device: "desktop",
      browser: "Edge",
      os: "Windows",
    });
    expect(deviceFacts(MAC_FIREFOX)).toEqual({
      device: "desktop",
      browser: "Firefox",
      os: "macOS",
    });
  });

  it("spots bots and scripted browsers", () => {
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(
      true,
    );
    expect(isBot("Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/130.0.0.0 Safari/537.36")).toBe(
      true,
    );
    expect(isBot("")).toBe(true);
    expect(isBot(IPHONE)).toBe(false);
  });
});
