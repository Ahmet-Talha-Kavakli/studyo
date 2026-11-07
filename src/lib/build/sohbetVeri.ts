import "server-only";
import { kodCalistir } from "./sistemKod";
import { belgeGetir } from "./belgeDepo";
import type { TabloGirdi } from "./belgeTipler";
import type { SohbetEki } from "./sohbetDepo";
import { ekMetni } from "./sohbetEk";
import type { AnalizGrafik, AnalizSonucu, AnalizTablo, GrafikTur, Hucre } from "./sohbetTipler";

/**
 * Veri analizi (ChatGPT ve Claude'un veri analizi gibi, her modelde): sohbete eklenen CSV, TSV ya da Excel
 * dosyaları tabloya çevrilir; model JavaScript yazar, kod QuickJS kum havuzunda (ağ, dosya ve Node erişimi yok;
 * 32 MB, 5 sn) tablolar üzerinde çalışır. Kod tablo() ve grafik() ile sonuç tablosu ve grafik bırakır.
 */
export type VeriTablosu = { ad: string; sutunlar: string[]; satirlar: Hucre[][]; toplam: number; kesildi?: boolean };
export type SutunOzeti = { ad: string; tur: "sayi" | "metin" | "tarih" | "bos"; dolu: number; bos: number; benzersiz: number; min?: number; max?: number; ortalama?: number; toplam?: number; enCok?: { deger: string; adet: number }[] };

const SATIR_SINIRI = 20_000;
export const veriEkiMi = (e: Pick<SohbetEki, "tur" | "ad" | "bicim">) => (e.tur === "ofis" && e.bicim === "xlsx") || (e.tur === "metin" && /\.(csv|tsv)$/i.test(e.ad));

/** CSV/TSV ayrıştırıcı: tırnaklar, kaçışlı tırnak, satır içi yeni satır; ayraç ilk satırdan sezilir (, ; sekme |). */
export function csvCoz(metin: string): { sutunlar: string[]; satirlar: string[][] } {
  const m = metin.replace(/^\uFEFF/, "");
  const ilk = m.slice(0, m.indexOf("\n") >= 0 ? m.indexOf("\n") : m.length);
  const adaylar = ["\t", ";", ",", "|"];
  const ayrac = adaylar.map((a) => [a, ilk.split(a).length] as const).sort((a, b) => b[1] - a[1])[0][0];
  const satirlar: string[][] = [];
  let satir: string[] = [], hucre = "", tirnak = false;
  for (let i = 0; i < m.length; i++) {
    const c = m[i];
    if (tirnak) {
      if (c === '"') { if (m[i + 1] === '"') { hucre += '"'; i++; } else tirnak = false; }
      else hucre += c;
      continue;
    }
    if (c === '"' && hucre === "") { tirnak = true; continue; }
    if (c === ayrac) { satir.push(hucre); hucre = ""; continue; }
    if (c === "\n" || c === "\r") {
      if (c === "\r" && m[i + 1] === "\n") i++;
      satir.push(hucre); hucre = "";
      if (satir.some((x) => x.trim())) satirlar.push(satir);
      satir = [];
      if (satirlar.length > SATIR_SINIRI + 1) break;
      continue;
    }
    hucre += c;
  }
  if (hucre || satir.length) { satir.push(hucre); if (satir.some((x) => x.trim())) satirlar.push(satir); }
  const bas = (satirlar.shift() ?? []).map((x, i) => x.trim() || `Sütun ${i + 1}`);
  const tekil = bas.map((x, i) => (bas.indexOf(x) === i ? x : `${x} ${i + 1}`));
  return { sutunlar: tekil, satirlar };
}

