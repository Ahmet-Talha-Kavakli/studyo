import "server-only";
import { createHash, randomBytes } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";

/**
 * Vayra Bulut proje ayarları (proje dosyasından ayrı tutulur; yayındaki site her istekte okur):
 *  güvenlik duvarı kuralları ve saldırı modu, bakım modu, yapay zekâ duraklatma, bildirim tercihleri, kota davranışı.
 * IP adresleri hiçbir yerde düz saklanmaz: proje başına rastgele tuzla SHA-256 özeti (12 karakter) kullanılır.
 * Dosya: .veri/build/bulut/<projeId>.json (eksik alanlar okurken varsayılanla tamamlanır).
 */
export type DuvarKuralTur = "hiz" | "yol-engelle" | "ulke-engelle" | "ulke-izin" | "ip-engelle";
export type DuvarKurali = {
  id: string; tur: DuvarKuralTur; acik: boolean; olusturma: number; not?: string;
  /** hiz ve yol-engelle: bu yolla başlayan adresler ("/" bütün site). */ yol?: string;
  /** hiz: pencere başına izin verilen istek (IP başına). */ sinir?: number;
  /** hiz: pencere, saniye. */ pencere?: number;
  /** ulke-engelle / ulke-izin: ISO ülke kodları (TR, DE …). */ ulkeler?: string[];
  /** ip-engelle: tuzlu IP özeti. */ ip?: string;
};
export type BildirimTur = "hata-artisi" | "yayin-hatasi" | "kullanim" | "alan-adi" | "guvenlik" | "istemci-hatasi" | "zamanli-hata" | "uyari-kurali";
export const BILDIRIM_TURLERI: BildirimTur[] = ["hata-artisi", "yayin-hatasi", "kullanim", "alan-adi", "guvenlik", "istemci-hatasi", "zamanli-hata", "uyari-kurali"];
/** Uyarı kuralı ölçütleri: hata oranı (yüzde), p95 süre (ms), 5xx sayısı, istek sayısı, fonksiyon hatası, zamanlı görev hatası. */
export type UyariOlcut = "hataOrani" | "p95" | "hata5xx" | "istek" | "fonksiyonHata" | "zamanliHata";
export const UYARI_OLCUTLERI: UyariOlcut[] = ["hataOrani", "p95", "hata5xx", "istek", "fonksiyonHata", "zamanliHata"];
/** Eşik kuralı: pencere (dakika) içindeki ölçüt eşiği geçince bildirim (sessiz kalma süresi boyunca bir kez). */
export type UyariKurali = {
  id: string; ad: string; olcut: UyariOlcut; acik: boolean; olusturma: number;
  /** Yalnız bu yolla başlayan istekler ("/api/odeme" gibi); boşsa hepsi. */ yol?: string;
  pencere: number; esik: number; /** Tetiklendikten sonra yeniden bildirmeden önce beklenecek dakika. */ sessiz: number;
  seviye: "kritik" | "uyari";
  sonDeger?: number; sonDenetim?: number; sonTetik?: number;
  gecmis?: { z: number; deger: number }[];
};
export type BulutAyar = {
  tuz: string;
  duvar: { kurallar: DuvarKurali[]; saldiriModu: boolean };
  bakim: { acik: boolean; mesaj: string; zaman?: number };
  /** Sitenin yapay zekâ isteklerini geçici olarak durdurur (ayar silinmez). */
  aiDuraklat: boolean;
  bildirim: { turler: Record<BildirimTur, boolean>; eposta: string };
  /** Aylık kota dolunca: yalnız uyar ya da siteyi bakım moduna al. */
  kota: { dolunca: "uyar" | "bakim" };
  /** Eşik uyarı kuralları (Bulut > Performans). */
  uyarilar: UyariKurali[];
  /** Sitenin kendi alan adından e-posta gönderimi (Resend alan adı doğrulaması). */
  epostaAlan: EpostaAlan | null;
  /** Üçüncü taraf ölçüm: GA4 ve Meta Pixel; çerez onayı gelince yüklenir (onaysiz: onay beklemeden). */
  izleme: { ga4: string; metaPixel: string; onaysiz: boolean };
};
export type EpostaAlanKaydi = { record?: string; name: string; type: string; value: string; priority?: number; status?: string; ttl?: string };
export type EpostaAlan = { alan: string; resendId: string; durum: string; kayitlar: EpostaAlanKaydi[]; gonderen: string; ad?: string; sonKontrol?: number; eklenme: number };

const KIMLIK = /^[A-Za-z0-9_-]{6,20}$/;
const dosya = (id: string) => path.join(DEPO_KOK, "build", "bulut", `${id}.json`);
const onbellek = new Map<string, { v: BulutAyar; z: number }>();
const kuyruk = new Map<string, Promise<unknown>>();

