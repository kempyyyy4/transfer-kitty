# Transfer Kitty: Plan

Status: **decisions in sections 1 and 2 are agreed, except the two marked open in section 2.** Nothing beyond this plan is built yet.

`BRIEF.md` is the source of truth. This plan says how the brief gets built and records the decisions Tom has made.

---

## 1. Agreed decisions

Agreed with Tom on 10 November 2026.

### 1.1 Fee questions are worded in euros

The dataset's transfer fees are in euros. Prompts say so and name the source, for example "joined Chelsea for €50m or more (Transfermarkt fee)". The kitty stays in pounds, because it is game money.

### 1.2 The fee pyramid

Rank a question's valid answers from most popular to least, then hand out tiers by fixed shares, all set in `src/config/tiers.ts`:

| Tier               | Share of a question's valid answers  |
| ------------------ | ------------------------------------ |
| Galacticat         | the rarest 2%, at least 1, at most 3 |
| Big Cat            | next 5%                              |
| Pick of the Litter | next 8%                              |
| Tomcat             | next 15%                             |
| Squad Moggy        | next 20%                             |
| Alley Cat          | next 25%                             |
| Copycat            | the rest, the most popular answers   |

Before a question has real answers, "popular" means the player's fame score from the data. After 200 answers, it means how often players gave that answer, with fame breaking ties.

### 1.3 Tiers are recalculated at midnight only

During a daily puzzle, an answer is worth the same fee for everyone all day, and a fee is locked the moment the player answers. Recalculation runs at the midnight rollover. Recalculated tiers apply when a question is replayed in Archive, Unlimited and packs. The "% of players who gave it" figure is live.

### 1.4 Leaving mid-game

The server keeps the clock running. The question on screen when the player left times out as a Stray. The remaining questions can be picked up later the same day, each with a fresh 25 seconds. A question is never shown twice.

### 1.5 Guests

Supabase's anonymous sign-in is the device ID. Signing up converts the same user in place. Logging in to an existing account merges the guest's play into it. Guests see their own rank, but only signed-in players are named on Top Kitties, because a guest can clear their browser and replay.

### 1.6 Launch extras are in scope

Added as stage 13: privacy policy, terms of sale, cookie consent banner, display-name filter, and a "report a missing answer" link. I can draft the policy and terms text, but it should be checked by someone qualified before launch.

### 1.7 Packs

Packs are built from question tags, priced at £1.99 each as in the brief. Three kinds:

- **Era packs:** The 2010s, The 2020s, and The 2000s if the older data passes its checks (section 2.1).
- **Tournament packs:** one per World Cup.
- **Special packs:** built around one player, such as a Messi pack (teammates, clubs, matches he scored in). See the open point in section 2.4.

---

## 2. Later decisions and open points

### 2.1 Wikidata for older eras (agreed, on condition the data is accurate)

The Transfermarkt dataset only covers players active from 2012/13 onwards (details in section 7). I looked for older data and tested the options on 10 November 2026.

| Source                      | What it has                                                                                                      | Licence                                                                                                                  | Verdict                  |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| **Wikidata**                | Club histories for footballers of every era, with years and appearance counts on most entries. World Cup squads. | CC0, free for any use including commercial                                                                               | **Use it**               |
| Fjelstul World Cup Database | Every men's World Cup squad from 1930 to 2022, match appearances from 1970                                       | CC-BY-SA 4.0: commercial use allowed, but needs credit, and anything built from it must be shared under the same licence | Keep as a fallback       |
| openfootball/worldcup       | World Cup results from 1930, some lineups                                                                        | CC0                                                                                                                      | Not enough player detail |
| ewenme/transfers            | Transfers in nine leagues from 1992/93                                                                           | No licence stated                                                                                                        | Do not use               |
| salimt/football-datasets    | 92,000 player profiles and season stats                                                                          | Licence file missing                                                                                                     | Do not use               |

