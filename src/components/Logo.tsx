/** The Transfer Kitty wordmark: big pixel letters with a hard shadow. */
export function Logo({ size = "large" }: { size?: "large" | "small" }) {
  const text = size === "large" ? "text-[clamp(2.2rem,min(11vw,7.4vh),5rem)]" : "text-sm";
  return (
    <h1
      className={`inline-block px-2 py-1 text-center leading-tight ${text} font-pixel text-floodlight`}
      style={{ textShadow: "5px 5px 0 #000, -3px 0 0 #e23d3d" }}
    >
      TRANSFER
      <br />
      KITTY
    </h1>
  );
}
