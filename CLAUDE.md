# Transfer Kitty: working conventions

Read `BRIEF.md` (the source of truth) and `PLAN.md` (schema, structure, build order, agreed decisions) before changing anything. If they disagree, `BRIEF.md` wins unless `PLAN.md` records a decision Tom approved.

Tom owns the product but does not touch the repo. Claude handles every file, commit, branch, pull request and merge, and explains changes to Tom in plain English.

## Before every commit

Every check must pass. Never commit with a failure, and never skip hooks.

```bash
npm run check
```

That runs, in order, `npm run format:check` (Prettier), `npm run lint` (ESLint), `npm run typecheck` (Next.js route types, then `tsc`) and `npm test` (Vitest). `npm run format` fixes formatting. CI (`.github/workflows/ci.yml`) runs the same four on every push and pull request.

Other commands:

| Command                             | What it does                                        |
| ----------------------------------- | --------------------------------------------------- |
| `npm run dev`                       | Start the app at http://localhost:3000              |
| `npm run build`                     | Production build                                    |
| `npx supabase migration new <name>` | Create a new migration file                         |
| `npx supabase db push --remote`     | Apply new migrations to the linked Supabase project |

`db push` without `--remote` targets a local database that this project does not use. Add `--dry-run` first to see what would be applied.

If the dev server shows an old version of a page or stylesheet after a restart, its build cache is stale: stop it, delete `.next`, and start it again.

## Data and questions

Questions are built offline from downloaded data, then loaded into the database. Nothing in `data/` is committed. Run these in order; each is safe to re-run.

| Command                      | What it does                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `npm run data:download`      | Download the Transfermarkt tables into `data/raw`                            |
| `npm run wikidata:download`  | Download club histories and player profiles from Wikidata (resumable)        |
| `npm run data:build`         | Load both into the local SQLite warehouse and build the merged tables        |
| `npm run questions:generate` | Run every template and write the questions and a report to `data/build`      |
| `npm run questions:load`     | Load players, clubs and questions into the database named in `.env.local`    |
| `npm run puzzles:schedule`   | Create daily puzzles for the next 30 days in that database                   |
| `npm run smoke:game`         | Play a full game against that database and check the anti-cheat rules        |
| `npm run tiers:recalculate`  | Recalculate tiers from real answers now, as the nightly job does             |
| `npm run smoke:leaderboard`  | Check Top Kitties and friends leagues against that database                  |
| `npm run smoke:accounts`     | Check that a guest's play merges into an account, against that database      |
| `npm run smoke:admin`        | Check the admin tools and missing-answer reports against that database       |
| `npm run smoke:payments`     | Check Stripe webhooks, entitlements and the paid modes against that database |
| `npm run smoke:coins`        | Check coin rewards, spending and the guest carry-over against that database  |
| `npm run wikidata:compare`   | Measure how well Wikidata agrees with Transfermarkt                          |
| `npm run data:sql -- "..."`  | Run one SQL query against the warehouse, for exploring                       |

- Scripts live in `scripts/` and run with `tsx`. They may print to the console; app code may not.
- A new kind of question is one new file in `scripts/questions/templates`, added to `index.ts` there. Each template names its `dataSource`.
- Transfermarkt's match data starts in 2012/13. A template built from it alone must say which seasons it covers in the prompt, or valid older answers would be marked wrong. Only templates that read the merged `club_spells` or `wd_club_spells` tables may ask all-time questions.
- How Wikidata is used is a decision Tom made from measured accuracy (PLAN.md 2.1). The rule lives in `src/config/wikidata.ts`. Do not loosen it without asking.
- A player is identified by Transfermarkt ID in both sources, in the warehouse and in the generator.
- The generator stops if a question lists the same player twice. Fix the template, not the check.

## Next.js version

This project is on Next.js 16 with Cache Components turned on, which differs from older Next.js in caching, route handlers and config. Follow `AGENTS.md`: read the matching guide in `node_modules/next/dist/docs/` before writing Next.js code. Code that touches the database or the clock at request time must not run during the build (see `src/app/api/health/route.ts` for the pattern).

## Git workflow

- One branch per build stage, named `stage/NN-short-name` (for example `stage/04-game-flow`).
- Small commits. Messages start with `feat:`, `fix:`, `refactor:`, `chore:` or `test:`.
- When a stage is done and CI is green, open a pull request to `main`, then tell Tom in plain English what changed and how to try it. Merge only after Tom says go.
- Never force-push to `main`.
- Secrets live only in env variables. Never commit one. Every variable is listed in `.env.example` with no real value.

