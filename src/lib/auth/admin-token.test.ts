import { describe, expect, it } from "vitest";
import { isValidAdminToken, makeAdminToken, passwordMatches } from "./admin-token";

const USER = "6f1c2c1e-1111-4a4a-9b9b-123456789abc";
const PASSWORD = "a-long-test-password";
const NOW = 1_000_000;

describe("admin token", () => {
  const token = makeAdminToken(USER, PASSWORD, NOW + 60_000);

  it("accepts a fresh token for the same account and password", () => {
    expect(isValidAdminToken(token, USER, PASSWORD, NOW)).toBe(true);
  });

  it("refuses an expired token", () => {
    expect(isValidAdminToken(token, USER, PASSWORD, NOW + 60_000)).toBe(false);
  });

  it("refuses a token for another account", () => {
    expect(isValidAdminToken(token, "someone-else", PASSWORD, NOW)).toBe(false);
  });

  it("refuses every token once the password changes", () => {
    expect(isValidAdminToken(token, USER, "a-different-password", NOW)).toBe(false);
  });

  it("refuses a token whose expiry was pushed back", () => {
    const [, signed] = token.split(".");
    expect(isValidAdminToken(`${NOW + 999_999}.${signed}`, USER, PASSWORD, NOW)).toBe(false);
  });

  it("refuses junk", () => {
    for (const junk of ["", "abc", "1.2.3", `x.${token}`]) {
      expect(isValidAdminToken(junk, USER, PASSWORD, NOW)).toBe(false);
    }
  });
});

describe("passwordMatches", () => {
  it("matches only the exact password", () => {
    expect(passwordMatches(PASSWORD, PASSWORD)).toBe(true);
    expect(passwordMatches(`${PASSWORD} `, PASSWORD)).toBe(false);
    expect(passwordMatches("", PASSWORD)).toBe(false);
  });
});
