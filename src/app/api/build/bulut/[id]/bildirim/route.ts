import { projeOku } from "@/lib/build/depo";
import { gunlukYaz } from "@/lib/build/gunluk";
import { izleyiciEngeli } from "@/lib/build/ekipRota";
import { bulunamadi, hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { bildirimDenetle, bildirimleriOku, bildirimSil, okunduIsaretle } from "@/lib/build/bulutBildirim";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Proje bildirimleri (yalnız sahip).
 *  GET → denetimleri çalıştırır (dakikada bir), { bildirimler, okunmamis }
 *  POST { islem: "okundu", kimlikler: string[] | "hepsi" } | { islem: "sil", kimlik } | { islem: "yayinHatasi", durum, mesaj }
 */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const p = await projeOku((await params).id, sahip);
  if (!p) return bulunamadi();
  await bildirimDenetle(p, new URL(req.url).searchParams.has("yenile")).catch(() => {});
  const l = await bildirimleriOku(p.id);
  return Response.json({ ok: true, bildirimler: l, okunmamis: l.filter((b) => !b.okundu).length });
}

export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const p = await projeOku((await params).id, sahip);
  { const engel = await izleyiciEngeli((await params).id, sahip); if (engel) return engel; }
  if (!p) return bulunamadi();
  let g: { islem?: string; kimlikler?: string[] | "hepsi"; kimlik?: string; durum?: number; mesaj?: string } = {};
  try { g = await req.json(); } catch { return hata("İstek okunamadı."); }
  if (g.islem === "okundu") await okunduIsaretle(p.id, g.kimlikler === "hepsi" ? "hepsi" : Array.isArray(g.kimlikler) ? g.kimlikler.map(String).slice(0, 200) : []);
  else if (g.islem === "sil" && g.kimlik) await bildirimSil(p.id, String(g.kimlik));
  else if (g.islem === "yayinHatasi") {
    // Bulut konsolundan yapılan yayın denemesi başarısız olduysa günlüğe yazılır; bildirim denetimi bunu yakalar.
    gunlukYaz(p.id, { t: "yayin", d: Math.max(400, Math.min(599, Number(g.durum) || 500)), m: `Yayın başarısız: ${String(g.mesaj ?? "bilinmeyen hata").slice(0, 240)}` });
  } else return hata("Bilinmeyen işlem.");
  const l = await bildirimleriOku(p.id);
  return Response.json({ ok: true, bildirimler: l, okunmamis: l.filter((b) => !b.okundu).length });
}
