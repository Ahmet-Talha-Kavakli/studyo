import { belirtecUret } from "@/lib/hesap/belirtec";
import { EPOSTA_DESENI, epostaNormal, epostadanUid, hesapGuncelle, hesapOku, olayEkle, ozet } from "@/lib/hesap/depo";
import {
  basariliGiris, cerezliYanit, cihazAdi, govdeOku, hata, hataliDeneme, hizHatasi, hizSiniri, istemciIp, kilitHatasi, kilitKalan, kokenDenetle,
} from "@/lib/hesap/guvenlik";
import { benYaniti, rolYukselt } from "@/lib/hesap/hesap";
import { bekleyenCerezi, oturumAc } from "@/lib/hesap/oturum";
import { sifreDogrula, sifreOzetle, yenidenOzetle } from "@/lib/hesap/sifre";

export const runtime = "nodejs";

/**
 * E-posta ve şifreyle giriş. Yanlış e-posta da yanlış şifre de aynı yanıtı ve aynı süreyi alır.
 * E-posta başına art arda 5 hatada kilit (1 dk, sonra 5 ve 15 dk); IP başına 15 dakikada 30 deneme.
 * İki adımlı doğrulama açıksa oturum açılmaz: 5 dakikalık bekleyen belirteç döner, kod /api/hesap/iki-adim/giris'e gelir.
 */
export async function POST(req: Request) {
  const k = kokenDenetle(req);
  if (k) return k;
  const g = await govdeOku<{ email?: string; sifre?: string }>(req);
  const email = epostaNormal(String(g?.email ?? ""));
  const sifre = typeof g?.sifre === "string" ? g.sifre : "";
  if (!EPOSTA_DESENI.test(email)) return hata("Geçerli bir e-posta adresi gir.", 400, { alan: "email" });
  if (!sifre) return hata("Şifreni gir.", 400, { alan: "sifre" });
  const ip = istemciIp(req);
  const ipBekle = hizSiniri(`giris:ip:${ip}`, 30, 900_000);
  if (ipBekle) return hizHatasi(ipBekle);
  const kilitAnahtari = `giris:${ozet(email)}`;
  const kilit = kilitKalan(kilitAnahtari);
  if (kilit) return kilitHatasi(kilit);

  const uid = await epostadanUid(email);
  const h = uid ? await hesapOku(uid) : null;
  const dogru = await sifreDogrula(sifre, h?.sifre?.ozet);
  if (!dogru || !h) {
    const yeniKilit = hataliDeneme(kilitAnahtari);
    if (h && !hizSiniri(`olay:hatali:${h.uid}`, 1, 60_000, false)) await hesapGuncelle(h.uid, (x) => olayEkle(x, yeniKilit ? "kilit" : "giris-hatali", cihazAdi(req), yeniKilit ? "Art arda hatalı şifre" : "Şifre", ip));
    if (yeniKilit) return kilitHatasi(yeniKilit);
    return hata("E-posta ya da şifre hatalı.", 401, { kod: "kimlik", alan: "sifre" });
  }
  basariliGiris(kilitAnahtari);
  if (h.askida) return hata("Bu hesap askıya alındı. Ayrıntı için destek ekibine yaz.", 403, { kod: "askida" });
  if (yenidenOzetle(h.sifre!.ozet)) { const yeni = await sifreOzetle(sifre); await hesapGuncelle(h.uid, (x) => { if (x.sifre) x.sifre.ozet = yeni; }); }
  if (h.ikiAdim) {
    const bekleyen = await belirtecUret("iki-adim", { uid: h.uid, yontem: "E-posta ve şifre" }, 5 * 60_000);
    return cerezliYanit({ ikiAdim: true, bekleyen }, [bekleyenCerezi(bekleyen)]);
  }
  const oturum = await oturumAc(req, h.uid, "E-posta ve şifre");
  if (!oturum) return hata("Oturum açılamadı. Yeniden dene.", 500);
  const son = await hesapGuncelle(h.uid, rolYukselt);
  const { ok: _ok, ...ben } = await benYaniti(son?.hesap ?? h, oturum.oturum.id); void _ok;
  return cerezliYanit(ben, [oturum.cerez]);
}
