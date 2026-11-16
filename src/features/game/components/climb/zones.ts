/**
 * The world the kitty climbs through: your kitty total is your height. Zones run from a
 * park pitch at £0 to the stars at the £700m maximum. Names and asides are our own
 * scenery, not football facts.
 */
export interface Zone {
  /** Where the zone starts, in £m. */
  fromM: number;
  name: string;
  /** The sky colour at the bottom of the zone; it fades into the next zone's. */
  sky: string;
}

export const ZONES: readonly Zone[] = [
  { fromM: 0, name: "THE PARK PITCH", sky: "#7ec8f0" },
  { fromM: 10, name: "SUNDAY LEAGUE", sky: "#6ab4e6" },
  { fromM: 25, name: "NON-LEAGUE", sky: "#4f93cf" },
  { fromM: 50, name: "THE CHAMPIONSHIP", sky: "#3a6fae" },
  { fromM: 100, name: "THE PREMIER LEAGUE", sky: "#2a4a86" },
  { fromM: 200, name: "EUROPEAN NIGHTS", sky: "#1b2f63" },
  { fromM: 320, name: "CUP FINAL DAY", sky: "#121f47" },
  { fromM: 450, name: "THE WORLD CUP", sky: "#0b1433" },
  { fromM: 600, name: "THE STARS", sky: "#05081a" },
];

/** Little asides at points along the climb, like signposts. */
export const ASIDES: readonly { atM: number; text: string }[] = [
  { atM: 5, text: "jumpers for goalposts" },
  { atM: 18, text: "oranges at half time" },
  { atM: 38, text: "a proper stand, with a roof" },
  { atM: 75, text: "the floodlights flicker on" },
  { atM: 140, text: "the cameras find you" },
  { atM: 170, text: "your shirt is in the club shop" },
  { atM: 250, text: "the anthem plays" },
  { atM: 290, text: "the away end goes quiet" },
  { atM: 380, text: "ribbons on the trophy" },
  { atM: 420, text: "an open-top bus is booked" },
  { atM: 520, text: "the whole world is watching" },
  { atM: 570, text: "a statue outside the ground" },
  { atM: 650, text: "the transfer window has no ceiling" },
  { atM: 700, text: "the very top of the market" },
];

/** Screen pixels for each £1m of kitty. */
export const PX_PER_MILLION = 12;
/** Height of the whole world in £m: the most a kitty can reach. */
export const TOP_M = 700;
