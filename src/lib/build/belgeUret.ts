import "server-only";
import { nodeYukle } from "./belgeYukle";
import type * as DocxT from "docx";
import type ExcelJST from "exceljs";
import type PptxGenJST from "pptxgenjs";
import {
  duzMetin, satirParcala, sutunHarfi, temaCoz, type BelgeBlok, type BelgeGirdi, type DosyaBicim, type DosyaOnizleme, type Hucre,
  type KucukOnizleme, type ParaBirimi, type Slayt, type SlaytDuzen, type SunumGirdi, type SunumTemaId, type SutunBicim, type TabloGirdi,
  type TabloOnizlemeHucre, type TabloOnizlemeSayfa, type TabloSayfasi, type Tema,
} from "./belgeTipler";

/**
 * Dosya üretimi: modelin yapılandırılmış JSON'u doğrulanır (hoşgörülü: eksik alanlar tamamlanır, sınırlar uygulanır),
 * sonra DOCX (docx), XLSX (exceljs) ya da PPTX (pptxgenjs) üretilir. Kütüphaneler paketlenmeden çalışma anında
 * yüklenir (sunucu derlemesi hafif kalsın, Node'a özgü bağımlılıklar kırılmasın). Excel formülleri önizleme için
 * küçük bir hesaplayıcıyla değerlendirilir ve dosyaya sonuçlarıyla yazılır (Excel açılışta yeniden hesaplar).
 */
const docxLib = () => nodeYukle<typeof DocxT>("docx");
const exceljsLib = () => nodeYukle<typeof ExcelJST>("exceljs");
const pptxLib = () => nodeYukle<typeof PptxGenJST>("pptxgenjs");

const yazi = (v: unknown, n: number) => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "").replace(/\r/g, "").slice(0, n);
const dizi = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const nesne = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

/* ═════════════ Girdi doğrulama ═════════════ */
export function belgeGirdisi(ham: unknown): BelgeGirdi {
  const g = nesne(ham);
  const bloklar: BelgeBlok[] = [];
  for (const x of dizi<unknown>(g.bloklar).slice(0, 2000)) {
    const b = nesne(x);
    const tur = yazi(b.tur ?? b.type, 20);
    const metin = yazi(b.metin ?? b.text, 20000).trim();
    if (tur === "baslik" || tur === "heading") { if (metin) bloklar.push({ tur: "baslik", metin: metin.slice(0, 300), seviye: ([1, 2, 3].includes(Number(b.seviye)) ? Number(b.seviye) : 1) as 1 | 2 | 3 }); }
    else if (tur === "liste" || tur === "list") { const m = dizi<unknown>(b.maddeler ?? b.items).map((y) => yazi(y, 4000).trim()).filter(Boolean).slice(0, 300); if (m.length) bloklar.push({ tur: "liste", maddeler: m, ...(b.sirali ? { sirali: true } : {}) }); }
    else if (tur === "tablo" || tur === "table") {
      const bas = dizi<unknown>(b.basliklar ?? b.headers).map((y) => yazi(y, 300)).slice(0, 20);
      const sat = dizi<unknown>(b.satirlar ?? b.rows).slice(0, 1000).map((r) => dizi<unknown>(r).map((y) => yazi(y, 2000)).slice(0, 20));
      const n = Math.max(bas.length, ...sat.map((r) => r.length), 0);
      if (n) bloklar.push({ tur: "tablo", basliklar: Array.from({ length: n }, (_, i) => bas[i] ?? ""), satirlar: sat.map((r) => Array.from({ length: n }, (_, i) => r[i] ?? "")) });
    } else if (tur === "alinti" || tur === "quote") { if (metin) bloklar.push({ tur: "alinti", metin }); }
    else if (tur === "ayrac" || tur === "divider") bloklar.push({ tur: "ayrac" });
    else if (tur === "sayfa_sonu" || tur === "page_break") bloklar.push({ tur: "sayfa_sonu" });
    else if (metin) { const h = yazi(b.hiza, 6); bloklar.push({ tur: "paragraf", metin, ...(["sol", "orta", "sag", "iki"].includes(h) ? { hiza: h as "sol" } : {}) }); }
  }
  return { ad: yazi(g.ad, 80).trim() || yazi(g.baslik, 80).trim() || "Belge", ...(yazi(g.baslik, 300).trim() ? { baslik: yazi(g.baslik, 300).trim() } : {}), ...(yazi(g.alt_baslik, 400).trim() ? { alt_baslik: yazi(g.alt_baslik, 400).trim() } : {}), bloklar };
}

