import type { ArchiveDay, PackSummary } from "./types";

async function call<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) throw new Error("That did not load. Try again.");
  return (await response.json()) as T;
}

export const modesApi = {
  archive: () => call<ArchiveDay[]>("/api/archive"),
  packs: () => call<PackSummary[]>("/api/packs"),
};
