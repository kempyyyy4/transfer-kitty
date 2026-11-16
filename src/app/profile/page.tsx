import type { Metadata } from "next";
import { ProfileScreen } from "@/features/profile";

export const metadata: Metadata = { title: "Profile | Transfer Kitty" };

export default function ProfilePage() {
  return (
    <main className="animate-page-in mx-auto flex w-full max-w-xl flex-1 flex-col gap-1 px-4 pt-16 pb-8">
      <ProfileScreen />
    </main>
  );
}
