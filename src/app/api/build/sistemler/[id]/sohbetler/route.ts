import { sistemGetir } from "@/lib/build/sistemDepo";
import { sohbetOturumlari, sohbetOturumuSahip, sohbetOturumuSil } from "@/lib/build/sistemGenel";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Sohbet tetiğinin son konuşmaları; ?oturum=… ile bir konuşmanın mesajları. */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const s = await sistemGetir((await params).id, sahip);
  if (!s) return hata("Sistem bulunamadı.", 404);
  const o = new URL(req.url).searchParams.get("oturum");
  if (o) { const m = await sohbetOturumuSahip(s.id, o); return m ? Response.json({ ok: true, mesajlar: m }) : hata("Konuşma bulunamadı.", 404); }
  return Response.json({ ok: true, oturumlar: await sohbetOturumlari(s.id) });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const s = await sistemGetir((await params).id, sahip);
  if (!s) return hata("Sistem bulunamadı.", 404);
  const o = new URL(req.url).searchParams.get("oturum");
  if (!o) return hata("Konuşma seçilmedi.");
  await sohbetOturumuSil(s.id, o);
  return Response.json({ ok: true });
}
