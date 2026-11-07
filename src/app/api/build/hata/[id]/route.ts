import { projeOkuHam } from "@/lib/build/depo";
import { cihaz, gunlukYaz } from "@/lib/build/gunluk";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Yayındaki sitenin tarayıcı hataları (window.onerror, yakalanmayan Promise). Bulut günlüklerine "hata" türüyle,
 * k: "istemci" olarak yazılır; çalışma alanı bunları "Canlı sitede hata" uyarısı olarak gösterir. IP saklanmaz.
 */
const sayac = new Map<string, number[]>();
export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "yerel";
  const s = Date.now(), l = (sayac.get(`${id}:${ip}`) ?? []).filter((t) => s - t < 60_000);
  l.push(s); sayac.set(`${id}:${ip}`, l);
  if (l.length > 20) return new Response(null, { status: 204 });
  const p = await projeOkuHam(id);
  if (!p?.yayin) return new Response(null, { status: 204 });
  let g: { m?: unknown; k?: unknown; s?: unknown; y?: unknown };
  try { g = JSON.parse(await req.text()); } catch { return new Response(null, { status: 204 }); }
  const m = String(g.m ?? "").slice(0, 300);
  if (!m || /ResizeObserver loop|Script error\.?$/i.test(m)) return new Response(null, { status: 204 });
  const kaynak = String(g.k ?? "").replace(/^https?:\/\/[^/]+/, "").slice(0, 120);
  gunlukYaz(id, { t: "hata", k: "istemci", y: String(g.y ?? "/").slice(0, 200), c: cihaz(req.headers.get("user-agent")), m: `${m}${kaynak ? ` (${kaynak}${Number(g.s) ? `:${Number(g.s)}` : ""})` : ""}` });
  return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
}
export function OPTIONS() { return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } }); }
