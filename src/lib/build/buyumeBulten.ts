import "server-only";
import { listeOku } from "./isletme";
import { yayindakiler } from "./isletmeIcerik";
import { urunler } from "./isletmeMagaza";
import type { Yazi } from "./isletmeTipler";
import { siteAdresi } from "./bulutKimlik";
import { kimlikUret, type Blok } from "./buyumeEkTipler";
import type { Proje } from "./tipler";

/**
 * Bülten oluşturucu: İşletme'nin yayındaki son blog yazılarından ve mağazanın etkin ürünlerinden markalı bir bülten
 * gövdesi kurar (Mailchimp RSS kampanyası ve Shopify Email ürün bloğu karşılığı). Her öğe görsel, başlık, özet ve
 * düğmeyle gelir; sahip düzenleyicide istediği gibi değiştirir. Kitle varsayılan olarak bülten aboneleridir.
 */
const gorselGecerli = (u?: string) => !!u && /^(https:\/\/|\/api\/dosya\/gorsel\/)[^\s"'<>]+$/.test(u);
export async function bultenKur(p: Proje, koken: string, g: { yazi: number; urun: number; baslik?: string; giris?: string; sonGun?: number }) {
  const site = siteAdresi(p, koken).replace(/\/$/, "");
  const sinir = g.sonGun ? Date.now() - g.sonGun * 864e5 : 0;
  const yazilar = yayindakiler(await listeOku<Yazi>(p.id, "yazilar").catch(() => [] as Yazi[])).filter((y) => (y.yayinZamani ?? 0) >= sinir).slice(0, Math.min(6, g.yazi));
  const ul = ((await urunler(p.id, "canli").catch(() => null))?.urunler ?? []).filter((u) => u.aktif !== false).sort((a, b) => (b.olusturma ?? 0) - (a.olusturma ?? 0)).slice(0, Math.min(6, g.urun));
  const b: Blok[] = [{ id: kimlikUret(), tur: "baslik", metin: g.baslik?.trim() || `${p.ad} bülteni` }, { id: kimlikUret(), tur: "metin", metin: g.giris?.trim() || "Merhaba {ad},\n\nBu sayıda son yazılarımızı ve yeni ürünlerimizi bir araya getirdik." }];
  if (yazilar.length) {
    b.push({ id: kimlikUret(), tur: "ayirici" });
    for (const y of yazilar) {
      const adres = `${site}/blog/${y.slug}.html`;
      if (gorselGecerli(y.kapak)) b.push({ id: kimlikUret(), tur: "gorsel", gorsel: y.kapak, metin: y.baslik.slice(0, 80), adres });
      b.push({ id: kimlikUret(), tur: "metin", metin: `**${y.baslik}**\n\n${(y.ozet || "").slice(0, 280)}` });
      b.push({ id: kimlikUret(), tur: "dugme", metin: "Yazıyı oku", adres });
    }
  }
  if (ul.length) {
    b.push({ id: kimlikUret(), tur: "ayirici" }, { id: kimlikUret(), tur: "metin", metin: "**Yeni ürünler**" });
    for (const u of ul) {
      if (gorselGecerli(u.gorsel)) b.push({ id: kimlikUret(), tur: "gorsel", gorsel: u.gorsel, metin: u.ad.slice(0, 80), adres: `${site}/` });
      b.push({ id: kimlikUret(), tur: "metin", metin: `**${u.ad}**\n\n${u.eskiFiyat && u.eskiFiyat > u.fiyat ? `${u.eskiFiyat.toLocaleString("tr-TR")} TL yerine ` : ""}${u.fiyat.toLocaleString("tr-TR")} TL` });
    }
    b.push({ id: kimlikUret(), tur: "dugme", metin: "Mağazaya git", adres: `${site}/` });
  }
  b.push({ id: kimlikUret(), tur: "ayirici" }, { id: kimlikUret(), tur: "metin", metin: `Görüşmek üzere,\n${p.ad}` });
  return { bloklar: b, yazi: yazilar.length, urun: ul.length, konu: `${p.ad}: ${yazilar[0]?.baslik ?? (ul.length ? "yeni ürünler geldi" : "bu ayın haberleri")}`.slice(0, 120), onMetin: [yazilar.length ? `${yazilar.length} yeni yazı` : "", ul.length ? `${ul.length} yeni ürün` : ""].filter(Boolean).join(" ve ") };
}
