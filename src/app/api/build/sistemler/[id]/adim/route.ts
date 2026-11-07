import { sahipOzeti } from "@/lib/build/depo";
import { sistemGetir, sistemGuncelle } from "@/lib/build/sistemDepo";
import { adimBul } from "@/lib/build/sistemKatalog";
import { adimDene } from "@/lib/build/sistemMotoru";
import { adimlariTemizle } from "@/lib/build/sistemTemizle";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Bu adımı dene: { adimId, adim? (kaydedilmemiş ayarlar), tetik? } — adım tek başına, önceki adımların son ya da
 * sabitlenmiş verisiyle çalışır. Kayıt yazmaz, beklemez, onay istemez; sonucu deneme verisine yazar.
 */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const s = await sistemGetir(id, sahip);
  if (!s) return hata("Sistem bulunamadı.", 404);
  let g: { adimId?: string; adim?: unknown; tetik?: unknown } = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const kayitli = g.adimId ? adimBul(s.adimlar, g.adimId) : undefined;
  const yeni = g.adim ? adimlariTemizle([g.adim])[0] : undefined;
  const adim = yeni ? { ...yeni, id: g.adimId ?? yeni.id } : kayitli;
  if (!adim) return hata("Adım bulunamadı; önce kaydet.", 404);
  const r = await adimDene(s, sahipOzeti(sahip), adim, g.tetik);
  return Response.json({ ok: true, ...r });
}

/** Sabitle: { adimId, sabit: true|false, veri? } — sabit adım denemelerde çalışmaz, bu veriyi döndürür. */
export async function PUT(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  let g: { adimId?: string; sabit?: boolean; veri?: unknown } = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  if (!g.adimId) return hata("Adım seç.");
  if (JSON.stringify(g.veri ?? null).length > 60_000) return hata("Veri çok büyük.");
  const r = await sistemGuncelle((await params).id, sahip, (s) => {
    s.test ??= {}; s.test.adimlar ??= {};
    const l = new Set(s.test.sabit ?? []);
    if ("veri" in g) s.test.adimlar[g.adimId!] = { ...(s.test.adimlar[g.adimId!] ?? {}), veri: g.veri, cikti: typeof g.veri === "string" ? g.veri : JSON.stringify(g.veri), hata: undefined, zaman: Date.now(), kaynak: "elle" };
    if (g.sabit === true) { if (!s.test.adimlar[g.adimId!]) return "Önce adımı dene ya da veri gir."; l.add(g.adimId!); }
    if (g.sabit === false) l.delete(g.adimId!);
    s.test.sabit = [...l];
  });
  if (!r) return hata("Sistem bulunamadı.", 404);
  if (!r.sistem) return hata(r.hata);
  return Response.json({ ok: true, test: r.sistem.test });
}
