import { govdeOku, hata, hizHatasi, hizSiniri, tamam } from "@/lib/hesap/guvenlik";
import { kullaniciVerisi, profilGuncelle, ProfilHatasi } from "@/lib/hesap/hesap";
import { oturumGerekli } from "@/lib/hesap/yetki";

export const runtime = "nodejs";

/**
 * Profil alanları: ad, avatar, slogan, bio, konum, sosyal, kapak, kullaniciAdi, website, plan, davetEden, davetIndirimi.
 * Avatar ve kapak data URL olarak gelirse sunucuda dosyaya yazılır, yanıtta kısa adres döner.
 */
async function guncelle(req: Request) {
  const o = await oturumGerekli(req);
  if (o instanceof Response) return o;
  const bekle = hizSiniri(`profil:${o.hesap.uid}`, 60, 600_000, false);
  if (bekle) return hizHatasi(bekle);
  const g = await govdeOku<Record<string, unknown>>(req, 3_500_000);
  if (!g) return hata("İstek okunamadı ya da çok büyük.", 413);
  try {
    const h = await profilGuncelle(o.hesap.uid, g);
    return tamam({ kullanici: await kullaniciVerisi(h) });
  } catch (e) {
    if (e instanceof ProfilHatasi) return hata(e.message, e.durum, e.kod ? { kod: e.kod } : {});
    console.error("[hesap] profil:", (e as Error).message);
    return hata("Profil kaydedilemedi.", 500);
  }
}

export const PATCH = guncelle;
export const POST = guncelle;
