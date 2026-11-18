"use client";

import { track } from "@/features/analytics";
import { setSoundOn, useSoundOn } from "./sound-setting";

/** The speaker button, top right of every screen. Sound starts off. */
export function SoundToggle() {
  const on = useSoundOn();
  return (
    <button
      type="button"
      onClick={() => {
        if (!on) track("sound_on");
        setSoundOn(!on);
      }}
      aria-pressed={on}
      aria-label={on ? "Sound is on. Turn sound off" : "Sound is off. Turn sound on"}
      className="pixel-button fixed top-[max(0.75rem,env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))] z-50 px-3 py-2 text-[10px]"
    >
      {on ? "SOUND ON" : "SOUND OFF"}
    </button>
  );
}
