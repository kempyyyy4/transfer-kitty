/**
 * Recalculates tiers from real answers in the Supabase project named in .env.local.
 * The live site does this every night; this is for running it by hand.
 */
import { recalculateDueTiers } from "@/features/scoring/recalculation-job";
import { ukDayOf } from "@/lib/time/uk-day";

const count = await recalculateDueTiers(ukDayOf(new Date()));
console.log(`Recalculated tiers for ${count} questions.`);
