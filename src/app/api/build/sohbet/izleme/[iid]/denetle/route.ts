import { izlemeCalistir, izlemeGetir } from "@/lib/build/sohbetIzleme";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/** Şimdi denetle: sonucu bekler (koşul tutarsa bildirim de gider). */
export async function POST(req: Request, { params }: { params: Promise<{ iid: string }> }) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).iid;
  if (!(await izlemeGetir(sahip, id))) return hata("İzleme bulunamadı.", 404);
  const k = await izlemeCalistir(sahip, id);
  if (!k) return hata("Bu izleme şu an zaten denetleniyor.", 409);
  const { durumVerisi: _d, ...x } = (await izlemeGetir(sahip, id))!; void _d;
  return Response.json({ ok: true, kontrol: k, izleme: x });
}
