import { ajanHam } from "@/lib/build/ajanDepo";
import { webhookAl } from "@/lib/build/ajanZamanlayici";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string; gizli: string }> };
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
const yanit = (v: unknown, durum = 200) => Response.json(v, { status: durum, headers: CORS });

export function OPTIONS() { return new Response(null, { status: 204, headers: CORS }); }

async function bul(ctx: Ctx) {
  const { id, gizli } = await ctx.params;
  if (!/^[A-Za-z0-9_-]{16,40}$/.test(gizli)) return null;
  const h = await ajanHam(id);
  const t = h?.ajan.tetikler.find((x) => x.tur === "webhook" && x.gizli === gizli);
  return h && t ? { ...h, t, gizli } : null;
}

/** Adres denemesi: webhook'un var olduğunu ve açık olduğunu söyler (çalıştırmaz). */
export async function GET(_req: Request, ctx: Ctx) {
  const b = await bul(ctx);
  if (!b) return yanit({ ok: false, hata: "Webhook bulunamadı." }, 404);
  return yanit({ ok: true, ad: b.t.ad, acik: b.t.acik && !b.t.duraklatma, ajan: b.ajan.ad });
}

/**
 * Webhook olayı: gövde JSON, form ya da düz metin olabilir. Filtreye uyarsa ajan gözetimsiz çalışır ve sonucu
 * görevler kutusuna düşer. Varsayılan 202 { calisma } hemen döner; ?bekle=1 çalışma bitince { durum, cikti } döner.
 */
export async function POST(req: Request, ctx: Ctx) {
  const b = await bul(ctx);
  if (!b) return yanit({ ok: false, hata: "Webhook bulunamadı." }, 404);
  const ham = (await req.text()).slice(0, 200_000);
  const tur = req.headers.get("content-type") ?? "";
  let veri: unknown = ham;
  if (tur.includes("json") || /^\s*[[{]/.test(ham)) { try { veri = JSON.parse(ham); } catch { /* düz metin */ } }
  else if (tur.includes("x-www-form-urlencoded")) veri = Object.fromEntries(new URLSearchParams(ham));
  const bekle = new URL(req.url).searchParams.get("bekle") === "1";
  const r = await webhookAl(b.ajan, b.sahipOz, b.gizli, veri, bekle);
  if (r.hata) return yanit({ ok: false, hata: r.hata }, r.kod ?? 400);
  if (r.atlandi) return yanit({ ok: true, durum: "atlandi", neden: r.atlandi, calisma: r.calisma?.id });
  if (r.kuyrukta) return yanit({ ok: true, durum: "kuyrukta", calisma: r.kuyrukta }, 202);
  return yanit({ ok: r.calisma?.durum !== "hata", durum: r.calisma?.durum, calisma: r.calisma?.id, cikti: r.calisma?.cikti, hata: r.calisma?.hata });
}
