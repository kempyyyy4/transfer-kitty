import type { Metadata } from "next";
import { AccountScreen } from "@/features/account";

export const metadata: Metadata = { title: "Account | Transfer Kitty" };

export default function AccountPage() {
  return (
    <main className="animate-page-in mx-auto flex w-full max-w-xl flex-1 flex-col gap-1 px-4 pt-16 pb-8">
      <AccountScreen />
    </main>
  );
}
