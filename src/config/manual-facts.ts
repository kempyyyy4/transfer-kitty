/**
 * Facts that do not come from the game's data sources. Every one is listed in
 * QUESTIONS_TO_CHECK.md for Tom to verify before launch.
 */

export interface TransferMilestone {
  /** The fee in pounds, as reported in the UK at the time. */
  feeGbp: number;
  /** Short enough to sit beside the kitty gauge. */
  label: string;
  detail: string;
}

/** Marks on the kitty gauge: a kitty that passes one could have paid that fee. */
export const TRANSFER_MILESTONES: readonly TransferMilestone[] = [
  {
    feeGbp: 15_000_000,
    label: "SHEARER '96",
    detail: "Alan Shearer, Blackburn Rovers to Newcastle United, 1996: a world record then",
  },
  {
    feeGbp: 80_000_000,
    label: "RONALDO '09",
    detail: "Cristiano Ronaldo, Manchester United to Real Madrid, 2009: a world record then",
  },
  {
    feeGbp: 125_000_000,
    label: "ISAK '25",
    detail: "Alexander Isak, Newcastle United to Liverpool, 2025: the British record",
  },
  {
    feeGbp: 198_000_000,
    label: "NEYMAR '17",
    detail: "Neymar, Barcelona to Paris Saint-Germain, 2017: the world record (EUR 222m)",
  },
];