## Ask first

Ask Tom before any decision that is hard to change later: database schema changes that alter meaning, anything about money or prices, anything that changes how scores or leaderboards work, new paid third-party services, and anything legal or brand related.

## Code rules

- TypeScript strict mode. No `any`.
- Validate every API input with Zod before using it.
- Keep files short and functions small. Split anything getting large or hard to follow.
- No dead code, commented-out code or leftover `console.log`.
- Clear names over clever ones. Comments explain why, not what.

## Where things go

| Path                  | What lives there                                                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app`             | Routes only. Pages and route handlers stay thin and call into features.                                                                |
| `src/features/<name>` | One folder per feature (`game`, `scoring`, `leaderboard`, `shop`, `avatar`, ...). Components, server logic and tests for that feature. |
| `src/components`      | Shared UI used by more than one feature.                                                                                               |
| `src/lib`             | Shared non-UI code.                                                                                                                    |
| `src/lib/db`          | The only place that talks to the database.                                                                                             |
| `src/config`          | Game rules: tiers, timer, coin rewards, prices, kits, packs.                                                                           |
| `supabase/migrations` | Every database change, as a migration file.                                                                                            |
| `scripts`             | Dataset download, import and the question generator.                                                                                   |

- Game rules are never hard-coded in components or logic. Read them from `src/config`.
- Tier names, fees and sprite keys live in one file, `src/config/tiers.ts`. Game logic refers to tiers by level number, never by name.
- No raw queries outside `src/lib/db`. Features call typed functions from that layer. ESLint blocks importing the Supabase client anywhere else.
- Read env variables only through `src/lib/env.ts`, which checks them. Add each new one there and to `.env.example`.
- A feature may import from `src/lib`, `src/config` and `src/components`, and from another feature only through that feature's `index.ts`.
- Tests sit next to the code they test as `*.test.ts`.

## Database rules

- Change the database only through migration files in `supabase/migrations`, committed to the repo.
- Row-level security is on for every table. A new table ships with its policies in the same migration.
- The browser never writes game, score, coin or entitlement data directly. Those writes go through server code.
- Coin balances come from the ledger table. Never store or trust a balance from the client.

## Game integrity rules

- Valid answers and tiers are never sent to the browser until the server has that player's round of 7 marked as finished.
- The daily's 45-second timer is judged by the database clock, not the client. `serve_next_question` stamps the time a question is handed out and `submit_answer` measures from it, both inside Postgres, so a game step is one atomic call. Archive, Unlimited and pack rounds get `PRACTICE_TIME_LIMIT_MS` instead, so they can be paused or untimed; their timer is the player's choice.
- A wrong guess does not end a question: `submit_answer` returns `retry` and the player keeps guessing until right or out of time. Wrong guesses are capped by `GAME_RULES.maxWrongGuesses` so a script cannot try every name. Picking a name only chooses it; Enter or SUBMIT sends it.
- Re-importing questions (`import_questions`) skips any question in today's puzzle, so a load never changes a live fee.
- The results curve (`daily_kitty_distribution`) only ever returns counts, never anyone's score or identity.
- One daily attempt per user is enforced by a database constraint, not just by code.
- The full answer lists come only from `get_session_answer_lists`, which refuses until the session is completed. Never add another path that returns `question_answers` to the browser.
- Tiers are recalculated only by the nightly job, never for a question in today's daily puzzle, so a fee never changes during the day it is played.
- A feature's `index.ts` must be safe for browser code, because other features' screens import it. Server-only parts go in the feature's `server.ts` (see `src/features/leaderboard/server.ts`), or are imported by file path (`src/features/scoring/recalculation-job.ts`).
- Leaderboards never send another player's user ID to the browser. They send a display name and an `isYou` flag.
- Types in `src/features/game/types.ts` are what the browser receives. Adding a field there is a decision about what players can see.
- After changing game logic, run `npm run smoke:game` against the development database.

## API routes

Every route handler follows the same order, and stays thin:

1. Identify the visitor with `getUserId()` from `@/lib/auth`. A route for something a first-time visitor should be able to do straight away (starting a game, creating or joining a league) uses `getOrCreateUserId()`, which silently makes them a guest. Never ask a visitor to sign in before they can play; prompt for sign-in only where it changes something for them.
2. Check the rate limit with `isWithinRateLimit()` and a rule from `src/config/rate-limits.ts`.
3. Check the input against a Zod schema, with `readJsonBody()` for a JSON body.
4. Call one function from a feature's `service.ts` and return what it gives.

Sign-in goes through `src/lib/auth` only, the same way database access goes through `src/lib/db` only. ESLint enforces both.

## Accounts

- Every visitor who plays is a Supabase user: a guest (anonymous) until they sign in with an emailed code or Google. A code, because phones often open email links in a different browser. Supabase's Magic Link email template must show `{{ .Token }}`.
- Signing in always signs in to an account, new or existing, then merges the guest into it (`merge_guest_into_account`). There is no separate "convert guest" path. The guest is found through a random token in an httpOnly cookie, matched on the server in `pending_merges`, never from an ID the browser sends.
- The sign-in return page, `/auth/callback`, only ever redirects to fixed pages on this site.
- Redirect with `NextResponse.redirect`, not `Response.redirect`, from any route that sets cookies.

A feature's `service.ts` is server-only. Its client components import from their neighbouring files (`../types`, `../api-client`), never from the feature's `index.ts`, which would pull server code into the browser.

## Admin

- The admin area is `/admin`. Getting in needs both: signed in as `ADMIN_USER_ID`, and `ADMIN_PASSWORD` typed within the last 8 hours (an httpOnly cookie signed with the password, `src/lib/auth/admin.ts`). If either variable is blank, admin is switched off.
- Every admin route starts with `adminGate()` from `src/features/admin/server.ts`. Anyone else gets a plain 404.
- A question in today's puzzle is frozen: tier overrides and answer changes are refused until midnight, so a fee never changes during its day.
- Hand-written questions get starting tiers from fame, the same way as generated ones. They follow the question rules below: only checked facts.
- Players report missing answers, or listed answers that are wrong, by picking a player, never by free text. Reports are only accepted for a round they finished. Removing a reported answer closes its reports.
- The site dashboard is `/admin/analytics`, behind the same admin lock.

## Analytics

- First-party and cookie-free, so no consent banner: `src/features/analytics`, events to `POST /api/pulse`. Nothing is stored on the visitor's device; no IP address, browser string or account ID is stored with an event. A visitor is a hash with a daily salt that is deleted the next day. Never add a third-party tracker or anything stored on the device for analytics without a consent banner, and ask Tom first.
- Named events are whitelisted in `src/config/analytics.ts`; send them with `track()`. Props are short labels, never personal data.
- Figures about play, accounts and money come from the game's own tables in `admin_analytics`, aggregated only.
- The reusable version for other projects is the `cookieless-analytics` skill in Tom's personal skills folder. Keep it in step when this changes.

## Coins and the shop

- A balance is never stored. It is the sum of the player's rows in `coin_ledger`. Every row has a unique `idempotency_key`, so a reward or purchase is never counted twice.
- Coins are paid when a finished daily round's summary is read (`payRoundCoins`), with keys tied to the round. Amounts live in `src/config/coins.ts`.
- Buying goes through `buy_item`, which locks per player, so a balance can never go below zero. The price always comes from the server's catalogue, never the browser.
- Item prices start in `src/config`. Admin changes are stored in `shop_prices` and win. A price of 0 makes an item free for everyone. Wearing is checked with `wearableKeys` from the shop feature.
- Owned items are keyed by slot and ID (`kit:gold-sash`), because IDs are only unique within a slot.
- Shop prices show a real-money equivalent at the smallest coin pack's rate, rounded up (`moneyEquivalent`).
- Direct purchase only. No random packs, loot boxes or mystery items.

## Payments and paid modes

- Everything sold is priced in `src/config/products.ts` and `src/config/coins.ts`. The browser only names a product (`lifetime`, `coins-500`, `pack:<id>`); the server sets the price on the Stripe Checkout it creates.
- Buying needs a signed-in account, so purchases restore on any device. A `purchases` row is written before Checkout opens.
- Prices include any VAT (`tax_behavior: "inclusive"`), so what the buyer pays always equals the price in config. With `STRIPE_AUTOMATIC_TAX=on`, Stripe Tax takes EU VAT out of it (Tom chose non-Union OSS registration for EU VAT).
- Only the webhook (`/api/stripe/webhook`) grants anything. It checks Stripe's signature, then `fulfil_purchase` grants once: the event ID is stored in `stripe_events`, the purchase must still be pending, and the amount paid must match. What is granted comes from the stored purchase, never the event's metadata.
- Entitlements are `lifetime` and `pack:<id>`, in `entitlements`. Check them with `getAccess` from `src/features/payments/server.ts`.
- Archive, Unlimited and pack rounds never count on Top Kitties, never earn coins, and never change the crowd figures that set tiers (only daily plays do, in `submit_answer`).
- No paid round may show a question from today's or a coming daily puzzle. `pick_practice_questions` leaves those out; Unlimited also leaves out pack questions and famous questions still waiting for a daily; the daily never picks a pack question.
- Nine Lives (lifetime) bridges one missed day per UK calendar month, automatically, in `computeStats`.
- Ads load only with `NEXT_PUBLIC_ADSENSE_CLIENT` set and no lifetime unlock, on Results and Top Kitties only. Ads are never personalised (`requestNonPersonalizedAds`), for anyone, because of the Children's Code. Consent is asked by Google's certified message, set up in AdSense (Privacy & messaging). Every cookie of our own is strictly necessary, so the site has no banner of its own. Adding any non-essential cookie or tracker means adding a consent step first.
- To test payments locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`, and Stripe's test card 4242 4242 4242 4242.

