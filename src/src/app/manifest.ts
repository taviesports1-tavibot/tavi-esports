import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TaVi Esports",
    short_name: "TaVi",
    description: "Українська кіберспортивна платформа",
    start_url: "/",
    display: "standalone",
    background_color: "#08080d",
    theme_color: "#08080d",
    lang: "uk"
  };
}

