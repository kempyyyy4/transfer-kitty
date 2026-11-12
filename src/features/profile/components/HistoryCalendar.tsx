import { formatFee } from "@/features/scoring";
import { addDays, weekContaining } from "@/lib/time/uk-day";
import type { HistoryDay } from "../types";

const WEEKS_SHOWN = 6;
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

/** Bigger kitties glow brighter. Bands in pounds. */
function shade(totalFee: number): string {
  if (totalFee >= 300_000_000) return "bg-floodlight";
  if (totalFee >= 150_000_000) return "bg-scoreboard";
  if (totalFee >= 50_000_000) return "bg-turf-light";
  return "bg-turf";
}

/** The last few weeks, Monday to Sunday, with each day played filled in. */
export function HistoryCalendar({ history, today }: { history: HistoryDay[]; today: string }) {
  const byDate = new Map(history.map((day) => [day.date, day]));
  const firstMonday = addDays(weekContaining(today).from, -7 * (WEEKS_SHOWN - 1));
  const days = Array.from({ length: WEEKS_SHOWN * 7 }, (_, index) => addDays(firstMonday, index));

  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-pixel text-xs text-chalk-dim">LAST {WEEKS_SHOWN} WEEKS</h2>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((name, index) => (
          <span key={index} className="text-center font-pixel text-[8px] text-chalk-dim">
            {name}
          </span>
        ))}
        {days.map((day) => {
          const played = byDate.get(day);
          const future = day > today;
          const label = played
            ? `${day}: ${formatFee(played.totalFee)} (puzzle #${played.puzzleNumber})`
            : `${day}: not played`;
          return (
            <span
              key={day}
              title={future ? undefined : label}
              aria-label={future ? undefined : label}
              className={`aspect-square border-2 ${
                day === today ? "border-chalk" : "border-stand"
              } ${played ? shade(played.totalFee) : future ? "opacity-30" : "bg-night-deep"}`}
            />
          );
        })}
      </div>
    </section>
  );
}
