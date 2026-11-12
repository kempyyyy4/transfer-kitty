import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import { SoundToggle } from "@/features/audio";
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
        <SoundToggle />
        {children}
      </body>
    </html>
  );
}
