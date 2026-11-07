import "server-only";
import { guvenliFetch } from "@/lib/guvenliAg";

/**
 * Bağımlılık listesi (SBOM) ve bilinen açıklar. Sitenin kodundan çıkarılır: CDN'den yüklenen betik ve stiller
 * (jsDelivr, unpkg, cdnjs, esm.sh, Skypack, JSPM, code.jquery.com), içe aktarma haritaları, adresli import'lar ve
 * package.json. Bilinen açıklar OSV.dev açık veritabanından (Google'ın yönettiği, npm GitHub Advisory verisini de
 * içerir) sorgulanır; sonuç 6 saat bellekte tutulur. OSV'ye ulaşılamazsa liste sürümleriyle gösterilir ve bu açıkça
 * söylenir; sürümü bilinmeyen paket için açık sorgulanamaz.
 */
export type Bagimlilik = {
  ad: string; surum: string | null; ekosistem: "npm"; kaynak: string; dosyalar: string[];
  sabit: boolean; butunluk: boolean | null; tur: "betik" | "stil" | "modul" | "paket";
};
export type Acik = { id: string; ozet: string; seviye: "kritik" | "yuksek" | "orta" | "dusuk" | "bilinmiyor"; duzeltilen?: string; adres: string; takma?: string[] };
export type BagimlilikSonucu = { bagimliliklar: (Bagimlilik & { aciklar: Acik[] })[]; osv: "tamam" | "ulasilamadi" | "gerekmedi"; zaman: number };

const CDNJS_AD: Record<string, string> = { "lodash.js": "lodash", "twitter-bootstrap": "bootstrap", "moment.js": "moment", "Chart.js": "chart.js", "three.js": "three", "vue": "vue", "socket.io": "socket.io-client", "font-awesome": "font-awesome", "jquery": "jquery", "jqueryui": "jquery-ui", "handlebars.js": "handlebars", "underscore.js": "underscore", "axios": "axios", "gsap": "gsap", "d3": "d3", "dompurify": "dompurify", "marked": "marked", "highlight.js": "highlight.js", "swiper": "swiper", "alpinejs": "alpinejs", "angular.js": "angular" };
const SURUM = /^\d+(\.\d+){0,3}([-+][0-9A-Za-z.-]+)?$/;

function ekle(m: Map<string, Bagimlilik>, b: Omit<Bagimlilik, "dosyalar">, dosya: string) {
  const anahtar = `${b.ad}@${b.surum ?? "?"}`;
  const x = m.get(anahtar);
  if (x) { if (!x.dosyalar.includes(dosya)) x.dosyalar.push(dosya); if (b.butunluk === false) x.butunluk = false; return; }
  m.set(anahtar, { ...b, dosyalar: [dosya] });
}

/** Adresten paket adı ve sürümü (bilinen CDN biçimleri). */
export function adrestenPaket(u: string): { ad: string; surum: string | null; kaynak: string } | null {
  let m = /^https?:\/\/cdn\.jsdelivr\.net\/npm\/((?:@[\w.-]+\/)?[\w.-]+)(?:@([^/]+))?/i.exec(u);
  if (m) return { ad: m[1].toLowerCase(), surum: m[2] ?? null, kaynak: "jsDelivr" };
  m = /^https?:\/\/(?:unpkg\.com|esm\.sh|cdn\.skypack\.dev)\/((?:@[\w.-]+\/)?[\w.-]+)(?:@([^/?]+))?/i.exec(u);
  if (m) return { ad: m[1].toLowerCase(), surum: m[2] ?? null, kaynak: /unpkg/.test(u) ? "unpkg" : /esm\.sh/.test(u) ? "esm.sh" : "Skypack" };
  m = /^https?:\/\/ga\.jspm\.io\/npm:((?:@[\w.-]+\/)?[\w.-]+)@([^/]+)/i.exec(u);
  if (m) return { ad: m[1].toLowerCase(), surum: m[2], kaynak: "JSPM" };
  m = /^https?:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/([\w.-]+)\/([^/]+)\//i.exec(u);
  if (m) return { ad: CDNJS_AD[m[1]] ?? m[1].toLowerCase(), surum: m[2], kaynak: "cdnjs" };
  m = /^https?:\/\/code\.jquery\.com\/(jquery|ui)-?(\d+\.\d+\.\d+)?/i.exec(u);
  if (m) return { ad: m[1].toLowerCase() === "ui" ? "jquery-ui" : "jquery", surum: m[2] ?? null, kaynak: "code.jquery.com" };
  m = /^https?:\/\/(?:stackpath|maxcdn)\.bootstrapcdn\.com\/bootstrap\/(\d+\.\d+\.\d+)\//i.exec(u);
  if (m) return { ad: "bootstrap", surum: m[1], kaynak: "BootstrapCDN" };
  if (/^https?:\/\/cdn\.tailwindcss\.com/i.test(u)) return { ad: "tailwindcss", surum: /[?&]v=([\d.]+)/.exec(u)?.[1] ?? null, kaynak: "Tailwind Play CDN" };
  return null;
}

