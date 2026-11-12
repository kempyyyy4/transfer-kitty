import type { Template } from "../types";
import { clubCup } from "./club-cup";
import { clubDecade } from "./club-decade";
import { clubManager } from "./club-manager";
import { clubScorer } from "./club-scorer";
import { clubSeason } from "./club-season";
import { clubSince2012 } from "./club-since-2012";
import { cupFinal } from "./cup-final";
import { cupFinalist } from "./cup-finalist";
import { hatTrick } from "./hat-trick";
import { nationalityClub } from "./nationality-club";
import { nationalityLeague } from "./nationality-league";
import { seasonGoals } from "./season-goals";
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
  clubScorer,
  twoClubs,
  twoLeagues,
  nationalityLeague,
  nationalityClub,
  cupFinal,
  cupFinalist,
  seasonGoals,
  hatTrick,
  transferFee,
  worldCup2026,
];
