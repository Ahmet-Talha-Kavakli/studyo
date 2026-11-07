import "server-only";
import { randomBytes } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { nodeYukle } from "./belgeYukle";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { guvenliFetch } from "@/lib/guvenliAg";
import { sahipOzeti } from "./depo";
import { belgeGirdisi, docxUret, kucukHazirla, onizlemeHazirla, ozetYaz, pptxUret, sunumGirdisi, tabloGirdisi, xlsxUret } from "./belgeUret";
import { dosyaAdiYap, type BelgeGirdi, type DosyaBicim, type DosyaBilgisi, type KucukOnizleme, type SunumGirdi, type TabloGirdi } from "./belgeTipler";

/**
 * Sohbette üretilen ve yüklenen Office dosyaları. Her kayıt: ikili dosya (<id>.<uzantı>) + bilgi (<id>.json:
 * yapılandırılmış içerik, sürüm, zincir kökü). Aynı dosyanın sürümleri bir zincirdir (zincir/<kök>.json); yüklenen
 * dosya sürüm 1 olur, ajanın düzenlediği hâli sürüm 2. Dosyalar tahmin edilemez kimlikle
 * /api/build/sohbet/belge/<id>.<uzantı> adresinden sunulur.
 */
const KLASOR = path.join(DEPO_KOK, "build", "sohbet-belge");
const KIMLIK = /^[A-Za-z0-9_-]{24}$/;
export const belgeKimligiGecerli = (id: string) => KIMLIK.test(id);
const bilgiYolu = (id: string) => path.join(KLASOR, `${id}.json`);
const dosyaYolu = (id: string, b: DosyaBicim) => path.join(KLASOR, `${id}.${b}`);
const zincirYolu = (kok: string) => path.join(KLASOR, "zincir", `${kok}.json`);

export type BelgeKaydi = {
  id: string; bicim: DosyaBicim; ad: string; boyut: number; zaman: number; surum: number; kok: string; onceki?: string;
  sahip?: string; sohbet?: string; yuklenen?: boolean; girdi: BelgeGirdi | TabloGirdi | SunumGirdi; ozet: string; kucuk: KucukOnizleme;
};

export const belgeUrl = (k: Pick<BelgeKaydi, "id" | "bicim">) => `/api/build/sohbet/belge/${k.id}.${k.bicim}`;
export const belgeBilgisi = (k: BelgeKaydi): DosyaBilgisi => ({ id: k.id, url: belgeUrl(k), ad: k.ad, bicim: k.bicim, boyut: k.boyut, surum: k.surum, ozet: k.ozet, kucuk: k.kucuk, zaman: k.zaman, ...(k.onceki ? { onceki: k.onceki } : {}) });

export async function belgeGetir(id: string): Promise<BelgeKaydi | null> {
  if (!KIMLIK.test(id)) return null;
  try { return JSON.parse(await readFile(bilgiYolu(id), "utf8")) as BelgeKaydi; } catch { return null; }
}
export async function belgeBaytlari(k: BelgeKaydi): Promise<Buffer | null> {
  try { return await readFile(dosyaYolu(k.id, k.bicim)); } catch { return null; }
}
/** Zincirdeki bütün sürümler (eskiden yeniye). */
export async function belgeSurumleri(k: BelgeKaydi): Promise<DosyaBilgisi[]> {
  let l: string[] = [];
  try { l = JSON.parse(await readFile(zincirYolu(k.kok), "utf8")) as string[]; } catch { l = [k.id]; }
  const o: DosyaBilgisi[] = [];
  for (const id of l.slice(-40)) { const x = id === k.id ? k : await belgeGetir(id); if (x) o.push(belgeBilgisi(x)); }
  return o.sort((a, b) => a.surum - b.surum);
}

