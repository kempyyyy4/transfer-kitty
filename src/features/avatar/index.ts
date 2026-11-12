// Safe for browser code: everything here is drawing, with no server access.
export type { Accessory, CatLook, EarShape, KitPattern, Markings } from "./cat/look";
export {
  avatarChoiceSchema,
  checkChoice,
  DEFAULT_CHOICE,
  lookFor,
  parseStoredChoice,
  type AvatarChoice,
  type ChoiceProblem,
} from "./avatar-choice";
export { KIT_MASCOT, TIER_SPRITES } from "./cast";
export { CatSprite, KitMascot, TierSprite } from "./components/CatSprite";
export { PixelSprite } from "./components/PixelSprite";
