/** The Transfer Kitty wordmark, with old-television lines across it. */
export function Logo({ size = "large" }: { size?: "large" | "small" }) {
  const text = size === "large" ? "text-2xl sm:text-4xl" : "text-sm";
  return (
    <h1
      className={`crt animate-crt-flicker inline-block px-2 py-1 text-center leading-tight ${text} font-pixel text-floodlight`}
      style={{ textShadow: "4px 4px 0 #000, -2px 0 0 #e23d3d" }}
    >
      TRANSFER
      <br />
      KITTY
    </h1>
  );
}
