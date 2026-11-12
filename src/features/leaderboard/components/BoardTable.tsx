import { formatFee } from "@/features/scoring";
import type { Board } from "../types";
import { SignInToAppear } from "./SignInToAppear";

/** One leaderboard: the top rows, then your own row if you are further down. */
export function BoardTable({ board }: { board: Board }) {
  if (board.players === 0) {
    return <p>Nobody has finished a game in this period yet.</p>;
  }
  if (board.entries.length === 0 && board.signInToAppear) {
    // Only guests have played so far, so the board itself is empty.
    return (
      <div className="flex flex-col gap-2">
        <p>No signed-in players have finished a game in this period yet.</p>
        <SignInToAppear />
      </div>
    );
  }

  const youAreShown = board.entries.some((entry) => entry.isYou);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-chalk-dim">
        {board.players.toLocaleString("en-GB")} {board.players === 1 ? "player" : "players"}
      </p>
      <ol className="flex flex-col">
        {board.entries.map((entry) => (
          <Row
            key={`${entry.rank}-${entry.name}`}
            rank={entry.rank}
            name={entry.isYou ? `${entry.name} (you)` : entry.name}
            total={entry.total}
            days={board.period === "today" ? null : entry.days}
            highlight={entry.isYou}
          />
        ))}
      </ol>
      {board.signInToAppear ? <SignInToAppear /> : null}
      {board.you && !youAreShown ? (
        <ol className="flex flex-col border-t-4 border-stand pt-2">
          <Row
            rank={board.you.rank}
            name="You"
            total={board.you.total}
            days={board.period === "today" ? null : board.you.days}
            highlight
          />
        </ol>
      ) : null}
    </div>
  );
}

interface RowProps {
  rank: number;
  name: string;
  total: number;
  /** Days played, shown on boards that span more than one day. */
  days: number | null;
  highlight: boolean;
}

function Row({ rank, name, total, days, highlight }: RowProps) {
  return (
    <li
      className={`flex justify-between gap-2 border-b-2 border-stand py-2 ${
        highlight ? "text-floodlight" : ""
      }`}
    >
      <span>
        <span className="inline-block w-12">#{rank}</span>
        {/* Avatars join each name in stage 9. */}
        {name}
      </span>
      <span className="shrink-0 text-right">
        {formatFee(total)}
        {days === null ? "" : ` · ${days} ${days === 1 ? "day" : "days"}`}
      </span>
    </li>
  );
}
