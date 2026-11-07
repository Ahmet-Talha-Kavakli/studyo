import { buildVerisiniSil } from "@/lib/hesap/build";
import { ozet } from "@/lib/hesap/depo";
import { cerezliYanit, cihazAdi, govdeOku, hata, hataliDeneme, hizHatasi, hizSiniri, istemciIp, kilitHatasi, kilitKalan } from "@/lib/hesap/guvenlik";
import { hesabiSil } from "@/lib/hesap/hesap";
import { ikiAdimKoduKullan } from "@/lib/hesap/ikiAdim";
import { oturumCereziSil } from "@/lib/hesap/oturum";
import { sifreDogrula } from "@/lib/hesap/sifre";
import { oturumGerekli } from "@/lib/hesap/yetki";

export const runtime = "nodejs";

/**
 * Hesabı kalıcı olarak siler (KVKK silme hakkı). Onay için e-posta adresi, şifre varsa şifre, iki adım açıksa kod.
 * Bütün oturumlar kapanır; kredi defteri, profil, medya, sosyal bağlar ve hesabın Build projeleri silinir.
 */
export async function POST(req: Request) {
  const o = await oturumGerekli(req);
  if (o instanceof Response) return o;
  const h = o.hesap;
  const g = await govdeOku<{ onay?: string; sifre?: string; kod?: string }>(req);
  const bekle = hizSiniri(`sil:${h.uid}`, 10, 900_000, false);
  if (bekle) return hizHatasi(bekle);
  if (String(g?.onay ?? "").trim().toLowerCase() !== h.email) return hata("Onay için e-posta adresini aynen yaz.", 400, { alan: "onay" });
  const kilitAnahtari = `giris:${ozet(h.email)}`;
  const kilit = kilitKalan(kilitAnahtari);
  if (kilit) return kilitHatasi(kilit);
  if (h.sifre && !(await sifreDogrula(String(g?.sifre ?? ""), h.sifre.ozet))) {
    const yk = hataliDeneme(kilitAnahtari);
    if (yk) return kilitHatasi(yk);
    return hata("Şifre hatalı.", 400, { alan: "sifre" });
  }
  if (h.ikiAdim) {
    const ikiKilit = kilitKalan(`iki:${h.uid}`);
    if (ikiKilit) return kilitHatasi(ikiKilit);
    const s = await ikiAdimKoduKullan(h.uid, g?.kod, { cihaz: cihazAdi(req), ip: istemciIp(req) });
    if (s !== "tamam") { const yk = hataliDeneme(`iki:${h.uid}`); if (yk) return kilitHatasi(yk); return hata("Doğrulama kodu hatalı.", 400, { alan: "kod" }); }
  }
  await hesabiSil(h.uid, buildVerisiniSil);
  return cerezliYanit({ silindi: true }, [oturumCereziSil()]);
}
