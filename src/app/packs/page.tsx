import type { Metadata } from "next";
import { PacksScreen } from "@/features/modes";

export const metadata: Metadata = { title: "Themed packs | Transfer Kitty" };

export default function PacksPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pt-16 pb-8">
      <PacksScreen />
    </main>
  );
}
