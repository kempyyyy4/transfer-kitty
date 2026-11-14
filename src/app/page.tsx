import { Logo } from "@/components/Logo";
import { KittyLineup } from "@/features/avatar";
import { HomePanel } from "@/features/game";

/** The home screen: the title, the team, the kick-off button. Everything else is in the menu. */
export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-between gap-6 px-4 pt-[9vh] pb-4">
      <Logo />
      <div className="flex w-full flex-col items-center gap-6">
        <KittyLineup />
        <HomePanel />
        <p className="max-w-sm text-center text-xl text-chalk drop-shadow-[2px_2px_0_#000]">
          Seven football questions a day. Obvious answers earn pennies. Rare ones earn a fortune.
        </p>
      </div>
    </main>
  );
}
