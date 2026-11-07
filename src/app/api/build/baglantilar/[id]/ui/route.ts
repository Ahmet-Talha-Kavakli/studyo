import { uygulamaBaglami, uygulamaIstegi, uygulamaKaynagi } from "@/lib/build/baglantiUygulama";
import { hata } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
const BASLIK = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

/**
 * MCP Apps görünümü. GET ?uri=ui://…&b=<belirteç>: görünümün HTML'i ve güvenlik ayarları (csp, izinler).
 * Sahip x-build-sahip başlığıyla; yayındaki ajan sayfasında ziyaretçi parça kaydındaki kısa ömürlü belirteçle.
 */
export async function GET(req: Request, { params }: Ctx) {
  const id = (await params).id;
  const u = new URL(req.url);
  const c = await uygulamaBaglami(req, id, { belirtec: u.searchParams.get("b") ?? undefined, ajanId: u.searchParams.get("ajan") ?? undefined });
  if ("hata" in c) return hata(c.hata, c.durum);
  const v = await uygulamaKaynagi(id, u.searchParams.get("uri") ?? "", c, u.searchParams.get("taze") === "1");
  if ("hata" in v) return hata(v.hata, v.durum);
  return Response.json({ ok: true, ...v }, { headers: BASLIK });
}

/**
 * Görünümün istekleri: { yontem: "tools/call" | "resources/read", params, belirtec?, ajanId? }.
 * Araç çağrısında izin kuralı: "her-zaman" ya da okuma aracı çağrılır; "sor" ve "kapali" hata döner.
 */
export async function POST(req: Request, { params }: Ctx) {
  const id = (await params).id;
  let g: { yontem?: unknown; params?: unknown; belirtec?: unknown; ajanId?: unknown };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  if (g.yontem !== "tools/call" && g.yontem !== "resources/read") return hata("Desteklenmeyen istek.");
  const c = await uygulamaBaglami(req, id, { belirtec: g.belirtec, ajanId: g.ajanId });
  if ("hata" in c) return hata(c.hata, c.durum);
  const v = await uygulamaIstegi(id, g.yontem, g.params, c);
  if ("hata" in v) return hata(v.hata, v.durum);
  return Response.json({ ok: true, sonuc: v.sonuc }, { headers: BASLIK });
}
