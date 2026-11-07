import "server-only";
import { readFile, readdir, stat } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { D, HESAP_KOK, type HesapKaydi } from "@/lib/hesap/depo";
import type { KrediHareketi, PlanKimligi } from "@/lib/hesap/tipler";
import { ODEME_KOK, type OdemeKaydi, type Siparis } from "@/lib/odeme/depo";

/**
 * Yönetim panelinin okuma katmanı. Bütün veriyi depodan doğrudan okur; hiçbir şeyi değiştirmez.
 * Dosya başına (değişme zamanı + boyut) önbellek: değişmeyen dosya yeniden ayrıştırılmaz.
 * Kredi defterinin durum dosyası da ham okunur: krediOzeti dönem dönümünü uygulayıp yazdığı için yönetim görünümü onu çağırmaz.
 */

type Onbellek = Map<string, { m: number; b: number; v: unknown }>;
const G = globalThis as unknown as { __vayraAdminOnbellek?: Onbellek };
const ONB: Onbellek = (G.__vayraAdminOnbellek ??= new Map());

async function dosyaOku<T>(dosya: string, ayristir: (ham: string) => T): Promise<T | null> {
  let s;
  try { s = await stat(dosya); } catch { ONB.delete(dosya); return null; }
  const o = ONB.get(dosya);
  if (o && o.m === s.mtimeMs && o.b === s.size) return o.v as T;
  try {
    const v = ayristir(await readFile(dosya, "utf8"));
    ONB.set(dosya, { m: s.mtimeMs, b: s.size, v });
    if (ONB.size > 60_000) ONB.clear();
    return v;
  } catch { return null; }
}

export const jsonDosya = <T>(dosya: string) => dosyaOku<T>(dosya, (h) => JSON.parse(h) as T);
export async function satirDosya<T>(dosya: string): Promise<T[]> {
  return (await dosyaOku<T[]>(dosya, (h) => {
    const l: T[] = [];
    for (const s of h.split("\n")) { if (!s) continue; try { l.push(JSON.parse(s) as T); } catch { /* yarım satır */ } }
    return l;
  })) ?? [];
}
export async function dizin(d: string): Promise<string[]> { try { return await readdir(d); } catch { return []; } }

/* ── Hesaplar ── */

export async function tumHesaplar(): Promise<HesapKaydi[]> {
  const adlar = (await dizin(D.kullanici)).filter((a) => /^u_[A-Za-z0-9_-]{16}\.json$/.test(a));
  const l = await Promise.all(adlar.map((a) => jsonDosya<HesapKaydi>(path.join(D.kullanici, a))));
  return l.filter((h): h is HesapKaydi => !!h && typeof h.uid === "string");
}

export interface DefterHam {
  uid: string; plan: PlanKimligi; planKredi: number; ekKredi: number; donemBaslangic: number; donemBitis: number; donemToplam: number;
  sonSira: number; ozelKota?: number; planBitis?: number; planOtomatik?: boolean; planGecis?: { zaman: number; plan: PlanKimligi };
}
export const defterOku = (uid: string) => jsonDosya<DefterHam>(path.join(D.kredi, `${uid}.json`));
export const hareketlerOku = (uid: string) => satirDosya<KrediHareketi>(path.join(D.kredi, `${uid}.jsonl`));

/* ── Ödeme ── */

export async function tumSiparisler(): Promise<Siparis[]> {
  const d = path.join(ODEME_KOK, "siparis");
  const adlar = (await dizin(d)).filter((a) => /^VO[A-Z0-9]{14}\.json$/.test(a));
  const l = await Promise.all(adlar.map((a) => jsonDosya<Siparis>(path.join(d, a))));
  return l.filter((s): s is Siparis => !!s && typeof s.no === "string");
}
export async function tumOdemeKayitlari(): Promise<OdemeKaydi[]> {
  const d = path.join(ODEME_KOK, "kullanici");
  const adlar = (await dizin(d)).filter((a) => /^u_[A-Za-z0-9_-]{16}\.json$/.test(a));
  const l = await Promise.all(adlar.map((a) => jsonDosya<OdemeKaydi>(path.join(d, a))));
  return l.filter((k): k is OdemeKaydi => !!k && typeof k.uid === "string");
}

