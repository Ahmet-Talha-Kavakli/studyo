import { NextRequest, NextResponse } from "next/server";
import { oturumGerekli } from "@/lib/hesap/yetki";
import { guvenliFetch } from "@/lib/guvenliAg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Özel/iç ağ adreslerine istek atılmasın (SSRF). */
const IC_AG = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|169\.254\.|\[?::1\]?|.*\.local$|.*\.internal$)/i;

const meta = (html: string, ad: string) =>
  html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${ad}["'][^>]*content=["']([^"']+)["']`, "i"))?.[1]
  ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${ad}["']`, "i"))?.[1];
const temiz = (s?: string) => (s ?? "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();

/** POST { url } → ürün sayfasından ad, açıklama, görsel ve fiyat (Open Graph / JSON-LD). */
export async function POST(req: NextRequest) {
  // Oturum gerekir: sağlayıcı maliyeti olan uç misafire açık değil (bu iş kredi harcamaz).
  const oturum = await oturumGerekli(req);
  if (oturum instanceof Response) return oturum;
  const { url } = (await req.json().catch(() => ({}))) as { url?: string };
  let u: URL;
  try { u = new URL(/^https?:\/\//i.test(String(url ?? "")) ? String(url) : `https://${url}`); } catch { return NextResponse.json({ ok: false, hata: "Geçerli bir bağlantı gir." }, { status: 400 }); }
  if (!/^https?:$/.test(u.protocol) || IC_AG.test(u.hostname)) return NextResponse.json({ ok: false, hata: "Bu adres okunamaz." }, { status: 400 });
  try {
    const r = await guvenliFetch(u, { headers: { "User-Agent": "Mozilla/5.0 (VayraUGC)", Accept: "text/html" }, signal: AbortSignal.timeout(12000) });
    if (!r.ok) return NextResponse.json({ ok: false, hata: `Sayfa açılmadı (${r.status}).` }, { status: 502 });
    const html = (await r.text()).slice(0, 2_000_000);
    let ad = temiz(meta(html, "og:title") ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
    let aciklama = temiz(meta(html, "og:description") ?? meta(html, "description"));
    let gorsel = meta(html, "og:image") ?? meta(html, "twitter:image");
    let fiyat = meta(html, "product:price:amount") ? `${meta(html, "product:price:amount")} ${meta(html, "product:price:currency") ?? ""}`.trim() : undefined;
    // JSON-LD Product
    for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
      try {
        const j = JSON.parse(m[1]);
        const l = (Array.isArray(j) ? j : j["@graph"] ?? [j]) as Record<string, unknown>[];
        const p = l.find((x) => String(x["@type"]).includes("Product"));
        if (!p) continue;
        ad = temiz(String(p.name ?? ad));
        aciklama = temiz(String(p.description ?? aciklama));
        const g = p.image; gorsel ??= Array.isArray(g) ? String(g[0]) : typeof g === "object" && g ? String((g as { url?: string }).url) : g ? String(g) : undefined;
        const o = (Array.isArray(p.offers) ? p.offers[0] : p.offers) as { price?: string; priceCurrency?: string } | undefined;
        if (o?.price) fiyat = `${o.price} ${o.priceCurrency ?? ""}`.trim();
        break;
      } catch { /* geçersiz JSON-LD */ }
    }
    if (gorsel) { try { gorsel = new URL(gorsel, u).toString(); } catch { gorsel = undefined; } }
    if (!ad) return NextResponse.json({ ok: false, hata: "Sayfada ürün bilgisi bulunamadı." }, { status: 422 });
    return NextResponse.json({ ok: true, ad: ad.slice(0, 120), aciklama: aciklama.slice(0, 400), gorsel, fiyat, alan: u.hostname.replace(/^www\./, "") });
  } catch {
    return NextResponse.json({ ok: false, hata: "Sayfaya ulaşılamadı." }, { status: 502 });
  }
}
