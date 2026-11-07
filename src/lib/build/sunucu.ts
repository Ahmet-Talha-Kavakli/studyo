import "server-only";
import { sahipAnahtariGecerli } from "./depo";
import { dogrulanmisAnahtar, hesapBuildAnahtari } from "@/lib/hesap/build";

/**
 * İsteği yapanın Build sahip anahtarı ([A-Za-z0-9_-] 24-80 karakter); yoksa null.
 *  1. Geçerli Vayra oturumu (vayra_oturum çerezi) varsa hesabın anahtarı. Hesabın anahtarı yoksa istekteki geçerli
 *     x-build-sahip başlığı bir kez benimsenir (o cihazdaki eski projeler hesaba geçer).
 *  2. Oturum yoksa başlık: geliştirmede her zaman, üretimde yalnız VAYRA_ANONIM_BUILD=1 iken ya da sunucunun kendi
 *     iç çağrısında (son 15 dakikada oturumla doğrulanmış hesap anahtarı).
 */
export function sahipAl(req: Request): string | null {
  const a = req.headers.get("x-build-sahip");
  const baslik = sahipAnahtariGecerli(a) ? a : null;
  const hesap = hesapBuildAnahtari(req, baslik);
  if (hesap) return hesap;
  if (!baslik) return null;
  if (process.env.NODE_ENV !== "production" || process.env.VAYRA_ANONIM_BUILD === "1") return baslik;
  return dogrulanmisAnahtar(baslik) ? baslik : null;
}
export const hata = (mesaj: string, durum = 400) => Response.json({ ok: false, hata: mesaj }, { status: durum });
export const yetkisiz = () => hata("Bu projeye erişimin yok.", 403);
export const bulunamadi = () => hata("Proje bulunamadı.", 404);

/** Kum havuzundaki (opak köken) sayfaların erişebilmesi için CORS. */
/** Sitelerden gelen istekler: üye oturumu (x-vayra-oturum) ve önizleme belirteci başlıkları da izinli; çerez kullanılmaz. */
export const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization, x-vayra-oturum, x-vayra-onizleme", "Access-Control-Max-Age": "600" };
