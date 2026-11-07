import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { coz, sifrele } from "./sifre";
import { anahtarBul, anahtarDiziniDegistir, calismaOku, sistemHam, type Calisma, type Disari, type Sistem } from "./sistemDepo";
import { girdiDogrula, girdiSemasi } from "./sistemKatalog";
import { calismaSonucu, sistemBaslat } from "./sistemMotoru";

/**
 * Sistemi dışarı açma: tek anahtarla API uç noktası (POST /api/build/sistemler/api/<anahtar>) ve MCP aracı
 * (POST /api/build/sistemler/mcp/<anahtar>, JSON-RPC, streamable HTTP). Girdi şeması sistemin girdi alanlarıdır,
 * yanıt son başarılı adımın çıktısıdır. Anahtar şifreli saklanır (sahip panelde görür); arama için özeti dizinde.
 */
const ozet = (a: string) => createHash("sha256").update(`vayra-disari:${a}`).digest("hex");
export const ANAHTAR_BICIMI = /^vs_[A-Za-z0-9_-]{20,64}$/;

export function aracAdiOner(ad: string): string {
  const t = ad.toLocaleLowerCase("tr").replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c").normalize("NFKD").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 48);
  return t || "vayra_sistemi";
}
export const aracAdiGecerli = (a: string) => /^[a-zA-Z0-9_-]{1,64}$/.test(a);

/** Yeni anahtar üretir (eskisi geçersiz olur). s yerinde değiştirilir; dizin güncellemesi ayrıca yapılır. */
export function disariAnahtari(s: Sistem): { anahtar: string; eskiOzet?: string } {
  const anahtar = `vs_${randomBytes(24).toString("base64url")}`;
  const eskiOzet = s.disari?.anahtarOzeti;
  const d: Disari = {
    api: s.disari?.api ?? false, mcp: s.disari?.mcp ?? false, anahtarOzeti: ozet(anahtar), anahtarSifreli: sifrele(anahtar), anahtarSonu: anahtar.slice(-4),
    aracAdi: s.disari?.aracAdi || aracAdiOner(s.ad), aracAciklama: s.disari?.aracAciklama ?? s.aciklama.slice(0, 400), olusturma: Date.now(),
  };
  s.disari = d;
  return { anahtar, eskiOzet };
}
export async function anahtarDiziniYaz(sistemId: string, yeniOzet: string, eskiOzet?: string) {
  await anahtarDiziniDegistir((x) => { if (eskiOzet) delete x[`disari:${eskiOzet}`]; x[`disari:${yeniOzet}`] = sistemId; });
}
export const disariAnahtariCoz = (s: Sistem) => (s.disari ? coz(s.disari.anahtarSifreli) : null);

/** Anahtardan sistemi bulur (zamanlamaya dayanıklı karşılaştırma). */
export async function disaridanBul(anahtar: string): Promise<{ s: Sistem; sahipOz: string } | null> {
  if (!ANAHTAR_BICIMI.test(anahtar)) return null;
  const o = ozet(anahtar);
  const id = await anahtarBul(`disari:${o}`);
  const h = id ? await sistemHam(id) : null;
  if (!h?.s.disari) return null;
  const a = Buffer.from(h.s.disari.anahtarOzeti), b = Buffer.from(o);
  return a.length === b.length && timingSafeEqual(a, b) ? h : null;
}

export function aracTanimi(s: Sistem) {
  const alanlar = s.girdi ?? [];
  return {
    name: s.disari?.aracAdi || aracAdiOner(s.ad), title: s.ad,
    description: (s.disari?.aracAciklama || s.aciklama || `Vayra sistemi: ${s.ad}`).slice(0, 1000),
    inputSchema: girdiSemasi(alanlar),
  };
}

export type DisariSonuc =
  | { tur: "hata"; durum: number; hata: string; ayrinti?: string[] }
  | { tur: "bitti"; c: Calisma; sonuc: ReturnType<typeof calismaSonucu> }
  | { tur: "suruyor"; c: Calisma };

/** Girdiyi doğrular, yayındaki sürümü çalıştırır ve en çok bekleMs bekler. */
export async function disaridanCalistir(h: { s: Sistem; sahipOz: string }, girdi: unknown, tur: "api" | "mcp", bekleMs: number): Promise<DisariSonuc> {
  const { s, sahipOz } = h;
  if (!s.yayin) return { tur: "hata", durum: 409, hata: "Sistem henüz yayınlanmadı; düzenleyicide Yayınla'ya bas." };
  if (s.durum === "duraklatildi") return { tur: "hata", durum: 503, hata: `Sistem duraklatıldı: ${s.duraklatmaNedeni ?? "üst üste hata"}` };
  if (girdi !== undefined && girdi !== null && (typeof girdi !== "object" || Array.isArray(girdi))) return { tur: "hata", durum: 400, hata: "Girdi bir JSON nesnesi olmalı." };
  if (JSON.stringify(girdi ?? {}).length > 100_000) return { tur: "hata", durum: 413, hata: "Girdi çok büyük (100 KB sınırı)." };
  const g = girdiDogrula(s.girdi ?? [], girdi ?? {});
  if (g.hatalar.length) return { tur: "hata", durum: 400, hata: "Girdi geçersiz.", ayrinti: g.hatalar };
  const r = await sistemBaslat(s.id, sahipOz, { tur, veri: g.veri }, { zorla: true });
  if (!r) return { tur: "hata", durum: 404, hata: "Sistem bulunamadı." };
  r.bitti.catch(() => {});
  const c = await Promise.race([r.bitti.catch(() => null), new Promise<null>((ok) => setTimeout(() => ok(null), bekleMs))]);
  if (!c || c.durum === "calisiyor" || c.durum === "kuyrukta" || c.durum === "bekliyor") return { tur: "suruyor", c: c ?? r.c };
  return { tur: "bitti", c, sonuc: calismaSonucu(c, s.ad) };
}

/** Çalışma durumunu okur (API'de ?calisma= ile). */
export async function disariCalisma(h: { s: Sistem }, cid: string) {
  const c = await calismaOku(h.s.id, cid);
  if (!c || (c.tetik.tur !== "api" && c.tetik.tur !== "mcp")) return null;
  return calismaSonucu(c, h.s.ad);
}