What I measured on Wikidata:

- Asked for players linked to both Liverpool and Real Madrid, it returned ten: Alonso, Arbeloa, Anelka, Owen, Şahin, Sissoko, **McManaman, Morientes, Dudek and Núñez**. The last four are missing from the Transfermarkt dataset.
- McManaman's entry has each club with years and appearances (Liverpool 1990 to 1999, 272 games; Real Madrid 1999 to 2003, 94 games).
- 174,316 players on Wikidata have both a club history and a Transfermarkt ID, so the two sources can be joined by ID instead of by guessing from names.
- For Liverpool, 74% of club-history entries have a start year and 67% have an appearance count.
- 704 players are linked to the 1998 World Cup, which is exactly 32 squads of 22.

The limits, honestly:

- Wikidata is edited by volunteers. Some players will have gaps or mistakes, and about a quarter of entries have no years, so those cannot be used for decade questions.
- I have tested one club pair, one club and one tournament. That is encouraging, not proof.

**Agreed:** Tom said yes on 10 November 2026, if the data is accurate. Wikidata is added in stage 3 as a second source, behind this gate:

1. Stage 3 measures how often Wikidata agrees with Transfermarkt on club histories for the players both cover, and spot-checks a sample of older players by hand.
2. I report those numbers to Tom. No older-era question goes live until Tom has seen them and said go.
3. Questions built from older data are tagged with their source, so they can be pulled in one step if quality turns out poor.

If it passes, the player pool becomes "everyone in either source". If it fails, the game launches with 2012/13 onwards and says so on screen. The "report a missing answer" link and the admin page cover the gaps that remain either way.

### 2.2 Make the GitHub repo private (open, Tom's choice)

**Recommendation:** make it private now. Nothing in this project needs it public, and Vercel and the automated checks work the same with a private repo. The valid answers will live in the database, not the repo, but the question generator and the artwork code will be in the repo. You can switch it under Settings, General, Danger Zone, Change visibility. Renaming it later is also easy and can wait.

Whatever the visibility, no passwords or keys are ever committed.

### 2.3 Full answer list after each round (agreed)

Once a player has finished a round of 7, the Results screen lets them open each question and see every valid answer with its tier, fee and the % of players who gave it, with a search box to find a name in the list. Everyone sees the same list for the same question.

- The list is only sent after the server has that player's round marked as finished. Before that, valid answers still never reach the browser.
- This applies to every mode: daily, Archive, Unlimited and packs.
- Answers will spread faster on the day, since anyone who has finished can pass them on. That is accepted as part of the feature.
- The screen is our own design. The brief rules out imitating Krillion's layout.

### 2.4 Naming packs after real players (open, for the legal check)

Asking questions about a player is one thing. Using a star's name as the title of a product you sell is a step further, and some players hold trade marks on their names. I am not a lawyer. Add this to the legal check in section 3 before selling a pack called "The Messi Pack". The pack itself can be built either way and named last.

### 2.5 Tools on this PC

Git, GitHub CLI and Node.js were installed on 10 November 2026 with Tom's go-ahead. Pushing to GitHub needs Tom to sign in once with `gh auth login`.

---

## 3. Costs and outside checks

Prices read from each company's pricing page on 10 November 2026. They can change.

| Service  | During the build                                                                                            | Once live with ads and payments                                                                                                                              |
| -------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Vercel   | Free Hobby plan                                                                                             | **Pro, $20 a month** plus VAT. Includes $20 of usage credit and 1 TB of data transfer a month. Hobby is not allowed once the site has ads or takes payments. |
| Supabase | Free: 2 projects, 500 MB database, 50,000 monthly users. Free projects pause after a week with no activity. | **Pro, $25 a month** recommended at launch so the live database never pauses. Includes 8 GB and 100,000 monthly users.                                       |
| Stripe   | Free in test mode                                                                                           | No monthly fee. **1.5% + 20p** per payment on a standard UK card, more on premium, European and international cards.                                         |
| GitHub   | Free                                                                                                        | Free                                                                                                                                                         |