function tamamla(h: Partial<BulutAyar> | null): BulutAyar {
  const turler = Object.fromEntries(BILDIRIM_TURLERI.map((t) => [t, h?.bildirim?.turler?.[t] ?? true])) as Record<BildirimTur, boolean>;
  return {
    tuz: h?.tuz && h.tuz.length >= 16 ? h.tuz : randomBytes(18).toString("base64url"),
    duvar: { kurallar: Array.isArray(h?.duvar?.kurallar) ? h!.duvar!.kurallar : [], saldiriModu: !!h?.duvar?.saldiriModu },
    bakim: { acik: !!h?.bakim?.acik, mesaj: h?.bakim?.mesaj ?? "", ...(h?.bakim?.zaman ? { zaman: h.bakim.zaman } : {}) },
    aiDuraklat: !!h?.aiDuraklat,
    bildirim: { turler, eposta: h?.bildirim?.eposta ?? "" },
    kota: { dolunca: h?.kota?.dolunca === "bakim" ? "bakim" : "uyar" },
    uyarilar: Array.isArray(h?.uyarilar) ? h!.uyarilar!.filter((x) => x && typeof x.id === "string") : [],
    epostaAlan: h?.epostaAlan && typeof h.epostaAlan.alan === "string" ? h.epostaAlan : null,
    izleme: { ga4: h?.izleme?.ga4 ?? "", metaPixel: h?.izleme?.metaPixel ?? "", onaysiz: !!h?.izleme?.onaysiz },
  };
}

/** Ayarları okur (3 sn önbellek; yayındaki site her istekte çağırır). İlk okumada tuz üretilip yazılır. */
export async function bulutAyarOku(id: string): Promise<BulutAyar> {
  if (!KIMLIK.test(id)) return tamamla(null);
  const o = onbellek.get(id);
  if (o && Date.now() - o.z < 3000) return o.v;
  let ham: Partial<BulutAyar> | null = null;
  try { ham = JSON.parse(await readFile(dosya(id), "utf8")); } catch { /* yok */ }
  const v = tamamla(ham);
  if (!ham?.tuz) await bulutAyarDegistir(id, () => {}).catch(() => {});
  else onbellek.set(id, { v, z: Date.now() });
  return onbellek.get(id)?.v ?? v;
}

/** Ayarı sırayla değiştirir (aynı projeye eşzamanlı yazımlar kuyruğa girer). */
export async function bulutAyarDegistir<T>(id: string, f: (a: BulutAyar) => T | Promise<T>): Promise<T> {
  if (!KIMLIK.test(id)) throw new Error("Proje kimliği geçersiz.");
  const onceki = kuyruk.get(id) ?? Promise.resolve();
  let s!: T;
  const is = onceki.then(async () => {
    let ham: Partial<BulutAyar> | null = null;
    try { ham = JSON.parse(await readFile(dosya(id), "utf8")); } catch { /* yok */ }
    const a = tamamla(ham);
    s = await f(a);
    await mkdir(path.dirname(dosya(id)), { recursive: true });
    await writeFile(dosya(id), JSON.stringify(a));
    onbellek.set(id, { v: a, z: Date.now() });
  });
  kuyruk.set(id, is.catch(() => {}));
  await is;
  return s;
}

/** İstemci IP'si (vekil arkasında ilk x-forwarded-for). Yalnız özetlemek için kullanılır, saklanmaz. */
export const istemciIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "yerel";
/** Tuzlu IP özeti (12 karakter). */
export const ipOzeti = (tuz: string, ip: string) => createHash("sha256").update(`${tuz}|${ip.trim().toLowerCase()}`).digest("base64url").slice(0, 12);
/** İstek ülkesi: yalnız barındırma katmanı başlık eklediyse (Vercel, Cloudflare). Yoksa undefined. */
export function ulkeBul(req: Request): string | undefined {
  const u = (req.headers.get("x-vercel-ip-country") ?? req.headers.get("cf-ipcountry") ?? req.headers.get("x-country-code") ?? "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(u) && u !== "XX" ? u : undefined;
}
/** Kısa tarayıcı ve işletim sistemi adı ("Chrome, Windows"). */
export function tarayiciAdi(ua: string | null): string | undefined {
  const u = ua ?? "";
  if (!u) return undefined;
  const t = /Edg\//.test(u) ? "Edge" : /OPR\/|Opera/.test(u) ? "Opera" : /SamsungBrowser/.test(u) ? "Samsung" : /Firefox\//.test(u) ? "Firefox" : /Chrome\//.test(u) ? "Chrome" : /Safari\//.test(u) ? "Safari" : /bot|crawl|spider/i.test(u) ? "Bot" : /curl|wget|node|python|axios|undici/i.test(u) ? "Betik" : "Diğer";
  const s = /Windows/.test(u) ? "Windows" : /iPhone|iPad|iOS/.test(u) ? "iOS" : /Android/.test(u) ? "Android" : /Mac OS X|Macintosh/.test(u) ? "macOS" : /Linux/.test(u) ? "Linux" : "";
  return s ? `${t}, ${s}` : t;
}
