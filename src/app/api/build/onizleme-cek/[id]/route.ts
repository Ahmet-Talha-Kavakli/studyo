import { projeOku } from "@/lib/build/depo";
import { sayfaGoruntusu } from "@/lib/build/onizlemeCek";
import { bulunamadi, hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { yolGecerli } from "@/lib/build/tipler";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
const son = new Map<string, number>();

/**
 * Önizlemenin o anki görüntüsü (çizim ve not için): sayfa, görünen genişlik ve yükseklik, kaydırma konumu ve tema.
 * POST { sayfa, genislik, yukseklik, y, tema } → { gorsel: data:image/jpeg } · tarayıcı motoru yoksa 501.
 * Proje başına 3 saniyede bir.
 */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const p = await projeOku(id, sahip);
  if (!p) return bulunamadi();
  let g: { sayfa?: string; genislik?: number; yukseklik?: number; y?: number; tema?: string; surum?: string };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const sayfa = typeof g.sayfa === "string" && yolGecerli(g.sayfa) && g.sayfa in p.dosyalar ? g.sayfa : "index.html";
  if (Date.now() - (son.get(id) ?? 0) < 3000) return hata("Biraz bekle, görüntü az önce alındı.", 429);
  son.set(id, Date.now());
  const koken = new URL(req.url).origin.replace("0.0.0.0", "localhost");
  const belirtec = g.surum && /^[A-Za-z0-9_-]{12}$/.test(g.surum) ? `${p.onizlemeBelirteci}~${g.surum}` : p.onizlemeBelirteci;
  const tema = g.tema === "acik" || g.tema === "koyu" ? `?vayra-tema=${g.tema}` : "";
  const png = await sayfaGoruntusu(`${koken}/api/build/onizleme/${id}/${belirtec}/${sayfa === "index.html" ? "" : sayfa}${tema}`, { genislik: Number(g.genislik) || 1280, yukseklik: Number(g.yukseklik) || 800, y: Math.max(0, Number(g.y) || 0) });
  if (!png) return hata("Bu sunucuda tarayıcı motoru yok; ekran görüntüsü alınamadı.", 501);
  return Response.json({ ok: true, gorsel: `data:image/jpeg;base64,${png.toString("base64")}` });
}
