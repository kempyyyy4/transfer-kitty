import type { Metadata } from "next";
import { ArchiveScreen } from "@/features/modes";

export const metadata: Metadata = { title: "Archive | Transfer Kitty" };

export default function ArchivePage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pt-16 pb-8">
      <ArchiveScreen />
    </main>
  );
}