async function kaydet(g: { bicim: DosyaBicim; ad: string; bayt: Buffer; girdi: BelgeKaydi["girdi"]; onceki?: BelgeKaydi | null; sahip?: string; sohbet?: string; yuklenen?: boolean }): Promise<BelgeKaydi> {
  await mkdir(path.join(KLASOR, "zincir"), { recursive: true });
  const id = randomBytes(18).toString("base64url");
  const kok = g.onceki?.kok ?? id;
  const k: BelgeKaydi = {
    id, bicim: g.bicim, ad: dosyaAdiYap(g.ad, g.bicim), boyut: g.bayt.length, zaman: Date.now(), surum: (g.onceki?.surum ?? 0) + 1, kok,
    ...(g.onceki ? { onceki: g.onceki.id } : {}), ...(g.sahip ? { sahip: sahipOzeti(g.sahip) } : {}), ...(g.sohbet ? { sohbet: g.sohbet } : {}), ...(g.yuklenen ? { yuklenen: true } : {}),
    girdi: g.girdi, ozet: ozetYaz(g.bicim, g.girdi), kucuk: kucukHazirla(g.bicim, g.girdi),
  };
  await writeFile(dosyaYolu(id, g.bicim), g.bayt);
  await writeFile(bilgiYolu(id), JSON.stringify(k));
  let l: string[] = [];
  try { l = JSON.parse(await readFile(zincirYolu(kok), "utf8")) as string[]; } catch { /* yeni zincir */ }
  await writeFile(zincirYolu(kok), JSON.stringify([...l, id].slice(-100)));
  return k;
}

/** Bir sürümün zincirdeki kaynağı: aynı sahibin dosyası olmalı (kimlik başka sohbetten tahmin edilemez ama yine de denetlenir). */
export async function kaynakBul(kimlik: string | undefined, sahip: string, bicim: DosyaBicim): Promise<BelgeKaydi | null> {
  const id = String(kimlik ?? "").trim().replace(/^ek_/, "").replace(/\.(docx|xlsx|pptx)$/i, "");
  const k = await belgeGetir(id);
  if (!k || k.bicim !== bicim) return null;
  if (k.sahip && k.sahip !== sahipOzeti(sahip)) return null;
  return k;
}

/* ───────────── Görseller (sunum için) ───────────── */
const UZ_MIME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif" };
async function webpCevir(v: { veri: Buffer; mime: string }): Promise<{ veri: Buffer; mime: string } | null> {
  if (v.mime !== "image/webp") return v;
  try {
    const sharp = nodeYukle<(b: Buffer) => { jpeg: (o: { quality: number }) => { toBuffer: () => Promise<Buffer> } }>("sharp");
    return { veri: await sharp(v.veri).jpeg({ quality: 86 }).toBuffer(), mime: "image/jpeg" };
  } catch { return null; }
}
/** Sunuma konacak görseli okur: Vayra deposu, sohbet ekleri, public klasörü, data URL ya da https adresi. */
export async function gorselOku(url: string): Promise<{ veri: Buffer; mime: string } | null> {
  const u = url.trim();
  let v: { veri: Buffer; mime: string } | null = null;
  const d = /^data:(image\/(?:png|jpeg|webp|gif));base64,(.+)$/.exec(u);
  const depo = /^\/api\/dosya\/(gorsel|element|upscale)\/([A-Za-z0-9_-]+\.(png|jpg|jpeg|webp))$/.exec(u);
  const ek = /^\/api\/build\/sohbet\/ek\/([A-Za-z0-9_-]{20,40}\.(png|jpg|webp|gif))$/.exec(u);
  const pub = /^\/((?:gercek|marka|ornek|gorsel)\/[A-Za-z0-9_./-]+\.(png|jpg|jpeg|webp))$/.exec(u);
  try {
    if (d) v = { veri: Buffer.from(d[2], "base64"), mime: d[1] };
    else if (depo) v = { veri: await readFile(path.join(DEPO_KOK, depo[1], depo[2])), mime: UZ_MIME[depo[3]] };
    else if (ek) v = { veri: await readFile(path.join(DEPO_KOK, "build", "sohbet-ek", ek[1])), mime: UZ_MIME[ek[2]] };
    else if (pub && !pub[1].includes("..")) v = { veri: await readFile(path.join(process.cwd(), "public", pub[1])), mime: UZ_MIME[pub[2]] };
    else if (/^https:\/\//.test(u)) {
      const r = await guvenliFetch(u, { signal: AbortSignal.timeout(8000) }, { yalnizHttps: true });
      const tur = r.headers.get("content-type")?.split(";")[0] ?? "";
      if (r.ok && /^image\/(png|jpeg|webp|gif)$/.test(tur)) { const b = Buffer.from(await r.arrayBuffer()); if (b.length < 12 * 1024 * 1024) v = { veri: b, mime: tur }; }
    }
  } catch { v = null; }
  return v ? webpCevir(v) : null;
}

