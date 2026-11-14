import type { Metadata } from "next";
import { UnlimitedScreen } from "@/features/modes";

export const metadata: Metadata = { title: "Unlimited | Transfer Kitty" };

export default function UnlimitedPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pt-16 pb-8">
      <UnlimitedScreen />
    </main>
  );
}
