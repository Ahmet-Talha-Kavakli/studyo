/**
 * Yanıt / belge dışa aktarma: Markdown, Word (.doc — Word'ün açtığı HTML belge), PDF (yazdırma
 * penceresi → "PDF olarak kaydet") ve Markdown tablolarından CSV (Excel'de açılır).
 */
const dosyaAdi = (ad: string) => (ad.replace(/[^\wğüşıöçĞÜŞİÖÇ -]/g, "").trim().slice(0, 60) || "supercomputer").replace(/\s+/g, "-");

function blobIndir(icerik: BlobPart, tur: string, ad: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([icerik], { type: tur }));
  a.download = ad; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

const BELGE_STIL = `body{font-family:Georgia,'Times New Roman',serif;font-size:12pt;line-height:1.6;color:#111;max-width:720px;margin:32px auto;padding:0 24px}
h1,h2,h3,h4{font-family:Arial,Helvetica,sans-serif;line-height:1.25;margin:1.2em 0 .5em}h1{font-size:22pt}h2{font-size:17pt}h3{font-size:14pt}
table{border-collapse:collapse;width:100%;margin:12px 0;font-family:Arial,sans-serif;font-size:10.5pt}th,td{border:1px solid #bbb;padding:6px 8px;text-align:left}th{background:#f1f3f5}
pre,code{font-family:Consolas,'Courier New',monospace;font-size:10pt;background:#f4f5f7}pre{padding:10px;border-radius:6px;white-space:pre-wrap}blockquote{border-left:3px solid #0a6e8a;margin:0;padding-left:12px;color:#444}
a{color:#0a6e8a}button{display:none}`;

export const mdIndir = (metin: string, baslik: string) => blobIndir(metin, "text/markdown;charset=utf-8", `${dosyaAdi(baslik)}.md`);

/** Word: HTML belgesi .doc uzantısıyla — Word ve Google Docs biçimiyle açar. */
export const wordIndir = (html: string, baslik: string) => blobIndir(
  `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${baslik}</title><style>${BELGE_STIL}</style></head><body><h1>${baslik}</h1>${html}</body></html>`,
  "application/msword", `${dosyaAdi(baslik)}.doc`);

/** PDF: biçimli ayrı pencere açar ve yazdırma iletişimini başlatır (hedef: PDF olarak kaydet). */
export function pdfYazdir(html: string, baslik: string) {
  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) return false;
  w.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${baslik}</title><style>${BELGE_STIL}@media print{body{margin:0 auto}}</style></head><body><h1>${baslik}</h1>${html}</body></html>`);
  w.document.close(); w.focus();
  setTimeout(() => w.print(), 300);
  return true;
}

/** Markdown içindeki tabloları CSV'ye çevirir (birden çok tablo boş satırla ayrılır). */
export function tablolariCsv(metin: string): string | null {
  const tablolar: string[][][] = [];
  let simdiki: string[][] | null = null;
  for (const satir of metin.split("\n")) {
    const t = satir.trim();
    if (/^\|.*\|$/.test(t)) {
      if (/^\|[\s:|-]+\|$/.test(t)) continue; // ayraç satırı
      const hucreler = t.slice(1, -1).split("|").map((h) => h.trim().replace(/\*\*/g, ""));
      (simdiki ??= []).push(hucreler);
    } else if (simdiki) { tablolar.push(simdiki); simdiki = null; }
  }
  if (simdiki) tablolar.push(simdiki);
  if (!tablolar.length) return null;
  const kac = (h: string) => (/[;"\n]/.test(h) ? `"${h.replace(/"/g, '""')}"` : h);
  return tablolar.map((t) => t.map((s) => s.map(kac).join(";")).join("\r\n")).join("\r\n\r\n");
}
export const csvIndir = (csv: string, baslik: string) => blobIndir("﻿" + csv, "text/csv;charset=utf-8", `${dosyaAdi(baslik)}.csv`);
