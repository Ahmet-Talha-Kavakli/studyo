import "server-only";
import { hata } from "@/lib/hesap/guvenlik";
import { cerezOku, cerezYaz } from "@/lib/hesap/oturum";
import { alanOku, etkinOku, etkinYaz, uyeBul, type AlanKaydi, type UyeKaydi } from "./depo";
import { ALAN_BASLIGI, ALAN_CEREZI, ALAN_DESENI } from "./tipler";

/**
 * Etkin alan: isteğin hangi cüzdanla çalışacağı.
 *  1. x-vayra-alan başlığı, yoksa vayra_alan çerezi ("kisisel" ya da alan kimliği).
 *  2. İkisi de yoksa hesabın sunucuda saklanan son seçimi (arka planda çalışan Build işleri de bunu kullanır).
 * Seçim değişince ikisi birlikte yazılır (POST /api/alan/etkin).
 * Açıkça seçilmiş alanın üyesi değilse istek reddedilir: kullanıcı alanda sandığı bir işi kişisel bakiyesinden ödemesin.
 */
export interface EtkinAlan { alan: AlanKaydi; uye: UyeKaydi }

export const alanCerezi = (deger: string) => cerezYaz(ALAN_CEREZI, deger, 365 * 86_400);
export const alanCereziSil = () => cerezYaz(ALAN_CEREZI, "", 0);

function istekSecimi(req: Request): string | null {
  const v = req.headers.get(ALAN_BASLIGI) ?? cerezOku(req, ALAN_CEREZI);
  if (!v) return null;
  return v === "kisisel" || ALAN_DESENI.test(v) ? v : null;
}

async function uyelik(id: string, uid: string): Promise<EtkinAlan | null> {
  const a = await alanOku(id);
  const u = a && uyeBul(a, uid);
  return a && u ? { alan: a, uye: u } : null;
}

/** Kredi harcayan istekler için: kişisel ise null, alan ise üyelik; seçilen alanın üyesi değilse 403 yanıtı. */
export async function etkinAlanCoz(req: Request, uid: string): Promise<EtkinAlan | null | Response> {
  const s = istekSecimi(req);
  if (s === "kisisel") return null;
  if (s) {
    const e = await uyelik(s, uid);
    if (!e) return hata("Seçili çalışma alanına artık erişimin yok. Üst menüdeki alan seçiciden başka bir alan seç.", 403, { kod: "alan" });
    return e;
  }
  return etkinAlanSunucu(uid);
}

/** Gösterim için: geçersiz seçim hata vermez, kişisele düşer (bayat çerez temizlensin diye bayat: true). */
export async function etkinAlanSessiz(req: Request, uid: string): Promise<{ e: EtkinAlan | null; bayat: boolean }> {
  const s = istekSecimi(req);
  if (s === "kisisel") return { e: null, bayat: false };
  if (s) { const e = await uyelik(s, uid); return { e, bayat: !e }; }
  return { e: await etkinAlanSunucu(uid), bayat: false };
}

/** Yalnız sunucu kaydı (isteği olmayan arka plan işleri). Üyelik düştüyse kayıt silinir. */
export async function etkinAlanSunucu(uid: string): Promise<EtkinAlan | null> {
  const id = await etkinOku(uid);
  if (!id) return null;
  const e = await uyelik(id, uid);
  if (!e) await etkinYaz(uid, null);
  return e;
}
