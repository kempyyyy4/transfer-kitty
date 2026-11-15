/** Specks of dust caught in the floodlight. Fixed positions, so server and browser agree. */
const SPECKS = Array.from({ length: 18 }, (_, index) => ({
  left: (index * 37) % 100,
  delay: (index * 0.9) % 8,
  duration: 9 + (index % 5) * 2,
  size: index % 3 === 0 ? 3 : 2,
}));

/**
 * The scene while a round is played: the crowd and pitch fall away and one floodlight
 * picks out the question, so there is nothing to distract from answering.
 */
export function GameScene() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-[5] overflow-hidden bg-night-deep"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_0%,rgb(255_246_194/0.16),transparent_70%)]" />
      <div className="animate-floodlight absolute inset-x-[15%] top-0 h-[70vh] bg-[linear-gradient(to_bottom,rgb(255_246_194/0.09),transparent)] [clip-path:polygon(35%_0,65%_0,100%_100%,0_100%)]" />
      <div className="pitch absolute inset-x-0 bottom-0 h-[16vh] opacity-60 [mask-image:linear-gradient(to_bottom,transparent,black)]" />
      {SPECKS.map((speck) => (
        <span
          key={speck.left}
          className="animate-speck absolute bottom-0 bg-floodlight/40"
          style={{
            left: `${speck.left}%`,
            width: speck.size,
            height: speck.size,
            animationDelay: `${speck.delay}s`,
            animationDuration: `${speck.duration}s`,
          }}
        />
      ))}
      <div className="scanlines absolute inset-0 opacity-60" />
    </div>
  );
}
