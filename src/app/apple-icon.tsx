import { ImageResponse } from "next/og";
import { GridBoxes, KIT_HEAD_GRID, NIGHT } from "@/components/brand/image-art";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** The icon an iPhone shows when the site is added to the home screen. */
export default function AppleIcon() {
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
      <GridBoxes grid={KIT_HEAD_GRID} scale={8} />
    </div>,
    size,
  );
}
