import { randomBytes, timingSafeEqual } from "crypto";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";

/**
 * Canvas uygulaması (/a/<id>): tuvalin seçili girdileri bir forma, seçili çıktıları bir sonuç alanına dönüşür.
 * Akış sunucuda saklanır (.veri/tuval-uygulama/<id>.json); çalıştıran kişi akışı görmez, kendi kredisiyle kendi tarayıcısında çalıştırır.
 * Yalnız yayınlayan gizli anahtarla günceller/kaldırır.
 */
export type UygulamaGirdi = { dugum: string; etiket: string; aciklama?: string; zorunlu?: boolean };
export type UygulamaCikti = { dugum: string; etiket: string };
export type TuvalUygulama = {
  id: string; ad: string; aciklama: string; kapak?: string; renk?: string;
  girdiler: UygulamaGirdi[]; ciktilar: UygulamaCikti[];
  dugumler: unknown[]; kenarlar: unknown[]; olusturma: number; guncelleme: number;
};
const DIZIN = path.join(DEPO_KOK, "tuval-uygulama");
const KIMLIK = /^[A-Za-z0-9_-]{10}$/;
const SINIR = 1_500_000;
const esit = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const yazi = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");

async function hamOku(id: string): Promise<{ kayit: TuvalUygulama; anahtar: string } | null> {
  if (!KIMLIK.test(id)) return null;
  try { return JSON.parse(await readFile(path.join(DIZIN, `${id}.json`), "utf8")); } catch { return null; }
}

function temizle(g: Record<string, unknown>) {
  const dugumler = (Array.isArray(g.dugumler) ? g.dugumler : []).slice(0, 300).map((d: Record<string, unknown>) => ({
    ...d,
    // Üretilen çıktılar uygulamaya taşınmaz; yalnız yüklenen girdiler (varsayılan değer) kalır.
    surumler: (Array.isArray(d.surumler) ? d.surumler : []).slice(-1).filter((s: Record<string, unknown>) => /^(yukle|videoYukle|sesYukle)$/.test(String(d.tur)) && typeof s.url === "string" && !/^(data|blob):/.test(s.url as string)),
    metin: typeof d.metin === "string" ? d.metin.slice(0, 8000) : undefined,
    durum: "bos", eski: false, hata: undefined,
  }));
  const ids = new Set(dugumler.map((d) => String((d as Record<string, unknown>).id)));
  const kenarlar = (Array.isArray(g.kenarlar) ? g.kenarlar : []).slice(0, 1000);
  const girdiler = (Array.isArray(g.girdiler) ? g.girdiler : []).filter((x: Record<string, unknown>) => ids.has(String(x.dugum))).slice(0, 12)
    .map((x: Record<string, unknown>) => ({ dugum: String(x.dugum), etiket: yazi(x.etiket, 60) || "Girdi", aciklama: yazi(x.aciklama, 200) || undefined, zorunlu: !!x.zorunlu }));
  const ciktilar = (Array.isArray(g.ciktilar) ? g.ciktilar : []).filter((x: Record<string, unknown>) => ids.has(String(x.dugum))).slice(0, 12)
    .map((x: Record<string, unknown>) => ({ dugum: String(x.dugum), etiket: yazi(x.etiket, 60) || "Sonuç" }));
  return { dugumler, kenarlar, girdiler, ciktilar };
}

export async function uygulamaYayinla(g: Record<string, unknown>) {
  const v = temizle(g);
  if (!v.ciktilar.length) throw new Error("En az bir çıktı seç.");
  await mkdir(DIZIN, { recursive: true });
  let id = randomBytes(8).toString("base64url").slice(0, 10), anahtar = randomBytes(18).toString("base64url"), olusturma = Date.now();
  const gid = typeof g.id === "string" ? g.id : "", ganahtar = typeof g.anahtar === "string" ? g.anahtar : "";
  if (gid && ganahtar && KIMLIK.test(gid)) { const e = await hamOku(gid); if (e && esit(e.anahtar, ganahtar)) { id = gid; anahtar = ganahtar; olusturma = e.kayit.olusturma; } }
  const kapak = yazi(g.kapak, 2000);
  const kayit: TuvalUygulama = { id, ad: yazi(g.ad, 80) || "Canvas uygulaması", aciklama: yazi(g.aciklama, 400), ...(kapak && !/^(data|blob):/.test(kapak) ? { kapak } : {}), ...v, olusturma, guncelleme: Date.now() };
  const json = JSON.stringify({ kayit, anahtar });
  if (json.length > SINIR) throw new Error("Akış yayınlamak için çok büyük.");
  await writeFile(path.join(DIZIN, `${id}.json`), json);
  return { id, anahtar };
}
export async function uygulamaOku(id: string) { return (await hamOku(id))?.kayit ?? null; }
export async function uygulamaKaldir(id: string, anahtar: string) {
  const e = await hamOku(id); if (!e || !esit(e.anahtar, anahtar)) return false;
  await rm(path.join(DIZIN, `${id}.json`), { force: true }); return true;
}
