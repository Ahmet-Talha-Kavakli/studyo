/**
 * Sohbetin dosya oluşturma araçlarının (Word, Excel, PowerPoint) ortak tipleri ve saf yardımcıları (istemci + sunucu).
 * Model yapılandırılmış JSON verir; sunucu bundan DOCX, XLSX ya da PPTX üretir, önizleme aynı JSON'dan çizilir.
 * Yüklenen Office dosyaları da okunup aynı JSON'a çevrilir; ajan bunu düzenleyip yeni sürüm üretir.
 */
export type DosyaBicim = "docx" | "xlsx" | "pptx";
export const BICIM_ADI: Record<DosyaBicim, string> = { docx: "Word belgesi", xlsx: "Excel tablosu", pptx: "PowerPoint sunumu" };
export const BICIM_RENGI: Record<DosyaBicim, string> = { docx: "#2b7cd3", xlsx: "#1f9d5a", pptx: "#d9572b" };
export const BICIM_MIME: Record<DosyaBicim, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

/* ───────────── Word ───────────── */
export type BelgeBlok =
  | { tur: "baslik"; metin: string; seviye: 1 | 2 | 3 }
  | { tur: "paragraf"; metin: string; hiza?: "sol" | "orta" | "sag" | "iki" }
  | { tur: "liste"; maddeler: string[]; sirali?: boolean }
  | { tur: "tablo"; basliklar: string[]; satirlar: string[][] }
  | { tur: "alinti"; metin: string }
  | { tur: "ayrac" }
  | { tur: "sayfa_sonu" };
export type BelgeGirdi = { ad: string; baslik?: string; alt_baslik?: string; bloklar: BelgeBlok[] };

/* ───────────── Excel ───────────── */
export type SutunBicim = "metin" | "sayi" | "tamsayi" | "para" | "yuzde" | "tarih";
export type ParaBirimi = "TRY" | "USD" | "EUR" | "GBP";
export type TabloSutun = { baslik: string; bicim?: SutunBicim; para_birimi?: ParaBirimi; genislik?: number };
export type Hucre = string | number | boolean | null;
export type TabloSayfasi = { ad: string; sutunlar: TabloSutun[]; satirlar: Hucre[][]; toplam_satiri?: boolean };
export type TabloGirdi = { ad: string; sayfalar: TabloSayfasi[] };

/* ───────────── PowerPoint ───────────── */
export type SlaytDuzen = "kapak" | "bolum" | "madde" | "iki_sutun" | "gorsel" | "alinti" | "rakamlar";
export type SlaytSutun = { baslik?: string; maddeler: string[] };
export type Slayt = {
  duzen: SlaytDuzen; baslik?: string; alt_baslik?: string; maddeler?: string[];
  sol?: SlaytSutun; sag?: SlaytSutun; gorsel?: string; gorsel_konum?: "sag" | "sol";
  alinti?: string; alinti_sahibi?: string; rakamlar?: { deger: string; etiket: string }[]; notlar?: string;
};
export type SunumTemaId = "gece" | "okyanus" | "kagit" | "kurumsal" | "toprak" | "ozel";
export type SunumGirdi = { ad: string; tema?: SunumTemaId; ana_renk?: string; slaytlar: Slayt[] };
export type Tema = { zemin: string; yuzey: string; metin: string; soluk: string; vurgu: string; koyu: boolean };

