import "server-only";
import { nodeYukle } from "./belgeYukle";
import { inflateRawSync } from "zlib";
import type ExcelJST from "exceljs";
import { sayiCoz } from "./belgeUret";
import type { BelgeBlok, BelgeGirdi, DosyaBicim, Hucre, Slayt, SunumGirdi, SutunBicim, TabloGirdi, TabloSayfasi } from "./belgeTipler";

/**
 * Yüklenen Office dosyalarını (DOCX, XLSX, PPTX) sohbetin yapılandırılmış girdisine çevirir: ajan bu girdiyi düzenleyip
 * aynı araçla yeni sürüm üretir. DOCX ve PPTX bağımlılıksız okunur (zip + küçük XML ayrıştırıcı), XLSX exceljs ile.
 * Korunanlar: başlık düzeyleri, kalın/italik, madde ve numaralı listeler, tablolar, sayfa sonları; Excel'de sayfalar,
 * başlık satırı, sayı biçimleri ve formüller; sunumda başlıklar, alt başlıklar, maddeler ve konuşmacı notları.
 */

/* ───────────── Zip ───────────── */
export function zipAc(b: Buffer): Map<string, () => Buffer> {
  let son = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65_557); i--) if (b.readUInt32LE(i) === 0x06054b50) { son = i; break; }
  if (son < 0) throw new Error("Dosya açılamadı: zip yapısı bulunamadı.");
  const adet = b.readUInt16LE(son + 10);
  let o = b.readUInt32LE(son + 16);
  const l = new Map<string, () => Buffer>();
  for (let n = 0; n < adet; n++) {
    if (b.readUInt32LE(o) !== 0x02014b50) break;
    const yontem = b.readUInt16LE(o + 10), boyut = b.readUInt32LE(o + 20);
    const adUz = b.readUInt16LE(o + 28), ekUz = b.readUInt16LE(o + 30), yorumUz = b.readUInt16LE(o + 32), yerel = b.readUInt32LE(o + 42);
    const ad = b.toString("utf8", o + 46, o + 46 + adUz);
    o += 46 + adUz + ekUz + yorumUz;
    l.set(ad, () => {
      const bas = yerel + 30 + b.readUInt16LE(yerel + 26) + b.readUInt16LE(yerel + 28);
      const ham = b.subarray(bas, bas + boyut);
      return yontem === 0 ? Buffer.from(ham) : inflateRawSync(ham);
    });
  }
  return l;
}

