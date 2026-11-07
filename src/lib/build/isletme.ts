import "server-only";
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { isletmeTamamla, type IsletmeVeri } from "./isletmeTipler";
import { dilimSaat, dilimTarih, dilimYaz, dilimZaman, tarihGunu } from "./bolge";

/**
 * Vayra İşletme deposu. Ayarlar: .veri/build/isletme/<proje>.json. Kayıt listeleri (randevu, yazı, yorum, sohbet, abone,
 * çeviri): .veri/build/isletme-kayit/<proje>/<tür>.json. Aynı dosyaya eşzamanlı yazımlar sıraya girer; yazım önce geçici
 * dosyaya yapılıp taşınır (yarım dosya kalmaz).
 */
const KOK = path.join(DEPO_KOK, "build", "isletme");
const KAYIT = path.join(DEPO_KOK, "build", "isletme-kayit");
const KIMLIK = /^[A-Za-z0-9_-]{4,64}$/;
const kilit = new Map<string, Promise<unknown>>();

async function guvenliYaz(dosya: string, veri: unknown) {
  await mkdir(path.dirname(dosya), { recursive: true });
  const gecici = `${dosya}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(gecici, JSON.stringify(veri));
  await rename(gecici, dosya);
}
function sirala<T>(anahtar: string, f: () => Promise<T>): Promise<T> {
  const onceki = kilit.get(anahtar) ?? Promise.resolve();
  const is = onceki.then(f, f);
  kilit.set(anahtar, is.catch(() => {}));
  return is;
}

export async function isletmeOku(id: string): Promise<IsletmeVeri> {
  if (!KIMLIK.test(id)) return isletmeTamamla({});
  try { return isletmeTamamla(JSON.parse(await readFile(path.join(KOK, `${id}.json`), "utf8"))); } catch { return isletmeTamamla({}); }
}
export function isletmeDegistir<T>(id: string, f: (v: IsletmeVeri) => T | Promise<T>): Promise<T> {
  if (!KIMLIK.test(id)) throw new Error("Proje kimliği geçersiz.");
  return sirala(`a:${id}`, async () => {
    const v = await isletmeOku(id);
    const s = await f(v);
    v.guncelleme = Date.now();
    await guvenliYaz(path.join(KOK, `${id}.json`), v);
    return s;
  });
}

export type KayitTuru = "randevular" | "yazilar" | "yorumlar" | "sohbetler" | "aboneler" | "ceviriler" | "olaylar";
const kayitDosyasi = (id: string, tur: KayitTuru) => path.join(KAYIT, id, `${tur}.json`);
export async function listeOku<T>(id: string, tur: KayitTuru): Promise<T[]> {
  if (!KIMLIK.test(id)) return [];
  try { const v = JSON.parse(await readFile(kayitDosyasi(id, tur), "utf8")); return Array.isArray(v) ? (v as T[]) : []; } catch { return []; }
}
export function listeDegistir<T, S = void>(id: string, tur: KayitTuru, f: (l: T[]) => S | Promise<S>, sinir = 5000): Promise<S> {
  if (!KIMLIK.test(id)) throw new Error("Proje kimliği geçersiz.");
  return sirala(`l:${id}:${tur}`, async () => {
    const l = await listeOku<T>(id, tur);
    const s = await f(l);
    await guvenliYaz(kayitDosyasi(id, tur), l.slice(-sinir));
    return s;
  });
}
/** İşletme verisi olan projeler (zamanlayıcı taraması için). */
export async function isletmeProjeleri(): Promise<string[]> {
  const l = await readdir(KOK).catch(() => [] as string[]);
  return l.filter((x) => x.endsWith(".json")).map((x) => x.slice(0, -5)).filter((x) => KIMLIK.test(x));
}

/**
 * Silinmiş projenin işletme verisini temizler: proje ne projeler ne de çöp kutusu klasöründeyse (kalıcı silinmiş)
 * ayar dosyası ve kayıt klasörü kaldırılır. Çöpteki proje geri alınabileceği için verisi korunur.
 */
export async function artikTemizle(id: string): Promise<boolean> {
  if (!KIMLIK.test(id)) return false;
  const var_ = async (f: string) => !!(await stat(f).catch(() => null));
  const b = path.join(DEPO_KOK, "build");
  if ((await var_(path.join(b, "projeler", `${id}.json`))) || (await var_(path.join(b, "cop-proje", `${id}.json`)))) return false;
  await rm(path.join(KOK, `${id}.json`), { force: true });
  await rm(path.join(KAYIT, id), { recursive: true, force: true });
  return true;
}

/* ───────── istek yardımcıları ───────── */
export function ipBul(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "";
  return !ip || ip === "::1" || ip.startsWith("::ffff:127.") ? "127.0.0.1" : ip.replace(/^::ffff:/, "").slice(0, 39);
}
export function kokenBul(req: Request) {
  const h = req.headers, u = new URL(req.url);
  return `${h.get("x-forwarded-proto")?.split(",")[0] ?? u.protocol.replace(":", "")}://${h.get("x-forwarded-host")?.split(",")[0] ?? h.get("host") ?? u.host}`;
}
const GS = globalThis as unknown as { __vayraIsletmeSayac?: Map<string, number[]> };
const sayac = (GS.__vayraIsletmeSayac ??= new Map<string, number[]>());
/** Dakikalık (ya da verilen pencerede) hız sınırı: sınır aşıldıysa true. */
export function sinirli(anahtar: string, n: number, pencere = 60_000): boolean {
  const s = Date.now(), l = (sayac.get(anahtar) ?? []).filter((t) => s - t < pencere);
  l.push(s); sayac.set(anahtar, l);
  if (sayac.size > 20_000) for (const [k, v] of sayac) if (!v.some((t) => s - t < 3600_000)) sayac.delete(k);
  return l.length > n;
}
/**
 * Saat dilimi yardımcıları (eski adlar korunur). tz verilmezse Türkiye saati: yalnız işletme kaydı olmayan eski çağrılar
 * içindir; işletme kodu her zaman v.profil.saatDilimi geçirir.
 */
export const TR = 3 * 3600_000;
const VARS_TZ = "Europe/Istanbul";
export const trTarih = (z: number, tz = VARS_TZ) => dilimTarih(z, tz);
export const trSaat = (z: number, tz = VARS_TZ) => dilimSaat(z, tz);
/** "YYYY-MM-DD" + "HH:MM" (verilen saat diliminde) → epoch ms. */
export const trZaman = (tarih: string, saat: string, tz = VARS_TZ) => dilimZaman(tarih, saat, tz);
export const trGun = (tarih: string) => tarihGunu(tarih); // Pazartesi 0
export const trYaz = (z: number, tz = VARS_TZ) => dilimYaz(z, tz);
export const htmlKacir = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
