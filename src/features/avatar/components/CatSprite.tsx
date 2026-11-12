import { buildCat } from "../cat/build-cat";
import type { CatLook } from "../cat/look";
import { KIT_MASCOT, TIER_SPRITES } from "../cast";
import { PixelSprite } from "./PixelSprite";

interface Props {
  look: CatLook;
  label: string;
  scale?: number;
  className?: string;
}

export function CatSprite({ look, label, scale, className }: Props) {
  return <PixelSprite grid={buildCat(look)} label={label} scale={scale} className={className} />;
}

/** Kit, the mascot. */
export function KitMascot({ scale, className }: { scale?: number; className?: string }) {
  return (
    <CatSprite
      look={KIT_MASCOT}
      label="Kit, the Transfer Kitty mascot"
      scale={scale}
      className={className}
    />
  );
}

/** The character for a tier, by the spriteKey in src/config/tiers.ts. */
export function TierSprite({
  spriteKey,
  label,
  scale,
  className,
}: {
  spriteKey: string;
  label: string;
  scale?: number;
  className?: string;
}) {
  const look = TIER_SPRITES[spriteKey];
  if (!look) return null;
  return <CatSprite look={look} label={label} scale={scale} className={className} />;
}
