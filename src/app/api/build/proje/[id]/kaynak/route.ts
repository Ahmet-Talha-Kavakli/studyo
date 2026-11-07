import { projeOku } from "@/lib/build/depo";
import { siteAynasi } from "@/lib/build/kaynak";
import { bulunamadi, hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
const onbellek = new Map<string, { zaman: number; v: { url: string; html: string } }>();

/**
 * Adresten içe aktarılan projede orijinal sitenin aynası (yan yana kıyas). GET → { url, html }; ?tazele=1 önbelleği atlar.
 * Ayna 10 dakika önbellekte tutulur; site okunamazsa nedeni döner.
 */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const p = await projeOku((await params).id, sahip);
  if (!p) return bulunamadi();
  if (!p.kaynakSite?.url) return hata("Bu proje bir web adresinden içe aktarılmadı.", 404);
  const anahtar = p.kaynakSite.url;
  const o = onbellek.get(anahtar);
  if (o && Date.now() - o.zaman < 600_000 && !new URL(req.url).searchParams.get("tazele")) return Response.json({ ok: true, ...o.v, kaynak: p.kaynakSite });
  try {
    const v = await siteAynasi(anahtar);
    onbellek.set(anahtar, { zaman: Date.now(), v });
    if (onbellek.size > 50) onbellek.delete(onbellek.keys().next().value!);
    return Response.json({ ok: true, ...v, kaynak: p.kaynakSite });
  } catch (e) { return hata((e as Error).message || "Orijinal site okunamadı.", 502); }
}
