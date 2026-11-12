"use client";

import { useState } from "react";
import { ACCESSORIES, BOOTS, BREEDS, EYES, FURS, MAX_ACCESSORIES } from "@/config/avatar-items";
import { KITS } from "@/config/kits";
import { CatSprite, lookFor, type AvatarChoice } from "@/features/avatar";
import { profileApi, ProfileApiError } from "../api-client";
import { OptionRow, type Option } from "./OptionRow";

type Slot = "fur" | "breed" | "eyes" | "boots" | "kit";

const SLOTS: { slot: Slot; title: string; options: Option[] }[] = [
  {
    slot: "fur",
    title: "FUR",
    options: FURS.map((item) => ({ ...item, swatch: item.fur })),
  },
  { slot: "breed", title: "BREED", options: [...BREEDS] },
  {
    slot: "eyes",
    title: "EYES",
    options: EYES.map((item) => ({ ...item, swatch: item.colour })),
  },
  {
    slot: "boots",
    title: "BOOTS",
    options: BOOTS.map((item) => ({ ...item, swatch: item.colour })),
  },
  {
    slot: "kit",
    title: "KIT",
    options: KITS.map((kit) => ({
      id: kit.id,
      label: kit.name,
      priceCoins: kit.priceCoins,
      swatch: kit.primary,
      swatch2: kit.secondary,
    })),
  },
];

/** Build your cat footballer. Priced items show their price and wait for the shop. */
export function AvatarBuilder({ initial }: { initial: AvatarChoice }) {
  const [choice, setChoice] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);

  function toggleAccessory(id: string) {
    setChoice((current) => {
      const worn = current.accessories.includes(id);
      if (worn) return { ...current, accessories: current.accessories.filter((a) => a !== id) };
      if (current.accessories.length >= MAX_ACCESSORIES) return current;
      return { ...current, accessories: [...current.accessories, id] };
    });
  }

  async function save() {
    setMessage(null);
    try {
      await profileApi.saveAvatar(choice);
      setMessage("Saved. Your cat is on Top Kitties.");
    } catch (failure) {
      setMessage(failure instanceof ProfileApiError ? failure.message : "Could not save.");
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex justify-center">
        <CatSprite look={lookFor(choice)} label="Your avatar" scale={8} />
      </div>
      {SLOTS.map(({ slot, title, options }) => (
        <OptionRow
          key={slot}
          title={title}
          options={options}
          isChosen={(id) => choice[slot] === id}
          onChoose={(id) => setChoice((current) => ({ ...current, [slot]: id }))}
        />
      ))}
      <OptionRow
        title={`EXTRAS (UP TO ${MAX_ACCESSORIES})`}
        options={[...ACCESSORIES]}
        isChosen={(id) => choice.accessories.includes(id)}
        onChoose={toggleAccessory}
      />
      <button
        type="button"
        onClick={() => void save()}
        className="pixel-button border-floodlight px-4 py-3 text-xs text-floodlight"
      >
        SAVE AVATAR
      </button>
      {message ? (
        <p role="status" className="text-xl">
          {message}
        </p>
      ) : null}
    </section>
  );
}
