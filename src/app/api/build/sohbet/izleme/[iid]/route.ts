import { izlemeGetir, izlemeGuncelle, izlemeOkundu, izlemeSil } from "@/lib/build/sohbetIzleme";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ iid: string }> };
const acik = <T extends { durumVerisi?: unknown }>(x: T) => { const { durumVerisi: _d, ...y } = x; void _d; return y; };

export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).iid;
  const x = await izlemeGetir(sahip, id);
  if (!x) return hata("İzleme bulunamadı.", 404);
  if (x.okunmamis) await izlemeOkundu(sahip, id);
  return Response.json({ ok: true, izleme: acik(x) });
}

/** { ad?, kosul?, aralik?, tekrar?, durum? } */
export async function PATCH(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  let g: Record<string, unknown>;
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const r = await izlemeGuncelle(sahip, (await params).iid, g);
  if ("hata" in r) return hata(r.hata);
  return Response.json({ ok: true, izleme: acik(r.izleme) });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  return (await izlemeSil(sahip, (await params).iid)) ? Response.json({ ok: true }) : hata("İzleme bulunamadı.", 404);
}
