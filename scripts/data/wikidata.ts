import path from "node:path";
import { WIKIDATA_DIR } from "./sources";

/** One club spell from a player's Wikidata entry ("member of sports team"). */
export interface CareerSpell {
  playerQid: string;
  playerTransfermarktId: number;
  teamQid: string;
  /** Present when Wikidata records the club's Transfermarkt ID, which is how clubs are matched. */
  teamTransfermarktId: number | null;
  startYear: number | null;
  endYear: number | null;
  /** League appearances for the spell, where an editor has entered them. */
  appearances: number | null;
}

/**
 * The download is split by the last two digits of the player's Transfermarkt ID, which
 * gives about a hundred even slices. Each one finishes well inside the query service's
 * time limit. "single" holds the few players with a one-digit ID.
 */
export const CAREER_SLICES: readonly string[] = [
  ...Array.from({ length: 100 }, (_, index) => String(index).padStart(2, "0")),
  "single",
];

export function careerSliceFile(slice: string): string {
  return path.join(WIKIDATA_DIR, `careers-${slice}.json`);
}

export function careerSliceQuery(slice: string): string {
  const filter = slice === "single" ? "STRLEN(?tm) = 1" : `STRENDS(?tm, "${slice}") && STRLEN(?tm) > 1`;
  // P2446 is the player's Transfermarkt ID, P54 "member of sports team", P7223 the team's
  // Transfermarkt ID. P580, P582 and P1350 are a spell's start, end and matches played.
  return `
    SELECT (STRAFTER(STR(?p), "entity/") AS ?player) ?tm
           (STRAFTER(STR(?team), "entity/") AS ?teamQid) ?teamTm
           (YEAR(?start) AS ?startYear) (YEAR(?end) AS ?endYear) ?apps
    WHERE {
      ?p wdt:P2446 ?tm . FILTER(${filter})
      ?p p:P54 ?spell . ?spell ps:P54 ?team .
      OPTIONAL { ?team wdt:P7223 ?teamTm }
      OPTIONAL { ?spell pq:P580 ?start }
      OPTIONAL { ?spell pq:P582 ?end }
      OPTIONAL { ?spell pq:P1350 ?apps }
    }`;
}