So the fixed cost at launch is about **$45 a month** plus VAT, plus the yearly domain renewal. I cannot predict traffic, but the included allowances are large for a new site.

What Stripe keeps on each price in the brief, standard UK card:

| Price | Stripe keeps    | You get     |
| ----- | --------------- | ----------- |
| £0.99 | about 21p (22%) | about 78p   |
| £1.99 | about 23p (12%) | about £1.76 |
| £3.99 | about 26p (7%)  | about £3.73 |
| £4.99 | about 27p (5%)  | about £4.72 |

The 20p fixed fee hits the £0.99 coin pack hardest. The prices stay as the brief says unless you change them.

**Legal check before taking money.** The Transfermarkt data comes via a third party who publishes it under a CC0 licence. That licence covers their compilation, not Transfermarkt's own permission. Worth a quick check with someone qualified, along with pack names (2.4) and the policy texts (1.6).

---

## 4. What I need from you, and when

I cannot create accounts, sign in, or handle passwords and secret keys for you. These steps are yours.

| When     | What                                                                                                                                |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Now      | Sign in to GitHub once with `gh auth login`. Decide whether to make the repo private (2.2).                                         |
| Stage 2  | Create two Supabase projects (development and live) and paste their keys into `.env.local`. I will give exact click-by-click steps. |
| Stage 7  | Create a Google sign-in client and paste its ID and secret into Supabase.                                                           |
| Stage 12 | Create Stripe and AdSense accounts and paste the keys into Vercel. Upgrade Vercel to Pro. Connect transferkitty.gg in Vercel.       |

---

## 5. Tech choices

| Area              | Choice                                                                 | Why                                                                                                                                  |
| ----------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Framework         | Next.js App Router, TypeScript strict, Tailwind                        | From the brief. Latest stable versions at setup.                                                                                     |
| Package manager   | npm                                                                    | Nothing extra to install.                                                                                                            |
| Database and auth | Supabase Postgres, magic link and Google, anonymous sign-in for guests | From the brief, plus decision 1.5.                                                                                                   |
| Validation        | Zod on every API input                                                 | From the brief.                                                                                                                      |
| Tests             | Vitest                                                                 | Fast, works with TypeScript without setup.                                                                                           |
| Lint and format   | ESLint and Prettier                                                    | From the brief.                                                                                                                      |
| Dataset tooling   | SQLite, built into Node, called from TypeScript scripts                | Handles millions of rows on a laptop with nothing extra to install. DuckDB was the first choice but crashed on load on the build PC. |
| Rate limiting     | A small Postgres-backed limiter behind one `rateLimit()` function      | No extra vendor. Can be swapped for Redis later without touching callers.                                                            |
| Sprites           | Pixel grids in code, drawn as SVG                                      | Fur, breed and kit colours swap by changing a palette.                                                                               |
| Sound             | Web Audio API tones made in code                                       | Original, tiny, no audio files to license.                                                                                           |
| Payments          | Stripe Checkout and a webhook                                          | From the brief.                                                                                                                      |

### How the main anti-cheat rules work

- **Server-side timer.** The server records the moment it hands out each question. An answer counts only if it arrives within 25 seconds plus a short network allowance (config). The browser's timer bar is only a display.
- **Answers stay on the server until the round is over.** The browser gets one question prompt at a time. After answering it gets back only that answer's tier, fee and percentage. The full list of valid answers is sent only once the server has that player's round marked as finished (decision 2.3).
- **One daily attempt.** A unique database index on user and puzzle date for daily sessions.
- **Midnight UK rollover.** "Today" is worked out from the clock in the Europe/London time zone on every request, so the puzzle changes at exactly midnight UK time, summer or winter, without depending on a scheduled job. Vercel's scheduler runs in UTC, so the housekeeping job is scheduled once a day at 23:05 UTC and once a day at 00:05 UTC, and does nothing if it has already run for that UK date. Puzzles are scheduled 30 days ahead, so a failed job never leaves a day empty.
- **All writes go through the server.** The browser cannot write scores, coins or entitlements. Row-level security blocks it even if someone tries.

