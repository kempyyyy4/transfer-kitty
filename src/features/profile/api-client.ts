import type { AvatarChoice } from "@/features/avatar";
import type { Profile } from "./types";

/** An error the server explained, with a message fit to show the player. */
export class ProfileApiError extends Error {}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
        ? body.error
        : "Something went wrong. Try again.";
    throw new ProfileApiError(message);
  }
  return (await response.json()) as T;
}

export const profileApi = {
  profile: () => call<Profile>("/api/profile"),
  saveAvatar: (avatar: AvatarChoice) =>
    call<{ saved: true }>("/api/profile/avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(avatar),
    }),
};
