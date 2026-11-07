import "server-only";
import type { CihazTuru } from "./tipler";

/**
 * Hesap uçlarının ortak güvenlik katmanı: yanıt yardımcıları, köken (CSRF) denetimi, hız sınırı, giriş kilidi.
 * Hız sınırı ve kilit süreç belleğinde tutulur (tek sunucu; yeniden başlayınca sıfırlanır).
 */

export const gelistirme = () => process.env.NODE_ENV !== "production";

const BASLIK = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

export function tamam(veri: Record<string, unknown> = {}, durum = 200, ek?: HeadersInit): Response {
  const h = new Headers({ ...BASLIK, "Content-Type": "application/json" });
  if (ek) new Headers(ek).forEach((v, k) => h.append(k, v));
  return new Response(JSON.stringify({ ok: true, ...veri }), { status: durum, headers: h });
}

export function hata(mesaj: string, durum = 400, ek: Record<string, unknown> = {}, baslik?: HeadersInit): Response {
  const h = new Headers({ ...BASLIK, "Content-Type": "application/json" });
  if (baslik) new Headers(baslik).forEach((v, k) => h.append(k, v));
  return new Response(JSON.stringify({ ok: false, hata: mesaj, ...ek }), { status: durum, headers: h });
}

/** Set-Cookie birden çok olabildiği için Headers ile kurulur. */
export function cerezliYanit(veri: Record<string, unknown>, cerezler: string[], durum = 200): Response {
  const h = new Headers({ ...BASLIK, "Content-Type": "application/json" });
  for (const c of cerezler) h.append("Set-Cookie", c);
  return new Response(JSON.stringify({ ok: true, ...veri }), { status: durum, headers: h });
}

export async function govdeOku<T = Record<string, unknown>>(req: Request, sinir = 64_000): Promise<T | null> {
  try {
    const metin = await req.text();
    if (metin.length > sinir) return null;
    const v = metin ? JSON.parse(metin) : {};
    return v && typeof v === "object" && !Array.isArray(v) ? (v as T) : null;
  } catch { return null; }
}

/* ── İstek bilgisi ── */

export function istemciIp(req: Request): string {
  const x = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (x || req.headers.get("x-real-ip") || "yerel").slice(0, 64);
}
/** Gösterim için IP'nin son bölümü gizlenir. */
export const ipGizle = (ip: string) => (ip.includes(".") ? ip.replace(/\.\d+$/, ".x") : ip.includes(":") ? ip.replace(/:[0-9a-f]*$/i, ":x") : ip);

export function cihazOku(ua: string | null) {
  const s = ua ?? "";
  const tarayici = /Edg\//.test(s) ? "Edge" : /OPR\//.test(s) ? "Opera" : /Firefox\//.test(s) ? "Firefox" : /Chrome\//.test(s) ? "Chrome" : /Safari\//.test(s) ? "Safari" : /node|undici|curl/i.test(s) ? "Uygulama" : "Tarayıcı";
  const surum = s.match(/(?:Edg|OPR|Firefox|Chrome|Version)\/(\d+)/)?.[1];
  const isletim = /Windows/.test(s) ? "Windows" : /iPhone|iPad/.test(s) ? "iOS" : /Mac OS X/.test(s) ? "macOS" : /Android/.test(s) ? "Android" : /Linux/.test(s) ? "Linux" : "Bilinmeyen sistem";
  const tur: CihazTuru = /iPad|Tablet/.test(s) ? "tablet" : /Mobi|iPhone|Android/.test(s) ? "mobil" : "masaustu";
  return { tarayici: surum ? `${tarayici} ${surum}` : tarayici, isletim, tur };
}
export const cihazAdi = (req: Request) => { const c = cihazOku(req.headers.get("user-agent")); return `${c.tarayici} · ${c.isletim}`; };

/* ── Köken denetimi (CSRF) ── */

/** İsteğin dış kökeni. VAYRA_KOKEN tanımlıysa o esastır. */
export function istekKokeni(req: Request): string {
  const env = process.env.VAYRA_KOKEN?.replace(/\/+$/, "");
  if (env) return env;
  const h = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const p = req.headers.get("x-forwarded-proto") ?? (h && /^(localhost|127\.0\.0\.1)(:|$)/.test(h) ? "http" : "https");
  return h ? `${p}://${h}` : new URL(req.url).origin;
}

/**
 * Durum değiştiren isteklerde Origin aynı site olmalı. Origin yoksa Sec-Fetch-Site'a bakılır; ikisi de yoksa
 * istek tarayıcıdan gelmiyordur (curl, sunucu) ve çerezle kimlik taşıyamayacağı için CSRF riski yoktur.
 */
