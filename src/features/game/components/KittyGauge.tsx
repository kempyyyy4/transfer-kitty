import { GAME_RULES } from "@/config/game";
import { TRANSFER_MILESTONES } from "@/config/manual-facts";
import { TIERS } from "@/config/tiers";
import { formatFee } from "@/features/scoring";

/** The most a day's kitty can reach: every answer a top-tier fee. */
const MAX_KITTY = GAME_RULES.questionsPerRound * Math.max(...TIERS.map((tier) => tier.feeGbp));

/** A tall gauge that fills as the kitty grows, marked with famous transfer fees. */
export function KittyGauge({ kitty }: { kitty: number }) {
  const percent = (fee: number) => Math.min(100, (100 * fee) / MAX_KITTY);

  return (
    <div
      role="meter"
      aria-label="Your kitty"
      aria-valuemin={0}
      aria-valuemax={MAX_KITTY}
      aria-valuenow={kitty}
      aria-valuetext={formatFee(kitty)}
      className="flex h-72 shrink-0 gap-1"
    >
      {/* On a phone the labels would squeeze the question, so only the marks show. */}
      <div className="relative hidden w-20 text-right font-pixel text-[7px] leading-none text-chalk-dim sm:block">
        {TRANSFER_MILESTONES.map((milestone) => (
          <span
            key={milestone.label}
            title={milestone.detail}
            className={`absolute right-0 -translate-y-1/2 ${
              kitty >= milestone.feeGbp ? "text-floodlight" : ""
            }`}
            style={{ bottom: `${percent(milestone.feeGbp)}%` }}
          >
            {milestone.label}
          </span>
        ))}
        <span className="absolute top-0 right-0">{formatFee(MAX_KITTY)}</span>
      </div>
      <div className="relative w-6 border-4 border-chalk bg-night-deep">
        <div
          className="absolute inset-x-0 bottom-0 bg-floodlight transition-[height] duration-700 ease-[steps(8)]"
          style={{ height: `${percent(kitty)}%` }}
        />
        {TRANSFER_MILESTONES.map((milestone) => (
          <div
            key={milestone.label}
            title={milestone.detail}
            className="absolute inset-x-0 h-0.5 bg-claret"
            style={{ bottom: `${percent(milestone.feeGbp)}%` }}
          />
        ))}
      </div>
    </div>
  );
}
