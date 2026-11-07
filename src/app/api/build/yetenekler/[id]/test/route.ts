import { yetenekGuncelle, yetenekKaydi } from "@/lib/build/yetenekDepo";
import { VARSAYILAN_MODEL } from "@/lib/build/modeller";
import { sohbetGetir, sohbetOlustur, sohbetSil } from "@/lib/build/sohbetDepo";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Yetenek düzenleyicisinin test sohbeti (yetenek bu sohbette açık): { yeni?: true, model? } → { sohbet } */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const y = await yetenekKaydi(id, sahip);
  if (!y) return hata("Yetenek bulunamadı.", 404);
  let g: { yeni?: boolean; model?: string } = {};
  try { g = await req.json(); } catch { /* boş */ }
  if (y.testSohbet && !g.yeni && (await sohbetGetir(y.testSohbet, sahip))) return Response.json({ ok: true, sohbet: y.testSohbet });
  if (y.testSohbet) await sohbetSil(y.testSohbet, sahip).catch(() => {});
  const s = await sohbetOlustur(sahip, g.model ?? VARSAYILAN_MODEL, { test: true, baslik: `${y.baslik} testi`, yetenekler: [id] });
  await yetenekGuncelle(id, sahip, (x) => { x.testSohbet = s.id; });
  return Response.json({ ok: true, sohbet: s.id });
}
