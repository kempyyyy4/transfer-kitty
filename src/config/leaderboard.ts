/** Top Kitties and friends leagues. */
export const LEADERBOARD = {
  /** How many rows a board shows. Your own rank is always shown as well. */
  entriesShown: 50,
  /**
   * Whether guests appear by name on the boards. PLAN.md decision 1.5 says only signed-in
   * players are named, because a guest can clear their browser and play again. Sign-up
   * arrives in stage 7; until then guests are shown so the boards can be tried out.
   * Guests always see their own rank either way.
   */
  includeGuests: true,
} as const;

export const LEAGUES = {
  maxPerPlayer: 10,
  maxMembers: 500,
  nameMinLength: 3,
  nameMaxLength: 30,
  inviteCodeLength: 6,
  /** No 0/O, 1/I/L, so a code read aloud or copied by hand cannot be misread. */
  inviteCodeAlphabet: "ABCDEFGHJKMNPQRSTUVWXYZ23456789",
} as const;
