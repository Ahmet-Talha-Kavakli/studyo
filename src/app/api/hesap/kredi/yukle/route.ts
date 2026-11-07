import { govdeOku, hata, hizHatasi, hizSiniri, tamam } from "@/lib/hesap/guvenlik";
import { odemeDeneme } from "@/lib/hesap/hesap";
import { krediEkle, krediOzeti } from "@/lib/hesap/kredi";
import { oturumGerekli } from "@/lib/hesap/yetki";
import { etkinAlanCoz } from "@/lib/alan/etkin";
import { alanKrediBilgisi } from "@/lib/alan/kredi";

export const runtime = "nodejs";

/**
 * Kredi yükleme. Bu sunucuda ödeme altyapısı yok: yükleme yalnız geliştirmede ya da VAYRA_DENEME_ODEME=1 iken
 * "deneme" kaynağıyla deftere işlenir; aksi hâlde 403 ve istemci eklediği krediyi geri alır.
 * Gerçek ödeme bağlanınca kredi bu uçtan değil, ödeme sağlayıcısının sunucu bildiriminden (webhook) eklenmeli.
 */
export async function POST(req: Request) {
  const o = await oturumGerekli(req);
  if (o instanceof Response) return o;
  const e = await etkinAlanCoz(req, o.hesap.uid);
  if (e instanceof Response) return e;
  if (e) return hata("Çalışma alanındayken kredi bu yoldan eklenmez. Alan havuzuna kredi, Ayarlar, Çalışma alanı, Kredi ve sınırlar sayfasından eklenir.", 409, { kod: "alan", bakiye: (await alanKrediBilgisi(e.alan, o.hesap.uid)).kullanilabilir });
  if (!odemeDeneme()) return hata("Ödeme altyapısı bu sunucuda kurulu değil; kredi eklenmedi.", 403, { kod: "odeme", bakiye: (await krediOzeti(o.hesap.uid, o.hesap.plan)).bakiye });
  const bekle = hizSiniri(`yukle:${o.hesap.uid}`, 30, 600_000, false);
  if (bekle) return hizHatasi(bekle);
  const g = await govdeOku<{ miktar?: number; anahtar?: string; kaynak?: string; aciklama?: string }>(req);
  const miktar = Number(g?.miktar);
  if (!Number.isInteger(miktar) || miktar <= 0 || miktar > 100_000) return hata("Miktar geçersiz.", 400, { kod: "gecersiz" });
  const kaynak = `deneme:${String(g?.kaynak ?? "istemci").replace(/[^\w/:.-]/g, "").slice(0, 60)}`;
  const r = await krediEkle(o.hesap.uid, miktar, { kaynak, aciklama: String(g?.aciklama ?? "").slice(0, 160) || "Deneme yüklemesi (ödeme alınmadı)", anahtar: String(g?.anahtar ?? "") || undefined, plan: o.hesap.plan });
  if (!r.ok) return hata(r.neden === "cakisma" ? "Bu işlem anahtarı başka bir işlemde kullanılmış." : "Miktar ya da işlem anahtarı geçersiz.", r.neden === "cakisma" ? 409 : 400, { kod: r.neden });
  return tamam({ tekrar: r.tekrar, bakiye: r.ozet.bakiye, ozet: r.ozet });
}
