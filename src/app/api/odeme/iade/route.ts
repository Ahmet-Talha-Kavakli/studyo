import { govdeOku, hata, istemciIp, tamam } from "@/lib/hesap/guvenlik";
import { adminGerekli } from "@/lib/hesap/yetki";
import { iyzicoAyar, stripeAyar } from "@/lib/odeme/ayar";
import { SIPARIS_DESENI, siparisGuncelle, siparisOku } from "@/lib/odeme/depo";
import { iadeEt } from "@/lib/odeme/iyzico";
import { iadeIsle, siparisOzeti } from "@/lib/odeme/motor";
import { stripeIstek } from "@/lib/odeme/stripe";
import { hataYanit } from "@/lib/odeme/uc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Yönetici iadesi (tam tutar): sağlayıcıda iade yapılır, sipariş iade olur, eklenen kredi bakiye yettiği kadar geri alınır,
 * süreli hak kapanır. Plan iadesinde abonelik ayrıca iptal edilmelidir (Stripe panelinden ya da kullanıcı Ayarlar'dan).
 */
export async function POST(req: Request) {
  const y = await adminGerekli(req);
  if (y instanceof Response) return y;
  const g = await govdeOku<{ no?: string }>(req, 500);
  const no = String(g?.no ?? "");
  const s = SIPARIS_DESENI.test(no) ? await siparisOku(no) : null;
  if (!s) return hata("Sipariş bulunamadı.", 404);
  if (s.durum !== "odendi") return hata("Yalnız ödenmiş sipariş iade edilir.", 409);
  try {
    let tutar = s.tahsil ?? s.toplam;
    if (s.saglayici === "iyzico") {
      const a = iyzicoAyar();
      if (!a || !s.saglayiciKimligi) return hata("iyzico ayarı ya da ödeme kimliği yok.", 409);
      tutar = (await iadeEt(a, { siparisNo: no, odemeKimligi: s.saglayiciKimligi, tutar, para: s.para, ip: istemciIp(req) })).tutar;
    } else if (s.saglayici === "stripe") {
      const a = stripeAyar();
      if (!a || !s.saglayiciKimligi) return hata("Stripe ayarı ya da ödeme kimliği yok.", 409);
      const f = new URLSearchParams(s.saglayiciKimligi.startsWith("pi_") ? { payment_intent: s.saglayiciKimligi } : { charge: s.saglayiciKimligi });
      f.set("metadata[no]", no);
      const r = await stripeIstek(a, "POST", "/v1/refunds", f, `iade-${no}`);
      tutar = Number(r.amount) || tutar;
    }
    await siparisGuncelle(no, (x) => { x.olaylar.push({ z: Date.now(), olay: "Yönetici iadesi başlatıldı", ayrinti: y.hesap.email }); });
    const r = await iadeIsle(no, tutar, "Yönetici iadesi");
    return tamam({ siparis: siparisOzeti(r) });
  } catch (e) { return hataYanit(e, "odeme-iade"); }
}
