import { ImageResponse } from "next/og";
import { GridBoxes, KIT_GRID, NIGHT, NIGHT_DEEP, PixelWord } from "@/components/brand/image-art";
import { TIERS } from "@/config/tiers";

export const alt = "Transfer Kitty: the daily football trivia game";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The picture shown when a link to the site is shared: Kit, the title and the tiers. */
export default function OpenGraphImage() {
  const tiersByLevel = [...TIERS].sort((a, b) => a.level - b.level);
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        gap: 56,
        padding: "0 80px",
        backgroundColor: NIGHT,
        backgroundImage: `linear-gradient(to bottom, ${NIGHT_DEEP} 0%, ${NIGHT} 55%, #145c2a 55%, #1f8a3a 100%)`,
      }}
    >
      <GridBoxes grid={KIT_GRID} scale={18} />
      <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
        <div style={{ display: "flex", height: 84 }}>
          <PixelWord word="TRANSFER" scale={12} />
        </div>
        <div style={{ display: "flex", height: 84 }}>
          <PixelWord word="KITTY" scale={12} />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          {tiersByLevel.map((tier) => (
            <div
              key={tier.level}
              style={{
                width: 44,
                height: 44,
                backgroundColor: tier.colour,
                border: "5px solid #000000",
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#f2f4ff", maxWidth: 560 }}>
          Seven football questions a day. Rare answers earn a fortune.
        </div>
      </div>
    </div>,
    size,
  );
}
