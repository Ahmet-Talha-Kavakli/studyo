import { dokumGetir, dokumuOzetle } from "@/lib/build/sohbetDokum";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/** Özeti (yeniden) çıkar: { model? }. */
export async function POST(req: Request, { params }: { params: Promise<{ did: string }> }) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).did;
  const d0 = await dokumGetir(sahip, id);
  if (!d0) return hata("Döküm bulunamadı.", 404);
  if (!d0.parcalar.length) return hata("Dökümde metin yok.");
  let g: { model?: string } = {};
  try { g = await req.json(); } catch { /* varsayılan */ }
  return Response.json({ ok: true, dokum: await dokumuOzetle(sahip, id, g.model) });
}
