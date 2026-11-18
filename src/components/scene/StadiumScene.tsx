"use client";

import { usePathname } from "next/navigation";
import { Stands } from "./Stands";

/**
 * The stadium behind every screen: stands and floodlights at the top, the pitch filling
 * the rest. Bright on the home screen; dimmed elsewhere so text stays easy to read.
 * Old-television lines run over the whole scene.
 */
export function StadiumScene() {
  const home = usePathname() === "/";

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <Stands className="absolute inset-x-0 top-0 h-[26vh] w-full" />
      <div className="pitch absolute inset-x-0 top-[26vh] bottom-0">
        <div className="absolute inset-x-0 top-0 h-1 bg-chalk" />
        <div className="absolute top-0 bottom-0 left-1/2 w-1 -translate-x-1/2 bg-chalk/80" />
        <div className="absolute top-[38%] left-1/2 aspect-square w-[46vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-chalk/80" />
        <div className="animate-pitch-sheen absolute inset-0" />
      </div>
      <div
        className={`absolute inset-0 transition-colors duration-500 ${home ? "bg-transparent" : "bg-night/80"}`}
      />
      <div className="scanlines animate-crt-flicker absolute inset-0" />
    </div>
  );
}
