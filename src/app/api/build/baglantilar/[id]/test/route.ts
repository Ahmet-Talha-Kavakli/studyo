import { acikGorunum, baglantiTest, baglantiYenile } from "@/lib/build/baglantiDepo";
import { sahipOzeti } from "@/lib/build/depo";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Bağlantıyı dener: bağlanır, araçları yeniden listeler, durumu günceller. { yenile: true } ile önce belirteç
 * zorla yenilenir ("Bağlantıyı yenile"); yanıtta yenilenip yenilenmediği ve nedeni döner.
 */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  let g: { yenile?: boolean } = {};
  try { g = await req.json(); } catch { /* boş */ }
  const id = (await params).id;
  if (g.yenile) {
    const r = await baglantiYenile(id, sahipOzeti(sahip));
    return r.baglanti ? Response.json({ ok: true, baglanti: acikGorunum(r.baglanti), yenilendi: r.yenilendi, neden: r.neden }) : hata("Bağlantı bulunamadı.", 404);
  }
  const b = await baglantiTest(id, sahipOzeti(sahip));
  return b ? Response.json({ ok: true, baglanti: acikGorunum(b) }) : hata("Bağlantı bulunamadı.", 404);
}
