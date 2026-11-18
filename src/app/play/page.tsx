import type { Metadata } from "next";
import { GameScreen } from "@/features/game";

export const metadata: Metadata = { title: "Play | Transfer Kitty" };

export default function PlayPage() {
  return (
    <main className="animate-page-in mx-auto flex w-full max-w-2xl flex-1 flex-col gap-1 px-4 pt-16 pb-8">
      <GameScreen />
    </main>
  );
}
