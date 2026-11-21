import type { Template } from "../types";
import { clubCup } from "./club-cup";
import { clubDecade } from "./club-decade";
import { clubManager } from "./club-manager";
import { clubScorer } from "./club-scorer";
import { clubSeason } from "./club-season";
import { clubSince2012 } from "./club-since-2012";
import { clubTrophy } from "./club-trophy";
import { cupFinal } from "./cup-final";
import { cupFinalist } from "./cup-finalist";
import { fixtureScorer } from "./fixture-scorer";
import { goalkeeper } from "./goalkeeper";
import { hatTrick } from "./hat-trick";
import { lastSeasonGoals } from "./last-season-goals";
import { leagueAppearances } from "./league-appearances";
import { nationalityClub } from "./nationality-club";
import { nationalityLeague } from "./nationality-league";
import { scoredAgainst } from "./scored-against";
import { seasonAssists } from "./season-assists";
import { seasonGoals } from "./season-goals";
import { teenScorer } from "./teen-scorer";
import { topFiveGoals } from "./top-five-goals";
import { transferFee } from "./transfer-fee";
import { twoClubs } from "./two-clubs";
import { twoLeagues } from "./two-leagues";
import { worldCup2026 } from "./world-cup-2026";

/** Every template the generator runs. Add a new one here. */
export const TEMPLATES: readonly Template[] = [
  clubSeason,
  clubSince2012,
  clubDecade,
  clubManager,
  clubCup,
  clubTrophy,
  clubScorer,
  twoClubs,
  twoLeagues,
  nationalityLeague,
  nationalityClub,
  cupFinal,
  cupFinalist,
  seasonGoals,
  lastSeasonGoals,
  topFiveGoals,
  hatTrick,
  transferFee,
  worldCup2026,
  seasonAssists,
  leagueAppearances,
  teenScorer,
  goalkeeper,
  fixtureScorer,
  scoredAgainst,
];