const BICIMLER: SutunBicim[] = ["metin", "sayi", "tamsayi", "para", "yuzde", "tarih"];
const SAYISAL = new Set<SutunBicim>(["sayi", "tamsayi", "para", "yuzde"]);
/** "1.250,50", "1,250.50", "₺1.250" gibi yazılmış sayılar. */
export function sayiCoz(s: string): number | null {
  const t = s.replace(/[₺$€£\s]|TL|TRY|USD|EUR/gi, "").replace(/^%|%$/g, "");
  if (!/^-?[\d.,]+$/.test(t) || !/\d/.test(t)) return null;
  const v = /,\d{1,2}$/.test(t) || (t.includes(".") && t.includes(",") && t.lastIndexOf(",") > t.lastIndexOf(".")) ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
export function tabloGirdisi(ham: unknown): TabloGirdi {
  const g = nesne(ham);
  const adlar = new Set<string>();
  const sayfalar: TabloSayfasi[] = [];
  for (const [si, x] of dizi<unknown>(g.sayfalar ?? g.sheets).slice(0, 12).entries()) {
    const s = nesne(x);
    const kok = yazi(s.ad ?? s.name, 31).replace(/[[\]:*?/\\]/g, " ").trim() || `Sayfa ${si + 1}`;
    let ad = kok;
    for (let k = 2; adlar.has(ad.toLocaleLowerCase("tr")); k++) ad = `${kok.slice(0, 27)} ${k}`;
    adlar.add(ad.toLocaleLowerCase("tr"));
    const sutunlar = dizi<unknown>(s.sutunlar ?? s.columns).slice(0, 50).map((c) => {
      const o = typeof c === "string" ? { baslik: c } : nesne(c);
      const bicim = yazi(o.bicim ?? o.format, 10) as SutunBicim;
      const pb = yazi(o.para_birimi ?? o.currency, 3).toUpperCase() as ParaBirimi;
      const gen = Number(o.genislik ?? o.width);
      return { baslik: yazi(o.baslik ?? o.header ?? o.ad, 200), ...(BICIMLER.includes(bicim) ? { bicim } : {}), ...(["TRY", "USD", "EUR", "GBP"].includes(pb) ? { para_birimi: pb } : {}), ...(gen > 2 && gen < 120 ? { genislik: Math.round(gen) } : {}) };
    });
    const satirlar: Hucre[][] = dizi<unknown>(s.satirlar ?? s.rows).slice(0, 5000).map((r) => dizi<unknown>(r).slice(0, 50).map((v, ci) => {
      if (v === null || v === undefined || v === "") return null;
      if (typeof v === "number") return Number.isFinite(v) ? v : null;
      if (typeof v === "boolean") return v;
      const t = yazi(v, 8000);
      if (t.startsWith("=")) return t;
      const b = sutunlar[ci]?.bicim;
      if (b && SAYISAL.has(b)) { const n = sayiCoz(t); if (n !== null) return b === "yuzde" && /%/.test(t) ? n / 100 : n; }
      return t;
    }));
    const n = Math.max(sutunlar.length, ...satirlar.map((r) => r.length), 0);
    if (!n) continue;
    while (sutunlar.length < n) sutunlar.push({ baslik: sutunHarfi(sutunlar.length) });
    // Biçimi verilmemiş sütun: bütün değerleri sayıysa "sayi".
    for (let c = 0; c < n; c++) if (!sutunlar[c].bicim) { const d = satirlar.map((r) => r[c]).filter((v) => v !== null && v !== undefined); if (d.length && d.every((v) => typeof v === "number")) sutunlar[c].bicim = d.every((v) => Number.isInteger(v)) ? "tamsayi" : "sayi"; }
    sayfalar.push({ ad, sutunlar, satirlar: satirlar.map((r) => Array.from({ length: n }, (_, i) => r[i] ?? null)), ...(s.toplam_satiri ? { toplam_satiri: true } : {}) });
  }
  if (!sayfalar.length) sayfalar.push({ ad: "Sayfa 1", sutunlar: [{ baslik: "A" }], satirlar: [] });
  return { ad: yazi(g.ad, 80).trim() || "Tablo", sayfalar };
}

const DUZENLER: SlaytDuzen[] = ["kapak", "bolum", "madde", "iki_sutun", "gorsel", "alinti", "rakamlar"];
const TEMALAR: SunumTemaId[] = ["gece", "okyanus", "kagit", "kurumsal", "toprak", "ozel"];
export function sunumGirdisi(ham: unknown): SunumGirdi {
  const g = nesne(ham);
  const maddeler = (v: unknown) => dizi<unknown>(v).map((y) => yazi(y, 600).trim()).filter(Boolean).slice(0, 12);
  const sutun = (v: unknown) => { const o = nesne(v); const m = maddeler(o.maddeler ?? o.items); return m.length || yazi(o.baslik, 1).length ? { ...(yazi(o.baslik, 120).trim() ? { baslik: yazi(o.baslik, 120).trim() } : {}), maddeler: m } : undefined; };
  const slaytlar: Slayt[] = dizi<unknown>(g.slaytlar ?? g.slides).slice(0, 60).map((x, i) => {
    const s = nesne(x);
    let duzen = yazi(s.duzen ?? s.layout, 12) as SlaytDuzen;
    if (!DUZENLER.includes(duzen)) duzen = i === 0 ? "kapak" : "madde";
    const sl: Slayt = { duzen };
    const t = (k: string, n: number) => yazi(s[k], n).trim();
    if (t("baslik", 200)) sl.baslik = t("baslik", 200);
    if (t("alt_baslik", 300)) sl.alt_baslik = t("alt_baslik", 300);
    const m = maddeler(s.maddeler ?? s.bullets); if (m.length) sl.maddeler = m;
    const sol = sutun(s.sol), sag = sutun(s.sag);
    if (sol) sl.sol = sol; if (sag) sl.sag = sag;
    if (t("gorsel", 600)) sl.gorsel = t("gorsel", 600);
    if (s.gorsel_konum === "sol") sl.gorsel_konum = "sol";
    if (t("alinti", 600)) sl.alinti = t("alinti", 600);
    if (t("alinti_sahibi", 160)) sl.alinti_sahibi = t("alinti_sahibi", 160);
    const r = dizi<unknown>(s.rakamlar).slice(0, 4).map((y) => { const o = nesne(y); return { deger: yazi(o.deger, 24).trim(), etiket: yazi(o.etiket, 80).trim() }; }).filter((y) => y.deger);
    if (r.length) sl.rakamlar = r;
    if (t("notlar", 4000)) sl.notlar = t("notlar", 4000);
    return sl;
  }).filter((s) => s.baslik || s.maddeler || s.sol || s.sag || s.alinti || s.rakamlar);
  const tema = yazi(g.tema, 10) as SunumTemaId;
  const ana = yazi(g.ana_renk, 7);
  return { ad: yazi(g.ad, 80).trim() || slaytlar[0]?.baslik?.slice(0, 80) || "Sunum", tema: TEMALAR.includes(tema) ? tema : ana ? "ozel" : "gece", ...(/^#?[0-9a-f]{6}$/i.test(ana) ? { ana_renk: ana.replace(/^#?/, "#") } : {}), slaytlar };
}

/* ═════════════ Excel formülleri ═════════════ */
const TR_FONK: Record<string, string> = {
  TOPLA: "SUM", ORTALAMA: "AVERAGE", "MİN": "MIN", MIN: "MIN", MAK: "MAX", "BAĞ_DEĞ_SAY": "COUNT", "BAĞ_DEĞ_DOLU_SAY": "COUNTA", YUVARLA: "ROUND",
  "YUKARIYUVARLA": "ROUNDUP", "AŞAĞIYUVARLA": "ROUNDDOWN", "MUTLAK": "ABS", "EĞER": "IF", "VE": "AND", "YADA": "OR", "DEĞİL": "NOT", "ÇARPIM": "PRODUCT",
  KAREKÖK: "SQRT", KUVVET: "POWER", "EĞERHATA": "IFERROR", ETOPLA: "SUMIF", "EĞERSAY": "COUNTIF", "EĞERORTALAMA": "AVERAGEIF", ORTANCA: "MEDIAN", TAMSAYI: "INT", "MOD": "MOD", BİRLEŞTİR: "CONCAT", UZUNLUK: "LEN",
};
/** Formülü dosya biçimine çevirir: baştaki = atılır, Türkçe işlev adları İngilizceye, ; ayırıcısı , olur. */
export function formulHazirla(f: string): string {
  let o = "", tirnak = false;
  const s = f.replace(/^=/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"') { tirnak = !tirnak; o += c; continue; }
    if (!tirnak && c === ";") { o += ","; continue; }
    o += c;
  }
  return o.replace(/([A-Za-zÇĞİÖŞÜçğıöşü_.]+)\s*\(/g, (m, ad: string) => { const u = ad.toLocaleUpperCase("tr"); return TR_FONK[u] ? `${TR_FONK[u]}(` : m; });
}

type Deg = number | string | boolean | null;
type Tok = { k: "say"; v: number } | { k: "str"; v: string } | { k: "bool"; v: boolean } | { k: "ref"; s?: string; r: number; c: number; r2?: number; c2?: number } | { k: "fn"; v: string } | { k: "op"; v: string } | { k: "(" } | { k: ")" } | { k: "," };
const harfSutun = (h: string) => [...h.toUpperCase()].reduce((t, c) => t * 26 + c.charCodeAt(0) - 64, 0) - 1;
function belirtec(f: string): Tok[] {
  const o: Tok[] = [];
  const re = /\s*(?:(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|"((?:[^"]|"")*)"|(TRUE|FALSE)\b|(?:(?:'([^']+)'|([A-Za-z_][\w.]*))!)?\$?([A-Za-z]{1,3})\$?(\d+)(?::\$?([A-Za-z]{1,3})\$?(\d+))?|([A-Za-z_][\w.]*)\s*\(|(<=|>=|<>|[-+*/^&=<>%])|(\()|(\))|(,))/y;
  let i = 0;
  while (i < f.length) {
    re.lastIndex = i;
    const m = re.exec(f);
    if (!m || m[0].length === 0) { if (/\s/.test(f.slice(i))) break; throw new Error("ayrıştırılamadı"); }
    i = re.lastIndex;
    if (m[1]) o.push({ k: "say", v: Number(m[1]) });
    else if (m[2] !== undefined && m[0].trim().startsWith('"')) o.push({ k: "str", v: m[2].replace(/""/g, '"') });
    else if (m[3]) o.push({ k: "bool", v: m[3].toUpperCase() === "TRUE" });
    else if (m[6]) o.push({ k: "ref", s: m[4] ?? m[5], c: harfSutun(m[6]), r: Number(m[7]) - 1, ...(m[8] ? { c2: harfSutun(m[8]), r2: Number(m[9]) - 1 } : {}) });
    else if (m[10]) o.push({ k: "fn", v: m[10].toUpperCase() });
    else if (m[11]) o.push({ k: "op", v: m[11] });
    else if (m[12]) o.push({ k: "(" });
    else if (m[13]) o.push({ k: ")" });
    else if (m[14]) o.push({ k: "," });
  }
  return o;
}
const sayiOf = (v: Deg | Deg[]): number => { if (Array.isArray(v)) { if (v.length === 1) return sayiOf(v[0]); throw new Error("aralık"); } if (typeof v === "number") return v; if (typeof v === "boolean") return v ? 1 : 0; if (v === null || v === "") return 0; const n = Number(v); if (!Number.isFinite(n)) throw new Error("değer"); return n; };
const tekOf = (v: Deg | Deg[]): Deg => (Array.isArray(v) ? (v.length === 1 ? v[0] : (() => { throw new Error("aralık"); })()) : v);
const duzle = (l: (Deg | Deg[])[]) => l.flatMap((x) => (Array.isArray(x) ? x : [x]));
function olcut(k: Deg): (v: Deg) => boolean {
  const s = String(k ?? "");
  const m = /^(<=|>=|<>|=|<|>)?(.*)$/.exec(s)!;
  const op = m[1] ?? "=", h = m[2];
  const hn = Number(h);
  return (v) => {
    const sayisal = h !== "" && Number.isFinite(hn) && typeof v === "number";
    const a = sayisal ? (v as number) : String(v ?? "").toLocaleLowerCase("tr"), b = sayisal ? hn : h.toLocaleLowerCase("tr");
    return op === "=" ? a === b : op === "<>" ? a !== b : op === "<" ? a < b : op === ">" ? a > b : op === "<=" ? a <= b : a >= b;
  };
}

/** Kitap içinde hücre çözücü: sayfa adı + 0 tabanlı satır/sütun → değer (formüller özyinelemeli, döngü korumalı). */
function hesaplayici(kitap: TabloGirdi) {
  const izgara = new Map<string, Hucre[][]>();
  for (const s of kitap.sayfalar) {
    const n = s.sutunlar.length;
    const satirlar: Hucre[][] = [s.sutunlar.map((c) => c.baslik), ...s.satirlar];
    if (s.toplam_satiri) satirlar.push(toplamSatiri(s));
    void n;
    izgara.set(s.ad.toLocaleLowerCase("tr"), satirlar);
  }
  const bellek = new Map<string, Deg>();
  const yolda = new Set<string>();
  const hucre = (sayfa: string, r: number, c: number): Deg => {
    const ad = sayfa.toLocaleLowerCase("tr");
    const k = `${ad}!${r}:${c}`;
    if (bellek.has(k)) return bellek.get(k)!;
    const v = izgara.get(ad)?.[r]?.[c] ?? null;
    if (typeof v === "string" && v.startsWith("=")) {
      if (yolda.has(k)) throw new Error("döngü");
      yolda.add(k);
      try { const x = hesapla(v, sayfa); bellek.set(k, x); return x; } finally { yolda.delete(k); }
    }
    bellek.set(k, v);
    return v;
  };
  const hesapla = (formul: string, sayfa: string): Deg => {
    const t = belirtec(formulHazirla(formul));
    let i = 0;
    const bak = () => t[i];
    const al = () => t[i++];
    const op = (...l: string[]) => { const x = bak(); if (x?.k === "op" && l.includes(x.v)) { i++; return x.v; } return null; };
    const ifade = (): Deg | Deg[] => {
      let a = birlesim();
      for (let o = op("=", "<>", "<", ">", "<=", ">="); o; o = op("=", "<>", "<", ">", "<=", ">=")) {
        const b = birlesim();
        const x = tekOf(a), y = tekOf(b);
        const sx = typeof x === "number" && typeof y === "number" ? x : String(x ?? ""), sy = typeof x === "number" && typeof y === "number" ? y : String(y ?? "");
        a = o === "=" ? sx === sy : o === "<>" ? sx !== sy : o === "<" ? sx < sy : o === ">" ? sx > sy : o === "<=" ? sx <= sy : sx >= sy;
      }
      return a;
    };
    const birlesim = (): Deg | Deg[] => { let a = toplama(); while (op("&")) { const b = toplama(); a = `${tekOf(a) ?? ""}${tekOf(b) ?? ""}`; } return a; };
    const toplama = (): Deg | Deg[] => { let a = carpma(); for (let o = op("+", "-"); o; o = op("+", "-")) { const b = carpma(); a = o === "+" ? sayiOf(a) + sayiOf(b) : sayiOf(a) - sayiOf(b); } return a; };
    const carpma = (): Deg | Deg[] => { let a = us(); for (let o = op("*", "/"); o; o = op("*", "/")) { const b = us(); if (o === "/" && sayiOf(b) === 0) throw new Error("sıfıra bölme"); a = o === "*" ? sayiOf(a) * sayiOf(b) : sayiOf(a) / sayiOf(b); } return a; };
    const us = (): Deg | Deg[] => { let a = tekli(); while (op("^")) { const b = tekli(); a = Math.pow(sayiOf(a), sayiOf(b)); } return a; };
    const tekli = (): Deg | Deg[] => { if (op("-")) return -sayiOf(tekli()); if (op("+")) return sayiOf(tekli()); let a = birincil(); while (op("%")) a = sayiOf(a) / 100; return a; };
    const birincil = (): Deg | Deg[] => {
      const x = al();
      if (!x) throw new Error("eksik");
      if (x.k === "say" || x.k === "str" || x.k === "bool") return x.v;
      if (x.k === "(") { const v = ifade(); if (al()?.k !== ")") throw new Error("parantez"); return v; }
      if (x.k === "ref") {
        const sf = x.s ?? sayfa;
        if (x.r2 === undefined) return hucre(sf, x.r, x.c);
        const o: Deg[] = [];
        for (let r = Math.min(x.r, x.r2); r <= Math.max(x.r, x.r2); r++) for (let c = Math.min(x.c, x.c2!); c <= Math.max(x.c, x.c2!); c++) o.push(hucre(sf, r, c));
        return o;
      }
      if (x.k === "fn") {
        const args: (Deg | Deg[])[] = [];
        if (bak()?.k !== ")") { args.push(ifade()); while (bak()?.k === ",") { i++; args.push(ifade()); } }
        if (al()?.k !== ")") throw new Error("parantez");
        return islev(x.v, args);
      }
      throw new Error("beklenmedik");
    };
    const v = ifade();
    if (i < t.length) throw new Error("fazla");
    return tekOf(v);
  };
  const islev = (ad: string, a: (Deg | Deg[])[]): Deg => {
    const sayilar = () => duzle(a).filter((v): v is number => typeof v === "number");
    switch (ad) {
      case "SUM": return sayilar().reduce((t, v) => t + v, 0);
      case "AVERAGE": { const l = sayilar(); if (!l.length) throw new Error("boş"); return l.reduce((t, v) => t + v, 0) / l.length; }
      case "MIN": { const l = sayilar(); return l.length ? Math.min(...l) : 0; }
      case "MAX": { const l = sayilar(); return l.length ? Math.max(...l) : 0; }
      case "MEDIAN": { const l = sayilar().sort((x, y) => x - y); if (!l.length) throw new Error("boş"); const m = Math.floor(l.length / 2); return l.length % 2 ? l[m] : (l[m - 1] + l[m]) / 2; }
      case "COUNT": return sayilar().length;
      case "COUNTA": return duzle(a).filter((v) => v !== null && v !== "").length;
      case "PRODUCT": return sayilar().reduce((t, v) => t * v, 1);
      case "ROUND": case "ROUNDUP": case "ROUNDDOWN": { const x = sayiOf(a[0]), n = a[1] === undefined ? 0 : sayiOf(a[1]); const k = Math.pow(10, n); return (ad === "ROUND" ? Math.round(x * k) : ad === "ROUNDUP" ? Math.sign(x) * Math.ceil(Math.abs(x) * k) : Math.sign(x) * Math.floor(Math.abs(x) * k)) / k; }
      case "ABS": return Math.abs(sayiOf(a[0]));
      case "INT": return Math.floor(sayiOf(a[0]));
      case "MOD": return sayiOf(a[0]) % sayiOf(a[1]);
      case "SQRT": return Math.sqrt(sayiOf(a[0]));
      case "POWER": return Math.pow(sayiOf(a[0]), sayiOf(a[1]));
      case "IF": return tekOf(a[0]) ? tekOf(a[1] ?? true) : tekOf(a[2] ?? false);
      case "AND": return duzle(a).every(Boolean);
      case "OR": return duzle(a).some(Boolean);
      case "NOT": return !tekOf(a[0]);
      case "IFERROR": return tekOf(a[0]);
      case "CONCAT": case "CONCATENATE": return duzle(a).map((v) => v ?? "").join("");
      case "LEN": return String(tekOf(a[0]) ?? "").length;
      case "UPPER": return String(tekOf(a[0]) ?? "").toLocaleUpperCase("tr");
      case "LOWER": return String(tekOf(a[0]) ?? "").toLocaleLowerCase("tr");
      case "SUMIF": case "COUNTIF": case "AVERAGEIF": {
        const alan = Array.isArray(a[0]) ? a[0] : [a[0]];
        const t = olcut(tekOf(a[1]));
        const top = a[2] !== undefined ? (Array.isArray(a[2]) ? a[2] : [a[2]]) : alan;
        const l = alan.map((v, i) => (t(v) ? top[i] : undefined)).filter((v) => v !== undefined) as Deg[];
        if (ad === "COUNTIF") return l.length;
        const s = l.filter((v): v is number => typeof v === "number");
        return ad === "SUMIF" ? s.reduce((x, y) => x + y, 0) : s.length ? s.reduce((x, y) => x + y, 0) / s.length : 0;
      }
      default: throw new Error(`işlev ${ad}`);
    }
  };
  return { hucre, hesapla };
}

/** Toplam satırı: ilk metin sütununa "Toplam", sayısal sütunlara TOPLA formülü (yüzde sütununa ortalama). */
function toplamSatiri(s: TabloSayfasi): Hucre[] {
  const son = s.satirlar.length + 1;
  return s.sutunlar.map((c, i) => {
    if (c.bicim && SAYISAL.has(c.bicim) && s.satirlar.length) return c.bicim === "yuzde" ? `=AVERAGE(${sutunHarfi(i)}2:${sutunHarfi(i)}${son})` : `=SUM(${sutunHarfi(i)}2:${sutunHarfi(i)}${son})`;
    return i === 0 ? "Toplam" : null;
  });
}

const PARA_SIMGE: Record<ParaBirimi, string> = { TRY: "₺", USD: "$", EUR: "€", GBP: "£" };
function sayiBicimi(c: { bicim?: SutunBicim; para_birimi?: ParaBirimi }): string | undefined {
  switch (c.bicim) {
    case "sayi": return "#,##0.00";
    case "tamsayi": return "#,##0";
    case "para": { const p = c.para_birimi ?? "TRY"; return p === "TRY" ? '#,##0.00 "₺"' : p === "EUR" ? '#,##0.00 "€"' : `"${PARA_SIMGE[p]}"#,##0.00`; }
    case "yuzde": return "0.0%";
    case "tarih": return "dd.mm.yyyy";
    default: return undefined;
  }
}
function tarihCoz(v: Hucre): Date | null {
  if (typeof v !== "string") return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  if (iso) return new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3]));
  const tr = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(v.trim());
  if (tr) return new Date(Date.UTC(+tr[3], +tr[2] - 1, +tr[1]));
  return null;
}
function goster(v: Deg, c: { bicim?: SutunBicim; para_birimi?: ParaBirimi }): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "DOĞRU" : "YANLIŞ";
  if (typeof v === "number") {
    if (c.bicim === "para") return new Intl.NumberFormat("tr-TR", { style: "currency", currency: c.para_birimi ?? "TRY", minimumFractionDigits: 2 }).format(v);
    if (c.bicim === "yuzde") return new Intl.NumberFormat("tr-TR", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v);
    if (c.bicim === "tamsayi") return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(v);
    if (c.bicim === "sayi") return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
    return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 6 }).format(v);
  }
  if (c.bicim === "tarih") { const d = tarihCoz(v); if (d) return d.toLocaleDateString("tr-TR", { timeZone: "UTC" }); }
  return v;
}

