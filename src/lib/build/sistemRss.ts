import "server-only";
import { createHash } from "crypto";
import { adresGecerli } from "./kaynak";
import { guvenliFetch } from "@/lib/guvenliAg";

/**
 * RSS tetiği: RSS 2.0, RSS 1.0 (RDF) ve Atom akışlarını kütüphanesiz okur. Öğe kimliği guid ya da id; yoksa bağlantı
 * ve başlığın özeti. Yalnız herkese açık http(s) adresleri (geliştirmede localhost da) okunur; 10 saniye, 3 MB sınırı.
 */
export type RssOge = { kimlik: string; baslik: string; baglanti: string; tarih: string | null; ozet: string; icerik: string; yazar: string; kategoriler: string[]; gorsel: string | null };
export type RssAkis = { baslik: string; baglanti: string; ogeler: RssOge[] };

const VARLIK: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " " };
function varlikCoz(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, k: string) => {
    if (k[0] === "#") { const n = k[1] === "x" || k[1] === "X" ? parseInt(k.slice(2), 16) : Number(k.slice(1)); return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m; }
    return VARLIK[k.toLowerCase()] ?? m;
  });
}
/** Etiketin ham içeriği (CDATA açılır). */
function ham(xml: string, ad: string): string | null {
  const re = new RegExp(`<${ad}(?:\\s[^>]*)?(?:/>|>([\\s\\S]*?)</${ad}>)`, "i");
  const m = re.exec(xml);
  if (!m) return null;
  return (m[1] ?? "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
}
const metin = (xml: string, ...adlar: string[]) => { for (const a of adlar) { const v = ham(xml, a); if (v !== null && v.trim()) return varlikCoz(v.replace(/<!\[CDATA\[|\]\]>/g, "")).trim(); } return ""; };
const duz = (html: string) => varlikCoz(html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ").replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, " ")).replace(/[ \t]+/g, " ").replace(/ +([.,;:!?])/g, "$1").replace(/\n\s*\n+/g, "\n").trim();
const nitelik = (etiket: string, ad: string) => { const m = new RegExp(`${ad}\\s*=\\s*["']([^"']*)["']`, "i").exec(etiket); return m ? varlikCoz(m[1]) : ""; };

function tarih(s: string): string | null {
  if (!s) return null;
  const t = Date.parse(s.trim());
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

export function rssCoz(xml: string): RssAkis {
  const atom = /<feed[\s>]/i.test(xml) && !/<rss[\s>]/i.test(xml);
  const kanal = atom ? xml.split(/<entry[\s>]/i)[0] : (ham(xml, "channel") ?? xml).split(/<item[\s>]/i)[0];
  let akisBaglanti = "";
  if (atom) { const l = [...kanal.matchAll(/<link\b[^>]*>/gi)].map((x) => x[0]); akisBaglanti = nitelik(l.find((x) => /rel=["']alternate/i.test(x)) ?? l.find((x) => !/rel=/i.test(x)) ?? "", "href"); }
  else akisBaglanti = metin(kanal, "link");
  const parcalar = atom ? [...xml.matchAll(/<entry[\s>][\s\S]*?<\/entry>/gi)].map((x) => x[0]) : [...xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)].map((x) => x[0]);
  const ogeler: RssOge[] = parcalar.slice(0, 100).map((p) => {
    let baglanti = "";
    if (atom) { const l = [...p.matchAll(/<link\b[^>]*>/gi)].map((x) => x[0]); baglanti = nitelik(l.find((x) => /rel=["']alternate/i.test(x)) ?? l.find((x) => !/rel=/i.test(x)) ?? l[0] ?? "", "href"); }
    else baglanti = metin(p, "link") || nitelik(/<item[^>]*>/i.exec(p)?.[0] ?? "", "rdf:about");
    const baslik = duz(metin(p, "title"));
    const icerikHam = metin(p, "content:encoded", "content", "description", "summary");
    const ozetHam = metin(p, "description", "summary", "content");
    const kimlik = metin(p, "guid", "id") || baglanti || createHash("sha1").update(`${baslik}|${ozetHam.slice(0, 200)}`).digest("hex");
    const yazar = duz(metin(p, "dc:creator", "author") .replace(/<email>[\s\S]*?<\/email>/i, "")) || duz(metin(ham(p, "author") ?? "", "name"));
    const kategoriler = [...p.matchAll(/<category\b([^>]*)(?:\/>|>([\s\S]*?)<\/category>)/gi)].map((m) => duz(varlikCoz((m[2] ?? "").replace(/<!\[CDATA\[|\]\]>/g, ""))) || nitelik(m[1], "term")).filter(Boolean).slice(0, 20);
    const ek = /<enclosure\b[^>]*>/i.exec(p)?.[0] ?? /<media:content\b[^>]*>/i.exec(p)?.[0] ?? /<media:thumbnail\b[^>]*>/i.exec(p)?.[0] ?? "";
    const gorsel = (ek && (/image/i.test(nitelik(ek, "type")) || /media:/i.test(ek)) ? nitelik(ek, "url") : "") || (/<img[^>]+src=["']([^"']+)["']/i.exec(icerikHam)?.[1] ?? "");
    return {
      kimlik: kimlik.slice(0, 500), baslik: baslik.slice(0, 500), baglanti: baglanti.slice(0, 2000),
      tarih: tarih(metin(p, "pubDate", "published", "updated", "dc:date")), ozet: duz(ozetHam).slice(0, 2000), icerik: icerikHam.slice(0, 20_000),
      yazar: yazar.slice(0, 200), kategoriler, gorsel: gorsel ? varlikCoz(gorsel).slice(0, 2000) : null,
    };
  });
  return { baslik: duz(metin(kanal, "title")).slice(0, 300), baglanti: akisBaglanti.slice(0, 2000), ogeler };
}

/** Akış adresi: herkese açık http(s); geliştirmede localhost da kabul edilir (denemek için). */
export function rssAdresi(adres: string): URL | null {
  const u = adresGecerli(adres);
  if (u) return u;
  if (process.env.NODE_ENV !== "production") { try { const x = new URL(adres.trim()); if ((x.protocol === "http:" || x.protocol === "https:") && /^(localhost|127\.0\.0\.1)$/.test(x.hostname)) return x; } catch { /* geçersiz */ } }
  return null;
}

export async function rssOku(adres: string, signal?: AbortSignal): Promise<RssAkis> {
  const u = rssAdresi(adres);
  if (!u) throw new Error("Geçerli, herkese açık bir akış adresi gir (https ile).");
  let r: Response;
  try { r = await guvenliFetch(u, { headers: { "User-Agent": "VayraBuild-RSS/1.0", Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*" }, signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10_000)]) : AbortSignal.timeout(10_000) }, { yerel: true }); }
  catch (e) { throw new Error((e as Error).name === "AgHatasi" ? (e as Error).message : (e as Error).name === "TimeoutError" ? `${u.hostname} 10 saniyede yanıt vermedi.` : `${u.hostname} adresine ulaşılamadı.`); }
  if (!r.ok) throw new Error(`Akış ${r.status} döndü.`);
  const metin = (await r.text()).slice(0, 3_000_000);
  if (!/<(rss|feed|rdf:RDF)[\s>]/i.test(metin)) throw new Error("Bu adres bir RSS ya da Atom akışı değil.");
  return rssCoz(metin);
}

/** Tetik verisi (veri seçicide Tetik altında görünen alanlar). */
export const rssTetikVerisi = (o: RssOge, a: RssAkis, adres: string) => ({ ...o, akis: { baslik: a.baslik, baglanti: a.baglanti, adres } });
