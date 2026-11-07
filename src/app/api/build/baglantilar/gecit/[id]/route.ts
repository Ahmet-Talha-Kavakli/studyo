import { gecitAraclari, gecitGuncelle, gecitSil } from "@/lib/build/baglantiGecit";
import { sahipOzeti } from "@/lib/build/depo";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** { ad?, secim?, onayliDahil?, saltOkunur?, kapali?, anahtarYenile? }. anahtarYenile: eski anahtar hemen geçersiz olur, yenisi yalnız bu yanıtta gelir. */
export async function PATCH(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  let g: Parameters<typeof gecitGuncelle>[2] = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const r = await gecitGuncelle((await params).id, sahip, g);
  if (!r) return hata("Ağ geçidi bulunamadı.", 404);
  return Response.json({ ok: true, ...r, aracSayisi: (await gecitAraclari(r.gecit, sahipOzeti(sahip))).araclar.length });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  return (await gecitSil((await params).id, sahip)) ? Response.json({ ok: true }) : hata("Ağ geçidi bulunamadı.", 404);
}