/* ═════════════ Üretim ═════════════ */
export async function docxUret(g: BelgeGirdi): Promise<Buffer> {
  const D = docxLib();
  const { AlignmentType, BorderStyle, Document, Footer, HeadingLevel, LevelFormat, Packer, PageNumber, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType, PageBreak } = D;
  const runlar = (metin: string, ek: { bold?: boolean; color?: string; italics?: boolean; size?: number } = {}) =>
    satirParcala(metin).map((p) => new TextRun({ text: p.t, bold: p.b || ek.bold, italics: p.i || ek.italics, ...(ek.color ? { color: ek.color } : {}), ...(ek.size ? { size: ek.size } : {}), ...(p.k ? { font: "Consolas", shading: { type: ShadingType.CLEAR, color: "auto", fill: "F1F3F5" } } : {}) }));
  const HIZA = { sol: AlignmentType.LEFT, orta: AlignmentType.CENTER, sag: AlignmentType.RIGHT, iki: AlignmentType.JUSTIFIED } as const;
  const govde: (InstanceType<typeof Paragraph> | InstanceType<typeof Table>)[] = [];
  if (g.baslik) govde.push(new Paragraph({ heading: HeadingLevel.TITLE, children: runlar(g.baslik) }));
  if (g.alt_baslik) govde.push(new Paragraph({ style: "AltBaslik", children: runlar(g.alt_baslik) }));
  let sirali = 0;
  const ICERIK_GENISLIK = 9026;
  for (const b of g.bloklar) {
    if (b.tur === "baslik") govde.push(new Paragraph({ heading: [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3][b.seviye - 1], children: runlar(b.metin) }));
    else if (b.tur === "paragraf") govde.push(new Paragraph({ children: runlar(b.metin), ...(b.hiza ? { alignment: HIZA[b.hiza] } : {}) }));
    else if (b.tur === "liste") {
      if (b.sirali) sirali++;
      for (const m of b.maddeler) govde.push(new Paragraph({ numbering: b.sirali ? { reference: "sirali", level: 0, instance: sirali } : { reference: "madde", level: 0 }, children: runlar(m), spacing: { after: 80 } }));
    } else if (b.tur === "alinti") govde.push(new Paragraph({ style: "Alinti", children: runlar(b.metin, { italics: true }) }));
    else if (b.tur === "ayrac") govde.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "D0D7DE", space: 1 } }, spacing: { after: 240 }, children: [] }));
    else if (b.tur === "sayfa_sonu") govde.push(new Paragraph({ children: [new PageBreak()] }));
    else if (b.tur === "tablo") {
      const n = b.basliklar.length;
      const w = Math.floor(ICERIK_GENISLIK / n);
      const kenar = { style: BorderStyle.SINGLE, size: 4, color: "D0D7DE" };
      const hucre = (m: string, bas: boolean, i: number) => new TableCell({
        width: { size: w, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        shading: bas ? { type: ShadingType.CLEAR, color: "auto", fill: "17324D" } : i % 2 ? { type: ShadingType.CLEAR, color: "auto", fill: "F6F8FA" } : undefined,
        children: [new Paragraph({ spacing: { after: 0 }, children: runlar(m, bas ? { bold: true, color: "FFFFFF" } : {}) })],
      });
      govde.push(new Table({
        width: { size: ICERIK_GENISLIK, type: WidthType.DXA }, columnWidths: Array.from({ length: n }, () => w),
        borders: { top: kenar, bottom: kenar, left: kenar, right: kenar, insideHorizontal: kenar, insideVertical: kenar },
        rows: [
          new TableRow({ tableHeader: true, children: b.basliklar.map((x) => hucre(x, true, 0)) }),
          ...b.satirlar.map((r, i) => new TableRow({ children: r.map((x) => hucre(x, false, i)) })),
        ],
      }));
      govde.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
    }
  }
  if (!govde.length) govde.push(new Paragraph({ children: [] }));
  const doc = new Document({
    creator: "Vayra", title: g.baslik ?? g.ad, description: "Vayra ile oluşturuldu",
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22, color: "1F2328", language: { value: "tr-TR" } }, paragraph: { spacing: { after: 160, line: 300 } } },
        title: { run: { font: "Calibri", size: 52, bold: true, color: "0F2A40" }, paragraph: { spacing: { after: 120 } } },
        heading1: { run: { font: "Calibri", size: 34, bold: true, color: "12324A" }, paragraph: { spacing: { before: 360, after: 140 } } },
        heading2: { run: { font: "Calibri", size: 28, bold: true, color: "1C5D7F" }, paragraph: { spacing: { before: 280, after: 120 } } },
        heading3: { run: { font: "Calibri", size: 24, bold: true, color: "2B6F92" }, paragraph: { spacing: { before: 220, after: 100 } } },
      },
      paragraphStyles: [
        { id: "AltBaslik", name: "Alt başlık", basedOn: "Normal", run: { size: 26, color: "57606A" }, paragraph: { spacing: { after: 360 } } },
        { id: "Alinti", name: "Alıntı", basedOn: "Normal", run: { color: "424A53" }, paragraph: { indent: { left: 420 }, border: { left: { style: BorderStyle.SINGLE, size: 18, color: "2B9CC4", space: 12 } }, spacing: { before: 120, after: 200 } } },
      ],
    },
    numbering: {
      config: [
        { reference: "madde", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 300 } } } }] },
        { reference: "sirali", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      ],
    },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], color: "8C959F", size: 18 })] })] }) },
      children: govde,
    }],
  });
  return Packer.toBuffer(doc);
}

