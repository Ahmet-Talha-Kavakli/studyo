import "server-only";
import { AgHatasi, guvenliFetch } from "@/lib/guvenliAg";
import { katla } from "./sohbetTipler";

/**
 * Web sayfası okuma (her modelde çalışır; Claude'un web_fetch'ine bağlı değildir): sayfayı güvenli istekle
 * (SSRF korumalı) indirir, okunur metni, başlıkları, bağlantıları ve fiyat bilgisini çıkarır. Site içi gezinti:
 * başlangıç sayfasından aynı alan adındaki bağlantıları odak kelimesine göre sıralayıp en çok N sayfa okur.
 */
export type Baglanti = { url: string; metin: string };
export type OkunanSayfa = { url: string; baslik: string; aciklama?: string; metin: string; basliklar: string[]; baglantilar: Baglanti[]; fiyat?: { deger: number; para?: string; kaynak: string }; durum: number; tur: string; json?: unknown; kirpildi?: boolean };

const ENCOK_BAYT = 3_000_000;
const UA = "Mozilla/5.0 (compatible; VayraBot/1.0; +https://vayra.app/bot)";
const VARLIK: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ccedil: "ç", Ccedil: "Ç", ouml: "ö", Ouml: "Ö", uuml: "ü", Uuml: "Ü", rsquo: "'", lsquo: "'", rdquo: '"', ldquo: '"', hellip: "…", ndash: "-", mdash: "-", euro: "€", copy: "©", reg: "®", trade: "™", laquo: "«", raquo: "»" };
export const varlikCoz = (s: string) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (t, x: string) => {
  if (x[0] === "#") { const n = x[1] === "x" || x[1] === "X" ? parseInt(x.slice(2), 16) : Number(x.slice(1)); return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : t; }
  return VARLIK[x] ?? t;
});
const temizle = (s: string) => varlikCoz(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

/** HTML'den okunur metin: betik, stil, gezinme ve altbilgi atılır; başlıklar ve listeler satır olarak kalır. */
export function htmlMetni(html: string): string {
  let h = html.replace(/<!--[\s\S]*?-->/g, " ").replace(/<(script|style|noscript|svg|template|iframe|form|select)[\s\S]*?<\/\1>/gi, " ");
  const ana = /<(main|article)[\s>][\s\S]*<\/\1>/i.exec(h)?.[0];
  if (ana && temizle(ana).length > 400) h = ana;
  else h = h.replace(/<(nav|footer|header|aside)[\s>][\s\S]*?<\/\1>/gi, " ");
  h = h.replace(/<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi, (_, t: string, x: string) => `\n${"#".repeat(Number(t[1]))} ${temizle(x)}\n`)
    .replace(/<li[^>]*>/gi, "\n- ").replace(/<(br|hr)\s*\/?>/gi, "\n").replace(/<\/(p|div|section|tr|li|ul|ol|table|blockquote|dd|dt)>/gi, "\n").replace(/<t[dh][^>]*>/gi, " | ");
  return varlikCoz(h.replace(/<[^>]+>/g, " ")).split("\n").map((x) => x.replace(/[ \t ]+/g, " ").trim()).filter((x) => x && x !== "-" && x !== "|").join("\n").replace(/\n{3,}/g, "\n\n");
}

function fiyatBul(html: string): OkunanSayfa["fiyat"] {
  // 1) JSON-LD Offer, 2) meta etiketleri, 3) itemprop.
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const yigin: unknown[] = [JSON.parse(m[1].trim())];
      while (yigin.length) {
        const x = yigin.pop();
        if (!x || typeof x !== "object") continue;
        if (Array.isArray(x)) { yigin.push(...x); continue; }
        const o = x as Record<string, unknown>;
        const fiyat = o.price ?? o.lowPrice;
        if (fiyat !== undefined && (o["@type"] === "Offer" || o["@type"] === "AggregateOffer" || o.priceCurrency)) {
          const n = Number(String(fiyat).replace(",", "."));
          if (Number.isFinite(n) && n > 0) return { deger: n, para: typeof o.priceCurrency === "string" ? o.priceCurrency : undefined, kaynak: "Sayfanın ürün verisi (JSON-LD)" };
        }
        yigin.push(...Object.values(o));
      }
    } catch { /* bozuk JSON-LD */ }
  }
  const meta = /<meta[^>]+(?:property|name)=["'](?:product:price:amount|og:price:amount|twitter:data1)["'][^>]*content=["']([^"']+)["']/i.exec(html) ?? /<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:product:price:amount|og:price:amount)["']/i.exec(html);
  if (meta) { const n = Number(meta[1].replace(/[^\d.,]/g, "").replace(",", ".")); if (Number.isFinite(n) && n > 0) return { deger: n, para: /product:price:currency["'][^>]*content=["']([A-Z]{3})/i.exec(html)?.[1], kaynak: "Sayfanın fiyat etiketi" }; }
  const ip = /itemprop=["']price["'][^>]*content=["']([^"']+)["']/i.exec(html) ?? /content=["']([^"']+)["'][^>]*itemprop=["']price["']/i.exec(html);
  if (ip) { const n = Number(ip[1].replace(",", ".")); if (Number.isFinite(n) && n > 0) return { deger: n, kaynak: "Sayfanın fiyat alanı (itemprop)" }; }
  return undefined;
}

function baglantilariAl(html: string, taban: URL): Baglanti[] {
  const o: Baglanti[] = [], gorulen = new Set<string>();
  for (const m of html.matchAll(/<a\s[^>]*href=["']([^"'#][^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    let u: URL;
    try { u = new URL(varlikCoz(m[1]), taban); } catch { continue; }
    if (u.protocol !== "http:" && u.protocol !== "https:") continue;
    u.hash = "";
    const metin = temizle(m[2]).slice(0, 200) || (/title=["']([^"']+)["']/i.exec(m[0])?.[1] ?? "");
    const k = u.toString();
    if (gorulen.has(k)) continue;
    gorulen.add(k);
    o.push({ url: k, metin });
    if (o.length >= 400) break;
  }
  return o;
}

export class OkumaHatasi extends Error {}

/** Tek sayfa okur. yerel: geliştirmede localhost'a izin (deneme sunucusu). */
export async function sayfaOku(adres: string, o: { yerel?: boolean; zaman?: number } = {}): Promise<OkunanSayfa> {
  let u: URL;
  try { u = new URL(/^https?:\/\//i.test(adres.trim()) ? adres.trim() : `https://${adres.trim()}`); } catch { throw new OkumaHatasi("Adres geçersiz."); }
  let r: Response;
  try {
    r = await guvenliFetch(u, { headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml,application/json;q=0.9,text/plain;q=0.8,*/*;q=0.5", "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.7" }, signal: AbortSignal.timeout(o.zaman ?? 15_000) }, { yerel: o.yerel ?? process.env.NODE_ENV !== "production" });
  } catch (e) {
    if (e instanceof AgHatasi) throw new OkumaHatasi(`Bu adrese erişime izin verilmiyor: ${e.message}`);
    throw new OkumaHatasi((e as Error).name === "TimeoutError" ? "Sayfa zamanında yanıt vermedi." : `Sayfaya ulaşılamadı: ${(e as Error).message.slice(0, 120)}`);
  }
  const tur = (r.headers.get("content-type") ?? "").toLowerCase();
  const son = new URL(r.url || u.toString());
  if (!r.ok) { await r.body?.cancel().catch(() => {}); throw new OkumaHatasi(`Sayfa ${r.status} döndürdü${r.status === 403 ? " (site otomatik okumayı engelliyor olabilir)" : r.status === 404 ? " (bulunamadı)" : ""}.`); }
  if (/image\/|video\/|audio\/|application\/(zip|octet-stream|pdf)/.test(tur)) { await r.body?.cancel().catch(() => {}); throw new OkumaHatasi(`Bu adres bir sayfa değil (${tur.split(";")[0]}).`); }
  // Boyut sınırı: akış okunurken kesilir.
  const okuyucu = r.body?.getReader();
  const parcalar: Uint8Array[] = [];
  let toplam = 0, kirpildi = false;
  if (okuyucu) for (;;) {
    const { done, value } = await okuyucu.read();
    if (done) break;
    parcalar.push(value); toplam += value.length;
    if (toplam > ENCOK_BAYT) { kirpildi = true; await okuyucu.cancel().catch(() => {}); break; }
  }
  const ham = Buffer.concat(parcalar);
  const kod = /charset=([\w-]+)/.exec(tur)?.[1]?.toLowerCase() ?? /<meta[^>]+charset=["']?([\w-]+)/i.exec(ham.subarray(0, 4000).toString("latin1"))?.[1]?.toLowerCase() ?? "utf-8";
  let govde: string;
  try { govde = new TextDecoder(kod === "iso-8859-9" || kod === "windows-1254" ? "windows-1254" : kod).decode(ham); } catch { govde = ham.toString("utf8"); }
  if (tur.includes("json") || /^\s*[[{]/.test(govde.slice(0, 20))) {
    try { const json = JSON.parse(govde); return { url: son.toString(), baslik: son.hostname, metin: JSON.stringify(json, null, 1).slice(0, 60_000), basliklar: [], baglantilar: [], durum: r.status, tur: "json", json, kirpildi }; } catch { /* düz metin */ }
  }
  if (!/html|xml/.test(tur) && !/<html|<body|<div/i.test(govde.slice(0, 3000))) return { url: son.toString(), baslik: son.pathname.split("/").pop() || son.hostname, metin: govde.slice(0, 200_000), basliklar: [], baglantilar: [], durum: r.status, tur: "metin", kirpildi };
  const baslik = temizle(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(govde)?.[1] ?? "") || temizle(/<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(govde)?.[1] ?? "") || son.hostname;
  const aciklama = /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i.exec(govde)?.[1] ?? /<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']*)["']/i.exec(govde)?.[1];
  const metin = htmlMetni(govde);
  const basliklar = [...govde.matchAll(/<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => temizle(m[2])).filter((x) => x.length > 1).slice(0, 40);
  return { url: son.toString(), baslik: baslik.slice(0, 200), ...(aciklama ? { aciklama: varlikCoz(aciklama).slice(0, 400) } : {}), metin, basliklar, baglantilar: baglantilariAl(govde, son), fiyat: fiyatBul(govde), durum: r.status, tur: "html", kirpildi };
}

/** Bağlantının odak kelimelerine yakınlığı (site içi gezintide sıralama için). */
function baglantiPuani(b: Baglanti, terimler: string[], kok: URL): number {
  const u = new URL(b.url);
  if (/\.(png|jpe?g|gif|webp|svg|pdf|zip|mp4|mp3|css|js|xml|ico)$/i.test(u.pathname)) return -1;
  if (/(giris|login|kayit|register|sepet|cart|hesap|account|logout|cikis|wp-admin|javascript:|mailto:|tel:)/i.test(b.url)) return -1;
  const m = katla(`${b.metin} ${decodeURIComponent(u.pathname)}`);
  let p = terimler.reduce((t, x) => t + (m.includes(x) ? 3 : 0), 0);
  if (b.metin.length > 6) p += 1;
  const derinlik = u.pathname.split("/").filter(Boolean).length;
  p += Math.max(0, 2 - Math.abs(derinlik - (kok.pathname.split("/").filter(Boolean).length + 1)));
  return p;
}

export type GeziSonucu = { sayfalar: OkunanSayfa[]; hatalar: { url: string; hata: string }[]; atlanan: number };

/**
 * Birden çok sayfa okur. gez açıksa ilk adresin sitesinde (aynı alan adı) odak kelimelerine göre sıralanan
 * bağlantıları da gezer; toplam sayfa sınırı en çok 12.
 */
export async function sayfalariOku(adresler: string[], o: { gez?: boolean; odak?: string; sinir?: number; yerel?: boolean } = {}): Promise<GeziSonucu> {
  const sinir = Math.min(12, Math.max(1, o.sinir ?? (o.gez ? 6 : adresler.length)));
  const sayfalar: OkunanSayfa[] = [], hatalar: GeziSonucu["hatalar"] = [];
  const goruldu = new Set<string>();
  const kuyruk = adresler.slice(0, 8).map((x) => x.trim()).filter(Boolean);
  // İlk adresler paralel okunur.
  const ilk = await Promise.allSettled(kuyruk.map((a) => sayfaOku(a, { yerel: o.yerel })));
  ilk.forEach((r, i) => { if (r.status === "fulfilled") { sayfalar.push(r.value); goruldu.add(r.value.url); } else hatalar.push({ url: kuyruk[i], hata: (r.reason as Error).message }); });
  let atlanan = 0;
  if (o.gez && sayfalar[0] && sayfalar.length < sinir) {
    const kok = new URL(sayfalar[0].url);
    const terimler = katla(o.odak ?? "").split(/\s+/).filter((x) => x.length > 2);
    const adaylar = sayfalar.flatMap((s) => s.baglantilar).filter((b) => { try { const u = new URL(b.url); return u.hostname === kok.hostname && !goruldu.has(b.url); } catch { return false; } })
      .map((b) => ({ b, p: baglantiPuani(b, terimler, kok) })).filter((x) => x.p >= 0).sort((a, b) => b.p - a.p);
    const tekil = [...new Map(adaylar.map((x) => [x.b.url, x])).values()];
    const secilen = tekil.slice(0, sinir - sayfalar.length);
    atlanan = Math.max(0, tekil.length - secilen.length);
    const ikinci = await Promise.allSettled(secilen.map((x) => sayfaOku(x.b.url, { yerel: o.yerel, zaman: 12_000 })));
    ikinci.forEach((r, i) => { if (r.status === "fulfilled") { if (!goruldu.has(r.value.url)) { sayfalar.push(r.value); goruldu.add(r.value.url); } } else hatalar.push({ url: secilen[i].b.url, hata: (r.reason as Error).message }); });
  }
  return { sayfalar, hatalar, atlanan };
}
