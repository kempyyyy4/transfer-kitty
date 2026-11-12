import { TIERS } from "@/config/tiers";
import { formatFee } from "@/features/scoring";

const TOP_TIER = TIERS.reduce((top, tier) => (tier.level > top.level ? tier : top));

export interface ShareInput {
  puzzleNumber: number;
  totalFee: number;
  /** The tier level of each answer, in question order. */
  tierLevels: readonly number[];
}

/**
 * The spoiler-free result to paste anywhere:
 *   🐱 £412m · 2 Galacticats · Transfer Kitty #47
 *   ⬜🟩🦁⬛🟦🟧🦁
 * It shows how well you did, never which answers you gave.
 * The top-tier count is left out when there are none.
 */
export function shareText({ puzzleNumber, totalFee, tierLevels }: ShareInput): string {
  const topCount = tierLevels.filter((level) => level === TOP_TIER.level).length;
  const parts = [`🐱 ${formatFee(totalFee)}`];
  if (topCount > 0) parts.push(`${topCount} ${topCount === 1 ? TOP_TIER.name : TOP_TIER.plural}`);
  parts.push(`Transfer Kitty #${puzzleNumber}`);

  const row = tierLevels
    .map((level) => TIERS.find((tier) => tier.level === level)?.shareEmoji ?? "⬛")
    .join("");
  return `${parts.join(" · ")}\n${row}`;
}
