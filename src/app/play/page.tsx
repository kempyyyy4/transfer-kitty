import type { Metadata } from "next";
import { GameScreen } from "@/features/game";

export const metadata: Metadata = { title: "Play | Transfer Kitty" };

export default function PlayPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col p-6">
      <GameScreen />
    </main>
  );
}
