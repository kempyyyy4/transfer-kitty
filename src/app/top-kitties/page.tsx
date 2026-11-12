import type { Metadata } from "next";
import { TopKittiesScreen } from "@/features/leaderboard";

export const metadata: Metadata = { title: "Top Kitties | Transfer Kitty" };

export default function TopKittiesPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col p-6">
      <TopKittiesScreen />
    </main>
  );
}
