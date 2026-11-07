import { projeOku } from "@/lib/build/depo";
import { bulunamadi, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { denetimOku } from "@/lib/build/bulutGecmis";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Denetim günlüğü (sahip ve ekip): ?tur=&ara=&sinir= → { satirlar, sayilar } (90 gün). */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const p = await projeOku((await params).id, sahip);
  if (!p) return bulunamadi();
  const q = new URL(req.url).searchParams;
  const [satirlar, hepsi] = await Promise.all([denetimOku(p.id, { tur: q.get("tur") ?? undefined, ara: q.get("ara") ?? undefined, sinir: Math.min(1000, Number(q.get("sinir")) || 300) }), denetimOku(p.id, { sinir: 5000 })]);
  const sayilar: Record<string, number> = {};
  for (const x of hepsi) sayilar[x.tur] = (sayilar[x.tur] ?? 0) + 1;
  return Response.json({ ok: true, satirlar, sayilar, toplam: hepsi.length });
}
