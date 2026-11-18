import Link from "next/link";

/** Links to the policy pages, at the foot of every screen. */
export function SiteFooter() {
  return (
    <footer className="flex justify-center gap-4 px-4 py-2 text-lg text-chalk-dim">
      <Link href="/privacy" className="underline hover:text-chalk">
        Privacy
      </Link>
      <Link href="/terms" className="underline hover:text-chalk">
        Terms
      </Link>
    </footer>
  );
}
