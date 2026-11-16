import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import { StadiumScene } from "@/components/scene/StadiumScene";
import { SiteMenu } from "@/components/SiteMenu";
import { SoundToggle } from "@/features/audio";
import { SiteFooter } from "@/features/legal";
import "./globals.css";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press-start",
});

const bodyFont = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-vt323",
});

export const metadata: Metadata = {
  title: "Transfer Kitty",
  description: "The daily football trivia game where rare answers earn big transfer fees.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full ${pixelFont.variable} ${bodyFont.variable}`}>
      <body className="flex min-h-full flex-col font-mono">
        <StadiumScene />
        {/* A soft fade behind the menu and sound buttons, so scrolled text slips under cleanly. */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 z-40 h-16 bg-gradient-to-b from-night-deep to-transparent"
        />
        <SiteMenu />
        <SoundToggle />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
