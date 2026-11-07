import { govdeOku, hata, hizHatasi, hizSiniri, istemciIp, kokenDenetle, tamam } from "@/lib/hesap/guvenlik";
import { oturumOku } from "@/lib/hesap/oturum";
import { alanOzeti, davetBul, etkinYaz, kisiAdi } from "@/lib/alan/depo";
import { alanCerezi } from "@/lib/alan/etkin";
import { davetKabul } from "@/lib/alan/islem";
import { alanHataYanit } from "@/lib/alan/uc";
import { alanRengi } from "@/lib/alan/tipler";

export const runtime = "nodejs";

/**
 * POST /api/alan/davet { b, kontrol: true }  davetin özeti (oturumsuz da görülür: alan adı, rol, davet eden, adres).
 * POST /api/alan/davet { b }                 oturumdaki hesapla kabul eder (davet adresiyle aynı e-posta), alana geçer.
 * Davet tek kullanımlıktır ve 7 gün geçerlidir.
 */
export async function POST(req: Request) {
  const k = kokenDenetle(req);
  if (k) return k;
  const bekle = hizSiniri(`alan-davet:${istemciIp(req)}`, 30, 600_000);
  if (bekle) return hizHatasi(bekle);
  const g = await govdeOku<{ b?: string; kontrol?: boolean }>(req);
  const b = String(g?.b ?? "");
  const o = await oturumOku(req);
  if (g?.kontrol) {
    const d = await davetBul(b);
    if (!d) return hata("Bu davet bağlantısı geçersiz, süresi dolmuş ya da daha önce kullanılmış.", 410, { kod: "gecersiz" });
    const eden = await kisiAdi(d.davet.davetEden);
    return tamam({
      alan: { id: d.alan.id, ad: d.alan.ad, ...(d.alan.logo ? { logo: d.alan.logo } : {}), renk: alanRengi(d.alan.id), uyeSayisi: d.alan.uyeler.length },
      rol: d.davet.rol, eposta: d.davet.eposta, davetEden: eden?.ad ?? "Bir üye", bitis: d.davet.bitis,
      oturum: o ? { email: o.hesap.email, eslesiyor: o.hesap.email === d.davet.eposta, uye: d.alan.uyeler.some((u) => u.uid === o.hesap.uid) } : null,
    });
  }
  if (!o) return hata("Daveti kabul etmek için giriş yap.", 401, { kod: "oturum" });
  try {
    const a = await davetKabul(b, o.hesap, istemciIp(req));
    await etkinYaz(o.hesap.uid, a.id);
    const rol = a.uyeler.find((u) => u.uid === o.hesap.uid)?.rol ?? "uye";
    return tamam({ alan: alanOzeti(a, rol) }, 200, { "Set-Cookie": alanCerezi(a.id) });
  } catch (e) { return alanHataYanit(e); }
}