---

## 6. Folder structure

```
transfer-kitty/
├─ BRIEF.md  PLAN.md  CLAUDE.md  README.md  QUESTIONS_TO_CHECK.md
├─ .env.example
├─ .github/workflows/ci.yml        lint, type-check, tests
├─ supabase/migrations/            every database change
├─ data/raw/                       downloaded data (not committed)
├─ scripts/
│  ├─ data/                        download and import players and clubs
│  └─ questions/                   generator, one file per template
└─ src/
   ├─ app/                         routes only, kept thin
   │  ├─ page.tsx                  Home
   │  ├─ play/  results/  top-kitties/  profile/  shop/
   │  ├─ archive/  packs/  unlimited/  admin/
   │  └─ api/                      autocomplete, game, leagues, shop,
   │                               stripe webhook, cron
   ├─ features/
   │  ├─ game/                     session flow, timer, question screen
   │  ├─ scoring/                  tiers, fees, kitty totals, recalculation
   │  ├─ questions/                picking daily and unlimited questions
   │  ├─ leaderboard/              Top Kitties and friends leagues
   │  ├─ auth/                     guest mode, sign-up, account merge
   │  ├─ avatar/                   sprites, Kit, avatar builder
   │  ├─ profile/                  streaks, Nine Lives, history
   │  ├─ share/                    share text
   │  ├─ coins/                    ledger and rewards
   │  ├─ shop/                     kits and items
   │  ├─ payments/                 Stripe checkout and webhook
   │  ├─ entitlements/             lifetime unlock and packs
   │  ├─ ads/                      AdSense slots and consent
   │  ├─ audio/                    chiptune sounds and mute toggle
   │  └─ admin/
   ├─ components/                  shared UI: pixel button, panel, loader
   ├─ config/
   │  ├─ tiers.ts                  names, fees, sprite keys, shares
   │  ├─ game.ts                   timer, questions per day, recalc threshold
   │  ├─ fame.ts                   weights for the fame score
   │  ├─ coins.ts  products.ts  kits.ts  avatar-items.ts  packs.ts
   │  └─ manual-facts.ts           every fact not from a data source
   └─ lib/
      ├─ db/                       the only code that queries the database
      ├─ supabase/                 client setup
      ├─ time/                     UK day and rollover maths
      ├─ rate-limit/
      └─ env.ts                    checked env variables
```

---

## 7. Data sources and question generator

### What the Transfermarkt dataset covers

Checked on 11 November 2026 by loading nine of its tables into the local warehouse.

- Match and appearance data (1,894,350 appearances) for the main European leagues and cups runs from 2012/13 to 2025/26. Leagues outside Europe's main ones (Brazil, Argentina, MLS, Saudi Arabia, Japan and others) only have 2024 and 2025.
- 50,149 players, every one active in 2012/13 or later.
- **Transfers before 2012 are too patchy to use.** Only 6,165 of the 175,165 transfers are from the 2000s, so careers before the match data are mostly missing. Asked for Liverpool and Real Madrid players, the dataset alone finds two (Fabinho and Alexander-Arnold) and misses Xabi Alonso. Transfers are used only for fees since summer 2012. Fees are in euros.
- **Older tournaments have results but no players.** World Cups from 2006 and Euros from 2008 are in the games table, but player appearances exist only for the 2026 World Cup group stage. Earlier tournaments need Wikidata.
- Cup finals have full line-ups up to 2025. The 2026 finals are missing.
- Updates are paused. Games stop at 6 July 2026, so the 2026/27 season is missing and the 2026 World Cup is cut off before its knockout rounds.