export function kokenDenetle(req: Request): Response | null {
  const m = req.method.toUpperCase();
  if (m === "GET" || m === "HEAD" || m === "OPTIONS") return null;
  const origin = req.headers.get("origin");
  if (origin) {
    const izinli = new Set<string>();
    const kendi = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    if (kendi) izinli.add(kendi.toLowerCase());
    for (const k of [process.env.VAYRA_KOKEN, ...(process.env.VAYRA_IZINLI_KOKENLER ?? "").split(",")]) {
      try { if (k?.trim()) izinli.add(new URL(k.trim()).host.toLowerCase()); } catch { /* geçersiz */ }
    }
    let host = "";
    try { host = new URL(origin).host.toLowerCase(); } catch { /* "null" köken */ }
    if (!host || !izinli.has(host)) return hata("Bu istek başka bir siteden geldiği için reddedildi.", 403, { kod: "koken" });
    return null;
  }
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return hata("Bu istek başka bir siteden geldiği için reddedildi.", 403, { kod: "koken" });
  return null;
}

/* ── Hız sınırı (kayan pencere) ── */

const G = globalThis as unknown as { __vayraHiz?: Map<string, number[]>; __vayraKilit?: Map<string, { hata: number; bitis: number; son: number }> };
const KOVA = (G.__vayraHiz ??= new Map());
const KILIT = (G.__vayraKilit ??= new Map());
/** Geliştirmede IP sınırları beş kat gevşek: aynı makineden yapılan testler birbirini kilitlemesin. */
const carpan = () => (gelistirme() ? 5 : 1);

function temizle() {
  if (KOVA.size < 5000) return;
  const simdi = Date.now();
  for (const [k, l] of KOVA) if (!l.length || l[l.length - 1] < simdi - 3_600_000) KOVA.delete(k);
}

/** sinir/pencere aşıldıysa beklenecek saniyeyi döndürür; aşılmadıysa 0 ve sayaç bir artar. */
export function hizSiniri(anahtar: string, sinir: number, pencereMs: number, ipSiniri = true): number {
  temizle();
  const simdi = Date.now();
  const tavan = ipSiniri ? sinir * carpan() : sinir;
  const l = (KOVA.get(anahtar) ?? ([] as number[])).filter((t: number) => t > simdi - pencereMs);
  if (l.length >= tavan) { KOVA.set(anahtar, l); return Math.max(1, Math.ceil((l[0] + pencereMs - simdi) / 1000)); }
  l.push(simdi);
  KOVA.set(anahtar, l);
  return 0;
}

export const hizHatasi = (sn: number) =>
  hata(`Çok fazla deneme yapıldı. ${sn > 90 ? `${Math.ceil(sn / 60)} dakika` : `${sn} saniye`} sonra yeniden dene.`, 429, { kod: "hiz", bekle: sn }, { "Retry-After": String(sn) });

/* ── Giriş kilidi: e-posta başına art arda hatalı deneme (hesap olsun olmasın aynı davranış) ── */

/** Kilitliyse kalan saniye; değilse 0. */
export function kilitKalan(anahtar: string): number {
  const k = KILIT.get(anahtar);
  if (!k) return 0;
  return k.bitis > Date.now() ? Math.ceil((k.bitis - Date.now()) / 1000) : 0;
}
/** Hatalı deneme yazar; kilit başladıysa saniyesini döndürür. 5 hatada 1 dk, 10'da 5 dk, 15 ve sonrasında 15 dk. */
export function hataliDeneme(anahtar: string): number {
  const simdi = Date.now();
  const k = KILIT.get(anahtar) ?? { hata: 0, bitis: 0, son: 0 };
  if (k.son < simdi - 3_600_000) k.hata = 0;
  k.hata += 1; k.son = simdi;
  if (k.hata >= 5 && k.hata % 5 === 0) k.bitis = simdi + (k.hata >= 15 ? 15 : k.hata >= 10 ? 5 : 1) * 60_000;
  KILIT.set(anahtar, k);
  return k.bitis > simdi ? Math.ceil((k.bitis - simdi) / 1000) : 0;
}
export const basariliGiris = (anahtar: string) => { KILIT.delete(anahtar); };
export const kilitHatasi = (sn: number) =>
  hata(`Çok fazla hatalı deneme. Güvenliğin için giriş ${sn > 90 ? `${Math.ceil(sn / 60)} dakika` : `${sn} saniye`} kilitlendi.`, 429, { kod: "kilit", bekle: sn }, { "Retry-After": String(sn) });