## Launch extras

- The privacy policy and terms are in `src/features/legal`, built from `src/config/legal.ts` and the price config, so prices on them never drift. They are drafts until checked; `LEGAL.isDraft` shows a notice. Change the wording only with Tom's approval.
- Display names pass `checkDisplayName`: the obscenity library (with spacing squashed out) and `RESERVED_NAME_PARTS` in `src/config/account.ts`.
- Players delete their own account from the Account page. `prepare_account_deletion` first hands their leagues to another member; every other table cascades from `auth.users`. A new table holding a user's data must reference `auth.users` with `on delete cascade`.
- Every buy button stays disabled until the player ticks that it starts at once and they give up the 14-day right to cancel (UK law needs that express agreement), and Stripe's page repeats it. Keep both on every buy button.
- Request counters in `rate_limits` can hold an IP address, so the nightly job deletes them after a day.
- `LEGAL_CHECK.md` lists the legal risks still open and the business admin needed before launch.
- `LAUNCH_GUIDE.md` is Tom's step-by-step guide to going live, with costs.
- `README.md` covers setup and launch. Keep it current.

## Question rules

- Fame is the hype score: for players born from 1990, mostly Wikipedia renown (`WIKIPEDIA_FAME.renownShare`) and the rest career volume, so famous young stars count as the obvious answers they are. In questions that name a club, a player there now is fully involved, and a short spell in a long career counts for less (`CLUB_ASSOCIATION`). Rebuild with `tsx scripts/data/derive.ts` then regenerate.
- "Played for X and won Y" questions name the seasons the data fully covers, worked out from the data, so a final missing from a download never marks winners wrong.