Because of this, every question built from Transfermarkt alone is built from match appearances and says which seasons it covers ("since 2012/13", or a named season or final).

### Generator steps

Runs on a developer machine against the downloaded data, never on the live site.

1. **Download** the data into `data/raw/` (not committed): `npm run data:download`.
2. **Build the warehouse**, a local SQLite file with the raw tables, a per-player-per-season summary and a fame score for each player: `npm run data:build`.
3. **Generate**: `npm run questions:generate`. Each template is one file in `scripts/questions/templates` that returns a prompt, tags and the valid answers. The 16 templates built so far:
   - played for [club] in [league] in [season]
   - played a league match for [club] since 2012/13
   - played for [club] in the 2020s
   - played for [club] under [manager], with the seasons named
   - played for [club] in [cup] since 2012/13
   - scored for [club] in [competition] since 2012/13
   - played for both [club] and [club] since 2012/13
   - played in both [league] and [league] since 2012/13
   - a player from [country] who played in [league] since 2012/13
   - a player from [country] who played for [club] since 2012/13
   - played in the [year] [cup] final, and in any [cup] final
   - scored [10, 15 or 20] or more goals in a [league] season
   - scored a hat-trick in [competition]
   - joined [club] for €Xm or more since summer 2012
   - played for [country] in the group stage of the 2026 World Cup
4. **Filter.** Keep questions with 15 to 400 valid answers (config). Above 400, almost any guess is right.
5. **Tier.** Rank each question's answers by starting popularity and apply the shares in decision 1.2.
6. **Load** into Supabase: `npm run questions:load`. Re-running is safe: each question has a `dedupe_key`, so an existing question is updated, not duplicated.

**First run, 11 November 2026:** 6,581 questions and 296,780 answers, loaded into the development database.

**Fame score.** Mainly career appearances in top leagues, weighted in `src/config/fame.ts` (the five biggest leagues count most, then other top divisions, plus Champions League appearances). International caps and peak market value are secondary signals. Known weakness: stars whose best years were before 2012 score too low, because their matches are not in the data. Wikidata can correct this. Crowd recalculation and admin overrides fix what remains.

**Starting popularity.** Within one question, fame is scaled down for a player who barely featured in what is being asked. Salah is a rarer answer for "played for Chelsea" than for "played for Liverpool". The strength of this is set in `src/config/fame.ts`.

**"Played for" rule.** A player counts for a club only if the data shows a match appearance for it. Signing for a club without playing does not count.

**Nationality** is the first citizenship the dataset lists for a player.

**Tags.** Every question is tagged by league, decade, competition, tournament, nationality and club where they apply. Packs are just saved tag filters.

The generator writes a report to `data/build/question-report.txt`: questions per template, the spread of answer counts, and one sample question per template with its most popular and rarest answers.

---

## 8. Database schema

Row-level security is on for every table. "Server only" means no browser access at all. IDs from the dataset are kept as they are so re-imports line up.

### Reference data (imported)

| Table     | Key columns                                                                                                       | Browser access                                                  |
| --------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `players` | `id`, `transfermarkt_id`, `wikidata_id`, `name`, `search_name`, `country`, `birth_year`, `position`, `fame_score` | Server only. Autocomplete goes through a rate-limited endpoint. |
| `clubs`   | `id`, `transfermarkt_id`, `wikidata_id`, `name`, `search_name`, `country`                                         | Server only                                                     |

`search_name` is lower-case with accents removed, with a trigram index for fast fuzzy search.

### Questions

