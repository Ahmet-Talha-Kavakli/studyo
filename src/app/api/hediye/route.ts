import { govdeOku, hata, hizHatasi, hizSiniri, tamam } from "@/lib/hesap/guvenlik";
import { oturumGerekli } from "@/lib/hesap/yetki";
import { HEDIYE_TUTARLARI, gonderilenler, hediyeIptal, hediyeOlustur, kodKullan } from "@/lib/odeme/hediye";
import { hataYanit } from "@/lib/odeme/uc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Promosyon ve hediye kodları. Oturum zorunlu; kimlik çerezden gelir (gövdedeki e-posta yok sayılır).
 * Doğrulama ve kredi işlemi sunucuda, kredi defterinde (lib/odeme/hediye):
 *   { islem: "kullan", kod }                  kodu uygular, kredi bu hesaba eklenir
 *   { islem: "olustur", kredi, not? }         bakiyeden düşer, tek kullanımlık kod döner
 *   { islem: "iptal", ozet }                  kullanılmamış kodu iptal eder, kredi iade edilir
 *   { islem: "durum" }                        bu hesabın gönderdiği kodlar ve durumları
 */
export async function POST(req: Request) {
  const o = await oturumGerekli(req);
  if (o instanceof Response) return o;
  const uid = o.hesap.uid;
  const g = await govdeOku<{ islem?: string; kod?: string; kredi?: number; not?: string; ozet?: string }>(req, 4_000);
  if (!g) return hata("Geçersiz istek.");
  try {
    if (g.islem === "kullan") {
      // Kod deneme saldırısı: hesap başına 10 dakikada 15 deneme.
      const bekle = hizSiniri(`kod-kullan:${uid}`, 15, 600_000, false);
      if (bekle) return hizHatasi(bekle);
      const r = await kodKullan(uid, o.hesap.plan, String(g.kod ?? ""));
      return tamam({ tur: r.tur, kod: r.kod, kredi: r.kredi, aciklama: r.aciklama, bakiye: r.ozet.bakiye, ozet: r.ozet });
    }
    if (g.islem === "olustur") {
      const bekle = hizSiniri(`kod-olustur:${uid}`, 20, 3_600_000, false);
      if (bekle) return hizHatasi(bekle);
      const not = String(g.not ?? "").replace(/[\u0000-\u001f\u007f<>]/g, "").trim().slice(0, 40);
      const r = await hediyeOlustur(uid, o.hesap.plan, Number(g.kredi), not);
      return tamam({ kod: r.kod, kredi: r.kredi, bakiye: r.ozet.bakiye, ozet: r.ozet });
    }
    if (g.islem === "iptal") {
      const ozet = await hediyeIptal(uid, String(g.ozet ?? ""));
      return tamam({ bakiye: ozet.bakiye, ozet, gonderilenler: await gonderilenler(uid) });
    }
    if (g.islem === "durum") return tamam({ gonderilenler: await gonderilenler(uid) });
    return hata("Bilinmeyen işlem.");
  } catch (e) { return hataYanit(e, "hediye"); }
}

export function GET() {
  return tamam({ tutarlar: HEDIYE_TUTARLARI });
}