export async function xlsxUret(g: TabloGirdi): Promise<Buffer> {
  const ExcelJS = exceljsLib();
  const wb = new ExcelJS.Workbook();
  wb.creator = "Vayra"; wb.created = new Date();
  wb.calcProperties = { fullCalcOnLoad: true };
  const h = hesaplayici(g);
  for (const s of g.sayfalar) {
    const ws = wb.addWorksheet(s.ad, { views: [{ state: "frozen", ySplit: 1 }] });
    const n = s.sutunlar.length;
    const satirlar = s.toplam_satiri ? [...s.satirlar, toplamSatiri(s)] : s.satirlar;
    ws.columns = s.sutunlar.map((c, i) => {
      const uz = Math.max(c.baslik.length, ...satirlar.slice(0, 400).map((r) => { const v = r[i]; return typeof v === "string" && v.startsWith("=") ? 10 : goster(v as Deg, c).length; }));
      return { header: c.baslik, key: `c${i}`, width: c.genislik ?? Math.min(60, Math.max(9, uz + 3)) };
    });
    const bas = ws.getRow(1);
    bas.height = 24;
    bas.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Calibri", size: 11 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF17324D" } };
      cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
      cell.border = { bottom: { style: "thin", color: { argb: "FF0E1F30" } } };
    });
    satirlar.forEach((r, ri) => {
      const row = ws.getRow(ri + 2);
      const toplam = s.toplam_satiri && ri === satirlar.length - 1;
      r.forEach((v, ci) => {
        const cell = row.getCell(ci + 1);
        const c = s.sutunlar[ci];
        if (typeof v === "string" && v.startsWith("=")) {
          let sonuc: Deg | undefined;
          try { sonuc = h.hucre(s.ad, ri + 1, ci); } catch { sonuc = undefined; }
          cell.value = { formula: formulHazirla(v), ...(sonuc !== undefined && sonuc !== null ? { result: sonuc as number | string | boolean } : {}) } as ExcelJST.CellFormulaValue;
        } else if (c.bicim === "tarih" && tarihCoz(v)) cell.value = tarihCoz(v);
        else cell.value = v as ExcelJST.CellValue;
        const fmt = sayiBicimi(c);
        if (fmt) cell.numFmt = fmt;
        cell.alignment = { vertical: "top", wrapText: typeof v === "string" && v.length > 40 && !v.startsWith("=") };
        if (toplam) { cell.font = { bold: true }; cell.border = { top: { style: "double", color: { argb: "FF17324D" } } }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEAF2F8" } }; }
        else if (ri % 2 === 1) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF6F8FA" } };
      });
    });
    if (n && s.satirlar.length) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: n } };
  }
  return Buffer.from(await wb.xlsx.writeBuffer());
}

