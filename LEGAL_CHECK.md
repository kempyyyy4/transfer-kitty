# Legal check before launch

Done by Claude on 19 November 2026. **I am not a lawyer, and no check can promise you
won't be sued.** This finds the risks, fixes what code can fix, and narrows what a
qualified person needs to look at, so a short paid review covers it instead of a long one.
UK law throughout (England and Wales).

## Fixed in the code

| What                                        | Why                                                                                                                                                                                                                                               |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tick box before every BUY                   | To lose the 14-day right to cancel, a buyer must actively agree (Consumer Contracts Regulations 2013, reg. 37). A line of small print wasn't enough. Without it, anyone could ask for a refund within 14 days, even after using what they bought. |
| The same notice next to Stripe's Pay button | Repeats that agreement at the moment of payment.                                                                                                                                                                                                  |
| IP addresses deleted after a day            | Sign-in limits stored IP addresses with no clean-up, but the privacy policy says "briefly". The nightly job now deletes them (it removed 115 old rows from dev).                                                                                  |
| Postal address in the terms                 | Anyone selling online must give a geographic address. There's now a slot for it in `src/config/legal.ts`.                                                                                                                                         |
| "If something goes wrong" section           | A standard UK consumer liability clause. It limits only what the law allows.                                                                                                                                                                      |
| Kitty money isn't real money                | Makes clear the kitty pounds are a score, not money or a prize, so nothing reads as gambling.                                                                                                                                                     |
| Trade mark and data credits                 | Club and competition names belong to their owners; the kitties are cartoon cats; the data sources are named.                                                                                                                                      |
| Data sent to the US                         | The privacy policy now says Vercel, Stripe and Google may handle data in the US, under the safeguards UK law requires.                                                                                                                            |

## Tom's decisions (19 November 2026)

- **No solicitor review** for now, and no request to Transfermarkt. Tom accepts the risks in 1
  and 2 below, knowing the likeliest outcome is a request to stop, and that switching to
  Wikidata only would take several days.
- **The team photo stays** as close likenesses (risk 2).
- **Ads are never personalised**, for anyone, which covers the Children's Code point (risk 4).
  Done in `src/features/ads/AdSlot.tsx` and the privacy policy.

## The real risks, biggest first

### 1. The Transfermarkt data (biggest risk)

The game is built on Transfermarkt data, taken from an open project that publishes it
under a CC0 licence. That licence covers the project's own work, but **Transfermarkt never
gave permission for its data to be reused**, and in the UK a database can be protected by
"database right" even when the facts in it are not. The likeliest outcome is a letter asking
you to stop, not a big damages claim, but a paid product makes a claim more likely.

Options:

- **Ask Transfermarkt** for permission or a licence. Cheapest way to remove the risk.
- **Rebuild on Wikidata only** (free for any use). It has club histories, but fewer
  appearance counts, so some questions and tiers would be weaker. Several days of work.
- **Launch and accept the risk**, ready to switch if asked to stop.

This is the one to put to a lawyer first.

### 2. The home-screen team photo

Nine kitties are close likenesses of famous players doing their best-known celebrations.
UK law has no general "image right", but a business can be sued for **passing off** if
people could think a star endorses it (Eddie Irvine v Talksport, Rihanna v Topshop). Being
cartoon cats and never named lowers the risk; being recognisable on purpose raises it. Some
celebrations are also registered trade marks.

Safest fix: make them generic kitties in team colours, with no recognisable hair or
celebrations. Your call.

### 3. Packs named after players

Don't sell a "Messi Pack". Selling a product under a star's name is much riskier than asking
questions about him, and some players have registered their names as trade marks. Use
themes such as "Argentina legends" instead.

### 4. Children

Football trivia will attract under-18s, so the ICO's **Children's Code** applies even though
the policy says the game isn't for under-13s. It expects high-privacy defaults, no
personalised ads for children, and no design that nudges children into spending. Options:

- **Non-personalised ads for everyone** (simplest, earns less), or
- ask for age at sign-in and turn off personalised ads for under-18s.

Also write a short "data protection impact assessment" (a page or two). The ICO has a
template.

### 5. Online Safety Act

Players choose display names that others see on Top Kitties and in leagues. That may put the
site under the Online Safety Act. If so, you need short written risk assessments (illegal
content, and whether children use it) and a way to report a name. The offensive-name filter
and the name-change power in the terms already help. Ofcom has a free online tool to check
whether the Act applies.

### 6. Trade mark on "Transfer Kitty"

Search the UK trade mark register (free, on GOV.UK) for "Transfer Kitty" and the tier names
before spending on the brand. Registering your own costs about £170 for one class.

## Business admin you must do (not optional)

- [ ] **Pay the ICO data protection fee.** Anyone handling personal data for a business must,
      unless exempt. Tier 1 costs about £50 a year, online at ico.org.uk. It is easy to miss,
      and fines can follow.
- [ ] **Register as self-employed with HMRC** (or set up a company) once money comes in.
- [ ] **EU VAT: Tom chose non-Union OSS with Stripe Tax** (19 November 2026). Prices stay
      the same and include VAT; for EU buyers the VAT comes out of them. Checkout is ready.
      Before the first live sale:
  - [ ] register for non-Union OSS in one EU country (Ireland's Revenue is common, and in
        English);
  - [ ] in Stripe, activate Tax (Settings > Tax), set your address, and add the OSS
        registration;
  - [ ] in Vercel, set `STRIPE_AUTOMATIC_TAX` to `on`;
  - [ ] every quarter, file the OSS return (even with no sales) from Stripe's tax report,
        and pay the VAT.
- [ ] Fill in `src/config/legal.ts`: your name (or company), a postal address (a virtual
      office service can stand in for your home address) and a contact email. Then set
      `isDraft` to false.
- [ ] In Stripe: turn on **email receipts** (the law needs a written confirmation after each
      purchase) and add the terms page link in your account's public details.

## EU VAT options

Prices are small (coins from £0.99, lifetime £3.99), so fixed fees per sale matter most.

| Option                                         | Cost                                                                                                                  | Work for you                                                                                                                                                 |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Sell only outside the EU at first**          | Nothing extra. You lose EU sales.                                                                                     | None. I make checkout refuse EU visitors (by the country the host reports) with a friendly message. Switch on EU sales later if there is demand.             |
| **Non-Union OSS + Stripe Tax**                 | Stripe Tax: 0.5% of each sale where you are registered. VAT itself (around 17 to 27%) comes out of the price.         | Register for OSS in one EU country (Ireland is common), then file a return every quarter, even with no sales. Stripe works out the VAT but does not file it. |
| **Merchant of record (Paddle, Lemon Squeezy)** | 5% + 50 cents a sale, which takes about 40% of a £0.99 coin pack. Paddle quotes its own rates for products under $10. | Almost none: they are the seller and handle all tax. But it means switching away from Stripe, about two days of work.                                        |

**Recommendation:** sell only outside the EU at launch. It costs nothing, needs no
registration, and the UK is the main audience. Revisit once the analytics show EU visitors
trying to buy.

Sources: Google AdSense help (non-personalised ads, answer 9042142); Paddle pricing page;
Stripe support, "Understanding Stripe Tax pricing"; VAT guides from hellotax and simplyvat on
non-Union OSS. Check HMRC's and the European Commission's OSS pages before registering.
