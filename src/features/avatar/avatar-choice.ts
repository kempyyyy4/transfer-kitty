import { z } from "zod";
import {
  ACCESSORIES,
  BOOTS,
  BREEDS,
  DEFAULT_AVATAR,
  EYES,
  FURS,
  MAX_ACCESSORIES,
} from "@/config/avatar-items";
import { KITS } from "@/config/kits";
import type { CatLook } from "./cat/look";

/** A player's avatar as stored: one item ID per slot. */
export const avatarChoiceSchema = z.object({
  fur: z.string().max(40),
  breed: z.string().max(40),
  eyes: z.string().max(40),
  boots: z.string().max(40),
  kit: z.string().max(40),
  accessories: z.array(z.string().max(40)).max(MAX_ACCESSORIES),
});

export type AvatarChoice = z.infer<typeof avatarChoiceSchema>;

export const DEFAULT_CHOICE: AvatarChoice = DEFAULT_AVATAR;

/** Every item a choice names, with the slot it fills and its price. */
function itemsIn(choice: AvatarChoice) {
  return [
    FURS.find((item) => item.id === choice.fur),
    BREEDS.find((item) => item.id === choice.breed),
    EYES.find((item) => item.id === choice.eyes),
    BOOTS.find((item) => item.id === choice.boots),
    KITS.find((item) => item.id === choice.kit),
    ...choice.accessories.map((id) => ACCESSORIES.find((item) => item.id === id)),
  ];
}

export type ChoiceProblem = "unknown_item" | "not_owned" | "repeated_accessory";

/**
 * Whether a player may wear this choice. `owned` holds IDs of priced items they have
 * bought; free items need no owning. Returns the first problem found, or null.
 */
export function checkChoice(
  choice: AvatarChoice,
  owned: ReadonlySet<string>,
): ChoiceProblem | null {
  if (new Set(choice.accessories).size !== choice.accessories.length) return "repeated_accessory";

  for (const item of itemsIn(choice)) {
    if (!item) return "unknown_item";
    if (item.priceCoins > 0 && !owned.has(item.id)) return "not_owned";
  }
  return null;
}

/**
 * The cat to draw for a stored choice. Anything unrecognised, such as an item later
 * removed from the catalogue, falls back to the default for that slot.
 */
export function lookFor(choice: AvatarChoice): CatLook {
  const pick = <T extends { id: string }>(list: readonly T[], id: string, fallback: string): T => {
    const found = list.find((item) => item.id === id) ?? list.find((item) => item.id === fallback);
    if (!found) throw new Error(`Default avatar item "${fallback}" is missing from the catalogue`);
    return found;
  };

  const fur = pick(FURS, choice.fur, DEFAULT_CHOICE.fur);
  const breed = pick(BREEDS, choice.breed, DEFAULT_CHOICE.breed);
  const kit = pick(KITS, choice.kit, DEFAULT_CHOICE.kit);

  return {
    fur: fur.fur,
    furShade: fur.furShade,
    muzzle: fur.muzzle,
    eyes: pick(EYES, choice.eyes, DEFAULT_CHOICE.eyes).colour,
    ears: breed.ears,
    markings: breed.markings,
    kit: {
      primary: kit.primary,
      secondary: kit.secondary,
      pattern: kit.pattern,
      shorts: kit.shorts,
    },
    boots: pick(BOOTS, choice.boots, DEFAULT_CHOICE.boots).colour,
    accessories: choice.accessories.flatMap((id) => {
      const option = ACCESSORIES.find((item) => item.id === id);
      return option ? [option.accessory] : [];
    }),
  };
}

/** Reads a stored avatar, or gives the default if there is none or it is damaged. */
export function parseStoredChoice(stored: unknown): AvatarChoice {
  const parsed = avatarChoiceSchema.safeParse(stored);
  return parsed.success ? parsed.data : DEFAULT_CHOICE;
}
