import { describe, expect, it } from "vitest";
import { parseServerEnv } from "./env";

const validEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  SUPABASE_SECRET_KEY: "sb_secret_test",
};

describe("parseServerEnv", () => {
  it("returns the values when every variable is set", () => {
    expect(parseServerEnv(validEnv)).toEqual(validEnv);
  });

  it("names the variable that is missing", () => {
    const { SUPABASE_SECRET_KEY: _omitted, ...withoutSecret } = validEnv;

    expect(() => parseServerEnv(withoutSecret)).toThrow(/SUPABASE_SECRET_KEY/);
  });

  it("rejects an empty value", () => {
    expect(() => parseServerEnv({ ...validEnv, SUPABASE_SECRET_KEY: "" })).toThrow(
      /SUPABASE_SECRET_KEY/,
    );
  });

  it("rejects a Supabase URL that is not a URL", () => {
    expect(() => parseServerEnv({ ...validEnv, NEXT_PUBLIC_SUPABASE_URL: "not a url" })).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/,
    );
  });
});

describe("parseServerEnv admin settings", () => {
  it("treats blank optional values as not set", () => {
    const env = parseServerEnv({ ...validEnv, ADMIN_USER_ID: "", ADMIN_PASSWORD: "" });
    expect(env.ADMIN_USER_ID).toBeUndefined();
    expect(env.ADMIN_PASSWORD).toBeUndefined();
  });

  it("rejects a short admin password", () => {
    expect(() => parseServerEnv({ ...validEnv, ADMIN_PASSWORD: "short" })).toThrow(
      /ADMIN_PASSWORD/,
    );
  });

  it("rejects an admin user ID that is not an account ID", () => {
    expect(() => parseServerEnv({ ...validEnv, ADMIN_USER_ID: "tom" })).toThrow(/ADMIN_USER_ID/);
  });
});
