const PAWS = [0, 1, 2, 3];

/** "Scouting..." with paw prints walking across. */
export function Loader() {
  return (
    <div role="status" className="flex flex-col items-center gap-4 py-10">
      <div className="flex items-end gap-3" aria-hidden>
        {PAWS.map((paw) => (
          <PawPrint key={paw} step={paw} />
        ))}
      </div>
      <p className="font-pixel text-xs">Scouting...</p>
    </div>
  );
}

/** One pixel paw print. Alternate prints sit higher, like a cat's left and right feet. */
function PawPrint({ step }: { step: number }) {
  return (
    <svg
      viewBox="0 0 7 7"
      width={21}
      height={21}
      shapeRendering="crispEdges"
      className={`animate-paw-step fill-floodlight ${step % 2 === 0 ? "mb-2" : ""}`}
      style={{ animationDelay: `${step * 0.3}s` }}
    >
      <rect x="0" y="1" width="1" height="2" />
      <rect x="2" y="0" width="1" height="2" />
      <rect x="4" y="0" width="1" height="2" />
      <rect x="6" y="1" width="1" height="2" />
      <rect x="1" y="3" width="5" height="3" />
      <rect x="2" y="6" width="3" height="1" />
    </svg>
  );
}
