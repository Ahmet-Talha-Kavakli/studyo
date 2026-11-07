import { belirtecUret } from "@/lib/hesap/belirtec";
import { EPOSTA_DESENI, epostaNormal, epostadanUid, hesapGuncelle, olayEkle, ozet } from "@/lib/hesap/depo";
import { baglantiGonder } from "@/lib/hesap/eposta";
import { cihazAdi, govdeOku, hata, hataliDeneme, hizHatasi, hizSiniri, istemciIp, kilitHatasi, kilitKalan, tamam } from "@/lib/hesap/guvenlik";
import { sifreDogrula } from "@/lib/hesap/sifre";
import { oturumGerekli } from "@/lib/hesap/yetki";

export const runtime = "nodejs";

/**
 * E-posta değişikliği isteği. Şifre varsa şifre istenir. Değişiklik, yeni adrese giden bağlantı onaylanınca uygulanır
 * (/api/hesap/dogrula); o zamana kadar giriş eski adresle sürer.
 */
export async function POST(req: Request) {
  const o = await oturumGerekli(req);
  if (o instanceof Response) return o;
  const h = o.hesap;
  const g = await govdeOku<{ yeni?: string; sifre?: string }>(req);
  const yeni = epostaNormal(String(g?.yeni ?? ""));
  if (!EPOSTA_DESENI.test(yeni) || yeni.length > 200) return hata("Geçerli bir e-posta gir.", 400, { alan: "yeni" });
  if (yeni === h.email) return hata("Bu zaten mevcut adresin.", 400, { alan: "yeni" });
  const bekle = hizSiniri(`eposta:${h.uid}`, 5, 3_600_000, false);
  if (bekle) return hizHatasi(bekle);
  const kilitAnahtari = `giris:${ozet(h.email)}`;
  const kilit = kilitKalan(kilitAnahtari);
  if (kilit) return kilitHatasi(kilit);
  if (h.sifre && !(await sifreDogrula(String(g?.sifre ?? ""), h.sifre.ozet))) {
    const yk = hataliDeneme(kilitAnahtari);
    if (yk) return kilitHatasi(yk);
    return hata("Şifre hatalı.", 400, { alan: "sifre" });
  }
  if (await epostadanUid(yeni)) return hata("Bu e-posta başka bir hesapta kullanılıyor.", 409, { alan: "yeni" });
  const b = await belirtecUret("eposta", { uid: h.uid, eski: h.email, yeni }, 24 * 3_600_000);
  await hesapGuncelle(h.uid, (x) => { x.bekleyenEposta = yeni; olayEkle(x, "eposta", cihazAdi(req), `Değişiklik istendi: ${yeni}`, istemciIp(req)); });
  const s = await baglantiGonder(req, "eposta", yeni, b);
  if (!s.gonderildi && !s.gelistirmeBaglantisi) {
    await hesapGuncelle(h.uid, (x) => { delete x.bekleyenEposta; });
    return hata(s.hata ?? "E-posta gönderilemedi.", 503, { kod: "eposta-servisi" });
  }
  return tamam({ dogrulama: s, bekleyenEposta: yeni });
}
