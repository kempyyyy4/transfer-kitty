"use client";

import { STRAY_LEVEL, TIERS } from "@/config/tiers";

const ANSWER_TIERS = TIERS.filter((tier) => tier.level > STRAY_LEVEL);

interface Props {
  label: string;
  value: number | null;
  onChange: (tier: number | null) => void;
  /** Shown as the empty choice. Without it, a tier must be picked. */
  emptyLabel?: string;
  disabled?: boolean;
}

export function TierSelect({ label, value, onChange, emptyLabel, disabled }: Props) {
  return (
    <select
      aria-label={label}
      value={value ?? ""}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
      className="pixel-input p-1 text-base"
    >
      {emptyLabel !== undefined ? <option value="">{emptyLabel}</option> : null}
      {ANSWER_TIERS.map((tier) => (
        <option key={tier.level} value={tier.level}>
          {tier.level}. {tier.name}
        </option>
      ))}
    </select>
  );
}

export function tierLabel(level: number): string {
  return TIERS.find((tier) => tier.level === level)?.name ?? `Tier ${level}`;
}