- A day has at most 2 "played for" and 2 "played in" questions (`familyLimits`), so the rest are scoring, assist, appearance and transfer questions. Niche clubs and leagues (`DAILY_CLUBS.unlimitedOnly`, `UNLIMITED_ONLY_COMPETITIONS`) and pre-2000 overseas squads stay in Unlimited.
- Never write football facts from memory. Every generated question and every valid answer comes from a data source approved in `PLAN.md`.
- Do not add a data source without a licence that allows commercial use, and not without Tom's approval.
- Any fact that is not from an approved data source must be listed in `QUESTIONS_TO_CHECK.md` for Tom to verify, and kept in one file in `src/config`.

## The look

- Colours and fonts are theme tokens in `src/app/globals.css` (`night`, `chalk`, `floodlight`, `turf`, `claret`, `scoreboard`...; `font-pixel` for headings and labels, `font-mono` for body). Never use raw Tailwind palette colours such as `slate-` or `amber-` on a screen.
- Buttons use the `pixel-button` utility, boxes `pixel-panel`, text boxes `pixel-input`. Pixel-font button labels are written in capitals. `pixel-panel` sits in the components layer, so colour classes on a panel (`border-floodlight`) win. The line under a page title uses `page-lead`.
- Body text line heights are set tighter in the theme (`--text-*--line-height`), because VT323 reads gappy at Tailwind's defaults.
- Avatar and kit options live in `src/config/avatar-items.ts` and `src/config/kits.ts`. A player's avatar is stored as item IDs, so never rename an ID once players can pick it. The server checks every item exists and is free or owned before saving (`checkChoice`).
- Characters are drawn from pixel grids in `src/features/avatar`: `cat/base.ts` is the body, `cat/extras.ts` the markings and accessories, `cast.ts` the mascot and tier characters. Change colours through a `CatLook`, never by editing the body rows.
- Animations respect `prefers-reduced-motion` (see the end of `globals.css`). They ease smoothly; only the crowd blink and the old-TV flicker use steps. The crowd's base layer never animates, so the stand is never empty.
- Never use: purple gradients, vague hero text, fake reviews, pill-shaped buttons, fake metrics, emoji icons, em dashes, or over-the-top scroll animations.
- Hover styles only apply on devices that hover (`@media (hover: hover)`), so tapped buttons never stay lit on phones. Menus never keep the current page highlighted.
- A round is its own scene: `PlayingView` covers the whole window at every size (stadium, crowd and footer hidden) with the plain floodlit `GameScene`, one screen with no scrolling. Anything that must replace the whole screen goes through `FullScreenScene`, which draws onto the page body: a fixed layer rendered in place gets boxed into the page column by the page's opening animation. While a round loads it shows a skeleton card, never a loader overlay.
- The moment an answer is in, Kit winds up (the `checking` view) so the wait for the verdict is part of the kick. Then Kit kicks the ball down a line of tier kitties (`src/features/game/components/kick`). The rarer the tier, the harder the kick: a longer hold at contact, higher, further, longer in the air, with the camera pulling back and a trail (`kick-motion.ts`, `kick-effects.ts`). The kitty of the tier earned controls it with a touch that matches its class, and only then do the verdict, tier and fee appear (until then the card shows only "your answer"). Tap to skip. Galacticats get a gold flash and confetti; Strays shake.
- In a round: progress pips fill in each answer's tier colour, the kitty rolls up as the ball lands, each question slides in, and NEXT fades the old answer out at once rather than waiting on the server. The timer bar drains as one animation (smooth every frame) and ticks for the last five seconds. The answer box takes arrow keys; the highlighted suggestion is the one Enter picks, and fewer suggestions show on short screens so the list clears the keyboard.
- Each tier has a colour in `src/config/tiers.ts`, matching its share square. Show tiers in their colour; answer lists are grouped by tier, rarest first.
- Waiting uses `Loader`: faint placeholder bars, no text, invisible for the first half-second, so fast loads show nothing. Prefer starting work early (as KICK OFF does) over showing a loader.
- Sounds live in `src/features/audio`, are made in code, and play only when the player has switched sound on. Phone buzzes (`buzz`) follow the same switch.
- The app icon, home-screen icon, link preview and manifest are made in code (`src/app/icon.tsx`, `apple-icon.tsx`, `opengraph-image.tsx`, `manifest.ts`) from the same pixel grids as the site, via `src/components/brand/image-art.tsx`. Change Kit and they follow.
- Every screen must work at 375 pixels wide with no sideways scrolling, and leave room at the top left for the menu button and the top right for the sound button.
- The animated stadium (`src/components/scene`) sits behind every screen, dimmed except on the home screen. Inner screens are opened from the menu (`src/components/SiteMenu.tsx`); keep the home screen to the title, line-up, kick-off button, description and policy links.

## Content rules

- No real club crests, league logos, sponsor logos, player likenesses or photos.
- Kits use made-up names and colours only.
- Kit the mascot and every sprite must be original artwork drawn as code.
- The home team photo (`LINEUP` in `src/features/avatar/cast.ts`) shows close likenesses of famous players, by Tom's choice (PLAN.md 2.7). It must pass the legal check before launch. Never name them anywhere, and never add a likeness elsewhere without asking.
- No random packs, loot boxes or mystery items. Direct purchase only.

## Search engines

- `src/config/site.ts` holds the live address, title and description, and which pages are public. `src/app/robots.ts` and `sitemap.ts` read it.

## Keeping this file current

Update this file in the same pull request whenever a convention, command or folder changes.
