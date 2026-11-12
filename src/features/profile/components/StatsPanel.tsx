import { formatFee } from "@/features/scoring";
import type { PlayerStats } from "../stats";

/** Streaks, games, average and best day, plus where Nine Lives will show. */
export function StatsPanel({ stats }: { stats: PlayerStats }) {
  const tiles = [
    { label: "STREAK", value: `${stats.currentStreak}` },
    { label: "BEST STREAK", value: `${stats.bestStreak}` },
    { label: "GAMES", value: `${stats.gamesPlayed}` },
    { label: "AVERAGE KITTY", value: formatFee(stats.averageKitty) },
  ];

  return (
    <section className="flex flex-col gap-3">
      <dl className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => (
          <div key={tile.label} className="pixel-panel flex flex-col items-center gap-1 p-3">
            <dt className="font-pixel text-[8px] text-chalk-dim">{tile.label}</dt>
            <dd className="font-pixel text-lg text-floodlight">{tile.value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xl">
        Best day:{" "}
        {stats.bestDay
          ? `${formatFee(stats.bestDay.totalFee)} on ${readableDate(stats.bestDay.date)}`
          : "not played yet"}
      </p>
      <p className="text-lg text-chalk-dim">
        Nine Lives: comes with the lifetime unlock, opening soon. It lets you miss one day a month
        without losing your streak.
      </p>
    </section>
  );
}

function readableDate(day: string): string {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
