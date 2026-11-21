import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return SITE.publicPaths.map((path) => ({
    url: path === "/" ? SITE.url : `${SITE.url}${path}`,
    changeFrequency: path === "/" || path === "/play" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.6,
  }));
}
