import "server-only";
import type { Proje } from "./tipler";

/**
 * Dinamik site haritası: projenin kendi sitemap.xml dosyası yoksa yayında üretilir. Statik sayfalara ek olarak
 * İşletme blogunun yayındaki yazıları (kalıcı blog/<slug>.html ya da yazi.html?yazi=) ve mağaza ürünleri
 * (projede urun.html varsa urun.html?id=<kimlik>, yalnız aktif ürünler) girer. robots noindex içeren sayfalar girmez.
 * Arama motorlarına kapalı projede (SEO > indeks kapalı) null döner; varsayılan davranış sürer.
 */
const kacir = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
const gun = (z: number) => new Date(z).toISOString().slice(0, 10);

export async function siteHaritasi(p: Proje, dosyalar: Record<string, string>, tamKok: string): Promise<string | null> {
  if (!p.ayarlar.seo.indeks) return null;
  const varsayilan = gun(p.yayin?.zaman ?? Date.now());
  const ogeler = new Map<string, string>();
  const adres = (y: string) => `${tamKok}/${y === "index.html" ? "" : y.replace(/(^|\/)index\.html$/, "$1")}`;
  const sayfalar = Object.keys(dosyalar).filter((y) => y.endsWith(".html") && y !== "404.html" && !/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(dosyalar[y]))
    .sort((a, b) => (a === "index.html" ? -1 : b === "index.html" ? 1 : a.localeCompare(b)));
  for (const y of sayfalar) ogeler.set(adres(y), varsayilan);
  // İşletme blogu (modül yoksa ya da veri yoksa sessizce atlanır).
  try {
    const [{ isletmeOku, listeOku }, { yaziGenel, yayindakiler }] = await Promise.all([import("./isletme"), import("./isletmeIcerik")]);
    const v = await isletmeOku(p.id);
    for (const y of yayindakiler(await listeOku<import("./isletmeTipler").Yazi>(p.id, "yazilar")).slice(0, 2000)) {
      const a = yaziGenel(y, v).adres;
      ogeler.set(`${tamKok}/${a}`, gun(y.guncelleme ?? y.yayinZamani ?? Date.now()));
    }
  } catch { /* blog yok */ }
  // Mağaza ürünleri: yalnız ürün ayrıntı sayfası (urun.html) varsa.
  const urunSayfasi = ["urun.html", "urun-detay.html"].find((x) => x in dosyalar);
  if (urunSayfasi) {
    try {
      const { urunler } = await import("./isletmeMagaza");
      const r = await urunler(p.id, "canli");
      for (const u of r.urunler.filter((x) => x.aktif !== false).slice(0, 5000)) ogeler.set(`${tamKok}/${urunSayfasi}?id=${encodeURIComponent(u.id)}`, gun(u.guncelleme ?? Date.now()));
    } catch { /* mağaza yok */ }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...ogeler.entries()].map(([loc, z]) => `  <url><loc>${kacir(loc)}</loc><lastmod>${z}</lastmod></url>`).join("\n")}\n</urlset>\n`;
}
