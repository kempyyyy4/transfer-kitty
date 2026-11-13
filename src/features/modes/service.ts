import "server-only";
import { getArchiveDays, getLivePacks, type ArchiveDay, type LivePack } from "@/lib/db";
import { ukDayOf } from "@/lib/time/uk-day";

/** Every past daily puzzle, newest first, marked with whether the visitor played it. */
export function listArchive(userId: string | null, now: Date): Promise<ArchiveDay[]> {
  return getArchiveDays(userId, ukDayOf(now));
}

/** Packs on sale. */
export function listPacks(): Promise<LivePack[]> {
  return getLivePacks();
}
