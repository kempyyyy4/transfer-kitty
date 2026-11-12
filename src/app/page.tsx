import { HomePanel } from "@/features/game";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-3xl font-bold">Transfer Kitty</h1>
      <p>Seven football questions a day. Rare answers earn big fees.</p>
      <HomePanel />
    </main>
  );
}
