/**
 * Proje tasarım sistemi: dosyalardan renk paleti, CSS değişkenleri ve yazı tiplerini çıkarır; bir rengi, değişkeni ya da
 * yazı tipini bütün projede değiştirir. HTML'de yalnız <style> blokları ve style="" öznitelikleri taranır (çapa
 * bağlantıları gibi "#abc" metinleri karışmasın); CSS dosyaları tamamen, betik dosyalarında yalnız 6 haneli renkler.
 */
export type Renk = { deger: string; adet: number; dosyalar: string[]; degiskenler: string[] };
export type Degisken = { ad: string; deger: string; tur: "renk" | "yazi" | "olcu" | "diger"; dosya: string };
export type YaziTipi = { ad: string; adet: number; google: boolean };
export type Tema = { renkler: Renk[]; degiskenler: Degisken[]; yazilar: YaziTipi[] };

const STIL_PARCASI = /<style[^>]*>[\s\S]*?<\/style>|\sstyle="[^"]*"|\sstyle='[^']*'/gi;
const HEX = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-zA-Z_-])/g;
const HEX6 = /#[0-9a-fA-F]{6}(?![0-9a-zA-Z_-])/g;
const GENEL = new Set(["sans-serif", "serif", "monospace", "system-ui", "inherit", "initial", "cursive", "fantasy", "ui-sans-serif", "ui-serif", "ui-monospace", "-apple-system", "blinkmacsystemfont", "segoe ui", "roboto", "helvetica", "arial", "helvetica neue", "apple color emoji", "segoe ui emoji"]);

export const normalHex = (h: string) => { const x = h.toLowerCase(); return x.length === 4 ? `#${x[1]}${x[1]}${x[2]}${x[2]}${x[3]}${x[3]}` : x; };
const tur = (y: string) => (/\.css$/i.test(y) ? "css" : /\.html?$/i.test(y) ? "html" : /\.(m?js|jsx|ts|tsx)$/i.test(y) ? "js" : null);

/** Değer deseni: CSS'te tırnaklı değerler serbest; style="..." özniteliğinde yalnız özniteliği kapatan tırnak dışarıda kalır. */
const dislanan = (p: string) => (/^\sstyle="/.test(p) ? '"' : /^\sstyle='/.test(p) ? "'" : "");
const degiskenDeseni = (p: string) => new RegExp(`(--[\\w-]+)\\s*:\\s*([^;}${dislanan(p)}]+)`, "g");
const yaziDeseni = (p: string) => new RegExp(`font-family\\s*:\\s*([^;}${dislanan(p)}]+)`, "gi");

/** Dosyanın stil içeren parçaları (CSS: tamamı, HTML: style blokları ve öznitelikleri, JS: tamamı ama yalnız 6 haneli renk). */
function parcalar(yol: string, icerik: string): string[] {
  const t = tur(yol);
  if (t === "css" || t === "js") return [icerik];
  if (t === "html") return icerik.match(STIL_PARCASI) ?? [];
  return [];
}