/* Görsel boyutu (PNG, JPEG, WebP, GIF): PPTX'te "kapla" kırpması için. */
export function gorselBoyutu(b: Buffer): { w: number; h: number } | null {
  if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b.length > 10 && b.toString("latin1", 0, 3) === "GIF") return { w: b.readUInt16LE(6), h: b.readUInt16LE(8) };
  if (b.length > 30 && b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP") {
    const t = b.toString("latin1", 12, 16);
    if (t === "VP8X") return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    if (t === "VP8L") { const x = b.readUInt32LE(21); return { w: (x & 0x3fff) + 1, h: ((x >> 14) & 0x3fff) + 1 }; }
    if (t === "VP8 ") return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length - 9) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return null;
}

export type GorselOku = (url: string) => Promise<{ veri: Buffer; mime: string } | null>;

export async function pptxUret(g: SunumGirdi, gorselOku: GorselOku): Promise<Buffer> {
  const P = pptxLib();
  const p = new P();
  p.layout = "LAYOUT_WIDE";
  p.author = "Vayra"; p.company = "Vayra"; p.title = g.ad;
  const t = temaCoz(g.tema, g.ana_renk);
  const W = 13.333, H = 7.5, X = 0.75, YAZI = "Calibri";
  const gorseller = new Map<string, { data: string; w: number; h: number } | null>();
  for (const s of g.slaytlar) if (s.gorsel && !gorseller.has(s.gorsel)) {
    const v = await gorselOku(s.gorsel).catch(() => null);
    const b = v ? gorselBoyutu(v.veri) : null;
    gorseller.set(s.gorsel, v && b ? { data: `data:${v.mime};base64,${v.veri.toString("base64")}`, ...b } : null);
  }
  const maddeKutusu = (sl: PptxGenJST.Slide, l: string[], x: number, y: number, w: number, h: number, boyut = 20) => {
    if (!l.length) return;
    sl.addText(l.map((m) => ({ text: duzMetin(m), options: { bullet: { indent: 22 }, paraSpaceAfter: 10, breakLine: true } })), { x, y, w, h, fontFace: YAZI, fontSize: boyut, color: t.metin, valign: "top", lineSpacingMultiple: 1.1, margin: 0 });
  };
  const baslikYaz = (sl: PptxGenJST.Slide, b: string | undefined, w = W - 2 * X) => {
    if (!b) return;
    sl.addShape("rect", { x: X, y: 0.62, w: 0.55, h: 0.06, fill: { color: t.vurgu }, line: { color: t.vurgu, width: 0 } });
    sl.addText(b, { x: X, y: 0.78, w, h: 0.95, fontFace: YAZI, fontSize: 30, bold: true, color: t.metin, valign: "top", margin: 0, fit: "shrink" });
  };
  g.slaytlar.forEach((s, i) => {
    const sl = p.addSlide();
    sl.background = { color: t.zemin };
    const gorsel = s.gorsel ? gorseller.get(s.gorsel) : null;
    const duzen: SlaytDuzen = s.duzen === "gorsel" && !gorsel ? "madde" : s.duzen;
    if (duzen === "kapak") {
      sl.addShape("rect", { x: 0, y: 0, w: 0.18, h: H, fill: { color: t.vurgu }, line: { color: t.vurgu, width: 0 } });
      sl.addText(s.baslik ?? g.ad, { x: 1.1, y: 2.2, w: W - 2.2, h: 1.9, fontFace: YAZI, fontSize: 46, bold: true, color: t.metin, valign: "bottom", margin: 0, fit: "shrink" });
      if (s.alt_baslik) sl.addText(s.alt_baslik, { x: 1.1, y: 4.25, w: W - 2.2, h: 1.1, fontFace: YAZI, fontSize: 20, color: t.soluk, valign: "top", margin: 0 });
    } else if (duzen === "bolum") {
      sl.addText(`Bölüm ${g.slaytlar.slice(0, i + 1).filter((x) => x.duzen === "bolum").length}`, { x: 1.1, y: 2.5, w: 6, h: 0.5, fontFace: YAZI, fontSize: 16, bold: true, color: t.vurgu, margin: 0 });
      sl.addText(s.baslik ?? "", { x: 1.1, y: 3.0, w: W - 2.2, h: 1.4, fontFace: YAZI, fontSize: 40, bold: true, color: t.metin, valign: "top", margin: 0, fit: "shrink" });
      if (s.alt_baslik) sl.addText(s.alt_baslik, { x: 1.1, y: 4.4, w: W - 2.2, h: 0.9, fontFace: YAZI, fontSize: 18, color: t.soluk, margin: 0 });
    } else if (duzen === "iki_sutun") {
      baslikYaz(sl, s.baslik);
      const gw = (W - 2 * X - 0.4) / 2;
      [s.sol, s.sag].forEach((c, k) => {
        const x = X + k * (gw + 0.4);
        sl.addShape("roundRect", { x, y: 1.95, w: gw, h: 4.85, fill: { color: t.yuzey }, line: { color: t.yuzey, width: 0 }, rectRadius: 0.12 });
        if (c?.baslik) sl.addText(c.baslik, { x: x + 0.35, y: 2.2, w: gw - 0.7, h: 0.6, fontFace: YAZI, fontSize: 20, bold: true, color: t.vurgu, margin: 0 });
        maddeKutusu(sl, c?.maddeler ?? [], x + 0.35, c?.baslik ? 2.95 : 2.3, gw - 0.7, 3.6, 17);
      });
    } else if (duzen === "gorsel" && gorsel) {
      const sol = s.gorsel_konum === "sol";
      const gx = sol ? 0 : W / 2, mx = sol ? W / 2 + 0.55 : X;
      sl.addImage({ data: gorsel.data, x: gx, y: 0, w: W / 2, h: H, sizing: { type: "cover", w: W / 2, h: H } });
      if (s.baslik) sl.addText(s.baslik, { x: mx, y: 0.85, w: W / 2 - 1.3, h: 1.4, fontFace: YAZI, fontSize: 30, bold: true, color: t.metin, valign: "top", margin: 0, fit: "shrink" });
      maddeKutusu(sl, s.maddeler ?? [], mx, 2.45, W / 2 - 1.3, 4.3, 18);
    } else if (duzen === "alinti") {
      sl.addText("“", { x: 1.0, y: 0.9, w: 1.5, h: 1.5, fontFace: "Georgia", fontSize: 120, color: t.vurgu, margin: 0 });
      sl.addText(s.alinti ?? s.baslik ?? "", { x: 1.6, y: 2.2, w: W - 3.2, h: 2.8, fontFace: "Georgia", fontSize: 30, italic: true, color: t.metin, valign: "middle", margin: 0, fit: "shrink" });
      if (s.alinti_sahibi) sl.addText(s.alinti_sahibi, { x: 1.6, y: 5.2, w: W - 3.2, h: 0.6, fontFace: YAZI, fontSize: 16, color: t.soluk, margin: 0 });
    } else if (duzen === "rakamlar") {
      baslikYaz(sl, s.baslik);
      const r = s.rakamlar ?? [];
      const gw = (W - 2 * X - 0.3 * (r.length - 1)) / Math.max(1, r.length);
      r.forEach((x, k) => {
        const xx = X + k * (gw + 0.3);
        sl.addShape("roundRect", { x: xx, y: 2.3, w: gw, h: 3.2, fill: { color: t.yuzey }, line: { color: t.yuzey, width: 0 }, rectRadius: 0.12 });
        sl.addText(x.deger, { x: xx + 0.3, y: 2.7, w: gw - 0.6, h: 1.3, fontFace: YAZI, fontSize: 48, bold: true, color: t.vurgu, margin: 0, fit: "shrink" });
        sl.addText(x.etiket, { x: xx + 0.3, y: 4.1, w: gw - 0.6, h: 1.1, fontFace: YAZI, fontSize: 16, color: t.soluk, valign: "top", margin: 0 });
      });
      if (s.alt_baslik) sl.addText(s.alt_baslik, { x: X, y: 5.9, w: W - 2 * X, h: 0.6, fontFace: YAZI, fontSize: 15, color: t.soluk, margin: 0 });
    } else {
      baslikYaz(sl, s.baslik);
      if (s.alt_baslik) sl.addText(s.alt_baslik, { x: X, y: 1.75, w: W - 2 * X, h: 0.5, fontFace: YAZI, fontSize: 16, color: t.soluk, margin: 0 });
      maddeKutusu(sl, s.maddeler ?? [], X, s.alt_baslik ? 2.4 : 2.05, W - 2 * X, 4.6);
    }
    if (i > 0) {
      sl.addText(g.ad, { x: X, y: H - 0.5, w: 7, h: 0.3, fontFace: YAZI, fontSize: 10, color: t.soluk, margin: 0 });
      sl.addText(String(i + 1), { x: W - X - 1, y: H - 0.5, w: 1, h: 0.3, fontFace: YAZI, fontSize: 10, color: t.soluk, align: "right", margin: 0 });
    }
    if (s.notlar) sl.addNotes(s.notlar);
  });
  return (await p.write({ outputType: "nodebuffer" })) as Buffer;
}

