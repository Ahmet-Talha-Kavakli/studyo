import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { appendFile, mkdir, readdir, readFile, rename, rm, stat, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";

/**
 * Vayra Bulut dosya depolama: proje başına kovalar. Kova kuralı: okuma "herkes" (açık adres) ya da "imzali"
 * (süreli imzalı bağlantı); yükleme "kapali" | "uyeler" | "herkes" (yayındaki sitedeki vayra.dosya.yukle için).
 * Boyut ve tür sınırları kova başına; proje toplamı 500 MB.
 * Klasörler: dosya adı "klasor/alt/ad.png" biçiminde yol olabilir (en çok 5 düzey); klasörler diskte gerçek klasördür,
 * boş klasör de tutulur. Herkese açık kovalarda önbellek süresi ve "değişmez" işareti kova başına ayarlanır
 * (Cache-Control; tarayıcı ve CDN). Büyük dosyalar parçalı ve kaldığı yerden sürdürülebilir yüklenir (5 MB parçalar,
 * oturum 24 saat geçerli).
 * Dosyalar: .veri/build/depolama/<projeId>/<kova>/<yol>, ayarlar .veri/build/depolama/<projeId>/_kovalar.json,
 * yarım yüklemeler .veri/build/depolama-parca/<projeId>/<oturum>.(json|bin)
 */
export type KovaOnbellek = { /** saniye; 0: önbelleğe alınmaz */ sure: number; /** Dosya adı değişmeden içerik değişmez (immutable). */ degismez: boolean };
export type Kova = { ad: string; okuma: "herkes" | "imzali"; yukleme: "kapali" | "uyeler" | "herkes"; boyutMb: number; turler: string[]; olusturma: number; onbellek?: KovaOnbellek };
export type DosyaBilgi = { ad: string; boyut: number; tur: string; zaman: number };
export type KlasorBilgi = { ad: string; yol: string; dosya: number; boyut: number; zaman: number };

const KOK = path.join(DEPO_KOK, "build", "depolama");
const PARCA_KOK = path.join(DEPO_KOK, "build", "depolama-parca");
export const KOVA_ADI = /^[a-z0-9][a-z0-9-]{1,30}$/;
export const DOSYA_ADI = /^[A-Za-z0-9._-]{1,120}$/;
const SEGMENT = /^(?!\.{1,2}$)[A-Za-z0-9._-]{1,120}$/;
export const PROJE_SINIRI = 500 * 1024 * 1024;
export const KOVA_BOYUT_SINIRI = 500;
export const VARSAYILAN_ONBELLEK: KovaOnbellek = { sure: 3600, degismez: false };
const kovaDosyasi = (p: string) => path.join(KOK, p, "_kovalar.json");

/** Dosya ya da klasör yolu geçerli mi ("a/b/c.png"; her parça güvenli, en çok 6 parça, 300 karakter). */
export function yolGecerli(y: string, klasor = false): boolean {
  if (!y || y.length > 300) return false;
  const l = y.split("/");
  if (l.length > (klasor ? 5 : 6)) return false;
  return l.every((x) => SEGMENT.test(x)) && (klasor || l.length > 0);
}
/** Klasör yolunu temizler: baştaki ve sondaki eğik çizgiler atılır, Türkçe harfler sadeleşir; geçersizse null. */
export function klasorTemizle(ham: string | null | undefined): string | null {
  const t = String(ham ?? "").trim().replace(/^\/+|\/+$/g, "");
  if (!t) return "";
  const y = t.split("/").map((x) => guvenliParca(x)).filter(Boolean).join("/");
  return yolGecerli(y, true) ? y : null;
}

export async function kovalar(projeId: string): Promise<Kova[]> { try { return JSON.parse(await readFile(kovaDosyasi(projeId), "utf8")); } catch { return []; } }
export async function kovalariYaz(projeId: string, l: Kova[]) { await mkdir(path.join(KOK, projeId), { recursive: true }); await writeFile(kovaDosyasi(projeId), JSON.stringify(l)); }

const TURLER: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", svg: "image/svg+xml", avif: "image/avif", mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime", mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", m4a: "audio/mp4", pdf: "application/pdf", json: "application/json", txt: "text/plain; charset=utf-8", csv: "text/csv; charset=utf-8", zip: "application/zip", glb: "model/gltf-binary", gltf: "model/gltf+json", woff2: "font/woff2" };
export const turBul = (ad: string) => TURLER[ad.split(".").pop()?.toLowerCase() ?? ""] ?? "application/octet-stream";

/** Önbellek başlığı: herkese açık kovada kova ayarı, imzalı kovada kısa ve özel. */
export function onbellekBasligi(k: Kova): string {
  if (k.okuma !== "herkes") return "private, max-age=300";
  const o = k.onbellek ?? VARSAYILAN_ONBELLEK;
  if (o.sure <= 0) return "no-cache";
  return `public, max-age=${o.sure}, s-maxage=${o.sure}${o.degismez ? ", immutable" : ", stale-while-revalidate=60"}`;
}

const kovaKok = (projeId: string, kova: string) => path.join(KOK, projeId, kova);
const tamYol = (projeId: string, kova: string, y: string) => path.join(kovaKok(projeId, kova), ...y.split("/"));

/** Klasördeki dosyalar (alt klasörlerdekiler hariç). ad: kovaya göre tam yol. */
export async function dosyalar(projeId: string, kova: string, klasor = ""): Promise<DosyaBilgi[]> {
  if (klasor && !yolGecerli(klasor, true)) return [];
  const d = klasor ? tamYol(projeId, kova, klasor) : kovaKok(projeId, kova);
  const l = await readdir(d, { withFileTypes: true }).catch(() => []);
  const o: DosyaBilgi[] = [];
  for (const e of l) {
    if (!e.isFile()) continue;
    const s = await stat(path.join(d, e.name)).catch(() => null);
    if (s) o.push({ ad: klasor ? `${klasor}/${e.name}` : e.name, boyut: s.size, tur: turBul(e.name), zaman: s.mtimeMs });
  }
  return o.sort((a, b) => b.zaman - a.zaman);
}
/** Kovadaki bütün dosyalar (bütün klasörler; arama ve kullanım için). */
export async function tumDosyalar(projeId: string, kova: string, sinir = 5000): Promise<DosyaBilgi[]> {
  const o: DosyaBilgi[] = [];
  async function gez(klasor: string, derinlik: number) {
    if (derinlik > 5 || o.length >= sinir) return;
    const d = klasor ? tamYol(projeId, kova, klasor) : kovaKok(projeId, kova);
    for (const e of await readdir(d, { withFileTypes: true }).catch(() => [])) {
      if (o.length >= sinir) return;
      const y = klasor ? `${klasor}/${e.name}` : e.name;
      if (e.isDirectory()) { if (SEGMENT.test(e.name)) await gez(y, derinlik + 1); continue; }
      if (!e.isFile()) continue;
      const s = await stat(path.join(d, e.name)).catch(() => null);
      if (s) o.push({ ad: y, boyut: s.size, tur: turBul(e.name), zaman: s.mtimeMs });
    }
  }
  await gez("", 0);
  return o.sort((a, b) => b.zaman - a.zaman);
}
/** Klasörün alt klasörleri, içlerindeki (bütün düzeylerdeki) dosya sayısı ve boyutla. */
export async function klasorler(projeId: string, kova: string, klasor = ""): Promise<KlasorBilgi[]> {
  if (klasor && !yolGecerli(klasor, true)) return [];
  const d = klasor ? tamYol(projeId, kova, klasor) : kovaKok(projeId, kova);
  const o: KlasorBilgi[] = [];
  const hepsi = await tumDosyalar(projeId, kova);
  for (const e of await readdir(d, { withFileTypes: true }).catch(() => [])) {
    if (!e.isDirectory() || !SEGMENT.test(e.name)) continue;
    const y = klasor ? `${klasor}/${e.name}` : e.name;
    const ic = hepsi.filter((f) => f.ad.startsWith(`${y}/`));
    const s = await stat(path.join(d, e.name)).catch(() => null);
    o.push({ ad: e.name, yol: y, dosya: ic.length, boyut: ic.reduce((t, f) => t + f.boyut, 0), zaman: Math.max(s?.mtimeMs ?? 0, ...ic.map((f) => f.zaman)) });
  }
  return o.sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
}
export async function kullanim(projeId: string): Promise<{ boyut: number; dosya: number }> {
  let boyut = 0, dosya = 0;
  for (const k of await kovalar(projeId)) for (const f of await tumDosyalar(projeId, k.ad, 100_000)) { boyut += f.boyut; dosya++; }
  return { boyut, dosya };
}

const TR: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", Ç: "C", Ğ: "G", İ: "I", Ö: "O", Ş: "S", Ü: "U" };
const guvenliParca = (x: string) => x.replace(/[çğıöşüÇĞİÖŞÜ]/g, (h) => TR[h] ?? h).replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^[-.]+|-+$/g, "").slice(0, 100);
/** Benzersiz, güvenli dosya adı (çakışırsa sonuna ek). */
export function guvenliAd(ad: string): string {
  const temiz = guvenliParca(ad.split(/[\\/]/).pop() ?? ad).slice(-100) || "dosya";
  return /\.[A-Za-z0-9]{1,6}$/.test(temiz) ? temiz : `${temiz}.bin`;
}

