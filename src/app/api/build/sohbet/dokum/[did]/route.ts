import { dokumGetir, dokumGuncelle, dokumSil } from "@/lib/build/sohbetDokum";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ did: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const d = await dokumGetir(sahip, (await params).did);
  return d ? Response.json({ ok: true, dokum: d }) : hata("Döküm bulunamadı.", 404);
}

/** { baslik?, konusmaci?: { id, ad }, eylem?: { i, bitti }, parca?: { i, metin?, k? } } */
export async function PATCH(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  let g: { baslik?: string; konusmaci?: { id?: string; ad?: string }; eylem?: { i?: number; bitti?: boolean }; parca?: { i?: number; metin?: string; k?: string } };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const d = await dokumGuncelle(sahip, (await params).did, (x) => {
    if (typeof g.baslik === "string" && g.baslik.trim()) x.baslik = g.baslik.trim().slice(0, 100);
    if (g.konusmaci?.id && typeof g.konusmaci.ad === "string" && g.konusmaci.ad.trim()) { const k = x.konusmacilar.find((y) => y.id === g.konusmaci!.id); if (k) k.ad = g.konusmaci.ad.trim().slice(0, 40); }
    if (g.eylem && typeof g.eylem.i === "number" && x.eylemler?.[g.eylem.i]) x.eylemler[g.eylem.i].bitti = !!g.eylem.bitti || undefined;
    if (g.parca && typeof g.parca.i === "number" && x.parcalar[g.parca.i]) {
      if (typeof g.parca.metin === "string" && g.parca.metin.trim()) x.parcalar[g.parca.i].metin = g.parca.metin.trim().slice(0, 4000);
      if (typeof g.parca.k === "string" && x.konusmacilar.some((y) => y.id === g.parca!.k)) x.parcalar[g.parca.i].k = g.parca.k;
    }
  });
  return d ? Response.json({ ok: true, dokum: d }) : hata("Döküm bulunamadı.", 404);
}

export async function DELETE(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  return (await dokumSil(sahip, (await params).did)) ? Response.json({ ok: true }) : hata("Döküm bulunamadı.", 404);
}