/* ───────────── Oluşturma ───────────── */
export type OlusturSonucu = { kayit: BelgeKaydi; kaynak?: BelgeKaydi | null; uyari?: string };

/** Araç girdisinden dosya üretir ve saklar. kaynak verilirse aynı zincirin yeni sürümü olur. */
export async function dosyaOlustur(bicim: DosyaBicim, ham: unknown, o: { sahip: string; sohbet?: string }): Promise<OlusturSonucu> {
  const kimlik = (ham && typeof ham === "object" ? (ham as { kaynak?: unknown }).kaynak : undefined) as string | undefined;
  const kaynak = kimlik ? await kaynakBul(kimlik, o.sahip, bicim) : null;
  let girdi: BelgeKaydi["girdi"];
  let bayt: Buffer;
  let uyari: string | undefined;
  if (bicim === "docx") {
    const g = belgeGirdisi(ham);
    if (!g.bloklar.length && !g.baslik) throw new Error("Belgede içerik yok: bloklar boş.");
    girdi = g; bayt = await docxUret(g);
  } else if (bicim === "xlsx") {
    const g = tabloGirdisi(ham);
    girdi = g; bayt = await xlsxUret(g);
  } else {
    const g = sunumGirdisi(ham);
    if (!g.slaytlar.length) throw new Error("Sunumda slayt yok.");
    const eksik = [];
    for (const s of g.slaytlar) if (s.gorsel && !(await gorselOku(s.gorsel))) { eksik.push(s.gorsel); delete s.gorsel; if (s.duzen === "gorsel") s.duzen = "madde"; }
    if (eksik.length) uyari = `${eksik.length} görsel okunamadı; o slaytlar görselsiz düzenle yapıldı.`;
    girdi = g; bayt = await pptxUret(g, gorselOku);
  }
  const ad = (girdi as { ad: string }).ad || kaynak?.ad || "";
  const kayit = await kaydet({ bicim, ad, bayt, girdi, onceki: kaynak, sahip: o.sahip, sohbet: o.sohbet });
  return { kayit, kaynak, uyari: kimlik && !kaynak ? `${uyari ? `${uyari} ` : ""}Kaynak dosya bulunamadı; yeni bir dosya olarak kaydedildi.` : uyari };
}

/** Yüklenen Office dosyası: baytlar olduğu gibi saklanır, içeriği yapılandırılmış girdiye çevrilir (sürüm 1). */
export async function belgeIceAl(bayt: Buffer, ad: string, bicim: DosyaBicim, girdi: BelgeKaydi["girdi"], sahip?: string): Promise<BelgeKaydi> {
  const k = await kaydet({ bicim, ad, bayt, girdi, sahip, yuklenen: true });
  return { ...k, ad: dosyaAdiYap(ad, bicim) };
}

/** Önizleme yanıtı: bilgi + çizilecek içerik + sürümler. */
export async function belgeOnizleme(k: BelgeKaydi) {
  return { dosya: belgeBilgisi(k), onizleme: onizlemeHazirla(k.bicim, k.girdi), surumler: await belgeSurumleri(k) };
}

/** Modele giden metin: yapılandırılmış içerik (düzenlemek için aynı aracı kaynak alanıyla çağırır). */
export function belgeModelMetni(k: BelgeKaydi, sinir = 120_000): string {
  const arac = { docx: "belge_olustur", xlsx: "tablo_olustur", pptx: "sunum_olustur" }[k.bicim];
  const json = JSON.stringify(k.girdi);
  return `<dosya ad="${k.ad.replace(/"/g, "'")}" bicim="${k.bicim}" kimlik="${k.id}" surum="${k.surum}">
Bu dosyanın içeriği ${arac} aracının girdi biçiminde aşağıda. Kullanıcı bu dosyada değişiklik isterse ${arac} aracını kaynak: "${k.id}" ile çağır ve dosyanın TAMAMINI yeni hâliyle ver (yeni sürüm olarak kaydedilir).
${json.length > sinir ? `${json.slice(0, sinir)}… (içerik kısaltıldı)` : json}
</dosya>`;
}
