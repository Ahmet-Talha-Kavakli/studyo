import { govdeOku, hata, hizHatasi, hizSiniri, tamam } from "@/lib/hesap/guvenlik";
import { krediIade } from "@/lib/hesap/kredi";
import { oturumGerekli } from "@/lib/hesap/yetki";
import { etkinAlanCoz } from "@/lib/alan/etkin";
import { alanIade, alanKrediBilgisi } from "@/lib/alan/kredi";
import { alanOku } from "@/lib/alan/depo";

export const runtime = "nodejs";

/**
 * Geçiş dönemi iade ucu: başarısız üretimde istemci useAuth.krediEkle ile iade eder; burada yalnız daha önce
 * bu hesapta yapılmış bir harcama, anahtarıyla ve bir kez geri verilir. Keyfi kredi eklenemez.
 */
export async function POST(req: Request) {
  const o = await oturumGerekli(req);
  if (o instanceof Response) return o;
  const bekle = hizSiniri(`iade:${o.hesap.uid}`, 120, 60_000, false);
  if (bekle) return hizHatasi(bekle);
  const g = await govdeOku<{ anahtar?: string; kaynak?: string }>(req);
  const e = await etkinAlanCoz(req, o.hesap.uid);
  if (e instanceof Response) return e;
  if (e) {
    // Alan havuzu: yalnız bu üyenin yaptığı harcama iade edilir (anahtar sunucu kaydında üyeyle eşleşir).
    const anahtar = String(g?.anahtar ?? "");
    const kaynak = `istemci:${String(g?.kaynak ?? "iade").replace(/[^\w/:.-]/g, "").slice(0, 60)}`;
    const r = await alanIade(e.alan.id, anahtar, { kaynak, aciklama: "Kredi iadesi" });
    const bakiye = (await alanKrediBilgisi((await alanOku(e.alan.id)) ?? e.alan, o.hesap.uid)).kullanilabilir;
    if (r.ok) return tamam({ tekrar: r.tekrar, miktar: r.miktar, bakiye });
    return hata(r.neden === "bulunamadi" ? "İade edilecek harcama bulunamadı." : "İşlem anahtarı geçersiz.", r.neden === "bulunamadi" ? 404 : 400, { kod: r.neden, bakiye });
  }
  const r = await krediIade(o.hesap.uid, String(g?.anahtar ?? ""), { kaynak: `istemci:${String(g?.kaynak ?? "iade").replace(/[^\w/:.-]/g, "").slice(0, 60)}` });
  if (r.ok) return tamam({ tekrar: r.tekrar, miktar: r.miktar, bakiye: r.ozet.bakiye, ozet: r.ozet });
  return hata(r.neden === "bulunamadi" ? "İade edilecek harcama bulunamadı." : "İşlem anahtarı geçersiz.", r.neden === "bulunamadi" ? 404 : 400, { kod: r.neden, bakiye: r.ozet?.bakiye, ozet: r.ozet });
}
