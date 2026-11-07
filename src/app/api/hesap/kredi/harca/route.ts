import { govdeOku, hata, hizHatasi, hizSiniri, tamam } from "@/lib/hesap/guvenlik";
import { krediHarca } from "@/lib/hesap/kredi";
import { oturumGerekli } from "@/lib/hesap/yetki";
import { etkinAlanCoz } from "@/lib/alan/etkin";
import { alanKrediKes } from "@/lib/alan/kredi";
import { kesintiYaniti } from "@/lib/hesap/krediKapi";

export const runtime = "nodejs";

/**
 * Geçiş dönemi harcama ucu: istemcinin iyimser düştüğü harcama (yalnız Build kaldı), burada sunucu defterine işler.
 * { miktar, anahtar, kaynak?, aciklama? }. Aynı anahtar ikinci kez düşülmez. Bakiye yetmezse 402.
 * Asıl hedef (2. aşama): kredi harcayan her rota krediHarca'yı kendisi çağırır, bu uç kapanır.
 */
export async function POST(req: Request) {
  // Bütün kredili işler krediyi sunucuda kendisi kesiyor; tarayıcının harcama bildirmesi üretimde kapalı.
  if (process.env.NODE_ENV === "production" && process.env.VAYRA_ISTEMCI_HARCAMA !== "acik") return hata("Bu uç kapatıldı: kredi işlemin kendisinde sunucuda düşülüyor.", 410, { kod: "kapali" });
  const o = await oturumGerekli(req);
  if (o instanceof Response) return o;
  const bekle = hizSiniri(`harca:${o.hesap.uid}`, 240, 60_000, false);
  if (bekle) return hizHatasi(bekle);
  const g = await govdeOku<{ miktar?: number; anahtar?: string; kaynak?: string; aciklama?: string }>(req);
  const kaynak = `istemci:${String(g?.kaynak ?? "bilinmiyor").replace(/[^\w/:.-]/g, "").slice(0, 60)}`;
  // Etkin çalışma alanı: harcama alan havuzundan, üyenin aylık sınırıyla (bakiye yanıtı üyenin harcayabileceği).
  const e = await etkinAlanCoz(req, o.hesap.uid);
  if (e instanceof Response) return e;
  if (e) {
    const a = await alanKrediKes({ alanId: e.alan.id, uid: o.hesap.uid, ad: o.hesap.profil.ad || o.hesap.email.split("@")[0], tutar: Number(g?.miktar), kaynak, aciklama: String(g?.aciklama ?? "").slice(0, 160) || "Kredi harcaması", anahtar: String(g?.anahtar ?? "") });
    if (a.ok) return tamam({ tekrar: a.tekrar, bakiye: a.kullanilabilir, alan: e.alan.id });
    if (a.neden === "sinir" || a.neden === "izleyici" || a.neden === "uye-degil" || a.neden === "yetersiz") return kesintiYaniti({ hata: a.neden, gereken: Number(g?.miktar) || 0, bakiye: a.kullanilabilir, sinir: a.sinir, buAy: a.buAy });
    return hata(a.neden === "cakisma" ? "Bu işlem anahtarı başka bir işlemde kullanılmış." : "Miktar ya da işlem anahtarı geçersiz.", a.neden === "cakisma" ? 409 : 400, { kod: a.neden, bakiye: a.kullanilabilir });
  }
  const r = await krediHarca(o.hesap.uid, Number(g?.miktar), { kaynak, aciklama: String(g?.aciklama ?? "").slice(0, 160) || undefined, anahtar: String(g?.anahtar ?? ""), plan: o.hesap.plan });
  if (r.ok) return tamam({ tekrar: r.tekrar, bakiye: r.ozet.bakiye, ozet: r.ozet });
  if (r.neden === "yetersiz") return hata("Kredin yetmiyor.", 402, { kod: "yetersiz", bakiye: r.ozet?.bakiye, ozet: r.ozet });
  if (r.neden === "cakisma") return hata("Bu işlem anahtarı başka bir işlemde kullanılmış.", 409, { kod: "cakisma", bakiye: r.ozet?.bakiye, ozet: r.ozet });
  return hata("Miktar ya da işlem anahtarı geçersiz.", 400, { kod: "gecersiz" });
}
