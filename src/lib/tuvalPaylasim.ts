import { randomBytes, timingSafeEqual } from "crypto";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";

/**
 * Canvas paylaşımı (/t/<id>): tuvalin o anki salt okunur kopyası sunucuda (.veri/tuval-paylasim/<id>.json).
 * Yalnız paylaşan kişi gizli anahtarla günceller/kaldırır. Kopya, açan kişinin kendi Canvas'ına "Kopyasını aç" ile alınabilir.
 */
export type TuvalPaylasim = { id: string; ad: string; dugumler: unknown[]; kenarlar: unknown[]; olusturma: number; guncelleme: number };
const DIZIN = path.join(DEPO_KOK, "tuval-paylasim");
const KIMLIK = /^[A-Za-z0-9_-]{10}$/;
const SINIR = 1_500_000;
const esit = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

async function hamOku(id: string): Promise<{ kayit: TuvalPaylasim; anahtar: string } | null> {
  if (!KIMLIK.test(id)) return null;
  try { return JSON.parse(await readFile(path.join(DIZIN, `${id}.json`), "utf8")); } catch { return null; }
}

/** İstemciden gelen düğümleri sadeleştirir: data: URL'leri (yerel) ve aşırı büyük alanlar atılır. */
function temizle(g: { dugumler?: unknown; kenarlar?: unknown }) {
  const dugumler = (Array.isArray(g.dugumler) ? g.dugumler : []).slice(0, 300).map((d: Record<string, unknown>) => ({
    ...d,
    surumler: (Array.isArray(d.surumler) ? d.surumler : []).slice(-12).map((s: Record<string, unknown>) => ({ ...s, url: typeof s.url === "string" && !s.url.startsWith("data:") && !s.url.startsWith("blob:") ? s.url.slice(0, 2000) : undefined, metin: typeof s.metin === "string" ? s.metin.slice(0, 8000) : undefined })),
    metin: typeof d.metin === "string" ? d.metin.slice(0, 8000) : undefined,
    durum: "bitti",
  }));
  const kenarlar = (Array.isArray(g.kenarlar) ? g.kenarlar : []).slice(0, 1000);
  return { dugumler, kenarlar };
}

export async function tuvalPaylas(g: { ad?: unknown; dugumler?: unknown; kenarlar?: unknown; id?: string; anahtar?: string }) {
  const v = temizle(g);
  if (!v.dugumler.length) throw new Error("Paylaşılacak düğüm yok.");
  await mkdir(DIZIN, { recursive: true });
  let id = randomBytes(8).toString("base64url").slice(0, 10), anahtar = randomBytes(18).toString("base64url"), olusturma = Date.now();
  if (g.id && g.anahtar && KIMLIK.test(g.id)) { const e = await hamOku(g.id); if (e && esit(e.anahtar, g.anahtar)) { id = g.id; anahtar = g.anahtar; olusturma = e.kayit.olusturma; } }
  const kayit: TuvalPaylasim = { id, ad: String(g.ad ?? "Tuval").slice(0, 80), ...v, olusturma, guncelleme: Date.now() };
  const json = JSON.stringify({ kayit, anahtar });
  if (json.length > SINIR) throw new Error("Tuval paylaşmak için çok büyük.");
  await writeFile(path.join(DIZIN, `${id}.json`), json);
  return { id, anahtar };
}
export async function tuvalPaylasimOku(id: string) { return (await hamOku(id))?.kayit ?? null; }
export async function tuvalPaylasimKaldir(id: string, anahtar: string) {
  const e = await hamOku(id); if (!e || !esit(e.anahtar, anahtar)) return false;
  await rm(path.join(DIZIN, `${id}.json`), { force: true }); return true;
}