/* ── API anahtarı sahipliği ── */

export async function apiAnahtarSahipleri(): Promise<{ uid: string; baglanma: number }[]> {
  const d = path.join(HESAP_KOK, "api-anahtar");
  const l = await Promise.all((await dizin(d)).filter((a) => a.endsWith(".json")).map((a) => jsonDosya<{ uid: string; baglanma: number }>(path.join(d, a))));
  return l.filter((x): x is { uid: string; baglanma: number } => !!x?.uid);
}

/* ── Süren (zaman uyumsuz) kredi işleri: krediKapi isFaturasiYaz ── */

export interface SurenIs { uid: string; kaynak: string; tutar: number; zaman: number; sahte?: string | null }
export async function surenIsler(): Promise<SurenIs[]> {
  const d = path.join(HESAP_KOK, "kredi-is");
  const l = await Promise.all((await dizin(d)).filter((a) => a.endsWith(".json")).map((a) => jsonDosya<SurenIs>(path.join(d, a))));
  return l.filter((x): x is SurenIs => !!x?.uid);
}

/* ── Yardımcılar ── */

export const GUN_MS = 86_400_000;
/** İstanbul saatine göre gün anahtarı: 2026-11-07. */
export function gunAnahtari(t: number): string {
  return new Date(t + 3 * 3_600_000).toISOString().slice(0, 10);
}
/** Son n günün anahtarları (eskiden yeniye). */
export function sonGunler(n: number, simdi = Date.now()): string[] {
  return Array.from({ length: n }, (_, i) => gunAnahtari(simdi - (n - 1 - i) * GUN_MS));
}
export function sonGorulme(h: HesapKaydi): number {
  return Math.max(h.olusturma, ...h.oturumlar.map((o) => o.sonGorulme ?? 0));
}
export const kisaUid = (uid: string) => uid.slice(0, 8);

/** Kredi hareketinin kaynağını sınıflar (yönetim raporları için). */
export type KaynakSinif = "studyo" | "api" | "build" | "odeme" | "yonetim" | "hediye" | "sistem" | "diger";
export function kaynakSinifi(k: string): KaynakSinif {
  if (k.startsWith("sunucu:api:")) return "api";
  if (k.startsWith("sunucu:") || k.startsWith("istemci:")) return "studyo";
  if (k.startsWith("build")) return "build";
  if (k === "yonetim") return "yonetim";
  if (k.startsWith("hediye") || k.startsWith("promo:") || k.startsWith("gorev:")) return "hediye";
  if (k === "sistem" || k === "abonelik" || k === "profil") return "sistem";
  if (/^(siparis|odeme|VO)/.test(k)) return "odeme";
  return "diger";
}
export const KAYNAK_AD: Record<KaynakSinif, string> = {
  studyo: "Stüdyolar", api: "API", build: "Vayra Build", odeme: "Ödeme", yonetim: "Yönetim", hediye: "Hediye ve görev", sistem: "Plan ve dönem", diger: "Diğer",
};
/** "sunucu:muzik/stem" → "muzik/stem"; "sunucu:api:kid" → "api". */
export function kaynakKisa(k: string): string {
  if (k.startsWith("sunucu:api:")) return "api";
  return k.replace(/^(sunucu|istemci):/, "");
}
const KAYNAK_ETIKET: Record<string, string> = {
  uretim: "Görsel ve video üretimi", upscale: "Büyütme", muzik: "Müzik", "muzik/stem": "Müzik kanal ayırma", "muzik/video": "Müzik videosu",
  "ses/klon": "Ses klonlama", "ses/remix": "Ses remiksi", "ses/tasarim": "Ses tasarımı", "karakter/egit": "Karakter eğitimi", api: "Geliştirici API",
  "build:sohbet": "Build sohbet",
};
export function kaynakEtiket(k: string): string {
  const kisa = kaynakKisa(k);
  return KAYNAK_ETIKET[kisa] ?? KAYNAK_ETIKET[k] ?? kisa;
}

export const DEPO = DEPO_KOK;
