export interface Option {
  id: string;
  label: string;
  priceCoins: number;
  /** A colour square shown on the button, for colour choices. */
  swatch?: string;
  /** A second colour, for two-colour kits. */
  swatch2?: string;
}

interface Props {
  title: string;
  options: Option[];
  isChosen: (id: string) => boolean;
  onChoose: (id: string) => void;
}

/** One slot of the avatar builder. Priced items are locked until the shop opens. */
export function OptionRow({ title, options, isChosen, onChoose }: Props) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-pixel text-[10px] text-chalk-dim">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const locked = option.priceCoins > 0;
          const chosen = isChosen(option.id);
          return (
            <button
              key={option.id}
              type="button"
              disabled={locked}
              aria-pressed={chosen}
              onClick={() => onChoose(option.id)}
              title={
                locked
                  ? `${option.label}: ${option.priceCoins} coins in the shop, opening soon`
                  : option.label
              }
              className={`flex items-center gap-2 border-4 px-2 py-1 text-lg ${
                chosen ? "border-floodlight text-floodlight" : "border-stand"
              } ${locked ? "opacity-50" : "hover:border-chalk"}`}
            >
              {option.swatch ? (
                <span aria-hidden className="flex h-4 w-4 border-2 border-black">
                  <span className="h-full flex-1" style={{ background: option.swatch }} />
                  {option.swatch2 ? (
                    <span className="h-full flex-1" style={{ background: option.swatch2 }} />
                  ) : null}
                </span>
              ) : null}
              {option.label}
              {locked ? (
                <span className="font-pixel text-[8px] text-scoreboard">{option.priceCoins}c</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
