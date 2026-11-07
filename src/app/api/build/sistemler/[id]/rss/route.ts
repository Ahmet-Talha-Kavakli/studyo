import { sahipOzeti } from "@/lib/build/depo";
import { canliAkis, sistemGetir } from "@/lib/build/sistemDepo";
import { rssYokla } from "@/lib/build/sistemMotoru";
import { rssOku, rssTetikVerisi } from "@/lib/build/sistemRss";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * { adres } akışı şimdi okur: son öğeleri tetik verisi biçiminde döner (deneme verisi seçmek için; çalıştırmaz).
 * { yokla: tetikId } açık sistemde yayındaki RSS tetiğini beklemeden yoklar (yeni öğe varsa çalışır).
 */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const s = await sistemGetir((await params).id, sahip);
  if (!s) return hata("Sistem bulunamadı.", 404);
  let g: { adres?: string; yokla?: string } = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  if (g.yokla) {
    if (s.durum !== "acik") return hata("Yoklama yalnız açık sistemde çalışır; denemek için Şimdi oku ile öğeleri gör.", 409);
    const t = canliAkis(s).tetikler.find((x) => x.tur === "rss" && x.id === g.yokla);
    if (!t || t.tur !== "rss") return hata("Yayındaki sürümde bu RSS tetiği yok; önce yayınla.", 404);
    const r = await rssYokla(s.id, sahipOzeti(sahip), t);
    return r.hata ? hata(r.hata, 422) : Response.json({ ok: true, yeni: r.yeni });
  }
  try {
    const a = await rssOku(String(g.adres ?? ""));
    return Response.json({ ok: true, baslik: a.baslik, baglanti: a.baglanti, ogeler: a.ogeler.slice(0, 10).map((o) => rssTetikVerisi({ ...o, icerik: o.icerik.slice(0, 4000) }, a, String(g.adres))), toplam: a.ogeler.length });
  } catch (e) { return hata((e as Error).message, 422); }
}
