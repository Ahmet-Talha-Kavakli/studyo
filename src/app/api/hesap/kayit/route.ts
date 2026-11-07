import { belirtecUret } from "@/lib/hesap/belirtec";
import { EPOSTA_DESENI, epostaNormal, hesapOku } from "@/lib/hesap/depo";
import { baglantiGonder } from "@/lib/hesap/eposta";
import { cerezliYanit, cihazAdi, govdeOku, hata, hizHatasi, hizSiniri, istemciIp, kokenDenetle } from "@/lib/hesap/guvenlik";
import { benYaniti, hesapOlustur } from "@/lib/hesap/hesap";
import { oturumAc } from "@/lib/hesap/oturum";
import { sifreOzetle, sifrePolitikasi } from "@/lib/hesap/sifre";

export const runtime = "nodejs";

/** E-posta ve şifreyle hesap açar, oturumu başlatır, doğrulama bağlantısı gönderir. IP başına saatte 10 kayıt. */
export async function POST(req: Request) {
  const k = kokenDenetle(req);
  if (k) return k;
  const g = await govdeOku<{ ad?: string; email?: string; sifre?: string }>(req);
  if (!g) return hata("İstek okunamadı.");
  const email = epostaNormal(String(g.email ?? ""));
  const ad = String(g.ad ?? "").trim();
  if (!EPOSTA_DESENI.test(email) || email.length > 200) return hata("Geçerli bir e-posta adresi gir.", 400, { alan: "email" });
  if (ad.length < 2 || ad.length > 60) return hata("Adını gir.", 400, { alan: "ad" });
  const politika = sifrePolitikasi(g.sifre, { email, ad });
  if (politika) return hata(politika, 400, { alan: "sifre" });
  const bekle = hizSiniri(`kayit:ip:${istemciIp(req)}`, 10, 3_600_000);
  if (bekle) return hizHatasi(bekle);

  const o = await hesapOlustur({ email, ad, sifreOzeti: await sifreOzetle(g.sifre!), dogrulandi: false, cihaz: cihazAdi(req), ip: istemciIp(req), yontem: "E-posta ve şifre" });
  if (!o.ok) return hata("Bu e-postayla açılmış bir hesap var. Giriş yap ya da şifreni sıfırla.", 409, { kod: "var", alan: "email" });
  const oturum = await oturumAc(req, o.hesap.uid, "E-posta ve şifre");
  if (!oturum) return hata("Oturum açılamadı. Yeniden dene.", 500);
  const b = await belirtecUret("dogrula", { uid: o.hesap.uid, email }, 24 * 3_600_000);
  const dogrulama = await baglantiGonder(req, "dogrula", email, b);
  const { ok: _ok, ...ben } = await benYaniti((await hesapOku(o.hesap.uid)) ?? o.hesap, oturum.oturum.id); void _ok;
  return cerezliYanit({ ...ben, dogrulama }, [oturum.cerez], 201);
}
