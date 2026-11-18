import type { Metadata } from "next";
import { UnlimitedScreen } from "@/features/modes";

export const metadata: Metadata = { title: "Unlimited | Transfer Kitty" };

export default function UnlimitedPage() {
  return (
    <main className="animate-page-in mx-auto flex w-full max-w-2xl flex-1 flex-col gap-1 px-4 pt-16 pb-8">
      <UnlimitedScreen />
    </main>
  );
}
