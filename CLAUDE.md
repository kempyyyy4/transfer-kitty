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

## Data and questions

Questions are built offline from downloaded data, then loaded into the database. Nothing in `data/` is committed. Run these in order; each is safe to re-run.

| Command                      | What it does                                                              |
| ---------------------------- | ------------------------------------------------------------------------- |
| `npm run data:download`      | Download the Transfermarkt tables into `data/raw`                         |
| `npm run wikidata:download`  | Download club histories and player profiles from Wikidata (resumable)     |
| `npm run data:build`         | Load both into the local SQLite warehouse and build the merged tables     |
| `npm run questions:generate` | Run every template and write the questions and a report to `data/build`   |
| `npm run questions:load`     | Load players, clubs and questions into the database named in `.env.local` |
| `npm run wikidata:compare`   | Measure how well Wikidata agrees with Transfermarkt                       |
| `npm run data:sql -- "..."`  | Run one SQL query against the warehouse, for exploring                    |

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
- The 25-second timer is judged by the server clock, not the client.
- One daily attempt per user is enforced by a database constraint, not just by code.

## Question rules

- Never write football facts from memory. Every generated question and every valid answer comes from a data source approved in `PLAN.md`.
- Do not add a data source without a licence that allows commercial use, and not without Tom's approval.
- Any fact that is not from an approved data source goes in `src/config/manual-facts.ts` and is listed in `QUESTIONS_TO_CHECK.md` for Tom to verify.

## Content rules

- No real club crests, league logos, sponsor logos, player likenesses or photos.
- Kits use made-up names and colours only.
- Kit the mascot and every sprite must be original artwork drawn as code.
- No random packs, loot boxes or mystery items. Direct purchase only.

## Keeping this file current

Update this file in the same pull request whenever a convention, command or folder changes.