/** Proje dosyalarından bağımlılık listesi. */
export function bagimliliklariCikar(dosyalar: Record<string, string>): Bagimlilik[] {
  const m = new Map<string, Bagimlilik>();
  for (const [yol, icerik] of Object.entries(dosyalar)) {
    if (yol === "package.json") {
      try {
        const j = JSON.parse(icerik) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
        for (const [ad, ham] of Object.entries({ ...(j.dependencies ?? {}) })) {
          const s = String(ham).replace(/^[\^~>=<\s]+/, "").split(/\s/)[0];
          ekle(m, { ad: ad.toLowerCase(), surum: SURUM.test(s) ? s : null, ekosistem: "npm", kaynak: "package.json", sabit: /^\d/.test(String(ham)), butunluk: null, tur: "paket" }, yol);
        }
      } catch { /* bozuk package.json */ }
      continue;
    }
    if (!/\.(html?|m?js|css|jsx|tsx?)$/i.test(yol)) continue;
    // <script src> ve <link href>: bütünlük (integrity) özniteliği de denetlenir.
    for (const t of icerik.matchAll(/<(script|link)\b[^>]*>/gi)) {
      const etiket = t[0];
      const src = /\b(?:src|href)\s*=\s*["']([^"']+)["']/i.exec(etiket)?.[1];
      if (!src || !/^https?:\/\//i.test(src)) continue;
      if (t[1].toLowerCase() === "link" && !/rel\s*=\s*["'](?:stylesheet|modulepreload)/i.test(etiket)) continue;
      const pk = adrestenPaket(src);
      if (!pk) continue;
      const surum = pk.surum && SURUM.test(pk.surum) ? pk.surum : null;
      ekle(m, { ad: pk.ad, surum, ekosistem: "npm", kaynak: pk.kaynak, sabit: !!surum, butunluk: /\bintegrity\s*=/i.test(etiket), tur: t[1].toLowerCase() === "link" ? "stil" : /type\s*=\s*["']module/i.test(etiket) ? "modul" : "betik" }, yol);
    }
    // Adresli import'lar ve içe aktarma haritası.
    for (const x of icerik.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*|["']\s*:\s*)["'](https?:\/\/[^"'\s]+)["']/g)) {
      const pk = adrestenPaket(x[1]);
      if (!pk) continue;
      const surum = pk.surum && SURUM.test(pk.surum) ? pk.surum : null;
      ekle(m, { ad: pk.ad, surum, ekosistem: "npm", kaynak: pk.kaynak, sabit: !!surum, butunluk: null, tur: "modul" }, yol);
    }
  }
  return [...m.values()].sort((a, b) => a.ad.localeCompare(b.ad));
}

/* ───────── OSV.dev ───────── */
type Onb = { z: number; l: string[] };
const G = globalThis as unknown as { __vayraOsv?: { sorgu: Map<string, Onb>; ayrinti: Map<string, { z: number; a: Acik }> } };
const onb = (G.__vayraOsv ??= { sorgu: new Map(), ayrinti: new Map() });
const SURE = 6 * 3600_000;

function seviyeBul(v: { database_specific?: { severity?: string }; severity?: { type: string; score: string }[] }): Acik["seviye"] {
  const s = String(v.database_specific?.severity ?? "").toUpperCase();
  if (s === "CRITICAL") return "kritik"; if (s === "HIGH") return "yuksek"; if (s === "MODERATE" || s === "MEDIUM") return "orta"; if (s === "LOW") return "dusuk";
  const cvss = v.severity?.find((x) => x.type.startsWith("CVSS"))?.score ?? "";
  const n = Number(/^\d+(\.\d+)?$/.test(cvss) ? cvss : NaN);
  if (Number.isFinite(n)) return n >= 9 ? "kritik" : n >= 7 ? "yuksek" : n >= 4 ? "orta" : "dusuk";
  return "bilinmiyor";
}

async function osvIstek(url: string, govde?: unknown): Promise<unknown> {
  const r = await guvenliFetch(url, { method: govde ? "POST" : "GET", headers: { "Content-Type": "application/json" }, body: govde ? JSON.stringify(govde) : undefined, signal: AbortSignal.timeout(9000) }, { yalnizHttps: true });
  if (!r.ok) throw new Error(`OSV ${r.status}`);
  return r.json();
}

/** Bağımlılıkları OSV.dev'de sorgular. */
export async function acikSorgula(l: Bagimlilik[]): Promise<BagimlilikSonucu> {
  const surumlu = l.filter((b) => b.surum);
  if (!surumlu.length) return { bagimliliklar: l.map((b) => ({ ...b, aciklar: [] })), osv: "gerekmedi", zaman: Date.now() };
  const anahtar = (b: Bagimlilik) => `${b.ad}@${b.surum}`;
  const eksik = surumlu.filter((b) => { const x = onb.sorgu.get(anahtar(b)); return !x || Date.now() - x.z > SURE; });
  let osv: BagimlilikSonucu["osv"] = "tamam";
  try {
    if (eksik.length) {
      const j = await osvIstek("https://api.osv.dev/v1/querybatch", { queries: eksik.slice(0, 200).map((b) => ({ package: { name: b.ad, ecosystem: "npm" }, version: b.surum })) }) as { results?: { vulns?: { id: string }[] }[] };
      eksik.slice(0, 200).forEach((b, i) => onb.sorgu.set(anahtar(b), { z: Date.now(), l: (j.results?.[i]?.vulns ?? []).map((v) => v.id) }));
    }
    const kimlikler = [...new Set(surumlu.flatMap((b) => onb.sorgu.get(anahtar(b))?.l ?? []))].filter((id) => { const x = onb.ayrinti.get(id); return !x || Date.now() - x.z > SURE; }).slice(0, 40);
    await Promise.all(kimlikler.map(async (id) => {
      try {
        const v = await osvIstek(`https://api.osv.dev/v1/vulns/${encodeURIComponent(id)}`) as { id: string; summary?: string; details?: string; aliases?: string[]; affected?: { ranges?: { events?: { fixed?: string }[] }[] }[]; database_specific?: { severity?: string }; severity?: { type: string; score: string }[] };
        const duzeltilen = v.affected?.flatMap((a) => a.ranges ?? []).flatMap((r) => r.events ?? []).map((e) => e.fixed).filter(Boolean).at(-1);
        onb.ayrinti.set(id, { z: Date.now(), a: { id, ozet: (v.summary ?? v.details ?? "Açıklama yok").slice(0, 240), seviye: seviyeBul(v), ...(duzeltilen ? { duzeltilen } : {}), adres: `https://osv.dev/vulnerability/${encodeURIComponent(id)}`, ...(v.aliases?.length ? { takma: v.aliases.slice(0, 3) } : {}) } });
      } catch { onb.ayrinti.set(id, { z: Date.now() - SURE + 600_000, a: { id, ozet: "Ayrıntı alınamadı.", seviye: "bilinmiyor", adres: `https://osv.dev/vulnerability/${encodeURIComponent(id)}` } }); }
    }));
  } catch { osv = "ulasilamadi"; }
  return {
    bagimliliklar: l.map((b) => ({ ...b, aciklar: b.surum ? (onb.sorgu.get(anahtar(b))?.l ?? []).map((id: string) => onb.ayrinti.get(id)?.a ?? { id, ozet: "Ayrıntı yükleniyor.", seviye: "bilinmiyor" as const, adres: `https://osv.dev/vulnerability/${id}` }) : [] })),
    osv: osv === "tamam" && eksik.length && !surumlu.every((b) => onb.sorgu.has(anahtar(b))) ? "ulasilamadi" : osv,
    zaman: Date.now(),
  };
}
