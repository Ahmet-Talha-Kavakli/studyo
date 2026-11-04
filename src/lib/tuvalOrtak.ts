import { randomBytes, timingSafeEqual } from "crypto";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";

/**
 * Canvas birlikte düzenleme: tuvalin ortak kopyası sunucuda (.veri/tuval-ortak/<id>.json).
 * İstemciler varlık düzeyinde işlem gönderir (düğüm/bağlantı/grup/yorum ekle-güncelle-sil, ad); her işlem sürümü artırır.
 * Aynı varlığı aynı anda değiştirenlerde son yazan kazanır; farklı varlıklar çakışmaz. Bağlantıyı bilen herkes düzenler.
 * Varlık (imleç, seçim) bellekte tutulur; 8 sn sessiz kalan kişi düşer.
 */
export const KOLEKSIYONLAR = ["dugumler", "kenarlar", "gruplar", "yorumlar"] as const;
export type Koleksiyon = (typeof KOLEKSIYONLAR)[number];
type Varlik = { id: string };
export type OrtakBelge = { id: string; ad: string; surum: number; guncelleme: number } & Record<Koleksiyon, Varlik[]>;
export type OrtakIslem = { t: "ust"; k: Koleksiyon; v: Varlik } | { t: "sil"; k: Koleksiyon; id: string } | { t: "ad"; v: string };
export type Kisi = { id: string; ad: string; renk: string; x?: number; y?: number; secili?: string[]; zaman: number };

const DIZIN = path.join(DEPO_KOK, "tuval-ortak");
const KIMLIK = /^[A-Za-z0-9_-]{10}$/;
const SINIR = 3_000_000;
const esit = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

type Kayit = { belge: OrtakBelge; anahtar: string };
const g = globalThis as unknown as { __tuvalOrtak?: Map<string, Kayit>; __tuvalVarlik?: Map<string, Map<string, Kisi>>; __tuvalYazim?: Map<string, ReturnType<typeof setTimeout>> };
const bellek = (g.__tuvalOrtak ??= new Map());
const varliklar = (g.__tuvalVarlik ??= new Map());
const yazimlar = (g.__tuvalYazim ??= new Map());

async function oku(id: string): Promise<Kayit | null> {
  if (!KIMLIK.test(id)) return null;
  const b = bellek.get(id); if (b) return b;
  try { const k = JSON.parse(await readFile(path.join(DIZIN, `${id}.json`), "utf8")) as Kayit; bellek.set(id, k); return k; } catch { return null; }
}
/** Diske yazım gecikmeli ve birleşik (sık işlemlerde disk yorulmasın). */
function kaydet(k: Kayit) {
  const id = k.belge.id; const z = yazimlar.get(id); if (z) clearTimeout(z);
  yazimlar.set(id, setTimeout(() => { yazimlar.delete(id); void mkdir(DIZIN, { recursive: true }).then(() => writeFile(path.join(DIZIN, `${id}.json`), JSON.stringify(k))); }, 800));
}
const temizVarlik = (v: unknown): Varlik | null => (v && typeof v === "object" && typeof (v as Varlik).id === "string" && (v as Varlik).id.length < 64 ? (v as Varlik) : null);

export async function ortakOlustur(g0: Record<string, unknown>) {
  const id = randomBytes(8).toString("base64url").slice(0, 10), anahtar = randomBytes(18).toString("base64url");
  const belge = { id, ad: String(g0.ad ?? "Tuval").slice(0, 80), surum: 1, guncelleme: Date.now() } as OrtakBelge;
  for (const k of KOLEKSIYONLAR) belge[k] = (Array.isArray(g0[k]) ? (g0[k] as unknown[]) : []).map(temizVarlik).filter(Boolean).slice(0, 1000) as Varlik[];
  if (JSON.stringify(belge).length > SINIR) throw new Error("Tuval birlikte düzenleme için çok büyük.");
  const k: Kayit = { belge, anahtar };
  bellek.set(id, k);
  await mkdir(DIZIN, { recursive: true }); await writeFile(path.join(DIZIN, `${id}.json`), JSON.stringify(k));
  return { id, anahtar };
}

export async function ortakOku(id: string, anahtar: string) {
  const k = await oku(id); if (!k || !esit(k.anahtar, anahtar)) return null;
  return k.belge;
}

export async function ortakUygula(id: string, anahtar: string, islemler: OrtakIslem[]) {
  const k = await oku(id); if (!k || !esit(k.anahtar, anahtar)) return null;
  const b = k.belge;
  for (const i of islemler.slice(0, 500)) {
    if (i.t === "ad" && typeof i.v === "string") b.ad = i.v.slice(0, 80);
    else if ((i.t === "ust" || i.t === "sil") && KOLEKSIYONLAR.includes(i.k)) {
      if (i.t === "ust") { const v = temizVarlik(i.v); if (!v) continue; const j = b[i.k].findIndex((x) => x.id === v.id); if (j >= 0) b[i.k][j] = v; else b[i.k].push(v); }
      else b[i.k] = b[i.k].filter((x) => x.id !== i.id);
    }
  }
  if (JSON.stringify(b).length > SINIR) throw new Error("Tuval çok büyüdü.");
  b.surum++; b.guncelleme = Date.now();
  kaydet(k);
  return b.surum;
}

export function varlikYaz(id: string, kisi: Kisi) {
  let m = varliklar.get(id); if (!m) { m = new Map(); varliklar.set(id, m); }
  m.set(kisi.id, { ...kisi, ad: String(kisi.ad).slice(0, 40), zaman: Date.now() });
}
export function digerleri(id: string, ben: string): Kisi[] {
  const m = varliklar.get(id); if (!m) return [];
  const simdi = Date.now();
  for (const [k, v] of m) if (simdi - v.zaman > 8000) m.delete(k);
  return [...m.values()].filter((x) => x.id !== ben);
}

export async function ortakKapat(id: string, anahtar: string) {
  const k = await oku(id); if (!k || !esit(k.anahtar, anahtar)) return false;
  bellek.delete(id); varliklar.delete(id);
  await rm(path.join(DIZIN, `${id}.json`), { force: true }); return true;
}
