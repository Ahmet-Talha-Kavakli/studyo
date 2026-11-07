import { hizSiniri, istemciIp } from "@/lib/hesap/guvenlik";
import { SIPARIS_DESENI, siparisOku } from "@/lib/odeme/depo";
import { sonucIsle, stripeOturumIsle } from "@/lib/odeme/motor";
import { yonlendir } from "@/lib/odeme/uc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe Checkout dönüşü. Başarıda oturum Stripe'tan sunucuda çekilip işlenir (webhook gecikse de sonuç hemen görünür);
 * vazgeçmede sipariş başarısız olur. Kullanıcı aynı oturumda sonradan öderse webhook siparişi yine ödendi yapar.
 */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const no = u.searchParams.get("s") ?? "";
  if (!SIPARIS_DESENI.test(no)) return yonlendir(req, "/odeme/sonuc?hata=siparis");
  if (hizSiniri(`stripe-donus:${istemciIp(req)}`, 60, 600_000)) return yonlendir(req, `/odeme/sonuc?s=${no}`);
  try {
    if (u.searchParams.get("iptal") === "1") {
      const s = await siparisOku(no);
      if (s?.durum === "bekliyor") await sonucIsle(no, { durum: "basarisiz", olay: "Stripe ödeme sayfasından vazgeçildi", alanlar: { hata: "Ödemeden vazgeçildi" } });
      return yonlendir(req, `/odeme/sonuc?s=${no}`);
    }
    const oturum = u.searchParams.get("session_id") ?? "";
    await stripeOturumIsle(no, oturum, "Dönüş");
  } catch (e) { console.error("[odeme-stripe-donus]", (e as Error).message); }
  return yonlendir(req, `/odeme/sonuc?s=${no}`);
}
