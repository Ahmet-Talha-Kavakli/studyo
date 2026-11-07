import "server-only";
import { createHash } from "crypto";
import { mkdir, readFile, stat, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { kullanimArttir } from "./bulutKullanim";

/**
 * Görsel dönüşümleri (Supabase render/image, Netlify Image CDN, Cloudflare Images, Appwrite preview benzeri):
 * dosya adresine ?w=&h=&fit=&fm=&q= eklenince görsel sunucuda boyutlandırılır ve biçimi değiştirilir.
 *  w, h     1 ile 2500 piksel (yalnız biri verilirse oran korunur)
 *  fit      cover (kırp, varsayılan iki boyutta), contain (sığdır, boşluk saydam), fill (esnet), inside (taşmadan küçült)
 *  fm       auto (tarayıcı destekliyorsa avif, yoksa webp), webp, avif, jpeg, png, origin (biçimi koru)
 *  q        20 ile 100 kalite (varsayılan 80)
 * Kaynak en çok 25 MB ve 50 megapiksel; SVG ve animasyonlu olmayan GIF dışı biçimler. Sonuç diskte önbelleğe alınır
 * (aynı dosya ve parametre bir daha üretilmez); yeni üretilen her dönüşüm aylık kullanımda "gorsel" olarak sayılır.
 */
export type Donusum = { w?: number; h?: number; fit: "cover" | "contain" | "fill" | "inside"; fm: "webp" | "avif" | "jpeg" | "png" | "origin"; q: number };
const MIME: Record<string, string> = { webp: "image/webp", avif: "image/avif", jpeg: "image/jpeg", png: "image/png" };
const ONBELLEK = path.join(DEPO_KOK, "build", "depolama-onbellek");
const DONUSEBILIR = /^image\/(png|jpeg|webp|avif|gif|tiff|heic|heif)$/;

/** Sorgu parametrelerinden dönüşüm; parametre yoksa null, geçersizse { hata }. */
export function donusumCoz(q: URLSearchParams, accept: string): Donusum | null | { hata: string } {
  const al = (...a: string[]) => { for (const x of a) { const v = q.get(x); if (v !== null && v !== "") return v; } return null; };
  const ws = al("w", "genislik", "width"), hs = al("h", "yukseklik", "height"), fits = al("fit", "kirp"), fms = al("fm", "bicim", "format"), qs = al("q", "kalite", "quality");
  if (ws === null && hs === null && fits === null && fms === null && qs === null) return null;
  const sayi = (v: string | null, ad: string, min: number, max: number) => { if (v === null) return undefined; const n = Number(v); if (!Number.isInteger(n) || n < min || n > max) throw new Error(`${ad} ${min} ile ${max} arasında tam sayı olmalı`); return n; };
  try {
    const w = sayi(ws, "w", 1, 2500), h = sayi(hs, "h", 1, 2500), kalite = sayi(qs, "q", 20, 100) ?? 80;
    const fit = (fits ?? (w && h ? "cover" : "inside")) as Donusum["fit"];
    if (!["cover", "contain", "fill", "inside"].includes(fit)) return { hata: "fit cover, contain, fill ya da inside olmalı" };
    let fm = (fms ?? "auto").toLowerCase();
    if (fm === "jpg") fm = "jpeg";
    if (fm === "auto") fm = accept.includes("image/avif") ? "avif" : accept.includes("image/webp") || !accept ? "webp" : "jpeg";
    if (!["webp", "avif", "jpeg", "png", "origin"].includes(fm)) return { hata: "fm auto, webp, avif, jpeg, png ya da origin olmalı" };
    return { w, h, fit, fm: fm as Donusum["fm"], q: kalite };
  } catch (e) { return { hata: (e as Error).message }; }
}

export const donusebilirMi = (tur: string) => DONUSEBILIR.test(tur);

/** Görseli dönüştürür (önbellekli). kaynakYolu: önbellek anahtarı için dosyanın diskteki yolu (değişim zamanı). */
export class GorselSiniri extends Error {}
export async function gorselDonustur(projeId: string, kaynakYolu: string, veri: Buffer, tur: string, d: Donusum, izin?: () => boolean): Promise<{ veri: Buffer; tur: string; onbellek: boolean; genislik?: number; yukseklik?: number }> {
  if (veri.length > 25 * 1024 * 1024) throw new Error("Kaynak görsel 25 MB'tan büyük; dönüştürülemez.");
  const st = await stat(kaynakYolu).catch(() => null);
  const anahtar = createHash("sha1").update(`${kaynakYolu}|${st?.mtimeMs ?? 0}|${veri.length}|${d.w ?? ""}|${d.h ?? ""}|${d.fit}|${d.fm}|${d.q}`).digest("hex");
  const cikti = d.fm === "origin" ? tur.replace("image/", "").replace("jpg", "jpeg") : d.fm;
  const hedef = path.join(ONBELLEK, projeId, `${anahtar}.${cikti}`);
  const hazir = await readFile(hedef).catch(() => null);
  if (hazir) return { veri: hazir, tur: MIME[cikti] ?? tur, onbellek: true };
  if (izin && !izin()) throw new GorselSiniri("Çok fazla görsel dönüşümü; biraz sonra tekrar dene.");
  const sharp = (await import("sharp")).default;
  let x = sharp(veri, { limitInputPixels: 50_000_000, animated: false }).rotate();
  if (d.w || d.h) x = x.resize({ width: d.w, height: d.h, fit: d.fit, withoutEnlargement: d.fit === "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } });
  if (cikti === "webp") x = x.webp({ quality: d.q });
  else if (cikti === "avif") x = x.avif({ quality: Math.max(20, d.q - 20) });
  else if (cikti === "jpeg") x = x.flatten({ background: "#ffffff" }).jpeg({ quality: d.q, mozjpeg: true });
  else if (cikti === "png") x = x.png({ compressionLevel: 8 });
  const { data, info } = await x.toBuffer({ resolveWithObject: true });
  await mkdir(path.dirname(hedef), { recursive: true });
  await writeFile(hedef, data).catch(() => {});
  kullanimArttir(projeId, { gorsel: 1 });
  return { veri: data, tur: MIME[cikti] ?? tur, onbellek: false, genislik: info.width, yukseklik: info.height };
}
