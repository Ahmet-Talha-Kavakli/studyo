import type { MetadataRoute } from "next";

/**
 * robots.txt — arama motorlarına indexleme kuralları.
 * Halka açık pazarlama sayfaları indexlenir; panel (auth-korumalı) + API kapalı.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/panel/", "/api/", "/giris", "/kayit"],
    },
    sitemap: "https://vayra.ai/sitemap.xml",
  };
}
