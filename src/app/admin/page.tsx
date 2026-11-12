import type { Metadata } from "next";
import { AdminScreen } from "@/features/admin";

export const metadata: Metadata = {
  title: "Admin | Transfer Kitty",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pt-16 pb-8">
      <AdminScreen />
    </main>
  );
}