/* ═════════════ Önizleme ve özet ═════════════ */
const ONIZLEME_SATIR = 500;
export function tabloOnizleme(g: TabloGirdi): TabloOnizlemeSayfa[] {
  const h = hesaplayici(g);
  return g.sayfalar.map((s) => {
    const hucre = (v: Hucre, ri: number, ci: number): TabloOnizlemeHucre => {
      const c = s.sutunlar[ci];
      if (typeof v === "string" && v.startsWith("=")) {
        try { const x = h.hucre(s.ad, ri + 1, ci); return { m: goster(x, c), f: formulHazirla(v), s: typeof x === "number" }; } catch { return { m: formulHazirla(v), f: formulHazirla(v) }; }
      }
      return { m: goster(v as Deg, c), ...(typeof v === "number" ? { s: true } : {}) };
    };
    const satirlar = s.satirlar.slice(0, ONIZLEME_SATIR).map((r, ri) => r.map((v, ci) => hucre(v, ri, ci)));
    const toplam = s.toplam_satiri ? toplamSatiri(s).map((v, ci) => hucre(v, s.satirlar.length, ci)) : undefined;
    const sutunlar = s.sutunlar.map((c, ci) => ({ baslik: c.baslik, sag: !!c.bicim && SAYISAL.has(c.bicim), genislik: c.genislik ?? Math.min(48, Math.max(8, c.baslik.length + 2, ...satirlar.slice(0, 60).map((r) => r[ci]?.m.length ?? 0))) }));
    return { ad: s.ad, sutunlar, satirlar, ...(toplam ? { toplam } : {}), ...(s.satirlar.length > ONIZLEME_SATIR ? { kesildi: s.satirlar.length - ONIZLEME_SATIR } : {}) };
  });
}

