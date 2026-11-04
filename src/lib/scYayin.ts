import { randomBytes, timingSafeEqual } from "crypto";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";

/**
 * Usta site/uygulama yayını (Lovable/v0 "Publish", Higgsfield Games "Deployed"): çalışan tek dosya HTML
 * sunucuda saklanır (.veri/sc-yayin/<id>.json) ve /y/<id> adresinden kum havuzunda (CSP sandbox) sunulur.
 * Yalnız yayınlayan kişi gizli anahtarla günceller ya da kaldırır. "remix" açıksa başkaları kendi sohbetine kopyalayabilir.
 */
export type ScYayin = { id: string; ad: string; html: string; tur: string; remix: boolean; olusturma: number; guncelleme: number };

const DIZIN = path.join(DEPO_KOK, "sc-yayin");
const KIMLIK = /^[A-Za-z0-9_-]{10}$/;
const SINIR = 600_000;
const esit = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

async function hamOku(id: string): Promise<{ kayit: ScYayin; anahtar: string } | null> {
  if (!KIMLIK.test(id)) return null;
  try { return JSON.parse(await readFile(path.join(DIZIN, `${id}.json`), "utf8")); } catch { return null; }
}

export async function scYayinla(g: { ad?: unknown; html?: unknown; tur?: unknown; remix?: unknown; id?: string; anahtar?: string }) {
  const html = typeof g.html === "string" ? g.html : "";
  if (!html.trim()) throw new Error("Yayınlanacak içerik yok.");
  if (html.length > SINIR) throw new Error("Site yayınlamak için çok büyük (en çok 600 KB).");
  await mkdir(DIZIN, { recursive: true });
  let id = randomBytes(8).toString("base64url").slice(0, 10), anahtar = randomBytes(18).toString("base64url"), olusturma = Date.now();
  if (g.id && g.anahtar && KIMLIK.test(g.id)) {
    const eski = await hamOku(g.id);
    if (eski && esit(eski.anahtar, g.anahtar)) { id = g.id; anahtar = g.anahtar; olusturma = eski.kayit.olusturma; }
  }
  const kayit: ScYayin = { id, ad: String(g.ad ?? "Vayra uygulaması").slice(0, 120), html, tur: String(g.tur ?? "site").slice(0, 20), remix: g.remix === true, olusturma, guncelleme: Date.now() };
  await writeFile(path.join(DIZIN, `${id}.json`), JSON.stringify({ kayit, anahtar }));
  return { id, anahtar, guncelleme: kayit.guncelleme };
}

export async function scYayinOku(id: string) { return (await hamOku(id))?.kayit ?? null; }

export async function scYayinKaldir(id: string, anahtar: string) {
  const eski = await hamOku(id);
  if (!eski || !esit(eski.anahtar, anahtar)) return false;
  await rm(path.join(DIZIN, `${id}.json`), { force: true });
  return true;
}