/** Sütun değerlerini sayıya çevirir: Türkçe biçim (1.234,56), düz (1234.56), yüzde ve para işaretleri. */
function sutunSayilastir(degerler: string[]): Hucre[] {
  const dolu = degerler.filter((x) => x.trim());
  if (!dolu.length) return degerler.map(() => null);
  const sade = (x: string) => x.trim().replace(/^[₺$€£]\s*|\s*(TL|₺|\$|€|£|%)$/gi, "").replace(/\s/g, "");
  const tr = /^-?\d{1,3}(\.\d{3})+(,\d+)?$|^-?\d+,\d+$/;
  const duz = /^-?\d+(\.\d+)?([eE][-+]?\d+)?$|^-?\d{1,3}(,\d{3})+(\.\d+)?$/;
  const trSay = dolu.filter((x) => tr.test(sade(x))).length, duzSay = dolu.filter((x) => duz.test(sade(x))).length;
  if (trSay + duzSay < dolu.length * 0.9) return degerler.map((x) => (x.trim() ? x.trim() : null));
  const turk = trSay > duzSay;
  return degerler.map((x) => {
    if (!x.trim()) return null;
    const s = sade(x);
    const n = turk ? Number(s.replace(/\./g, "").replace(",", ".")) : Number(s.replace(/,/g, ""));
    return Number.isFinite(n) ? n : x.trim();
  });
}

function tabloYap(ad: string, sutunlar: string[], ham: string[][]): VeriTablosu {
  const kesildi = ham.length > SATIR_SINIRI;
  const l = ham.slice(0, SATIR_SINIRI);
  const kolonlar = sutunlar.map((_, j) => sutunSayilastir(l.map((r) => r[j] ?? "")));
  return { ad, sutunlar, satirlar: l.map((_, i) => sutunlar.map((__, j) => kolonlar[j][i])), toplam: ham.length, ...(kesildi ? { kesildi } : {}) };
}

/** Eklerden tablolar (CSV/TSV tek tablo, Excel her sayfa ayrı tablo: "dosya.xlsx / Sayfa1"). */
export async function ekTablolari(ekler: SohbetEki[]): Promise<VeriTablosu[]> {
  const o: VeriTablosu[] = [];
  const gorulen = new Set<string>();
  for (const e of ekler) {
    if (!veriEkiMi(e) || gorulen.has(e.url)) continue;
    gorulen.add(e.url);
    if (e.tur === "metin") {
      const c = csvCoz(await ekMetni(e));
      if (c.sutunlar.length) o.push(tabloYap(e.ad, c.sutunlar, c.satirlar));
    } else if (e.belge) {
      const k = await belgeGetir(e.belge);
      const g = k?.girdi as TabloGirdi | undefined;
      for (const s of g?.sayfalar ?? []) {
        const sut = s.sutunlar.map((x, i) => x.baslik?.trim() || `Sütun ${i + 1}`);
        const t: VeriTablosu = { ad: g!.sayfalar.length > 1 ? `${e.ad} / ${s.ad}` : e.ad, sutunlar: sut, satirlar: s.satirlar.slice(0, SATIR_SINIRI).map((r) => sut.map((_, j) => (r[j] === undefined ? null : r[j]))), toplam: s.satirlar.length };
        if (s.satirlar.length > SATIR_SINIRI) t.kesildi = true;
        o.push(t);
      }
    }
    if (o.length >= 8) break;
  }
  return o;
}

/** Sütun özetleri (tür, boş, benzersiz, en küçük, en büyük, ortalama, en sık değerler). */
export function sutunOzetleri(t: Pick<VeriTablosu, "sutunlar" | "satirlar">): SutunOzeti[] {
  return t.sutunlar.map((ad, j) => {
    const v = t.satirlar.map((r) => r[j]);
    const dolu = v.filter((x) => x !== null && x !== "");
    const sayilar = dolu.filter((x): x is number => typeof x === "number");
    const sayac = new Map<string, number>();
    for (const x of dolu) sayac.set(String(x), (sayac.get(String(x)) ?? 0) + 1);
    const tarih = !sayilar.length && dolu.length > 0 && dolu.slice(0, 50).every((x) => /^\d{4}-\d{2}-\d{2}|^\d{1,2}[./]\d{1,2}[./]\d{2,4}/.test(String(x)));
    const tur: SutunOzeti["tur"] = !dolu.length ? "bos" : sayilar.length >= dolu.length * 0.9 ? "sayi" : tarih ? "tarih" : "metin";
    const o: SutunOzeti = { ad, tur, dolu: dolu.length, bos: v.length - dolu.length, benzersiz: sayac.size };
    if (tur === "sayi" && sayilar.length) {
      let min = Infinity, max = -Infinity, top = 0;
      for (const n of sayilar) { if (n < min) min = n; if (n > max) max = n; top += n; }
      Object.assign(o, { min, max, toplam: Math.round(top * 1000) / 1000, ortalama: Math.round((top / sayilar.length) * 1000) / 1000 });
    } else o.enCok = [...sayac.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([deger, adet]) => ({ deger: deger.slice(0, 60), adet }));
    return o;
  });
}

