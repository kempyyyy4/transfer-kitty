import type { Metadata } from "next";
import { PurchaseScreen } from "@/features/payments";

export const metadata: Metadata = { title: "Thank you | Transfer Kitty" };

export default function PurchasePage() {
  return (
    <main className="animate-page-in mx-auto flex w-full max-w-2xl flex-1 flex-col gap-1 px-4 pt-16 pb-8">
      <PurchaseScreen />
    </main>
  );
}
