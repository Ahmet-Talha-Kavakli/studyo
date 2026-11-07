import "server-only";
import { guvenliFetch } from "@/lib/guvenliAg";

/**
 * Alan adı arama (satın almadan önce). Uygunluk resmî RDAP kayıt sorgusuyla bakılır: IANA'nın RDAP önyükleme listesinden
 * uzantının kayıt otoritesi bulunur, alan adı sorulur (404: kayıtlı değil, 200: kayıtlı, kayıt firması ve bitiş tarihi).
 * RDAP sunmayan uzantılarda (.tr gibi) DNS'e bakılır: ad sunucusu varsa kayıtlı, alan adı hiç yoksa "kayıtlı görünmüyor";
 * bu kesin değildir ve öyle gösterilir. Vayra alan adı satmaz (kayıt firması API'si bağlı değil): satın alma kayıt
 * firmasının sayfasında, aranan adla açılır; alınan ad buradan bağlanır.
 */
export type AlanSonucu = { ad: string; uzanti: string; durum: "bos" | "kayitli" | "bilinmiyor"; kesin: boolean; kaynak: "RDAP" | "DNS" | "yok"; firma?: string; bitis?: string; olusturma?: string; not?: string };

const UZANTILAR = ["com", "com.tr", "tr", "net", "org", "app", "dev", "io", "co", "shop", "store", "online", "site", "net.tr", "org.tr", "gen.tr", "biz.tr", "web.tr", "av.tr"];
type Onb = { z: number; v: Record<string, string> };
const G = globalThis as unknown as { __vayraRdap?: Onb | null; __vayraRdapSonuc?: Map<string, { z: number; s: AlanSonucu }> };
const sonuclar = (G.__vayraRdapSonuc ??= new Map());

async function onyukleme(): Promise<Record<string, string>> {
  if (G.__vayraRdap && Date.now() - G.__vayraRdap.z < 24 * 3600_000) return G.__vayraRdap.v;
  const r = await guvenliFetch("https://data.iana.org/rdap/dns.json", { signal: AbortSignal.timeout(6000) }, { yalnizHttps: true });
  const j = (await r.json()) as { services: [string[], string[]][] };
  const v: Record<string, string> = {};
  for (const [tl, sunucular] of j.services ?? []) { const s = sunucular.find((x) => x.startsWith("https://")) ?? sunucular[0]; for (const t of tl) v[t.toLowerCase()] = s.endsWith("/") ? s : `${s}/`; }
  G.__vayraRdap = { z: Date.now(), v };
  return v;
}

async function dnsVar(ad: string): Promise<boolean | null> {
  for (const kok of ["https://cloudflare-dns.com/dns-query", "https://dns.google/resolve"]) {
    try {
      const r = await fetch(`${kok}?name=${encodeURIComponent(ad)}&type=NS`, { headers: { accept: "application/dns-json" }, signal: AbortSignal.timeout(4000), cache: "no-store" });
      if (!r.ok) continue;
      const v = (await r.json()) as { Status: number; Answer?: unknown[]; Authority?: { type: number; name: string }[] };
      if (v.Status === 3) return false;
      if (v.Status === 0) return true;
    } catch { /* sıradaki */ }
  }
  return null;
}

