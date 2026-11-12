import type { Accessory, EarShape, Markings } from "@/features/avatar";

/**
 * Everything a player can choose for their cat footballer, apart from kits (in kits.ts).
 * priceCoins 0 means free for everyone; priced items are bought in the shop (stage 11).
 * IDs are stored with each player's avatar, so never rename one once players can pick it.
 */
interface Item {
  id: string;
  label: string;
  priceCoins: number;
}

export interface FurOption extends Item {
  fur: string;
  furShade: string;
  muzzle: string;
}

export interface BreedOption extends Item {
  ears: EarShape;
  markings: Markings;
}

export interface ColourOption extends Item {
  colour: string;
}

export interface AccessoryOption extends Item {
  accessory: Accessory;
}

export const FURS: readonly FurOption[] = [
  {
    id: "smoky-blue",
    label: "Smoky blue",
    fur: "#5f7a99",
    furShade: "#485e78",
    muzzle: "#e9eef5",
    priceCoins: 0,
  },
  {
    id: "ginger",
    label: "Ginger",
    fur: "#c96f3b",
    furShade: "#9e5229",
    muzzle: "#f0d9c4",
    priceCoins: 0,
  },
  {
    id: "black",
    label: "Black",
    fur: "#2b2b33",
    furShade: "#1f1f26",
    muzzle: "#f2f2f2",
    priceCoins: 0,
  },
  {
    id: "grey",
    label: "Grey",
    fur: "#8d8d8d",
    furShade: "#6e6e6e",
    muzzle: "#e0e0e0",
    priceCoins: 0,
  },
  {
    id: "brown",
    label: "Brown",
    fur: "#9c7a55",
    furShade: "#6f5236",
    muzzle: "#e8d8c0",
    priceCoins: 0,
  },
  {
    id: "cream",
    label: "Cream",
    fur: "#e7d3a8",
    furShade: "#c4a974",
    muzzle: "#fff6e3",
    priceCoins: 150,
  },
  {
    id: "snow",
    label: "Snow white",
    fur: "#ecebe6",
    furShade: "#c9c6bb",
    muzzle: "#ffffff",
    priceCoins: 150,
  },
  {
    id: "golden",
    label: "Golden",
    fur: "#d9a441",
    furShade: "#b8832b",
    muzzle: "#f3dfb0",
    priceCoins: 250,
  },
];

export const BREEDS: readonly BreedOption[] = [
  { id: "classic", label: "Classic", ears: "pointy", markings: "none", priceCoins: 0 },
  { id: "tabby", label: "Tabby", ears: "pointy", markings: "tabby", priceCoins: 0 },
  { id: "tuxedo", label: "Tuxedo", ears: "pointy", markings: "tuxedo", priceCoins: 0 },
  { id: "fold", label: "Folded ears", ears: "folded", markings: "none", priceCoins: 150 },
  { id: "street", label: "Street fighter", ears: "torn", markings: "none", priceCoins: 150 },
];

export const EYES: readonly ColourOption[] = [
  { id: "green", label: "Green", colour: "#3fd17a", priceCoins: 0 },
  { id: "yellow", label: "Yellow", colour: "#f5c518", priceCoins: 0 },
  { id: "blue", label: "Blue", colour: "#4a8cff", priceCoins: 0 },
  { id: "amber", label: "Amber", colour: "#e8a21c", priceCoins: 0 },
  { id: "violet", label: "Violet", colour: "#b07cff", priceCoins: 100 },
];

export const BOOTS: readonly ColourOption[] = [
  { id: "black", label: "Black", colour: "#1a1a1a", priceCoins: 0 },
  { id: "white", label: "White", colour: "#f2f4ff", priceCoins: 0 },
  { id: "red", label: "Red", colour: "#e23d3d", priceCoins: 0 },
  { id: "pink", label: "Hot pink", colour: "#ff4fa3", priceCoins: 150 },
  { id: "gold", label: "Gold", colour: "#f5c518", priceCoins: 400 },
];

export const ACCESSORIES: readonly AccessoryOption[] = [
  { id: "headband", label: "Headband", accessory: "headband", priceCoins: 0 },
  { id: "sweatbands", label: "Sweatbands", accessory: "sweatbands", priceCoins: 0 },
  {
    id: "captains-armband",
    label: "Captain's armband",
    accessory: "captainsArmband",
    priceCoins: 200,
  },
  { id: "gloves", label: "Keeper's gloves", accessory: "gloves", priceCoins: 200 },
  { id: "sunglasses", label: "Sunglasses", accessory: "sunglasses", priceCoins: 300 },
];

/** A player can wear this many accessories at once. */
export const MAX_ACCESSORIES = 2;

/** What every player starts with. Every item here must be free. */
export const DEFAULT_AVATAR = {
  fur: "smoky-blue",
  breed: "classic",
  eyes: "green",
  boots: "black",
  kit: "kitty-teal",
  accessories: [] as string[],
};
