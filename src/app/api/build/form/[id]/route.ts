import { formEkle, formlariOku, formlariYaz, projeOku, projeOkuHam } from "@/lib/build/depo";
import { gunlukYaz } from "@/lib/build/gunluk";
import { izleyiciEngeli } from "@/lib/build/ekipRota";
import { sistemTetikle } from "@/lib/build/sistemMotoru";
import { CORS, bulunamadi, hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/* Basit hız sınırı: aynı IP'den dakikada 10 gönderim. */
const son = new Map<string, number[]>();
function sinirAsildi(ip: string) {
  const simdi = Date.now();
  const l = (son.get(ip) ?? []).filter((t) => simdi - t < 60_000);
  l.push(simdi); son.set(ip, l);
  return l.length > 10;
}

/** Yayındaki ya da önizlemedeki sitenin formu (herkese açık, CORS). */
export async function POST(req: Request, { params }: Ctx) {
  const id = (await params).id;
  // Şablon galerisindeki canlı önizleme: form çalışıyormuş gibi teşekkür gösterilir, hiçbir yere kaydedilmez.
  if (id.startsWith("sablon-")) return new Response(JSON.stringify({ ok: true, onizleme: true }), { headers: { "Content-Type": "application/json", ...CORS } });
  const p = await projeOkuHam(id);
  if (!p) return new Response(JSON.stringify({ ok: false }), { status: 404, headers: CORS });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "yerel";
  if (sinirAsildi(ip)) return new Response(JSON.stringify({ ok: false, hata: "Çok fazla gönderim." }), { status: 429, headers: CORS });
  let g: { form?: string; sayfa?: string; alanlar?: Record<string, unknown> };
  try { g = await req.json(); } catch { return new Response(JSON.stringify({ ok: false }), { status: 400, headers: CORS }); }
  const alanlar: Record<string, string> = {};
  for (const [k, v] of Object.entries(g.alanlar ?? {}).slice(0, 40)) alanlar[String(k).slice(0, 60)] = String(v).slice(0, 4000);
  if (!Object.keys(alanlar).length) return new Response(JSON.stringify({ ok: false }), { status: 400, headers: CORS });
  const form = String(g.form || "Form").slice(0, 60), sayfa = String(g.sayfa || "").slice(0, 120);
  try { await formEkle(id, { form, sayfa, alanlar }); }
  catch (e) { return new Response(JSON.stringify({ ok: false, hata: (e as Error).message }), { status: 507, headers: CORS }); }
  // "Site formu" tetiğini dinleyen sistemler arka planda çalışır.
  sistemTetikle(`form:${id}`, { form, sayfa, alanlar }).catch(() => {});
  gunlukYaz(id, { t: "form", d: 201, y: sayfa, m: `"${form}" formu gönderildi` });
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json", ...CORS } });
}
export function OPTIONS() { return new Response(null, { status: 204, headers: CORS }); }

/** Gelen kutusu (yalnız sahip). */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  if (!(await projeOku(id, sahip))) return bulunamadi();
  return Response.json({ ok: true, gonderimler: await formlariOku(id) });
}

/** Okundu işaretle / sil: { okundu: string[] } ya da { sil: string[] }. */
export async function PATCH(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  if (!(await projeOku(id, sahip))) return bulunamadi();
  { const engel = await izleyiciEngeli(id, sahip); if (engel) return engel; }
  let g: { okundu?: string[]; sil?: string[] };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  let l = await formlariOku(id);
  if (g.okundu) l = l.map((x) => (g.okundu!.includes(x.id) ? { ...x, okundu: true } : x));
  if (g.sil) l = l.filter((x) => !g.sil!.includes(x.id));
  await formlariYaz(id, l);
  return Response.json({ ok: true, gonderimler: l });
}
