import "server-only";
import { rm, stat } from "fs/promises";
import path from "path";
import { DEPO, dizin, jsonDosya } from "./veri";

/**
 * Herkese açık içerik: kullanıcıların paylaşım bağlantısıyla yayınladığı işler. Kayıtlar depodaki dosyalardır;
 * yönetici bir kaydı yayından kaldırınca dosya silinir ve bağlantı 404 döner.
 */

export const PAYLASIM_TURLERI = {
  ses: { klasor: "paylasim", yol: "/p/", ad: "Ses ve müzik paylaşımı", sarili: false },
  sohbet: { klasor: "sc-paylasim", yol: "/s/", ad: "Sohbet paylaşımı", sarili: true },
  tuval: { klasor: "tuval-paylasim", yol: "/t/", ad: "Tuval paylaşımı", sarili: true },
  uygulama: { klasor: "tuval-uygulama", yol: "/a/", ad: "Tuval uygulaması", sarili: true },
  yayin: { klasor: "sc-yayin", yol: "/y/", ad: "Yayınlanan sayfa", sarili: true },
} as const;
export type PaylasimTuru = keyof typeof PAYLASIM_TURLERI;

const KIMLIK = /^[A-Za-z0-9_-]{6,20}$/;

export async function paylasimlar() {
  const l: { tur: PaylasimTuru; turAd: string; id: string; baslik: string; olusturma: number; guncelleme: number; adres: string; boyut: number; ozet?: string }[] = [];
  for (const [tur, t] of Object.entries(PAYLASIM_TURLERI) as [PaylasimTuru, (typeof PAYLASIM_TURLERI)[PaylasimTuru]][]) {
    const d = path.join(DEPO, t.klasor);
    for (const ad of await dizin(d)) {
      if (!ad.endsWith(".json")) continue;
      const f = path.join(d, ad);
      const ham = await jsonDosya<Record<string, unknown>>(f);
      if (!ham) continue;
      const k = (t.sarili ? ham.kayit : ham) as Record<string, unknown> | undefined;
      if (!k || typeof k.id !== "string") continue;
      let boyut = 0;
      try { boyut = (await stat(f)).size; } catch { /* yok */ }
      const mesaj = Array.isArray(k.mesajlar) ? (k.mesajlar as { metin?: string }[])[0]?.metin : undefined;
      l.push({
        tur, turAd: t.ad, id: k.id, baslik: String(k.baslik ?? k.ad ?? "Adsız").slice(0, 140), olusturma: Number(k.olusturma ?? 0), guncelleme: Number(k.guncelleme ?? k.olusturma ?? 0),
        adres: `${t.yol}${k.id}`, boyut, ...(mesaj ? { ozet: String(mesaj).slice(0, 160) } : typeof k.aciklama === "string" && k.aciklama ? { ozet: k.aciklama.slice(0, 160) } : typeof k.alt === "string" ? { ozet: k.alt.slice(0, 160) } : {}),
      });
    }
  }
  return l.sort((a, b) => b.guncelleme - a.guncelleme);
}

export async function paylasimKaldir(tur: string, id: string): Promise<boolean> {
  const t = PAYLASIM_TURLERI[tur as PaylasimTuru];
  if (!t || !KIMLIK.test(id)) return false;
  const f = path.join(DEPO, t.klasor, `${id}.json`);
  try { await stat(f); } catch { return false; }
  await rm(f, { force: true });
  return true;
}
