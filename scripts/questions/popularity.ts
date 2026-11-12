import { INVOLVEMENT_FLOOR } from "@/config/fame";

/**
 * How likely players are to give this answer, before any real answers exist.
 * It is the player's fame, scaled down when they barely featured in what the question
 * asks about. `involvement` runs from 0 (barely) to 1 (fully).
 */
export function startingPopularity(fame: number, involvement: number): number {
  const clamped = Math.min(1, Math.max(0, involvement));
  return fame * (INVOLVEMENT_FLOOR + (1 - INVOLVEMENT_FLOOR) * clamped);
}
