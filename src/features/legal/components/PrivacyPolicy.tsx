import { ANALYTICS } from "@/config/analytics";
import Link from "next/link";
import { ACCOUNT } from "@/config/account";
import { LEGAL } from "@/config/legal";
import { contactEmail, operatorName } from "../contact";
import { LegalPage } from "./LegalPage";

/** Plain-English privacy policy. A draft until checked by someone qualified. */
export function PrivacyPolicy() {
  const signInHours = ACCOUNT.signInWindowSeconds / 3600;
  return (
    <LegalPage title="PRIVACY">
      <h2>WHO WE ARE</h2>
      <p>
        Transfer Kitty is run by {operatorName()}, who is responsible for your data. Write to{" "}
        {contactEmail()} about anything in this policy.
      </p>

      <h2>WHAT WE KEEP</h2>
      <ul>
        <li>
          <strong>When you play without signing in:</strong> a random guest ID, your answers, kitty
          totals and coins. We do not know who you are.
        </li>
        <li>
          <strong>When you sign in:</strong> your email address, the name and avatar you choose,
          your games, streaks, coins, shop items, leagues and what you have bought.
        </li>
        <li>
          <strong>When you buy something:</strong> what you bought, the price and the date. Your
          card details go to Stripe, never to us.
        </li>
        <li>
          <strong>When you report a missing or wrong answer:</strong> the question and the player
          you picked.
        </li>
        <li>
          <strong>To keep the game fair and safe:</strong> your IP address, briefly, to stop anyone
          flooding the game with requests.
        </li>
        <li>
          <strong>To count visits, without cookies:</strong> which pages are viewed and for how
          long, the site that sent you, your country, and the kind of device and browser. We never
          store your IP address or put anything on your device for this. To tell visitors apart
          within one day, we make a code from your IP address and browser mixed with a random value
          that is deleted the next day, so you can&apos;t be followed from one day to another. These
          records are kept for {ANALYTICS.keepDays} days.
        </li>
      </ul>

      <h2>WHY</h2>
      <ul>
        <li>To run the game and your account, and deliver what you buy (our contract with you).</li>
        <li>To stop cheating and abuse (our legitimate interest in a fair game).</li>
        <li>
          To see how the site is used so we can improve it (our legitimate interest), counted
          without cookies.
        </li>
        <li>To keep payment records, as the law requires.</li>
        <li>To show personalised ads to free players, only if you agree.</li>
      </ul>

      <h2>WHAT OTHERS SEE</h2>
      <p>
        Signed-in players appear on Top Kitties and in their leagues by name and avatar, with their
        kitty totals. Your email and answers are never shown to anyone.
      </p>

      <h2>WHO HELPS US</h2>
      <ul>
        <li>Supabase stores the game&apos;s data and handles sign-in, in Frankfurt, Germany.</li>
        <li>Vercel hosts the website.</li>
        <li>Stripe takes payments and keeps its own payment records.</li>
        <li>Google, if you sign in with Google, and for ads shown to free players.</li>
      </ul>

      <h2>COOKIES</h2>
      <ul>
        <li>
          <strong>Needed to work:</strong> cookies that keep you signed in, one that links your
          guest games to your account for {signInHours} hour while you sign in, and one for the
          site&apos;s own admin.
        </li>
        <li>
          <strong>Your settings:</strong> whether sound is on and your Unlimited choices, stored on
          your device.
        </li>
        <li>
          <strong>Ads:</strong> free players may see Google ads on the Results and Top Kitties
          screens. Google asks for your agreement first and you can change your mind at any time.
          Players with the lifetime unlock never see ads.
        </li>
      </ul>

      <h2>HOW LONG</h2>
      <p>
        We keep your account until you delete it. Payment records are kept for as long as tax law
        requires. If you played as a guest and want that removed, write to us.
      </p>

      <h2>YOUR RIGHTS</h2>
      <p>
        You can ask for a copy of your data, ask us to correct it, or object to how we use it. You
        can delete your account yourself on the <Link href="/account">Account</Link> page. If you
        are unhappy with how we handle your data, you can complain to the{" "}
        <a href={LEGAL.regulator.url}>{LEGAL.regulator.name}</a>.
      </p>

      <h2>CHILDREN</h2>
      <p>
        Transfer Kitty is not meant for children under 13. Anyone under 18 needs a parent or
        carer&apos;s permission to buy anything.
      </p>

      <h2>CHANGES</h2>
      <p>If this policy changes, the date at the top changes too.</p>
    </LegalPage>
  );
}
