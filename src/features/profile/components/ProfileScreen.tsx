"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader } from "@/components/Loader";
import { CatSprite, lookFor } from "@/features/avatar";
import { profileApi } from "../api-client";
import type { Profile } from "../types";
import { AvatarBuilder } from "./AvatarBuilder";
import { HistoryCalendar } from "./HistoryCalendar";
import { StatsPanel } from "./StatsPanel";

/** Your avatar, streaks, averages and history calendar. */
export function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    profileApi
      .profile()
      .then(setProfile)
      .catch(() => setFailed(true));
  }, []);

  if (failed) return <p role="alert">Could not load your profile. Try again.</p>;
  if (!profile) return <Loader />;

  return (
    <section className="flex flex-col gap-6">
      <h1 className="font-pixel text-lg leading-relaxed text-floodlight">
        {profile.displayName ? profile.displayName.toUpperCase() : "YOUR PROFILE"}
      </h1>

      <StatsPanel stats={profile.stats} />
      <HistoryCalendar history={profile.history} today={profile.today} />

      {profile.status === "signed_in" && profile.displayName ? (
        <AvatarBuilder initial={profile.avatar} wearable={profile.wearable} />
      ) : (
        <AvatarTeaser profile={profile} />
      )}

      <Link href="/" className="pixel-button px-4 py-3 text-xs">
        BACK TO HOME
      </Link>
    </section>
  );
}

/** For guests, and players without a name: what an avatar is and how to get one. */
function AvatarTeaser({ profile }: { profile: Profile }) {
  const needsName = profile.status === "signed_in";
  return (
    <div className="pixel-panel flex items-center gap-4 p-4">
      <CatSprite look={lookFor(profile.avatar)} label="The default avatar" scale={3} />
      <p className="text-lg">
        {needsName ? "Choose your name on the " : ""}
        <Link href="/account" className="font-pixel text-[10px] text-floodlight underline">
          {needsName ? "ACCOUNT PAGE" : "SIGN IN"}
        </Link>
        {needsName
          ? " first, then build your cat footballer here."
          : " to build your own cat footballer and show it on Top Kitties."}
      </p>
    </div>
  );
}