function kovaDenetle(k: Kova, ad: string, boyut: number) {
  if (boyut > k.boyutMb * 1024 * 1024) throw new Error(`Dosya bu kova için çok büyük (${k.boyutMb} MB sınırı).`);
  const tur = turBul(ad);
  if (k.turler.length && !k.turler.some((x) => tur.startsWith(x))) throw new Error("Bu dosya türü bu kovaya yüklenemez.");
  return tur;
}
async function benzersizYol(projeId: string, k: Kova, klasor: string, ad: string) {
  let son = guvenliAd(ad);
  const d = klasor ? tamYol(projeId, k.ad, klasor) : kovaKok(projeId, k.ad);
  await mkdir(d, { recursive: true });
  if (await stat(path.join(d, son)).catch(() => null)) son = son.replace(/(\.[^.]+)$/, `-${randomBytes(3).toString("hex")}$1`);
  return { d, son, yol: klasor ? `${klasor}/${son}` : son };
}

export async function dosyaYaz(projeId: string, k: Kova, ad: string, veri: Buffer, klasor = ""): Promise<DosyaBilgi> {
  const tur = kovaDenetle(k, ad, veri.length);
  if (klasor && !yolGecerli(klasor, true)) throw new Error("Klasör yolu geçersiz.");
  const u = await kullanim(projeId);
  if (u.boyut + veri.length > PROJE_SINIRI) throw new Error("Proje depolama sınırı (500 MB) doldu.");
  const b = await benzersizYol(projeId, k, klasor, ad);
  await writeFile(path.join(b.d, b.son), veri);
  return { ad: b.yol, boyut: veri.length, tur, zaman: Date.now() };
}
export async function dosyaOku(projeId: string, kova: string, ad: string): Promise<Buffer | null> {
  if (!KOVA_ADI.test(kova) || !yolGecerli(ad)) return null;
  return readFile(tamYol(projeId, kova, ad)).catch(() => null);
}
export const dosyaYolu = (projeId: string, kova: string, ad: string) => (KOVA_ADI.test(kova) && yolGecerli(ad) ? tamYol(projeId, kova, ad) : null);
export async function dosyaSil(projeId: string, kova: string, ad: string) { if (KOVA_ADI.test(kova) && yolGecerli(ad)) await rm(tamYol(projeId, kova, ad), { force: true }); }
export async function kovaSil(projeId: string, kova: string) { if (KOVA_ADI.test(kova)) await rm(kovaKok(projeId, kova), { recursive: true, force: true }); }

