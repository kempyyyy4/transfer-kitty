# Things for Tom to check

Every generated question and answer comes straight from the data sources in `PLAN.md`. This file lists the things that do not: wording and names chosen by hand, and judgement calls made when turning the data into questions. Tick each one off or tell Claude what to change.

## 1. Competition names

The dataset names competitions with codes such as `GB1` and `italy-cup`. These are the names used in prompts, set in `src/config/competitions.ts`.

| Dataset code | Name in prompts          |
| ------------ | ------------------------ |
| GB1          | the Premier League       |
| ES1          | La Liga                  |
| IT1          | Serie A                  |
| L1           | the Bundesliga           |
| FR1          | Ligue 1                  |
| SC1          | the Scottish Premiership |
| NL1          | the Eredivisie           |
| PO1          | Liga Portugal            |
| TR1          | the Süper Lig            |
| BE1          | the Belgian Pro League   |
| CL           | the Champions League     |
| EL           | the Europa League        |
| UCOL         | the Conference League    |
| FAC          | the FA Cup               |
| CDR          | the Copa del Rey         |
| CIT          | the Coppa Italia         |
| DFB          | the DFB-Pokal            |
| SFA          | the Scottish Cup         |
| NLP          | the KNVB Cup             |
| USC          | the UEFA Super Cup       |

## 2. Club names

Club names are used exactly as the dataset has them, which is sometimes more formal than fans would say: "Liverpool FC", "Juventus FC", "1.FC Köln", "FC Twente Enschede". Say if you would rather have a hand-made list of short names for the big clubs.

## 3. Judgement calls in the questions

- **Which leagues get questions.** The ten leagues in the table above. The dataset also covers Russia, Greece, Ukraine and Denmark from 2012/13, left out as too obscure for a UK audience. Easy to add.
- **"Played for" means appeared in a match**, from 2012/13 onwards. A player who signed but never played does not count. Before 2012/13 it means Wikidata records a spell at the club, under the inclusive rule you chose.
- **Decade questions cover the 1990s, 2000s, 2010s and 2020s.** Wikidata goes back further, so the 1980s and earlier could be added.
- **The minimum of 15 answers rules out the brief's own example.** "Played for both Liverpool and Real Madrid" has 11 correct answers, so it is not generated. Say if you want the minimum lowered for "both clubs" questions.
- **Nationality is one country per player**, the first citizenship the dataset lists. A dual national is only a valid answer for that one country.
- **Managers need 20 matches in charge** of a club to get a question, to leave out caretakers.
- **Manager questions name the seasons**, for example "under José Mourinho between 2013/14 and 2015/16", because the data starts in 2012/13 and would miss an earlier spell.
- **Transfer fee questions use euros** and Transfermarkt's own fee figures, which are estimates for undisclosed deals. Each club gets one question, at the highest of €50m, €40m, €30m, €20m or €10m that still has 15 answers.
- **World Cup 2026 questions cover the group stage only**, because the dataset stops before the knockout rounds. Five of the 48 nations are missing because the dataset has no team entry for them.
- **Questions with more than 400 valid answers are dropped** as too easy.
- **When time runs out, whatever is typed is sent**, as you asked. If it clearly fits one name in the list (the full name, or every word typed), that player is sent. If not, the best-known player matching the text is sent. So typing just "gomez" sends Mario Gómez, even when Papu Gómez was the answer you meant. Picking from the list avoids this.
- **Daily puzzles only use well-known questions**: those whose third most popular answer is famous enough (prominence 400 or more in `src/config/game.ts`). About 1,600 of the 10,271 questions qualify.

## 4. Top Kitties and leagues (stage 6)

- **Guests are off the boards** (from stage 7), as agreed. They still see their own rank.
- **A signed-in player who has not chosen a name** shows as "Player" plus four characters.
- **The week runs Monday to Sunday**, UK time.
- **Ties go to the faster player**: equal kitties are ranked by total time taken to answer.
- **Guests can create and join leagues.** If they clear their browser they lose the league. Say if you want leagues to need sign-in instead.
- **Limits**: 10 leagues per player, 500 members per league, names of 3 to 30 characters. League names are not yet checked for offensive words; that is the name filter in stage 13.

## 5. Accounts (stage 7)

- **When a guest signs in, everything they played comes with them**: games, leagues and leagues they created. If the guest and the account both played the same day's puzzle, the account's game is kept and the guest's is dropped, so nobody holds two attempts at one puzzle.
- **The emailed link must be opened on the same device and browser** that asked for it, within an hour. Otherwise it fails with a message asking for a new link. This is how Supabase keeps the link safe.
- **Display names**: 3 to 20 characters, letters (any alphabet), numbers, spaces and . _ ' -. Unique regardless of capitals. Names beginning "Guest" or "Player" are refused so nobody can pose as a placeholder. Offensive words are not checked until the launch extras.
- **Names can be changed at any time.** Say if you want a limit.
- **Signing out** makes the next game in that browser a fresh guest.

## 6. Known weaknesses