| Table              | Key columns                                                                                                                                                                                                                                       | Notes                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `questions`        | `id`, `prompt`, `answer_type` (player or club), `source` (generated or manual), `data_source`, `template_key`, `template_params`, `dedupe_key` unique, `status` (draft, active, retired), `answer_count`, `times_played`, `tiers_recalculated_at` | Server only                                           |
| `question_answers` | `question_id`, `entity_id`, `starting_tier`, `current_tier`, `admin_tier_override`, `starting_popularity`, `times_given`. Primary key on question and entity.                                                                                     | Server only. This is the table that must never leak.  |
| `question_tags`    | `question_id`, `tag_type` (league, decade, competition, tournament, nationality, club, featured_player), `tag_value`                                                                                                                              | Server only                                           |
| `answer_reports`   | `id`, `question_id`, `user_id`, `suggested_answer`, `status`                                                                                                                                                                                      | Players' "missing answer" reports, reviewed in Admin. |

Tiers are stored as a level number from 0 (Stray) to 7 (Galacticat). Names and fees come from config, so renaming a tier needs no database change.

### Daily puzzles

| Table                    | Key columns                                            | Notes                                                              |
| ------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------ |
| `daily_puzzles`          | `puzzle_date` primary key, `puzzle_number` unique      |                                                                    |
| `daily_puzzle_questions` | `puzzle_date`, `position` 1 to 7, `question_id` unique | A question appears in at most one daily. Server only until served. |

### Play

| Table               | Key columns                                                                                                                                       | Notes                                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `game_sessions`     | `id`, `user_id`, `mode` (daily, archive, unlimited, pack), `puzzle_date`, `pack_id`, `started_at`, `completed_at`, `total_fee`, `total_answer_ms` | **Unique index on `user_id` and `puzzle_date` where mode is daily.** That is the one-attempt rule. Players read their own rows. |
| `session_questions` | `session_id`, `position`, `question_id`, `served_at`, `answered_at`, `entity_id`, `outcome` (correct, wrong, timeout), `tier`, `fee`              | `served_at` is the server-side timer. Fee is locked here when answered. Players read their own rows.                            |

Fees are whole pounds stored as integers. Totals that can grow without limit use 64-bit integers.

### Players and social

| Table            | Key columns                                                                                                                                         | Notes                                |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `profiles`       | `user_id`, `display_name`, `avatar` (JSON of chosen options), `is_guest`, `current_streak`, `best_streak`, `last_played_date`, `nine_lives_used_on` | Public read of name and avatar only. |
| `leagues`        | `id`, `name`, `invite_code` unique, `owner_id`                                                                                                      | Members read their own leagues.      |
| `league_members` | `league_id`, `user_id`                                                                                                                              |                                      |

Leaderboards (today, this week, all time, per league) are database functions over completed daily sessions. Ties are broken by lower total answer time. If they get slow at scale they become stored tables refreshed by the rollover job, with no change to the app code that calls them.

### Coins, shop and money

| Table           | Key columns                                                                                    | Notes                                                                                                                         |
| --------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `coin_ledger`   | `id`, `user_id`, `delta`, `reason`, `reference`, `idempotency_key` unique                      | Append-only. Balance is the sum. The unique key stops a reward or purchase being credited twice. Players read their own rows. |
| `kits`          | `id`, `name`, `primary_colour`, `secondary_colour`, `pattern`, `price_coins`, `active`         | Seeded from `src/config/kits.ts`, then editable in Admin.                                                                     |
| `shop_items`    | `id`, `kind`, `name`, `price_coins`, `active`                                                  | Avatar items, seeded from config.                                                                                             |
| `user_items`    | `user_id`, `item_type`, `item_id`, `ledger_id`                                                 | What a player owns.                                                                                                           |
| `packs`         | `id`, `slug`, `name`, `kind` (era, tournament, special), `tag_filter`, `price_pence`, `active` | Themed packs built from tags.                                                                                                 |
| `entitlements`  | `user_id`, `key` (`lifetime` or `pack:<slug>`), `source`, `stripe_ref`                         | Players read their own rows. Only the webhook writes.                                                                         |
| `purchases`     | `id`, `user_id`, `stripe_session_id` unique, `product_key`, `amount_pence`, `status`           |                                                                                                                               |
| `stripe_events` | `event_id` primary key                                                                         | Stops a repeated webhook being processed twice.                                                                               |