/** Boş klasör oluşturur. */
export async function klasorOlustur(projeId: string, kova: string, yol: string) {
  if (!KOVA_ADI.test(kova) || !yolGecerli(yol, true)) throw new Error("Klasör adı yalnız harf, rakam, nokta, tire ve alt çizgi olabilir (en çok 5 düzey).");
  await mkdir(tamYol(projeId, kova, yol), { recursive: true });
}
/** Klasörü içindekilerle siler; silinen dosya sayısını döner. */
export async function klasorSil(projeId: string, kova: string, yol: string): Promise<number> {
  if (!KOVA_ADI.test(kova) || !yolGecerli(yol, true)) throw new Error("Klasör yolu geçersiz.");
  const n = (await tumDosyalar(projeId, kova)).filter((f) => f.ad.startsWith(`${yol}/`)).length;
  await rm(tamYol(projeId, kova, yol), { recursive: true, force: true });
  return n;
}
/** Dosyayı taşır ya da yeniden adlandırır (hedef yol dolu ise hata). */
export async function dosyaTasi(projeId: string, kova: string, eski: string, yeni: string) {
  if (!KOVA_ADI.test(kova) || !yolGecerli(eski) || !yolGecerli(yeni)) throw new Error("Yol geçersiz.");
  if (eski === yeni) return;
  if (await stat(tamYol(projeId, kova, yeni)).catch(() => null)) throw new Error("Hedefte bu adla bir dosya zaten var.");
  if (!(await stat(tamYol(projeId, kova, eski)).catch(() => null))) throw new Error("Dosya bulunamadı.");
  await mkdir(path.dirname(tamYol(projeId, kova, yeni)), { recursive: true });
  await rename(tamYol(projeId, kova, eski), tamYol(projeId, kova, yeni));
}

