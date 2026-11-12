// Safe for browser code: everything here is drawing, with no server access.
export type { Accessory, CatLook, EarShape, KitPattern, Markings } from "./cat/look";
export {
  avatarChoiceSchema,
  cataloguePrice,
  checkChoice,
  DEFAULT_CHOICE,
  freeOrOwned,
  ITEM_SLOTS,
  itemKey,
  lookFor,
  parseStoredChoice,
  type AvatarChoice,
  type ChoiceProblem,
  type ItemSlot,
} from "./avatar-choice";
export { KIT_MASCOT, TIER_SPRITES } from "./cast";
export { CatSprite, KitMascot, TierSprite } from "./components/CatSprite";
export { PixelSprite } from "./components/PixelSprite";