The brief asks for kits in a config file and also for kits to be editable in Admin. The plan treats the config file as the starting catalogue and the database as the live copy.

### Housekeeping

| Table         | Purpose                                                                              |
| ------------- | ------------------------------------------------------------------------------------ |
| `rate_limits` | Counters for the autocomplete, submission and purchase limits.                       |
| `job_runs`    | Records that the rollover job ran for a given UK date, so running twice is harmless. |

---

## 9. Build order

Each stage is one branch and one pull request. A stage is done when CI is green and you have tried it.

| #   | Branch                   | What gets built                                                                                                          | Done when                                              |
| --- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| 1   | `stage/01-plan`          | `BRIEF.md`, `CLAUDE.md`, this plan                                                                                       | You approve the plan                                   |
| 2   | `stage/02-setup`         | Next.js, TypeScript strict, Tailwind, ESLint, Prettier, Vitest, CI, `.env.example`, Supabase connection, first migration | CI green, the app starts and reaches the database      |
| 3   | `stage/03-data`          | Data download, import, source matching, fame score, generator, `QUESTIONS_TO_CHECK.md`                                   | Thousands of questions loaded, quality report reviewed |
| 4   | `stage/04-game-flow`     | Daily puzzle, server timer, autocomplete, submission, one-attempt rule, rate limits, plain UI                            | You can play today's 7 end to end                      |
| 5   | `stage/05-scoring`       | Tier config, fees, kitty total, percentages, full answer list with search on Results, tier recalculation, rollover job   | Fees and totals correct, tests pass                    |
| 6   | `stage/06-top-kitties`   | Today, week and all-time boards, rank, friends leagues with invite codes                                                 | Boards and leagues work with test users                |
| 7   | `stage/07-auth`          | Guest mode, magic link, Google, account merge                                                                            | Guest play carries over on sign-up                     |
| 8   | `stage/08-visuals`       | Pixel style, stadium, Kit, tier sprites, gauge, ticker, sounds, loader                                                   | All screens in final style on a phone                  |
| 9   | `stage/09-profile`       | Avatar builder, streaks, history calendar, share text                                                                    | Avatar shows on Top Kitties                            |
| 10  | `stage/10-admin`         | Protected admin: questions, tiers, packs, kits, prices, answer reports                                                   | You can add a question and override a tier             |
| 11  | `stage/11-coins-shop`    | Coin ledger, rewards, shop, kits, owned items                                                                            | Earn and spend coins, balance from ledger only         |
| 12  | `stage/12-payments`      | Stripe Checkout, webhook, lifetime unlock, Unlimited, Archive, packs, Nine Lives, AdSense                                | Test-mode purchases grant and restore correctly        |
| 13  | `stage/13-launch-extras` | Privacy policy, terms, cookie consent, display-name filter, report-an-answer link, `README.md`                           | Ready for the legal check and launch                   |

Stage 4 uses plain styling on purpose. The final look comes in stage 8, once the game works.

### Tests

Written alongside the stage that adds the logic:

- **Scoring** (stage 5): fee per tier, kitty total, timeout and wrong answer score zero.
- **Tier recalculation** (stage 5): shares applied correctly, 1 to 3 Galacticats, ties, below-threshold questions untouched, admin override wins.
- **Daily rollover** (stage 4): UK date at both clock changes, puzzle number, job runs once per day.
- **Coin ledger** (stage 11): balance is the sum, no double credit, cannot spend below zero.
- **Entitlements** (stage 12): lifetime and pack access, repeated webhook is harmless, Nine Lives once per month.

These rules are written as plain functions with no database inside them, so the tests run in CI without a database.
