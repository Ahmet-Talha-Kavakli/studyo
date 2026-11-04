import type { MetadataRoute } from "next";
import { BLOG_YAZILARI, yazarSlug } from "@/lib/kurumsal/blog";
import { BASIN_BULTENLERI } from "@/lib/kurumsal/basin";
import { HIKAYELER } from "@/lib/kurumsal/musteriler";
import { POZISYONLAR } from "@/lib/kurumsal/pozisyonlar";

/**
 * sitemap.xml — arama motorlarına halka açık sayfa haritası.
 * Panel (auth-korumalı) ve API dahil DEĞİL (robots.ts ile engelli).
 */
const TABAN = "https://vayra.ai";

// Halka açık pazarlama, şirket ve yasal rotalar (panel dışı).
const ROTALAR = [
  "", "/kesfet", "/fiyatlandirma", "/modeller", "/entegrasyonlar", "/gelistirici", "/earn/kampanyalar",
  "/hakkinda", "/kurumsal", "/referanslar", "/guvenlik", "/kariyer", "/indir", "/basin", "/blog", "/partner", "/iletisim", "/sss",
  "/yasal", "/gizlilik", "/veri-koruma", "/sartlar", "/kullanim-politikasi", "/kimlik-kosullari", "/cerezler", "/iade", "/mesafeli-satis",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const sabit = ROTALAR.map((yol) => ({
    url: `${TABAN}${yol}`,
    changeFrequency: (yol === "" || yol === "/blog" || yol === "/kesfet" ? "daily" : "weekly") as "daily" | "weekly",
    priority: yol === "" ? 1 : yol === "/fiyatlandirma" || yol === "/modeller" || yol === "/kurumsal" ? 0.8 : 0.6,
  }));
  const dinamik = [
    ...BLOG_YAZILARI.map((y) => ({ url: `${TABAN}/blog/${y.slug}`, lastModified: y.guncelleme ?? y.tarih })),
    ...Array.from(new Set(BLOG_YAZILARI.map((y) => yazarSlug(y.yazar)))).map((s) => ({ url: `${TABAN}/blog/yazar/${s}` })),
    ...BASIN_BULTENLERI.map((b) => ({ url: `${TABAN}/basin/${b.slug}` })),
    ...HIKAYELER.map((h) => ({ url: `${TABAN}/referanslar/${h.slug}` })),
    ...POZISYONLAR.map((p) => ({ url: `${TABAN}/kariyer/${p.slug}`, lastModified: p.tarih })),
  ].map((x) => ({ ...x, changeFrequency: "monthly" as const, priority: 0.5 }));
  return [...sabit, ...dinamik];
}