/* ── Parçalı ve sürdürülebilir yükleme ── */
export type ParcaOturumu = { id: string; kova: string; ad: string; klasor: string; boyut: number; alinan: number; olusturma: number; guncelleme: number; tur: string };
const OTURUM = /^[A-Za-z0-9_-]{16,32}$/;
export const PARCA_BOYUTU = 5 * 1024 * 1024;
const parcaYolu = (projeId: string, id: string, uz: "json" | "bin") => path.join(PARCA_KOK, projeId, `${id}.${uz}`);
const parcaKilit = new Map<string, Promise<unknown>>();

async function parcaTemizle(projeId: string) {
  const d = path.join(PARCA_KOK, projeId);
  const sinir = Date.now() - 24 * 3600_000;
  for (const f of await readdir(d).catch(() => [] as string[])) {
    if (!f.endsWith(".json")) continue;
    const o = await readFile(path.join(d, f), "utf8").then((t) => JSON.parse(t) as ParcaOturumu).catch(() => null);
    if (!o || o.guncelleme < sinir) { await rm(path.join(d, f), { force: true }); await rm(path.join(d, f.replace(/\.json$/, ".bin")), { force: true }); }
  }
}
/** Yarım yüklemeler (panel için). */
export async function parcaOturumlari(projeId: string): Promise<ParcaOturumu[]> {
  const d = path.join(PARCA_KOK, projeId);
  const o: ParcaOturumu[] = [];
  for (const f of await readdir(d).catch(() => [] as string[])) if (f.endsWith(".json")) { const x = await readFile(path.join(d, f), "utf8").then((t) => JSON.parse(t) as ParcaOturumu).catch(() => null); if (x) o.push(x); }
  return o.sort((a, b) => b.guncelleme - a.guncelleme);
}
export async function parcaBaslat(projeId: string, k: Kova, g: { ad: string; boyut: number; klasor?: string }): Promise<ParcaOturumu> {
  const boyut = Math.round(Number(g.boyut));
  if (!(boyut > 0)) throw new Error("Dosya boyutu geçersiz.");
  const ad = guvenliAd(String(g.ad ?? "dosya"));
  const tur = kovaDenetle(k, ad, boyut);
  const klasor = klasorTemizle(g.klasor);
  if (klasor === null) throw new Error("Klasör yolu geçersiz.");
  await parcaTemizle(projeId).catch(() => {});
  const bekleyen = (await parcaOturumlari(projeId)).reduce((t, x) => t + x.boyut, 0);
  const u = await kullanim(projeId);
  if (u.boyut + bekleyen + boyut > PROJE_SINIRI) throw new Error("Proje depolama sınırı (500 MB) doldu.");
  if ((await parcaOturumlari(projeId)).length >= 20) throw new Error("Aynı anda en çok 20 yarım yükleme olabilir; bitmeyenler 24 saat sonra silinir.");
  const o: ParcaOturumu = { id: randomBytes(12).toString("base64url"), kova: k.ad, ad, klasor, boyut, alinan: 0, olusturma: Date.now(), guncelleme: Date.now(), tur };
  await mkdir(path.join(PARCA_KOK, projeId), { recursive: true });
  await writeFile(parcaYolu(projeId, o.id, "bin"), Buffer.alloc(0));
  await writeFile(parcaYolu(projeId, o.id, "json"), JSON.stringify(o));
  return o;
}
export async function parcaOku(projeId: string, id: string): Promise<ParcaOturumu | null> {
  if (!OTURUM.test(id)) return null;
  return readFile(parcaYolu(projeId, id, "json"), "utf8").then((t) => JSON.parse(t) as ParcaOturumu).catch(() => null);
}
export class ParcaHatasi extends Error { constructor(m: string, public durum = 400, public alinan?: number) { super(m); } }
/** Parçayı ekler; ofset alınan baytla aynı olmalı (değilse 409 ve doğru ofset döner). */
export async function parcaYaz(projeId: string, id: string, ofset: number, veri: Buffer): Promise<ParcaOturumu> {
  const anahtar = `${projeId}:${id}`;
  const onceki = parcaKilit.get(anahtar) ?? Promise.resolve();
  let sonuc!: ParcaOturumu;
  const is = onceki.catch(() => {}).then(async () => {
    const o = await parcaOku(projeId, id);
    if (!o) throw new ParcaHatasi("Yükleme oturumu bulunamadı ya da süresi doldu; baştan başlat.", 404);
    if (ofset !== o.alinan) throw new ParcaHatasi("Parça sırası kaydı; kaldığı yerden sür.", 409, o.alinan);
    if (veri.length > PARCA_BOYUTU + 1024) throw new ParcaHatasi("Parça en çok 5 MB olabilir.", 413);
    if (o.alinan + veri.length > o.boyut) throw new ParcaHatasi("Gönderilen veri dosya boyutunu aşıyor.", 400);
    await appendFile(parcaYolu(projeId, id, "bin"), veri);
    o.alinan += veri.length; o.guncelleme = Date.now();
    await writeFile(parcaYolu(projeId, id, "json"), JSON.stringify(o));
    sonuc = o;
  });
  parcaKilit.set(anahtar, is.catch(() => {}));
  await is;
  return sonuc;
}
/** Bütün parçalar geldiyse dosyayı yerine koyar. */
export async function parcaBitir(projeId: string, k: Kova, id: string): Promise<DosyaBilgi> {
  const o = await parcaOku(projeId, id);
  if (!o || o.kova !== k.ad) throw new ParcaHatasi("Yükleme oturumu bulunamadı.", 404);
  if (o.alinan !== o.boyut) throw new ParcaHatasi(`Dosyanın ${o.alinan} / ${o.boyut} baytı geldi; kalanını gönder.`, 409, o.alinan);
  const b = await benzersizYol(projeId, k, o.klasor, o.ad);
  await rename(parcaYolu(projeId, id, "bin"), path.join(b.d, b.son));
  await rm(parcaYolu(projeId, id, "json"), { force: true });
  return { ad: b.yol, boyut: o.boyut, tur: o.tur, zaman: Date.now() };
}
export async function parcaIptal(projeId: string, id: string) {
  if (!OTURUM.test(id)) return;
  await rm(parcaYolu(projeId, id, "json"), { force: true });
  await rm(parcaYolu(projeId, id, "bin"), { force: true });
}

/* ── İmzalı bağlantı ── */
const gizli = () => process.env.VAYRA_SIFRE_ANAHTARI ?? process.env.ANTHROPIC_API_KEY ?? "vayra-yerel-imza";
export const imzala = (projeId: string, kova: string, ad: string, bitis: number) => createHmac("sha256", gizli()).update(`${projeId}/${kova}/${ad}/${bitis}`).digest("base64url").slice(0, 32);
export function imzaGecerli(projeId: string, kova: string, ad: string, bitis: number, imza: string): boolean {
  if (!Number.isFinite(bitis) || bitis < Date.now()) return false;
  const a = Buffer.from(imzala(projeId, kova, ad, bitis)), b = Buffer.from(imza);
  return a.length === b.length && timingSafeEqual(a, b);
}
