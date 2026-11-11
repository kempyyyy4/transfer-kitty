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
- **"Played for" means appeared in a match.** A player who signed but never played does not count.
- **Nationality is one country per player**, the first citizenship the dataset lists. A dual national is only a valid answer for that one country.
- **Managers need 20 matches in charge** of a club to get a question, to leave out caretakers.
- **Manager questions name the seasons**, for example "under José Mourinho between 2013/14 and 2015/16", because the data starts in 2012/13 and would miss an earlier spell.
- **Transfer fee questions use euros** and Transfermarkt's own fee figures, which are estimates for undisclosed deals. Each club gets one question, at the highest of €50m, €40m, €30m, €20m or €10m that still has 15 answers.
- **World Cup 2026 questions cover the group stage only**, because the dataset stops before the knockout rounds. Five of the 48 nations are missing because the dataset has no team entry for them.
- **Questions with more than 400 valid answers are dropped** as too easy.

## 4. Known weaknesses

- **Older stars are ranked as more obscure than they are.** Fame comes mainly from matches since 2012/13, so Steven Gerrard and Michael Owen score low and may be given high-fee tiers they do not deserve. Wikidata can correct this once approved. Tiers also correct themselves from real answers after 200 plays, and Admin can override any tier.
- **The dataset stopped updating on 6 July 2026.** The 2026 cup finals and the 2026/27 season are not in it.

## 5. Not yet written

Transfer-record milestones for the kitty gauge will go in `src/config/manual-facts.ts` and be listed here when the gauge is built in stage 8.
