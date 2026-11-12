import { describe, expect, it } from "vitest";
import { toSearchName } from "./search-name";

describe("toSearchName", () => {
  it("lower-cases and removes accents", () => {
    expect(toSearchName("Luka Modrić")).toBe("luka modric");
    expect(toSearchName("Thomas Müller")).toBe("thomas muller");
    expect(toSearchName("Kylian Mbappé")).toBe("kylian mbappe");
  });

  it("converts letters that have no separate accent", () => {
    expect(toSearchName("Martin Ødegaard")).toBe("martin odegaard");
    expect(toSearchName("Robert Lewandowski")).toBe("robert lewandowski");
    expect(toSearchName("Łukasz Fabiański")).toBe("lukasz fabianski");
    expect(toSearchName("Hakan Çalhanoğlu")).toBe("hakan calhanoglu");
    expect(toSearchName("Ragnar Sigurðsson")).toBe("ragnar sigurdsson");
  });

  it("turns punctuation into single spaces", () => {
    expect(toSearchName("Trent Alexander-Arnold")).toBe("trent alexander arnold");
    expect(toSearchName("N'Golo Kanté")).toBe("n golo kante");
    expect(toSearchName("  1.FC  Köln ")).toBe("1 fc koln");
  });

  it("gives the same result for a typed query and a stored name", () => {
    expect(toSearchName("MULLER")).toBe(toSearchName("Müller"));
  });
});
