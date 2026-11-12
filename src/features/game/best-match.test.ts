import { describe, expect, it } from "vitest";
import { bestMatch, confidentMatch } from "./best-match";

const players = (...names: string[]) => names.map((name, id) => ({ id, name }));

describe("bestMatch", () => {
  it("prefers an exact name, ignoring case and accents", () => {
    const list = players("Steven Gerrard", "Anthony Gerrard");

    expect(bestMatch("anthony gerrard", list)?.name).toBe("Anthony Gerrard");
    expect(bestMatch("Luka Modric", players("Luka Modrić"))?.name).toBe("Luka Modrić");
  });

  it("next prefers a name containing every typed word", () => {
    const list = players("Steven Gerrard", "Steven Caldwell", "Steve McManaman");

    expect(bestMatch("mcmanaman steve", list)?.name).toBe("Steve McManaman");
  });

  it("otherwise takes the best-known suggestion", () => {
    expect(bestMatch("gerr", players("Steven Gerrard", "Anthony Gerrard"))?.name).toBe(
      "Steven Gerrard",
    );
  });

  it("only counts as confident when a name fits every typed word", () => {
    const staleList = players("Gerson", "Gervinho");

    expect(confidentMatch("gerrard", staleList)).toBeNull();
    expect(confidentMatch("gerv", staleList)?.name).toBe("Gervinho");
  });

  it("gives nothing when nothing was typed or nothing matched", () => {
    expect(bestMatch("   ", players("Steven Gerrard"))).toBeNull();
    expect(bestMatch("zzz", [])).toBeNull();
  });
});
