import { ajanGetir, ajanGuncelle } from "@/lib/build/ajanDepo";
import { sohbetGetir, sohbetOlustur, sohbetSil } from "@/lib/build/sohbetDepo";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Düzenleyicinin test sohbeti: { yeni?: true } eskisini silip temiz bir sohbet açar. → { sohbet } */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const a = await ajanGetir(id, sahip);
  if (!a) return hata("Ajan bulunamadı.", 404);
  let g: { yeni?: boolean } = {};
  try { g = await req.json(); } catch { /* boş */ }
  if (a.testSohbet && !g.yeni && (await sohbetGetir(a.testSohbet, sahip))) return Response.json({ ok: true, sohbet: a.testSohbet });
  if (a.testSohbet) await sohbetSil(a.testSohbet, sahip).catch(() => {});
  const s = await sohbetOlustur(sahip, a.model, { ajanId: a.id, test: true, baslik: `${a.ad} testi` });
  await ajanGuncelle(id, sahip, (x) => { x.testSohbet = s.id; });
  return Response.json({ ok: true, sohbet: s.id });
}
