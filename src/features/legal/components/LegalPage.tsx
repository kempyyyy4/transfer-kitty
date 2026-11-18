import type { ReactNode } from "react";
import { LEGAL } from "@/config/legal";

/** The frame for the privacy policy and terms: title, draft notice and plain body text. */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="flex flex-col gap-4 text-xl leading-snug [&_h2]:mt-2 [&_h2]:font-pixel [&_h2]:text-xs [&_h2]:text-floodlight [&_li]:ml-5 [&_li]:list-disc [&_a]:underline">
      <h1 className="page-title">{title}</h1>
      {LEGAL.isDraft ? (
        <p className="pixel-panel border-claret p-3">
          Draft: this text is being checked before Transfer Kitty launches.
        </p>
      ) : null}
      <p className="text-chalk-dim">Last updated {LEGAL.lastUpdated}.</p>
      {children}
    </article>
  );
}
