import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Transfer Kitty",
  description: "The daily football trivia game where rare answers earn big transfer fees.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-slate-950 font-mono text-slate-100">
        {children}
      </body>
    </html>
  );
}
