import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Özel/iç ağ adreslerine istek atılmasın (SSRF). */
const IC_AG = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|169\.254\.|\[?::1\]?|.*\.local$|.*\.internal$)/i;

/** Sayfayı okunur metne çevirir: script/stil/menü atılır, başlık ve paragraflar korunur. */
function metneCevir(html: string): { baslik: string; metin: string } {
  const baslik = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").replace(/\s+/g, " ").trim();
  const govde = (html.match(/<article[\s\S]*?<\/article>/i)?.[0] ?? html.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? html)
    .replace(/<(script|style|noscript|svg|nav|footer|header|form|aside)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|h[1-6]|li|div|br|section)>/gi, "\n").replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  const metin = govde.split("\n").map((x) => x.replace(/\s+/g, " ").trim()).filter((x) => x.split(" ").length >= 6).join("\n");
  return { baslik, metin: metin.slice(0, 12000) };
}

/** POST { url } → { baslik, metin } — explainer için kaynak sayfayı okur. */
export async function POST(req: NextRequest) {
  const { url } = (await req.json().catch(() => ({}))) as { url?: string };
  let u: URL;
  try { u = new URL(String(url ?? "")); } catch { return NextResponse.json({ ok: false, hata: "Geçerli bir bağlantı gir." }, { status: 400 }); }
  if (!/^https?:$/.test(u.protocol) || IC_AG.test(u.hostname)) return NextResponse.json({ ok: false, hata: "Bu adres okunamaz." }, { status: 400 });
  try {
    const r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 (VayraExplainer)", Accept: "text/html,text/plain" }, redirect: "follow", signal: AbortSignal.timeout(12000) });
    if (!r.ok) return NextResponse.json({ ok: false, hata: `Sayfa açılmadı (${r.status}).` }, { status: 502 });
    const tip = r.headers.get("content-type") ?? "";
    if (!/text\/(html|plain)/.test(tip)) return NextResponse.json({ ok: false, hata: "Yalnız web sayfası ya da düz metin okunur." }, { status: 415 });
    const ham = (await r.text()).slice(0, 1_500_000);
    const sonuc = tip.includes("text/plain") ? { baslik: u.hostname, metin: ham.slice(0, 12000) } : metneCevir(ham);
    if (sonuc.metin.length < 120) return NextResponse.json({ ok: false, hata: "Sayfada okunur metin bulunamadı." }, { status: 422 });
    return NextResponse.json({ ok: true, ...sonuc });
  } catch {
    return NextResponse.json({ ok: false, hata: "Sayfaya ulaşılamadı." }, { status: 502 });
  }
}
