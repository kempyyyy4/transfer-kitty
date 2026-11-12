import type { KitPattern } from "@/features/avatar";

/**
 * Kits players can wear. Inspired by club colours, with made-up names and no crests,
 * badges, sponsors or real club names. priceCoins 0 means free for everyone; priced kits
 * are bought in the shop (stage 11).
 */
export interface Kit {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  pattern: KitPattern;
  shorts: string;
  priceCoins: number;
}

export const KITS: readonly Kit[] = [
  {
    id: "kitty-teal",
    name: "Kitty Teal",
    primary: "#13a39a",
    secondary: "#f5c518",
    pattern: "sash",
    shorts: "#0d3b4f",
    priceCoins: 0,
  },
  {
    id: "plain-white",
    name: "Plain White",
    primary: "#f2f4ff",
    secondary: "#a9b0d6",
    pattern: "plain",
    shorts: "#1a1a1a",
    priceCoins: 0,
  },
  {
    id: "midnight-navy",
    name: "Midnight Navy",
    primary: "#1c2a5c",
    secondary: "#f2f4ff",
    pattern: "plain",
    shorts: "#f2f4ff",
    priceCoins: 0,
  },
  {
    id: "merseyside-red",
    name: "Merseyside Red",
    primary: "#c8102e",
    secondary: "#f2f4ff",
    pattern: "plain",
    shorts: "#c8102e",
    priceCoins: 300,
  },
  {
    id: "sky-blue-mancs",
    name: "Sky Blue Mancs",
    primary: "#6cabdd",
    secondary: "#f2f4ff",
    pattern: "plain",
    shorts: "#f2f4ff",
    priceCoins: 300,
  },
  {
    id: "claret-and-blue",
    name: "Claret & Blue",
    primary: "#7a1f3d",
    secondary: "#8fc8ef",
    pattern: "halves",
    shorts: "#f2f4ff",
    priceCoins: 300,
  },
  {
    id: "black-and-white-stripes",
    name: "Black & White Stripes",
    primary: "#f2f4ff",
    secondary: "#1a1a1a",
    pattern: "stripes",
    shorts: "#1a1a1a",
    priceCoins: 300,
  },
  {
    id: "green-and-white-hoops",
    name: "Green & White Hoops",
    primary: "#1f8a3a",
    secondary: "#f2f4ff",
    pattern: "hoops",
    shorts: "#f2f4ff",
    priceCoins: 300,
  },
  {
    id: "gold-sash",
    name: "Gold Sash",
    primary: "#1a1a1a",
    secondary: "#f5c518",
    pattern: "sash",
    shorts: "#1a1a1a",
    priceCoins: 500,
  },
];