/** Modelin göreceği tablo tarifi (sütunlar, türler, ilk satırlar). */
export function tabloTarifi(l: VeriTablosu[]): string {
  if (!l.length) return "";
  return `\n\n<veri-tablolari>\nSohbette veri analizi için yüklenmiş tablolar (veri_analiz aracında veri["ad"] ile satır nesneleri dizisi olarak okunur):\n${l.map((t) => {
    const oz = sutunOzetleri({ sutunlar: t.sutunlar, satirlar: t.satirlar.slice(0, 2000) });
    return `- "${t.ad}": ${t.toplam} satır${t.kesildi ? ` (ilk ${t.satirlar.length} satır yüklendi)` : ""}. Sütunlar: ${oz.map((s) => `${s.ad} (${s.tur}${s.tur === "sayi" && s.min !== undefined ? `, ${s.min} ile ${s.max} arası` : ""})`).join(", ")}\n  İlk satırlar: ${JSON.stringify(t.satirlar.slice(0, 3))}`;
  }).join("\n")}\nHesap, istatistik, gruplama, süzme ya da grafik gerekiyorsa sayıları kafadan yazma; veri_analiz ile hesapla.\n</veri-tablolari>`;
}

const ONCUL = `
var __t = [], __g = [];
function __sutunlar(l) { var s = []; for (var i = 0; i < l.length && i < 200; i++) { var r = l[i]; if (r && typeof r === "object" && !Array.isArray(r)) for (var k in r) if (s.indexOf(k) < 0) s.push(k); } return s; }
function tablo(l, ad, sutunlar) {
  if (!Array.isArray(l)) { if (l && typeof l === "object") l = Object.keys(l).map(function (k) { return { anahtar: k, deger: l[k] }; }); else return; }
  var s = sutunlar || (Array.isArray(l[0]) ? l[0].map(function (_, i) { return "Sütun " + (i + 1); }) : __sutunlar(l));
  var satir = l.slice(0, 500).map(function (r) { return Array.isArray(r) ? r : s.map(function (k) { var v = r == null ? null : r[k]; return v === undefined ? null : (v !== null && typeof v === "object" ? JSON.stringify(v) : v); }); });
  __t.push({ ad: ad == null ? undefined : String(ad), sutunlar: s.map(String), satirlar: satir, toplam: l.length });
}
function grafik(g) { if (g && typeof g === "object") __g.push(g); }
function __s(v) { if (typeof v === "number") return v; if (v == null || v === "") return NaN; var n = Number(String(v).replace(/\\./g, "").replace(",", ".")); return isFinite(n) ? n : NaN; }
function __d(l, a) { return (l || []).map(function (r) { return a == null ? r : r == null ? null : r[a]; }).map(__s).filter(function (x) { return !isNaN(x); }); }
var istat = {
  sayi: __s,
  toplam: function (l, a) { return __d(l, a).reduce(function (x, y) { return x + y; }, 0); },
  ortalama: function (l, a) { var d = __d(l, a); return d.length ? istat.toplam(d) / d.length : null; },
  medyan: function (l, a) { var d = __d(l, a).sort(function (x, y) { return x - y; }); if (!d.length) return null; var m = Math.floor(d.length / 2); return d.length % 2 ? d[m] : (d[m - 1] + d[m]) / 2; },
  std: function (l, a) { var d = __d(l, a); if (d.length < 2) return 0; var o = istat.ortalama(d); return Math.sqrt(d.reduce(function (t, x) { return t + (x - o) * (x - o); }, 0) / (d.length - 1)); },
  min: function (l, a) { var d = __d(l, a); return d.length ? Math.min.apply(null, d) : null; },
  max: function (l, a) { var d = __d(l, a); return d.length ? Math.max.apply(null, d) : null; },
  say: function (l, a) { var o = {}; (l || []).forEach(function (r) { var k = String(a == null ? r : r == null ? null : r[a]); o[k] = (o[k] || 0) + 1; }); return o; },
  korelasyon: function (l, a, b) { var x = [], y = []; (l || []).forEach(function (r) { var p = __s(r[a]), q = __s(r[b]); if (!isNaN(p) && !isNaN(q)) { x.push(p); y.push(q); } }); if (x.length < 2) return null; var mx = istat.ortalama(x), my = istat.ortalama(y), s = 0, sx = 0, sy = 0; for (var i = 0; i < x.length; i++) { s += (x[i] - mx) * (y[i] - my); sx += (x[i] - mx) * (x[i] - mx); sy += (y[i] - my) * (y[i] - my); } return sx && sy ? s / Math.sqrt(sx * sy) : null; },
  grupla: function (l, anahtar, alan, islem) { var g = {}, sira = []; (l || []).forEach(function (r) { var k = String(typeof anahtar === "function" ? anahtar(r) : r[anahtar]); if (!g[k]) { g[k] = []; sira.push(k); } g[k].push(r); }); return sira.map(function (k) { var o = {}; o[typeof anahtar === "string" ? anahtar : "grup"] = k; var f = islem || "toplam"; o[alan ? alan + "_" + f : "adet"] = alan ? (f === "adet" ? g[k].length : istat[f](g[k], alan)) : g[k].length; return o; }); },
  sirala: function (l, alan, azalan) { return (l || []).slice().sort(function (x, y) { var p = x[alan], q = y[alan]; var r = typeof p === "number" && typeof q === "number" ? p - q : String(p).localeCompare(String(q), "tr"); return azalan ? -r : r; }); }
};
`;

