import { govdeOku, hata, hizHatasi, hizSiniri, tamam } from "@/lib/hesap/guvenlik";
import { kayitOku } from "@/lib/odeme/depo";
import { onizlemeYaniti, teklifHazirla } from "@/lib/odeme/motor";
import type { OdemeIstegi } from "@/lib/odeme/tipler";
import { baglamAl, hataYanit } from "@/lib/odeme/uc";
import { alanSatinAlmaDenetle } from "@/lib/alan/odeme";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TURLER = new Set(["plan", "kredi", "sinirsiz", "hiz"]);

/** Ödeme özeti: tutar sunucuda katalogdan hesaplanır (kalan süre farkı, davet indirimi, KDV, sağlayıcı). Ödeme açmaz. */
export async function POST(req: Request) {
  const b = await baglamAl(req);
  if (b instanceof Response) return b;
  const bekle = hizSiniri(`odeme-onizle:${b.uid}`, 120, 600_000, false);
  if (bekle) return hizHatasi(bekle);
  const g = await govdeOku<OdemeIstegi>(req, 4_000);
  if (!g || !TURLER.has(String(g.tur))) return hata("Ürün türü tanınmadı.", 400, { kod: "urun" });
  // Alan için satın alma: yalnız alanın sahibi ve yöneticisi.
  if (g.alan) { try { await alanSatinAlmaDenetle(String(g.alan), b.uid); } catch (e) { return hata((e as Error).message, (e as { durum?: number }).durum ?? 400, { kod: "alan" }); } }
  try {
    const t = teklifHazirla(b, { tur: g.tur, urun: String(g.urun ?? ""), donem: g.donem === "yillik" ? "yillik" : "aylik", para: g.para === "USD" ? "USD" : "TRY", ...(g.alan ? { alan: String(g.alan) } : {}) }, await kayitOku(b.uid));
    const { ok: _ok, ...y } = onizlemeYaniti(t); void _ok;
    return tamam(y);
  } catch (e) { return hataYanit(e, "odeme-onizle"); }
}
