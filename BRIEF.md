# Transfer Kitty: Build Brief

Read this whole brief before writing any code. It is the source of truth for the project.

Build a daily football trivia web game called **Transfer Kitty** (transferkitty.gg). Clone and push to this GitHub repo: **https://github.com/kempyyyy4/transfer-kitty**

Your very first commit must save this entire brief, word for word, as `BRIEF.md` in the repo root, so every future session can read it. I won't be touching the repo myself, so you handle all files, commits, branches and merges.

---

## 1. The game

- Every day at midnight UK time, 7 new football questions go live, the same for everyone.
- Each question has many valid answers, e.g. "Name a player who played for both Liverpool and Real Madrid".
- 25 seconds per question. One attempt per day. No second chances.
- Obvious answers earn a small transfer fee. Rare answers earn a big one.
- The total across the 7 questions is your **transfer kitty** for the day (max £700m).
- Players are ranked on the **Top Kitties** leaderboards: today, this week, all time, plus private friends leagues via invite code.

## 2. Fee tiers

Every valid answer has one of these tiers:

| Fee | Tier | Meaning | Sprite |
|---|---|---|---|
| £0 | Stray | Wrong answer or timed out | Scruffy cat walking off with a bin bag |
| £500k | Copycat | The answer everyone gave | Cat holding up a mirror |
| £2m | Alley Cat | Very common | Scrappy cat, muddy kit |
| £8m | Squad Moggy | Common | Plain tabby, solid squad player |
| £20m | Tomcat | Decent | Confident first-teamer |
| £40m | Pick of the Litter | Rare | Sharp haircut, sweatband |
| £70m | Big Cat | Very rare | Lion mane |
| £100m | Galacticat | Hardly anyone said it | Lion in gold boots and sunglasses |

- Tier names, fees and sprite keys live in ONE config file so they can be renamed without touching game logic.
- Each question should have only 1-3 Galacticat answers, with most valid answers in the lower tiers.
- Starting tiers come from data (see section 3). Once a question has 200+ answers (configurable), recalculate tiers from how often each answer was actually given. Admin can override any tier.
- After submitting, show each answer's tier and the % of players who gave it.
- Share text (spoiler-free, copied to clipboard): `🐱 £412m · 2 Galacticats · Transfer Kitty #47` plus a row of emoji, one per answer.

## 3. Questions

- I need thousands of questions so Unlimited mode is genuinely unlimited. **Do not write questions from memory.**
- Use the open Transfermarkt dataset (github.com/dcaribou/transfermarkt-datasets) for players, clubs, transfers, nationalities, competitions and appearances. If you can't download it, stop and tell me exactly which files to download and where to put them.
- Write a generator script that builds questions from templates, with every valid answer pulled from the data. Example templates:
  - played for Club A and Club B
  - a [nationality] who played in [league]
  - joined [club] for over £Xm
  - played in the [competition] final
  - played in [league] in the [decade]