export const SUNUM_TEMALARI: Record<Exclude<SunumTemaId, "ozel">, Tema & { ad: string }> = {
  gece: { ad: "Gece", zemin: "0B0B0C", yuzey: "17181B", metin: "FFFFFF", soluk: "A1A1AA", vurgu: "55D6FD", koyu: true },
  okyanus: { ad: "Okyanus", zemin: "0A1A2F", yuzey: "112842", metin: "F1F5F9", soluk: "94A3B8", vurgu: "38BDF8", koyu: true },
  kagit: { ad: "Kâğıt", zemin: "FAF7F2", yuzey: "FFFFFF", metin: "1C1917", soluk: "78716C", vurgu: "C2410C", koyu: false },
  kurumsal: { ad: "Kurumsal", zemin: "FFFFFF", yuzey: "F1F5F9", metin: "0F172A", soluk: "64748B", vurgu: "1D4ED8", koyu: false },
  toprak: { ad: "Toprak", zemin: "1C1917", yuzey: "292524", metin: "FAFAF9", soluk: "A8A29E", vurgu: "F59E0B", koyu: true },
};
const HEX = /^#?([0-9a-f]{6})$/i;
export function temaCoz(t?: SunumTemaId, ana?: string): Tema {
  if (t && t !== "ozel" && SUNUM_TEMALARI[t]) return SUNUM_TEMALARI[t];
  const h = HEX.exec(ana ?? "")?.[1]?.toUpperCase();
  return { ...SUNUM_TEMALARI.gece, ...(h ? { vurgu: h } : {}) };
}

/* ───────────── Önizleme (sunucu hesaplar, istemci çizer) ───────────── */
export type TabloOnizlemeHucre = { m: string; f?: string; s?: boolean };
export type TabloOnizlemeSayfa = { ad: string; sutunlar: { baslik: string; sag: boolean; genislik: number }[]; satirlar: TabloOnizlemeHucre[][]; toplam?: TabloOnizlemeHucre[]; kesildi?: number };
export type DosyaOnizleme =
  | { bicim: "docx"; girdi: BelgeGirdi }
  | { bicim: "xlsx"; sayfalar: TabloOnizlemeSayfa[] }
  | { bicim: "pptx"; girdi: SunumGirdi; tema: Tema };
/** Kartta ve kitaplıkta küçük resim için hafif önizleme. */
export type KucukOnizleme =
  | { bicim: "docx"; baslik?: string; satirlar: { t: "b" | "p" | "l"; m: string }[] }
  | { bicim: "xlsx"; sayfa: string; basliklar: string[]; satirlar: string[][]; sayfaSayisi: number }
  | { bicim: "pptx"; slayt: Slayt; tema: Tema; sayi: number };

/** Kayıt bilgisi (araç sonucu ve önizleme yanıtı). */
export type DosyaBilgisi = { id: string; url: string; ad: string; bicim: DosyaBicim; boyut: number; surum: number; ozet: string; kucuk?: KucukOnizleme; onceki?: string; zaman?: number };

/** Satır içi biçim: **kalın**, *italik*, ***ikisi***, `kod`. */
export type MetinParcasi = { t: string; b?: boolean; i?: boolean; k?: boolean };
export function satirParcala(metin: string): MetinParcasi[] {
  const o: MetinParcasi[] = [];
  const re = /(\*\*\*([^*]+)\*\*\*|\*\*([^*]+)\*\*|(?<![\w*])\*([^*\n]+)\*(?![\w*])|`([^`]+)`)/g;
  let son = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(metin))) {
    if (m.index > son) o.push({ t: metin.slice(son, m.index) });
    if (m[2]) o.push({ t: m[2], b: true, i: true });
    else if (m[3]) o.push({ t: m[3], b: true });
    else if (m[4]) o.push({ t: m[4], i: true });
    else if (m[5]) o.push({ t: m[5], k: true });
    son = m.index + m[0].length;
  }
  if (son < metin.length) o.push({ t: metin.slice(son) });
  return o.length ? o : [{ t: metin }];
}
export const duzMetin = (s: string) => satirParcala(s).map((p) => p.t).join("");

/** Excel sütun harfi (0 → A, 26 → AA). */
export function sutunHarfi(i: number): string { let s = ""; let n = i + 1; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); } return s; }

/** Dosya adı: güvenli, uzantılı (Türkçe harfler korunur). */
export function dosyaAdiYap(ad: string, bicim: DosyaBicim): string {
  const t = ad.replace(/\.(docx|xlsx|pptx)$/i, "").replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) || ({ docx: "Belge", xlsx: "Tablo", pptx: "Sunum" } as const)[bicim];
  return `${t}.${bicim}`;
}
