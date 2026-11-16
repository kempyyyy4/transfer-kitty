import type { Metadata } from "next";
import { PrivacyPolicy } from "@/features/legal";

export const metadata: Metadata = { title: "Privacy | Transfer Kitty" };

export default function PrivacyPage() {
  return (
    <main className="animate-page-in mx-auto flex w-full max-w-2xl flex-1 flex-col gap-1 px-4 pt-16 pb-8">
      <PrivacyPolicy />
    </main>
  );
}
