import { describe, expect, it } from "vitest";
import { catalogue, priceCatalogue } from "./catalogue";
import { itemsForDay } from "./rotation";

const items = priceCatalogue(catalogue(), []);

describe("itemsForDay", () => {
  it("shows six priced items", () => {
    const today = itemsForDay(items, "2026-11-16");
    expect(today).toHaveLength(6);
    expect(today.every((item) => item.priceCoins > 0 && item.onSale)).toBe(true);
  });

  it("is the same all day, for everyone", () => {
    expect(itemsForDay(items, "2026-11-16")).toEqual(itemsForDay(items, "2026-11-16"));
  });

  it("changes from one day to the next", () => {
    const keys = (day: string) => itemsForDay(items, day).map((item) => `${item.slot}:${item.id}`);
    expect(keys("2026-11-16")).not.toEqual(keys("2026-11-17"));
  });

  it("never offers an item taken off sale", () => {
    const offSale = items.map((item) => ({ ...item, onSale: item.slot !== "kit" }));
    expect(itemsForDay(offSale, "2026-11-16").some((item) => item.slot === "kit")).toBe(false);
  });
});
