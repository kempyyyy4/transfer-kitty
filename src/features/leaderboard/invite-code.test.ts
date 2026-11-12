import { describe, expect, it } from "vitest";
import { LEAGUES } from "@/config/leaderboard";
import { makeInviteCode, normaliseInviteCode } from "./invite-code";

describe("makeInviteCode", () => {
  it("makes a code of the configured length from the safe alphabet", () => {
    let seed = 7;
    const code = makeInviteCode((n) => (seed = (seed * 31 + 11) % 997) % n);

    expect(code).toHaveLength(LEAGUES.inviteCodeLength);
    expect([...code].every((letter) => LEAGUES.inviteCodeAlphabet.includes(letter))).toBe(true);
  });

  it("never contains letters that are easy to misread", () => {
    for (let index = 0; index < LEAGUES.inviteCodeAlphabet.length; index++) {
      expect(makeInviteCode(() => index)).not.toMatch(/[01OIL]/);
    }
  });
});

describe("normaliseInviteCode", () => {
  it("accepts a code typed in lower case or with spaces and dashes", () => {
    expect(normaliseInviteCode("abc 234")).toBe("ABC234");
    expect(normaliseInviteCode(" ab-c2-34 ")).toBe("ABC234");
  });

  it("rejects codes of the wrong length", () => {
    expect(normaliseInviteCode("ABC23")).toBeNull();
    expect(normaliseInviteCode("ABC2345")).toBeNull();
  });

  it("rejects letters that codes never use", () => {
    expect(normaliseInviteCode("ABC10O")).toBeNull();
  });
});
