import { projeErisimi, sahipOzeti } from "@/lib/build/depo";
import { ekipOku, genelKimlik } from "@/lib/build/ekipDepo";
import { SEKME_ADI, VARLIK_SURE, adTemizle, type VarlikKisi } from "@/lib/build/ekipOrtak";
import { bulunamadi, hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Kim burada: çalışma alanı 15 saniyede bir nabız gönderir, son 40 saniyede görülenler listelenir.
 * Bellekte tutulur (sunucu yeniden başlayınca boşalır); kişi başına tek kayıt (aynı kişinin sekmeleri birleşir).
 */
type Kayit = Omit<VarlikKisi, "sen"> & { anahtar: string };
const G = globalThis as unknown as { __vayraVarlik?: Map<string, Map<string, Kayit>> };
const VARLIK = (G.__vayraVarlik ??= new Map());

function liste(id: string, ben: string): VarlikKisi[] {
  const m = VARLIK.get(id);
  if (!m) return [];
  const sinir = Date.now() - VARLIK_SURE;
  for (const [k, v] of m) if (v.zaman < sinir) m.delete(k);
  if (!m.size) VARLIK.delete(id);
  return [...m.values()].sort((a, b) => a.zaman - b.zaman).map(({ anahtar, ...k }) => ({ ...k, ...(anahtar === ben ? { sen: true } : {}) }));
}

export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const rol = await projeErisimi(id, sahip);
  if (!rol) return bulunamadi();
  return Response.json({ ok: true, rol, kisiler: liste(id, sahipOzeti(sahip)) });
}

/** Nabız: { ad, sekme } ya da { ayril: true } (sekme kapanırken). Yanıtta güncel liste ve isteği yapanın rolü. */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const rol = await projeErisimi(id, sahip);
  if (!rol) return bulunamadi();
  let g: { ad?: unknown; sekme?: unknown; ayril?: unknown };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const oz = sahipOzeti(sahip);
  const m = VARLIK.get(id) ?? new Map<string, Kayit>();
  if (g.ayril === true) m.delete(oz);
  else {
    if (!m.has(oz) && m.size >= 60) return hata("Bu projede çok fazla kişi var.", 429);
    const sekme = typeof g.sekme === "string" && g.sekme in SEKME_ADI ? g.sekme : "onizleme";
    // Ad gelmezse (hesapsız tarayıcı) ekipte kayıtlı ad kullanılır.
    let ad = adTemizle(g.ad);
    if (!ad) { const e = await ekipOku(id); ad = (rol === "sahip" ? e.sahipAd : e.uyeler.find((u) => u.oz === oz)?.ad) || "Misafir"; }
    m.set(oz, { anahtar: oz, oz: genelKimlik(oz), ad, sekme, rol, zaman: Date.now() });
  }
  if (m.size) VARLIK.set(id, m); else VARLIK.delete(id);
  return Response.json({ ok: true, rol, kisiler: liste(id, oz) });
}
