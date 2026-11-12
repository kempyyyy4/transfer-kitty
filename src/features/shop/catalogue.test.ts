import { describe, expect, it } from "vitest";
import { KITS } from "@/config/kits";
import { canWear, catalogue, moneyEquivalent, priceCatalogue } from "./catalogue";

describe("catalogue", () => {
  it("lists every kit with its name", () => {
    const kits = catalogue().filter((item) => item.slot === "kit");
    expect(kits.map((kit) => kit.name)).toEqual(KITS.map((kit) => kit.name));
  });

  it("gives every item a key that is unique across slots", () => {
    const keys = catalogue().map((item) => `${item.slot}:${item.id}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("priceCatalogue", () => {
  const items = catalogue();
  const kit = items.find((item) => item.slot === "kit" && item.configPrice > 0);
  if (!kit) throw new Error("No priced kit in the catalogue");

  it("uses the config price when Admin has not changed it", () => {
    const priced = priceCatalogue(items, []).find((item) => item.id === kit.id);
    expect(priced?.priceCoins).toBe(kit.configPrice);
    expect(priced?.onSale).toBe(true);
  });

  it("uses the admin's price and availability when set", () => {
    const priced = priceCatalogue(items, [
      { slot: "kit", itemId: kit.id, priceCoins: 999, onSale: false },
    ]).find((item) => item.id === kit.id);
    expect(priced).toMatchObject({ priceCoins: 999, onSale: false });
  });
});

describe("canWear", () => {
  const base = { slot: "kit" as const, id: "x", name: "X", configPrice: 300 };

  it("allows a free item, and a priced one only once owned", () => {
    expect(canWear({ ...base, priceCoins: 0, onSale: true }, new Set())).toBe(true);
    expect(canWear({ ...base, priceCoins: 300, onSale: true }, new Set())).toBe(false);
    expect(canWear({ ...base, priceCoins: 300, onSale: true }, new Set(["kit:x"]))).toBe(true);
  });

  it("lets an owner keep wearing an item taken off sale", () => {
    expect(canWear({ ...base, priceCoins: 300, onSale: false }, new Set(["kit:x"]))).toBe(true);
  });
});

describe("moneyEquivalent", () => {
  it("prices coins at the 500 for 99p rate, rounded up", () => {
    expect(moneyEquivalent(500)).toBe("99p");
    expect(moneyEquivalent(300)).toBe("60p");
    expect(moneyEquivalent(100)).toBe("20p");
    expect(moneyEquivalent(1000)).toBe("£1.98");
  });
});
