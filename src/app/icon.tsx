import { ImageResponse } from "next/og";
import { GridBoxes, KIT_HEAD_GRID, NIGHT } from "@/components/brand/image-art";

/** The browser tab and home-screen icons: Kit's face on the night sky, in three sizes. */
export function generateImageMetadata() {
  return [32, 192, 512].map((side) => ({
    id: String(side),
    contentType: "image/png",
    size: { width: side, height: side },
  }));
}

export default async function Icon({ id }: { id: Promise<string> }) {
  const side = Number(await id);
  // A small icon fills its square; larger ones keep a margin so phones can round the corners.
  const scale = Math.floor((side * (side <= 32 ? 1 : 0.72)) / KIT_HEAD_GRID.length);
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: NIGHT,
      }}
    >
      <GridBoxes grid={KIT_HEAD_GRID} scale={scale} />
    </div>,
    { width: side, height: side },
  );
}
