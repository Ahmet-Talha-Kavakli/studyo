import type { Zamanlama } from "@/lib/build/sistemKatalog";
import { gorevGuncelle, gorevSil } from "@/lib/build/sohbetGorev";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ gid: string }> };

/** Düzenle, duraklat ya da sürdür: { ad?, istem?, zaman?, model?, durum?: "acik" | "duraklatildi" }. */
export async function PATCH(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  let g: { ad?: string; istem?: string; zaman?: Zamanlama; model?: string; durum?: "acik" | "duraklatildi" };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const r = await gorevGuncelle(sahip, (await params).gid, { ...g, durum: g.durum === "acik" || g.durum === "duraklatildi" ? g.durum : undefined });
  if ("hata" in r) return hata(r.hata);
  return Response.json({ ok: true, gorev: r.gorev });
}

/** Görevi ve sistemini siler (sohbet ve geçmiş sonuçları kalır). */
export async function DELETE(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  return (await gorevSil(sahip, (await params).gid)) ? Response.json({ ok: true }) : hata("Görev bulunamadı.", 404);
}
