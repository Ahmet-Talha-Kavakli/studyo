import "server-only";
import path from "path";
import { HESAP_KOK, jsonOku, jsonYaz, kilitle, sil } from "./depo";

/**
 * Galeri düzeni deposu — hesabın favorileri ve klasörleri (.veri/hesap/galeri/<uid>.json).
 * Üretimlerin kendisi tarayıcıda tutulur; burada yalnız kimlikleri ve klasör adları saklanır,
 * böylece başka cihazda giriş yapan kullanıcı aynı favori ve klasörleri görür.
 */
const DIZIN = path.join(HESAP_KOK, "galeri");
const dosya = (uid: string) => path.join(DIZIN, `${uid}.json`);

export interface GaleriKlasoru { id: string; ad: string; uretimIdler: string[]; olusturma: number }
export interface GaleriDuzeni { favoriler: string[]; klasorler: GaleriKlasoru[]; guncelleme: number }

const ID = /^[A-Za-z0-9_-]{1,80}$/;
const SINIR = { favori: 5000, klasor: 200, klasorOge: 5000, ad: 60 };

/** İstemciden gelen düzeni doğrular ve sınırlar; bozuk alanlar atılır. */
export function duzeniTemizle(g: unknown): GaleriDuzeni | null {
  if (!g || typeof g !== "object") return null;
  const v = g as Record<string, unknown>;
  const idler = (x: unknown, n: number) => Array.from(new Set((Array.isArray(x) ? x : []).filter((s): s is string => typeof s === "string" && ID.test(s)))).slice(0, n);
  const klasorler: GaleriKlasoru[] = (Array.isArray(v.klasorler) ? v.klasorler : []).slice(0, SINIR.klasor).flatMap((k) => {
    if (!k || typeof k !== "object") return [];
    const o = k as Record<string, unknown>;
    const ad = typeof o.ad === "string" ? o.ad.normalize("NFC").replace(/[\u0000-\u001f]/g, "").trim().slice(0, SINIR.ad) : "";
    if (typeof o.id !== "string" || !ID.test(o.id) || !ad) return [];
    return [{ id: o.id, ad, uretimIdler: idler(o.uretimIdler, SINIR.klasorOge), olusturma: Number.isFinite(o.olusturma) ? Number(o.olusturma) : Date.now() }];
  });
  const guncelleme = Number.isFinite(v.guncelleme) ? Math.min(Number(v.guncelleme), Date.now() + 60_000) : Date.now();
  return { favoriler: idler(v.favoriler, SINIR.favori), klasorler, guncelleme };
}

/** Hesap silinince çağrılır. */
export async function duzenSil(uid: string) { await sil(dosya(uid)); }

export async function duzenOku(uid: string): Promise<GaleriDuzeni | null> {
  return jsonOku<GaleriDuzeni>(dosya(uid));
}

/** Yazar; sunucudaki kayıt daha yeniyse yazmaz ve onu döndürür (son yazan kazanır, eski cihaz ezemez). */
export async function duzenYaz(uid: string, g: GaleriDuzeni): Promise<{ yazildi: boolean; duzen: GaleriDuzeni }> {
  return kilitle(`galeri:${uid}`, async () => {
    const eski = await jsonOku<GaleriDuzeni>(dosya(uid));
    if (eski && eski.guncelleme > g.guncelleme) return { yazildi: false, duzen: eski };
    await jsonYaz(dosya(uid), g);
    return { yazildi: true, duzen: g };
  });
}
