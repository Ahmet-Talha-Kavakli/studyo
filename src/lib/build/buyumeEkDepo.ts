import "server-only";
import { createHmac, randomBytes } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { mkdir, readFile, rename, rm, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { bosEk, type EkVeri } from "./buyumeEkTipler";

/**
 * Büyüme v4 deposu: .veri/build/buyume-ek/<projeId>.json (kişi bilgileri, segmentler, kampanyalar, bağlantılar,
 * denemeler, marka kiti, kodlar, paylaşım saatleri, rakipler, SEO, raporlar). Proje başına sıralı yazım.
 * Ayrıca: kısa bağlantı dizini (kod → proje), deneme izleri (tekil ziyaretçi), imza anahtarı ve hız sınırı.
 */
const KOK = path.join(DEPO_KOK, "build", "buyume-ek");
const KIMLIK = /^[A-Za-z0-9_-]{12}$/;
const dosya = (id: string) => path.join(KOK, `${id}.json`);
type GT = { __vayraBuyumeEkKilit?: Map<string, Promise<unknown>>; __vayraKisaDizin?: Record<string, string>; __vayraBuyumeHiz?: Map<string, number[]>; __vayraDeneyIz?: Map<string, DeneyIz>; __vayraDeneyIzZ?: ReturnType<typeof setTimeout> | null; __vayraBuyumeAnahtar?: Buffer };
const G = globalThis as unknown as GT;
const kilit = (G.__vayraBuyumeEkKilit ??= new Map());
export const projeKimligiGecerli = (id: string) => KIMLIK.test(id);

export async function ekOku(id: string): Promise<EkVeri> {
  if (!KIMLIK.test(id)) return bosEk();
  try { const v = JSON.parse(await readFile(dosya(id), "utf8")) as Partial<EkVeri>; const b = bosEk(); return { ...b, ...v, seo: { ...b.seo, ...(v.seo ?? {}) }, tavsiye: { ...b.tavsiye, ...(v.tavsiye ?? {}) } }; } catch { return bosEk(); }
}

/** Oku, değiştir, yaz (proje başına sıralı). Değiştirici hata atarsa dosyaya dokunulmaz. */
export function ekGuncelle<T = void>(id: string, f: (v: EkVeri) => T | Promise<T>): Promise<{ v: EkVeri; sonuc: T }> {
  if (!KIMLIK.test(id)) return Promise.reject(new Error("Geçersiz proje."));
  const onceki = kilit.get(id) ?? Promise.resolve();
  const is = onceki.then(async () => {
    const v = await ekOku(id);
    const sonuc = await f(v);
    v.guncelleme = Date.now();
    const ham = JSON.stringify(v);
    if (ham.length > 8_000_000) throw new Error("Büyüme verisi çok büyüdü; eski kampanyaları ya da raporları sil.");
    await mkdir(KOK, { recursive: true });
    const gecici = `${dosya(id)}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(gecici, ham);
    try { await rename(gecici, dosya(id)); } catch { await writeFile(dosya(id), ham); await rm(gecici, { force: true }); }
    return { v, sonuc };
  });
  kilit.set(id, is.catch(() => {}));
  return is;
}
export async function ekSil(id: string) { if (KIMLIK.test(id)) await rm(dosya(id), { force: true }); }

/* ── Kısa bağlantı dizini: kod → proje ── */
const KISA = path.join(DEPO_KOK, "build", "buyume-kisa.json");
function kisaDizin(): Record<string, string> {
  if (G.__vayraKisaDizin) return G.__vayraKisaDizin;
  try { G.__vayraKisaDizin = JSON.parse(readFileSync(KISA, "utf8")); } catch { G.__vayraKisaDizin = {}; }
  return G.__vayraKisaDizin!;
}
const kisaYaz = () => { mkdirSync(path.dirname(KISA), { recursive: true }); writeFileSync(KISA, JSON.stringify(kisaDizin())); };
export const kisaBul = (kod: string): string | null => kisaDizin()[kod.toLowerCase()] ?? null;
/** Kodu ayırır; başkasına aitse false. */
export function kisaAyir(kod: string, projeId: string): boolean {
  const k = kod.toLowerCase(), d = kisaDizin();
  if (d[k] && d[k] !== projeId) return false;
  d[k] = projeId; kisaYaz(); return true;
}
export function kisaBirak(kod: string, projeId: string) { const k = kod.toLowerCase(), d = kisaDizin(); if (d[k] === projeId) { delete d[k]; kisaYaz(); } }
export function kisaKodUret(): string {
  const A = "abcdefghijkmnpqrstuvwxyz23456789";
  for (;;) { const k = [...randomBytes(6)].map((b) => A[b % A.length]).join(""); if (!kisaDizin()[k]) return k; }
}

/* ── Bio sayfası dizini: kod → proje (/l/<kod>) ── */
const BIO = path.join(DEPO_KOK, "build", "buyume-bio.json");
const GB = globalThis as unknown as { __vayraBioDizin?: Record<string, string> };
function bioDizin(): Record<string, string> {
  if (GB.__vayraBioDizin) return GB.__vayraBioDizin;
  try { GB.__vayraBioDizin = JSON.parse(readFileSync(BIO, "utf8")); } catch { GB.__vayraBioDizin = {}; }
  return GB.__vayraBioDizin!;
}
const bioYaz = () => { mkdirSync(path.dirname(BIO), { recursive: true }); writeFileSync(BIO, JSON.stringify(bioDizin())); };
export const bioBul = (kod: string): string | null => bioDizin()[kod.toLowerCase()] ?? null;
/** Bio kodunu ayırır (başkasınınsa false); eski kodu bırakır. */
export function bioAyir(kod: string, projeId: string, eski?: string): boolean {
  const k = kod.toLowerCase(), d = bioDizin();
  if (d[k] && d[k] !== projeId) return false;
  if (eski && eski !== k && d[eski] === projeId) delete d[eski];
  d[k] = projeId; bioYaz(); return true;
}
export function bioBirak(kod: string, projeId: string) { const k = kod.toLowerCase(), d = bioDizin(); if (d[k] === projeId) { delete d[k]; bioYaz(); } }

/* ── Deneme izleri: tekil görüş ve dönüşüm (ziyaretçi kimliği), ayrı dosya, 3 sn'de bir diske ── */
type DeneyIz = { g: { a: string[]; b: string[] }; d: { a: string[]; b: string[] }; kirli?: boolean };
const izler = (G.__vayraDeneyIz ??= new Map());
const izDosya = (p: string, d: string) => path.join(DEPO_KOK, "build", "buyume-deney", `${p}-${d}.json`);
function izAl(p: string, d: string): DeneyIz {
  const a = `${p}-${d}`;
  let x = izler.get(a);
  if (!x) {
    try { x = JSON.parse(readFileSync(izDosya(p, d), "utf8")) as DeneyIz; } catch { x = { g: { a: [], b: [] }, d: { a: [], b: [] } }; }
    izler.set(a, x);
  }
  return x;
}
function izYaz() {
  G.__vayraDeneyIzZ = null;
  for (const [a, x] of izler) {
    if (!x.kirli) continue;
    x.kirli = false;
    const [p, d] = [a.slice(0, 12), a.slice(13)];
    try { mkdirSync(path.dirname(izDosya(p, d)), { recursive: true }); writeFileSync(izDosya(p, d), JSON.stringify({ g: x.g, d: x.d })); } catch { x.kirli = true; }
  }
}
export function deneyIzEkle(p: string, d: string, kol: "a" | "b", z: string, tur: "gor" | "don"): boolean {
  const x = izAl(p, d);
  const l = (tur === "gor" ? x.g : x.d)[kol];
  if (l.includes(z) || l.length >= 100_000) return false;
  if (tur === "don" && !x.g[kol].includes(z) && !x.g[kol === "a" ? "b" : "a"].includes(z)) return false;
  l.push(z); x.kirli = true;
  if (!G.__vayraDeneyIzZ) G.__vayraDeneyIzZ = setTimeout(izYaz, 3000);
  return true;
}
export function deneySayac(p: string, d: string) { const x = izAl(p, d); return { a: { g: x.g.a.length, d: x.d.a.length }, b: { g: x.g.b.length, d: x.d.b.length } }; }
export function deneyIzSil(p: string, d: string) { izler.delete(`${p}-${d}`); try { if (existsSync(izDosya(p, d))) rm(izDosya(p, d), { force: true }).catch(() => {}); } catch { /* yok */ } }

/* ── İmza (e-posta izleme ve çıkma belirteçleri) ── */
function anahtar(): Buffer {
  if (G.__vayraBuyumeAnahtar) return G.__vayraBuyumeAnahtar;
  const f = path.join(DEPO_KOK, "build", ".buyume-anahtari");
  if (existsSync(f)) return (G.__vayraBuyumeAnahtar = Buffer.from(readFileSync(f, "utf8").trim(), "base64url"));
  mkdirSync(path.dirname(f), { recursive: true });
  const y = randomBytes(32);
  writeFileSync(f, y.toString("base64url"), { mode: 0o600 });
  return (G.__vayraBuyumeAnahtar = y);
}
export const imza = (s: string) => createHmac("sha256", anahtar()).update(s).digest("base64url").slice(0, 22);
/** Belirteç: base64url(proje.kampanya.alıcı) + "." + imza. */
export const belirtecUret = (p: string, k: string, i: number) => { const g = Buffer.from(`${p}.${k}.${i}`).toString("base64url"); return `${g}.${imza(g)}`; };
export function belirtecCoz(t: string): { p: string; k: string; i: number } | null {
  const [g, s] = t.split(".");
  if (!g || !s || imza(g) !== s) return null;
  const [p, k, i] = Buffer.from(g, "base64url").toString("utf8").split(".");
  const n = Number(i);
  return p && k && Number.isInteger(n) && n >= 0 ? { p, k, i: n } : null;
}
/** Çıkanlar listesinde kalıcı çıkma bağlantısı (kampanyadan bağımsız; deneme e-postası için de). */
export const cikBelirteci = (p: string, eposta: string) => { const g = Buffer.from(`${p}.${eposta}`).toString("base64url"); return `${g}.${imza("c" + g)}`; };
export function cikBelirteciCoz(t: string): { p: string; eposta: string } | null {
  const [g, s] = t.split(".");
  if (!g || !s || imza("c" + g) !== s) return null;
  const m = Buffer.from(g, "base64url").toString("utf8");
  const i = m.indexOf(".");
  return i === 12 ? { p: m.slice(0, 12), eposta: m.slice(13) } : null;
}

/* ── Hız sınırı (bellekte) ── */
const hiz = (G.__vayraBuyumeHiz ??= new Map());
export function hizAsildi(anahtar: string, adet: number, ms = 60_000): boolean {
  const z = Date.now();
  const l = (hiz.get(anahtar) ?? []).filter((t: number) => z - t < ms);
  l.push(z); hiz.set(anahtar, l);
  if (hiz.size > 20_000) for (const [k, v] of hiz) if (!v.length || z - v[v.length - 1] > ms) hiz.delete(k);
  return l.length > adet;
}
export const istekIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "yerel";