export function onizlemeHazirla(bicim: DosyaBicim, girdi: unknown): DosyaOnizleme {
  if (bicim === "docx") return { bicim, girdi: girdi as BelgeGirdi };
  if (bicim === "xlsx") return { bicim, sayfalar: tabloOnizleme(girdi as TabloGirdi) };
  const g = girdi as SunumGirdi;
  return { bicim, girdi: g, tema: temaCoz(g.tema, g.ana_renk) };
}

export function kucukHazirla(bicim: DosyaBicim, girdi: unknown): KucukOnizleme {
  if (bicim === "docx") {
    const g = girdi as BelgeGirdi;
    const satirlar: { t: "b" | "p" | "l"; m: string }[] = [];
    for (const b of g.bloklar) {
      if (satirlar.length >= 9) break;
      if (b.tur === "baslik") satirlar.push({ t: "b", m: duzMetin(b.metin).slice(0, 80) });
      else if (b.tur === "paragraf" || b.tur === "alinti") satirlar.push({ t: "p", m: duzMetin(b.metin).slice(0, 220) });
      else if (b.tur === "liste") for (const m of b.maddeler.slice(0, 3)) satirlar.push({ t: "l", m: duzMetin(m).slice(0, 90) });
      else if (b.tur === "tablo") satirlar.push({ t: "p", m: b.basliklar.join(" · ").slice(0, 120) });
    }
    return { bicim, ...(g.baslik ? { baslik: g.baslik.slice(0, 90) } : {}), satirlar };
  }
  if (bicim === "xlsx") {
    const g = girdi as TabloGirdi;
    const s = tabloOnizleme({ ...g, sayfalar: g.sayfalar.slice(0, 1).map((x) => ({ ...x, satirlar: x.satirlar.slice(0, 8) })) })[0];
    return { bicim, sayfa: s?.ad ?? "", basliklar: (s?.sutunlar ?? []).slice(0, 6).map((c) => c.baslik), satirlar: (s?.satirlar ?? []).slice(0, 8).map((r) => r.slice(0, 6).map((c) => c.m)), sayfaSayisi: g.sayfalar.length };
  }
  const g = girdi as SunumGirdi;
  return { bicim, slayt: g.slaytlar[0] ?? { duzen: "kapak", baslik: g.ad }, tema: temaCoz(g.tema, g.ana_renk), sayi: g.slaytlar.length };
}

