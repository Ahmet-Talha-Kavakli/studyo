import { projeOku } from "@/lib/build/depo";
import { bulunamadi, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { canliDurum } from "@/lib/build/bulutCanli";
import { veriOku } from "@/lib/build/veri";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Gerçek zamanlı izleyici özeti (yalnız sahip ve ekip): bağlantılar, kanallar ve varlık, tablo aboneleri, son olaylar. */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const p = await projeOku((await params).id, sahip);
  if (!p) return bulunamadi();
  const v = await veriOku(p.id);
  return Response.json({ ok: true, ...canliDurum(p.id), tabloKurallari: Object.entries(v.koleksiyonlar).map(([ad, k]) => ({ ad, okuma: k.kurallar.okuma })) });
}
