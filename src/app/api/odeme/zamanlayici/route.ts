import { timingSafeEqual } from "crypto";
import { hata, tamam } from "@/lib/hesap/guvenlik";
import { abonelikleriDenetle } from "@/lib/odeme/zamanlayici";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Zamanlanmış görev (saatte bir çağrılması önerilir): bütün aboneliklerin dönem sonu, yenileme hatırlatması ve Stripe
 * eşitlemesi. Yetki: Authorization: Bearer <VAYRA_ODEME_ZAMANLAYICI_SIRRI>. Sır tanımlı değilse uç kapalıdır.
 * Zamanlayıcı olmadan da çalışır: kullanıcı Ayarlar'ı ya da ödeme sayfalarını açınca aynı denetim yapılır, kredi defteri
 * ödenmemiş dönemi kendisi kapatır.
 */
export async function POST(req: Request) {
  const sir = process.env.VAYRA_ODEME_ZAMANLAYICI_SIRRI ?? "";
  if (sir.length < 16) return hata("Zamanlayıcı bu sunucuda kapalı.", 404);
  const gelen = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(gelen), b = Buffer.from(sir);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return hata("Yetkisiz.", 401);
  return tamam(await abonelikleriDenetle());
}
