import { PaylasimHatasi, paylasimOlustur, projePaylasimi, sahipPaylasimlari } from "@/lib/build/paylasim";
import { projeninOgesi, sahipOgeleri } from "@/lib/build/topluluk";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/**
 * Sahibin paylaşımları.
 *  GET              → { paylasimlar, topluluk } (projeler sayfasındaki "Paylaşılıyor" durumu)
 *  GET ?proje=<id>  → { paylasim | null, surumler, proje, topluluk | null } (paylaş paneli)
 *  POST { projeId, remix?, kod?, surum?, aciklama?, yazar? } → bağlantı açar (varsa ayarları uygular)
 */
export async function GET(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const proje = new URL(req.url).searchParams.get("proje");
  if (proje) {
    const v = await projePaylasimi(proje, sahip);
    if (!v) return hata("Proje bulunamadı.", 404);
    return Response.json({ ok: true, ...v, topluluk: await projeninOgesi(proje, sahip) });
  }
  return Response.json({ ok: true, paylasimlar: await sahipPaylasimlari(sahip), topluluk: await sahipOgeleri(sahip) });
}

export async function POST(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  let g: Record<string, unknown>;
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  try { return Response.json({ ok: true, paylasim: await paylasimOlustur(String(g.projeId ?? ""), sahip, g) }); }
  catch (e) { return e instanceof PaylasimHatasi ? hata(e.message, e.durum) : hata("Bağlantı oluşturulamadı.", 500); }
}
