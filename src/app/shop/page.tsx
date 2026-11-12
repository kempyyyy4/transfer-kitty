import type { Metadata } from "next";
import { ShopScreen } from "@/features/shop";

export const metadata: Metadata = { title: "Shop | Transfer Kitty" };

export default function ShopPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pt-16 pb-8">
      <ShopScreen />
    </main>
  );
}
