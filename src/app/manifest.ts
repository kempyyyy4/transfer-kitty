import type { MetadataRoute } from "next";

/** Lets phones add the game to the home screen and open it full screen, like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Transfer Kitty",
    short_name: "Transfer Kitty",
    description: "The daily football trivia game where rare answers earn big transfer fees.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#060914",
    theme_color: "#060914",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
