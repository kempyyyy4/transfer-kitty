import type { Metadata } from "next";
import { AnalyticsScreen } from "@/features/analytics";

export const metadata: Metadata = {
  title: "Analytics | Transfer Kitty",
  robots: { index: false, follow: false },
};

/** The site dashboard. Wider than other pages, for its charts. Admin only. */
export default function AnalyticsPage() {
  return (
    <main className="animate-page-in mx-auto flex w-full max-w-6xl flex-1 flex-col gap-1 px-4 pt-16 pb-8">
      <AnalyticsScreen />
    </main>
  );
}
