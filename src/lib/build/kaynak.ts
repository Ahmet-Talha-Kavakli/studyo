import "server-only";
import { adresBicimi, guvenliFetch } from "@/lib/guvenliAg";

/**
 * "Web adresinden başla": kullanıcının verdiği sayfayı sunucuda okur, ajana yapı ve içerik özeti olarak verir
 * (başlıklar, metinler, bağlantılar, görseller, renkler, yazı tipleri). Kod kopyalanmaz; ajan özgün olarak yeniden kurar.
 * SSRF koruması: yalnız http/https, yerel ve özel ağ adresleri reddedilir, 8 sn zaman aşımı, 600 KB sınırı.
 */

/** Kullanıcı adresi biçim denetimi (http/https, özel ağ IP'si ve yerel adlar reddedilir). Çözülen IP'nin denetimi guvenliFetch'tedir. */
export function adresGecerli(u: string): URL | null {
  const t = String(u ?? "").trim();
  if (!t) return null;
  return adresBicimi(/^[a-z][a-z0-9+.-]*:\/\//i.test(t) ? t : `https://${t}`);
}

const temiz = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();

export type SiteOzeti = { url: string; baslik: string; aciklama: string; ozet: string };

export async function siteOku(adres: string): Promise<SiteOzeti> {
  const u = adresGecerli(adres);
  if (!u) throw new Error("Geçerli bir web adresi değil.");
  const r = await guvenliFetch(u, { signal: AbortSignal.timeout(8000), headers: { "User-Agent": "VayraBuild/1.0 (+site okuma)", Accept: "text/html" } });
  if (!r.ok) throw new Error(`Sayfa açılmadı (${r.status}).`);
  if (!(r.headers.get("content-type") ?? "").includes("html")) throw new Error("Bu adres bir web sayfası değil.");
  const ham = (await r.text()).slice(0, 600_000);
  const html = ham.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<noscript[\s\S]*?<\/noscript>/gi, "").replace(/<svg[\s\S]*?<\/svg>/gi, "");
  const baslik = temiz(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "");
  const aciklama = /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i.exec(html)?.[1] ?? "";
  const stil = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join("\n");
  const renkler = [...new Set((stil.match(/#[0-9a-f]{6}\b/gi) ?? []).map((x) => x.toLowerCase()))].slice(0, 12);
  const fontlar = [...new Set([...html.matchAll(/fonts\.googleapis\.com\/css2?\?family=([^"'&]+)/gi)].map((m) => decodeURIComponent(m[1]).replace(/\+/g, " ").split(":")[0]))].slice(0, 6);
  const govde = html.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<head[\s\S]*?<\/head>/i, "");
  const satirlar: string[] = [];
  const re = /<(h[1-4]|p|li|a|button|img|label|th|td|blockquote|figcaption)\b([^>]*)>([\s\S]*?)(?=<\/\1>|<(?:h[1-4]|p|li|a|button|img|section|div|ul|ol|header|footer|nav)\b)/gi;
  for (const m of govde.matchAll(re)) {
    const etiket = m[1].toLowerCase();
    if (etiket === "img") {
      const alt = /alt=["']([^"']*)/i.exec(m[2])?.[1];
      satirlar.push(`[görsel${alt ? `: ${alt}` : ""}]`);
      continue;
    }
    const metin = temiz(m[3]).slice(0, 300);
    if (!metin) continue;
    if (etiket === "a") { const href = /href=["']([^"']*)/i.exec(m[2])?.[1] ?? ""; satirlar.push(`[bağlantı: ${metin}${href && !href.startsWith("#") ? ` → ${href.slice(0, 80)}` : ""}]`); }
    else if (etiket.startsWith("h")) satirlar.push(`${"#".repeat(Number(etiket[1]))} ${metin}`);
    else if (etiket === "button") satirlar.push(`[düğme: ${metin}]`);
    else satirlar.push(metin);
    if (satirlar.join("\n").length > 14000) break;
  }
  const tekil = satirlar.filter((s, i) => s !== satirlar[i - 1]);
  const ozet = [
    renkler.length ? `Renkler: ${renkler.join(", ")}` : "", fontlar.length ? `Yazı tipleri: ${fontlar.join(", ")}` : "",
    "İçerik ve yapı (sırasıyla):", ...tekil,
  ].filter(Boolean).join("\n").slice(0, 16000);
  return { url: u.toString(), baslik, aciklama: temiz(aciklama), ozet };
}

/**
 * İçe aktarmada yan yana kıyas için orijinal sitenin aynası: sayfa sunucuda okunur, betikler ve olay öznitelikleri
 * çıkarılır, göreli adresler için <base> eklenir. Arayüz bunu betiksiz kum havuzunda (sandbox="") gösterir; böylece
 * siteyi çerçevede açılmayı engelleyen başlıklar (X-Frame-Options) kıyası bozmaz. 1,5 MB sınırı.
 */
export async function siteAynasi(adres: string): Promise<{ url: string; html: string }> {
  const u = adresGecerli(adres);
  if (!u) throw new Error("Geçerli bir web adresi değil.");
  const r = await guvenliFetch(u, { signal: AbortSignal.timeout(10_000), headers: { "User-Agent": "Mozilla/5.0 (compatible; VayraBuild/1.0; +site-compare)", Accept: "text/html" } });
  if (!r.ok) throw new Error(`Orijinal site açılmadı (${r.status}).`);
  if (!(r.headers.get("content-type") ?? "").includes("html")) throw new Error("Bu adres bir web sayfası değil.");
  const son = r.url || u.toString();
  let html = (await r.text()).slice(0, 1_500_000);
  html = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<noscript[^>]*>([\s\S]*?)<\/noscript>/gi, "$1")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "").replace(/<meta[^>]+http-equiv=["']?refresh[^>]*>/gi, "")
    .replace(/<base[^>]*>/gi, "");
  const taban = `<base href="${son.replace(/"/g, "%22")}" target="_blank">`;
  html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + taban) : taban + html;
  return { url: son, html };
}
