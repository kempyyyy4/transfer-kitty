import type { Metadata } from "next";
import { PurchaseScreen } from "@/features/payments";

export const metadata: Metadata = { title: "Thank you | Transfer Kitty" };

export default function PurchasePage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pt-16 pb-8">
      <PurchaseScreen />
    </main>
  );
}
