import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Truco no Valville",
    short_name: "Truco Valville",
    description: "App oficial do truco semanal do Valville.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FAF8F1",
    theme_color: "#0B6B3A",
    orientation: "portrait",
    icons: [
      {
        src: "/logo_truco.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo_truco.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo_truco.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}