import "server-only";
import type { Proje } from "./tipler";

/**
 * Kimlik akışları için ortak yardımcılar: dışarıdan görünen köken, sitenin varsayılan adresi ve dönüş adresi
 * doğrulaması (oturum belirteci yalnız projenin kendi adreslerine ya da sahibin izin listesine gönderilir).
 */
export function kokenBul(req: Request) {
  const h = req.headers, u = new URL(req.url);
  return `${h.get("x-forwarded-proto")?.split(",")[0] ?? u.protocol.replace(":", "")}://${h.get("x-forwarded-host")?.split(",")[0] ?? h.get("host") ?? u.host}`;
}

/** Sitenin ana adresi: bağlı birincil alan adı, yoksa NEXT_PUBLIC_BUILD_ALAN alt alanı, yoksa bu sunucudaki /b/ yolu. */
export function siteAdresi(p: Proje, koken: string) {
  const alan = p.alanAdlari.find((a) => a.birincil && a.durum === "bagli")?.ad;
  if (alan) return `https://${alan}/`;
  const kok = process.env.NEXT_PUBLIC_BUILD_ALAN;
  return kok ? `https://${p.ayarlar.altAlan}.${kok}/` : `${koken}/b/${p.ayarlar.altAlan}/`;
}

const kalip = (g: string) => new RegExp(`^${g.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, "§").replace(/\*/g, "[^/]*").replace(/§/g, ".*")}`);

/** Dönüş adresi projenin kendi adresi ya da izin listesindeyse adres, değilse null. */
export function donusDogrula(p: Proje, donus: string | null | undefined, koken: string, izinli: string[]): string | null {
  if (!donus) return null;
  let u: URL;
  try { u = new URL(donus); } catch { return null; }
  if (!/^https?:$/.test(u.protocol)) return null;
  u.hash = "";
  const s = u.toString();
  if (u.origin === koken && (u.pathname === `/b/${p.ayarlar.altAlan}` || u.pathname.startsWith(`/b/${p.ayarlar.altAlan}/`))) return s;
  const alanlar = new Set(p.alanAdlari.filter((a) => a.durum === "bagli").flatMap((a) => [a.ad, `www.${a.ad}`]));
  const kok = process.env.NEXT_PUBLIC_BUILD_ALAN;
  if (kok) alanlar.add(`${p.ayarlar.altAlan}.${kok}`);
  if (u.protocol === "https:" && alanlar.has(u.hostname)) return s;
  for (const g of izinli) { try { if (g.includes("*") ? kalip(g).test(s) : s.startsWith(g)) return s; } catch { /* geçersiz kalıp */ } }
  return null;
}
