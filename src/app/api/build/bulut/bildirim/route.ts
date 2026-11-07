import { projeOku, sahipProjeleri } from "@/lib/build/depo";
import { sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { bildirimDenetle, bildirimleriOku } from "@/lib/build/bulutBildirim";

export const dynamic = "force-dynamic";

/** Bütün projelerin bildirimleri (Bulut genel bakış gelen kutusu): { bildirimler: [...{ projeId, projeAd }], okunmamis }. */
export async function GET(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const projeler = await sahipProjeleri(sahip);
  const l = (await Promise.all(projeler.map(async (o) => {
    const p = await projeOku(o.id, sahip);
    if (!p) return [];
    await bildirimDenetle(p).catch(() => {});
    return (await bildirimleriOku(p.id)).slice(0, 50).map((b) => ({ ...b, projeId: p.id, projeAd: p.ad }));
  }))).flat().sort((a, b) => b.z - a.z).slice(0, 150);
  return Response.json({ ok: true, bildirimler: l, okunmamis: l.filter((b) => !b.okundu).length });
}