- Starting tier for each answer = how well known the player is, using career appearances in top leagues as the main signal.
- Only keep questions with at least 15 valid answers.
- Hand-written questions can also be added through the admin page.
- Each question stores: prompt, answer type, valid answers with tiers, category tags (league, decade, competition), scheduled date.
- Answer input is autocomplete over the WHOLE player/club database (so it doesn't give answers away), validated on the server.
- Any facts not from the dataset (e.g. transfer-record milestones on the kitty gauge) go in a single data file and are listed in `QUESTIONS_TO_CHECK.md` for me to verify.

## 4. Screens

1. **Home**: pixel stadium at night, logo, Kit the mascot, big "KICK OFF" button, countdown to the next puzzle, buttons for Archive, Themed Packs, Unlimited, Shop.
2. **Game**: one question at a time, 25-second timer bar, autocomplete input, progress (1/7). After each answer, a pixel scoreboard ticker counts the fee up, the tier name flashes and that tier's sprite appears.
3. **Results**: per-question breakdown, daily kitty total, rank ("#412 of 9,870"), coins earned, share button.
4. **Top Kitties**: leaderboards with each player's avatar next to their name.
5. **Profile**: avatar builder, streak, Nine Lives status, average kitty, best day, history calendar.
6. **Shop**: kits and avatar items, coin balance, coin packs.
7. **Admin** (protected): questions, tiers, packs, kits, shop prices.

## 5. Characters and visuals

- Retro 16-bit football game look. Pixel font for headings ("Press Start 2P" or "Silkscreen" from Google Fonts), monospace body text.
- Pixel stadium at night with floodlights, crowd as pixel dots, CRT/scanline effect on the logo.
- Chunky buttons with thick bright outlines and a hard drop shadow, like an old console menu.
- All characters are **pixel-art footballers with cat heads**: big head, small body, blocky 2-3 shade style, drawn as code (SVG or canvas pixel grids) so fur, breed and kit colours can be swapped.
- **Kit** is the mascot, an original cat footballer on the home and loading screens. Kit and all sprites must be clearly original and must not resemble Garfield, Hello Kitty, Top Cat, any existing game's sprites or any real footballer.
- A side gauge fills as the kitty grows during a game, with transfer-record milestones on it.
- Chiptune sounds, muted by default with a toggle top right: cash register on every fee, annoyed meow on Stray, lion roar on Galacticat.
- Loading text: "Scouting..." with a walking paw-print animation.
- No real club crests, league logos, sponsor logos, player likenesses or photos anywhere.
- Mobile first. Original branding throughout. Do not imitate Krillion's name, logo, colours or layout.

## 6. Avatars, kits and coins

**Avatars**
- Every player builds a cat footballer avatar: fur colour, breed/face shape, eyes, boots, accessories (headband, sunglasses, gloves, captain's armband) and kit.
- The avatar shows on Top Kitties and the profile.
- A default avatar and some basic options are free.

**Kits**
- Inspired by real club colours but with made-up names and NO crests, badges, sponsor logos or real club names, e.g. "Merseyside Red", "Sky Blue Mancs", "Claret & Blue", "Black & White Stripes".
- Stored in a config file: name, primary and secondary colours, pattern (plain, stripes, hoops, halves, sash), coin price.

**Coins**
- Earn (all configurable): 10 for completing the daily, 5 per Galacticat answer, 50 for a 7-day streak.
- Buy via Stripe: 500 coins £0.99, 1,200 coins £1.99, 3,500 coins £4.99.
- Spend in the shop on kits and avatar items.
- **Direct purchase only. No random packs, loot boxes or mystery items.**
- The shop always shows the real-money equivalent next to every coin price.
- Coin balance comes from a server-side ledger table of every transaction. Never trust the client.

## 7. Modes and money

- **Free**: daily puzzle, leaderboards, streaks, avatar basics, ads.
- **Lifetime unlock, £3.99 one-off**: Unlimited mode (endless rounds of 7 from the question bank, not counted on leaderboards), Archive (replay past days), no ads, **Nine Lives** (one missed day per month without losing the streak).
- **Themed packs, £1.99 one-off each**: e.g. "Premier League Only", "The 2000s", "The 2010s", "World Cups", built from category tags.
- Stripe Checkout for all payments. A webhook updates entitlements and the coin ledger in Supabase. Purchases restore by logging in on another device.
- Google AdSense for free users only, on the Results and Top Kitties screens only, never mid-game.
- Build payments, coins and ads as the LAST stages, after the core game works.

## 8. Tech stack

- Next.js (App Router) + TypeScript + Tailwind
- Supabase: Postgres + auth (email magic link + Google). Guest mode with a device ID so people can play before signing up, merged into their account when they sign up.
- Vercel hosting. Vercel cron for the midnight UK rollover and tier recalculation.
- Row-level security on every table.

## 9. Security and anti-cheat

- One daily submission per user, enforced by a database constraint.
- Today's answers are never sent to the client before submission. The timer is enforced server-side.
- Rate limit the autocomplete, submission and purchase endpoints.
- Admin pages require both an env-variable password and a specific admin user ID.
- Secrets only in env variables, never committed. Provide `.env.example` with every variable listed and no real values.
- Validate every API input with Zod.

## 10. Keeping the code clean

This matters as much as the features. The codebase must stay easy to read as it grows.

- **First, create `CLAUDE.md`** at the repo root with these conventions so every future session follows them. Keep it updated as the project changes.
- TypeScript strict mode. No `any`.
- ESLint + Prettier, set up from the first commit. Code must pass lint, type-check and tests before every commit.
- A GitHub Actions workflow that runs lint, type-check and tests on every push and pull request.
- Feature-based folders, e.g. `src/features/game`, `src/features/leaderboard`, `src/features/shop`, `src/features/avatar`, with shared code in `src/lib` and shared UI in `src/components`.
- Game rules (tiers, coin rewards, prices, kits, timer length) live in config files in `src/config`, not hard-coded in components.
- Database access goes through one data layer (`src/lib/db`), never raw queries scattered through components.
- Keep files short and functions small. Split anything getting large or hard to follow.
- No dead code, commented-out code or leftover console.logs.
- Database changes only through Supabase migration files, committed to the repo.
- Clear names over clever ones. Comments explain *why*, not *what*.

## 11. Git workflow

- Work on a branch per stage (e.g. `stage/02-game-flow`).
- Small commits with clear messages in the format `feat:`, `fix:`, `refactor:`, `chore:`, `test:`.
- When a stage is done and CI passes, open a pull request to `main`, then tell me in plain English what changed and how to try it. Merge it yourself once I say go.
- Never force-push to `main`.

## 12. Build order

1. **Plan**: save `BRIEF.md`, then write `PLAN.md` (database schema, folder structure, build order) and `CLAUDE.md`. Wait for my approval.
2. **Setup**: Next.js, TypeScript, Tailwind, ESLint, Prettier, CI workflow, Supabase connection.
3. **Data**: dataset import and question generator.
4. **Game flow**: daily puzzle, timer, autocomplete, submission.
5. **Scoring**: tiers, kitty totals, tier recalculation.
6. **Top Kitties**: leaderboards and friends leagues.
7. **Auth**: guest mode, sign-up and account merge.
8. **Visuals**: pixel style, sprites, Kit, sounds.
9. **Profile, avatars and share.**
10. **Admin.**
11. **Coins, shop and kits.**
12. **Payments, lifetime unlock, themed packs, Nine Lives and ads.**

Write tests for scoring, tier recalculation, the daily rollover, the coin ledger and entitlements.

Finish with a `README.md` covering setup: Supabase, Stripe, env variables, Vercel, and connecting transferkitty.gg.

**Ask me before any decision that's hard to change later.**
