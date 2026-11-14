import { describe, expect, it } from "vitest";
import { formatPrice, grantFor, packIdOf, productFor } from "./products";

const PACK_ID = "0b6f7c1e-1111-4a4a-9b9b-123456789abc";

describe("productFor", () => {
  it("prices the lifetime unlock at £3.99 and grants the lifetime entitlement", () => {
    expect(productFor("lifetime")).toMatchObject({
      pricePence: 399,
      grant: { kind: "entitlement", key: "lifetime" },
    });
  });

  it("prices coin packs as the brief says", () => {
    expect(productFor("coins-500")).toMatchObject({ pricePence: 99, grant: { coins: 500 } });
    expect(productFor("coins-1200")).toMatchObject({ pricePence: 199, grant: { coins: 1200 } });
    expect(productFor("coins-3500")).toMatchObject({ pricePence: 499, grant: { coins: 3500 } });
  });

  it("prices a pack on sale at £1.99, and refuses one that is not", () => {
    expect(productFor(`pack:${PACK_ID}`, "The 2010s")).toMatchObject({
      pricePence: 199,
      grant: { kind: "entitlement", key: `pack:${PACK_ID}` },
    });
    expect(productFor(`pack:${PACK_ID}`, null)).toBeNull();
  });

  it("refuses anything else", () => {
    for (const key of ["", "coins-1", "pack:nope", "LIFETIME", "lifetime "]) {
      expect(productFor(key, "Name")).toBeNull();
    }
  });
});

describe("helpers", () => {
  it("reads a pack ID from its key", () => {
    expect(packIdOf(`pack:${PACK_ID}`)).toBe(PACK_ID);
    expect(packIdOf("lifetime")).toBeNull();
  });

  it("formats pence as pounds", () => {
    expect(formatPrice(399)).toBe("£3.99");
    expect(formatPrice(99)).toBe("£0.99");
  });
});

describe("grantFor", () => {
  it("delivers a stored purchase even if its pack is no longer on sale", () => {
    expect(grantFor(`pack:${PACK_ID}`)).toEqual({ kind: "entitlement", key: `pack:${PACK_ID}` });
    expect(grantFor("coins-1200")).toEqual({ kind: "coins", coins: 1200 });
    expect(grantFor("lifetime")).toEqual({ kind: "entitlement", key: "lifetime" });
    expect(grantFor("free-stuff")).toBeNull();
  });
});