export function temaCikar(dosyalar: Record<string, string>): Tema {
  const renk = new Map<string, Renk>();
  const yazi = new Map<string, number>();
  const google = new Set<string>();
  const degiskenler: Degisken[] = [];
  for (const [y, icerik] of Object.entries(dosyalar)) {
    const t = tur(y);
    if (!t) continue;
    if (t === "html") for (const m of icerik.matchAll(/fonts\.googleapis\.com\/css2?\?([^"'\s>]+)/gi)) for (const f of m[1].matchAll(/family=([^:&;]+)/g)) google.add(decodeURIComponent(f[1].replace(/\+/g, " ")).toLowerCase());
    for (const p of parcalar(y, icerik)) {
      for (const m of p.match(t === "js" ? HEX6 : HEX) ?? []) {
        const d = normalHex(m);
        const r = renk.get(d) ?? { deger: d, adet: 0, dosyalar: [], degiskenler: [] };
        r.adet++; if (!r.dosyalar.includes(y)) r.dosyalar.push(y);
        renk.set(d, r);
      }
      if (t === "js") continue;
      for (const m of p.matchAll(degiskenDeseni(p))) {
        const ad = m[1], deger = m[2].trim();
        if (degiskenler.some((x) => x.ad === ad)) continue;
        const dt: Degisken["tur"] = /^#|^rgb|^hsl|^oklch/i.test(deger) ? "renk" : /font|yazi/i.test(ad) || /serif|sans/i.test(deger) ? "yazi" : /^-?[\d.]+(px|rem|em|%)$/.test(deger) ? "olcu" : "diger";
        degiskenler.push({ ad, deger, tur: dt, dosya: y });
        const h = deger.match(HEX)?.[0];
        if (h) { const r = renk.get(normalHex(h)); if (r && !r.degiskenler.includes(ad)) r.degiskenler.push(ad); }
      }
      for (const m of p.matchAll(yaziDeseni(p))) {
        const ilk = m[1].split(",")[0].replace(/["']/g, "").trim();
        if (!ilk || ilk.startsWith("var(") || GENEL.has(ilk.toLowerCase())) continue;
        yazi.set(ilk, (yazi.get(ilk) ?? 0) + 1);
      }
    }
  }
  for (const d of degiskenler) if (d.tur === "yazi") { const ilk = d.deger.split(",")[0].replace(/["']/g, "").trim(); if (ilk && !GENEL.has(ilk.toLowerCase())) yazi.set(ilk, (yazi.get(ilk) ?? 0) + 1); }
  return {
    renkler: [...renk.values()].sort((a, b) => b.adet - a.adet).slice(0, 40),
    degiskenler: degiskenler.slice(0, 60),
    yazilar: [...yazi.entries()].sort((a, b) => b[1] - a[1]).map(([ad, adet]) => ({ ad, adet, google: google.has(ad.toLowerCase()) })),
  };
}

/** Bir rengi (3 ya da 6 haneli bütün yazımlarıyla) projede değiştirir. Dönüş: değişen dosyalar ve adet. */
export function renkDegistir(dosyalar: Record<string, string>, eski: string, yeni: string): { dosyalar: Record<string, string>; adet: number } {
  const hedef = normalHex(eski);
  const out: Record<string, string> = {};
  let adet = 0;
  const degistir = (p: string, re: RegExp) => p.replace(re, (m) => (normalHex(m) === hedef ? (adet++, yeni) : m));
  for (const [y, icerik] of Object.entries(dosyalar)) {
    const t = tur(y);
    if (!t) continue;
    const once = adet;
    const s = t === "html" ? icerik.replace(STIL_PARCASI, (p) => degistir(p, HEX)) : degistir(icerik, t === "js" ? HEX6 : HEX);
    if (adet > once) out[y] = s;
  }
  return { dosyalar: out, adet };
}

/** CSS değişkeninin değerini (tanımlandığı her yerde) değiştirir. */
export function degiskenDegistir(dosyalar: Record<string, string>, ad: string, deger: string): Record<string, string> {
  const out: Record<string, string> = {};
  const kac = ad.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = (p: string) => new RegExp(`(${kac}\\s*:\\s*)([^;}${dislanan(p)}]+)`, "g");
  const yaz = (p: string) => p.replace(re(p), (_, a, eski: string) => `${a}${deger}${eski.match(/\s*$/)?.[0] ?? ""}`);
  for (const [y, icerik] of Object.entries(dosyalar)) {
    const t = tur(y);
    if (t !== "css" && t !== "html") continue;
    const s = t === "html" ? icerik.replace(STIL_PARCASI, yaz) : yaz(icerik);
    if (s !== icerik) out[y] = s;
  }
  return out;
}

/** Yazı tipini font-family bildirimlerinde değiştirir; HTML başlıklarına Google Fonts bağlantısını ekler ya da günceller. */
export function yaziDegistir(dosyalar: Record<string, string>, eski: string, yeni: string): Record<string, string> {
  const out: Record<string, string> = {};
  const kac = eski.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const ad = /\s/.test(yeni) ? `"${yeni}"` : yeni;
  const aile = new RegExp(`(["']?)${kac}\\1(?=\\s*(,|;|}|"|$))`, "gi");
  const bildirim = (p: string) => { const d = dislanan(p); return new RegExp(`(font-family\\s*:\\s*)([^;}${d}]+)|(--[\\w-]*(?:font|yazi)[\\w-]*\\s*:\\s*)([^;}${d}]+)`, "gi"); };
  const css = (p: string) => p.replace(bildirim(p), (m, a1, d1, a2, d2) => (a1 ? a1 + d1.replace(aile, ad) : a2 + d2.replace(aile, ad)));
  const eskiArti = eski.replace(/ /g, "+"), yeniArti = yeni.replace(/ /g, "+");
  // Eski ailenin bütün eksen tanımı (örn. :opsz,wght@9..144,400) yeni aileye uymayabilir; standart ağırlıklarla yaz.
  const baglanti = new RegExp(`family=${eskiArti.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[:&"'])[^&"']*`, "g");
  for (const [y, icerik] of Object.entries(dosyalar)) {
    const t = tur(y);
    if (t !== "css" && t !== "html") continue;
    let s = t === "html" ? icerik.replace(STIL_PARCASI, css) : css(icerik);
    if (t === "html") {
      if (baglanti.test(s)) { baglanti.lastIndex = 0; s = s.replace(baglanti, `family=${yeniArti}:wght@300;400;500;600;700`); }
      else if (!s.includes(`family=${yeniArti}`) && /<\/head>/i.test(s) && s !== icerik) s = s.replace(/<\/head>/i, `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${yeniArti}:wght@300;400;500;600;700&display=swap">\n</head>`);
    }
    if (s !== icerik) out[y] = s;
  }
  return out;
}

/** Ajan talimatına eklenecek tasarım sistemi özeti. */
export function temaOzeti(t: Tema): string {
  const r = t.renkler.slice(0, 8).map((x) => `${x.deger}${x.degiskenler.length ? ` (${x.degiskenler.join(", ")})` : ""}`).join(", ");
  const y = t.yazilar.slice(0, 3).map((x) => x.ad).join(", ");
  return `Tasarım sistemi: renk paleti ${r || "yok"}; yazı tipleri ${y || "varsayılan"}. Yeni bölümlerde yalnız bu renkleri ve yazı tiplerini kullan, varsa CSS değişkenlerini doğrudan renk yazmak yerine kullan.`;
}