- **About one in ten older answers may be wrong.** That is the measured cost of the inclusive rule. The mistakes are mostly youth players who never made the first team, and the odd player Wikidata has attached to the wrong club. In "played for Arsenal in the 1990s", Gustavo Costas looks like one: Wikidata links him to Arsenal for 1996 to 1997 with no games recorded. Tiers are unaffected for the well-known answers; the mistakes sit among the rare ones.
- **Some real older answers will be missing**, where Wikidata has no record of the spell. The "report a missing answer" link planned for stage 13 is how players flag these.
- **Fame for older players is an estimate.** For players born before 1990 it uses how many language editions of Wikipedia cover them. That measures fame worldwide, not fame among UK fans, so a player famous abroad can rank above a British cult hero. Tiers correct themselves from real answers after 200 plays, and Admin can override any tier.
- **Players only in Wikidata have no nationality or position** in the database yet, so nationality questions still cover 2012/13 onwards only.
- **The Transfermarkt dataset stopped updating on 6 July 2026.** The 2026 cup finals and the 2026/27 season are not in it.

## 7. Not yet written

Nothing outstanding.

## 8. Profile, avatars and sharing (stage 9)

- **Coin prices on avatar items and kits**: you approved these on 12 November 2026 (stage 11). They can now be changed any time in Admin, Shop Prices. They are in `src/config/avatar-items.ts` and `src/config/kits.ts`. Free for everyone now: 5 furs, 3 breeds, 4 eye colours, 3 boot colours, headband, sweatbands, and 3 kits (Kitty Teal, Plain White, Midnight Navy). Priced: 100 to 500 coins.
- **Kit names**: Merseyside Red, Sky Blue Mancs, Claret & Blue, Black & White Stripes, Green & White Hoops, Gold Sash. Made-up names in club-like colours, with no crests, badges or real club names.
- **Avatars need sign-in and a chosen name**, because only signed-in players appear on Top Kitties. Guests see the default cat and a sign-in prompt.
- **Up to 2 accessories** can be worn at once.
- **The share text leaves out the Galacticat count when there are none**, for example `🐱 £8.5m · Transfer Kitty #1`. The emoji row uses ⬛ Stray, ⬜ Copycat, 🟫 Alley Cat, 🟩 Squad Moggy, 🟦 Tomcat, 🟪 Pick of the Litter, 🟧 Big Cat and 🦁 Galacticat. It does not include a link to the site; say if you want one added.
- **A streak survives until the end of the day after your last game**, so not having played yet today does not break it.

## 9. Transfer records on the kitty gauge (stage 8)

These are written from memory, not taken from a data source, so they need checking. They live in `src/config/manual-facts.ts`. Fees are as commonly reported in the UK, in pounds.

| Gauge label | Fact to check                                                                               |
| ----------- | ------------------------------------------------------------------------------------------- |
| SHEARER '96 | Alan Shearer, Blackburn Rovers to Newcastle United, 1996, £15m: a world record at the time  |
| RONALDO '09 | Cristiano Ronaldo, Manchester United to Real Madrid, 2009, £80m: a world record at the time |
| ISAK '25    | Alexander Isak, Newcastle United to Liverpool, 2025, £125m: the British record              |
| NEYMAR '17  | Neymar, Barcelona to Paris Saint-Germain, 2017, £198m (€222m): the world record             |

Real names appear only as text labels on the gauge. No likenesses, crests or logos are used.

## 10. The look and characters (stage 8)

- All characters are cat-headed footballers drawn in code from pixel grids in `src/features/avatar`. Kit the mascot is a smoky blue cat in a teal kit with a yellow sash. Please confirm none of them reminds you of an existing character.
- Kits on the tier characters use made-up colour schemes. The Big Cat's claret and sky-blue stripes and the Tomcat's red and white stripes echo common real club colours, with no names or badges.
- Fonts are Press Start 2P for headings and VT323 for body text, both free Google Fonts.
- Sounds are made in code (no sound files) and start muted.
- The Archive, Themed Packs, Unlimited and Shop buttons on the home screen show as "SOON" until their stages are built.

## 11. Admin (stage 10)

- Pack kinds are Era, World Cup, Player and Other. Player packs (for example a Messi Pack) still need the legal check before any goes live.
- A pack's web name (like `messi-pack`) should not change once the pack is on sale. Pick it with care.
- Admin can override tiers and add or remove answers, but not for a question in today's puzzle: those are frozen until midnight so nobody's fee changes mid-day.

## 12. Coins and the shop (stage 11)

- **Rewards you approved**: 10 coins for finishing the daily, 5 per Galacticat, and 50 on every 7th day of a streak (day 7, 14, 21...). Only the daily earns coins.
- **Real-money figures** in the shop use the 500 coins for £0.99 rate, rounded up to the penny, so a 300-coin kit shows as "about 60p".
- **Guests earn coins** and keep them when they sign in. If a guest and their account both played the same day, the account's game is kept and the guest's coins for that day are dropped with it.
- **Buying needs sign-in.** Coin packs are shown with their prices but marked SOON until payments arrive in stage 12.
- **The streak bonus is paid when a round is finished.** Nine Lives, which protects a streak, comes in stage 12.
