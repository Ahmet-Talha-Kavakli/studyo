import type { MetadataRoute } from "next";

/**
 * sitemap.xml — arama motorlarına halka açık sayfa haritası.
 * Panel (auth-korumalı) ve API dahil DEĞİL (robots.ts ile engelli).
 */
const TABAN = "https://vayra.ai";

// Halka açık pazarlama/içerik rotaları (panel dışı).
const ROTALAR = [
  "", // ana sayfa
  "/kesfet",
  "/fiyatlandirma",
  "/modeller",
  "/uygulamalar",
  "/eklentiler",
  "/entegrasyonlar",
  "/blog",
  "/hakkinda",
  "/kariyer",
  "/iletisim",
  "/gelistirici",
  "/gizlilik",
  "/sartlar",
  "/cerezler",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROTALAR.map((yol) => ({
    url: `${TABAN}${yol}`,
    changeFrequency: yol === "" || yol === "/blog" || yol === "/kesfet" ? "daily" : "weekly",
    priority: yol === "" ? 1 : yol === "/fiyatlandirma" || yol === "/modeller" ? 0.8 : 0.6,
  }));
}
