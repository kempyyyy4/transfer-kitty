/**
 * Creates daily puzzles from today to the scheduling horizon, in the Supabase project
 * named in .env.local. The live site does this itself on a schedule; this is for setting
 * up a database by hand. Safe to re-run: days that already have a puzzle are left alone.
 */
import { DAILY_PUZZLE } from "@/config/game";
import { scheduleDailyPuzzles } from "@/features/questions";
import { ukDayOf } from "@/lib/time/uk-day";

const today = ukDayOf(new Date());
const created = await scheduleDailyPuzzles(today);

console.log(
  created.length > 0
    ? `Created ${created.length} puzzles: ${created[0]} to ${created.at(-1)}`
    : `Nothing to do: every day for the next ${DAILY_PUZZLE.daysScheduledAhead} days has a puzzle.`,
);