/* ───────────── Küçük XML ayrıştırıcı ───────────── */
type Dugum = { ad: string; oz: Record<string, string>; c: Dugum[]; t?: string };
const VARLIK: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const coz = (s: string) => s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, k: string) => (k[0] === "#" ? String.fromCodePoint(k[1] === "x" || k[1] === "X" ? parseInt(k.slice(2), 16) : Number(k.slice(1))) : VARLIK[k] ?? m));
export function xmlAgaci(x: string): Dugum {
  const kok: Dugum = { ad: "#kok", oz: {}, c: [] };
  const yigin = [kok];
  const re = /<(\/?)([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[([\s\S]*?)\]\]>|([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(x))) {
    const ust = yigin[yigin.length - 1];
    if (m[6] !== undefined) { if (ust.ad === "w:t" || ust.ad === "a:t" || ust.ad === "t" || ust.ad === "w:instrText") ust.c.push({ ad: "#t", oz: {}, c: [], t: coz(m[6]) }); continue; }
    if (m[5] !== undefined) { ust.c.push({ ad: "#t", oz: {}, c: [], t: m[5] }); continue; }
    if (!m[2]) continue;
    if (m[1]) { if (yigin.length > 1 && ust.ad === m[2]) yigin.pop(); else { const i = yigin.map((d) => d.ad).lastIndexOf(m[2]); if (i > 0) yigin.length = i; } continue; }
    const oz: Record<string, string> = {};
    for (const a of m[3].matchAll(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) oz[a[1]] = coz(a[2] ?? a[3] ?? "");
    const d: Dugum = { ad: m[2], oz, c: [] };
    ust.c.push(d);
    if (!m[4]) yigin.push(d);
  }
  return kok;
}
const bul = (d: Dugum, ad: string): Dugum | undefined => { for (const c of d.c) { if (c.ad === ad) return c; const x = bul(c, ad); if (x) return x; } return undefined; };
const hepsi = (d: Dugum, ad: string, o: Dugum[] = []): Dugum[] => { for (const c of d.c) { if (c.ad === ad) o.push(c); else hepsi(c, ad, o); } return o; };
const cocuk = (d: Dugum | undefined, ad: string) => d?.c.find((c) => c.ad === ad);
const metinOf = (d: Dugum): string => (d.t ?? "") + d.c.map(metinOf).join("");
const acikMi = (d?: Dugum) => !!d && !["0", "false", "off"].includes(d.oz["w:val"] ?? "");

/* ───────────── DOCX ───────────── */
function docxOku(z: Map<string, () => Buffer>, ad: string): BelgeGirdi {
  const belge = z.get("word/document.xml");
  if (!belge) throw new Error("Word belgesi okunamadı.");
  const stiller = new Map<string, string>();
  const st = z.get("word/styles.xml");
  if (st) for (const s of hepsi(xmlAgaci(st().toString("utf8")), "w:style")) { const id = s.oz["w:styleId"]; const n = cocuk(s, "w:name")?.oz["w:val"]; if (id && n) stiller.set(id, n.toLowerCase()); }
  const sirali = new Map<string, boolean>();
  const nm = z.get("word/numbering.xml");
  if (nm) {
    const k = xmlAgaci(nm().toString("utf8"));
    const soyut = new Map<string, boolean>();
    for (const a of hepsi(k, "w:abstractNum")) { const l0 = a.c.find((c) => c.ad === "w:lvl" && c.oz["w:ilvl"] === "0"); soyut.set(a.oz["w:abstractNumId"], (cocuk(l0!, "w:numFmt")?.oz["w:val"] ?? "bullet") !== "bullet"); }
    for (const n of hepsi(k, "w:num")) sirali.set(n.oz["w:numId"], soyut.get(cocuk(n, "w:abstractNumId")?.oz["w:val"] ?? "") ?? false);
  }
  const govde = bul(xmlAgaci(belge().toString("utf8")), "w:body");
  const bloklar: BelgeBlok[] = [];
  let baslik: string | undefined;
  const paragrafMetni = (p: Dugum) => {
    let o = "";
    for (const r of hepsi(p, "w:r")) {
      const pr = cocuk(r, "w:rPr");
      const b = acikMi(cocuk(pr!, "w:b")), i = acikMi(cocuk(pr!, "w:i"));
      let t = "";
      for (const c of r.c) { if (c.ad === "w:t") t += metinOf(c); else if (c.ad === "w:tab") t += "\t"; else if (c.ad === "w:br" && c.oz["w:type"] !== "page") t += " "; }
      if (!t) continue;
      const kenar = /^(\s*)([\s\S]*?)(\s*)$/.exec(t)!;
      o += kenar[2] ? `${kenar[1]}${b && i ? `***${kenar[2]}***` : b ? `**${kenar[2]}**` : i ? `*${kenar[2]}*` : kenar[2]}${kenar[3]}` : t;
    }
    return o.replace(/\*\*\*\*/g, "").replace(/(\*\*)(\s*)\*\*/g, "$2").trim();
  };
  let liste: Extract<BelgeBlok, { tur: "liste" }> | null = null;
  for (const d of govde?.c ?? []) {
    if (d.ad === "w:tbl") {
      liste = null;
      const satirlar = hepsi(d, "w:tr").map((tr) => tr.c.filter((c) => c.ad === "w:tc").map((tc) => hepsi(tc, "w:p").map(paragrafMetni).filter(Boolean).join(" ")));
      if (satirlar.length) { const n = Math.max(...satirlar.map((r) => r.length)); bloklar.push({ tur: "tablo", basliklar: Array.from({ length: n }, (_, i) => (satirlar[0][i] ?? "").replace(/^\*\*([\s\S]*)\*\*$/, "$1")), satirlar: satirlar.slice(1).map((r) => Array.from({ length: n }, (_, i) => r[i] ?? "")) }); }
      continue;
    }
    if (d.ad !== "w:p") continue;
    const pr = cocuk(d, "w:pPr");
    const stil = stiller.get(cocuk(pr!, "w:pStyle")?.oz["w:val"] ?? "") ?? cocuk(pr!, "w:pStyle")?.oz["w:val"]?.toLowerCase() ?? "";
    const numara = cocuk(pr!, "w:numPr");
    const sayfa = hepsi(d, "w:br").some((b) => b.oz["w:type"] === "page") || acikMi(cocuk(pr!, "w:pageBreakBefore"));
    if (sayfa && bloklar.length) { bloklar.push({ tur: "sayfa_sonu" }); liste = null; }
    const metin = paragrafMetni(d);
    if (!metin) { liste = null; continue; }
    const hd = /heading\s*([1-9])|^başlık\s*([1-9])/.exec(stil);
    if (stil === "title" || stil === "konu başlığı") { if (!baslik && !bloklar.length) baslik = metin.replace(/\*/g, ""); else bloklar.push({ tur: "baslik", metin, seviye: 1 }); liste = null; continue; }
    if (hd) { bloklar.push({ tur: "baslik", metin: metin.replace(/^\*\*(.*)\*\*$/, "$1"), seviye: Math.min(3, Number(hd[1] ?? hd[2])) as 1 | 2 | 3 }); liste = null; continue; }
    if (numara || /list/.test(stil)) {
      const s = sirali.get(cocuk(numara!, "w:numId")?.oz["w:val"] ?? "") ?? /number/.test(stil);
      if (!liste || !!liste.sirali !== s) { liste = { tur: "liste", maddeler: [], ...(s ? { sirali: true } : {}) }; bloklar.push(liste); }
      liste.maddeler.push(metin);
      continue;
    }
    liste = null;
    if (/quote|alıntı/.test(stil)) { bloklar.push({ tur: "alinti", metin }); continue; }
    const jc = cocuk(pr!, "w:jc")?.oz["w:val"];
    bloklar.push({ tur: "paragraf", metin, ...(jc === "center" ? { hiza: "orta" as const } : jc === "right" ? { hiza: "sag" as const } : jc === "both" ? { hiza: "iki" as const } : {}) });
  }
  return { ad: ad.replace(/\.docx$/i, ""), ...(baslik ? { baslik } : {}), bloklar: bloklar.slice(0, 2000) };
}

/* ───────────── PPTX ───────────── */
function pptxOku(z: Map<string, () => Buffer>, ad: string): SunumGirdi {
  const sun = z.get("ppt/presentation.xml"), rel = z.get("ppt/_rels/presentation.xml.rels");
  const hedef = new Map<string, string>();
  if (rel) for (const r of hepsi(xmlAgaci(rel().toString("utf8")), "Relationship")) hedef.set(r.oz.Id, r.oz.Target);
  let sira = sun ? hepsi(xmlAgaci(sun().toString("utf8")), "p:sldId").map((s) => hedef.get(s.oz["r:id"])).filter((x): x is string => !!x).map((x) => `ppt/${x.replace(/^\/?(ppt\/)?/, "")}`) : [];
  if (!sira.length) sira = [...z.keys()].filter((k) => /^ppt\/slides\/slide\d+\.xml$/.test(k)).sort((a, b) => Number(/(\d+)\.xml/.exec(a)![1]) - Number(/(\d+)\.xml/.exec(b)![1]));
  const slaytlar: Slayt[] = [];
  for (const [i, yol] of sira.slice(0, 60).entries()) {
    const x = z.get(yol);
    if (!x) continue;
    const kok = xmlAgaci(x().toString("utf8"));
    let baslik = "", alt = "";
    const maddeler: string[] = [];
    let kapak = false;
    // Yer tutucusuz metin kutuları (çoğu araçla üretilen sunumlar): en büyük yazı başlık sayılır, küçük alt bilgi atlanır.
    const serbest: { p: string[]; sz: number }[] = [];
    for (const sp of hepsi(kok, "p:sp")) {
      const ph = bul(sp, "p:ph")?.oz.type ?? (bul(sp, "p:ph") ? "body" : "");
      const paragraflar = hepsi(sp, "a:p").map((p) => hepsi(p, "a:t").map(metinOf).join("").trim()).filter(Boolean);
      if (!paragraflar.length) continue;
      if (ph === "title" || ph === "ctrTitle") { baslik = paragraflar.join(" "); if (ph === "ctrTitle") kapak = true; }
      else if (ph === "subTitle") alt = paragraflar.join(" ");
      else if (["sldNum", "dt", "ftr"].includes(ph)) continue;
      else if (ph) maddeler.push(...paragraflar);
      else {
        const sz = Math.max(0, ...[...hepsi(sp, "a:rPr"), ...hepsi(sp, "a:defRPr")].map((r) => Number(r.oz.sz) || 0)) || 1800;
        if (sz <= 1200 && paragraflar.join("").length < 90) continue;
        if (paragraflar.join("") === "“") continue;
        serbest.push({ p: paragraflar, sz });
      }
    }
    if (!baslik && serbest.length) {
      const en = serbest.reduce((a, b) => (b.sz > a.sz ? b : a));
      if (en.sz >= 2400) { baslik = en.p.join(" "); serbest.splice(serbest.indexOf(en), 1); if (i === 0) kapak = true; }
    }
    if (kapak && !alt && serbest.length) alt = serbest.shift()!.p.join(" ");
    for (const x of serbest) maddeler.push(...x.p);
    // Konuşmacı notları
    let notlar = "";
    const sr = z.get(yol.replace(/slides\/(slide\d+\.xml)$/, "slides/_rels/$1.rels"));
    if (sr) {
      const n = hepsi(xmlAgaci(sr().toString("utf8")), "Relationship").find((r) => /notesSlide/.test(r.oz.Type ?? ""));
      const ny = n ? `ppt/${n.oz.Target.replace(/^\.\.\//, "")}` : "";
      const nx = ny ? z.get(ny) : undefined;
      if (nx) notlar = hepsi(xmlAgaci(nx().toString("utf8")), "p:sp").filter((sp) => bul(sp, "p:ph")?.oz.type === "body").flatMap((sp) => hepsi(sp, "a:p").map((p) => hepsi(p, "a:t").map(metinOf).join("").trim())).filter(Boolean).join("\n");
    }
    const s: Slayt = { duzen: kapak || (i === 0 && !maddeler.length) ? "kapak" : "madde" };
    if (baslik) s.baslik = baslik.slice(0, 200);
    if (alt) s.alt_baslik = alt.slice(0, 300);
    if (maddeler.length) s.maddeler = maddeler.slice(0, 12).map((m) => m.slice(0, 600));
    if (notlar) s.notlar = notlar.slice(0, 4000);
    if (s.baslik || s.maddeler || s.alt_baslik) slaytlar.push(s);
  }
  return { ad: ad.replace(/\.pptx$/i, ""), tema: "kurumsal", slaytlar };
}

/* ───────────── XLSX ───────────── */
async function xlsxOku(b: Buffer, ad: string): Promise<TabloGirdi> {
  const ExcelJS = nodeYukle<typeof ExcelJST>("exceljs");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(b as unknown as ArrayBuffer);
  const sayfalar: TabloSayfasi[] = [];
  wb.eachSheet((ws) => {
    if (sayfalar.length >= 12) return;
    const satirlar: Hucre[][] = [];
    const bicimler: (string | undefined)[] = [];
    const n = Math.min(50, ws.actualColumnCount || ws.columnCount);
    ws.eachRow({ includeEmpty: false }, (row, rn) => {
      if (satirlar.length > 5000) return;
      const r: Hucre[] = [];
      for (let c = 1; c <= n; c++) {
        const cell = row.getCell(c);
        const v = cell.value as ExcelJST.CellValue;
        if (rn > 1 && cell.numFmt && !bicimler[c - 1]) bicimler[c - 1] = cell.numFmt;
        if (v === null || v === undefined) r.push(null);
        else if (typeof v === "number" || typeof v === "boolean") r.push(v);
        else if (typeof v === "string") r.push(v.slice(0, 8000));
        else if (v instanceof Date) r.push(v.toISOString().slice(0, 10));
        else if (typeof v === "object" && "formula" in v && v.formula) r.push(`=${v.formula}`);
        else if (typeof v === "object" && "sharedFormula" in v && v.sharedFormula) { const res = (v as { result?: unknown }).result; r.push(typeof res === "number" || typeof res === "string" ? res : null); }
        else if (typeof v === "object" && "richText" in v) r.push(v.richText.map((x) => x.text).join(""));
        else if (typeof v === "object" && "text" in v) r.push(String((v as { text: unknown }).text));
        else if (typeof v === "object" && "result" in v) { const res = (v as { result?: unknown }).result; r.push(typeof res === "number" || typeof res === "string" ? res : null); }
        else r.push(String(cell.text ?? ""));
      }
      satirlar.push(r);
    });
    if (!satirlar.length) return;
    const [bas, ...veri] = satirlar;
    const sutunlar = bas.map((h, i) => {
      const f = bicimler[i] ?? "";
      const degerler = veri.map((x) => x[i]).filter((v) => v !== null);
      let bicim: SutunBicim | undefined = /%/.test(f) ? "yuzde" : /₺|TL|\$|€|£/.test(f) ? "para" : /[dmy]{2}/i.test(f) && !/0/.test(f) ? "tarih" : undefined;
      if (!bicim && degerler.length && degerler.every((v) => typeof v === "number" || (typeof v === "string" && v.startsWith("=")))) bicim = degerler.every((v) => typeof v !== "number" || Number.isInteger(v)) && !/0\.0/.test(f) ? "tamsayi" : "sayi";
      const genislik = ws.getColumn(i + 1).width;
      return { baslik: h === null ? "" : String(h).slice(0, 200), ...(bicim ? { bicim } : {}), ...(bicim === "para" ? { para_birimi: (/\$/.test(f) ? "USD" : /€/.test(f) ? "EUR" : /£/.test(f) ? "GBP" : "TRY") as "TRY" } : {}), ...(genislik && genislik > 2 ? { genislik: Math.round(genislik) } : {}) };
    });
    sayfalar.push({ ad: ws.name.slice(0, 31), sutunlar, satirlar: veri.map((r) => r.map((v, i) => (typeof v === "string" && sutunlar[i]?.bicim && sutunlar[i].bicim !== "tarih" && !v.startsWith("=") ? sayiCoz(v) ?? v : v))) });
  });
  if (!sayfalar.length) throw new Error("Excel dosyasında veri bulunamadı.");
  return { ad: ad.replace(/\.xlsx$/i, ""), sayfalar };
}

export function officeBicimi(ad: string, mime: string, b: Buffer): DosyaBicim | null {
  if (b.length < 4 || b.readUInt32LE(0) !== 0x04034b50) return null;
  const uz = /\.(docx|xlsx|pptx)$/i.exec(ad)?.[1]?.toLowerCase() as DosyaBicim | undefined;
  if (uz) return uz;
  if (/wordprocessingml/.test(mime)) return "docx";
  if (/spreadsheetml/.test(mime)) return "xlsx";
  if (/presentationml/.test(mime)) return "pptx";
  return null;
}

export async function officeOku(b: Buffer, ad: string, bicim: DosyaBicim): Promise<BelgeGirdi | TabloGirdi | SunumGirdi> {
  try {
    if (bicim === "xlsx") return await xlsxOku(b, ad);
    const z = zipAc(b);
    return bicim === "docx" ? docxOku(z, ad) : pptxOku(z, ad);
  } catch (e) {
    throw new Error((e as Error).message?.startsWith("Dosya") || (e as Error).message?.includes("okunamadı") || (e as Error).message?.includes("bulunamadı") ? (e as Error).message : "Dosya okunamadı; bozuk ya da parola korumalı olabilir.");
  }
}
