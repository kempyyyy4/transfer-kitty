# Transfer Kitty

The daily football trivia game where obvious answers earn pennies and rare ones earn a fortune. Seven questions a day at midnight UK time, 45 seconds each. Your answers' transfer fees add up to your daily kitty, ranked on the Top Kitties boards.

- `BRIEF.md` is the original brief and the source of truth.
- `PLAN.md` records the design, the database schema and every decision made along the way.
- `CLAUDE.md` holds the working conventions for changing the code.
- `QUESTIONS_TO_CHECK.md` lists facts, prices and wording waiting for a human check.

## What it is built with

Next.js 16 (App Router, TypeScript, Tailwind), Supabase (Postgres and sign-in), Stripe Checkout, Google AdSense, hosted on Vercel.

## Running it on your computer

1. Install [Node.js](https://nodejs.org) 26 (the version is in `.nvmrc`) and Git.
2. Clone the repository and install:

   ```bash
   git clone https://github.com/kempyyyy4/transfer-kitty.git
   cd transfer-kitty
   npm install
   ```

3. Copy `.env.example` to `.env.local` and fill it in, as described below. Never commit `.env.local`.
4. Start the app at http://localhost:3000:

   ```bash
   npm run dev
   ```

`npm run check` runs every check (format, lint, types and tests). It must pass before any commit, and CI runs it on every push.

## Environment variables

Every variable is listed in `.env.example` and checked by `src/lib/env.ts` when first used.

| Variable                               | Needed for               | Where it comes from                                                  |
| -------------------------------------- | ------------------------ | -------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Everything               | Supabase project, Connect button                                     |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Everything               | Supabase project, API Keys                                           |
| `SUPABASE_SECRET_KEY`                  | Everything (server only) | Supabase project, API Keys. Never expose it.                         |
| `CRON_SECRET`                          | The midnight job         | Any random string of 16+ characters; Vercel sends it to the job      |
| `ADMIN_USER_ID`, `ADMIN_PASSWORD`      | The `/admin` area        | Your account ID (shown on `/admin`) and a password of 16+ characters |
| `STRIPE_SECRET_KEY`                    | Buying anything          | Stripe, Developers, API keys (`sk_test_...` until launch)            |
| `STRIPE_WEBHOOK_SECRET`                | Granting purchases       | Stripe webhook endpoint, or `stripe listen` when local               |
| `NEXT_PUBLIC_ADSENSE_CLIENT`           | Ads for free players     | AdSense publisher ID (`ca-pub-...`). Blank means no ads.             |

Leave an optional variable blank to switch that part off.

## Supabase

There are two projects: development (used while building) and live.

1. Create the project in the Supabase dashboard (the dev project is in Frankfurt) and copy its URL and keys into the environment.
2. Link the Supabase CLI and apply every migration in `supabase/migrations`:

   ```bash
   npx supabase login
   npx supabase link --project-ref <project ref>
   npx supabase db push --remote --dry-run
   npx supabase db push --remote
   ```

3. **Authentication, Sign In / Providers:** turn on **Anonymous sign-ins** (guests play without signing up), **Email** (magic link) and **Google** (with a Google Cloud OAuth client whose redirect URI is the one Supabase shows).
4. **Authentication, URL Configuration:** set the Site URL to the site's address and add `https://<your domain>/auth/callback` (and `http://localhost:3000/auth/callback` on the dev project) to the redirect URLs.

## Questions and puzzles

Questions are built from open data (Transfermarkt via a CC0 dataset, and Wikidata) on your computer, then loaded into the database named in `.env.local`:

```bash
npm run data:download
npm run wikidata:download
npm run data:build
npm run questions:generate
npm run questions:load
npm run puzzles:schedule
```

`CLAUDE.md` describes each step. Before launch, set `DAILY_PUZZLE.firstPuzzleDate` in `src/config/game.ts` to launch day, then schedule puzzles on the live database. The midnight job keeps 30 days scheduled after that and recalculates tiers from real answers.

The `npm run smoke:*` scripts play through the rules against the database in `.env.local`. Run them against the development project only.

## Stripe

1. Create a Stripe account. It starts in test mode, where no real money moves.
2. Put the test secret key in `STRIPE_SECRET_KEY`.
3. **On your computer:** install the [Stripe CLI](https://stripe.com/docs/stripe-cli), run `stripe login`, then keep this running while you test and put the secret it prints in `STRIPE_WEBHOOK_SECRET`:

   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

   Pay with Stripe's test card `4242 4242 4242 4242`, any future expiry and any CVC.

4. **On the live site:** in Stripe, Developers, Webhooks, add an endpoint at `https://<your domain>/api/stripe/webhook` sending `checkout.session.completed` and `checkout.session.async_payment_succeeded`, and put its signing secret in Vercel's `STRIPE_WEBHOOK_SECRET`.
5. **Going live:** complete Stripe's account activation, then swap both values for the live-mode key and live webhook secret.

Prices live in `src/config/products.ts` and `src/config/coins.ts`. The browser never sets a price, and only the signed webhook grants a purchase.

## Google AdSense

1. Apply for AdSense with the live domain. Approval can take a while.
2. Put the publisher ID (`ca-pub-...`) in `NEXT_PUBLIC_ADSENSE_CLIENT`. The site then serves `/ads.txt`, which AdSense checks.
3. In AdSense, **Privacy & messaging**, create and publish a **European regulations** (GDPR) message for the UK and EU. Google shows it to visitors and records their consent, which Google requires before personalised ads.

Ads appear only on the Results and Top Kitties screens, never mid-game, and never for players with the lifetime unlock.

## Vercel and the domain

1. Import the GitHub repository in Vercel. The framework is detected as Next.js.
2. Add every environment variable from `.env.example`, with live values, under Settings, Environment Variables.
3. `vercel.json` schedules `/api/cron/rollover` twice a night (it covers the clock change between GMT and BST). `PLAN.md` recommends Vercel's Pro plan so the jobs run on time. Set `CRON_SECRET` so nobody else can trigger them.
4. Under Settings, Domains, add `transferkitty.gg` and `www.transferkitty.gg`, then create the DNS records Vercel shows at the domain's registrar. Vercel adds HTTPS by itself.
5. Update the Supabase Site URL and redirect URLs, Google sign-in and the Stripe webhook to the new domain.

## Before launch

- Fill in `src/config/legal.ts` (who runs the site, contact email) and have the privacy policy, terms and pack names checked by someone qualified, then set `isDraft` to `false`.
- Check the items in `QUESTIONS_TO_CHECK.md`.
- Use the live Supabase project and live Stripe keys on Vercel, and schedule puzzles from launch day.
- Decide whether the repository should be private.