async function tekSorgu(ad: string, uzanti: string, rdap: Record<string, string> | null): Promise<AlanSonucu> {
  const o = sonuclar.get(ad);
  if (o && Date.now() - o.z < 10 * 60_000) return o.s;
  const ust = uzanti.split(".").pop()!;
  const sunucu = rdap?.[uzanti] ?? rdap?.[ust];
  let s: AlanSonucu | null = null;
  if (sunucu && !uzanti.includes(".")) {
    try {
      const r = await guvenliFetch(`${sunucu}domain/${encodeURIComponent(ad)}`, { headers: { accept: "application/rdap+json" }, signal: AbortSignal.timeout(6000) }, { yalnizHttps: true });
      if (r.status === 404) s = { ad, uzanti, durum: "bos", kesin: true, kaynak: "RDAP" };
      else if (r.ok) {
        const j = (await r.json()) as { events?: { eventAction: string; eventDate: string }[]; entities?: { roles?: string[]; vcardArray?: [string, [string, unknown, string, string][]] }[] };
        const firma = j.entities?.find((e) => e.roles?.includes("registrar"))?.vcardArray?.[1]?.find((x) => x[0] === "fn")?.[3];
        s = { ad, uzanti, durum: "kayitli", kesin: true, kaynak: "RDAP", ...(firma ? { firma: String(firma) } : {}), ...(j.events?.find((e) => e.eventAction === "expiration") ? { bitis: j.events.find((e) => e.eventAction === "expiration")!.eventDate } : {}), ...(j.events?.find((e) => e.eventAction === "registration") ? { olusturma: j.events.find((e) => e.eventAction === "registration")!.eventDate } : {}) };
      }
    } catch { /* DNS'e düş */ }
  }
  if (!s) {
    const v = await dnsVar(ad);
    s = v === null ? { ad, uzanti, durum: "bilinmiyor", kesin: false, kaynak: "yok", not: "Sorgu yanıt vermedi." }
      : v ? { ad, uzanti, durum: "kayitli", kesin: true, kaynak: "DNS", not: "Ad sunucusu kayıtlı." }
      : { ad, uzanti, durum: "bos", kesin: false, kaynak: "DNS", not: uzanti.endsWith("tr") ? ".tr uzantıları TRABİS'te kayıtlıdır ve herkese açık kayıt sorgusu sunmaz; DNS'te yok, kayıt firmasında doğrula." : "Bu uzantı için kayıt sorgusu yok; DNS'te yok, kayıt firmasında doğrula." };
  }
  sonuclar.set(ad, { z: Date.now(), s });
  return s;
}

/** "kahvecim" ya da "kahvecim.com" için uzantılarda uygunluk. */
export async function alanAra(ham: string): Promise<{ sonuclar: AlanSonucu[]; rdap: boolean }> {
  const t = ham.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
  const tr: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" };
  const sade = t.replace(/[çğıöşü]/g, (h) => tr[h] ?? h);
  const nokta = sade.indexOf(".");
  const isim = (nokta > 0 ? sade.slice(0, nokta) : sade).replace(/[^a-z0-9-]/g, "").replace(/^-+|-+$/g, "").slice(0, 63);
  if (isim.length < 2) return { sonuclar: [], rdap: false };
  const istenen = nokta > 0 ? sade.slice(nokta + 1) : "";
  const l = [...new Set([...(istenen ? [istenen] : []), ...UZANTILAR])].slice(0, 20);
  const rdap = await onyukleme().catch(() => null);
  const s = await Promise.all(l.map((u) => tekSorgu(`${isim}.${u}`, u, rdap)));
  return { sonuclar: s, rdap: !!rdap };
}

/** Kayıt firmalarında aranan adla açılan arama sayfaları (Vayra satış yapmaz; kimse ücret almaz). */
export const satinAlmaBaglantilari = (ad: string) => [
  { ad: "Cloudflare Registrar", adres: `https://domains.cloudflare.com/?domain=${encodeURIComponent(ad)}`, not: "Maliyet fiyatına, yenileme zammı yok" },
  { ad: "Porkbun", adres: `https://porkbun.com/checkout/search?q=${encodeURIComponent(ad)}` },
  { ad: "Namecheap", adres: `https://www.namecheap.com/domains/registration/results/?domain=${encodeURIComponent(ad)}` },
  { ad: "GoDaddy", adres: `https://www.godaddy.com/tr-tr/domainsearch/find?domainToCheck=${encodeURIComponent(ad)}` },
  { ad: "Natro", adres: "https://www.natro.com/alan-adi-sorgulama", not: ".tr ve .com.tr için" },
  { ad: "İsimtescil", adres: "https://www.isimtescil.net", not: ".tr ve .com.tr için" },
];
