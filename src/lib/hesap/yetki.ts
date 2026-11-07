import "server-only";
import { hata, kokenDenetle } from "./guvenlik";
import { rolHesapla } from "./hesap";
import { oturumOku, type GecerliOturum } from "./oturum";

/**
 * Oturum gerektiren uçlar için: geçerli oturum ya da 401 yanıtı. Durum değiştiren isteklerde köken de denetlenir.
 */
export async function oturumGerekli(req: Request): Promise<GecerliOturum | Response> {
  const k = kokenDenetle(req);
  if (k) return k;
  const o = await oturumOku(req);
  return o ?? hata("Oturum açık değil. Giriş yap.", 401, { kod: "oturum" });
}

/**
 * Yönetici oturumu iki adımlı doğrulamayla korunuyor mu: hesapta iki adım açık olmalı ve bu oturum ya iki adımla açılmış
 * olmalı (yöntemde "+ doğrulama uygulaması" ya da "+ yedek kod") ya da iki adım bu oturum sırasında, kod girilerek açılmış olmalı.
 * Yalnız geliştirmede VAYRA_ADMIN_IKI_ADIM=kapali ile atlanabilir; üretimde her zaman zorunlu.
 */
export function adminIkiAdimTamam(o: GecerliOturum): boolean {
  if (process.env.NODE_ENV !== "production" && process.env.VAYRA_ADMIN_IKI_ADIM === "kapali") return true;
  const ia = o.hesap.ikiAdim;
  if (!ia) return false;
  return o.oturum.yontem.includes(" + ") || o.oturum.olusturma <= ia.acilis;
}

/**
 * Yönetim uçlarının başında çağrılır: oturum yoksa 401, rol admin değilse 403, yönetici oturumu iki adımla korunmuyorsa 403.
 *   const y = await adminGerekli(req); if (y instanceof Response) return y;
 */
export async function adminGerekli(req: Request): Promise<GecerliOturum | Response> {
  const o = await oturumGerekli(req);
  if (o instanceof Response) return o;
  if (rolHesapla(o.hesap) !== "admin") return hata("Bu işlem için yönetici yetkisi gerekiyor.", 403, { kod: "yetki" });
  if (!adminIkiAdimTamam(o)) return hata("Yönetim paneli için iki adımlı doğrulama gerekiyor. Ayarlar, Güvenlik bölümünden aç ve yeniden giriş yap.", 403, { kod: "iki-adim" });
  return o;
}
