import Link from "next/link";

/** Shown to a guest who has a rank but is left off the board until they sign in. */
export function SignInToAppear() {
  return (
    <p className="border-2 border-amber-400 p-3 text-sm">
      Guests are not shown on Top Kitties.{" "}
      <Link href="/account" className="font-bold underline">
        Sign in
      </Link>{" "}
      to appear under your own name. Your games so far come with you.
    </p>
  );
}
