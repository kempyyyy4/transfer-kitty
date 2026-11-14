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

  it("refuses offensive names, including look-alike spellings", () => {
    for (const name of ["shithead", "sh1thead", "Fuuuck off", "a s s h o l e"]) {
      expect(checkDisplayName(name).ok, name).toBe(false);
    }
  });

  it("does not refuse ordinary names that only contain a rude-looking run of letters", () => {
    for (const name of ["Scunthorpe Fan", "Cassandra", "Matt Butcher", "Hancock FC", "Essex Lad"]) {
      expect(checkDisplayName(name).ok, name).toBe(true);
    }
  });

  it("refuses names that could pass for the game or its staff", () => {
    for (const name of ["Admin", "Transfer_Kitty 1", "Official Kit", "Kit The Cat"]) {
      expect(checkDisplayName(name).ok, name).toBe(false);
    }
  });
});
