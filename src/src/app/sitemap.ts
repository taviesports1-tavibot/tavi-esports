import type { MetadataRoute } from "next";
import { news, players, tournaments } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://tavi-esports.com";
  const staticPaths = [
    "",
    "/tournaments",
    "/rating",
    "/players",
    "/teams",
    "/news",
    "/streams",
    "/archive",
    "/rewards",
    "/rules",
    "/support",
    "/sponsors"
  ];
  const now = new Date();

  return [
    ...staticPaths.map((path) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: path === "" ? ("daily" as const) : ("weekly" as const),
      priority: path === "" ? 1 : 0.7
    })),
    ...tournaments.map((item) => ({
      url: `${base}/tournaments/${item.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8
    })),
    ...players.map((item) => ({
      url: `${base}/players/${item.id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.5
    })),
    ...news.map((item) => ({
      url: `${base}/news/${item.slug}`,
      lastModified: new Date(item.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6
    }))
  ];
}

