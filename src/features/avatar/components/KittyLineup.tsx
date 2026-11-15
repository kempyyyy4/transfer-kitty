import type { CatLook } from "../cat/look";
import { KIT_MASCOT, LINEUP } from "../cast";
import { CatSprite } from "./CatSprite";

/** The back-row kitty doing keepy-ups. */
const JUGGLER = 4;

interface Member {
  look: CatLook;
  label: string;
}

/**
 * The home screen's team photo: a back row standing taller and a front row with Kit in the
 * middle, everyone bobbing on the spot. Sized from the screen's width and height, so it
 * never pushes the kick-off button off a phone.
 */
export function KittyLineup() {
  const back = LINEUP.filter((member) => member.row === "back");
  const front: Member[] = LINEUP.filter((member) => member.row === "front");
  front.splice(Math.floor(front.length / 2), 0, { look: KIT_MASCOT, label: "Kit, the mascot" });

  return (
    <div className="flex flex-col items-center" aria-label="The Transfer Kitty team" role="img">
      <Row members={back} size="w-[min(15vw,8.5vh)]" juggler={JUGGLER} />
      <Row members={front} size="w-[min(17vw,10vh)]" className="-mt-[2.5vh]" />
    </div>
  );
}

function Row({
  members,
  size,
  juggler,
  className = "",
}: {
  members: readonly Member[];
  size: string;
  juggler?: number;
  className?: string;
}) {
  return (
    <div className={`flex items-end justify-center ${className}`}>
      {members.map((member, index) => (
        <div
          key={member.label}
          className="animate-kitty-bob relative -mx-[1vw]"
          style={{ animationDelay: `${(index * 230) % 900}ms` }}
        >
          {index === juggler ? <Ball /> : null}
          <CatSprite
            look={member.look}
            label=""
            scale={4}
            className={`h-auto ${member.look === KIT_MASCOT ? "w-[min(20vw,12vh)] max-w-[112px]" : `${size} max-w-[96px]`}`}
          />
        </div>
      ))}
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
      className="animate-keepy-up absolute bottom-0 left-1/2 h-[min(2.4vw,1.4vh)] w-[min(2.4vw,1.4vh)] -translate-x-1/2"
    >
      <rect x={1} width={2} height={4} fill="#f2f4ff" />
      <rect y={1} width={4} height={2} fill="#f2f4ff" />
      <rect x={1} y={1} width={1} height={1} fill="#141414" />
      <rect x={2} y={2} width={1} height={1} fill="#141414" />
    </svg>
  );
}