export function ozetYaz(bicim: DosyaBicim, girdi: unknown): string {
  const sayi = (n: number) => new Intl.NumberFormat("tr-TR").format(n);
  if (bicim === "docx") {
    const g = girdi as BelgeGirdi;
    const metin = g.bloklar.map((b) => (b.tur === "liste" ? b.maddeler.join(" ") : b.tur === "tablo" ? b.satirlar.flat().join(" ") : "metin" in b ? b.metin : "")).join(" ");
    const kelime = (metin.match(/\S+/g) ?? []).length;
    const tablo = g.bloklar.filter((b) => b.tur === "tablo").length;
    return [`${sayi(kelime)} kelime`, `${Math.max(1, Math.ceil(kelime / 450) + g.bloklar.filter((b) => b.tur === "sayfa_sonu").length)} sayfa`, tablo ? `${tablo} tablo` : ""].filter(Boolean).join(" · ");
  }
  if (bicim === "xlsx") {
    const g = girdi as TabloGirdi;
    const satir = g.sayfalar.reduce((t, s) => t + s.satirlar.length, 0);
    const formul = g.sayfalar.reduce((t, s) => t + s.satirlar.flat().filter((v) => typeof v === "string" && v.startsWith("=")).length + (s.toplam_satiri ? s.sutunlar.length : 0), 0);
    return [`${g.sayfalar.length} sayfa`, `${sayi(satir)} satır`, formul ? `${sayi(formul)} formül` : ""].filter(Boolean).join(" · ");
  }
  const g = girdi as SunumGirdi;
  return `${g.slaytlar.length} slayt`;
}
