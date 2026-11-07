import { hata, tamam } from "@/lib/hesap/guvenlik";
import { stripeAyar } from "@/lib/odeme/ayar";
import { kayitOku } from "@/lib/odeme/depo";
import { stripeIstek } from "@/lib/odeme/stripe";
import { baglamAl, hataYanit } from "@/lib/odeme/uc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Stripe Müşteri Portalı: kartı güncelleme ve Stripe faturaları. Yalnız Stripe aboneliği olan hesaplarda. */
export async function POST(req: Request) {
  const b = await baglamAl(req);
  if (b instanceof Response) return b;
  const a = stripeAyar();
  const k = await kayitOku(b.uid);
  const musteri = k.abonelik?.stripe?.musteri || k.stripeMusteri;
  if (!a || !musteri) return hata("Bu hesapta Stripe ile yönetilen bir ödeme yöntemi yok.", 404, { kod: "yok" });
  try {
    const r = await stripeIstek(a, "POST", "/v1/billing_portal/sessions", new URLSearchParams({ customer: musteri, return_url: `${b.koken}/panel/ayarlar/abonelik`, locale: "tr" }));
    return tamam({ adres: String(r.url) });
  } catch (e) { return hataYanit(e, "odeme-portal"); }
}