const GRAFIK_TURLERI: GrafikTur[] = ["cubuk", "cizgi", "alan", "pasta", "sacilim"];
function grafikTemizle(g: unknown): AnalizGrafik | null {
  if (!g || typeof g !== "object") return null;
  const x = g as Record<string, unknown>;
  const tur = (GRAFIK_TURLERI.includes(x.tur as GrafikTur) ? x.tur : "cubuk") as GrafikTur;
  const etiketler = (Array.isArray(x.etiketler) ? x.etiketler : Array.isArray(x.x) ? x.x : []).slice(0, 500).map((v) => String(v ?? "").slice(0, 60));
  const ham = Array.isArray(x.seriler) ? x.seriler : Array.isArray(x.veriler) ? [{ ad: String(x.baslik ?? "Değer"), veriler: x.veriler }] : [];
  const seriler = ham.slice(0, 8).map((s, i) => {
    const y = (s && typeof s === "object" ? s : {}) as Record<string, unknown>;
    return { ad: String(y.ad ?? `Seri ${i + 1}`).slice(0, 60), veriler: (Array.isArray(y.veriler) ? y.veriler : []).slice(0, 500).map((v) => (typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0)) };
  }).filter((s) => s.veriler.length);
  if (!seriler.length) return null;
  return { tur, baslik: typeof x.baslik === "string" ? x.baslik.slice(0, 120) : undefined, etiketler: etiketler.length ? etiketler : seriler[0].veriler.map((_, i) => String(i + 1)), seriler, xAd: typeof x.xAd === "string" ? x.xAd.slice(0, 40) : undefined, yAd: typeof x.yAd === "string" ? x.yAd.slice(0, 40) : undefined };
}
function hucre(v: unknown): Hucre { return v === null || v === undefined ? null : typeof v === "number" || typeof v === "boolean" ? v : String(v).slice(0, 400); }

