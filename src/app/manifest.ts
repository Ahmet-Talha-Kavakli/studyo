import type { MetadataRoute } from "next";

// PWA manifesti — "Ana ekrana ekle", standalone tam-ekran uygulama, marka renkleri.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vayra — Yapay Zeka Yaratım Stüdyosu",
    short_name: "Vayra",
    description:
      "Yapay zeka ile sinematik görsel, video, 3D ve ses üret. Higgsfield gücünde tek yaratım stüdyosu.",
    start_url: "/panel",
    display: "standalone",
    background_color: "#0a0a0b",
    theme_color: "#22d3ee",
    orientation: "portrait-primary",
    categories: ["productivity", "graphics", "entertainment"],
    lang: "tr",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "maskable" },
    ],
  };
}
