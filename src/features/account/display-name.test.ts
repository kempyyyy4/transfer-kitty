import { describe, expect, it } from "vitest";
import { checkDisplayName } from "./display-name";

describe("checkDisplayName", () => {
  it("accepts an ordinary name and tidies its spaces", () => {
    expect(checkDisplayName("  Kitty   Keeper ")).toEqual({ ok: true, name: "Kitty Keeper" });
  });

  it("accepts accented letters, digits and simple punctuation", () => {
    expect(checkDisplayName("Zoë_O'Neil-9")).toEqual({ ok: true, name: "Zoë_O'Neil-9" });
  });

  it("refuses names that are too short or too long", () => {
    expect(checkDisplayName("ab").ok).toBe(false);
    expect(checkDisplayName("a".repeat(21)).ok).toBe(false);
    expect(checkDisplayName("a".repeat(20)).ok).toBe(true);
  });

  it("refuses symbols and names starting with punctuation", () => {
    expect(checkDisplayName("<script>").ok).toBe(false);
    expect(checkDisplayName("_hidden").ok).toBe(false);
    expect(checkDisplayName("cat 🐱 fan").ok).toBe(false);
  });

  it("refuses names that look like the board's placeholders", () => {
    expect(checkDisplayName("Guest 8122").ok).toBe(false);
    expect(checkDisplayName("player one").ok).toBe(false);
    expect(checkDisplayName("Playmaker").ok).toBe(true);
  });
});