/** Kodu tablolarla çalıştırır. Kod fonksiyon gövdesidir: veri, tablolar, ilk, tablo(), grafik(), istat kullanılır. */
export async function analizCalistir(kod: string, tablolar: VeriTablosu[], aciklama?: string): Promise<AnalizSonucu> {
  const temizKod = kod.replace(/^\s*```[\w-]*\n?|```\s*$/g, "").replace(/export\s+default\s+/g, "").slice(0, 40_000);
  const veri: Record<string, Record<string, Hucre>[]> = {};
  for (const t of tablolar) veri[t.ad] = t.satirlar.map((r) => Object.fromEntries(t.sutunlar.map((s, j) => [s, r[j] ?? null])));
  const govde = `export default function (girdi) {
var veri = girdi.veri; var tablolar = Object.keys(veri); var ilk = veri[tablolar[0]] || [];
${ONCUL}
var __sonuc = (function () {
${temizKod}
})();
return { s: __sonuc === undefined ? null : __sonuc, t: __t, g: __g };
}`;
  const bas = Date.now();
  const o: AnalizSonucu = { tur: "analiz", ...(aciklama ? { aciklama: aciklama.slice(0, 300) } : {}), kod: temizKod, tablolar: [], grafikler: [], kaynaklar: tablolar.map((t) => t.ad) };
  try {
    const r = await kodCalistir(govde, { veri });
    const d = (r.deger ?? {}) as { s?: unknown; t?: unknown[]; g?: unknown[] };
    o.loglar = r.loglar.slice(0, 60);
    o.tablolar = (d.t ?? []).slice(0, 8).map((x) => {
      const y = x as { ad?: string; sutunlar?: unknown[]; satirlar?: unknown[][]; toplam?: number };
      return { ...(y.ad ? { ad: String(y.ad).slice(0, 80) } : {}), sutunlar: (y.sutunlar ?? []).slice(0, 40).map((s) => String(s).slice(0, 80)), satirlar: (y.satirlar ?? []).slice(0, 500).map((row) => (Array.isArray(row) ? row.slice(0, 40).map(hucre) : [])), toplam: Number(y.toplam) || (y.satirlar ?? []).length } satisfies AnalizTablo;
    });
    o.grafikler = (d.g ?? []).slice(0, 6).map(grafikTemizle).filter((x): x is AnalizGrafik => !!x);
    if (d.s !== null && d.s !== undefined) o.deger = (typeof d.s === "string" ? d.s : JSON.stringify(d.s, null, 1)).slice(0, 8000);
  } catch (e) {
    o.hata = (e as Error).message.slice(0, 600);
    o.loglar = ((e as Error & { loglar?: string[] }).loglar ?? []).slice(0, 60);
  }
  o.sure = Date.now() - bas;
  return o;
}

/** Modelin gördüğü kısa sonuç metni. */
export function analizOzeti(a: AnalizSonucu): string {
  if (a.hata) return `Kod hata verdi: ${a.hata}${a.loglar?.length ? `\nGünlük:\n${a.loglar.slice(-10).join("\n")}` : ""}\nHatayı düzeltip veri_analiz'i yeniden çağır.`;
  const p: string[] = ["Kod çalıştı; sonuçlar kullanıcıya etkileşimli tablo ve grafik olarak gösterildi."];
  if (a.deger) p.push(`Dönüş değeri:\n${a.deger.slice(0, 4000)}`);
  for (const t of a.tablolar) p.push(`Tablo${t.ad ? ` "${t.ad}"` : ""} (${t.toplam} satır): ${t.sutunlar.join(" | ")}\n${t.satirlar.slice(0, 15).map((r) => r.join(" | ")).join("\n")}`);
  for (const g of a.grafikler) p.push(`Grafik (${g.tur})${g.baslik ? ` "${g.baslik}"` : ""}: ${g.seriler.map((s) => `${s.ad} ${s.veriler.length} nokta`).join(", ")}`);
  if (a.loglar?.length) p.push(`Günlük:\n${a.loglar.slice(-15).join("\n")}`);
  p.push("Yanıtında bulguları kısaca yorumla; tabloyu ya da sayıları yeniden yazma.");
  return p.join("\n\n").slice(0, 12_000);
}
