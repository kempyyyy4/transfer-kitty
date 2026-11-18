import { Logo } from "@/components/Logo";
import { KittyLineup } from "@/features/avatar";
import { HomePanel } from "@/features/game";

/** The home screen: the title, the team, the kick-off button. Everything else is in the menu. */
export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-between gap-[2vh] px-4 pt-[max(4rem,8vh)] pb-[1vh]">
      <Logo />
      <div className="flex w-full flex-col items-center gap-[2.5vh]">
        <KittyLineup />
        <HomePanel />
        <p className="max-w-sm text-center text-lg leading-snug text-chalk drop-shadow-[2px_2px_0_#000]">
          Seven football questions a day. Obvious answers earn pennies. Rare ones earn a fortune.
        </p>
      </div>
    </main>
  );
}
