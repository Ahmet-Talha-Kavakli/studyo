import { sahipOzeti } from "@/lib/build/depo";
import { canliAkis, sistemGetir } from "@/lib/build/sistemDepo";
import { tetikTemizle } from "@/lib/build/sistemTemizle";
import { calismaDegiskenleri, maskeleyici } from "@/lib/build/sistemDegisken";
import { tetikOnizle, tetikYokla } from "@/lib/build/sistemYoklama";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Servis ve işletme tetikleri. { tetik } düzenleyicideki tetiği şimdi okur ve öğeleri tetik verisi olarak döner
 * (çalıştırmaz). { yokla: tetikId } açık sistemde yayındaki tetiği beklemeden yoklar (yeni öğe varsa çalışır).
 */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const s = await sistemGetir((await params).id, sahip);
  if (!s) return hata("Sistem bulunamadı.", 404);
  let g: { tetik?: Record<string, unknown>; yokla?: string } = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const oz = sahipOzeti(sahip);
  if (g.yokla) {
    if (s.durum !== "acik") return hata("Yoklama yalnız açık sistemde çalışır; denemek için Şimdi oku.", 409);
    const t = canliAkis(s).tetikler.find((x) => x.id === g.yokla);
    if (!t || (t.tur !== "servis" && t.tur !== "isletme")) return hata("Yayındaki sürümde bu tetik yok; önce yayınla.", 404);
    const r = await tetikYokla(s.id, oz, t);
    return r.hata ? hata(r.hata, 422) : Response.json({ ok: true, yeni: r.yeni });
  }
  const t = g.tetik ? tetikTemizle(g.tetik as never) : null;
  if (!t || (t.tur !== "servis" && t.tur !== "isletme")) return hata("Servis ya da işletme tetiği gönder.");
  if (t.tur === "servis" && !t.olay) return hata("Olay seç.");
  try { return Response.json({ ok: true, ...(await tetikOnizle(oz, t)) }); }
  catch (e) { const { sir } = await calismaDegiskenleri(oz).catch(() => ({ sir: {} as Record<string, string> })); return hata(maskeleyici(sir)((e as Error).message).slice(0, 500), 422); }
}
