import { KIT_MASCOT, LINEUP } from "../cast";
import { CatSprite } from "./CatSprite";

/** Where Kit stands in the line-up: the middle. */
const KIT_POSITION = Math.floor(LINEUP.length / 2);
/** The kitty doing keepy-ups. */
const JUGGLER = 1;

/** The home screen's team photo: the line-up with Kit in the middle, bobbing on the spot. */
export function KittyLineup() {
  const team = [...LINEUP];
  team.splice(KIT_POSITION, 0, { look: KIT_MASCOT, label: "Kit, the mascot" });

  return (
    <div
      className="flex items-end justify-center"
      aria-label="The Transfer Kitty line-up"
      role="img"
    >
      {team.map((member, index) => {
        const isKit = member.look === KIT_MASCOT;
        return (
          <div
            key={member.label}
            className="animate-kitty-bob relative -mx-[1.5vw] sm:-mx-1"
            style={{ animationDelay: `${(index % 4) * 180}ms` }}
          >
            {index === JUGGLER ? <Ball /> : null}
            <CatSprite
              look={member.look}
              label=""
              scale={4}
              className={isKit ? "h-auto w-[17vw] max-w-[112px]" : "h-auto w-[13vw] max-w-[88px]"}
            />
          </div>
        );
      })}
    </div>
  );
}

/** A pixel ball doing keepy-ups above a kitty's boots. */
function Ball() {
  return (
    <svg
      viewBox="0 0 4 4"
      shapeRendering="crispEdges"
      aria-hidden
      className="animate-keepy-up absolute bottom-0 left-1/2 h-[2.4vw] max-h-4 w-[2.4vw] max-w-4 -translate-x-1/2"
    >
      <rect x={1} width={2} height={4} fill="#f2f4ff" />
      <rect y={1} width={4} height={2} fill="#f2f4ff" />
      <rect x={1} y={1} width={1} height={1} fill="#141414" />
      <rect x={2} y={2} width={1} height={1} fill="#141414" />
    </svg>
  );
}
