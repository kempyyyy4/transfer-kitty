import { Logo } from "@/components/Logo";
import { Stadium } from "@/components/Stadium";
import { KitMascot } from "@/features/avatar";
import { HomePanel } from "@/features/game";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center">
      <section className="relative isolate flex w-full flex-col items-center overflow-hidden pt-16 pb-6">
        <Stadium className="absolute inset-0 -z-10 h-full w-full" />
        <Logo />
        <KitMascot scale={7} className="mt-4" />
      </section>

      <section className="flex w-full flex-col items-center gap-2 px-4 py-6 text-center">
        <p className="max-w-sm text-xl text-chalk-dim">
          Seven football questions a day. Obvious answers earn pennies. Rare ones earn a fortune.
        </p>
        <HomePanel />
      </section>
    </main>
  );
}
