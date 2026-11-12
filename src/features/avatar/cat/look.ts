/** Everything that makes one cat footballer look different from another. */

export type KitPattern = "plain" | "stripes" | "hoops" | "halves" | "sash";
export type EarShape = "pointy" | "folded" | "torn";
export type Markings = "none" | "tabby" | "tuxedo";

export type Accessory =
  | "sunglasses"
  | "headband"
  | "sweatbands"
  | "captainsArmband"
  | "gloves"
  | "quiff"
  | "binBag"
  | "mirror"
  | "mud";

export interface KitColours {
  primary: string;
  secondary: string;
  pattern: KitPattern;
  shorts: string;
}

export interface CatLook {
  fur: string;
  furShade: string;
  /** Muzzle, chest and paw markings. */
  muzzle: string;
  eyes: string;
  ears: EarShape;
  markings: Markings;
  kit: KitColours;
  boots: string;
  /** A lion's mane, drawn behind the head. */
  mane?: { main: string; shade: string };
  accessories: readonly Accessory[];
}
