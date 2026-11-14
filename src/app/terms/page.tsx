import type { Metadata } from "next";
import { Terms } from "@/features/legal";

export const metadata: Metadata = { title: "Terms | Transfer Kitty" };

export default function TermsPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pt-16 pb-8">
      <Terms />
    </main>
  );
}
