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

Transfer-record milestones for the kitty gauge will go in `src/config/manual-facts.ts` and be listed here when the gauge is built in stage 8.
