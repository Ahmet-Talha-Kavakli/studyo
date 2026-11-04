import { randomBytes } from "crypto";
import { mkdir, readFile, writeFile, stat } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";

/**
 * Herkese açık paylaşım bağlantıları (/p/<id>). Yalnız depodaki gerçek dosyalar paylaşılabilir;
 * kayıt .veri/paylasim/<id>.json olarak saklanır. Kimlik tahmin edilemez (12 karakter).
 */
export type PaylasimTur = "ses" | "muzik";
export interface Paylasim {
  id: string; tur: PaylasimTur; url: string; baslik: string; alt?: string; metin?: string; kapak?: string; renk?: string;
  kelimeler?: { k: string; b: number; s: number }[]; olusturma: number;
}

const DIZIN = path.join(DEPO_KOK, "paylasim");
const DOSYA = /^\/api\/dosya\/(ses|muzik)\/([0-9a-f-]{36}\.[a-z0-9]{2,4})$/;

export async function paylasimKaydet(g: Omit<Paylasim, "id" | "olusturma">): Promise<Paylasim> {
  const m = g.url.match(DOSYA);
  if (!m || m[1] !== g.tur) throw new Error("Yalnız sağlayıcıyla üretilmiş dosyalar paylaşılabilir.");
  await stat(path.join(DEPO_KOK, m[1], m[2])).catch(() => { throw new Error("Dosya bulunamadı."); });
  const kayit: Paylasim = {
    id: randomBytes(9).toString("base64url"), tur: g.tur, url: g.url, baslik: g.baslik.slice(0, 120), olusturma: Date.now(),
    ...(g.alt ? { alt: g.alt.slice(0, 160) } : {}), ...(g.metin ? { metin: g.metin.slice(0, 5000) } : {}),
    ...(g.kapak && /^\/(gercek|api\/dosya)\//.test(g.kapak) ? { kapak: g.kapak } : {}),
    ...(g.renk && /^#[0-9a-f]{6}$/i.test(g.renk) ? { renk: g.renk } : {}),
    ...(Array.isArray(g.kelimeler) ? { kelimeler: g.kelimeler.slice(0, 4000) } : {}),
  };
  await mkdir(DIZIN, { recursive: true });
  await writeFile(path.join(DIZIN, `${kayit.id}.json`), JSON.stringify(kayit));
  return kayit;
}

export async function paylasimOku(id: string): Promise<Paylasim | null> {
  if (!/^[A-Za-z0-9_-]{12}$/.test(id)) return null;
  try { return JSON.parse(await readFile(path.join(DIZIN, `${id}.json`), "utf8")) as Paylasim; } catch { return null; }
}
