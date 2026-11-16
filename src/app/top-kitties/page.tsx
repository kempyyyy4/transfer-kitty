import type { Metadata } from "next";
import { TopKittiesScreen } from "@/features/leaderboard";

export const metadata: Metadata = { title: "Top Kitties | Transfer Kitty" };

export default function TopKittiesPage() {
  return (
    <main className="animate-page-in mx-auto flex w-full max-w-xl flex-1 flex-col gap-1 px-4 pt-16 pb-8">
      <TopKittiesScreen />
    </main>
  );
}
