import { sistemAcik, sistemGetir, sistemGuncelle } from "@/lib/build/sistemDepo";
import { aracAdiGecerli, aracAdiOner, aracTanimi, anahtarDiziniYaz, disariAnahtari, disariAnahtariCoz } from "@/lib/build/sistemDisari";
import { girdiTemizle } from "@/lib/build/sistemTemizle";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Dışarı açma durumu: API ve MCP anahtarları, adresleri ve aracın tanımı (yalnız sahip görür). */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const s = await sistemGetir((await params).id, sahip);
  if (!s) return hata("Sistem bulunamadı.", 404);
  return Response.json({ ok: true, disari: s.disari ? { api: s.disari.api, mcp: s.disari.mcp, anahtar: disariAnahtariCoz(s), aracAdi: s.disari.aracAdi, aracAciklama: s.disari.aracAciklama, olusturma: s.disari.olusturma } : null, arac: aracTanimi(s), girdi: s.girdi ?? [], yayin: s.yayin?.surum ?? null });
}

/**
 * { api?, mcp? } aç ya da kapat (ilk açılışta anahtar üretilir), { yenile: true } yeni anahtar (eskisi çalışmaz),
 * { aracAdi?, aracAciklama?, girdi? } araç tanımı ve girdi alanları.
 */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  let g: { api?: boolean; mcp?: boolean; yenile?: boolean; aracAdi?: string; aracAciklama?: string; girdi?: unknown } = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  let dizin: { yeni: string; eski?: string } | undefined;
  const r = await sistemGuncelle((await params).id, sahip, (s) => {
    if (!s.disari || g.yenile) { const eski = s.disari?.anahtarOzeti; disariAnahtari(s); dizin = { yeni: s.disari!.anahtarOzeti, eski }; }
    const d = s.disari!;
    if (typeof g.api === "boolean") d.api = g.api;
    if (typeof g.mcp === "boolean") d.mcp = g.mcp;
    if (typeof g.aracAdi === "string") { const a = g.aracAdi.trim() || aracAdiOner(s.ad); if (!aracAdiGecerli(a)) return "Araç adı yalnız İngilizce harf, rakam, alt çizgi ve tire olabilir (en çok 64)."; d.aracAdi = a; }
    if (typeof g.aracAciklama === "string") d.aracAciklama = g.aracAciklama.slice(0, 1000);
    if (Array.isArray(g.girdi)) s.girdi = girdiTemizle(g.girdi);
  });
  if (!r) return hata("Sistem bulunamadı.", 404);
  if (!r.sistem) return hata(r.hata);
  if (dizin) await anahtarDiziniYaz(r.sistem.id, dizin.yeni, dizin.eski);
  const s = r.sistem;
  return Response.json({ ok: true, sistem: sistemAcik(s), disari: { api: s.disari!.api, mcp: s.disari!.mcp, anahtar: disariAnahtariCoz(s), aracAdi: s.disari!.aracAdi, aracAciklama: s.disari!.aracAciklama, olusturma: s.disari!.olusturma }, arac: aracTanimi(s), girdi: s.girdi ?? [] });
}
