import "server-only";
import { createHash } from "crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import type { OauthAyar } from "./mcpOauth";
import { coz, sifrele } from "./sifre";

/**
 * Uç kullanıcı hesapları: bağlantı "her kullanıcı kendi hesabını bağlar" kipindeyken, sahibin ürününü kullanan
 * kişiler (ör. yayındaki ajanın ziyaretçisi ya da sahibin kendi uygulamasının kullanıcısı) aynı servise kendi
 * hesaplarıyla bağlanır. Her kullanıcının belirteçleri ya da anahtarları ayrı ve şifreli durur; sahibin kimliği
 * bu kullanıcıların çağrılarında hiç kullanılmaz. Bağlanma, 4 saat geçerli şifreli bağlantı adresiyle yapılır.
 * Dosyalar: .veri/build/baglanti-uc/<bağlantı>/<kullanıcı özeti>.json
 */
export type UcYetki = { tokenlar?: string; anahtar?: string; alanlar?: string; oauth?: OauthAyar; kimlikToken?: string };
export type UcHesap = { kullanici: string; yetki: UcYetki; durum: "etkin" | "giris-gerekli"; olusturma: number; guncelleme: number; sonKullanim?: number; cagri: number };
export type UcHesapAcik = Omit<UcHesap, "yetki"> & { yontem: "oauth" | "anahtar" };

const KOK = path.join(DEPO_KOK, "build", "baglanti-uc");
const KIMLIK = /^[A-Za-z0-9_-]{10}$/;
export const ucKullaniciGecerli = (k: unknown): k is string => typeof k === "string" && /^[\w.@:+-]{1,128}$/.test(k);
const ozet = (k: string) => createHash("sha256").update(k).digest("hex").slice(0, 32);
const dosya = (b: string, k: string) => path.join(KOK, b, `${ozet(k)}.json`);
async function oku<T>(f: string): Promise<T | null> { try { return JSON.parse(await readFile(f, "utf8")) as T; } catch { return null; } }

export async function ucOku(baglantiId: string, kullanici: string): Promise<UcHesap | null> {
  if (!KIMLIK.test(baglantiId) || !ucKullaniciGecerli(kullanici)) return null;
  const h = await oku<UcHesap>(dosya(baglantiId, kullanici));
  return h && h.kullanici === kullanici ? h : null;
}
/** Kullanıcının hesabını günceller (yoksa oluşturur). */
export async function ucYaz(baglantiId: string, kullanici: string, f: (h: UcHesap) => void): Promise<UcHesap> {
  const h = (await ucOku(baglantiId, kullanici)) ?? { kullanici, yetki: {}, durum: "etkin", olusturma: Date.now(), guncelleme: Date.now(), cagri: 0 };
  f(h);
  h.guncelleme = Date.now();
  await mkdir(path.join(KOK, baglantiId), { recursive: true });
  await writeFile(dosya(baglantiId, kullanici), JSON.stringify(h));
  return h;
}
export async function ucSil(baglantiId: string, kullanici: string): Promise<boolean> {
  if (!(await ucOku(baglantiId, kullanici))) return false;
  await rm(dosya(baglantiId, kullanici), { force: true });
  return true;
}
export async function ucListele(baglantiId: string): Promise<UcHesapAcik[]> {
  if (!KIMLIK.test(baglantiId)) return [];
  const l = await readdir(path.join(KOK, baglantiId)).catch(() => [] as string[]);
  const o: UcHesapAcik[] = [];
  for (const f of l.filter((x) => x.endsWith(".json")).slice(0, 2000)) {
    const h = await oku<UcHesap>(path.join(KOK, baglantiId, f));
    if (!h) continue;
    const { yetki, ...g } = h;
    o.push({ ...g, yontem: yetki.tokenlar || yetki.oauth ? "oauth" : "anahtar" });
  }
  return o.sort((a, b) => (b.sonKullanim ?? b.guncelleme) - (a.sonKullanim ?? a.guncelleme));
}
export async function ucBaglantiSil(baglantiId: string): Promise<void> {
  if (KIMLIK.test(baglantiId)) await rm(path.join(KOK, baglantiId), { recursive: true, force: true });
}

/* ───────────── Bağlanma adresi belirteci ───────────── */
export const UC_LINK_OMRU = 4 * 3600_000;
type Belirtec = { k: "uc"; b: string; s: string; u: string; t: number; d?: string };
/** Kullanıcıya verilecek bağlanma belirteci: bağlantı, sahip özeti, kullanıcı; 4 saat geçerli, AES-GCM şifreli. */
export function ucBelirteci(g: { baglantiId: string; sahipOz: string; kullanici: string; donus?: string }): string {
  const v: Belirtec = { k: "uc", b: g.baglantiId, s: g.sahipOz, u: g.kullanici, t: Date.now() + UC_LINK_OMRU, ...(g.donus ? { d: g.donus } : {}) };
  return Buffer.from(sifrele(JSON.stringify(v)), "utf8").toString("base64url");
}
export function ucBelirtecCoz(s: unknown): (Omit<Belirtec, "k"> & { suresiDoldu?: boolean }) | null {
  if (typeof s !== "string" || s.length > 3000) return null;
  try {
    const v = JSON.parse(coz(Buffer.from(s, "base64url").toString("utf8")) ?? "null") as Belirtec | null;
    if (!v || v.k !== "uc" || !KIMLIK.test(v.b) || !ucKullaniciGecerli(v.u)) return null;
    return { b: v.b, s: v.s, u: v.u, t: v.t, d: v.d, ...(v.t < Date.now() ? { suresiDoldu: true } : {}) };
  } catch { return null; }
}
export const ucSayfasi = (belirtec: string) => `/panel/build/baglantilar/baglan/${belirtec}`;
