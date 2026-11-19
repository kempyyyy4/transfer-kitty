import Link from "next/link";
import { COIN_PACKS } from "@/config/coins";
import { LIFETIME_UNLOCK, PACK_PRICE_PENCE } from "@/config/products";
import { contactEmail, operatorName, postalAddress } from "../contact";
import { LegalPage } from "./LegalPage";

const pounds = (pence: number) => `£${(pence / 100).toFixed(2)}`;

/** Plain-English terms of use and sale. A draft until checked by someone qualified. */
export function Terms() {
  return (
    <LegalPage title="TERMS">
      <h2>ABOUT THESE TERMS</h2>
      <p>
        Transfer Kitty is run by {operatorName()}, {postalAddress()}. By playing you agree to these
        terms. Write to {contactEmail()} with any question. They do not affect your legal rights as
        a consumer.
      </p>

      <h2>PLAYING FAIRLY</h2>
      <ul>
        <li>One daily attempt each. No bots, scripts or extra accounts to get round that.</li>
        <li>Pick a name that is not offensive and does not pretend to be someone else.</li>
        <li>We may change a name or close an account that breaks these rules.</li>
      </ul>

      <h2>THE QUESTIONS</h2>
      <p>
        Questions and answers come from public football data and can contain mistakes. If a right
        answer is missing, report it after your round and we will check it. Transfer Kitty is not
        connected to any club, league, competition or player. Names are used only to ask questions
        about football. Club, league and competition names are trade marks of their owners. The
        kitties are cartoon cats, not pictures of real people.
      </p>
      <p>
        Football data comes from Transfermarkt, through the open transfermarkt-datasets project, and
        from Wikidata.
      </p>

      <h2>KITTY MONEY</h2>
      <p>
        The pounds in your kitty are a score, not real money. They cannot be paid out, bought or
        swapped for anything.
      </p>

      <h2>WHAT YOU CAN BUY</h2>
      <ul>
        <li>
          <strong>Lifetime unlock, {pounds(LIFETIME_UNLOCK.pricePence)} once:</strong> Unlimited,
          Archive, Nine Lives and no ads, for as long as Transfer Kitty runs.
        </li>
        <li>
          <strong>Themed packs, {pounds(PACK_PRICE_PENCE)} each:</strong> rounds from that pack, for
          as long as Transfer Kitty runs.
        </li>
        <li>
          <strong>Coin packs</strong> (
          {COIN_PACKS.map((pack) => `${pack.coins} for ${pounds(pack.pricePence)}`).join(", ")}):
          coins to spend in the shop. Coins have no cash value and cannot be exchanged, sold or
          moved to another account.
        </li>
        <li>
          Everything is a direct purchase. You always see exactly what you get. There are no random
          packs or mystery items.
        </li>
      </ul>
      <p>
        Prices include any VAT. Purchases need a signed-in account, so they come back whenever you
        sign in. Payments are taken by Stripe.
      </p>

      <h2>YOUR RIGHT TO CANCEL</h2>
      <p>
        What you buy is digital and starts straight away. When you buy, you ask for that, and you
        accept that you lose the usual 14-day right to cancel once it has started. If something you
        bought does not work, write to us and we will put it right or refund you.
      </p>

      <h2>IF SOMETHING GOES WRONG</h2>
      <p>
        We are responsible for loss we cause by breaking these terms or by not taking reasonable
        care, where that loss was foreseeable. We are not responsible for loss we could not have
        foreseen, or for business losses: Transfer Kitty is for personal fun. Nothing here limits
        what the law does not let us limit, such as our responsibility for death or injury caused by
        negligence, or for fraud, or your rights for digital content that is faulty.
      </p>

      <h2>CHANGES AND AVAILABILITY</h2>
      <p>
        We may change or improve the game. We will try to keep it running, but cannot promise it
        will always be available. If Transfer Kitty ever closes, we will give notice on the site
        first.
      </p>

      <h2>DELETING YOUR ACCOUNT</h2>
      <p>
        You can delete your account on the <Link href="/account">Account</Link> page. That also
        removes anything you bought, and cannot be undone.
      </p>

      <h2>THE LAW</h2>
      <p>These terms are governed by the law of England and Wales.</p>
    </LegalPage>
  );
}
