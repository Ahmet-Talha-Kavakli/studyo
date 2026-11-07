import { kilitAcik, kilitliYanit } from "@/lib/build/sohbetKilit";
import { sohbetGetir } from "@/lib/build/sohbetDepo";
import { yayinAkisi, yayinlar } from "@/lib/build/sohbetYayin";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Süren (ya da az önce biten) turun yayınına yeniden bağlan: olaylar baştan oynatılır, sonra canlı sürer. */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const s = await sohbetGetir(id, sahip);
  if (!s) return hata("Sohbet bulunamadı.", 404);
  if (!kilitAcik(req, s)) return kilitliYanit();
  const y = yayinlar.get(id);
  if (!y) return Response.json({ ok: true, yok: true });
  return yayinAkisi(y, req.signal);
}
