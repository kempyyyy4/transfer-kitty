import { DATA_CUT_OFF_DATE, FIRST_SEASON } from "@/config/competitions";
import { FULL_INVOLVEMENT } from "@/config/fame";
import { GAME_RULES } from "@/config/game";
import { groupIntoQuestions, LEAGUE_IDS, slugify } from "../build";
import type { AnswerRow, DraftQuestion, Template } from "../types";

/** Fee thresholds in millions of euros, highest first. */
const FEE_TARGETS_MILLION_EUR = [50, 40, 30, 20, 10] as const;
const FIRST_WINDOW = `${FIRST_SEASON}-07-01`;

interface Row extends AnswerRow {
  club_id: number;
  club_name: string;
}

/**
 * "Name a player who joined Chelsea FC for €30m or more since the summer of 2012
 * (Transfermarkt fee)." Fees are in euros because that is what the data holds.
 * Each club gets one question, at the highest fee that still has enough answers.
 */
export const transferFee: Template = {
  key: "transfer-fee",
  generate(warehouse) {
    const rows = warehouse.query<Row>(`
      select t.to_club_id as club_id, c.name as club_name, t.player_id,
             max(t.transfer_fee) / 1000000.0 as context
      from tm_transfers t
      join tm_clubs c on c.club_id = t.to_club_id
      join tm_players p on p.player_id = t.player_id
      where t.transfer_date between '${FIRST_WINDOW}' and '${DATA_CUT_OFF_DATE}'
        and t.transfer_fee >= ${Math.min(...FEE_TARGETS_MILLION_EUR)} * 1000000
        and c.domestic_competition_id in (${LEAGUE_IDS})
      group by t.to_club_id, t.player_id
    `);

    const clubs = Map.groupBy(rows, (row) => row.club_id);
    return [...clubs.values()].flatMap((clubRows) => questionForClub(clubRows, this.key));
  },
};

function questionForClub(clubRows: Row[], templateKey: string): DraftQuestion[] {
  for (const target of FEE_TARGETS_MILLION_EUR) {
    const qualifying = clubRows.filter((row) => row.context >= target);
    if (qualifying.length < GAME_RULES.minAnswersPerQuestion) continue;

    return groupIntoQuestions(qualifying, FULL_INVOLVEMENT.transferFeeMillionEur, (row) => ({
      dedupeKey: `transfer-fee:${row.club_id}`,
      templateKey,
      prompt: `Name a player who joined ${row.club_name} for €${target}m or more since the summer of ${FIRST_SEASON} (Transfermarkt fee).`,
      params: { clubId: row.club_id, feeMillionEur: target },
      tags: [{ type: "club", value: slugify(row.club_name) }],
    }));
  }
  return [];
}
