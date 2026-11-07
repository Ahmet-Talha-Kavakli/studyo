import "server-only";
import { randomBytes } from "crypto";
import { mkdir, readFile, rename, rm, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { coz, sifrele } from "./sifre";
import { kilitle } from "./sistemDepo";

/**
 * Hesap düzeyi sistem değişkenleri ve sırları (sahip başına tek dosya):
 *   sistem-degisken/<sahipOzeti>.json  { degiskenler: [{ ad, deger, aciklama }], sirlar: [{ ad, sifreli, sonu, aciklama }] }
 * Değişkenler {{degisken.ad}}, sırlar {{sir.ad}} ile kullanılır. Sırlar AES-256-GCM ile şifreli saklanır (sifre.ts),
 * tarayıcıya hiç gitmez; çalışmada çözülür ve adım girdisinde, çıktısında, hatasında ve günlüğünde maskelenir.
 */
export type Degisken = { ad: string; deger: string; aciklama?: string; guncelleme: number };
export type Sir = { ad: string; sifreli: string; sonu: string; aciklama?: string; guncelleme: number };
type Dosya = { degiskenler: Degisken[]; sirlar: Sir[] };
export const DEGISKEN_ADI = /^[A-Za-z_][A-Za-z0-9_]{0,39}$/;
export const DEGISKEN_SINIR = { adet: 100, deger: 10_000 };
export const MASKE = "••••";

const dosya = (sahipOz: string) => path.join(DEPO_KOK, "build", "sistem-degisken", `${sahipOz}.json`);
async function oku(sahipOz: string): Promise<Dosya> {
  try { const v = JSON.parse(await readFile(dosya(sahipOz), "utf8")) as Partial<Dosya>; return { degiskenler: v.degiskenler ?? [], sirlar: v.sirlar ?? [] }; } catch { return { degiskenler: [], sirlar: [] }; }
}
async function yaz(sahipOz: string, v: Dosya) {
  const f = dosya(sahipOz);
  await mkdir(path.dirname(f), { recursive: true });
  const g = `${f}.${randomBytes(4).toString("hex")}.tmp`;
  await writeFile(g, JSON.stringify(v));
  try { await rename(g, f); } catch { await writeFile(f, JSON.stringify(v)); await rm(g, { force: true }); }
}

/** İstemciye giden liste: değişkenlerin değeri görünür, sırların yalnız son 4 karakteri. */
export async function degiskenListesi(sahipOz: string) {
  const v = await oku(sahipOz);
  return { degiskenler: v.degiskenler, sirlar: v.sirlar.map(({ sifreli: _s, ...x }) => x) };
}

export type DegiskenIslem =
  | { islem: "degisken"; ad: string; deger: string; aciklama?: string; eskiAd?: string }
  | { islem: "sir"; ad: string; deger?: string; aciklama?: string; eskiAd?: string }
  | { islem: "sil"; tur: "degisken" | "sir"; ad: string };

/** Ekle, güncelle ya da sil. Hata varsa metni döner. */
export function degiskenDegistir(sahipOz: string, g: DegiskenIslem): Promise<string | null> {
  return kilitle(`degisken:${sahipOz}`, async () => {
    const v = await oku(sahipOz);
    if (g.islem === "sil") {
      if (g.tur === "degisken") v.degiskenler = v.degiskenler.filter((x) => x.ad !== g.ad); else v.sirlar = v.sirlar.filter((x) => x.ad !== g.ad);
      await yaz(sahipOz, v);
      return null;
    }
    const ad = String(g.ad ?? "").trim();
    if (!DEGISKEN_ADI.test(ad)) return "Ad harfle ya da alt çizgiyle başlamalı; yalnız harf, rakam ve alt çizgi, en çok 40 karakter.";
    const aciklama = typeof g.aciklama === "string" ? g.aciklama.trim().slice(0, 200) || undefined : undefined;
    const eski = g.eskiAd && g.eskiAd !== ad ? g.eskiAd : ad;
    if (g.islem === "degisken") {
      const deger = String(g.deger ?? "");
      if (deger.length > DEGISKEN_SINIR.deger) return "Değer en çok 10.000 karakter olabilir.";
      if (ad !== eski && v.degiskenler.some((x) => x.ad === ad)) return "Bu adda bir değişken zaten var.";
      const i = v.degiskenler.findIndex((x) => x.ad === eski);
      if (i < 0 && v.degiskenler.length >= DEGISKEN_SINIR.adet) return "En çok 100 değişken olabilir.";
      const y: Degisken = { ad, deger, aciklama, guncelleme: Date.now() };
      if (i >= 0) v.degiskenler[i] = y; else v.degiskenler.push(y);
    } else {
      if (ad !== eski && v.sirlar.some((x) => x.ad === ad)) return "Bu adda bir sır zaten var.";
      const i = v.sirlar.findIndex((x) => x.ad === eski);
      if (i < 0 && !g.deger) return "Sırrın değerini yaz.";
      if (i < 0 && v.sirlar.length >= DEGISKEN_SINIR.adet) return "En çok 100 sır olabilir.";
      const deger = g.deger ? String(g.deger) : null;
      if (deger && deger.length > DEGISKEN_SINIR.deger) return "Değer en çok 10.000 karakter olabilir.";
      const onceki = i >= 0 ? v.sirlar[i] : null;
      const y: Sir = deger ? { ad, sifreli: sifrele(deger), sonu: deger.length > 8 ? deger.slice(-4) : "", aciklama, guncelleme: Date.now() } : { ...onceki!, ad, aciklama, guncelleme: Date.now() };
      if (i >= 0) v.sirlar[i] = y; else v.sirlar.push(y);
    }
    await yaz(sahipOz, v);
    return null;
  });
}

/** Çalışma bağlamı: değişkenler ve çözülmüş sırlar. */
export async function calismaDegiskenleri(sahipOz: string): Promise<{ degisken: Record<string, string>; sir: Record<string, string> }> {
  const v = await oku(sahipOz);
  const sir: Record<string, string> = {};
  for (const x of v.sirlar) { const d = coz(x.sifreli); if (d !== null) sir[x.ad] = d; }
  return { degisken: Object.fromEntries(v.degiskenler.map((x) => [x.ad, x.deger])), sir };
}

/** Sır değerlerini derinlemesine maskeleyen işlev (4 karakterden kısa sırlar maskelenmez; yanlış eşleşme olmasın). */
export function maskeleyici(sirlar: Record<string, string>): <T>(v: T) => T {
  const l = [...new Set(Object.values(sirlar).filter((x) => x.length >= 4))].sort((a, b) => b.length - a.length);
  if (!l.length) return (v) => v;
  const metin = (s: string) => { let o = s; for (const x of l) if (o.includes(x)) o = o.split(x).join(MASKE); return o; };
  const gez = (v: unknown, d: number): unknown => {
    if (typeof v === "string") return metin(v);
    if (!v || typeof v !== "object" || d > 30) return v;
    if (Array.isArray(v)) return v.map((x) => gez(x, d + 1));
    return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, gez(x, d + 1)]));
  };
  return <T,>(v: T) => gez(v, 0) as T;
}
