import { govdeOku, hata, hizHatasi, hizSiniri, tamam } from "@/lib/hesap/guvenlik";
import { eskileriTemizle } from "@/lib/odeme/depo";
import { odemeBaslat } from "@/lib/odeme/motor";
import type { OdemeIstegi } from "@/lib/odeme/tipler";
import { baglamAl, hataYanit } from "@/lib/odeme/uc";
import { alanSatinAlmaDenetle } from "@/lib/alan/odeme";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TURLER = new Set(["plan", "kredi", "sinirsiz", "hiz"]);

/**
 * POST /api/odeme/baslat { tur, urun, donem?, para? }
 * Fiyat istemciden alınmaz; sipariş açılır ve sağlayıcının güvenli ödeme sayfasının adresi döner ({ no, adres }).
 * Dönem sonunda geçerli olacak plan düşürmesinde ödeme açılmaz ({ planlandi: true, mesaj }).
 */
export async function POST(req: Request) {
  const b = await baglamAl(req);
  if (b instanceof Response) return b;
  const bekle = hizSiniri(`odeme-baslat:${b.uid}`, 20, 600_000, false);
  if (bekle) return hizHatasi(bekle);
  const g = await govdeOku<OdemeIstegi>(req, 4_000);
  if (!g || !TURLER.has(String(g.tur))) return hata("Ürün türü tanınmadı.", 400, { kod: "urun" });
  void eskileriTemizle().catch(() => {});
  // Alan için satın alma: yalnız alanın sahibi ve yöneticisi.
  if (g.alan) { try { await alanSatinAlmaDenetle(String(g.alan), b.uid); } catch (e) { return hata((e as Error).message, (e as { durum?: number }).durum ?? 400, { kod: "alan" }); } }
  try {
    const r = await odemeBaslat(b, { tur: g.tur, urun: String(g.urun ?? ""), donem: g.donem === "yillik" ? "yillik" : "aylik", para: g.para === "USD" ? "USD" : "TRY", ...(g.alan ? { alan: String(g.alan) } : {}) });
    return tamam(r as Record<string, unknown>);
  } catch (e) { return hataYanit(e, "odeme-baslat"); }
}
