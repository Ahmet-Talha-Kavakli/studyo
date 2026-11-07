import { belirtecDeneme, belirtecKullan, belirtecOku } from "@/lib/hesap/belirtec";
import { hesapGuncelle, hesapOku, ozet } from "@/lib/hesap/depo";
import { basariliGiris, cerezliYanit, cihazAdi, govdeOku, hata, hataliDeneme, hizHatasi, hizSiniri, istemciIp, kilitHatasi, kilitKalan, kokenDenetle } from "@/lib/hesap/guvenlik";
import { benYaniti, rolYukselt } from "@/lib/hesap/hesap";
import { ikiAdimKoduKullan, yedekMi } from "@/lib/hesap/ikiAdim";
import { BEKLEYEN_CEREZI, bekleyenCereziSil, cerezOku, oturumAc } from "@/lib/hesap/oturum";

export const runtime = "nodejs";

/**
 * Girişin ikinci adımı: şifre (ya da sosyal giriş) doğrulandıktan sonra verilen bekleyen belirteç + 6 haneli kod
 * veya yedek kod. Bekleyen belirteç 5 dakika ve 5 hatalı deneme geçerli; sonra şifreyle yeniden başlanır.
 */
export async function POST(req: Request) {
  const k = kokenDenetle(req);
  if (k) return k;
  const g = await govdeOku<{ bekleyen?: string; kod?: string }>(req);
  const bekleyen = (typeof g?.bekleyen === "string" && g.bekleyen) || cerezOku(req, BEKLEYEN_CEREZI) || "";
  const ipBekle = hizSiniri(`iki:ip:${istemciIp(req)}`, 30, 600_000);
  if (ipBekle) return hizHatasi(ipBekle);
  const kayit = await belirtecOku<{ uid: string; yontem: string }>(bekleyen, "iki-adim");
  if (!kayit) return hata("Doğrulama süresi doldu. Yeniden giriş yap.", 401, { kod: "bekleyen" }, { "Set-Cookie": bekleyenCereziSil() });
  const uid = kayit.veri.uid;
  const kod = String(g?.kod ?? "");
  // Hesap başına kod kilidi: şifreyi bilen biri bekleyen belirteci yenileyerek kodu deneme yanılmayla bulamasın.
  const kilit = kilitKalan(`iki:${uid}`);
  if (kilit) return kilitHatasi(kilit);
  const sonuc = await ikiAdimKoduKullan(uid, kod, { cihaz: cihazAdi(req), ip: istemciIp(req) });
  if (sonuc !== "tamam") {
    const yeniKilit = hataliDeneme(`iki:${uid}`);
    if (yeniKilit) return kilitHatasi(yeniKilit);
    const kaldi = await belirtecDeneme(bekleyen, 5);
    if (!kaldi) return hata("Çok fazla hatalı kod. Güvenliğin için yeniden giriş yap.", 401, { kod: "bekleyen" }, { "Set-Cookie": bekleyenCereziSil() });
    return hata(yedekMi(kod) ? "Bu yedek kod geçersiz ya da daha önce kullanılmış." : "Kod hatalı ya da süresi geçti. Uygulamadaki güncel kodu gir.", 401, { kod: "kod", alan: "kod" });
  }
  if (!(await belirtecKullan(bekleyen, "iki-adim"))) return hata("Doğrulama süresi doldu. Yeniden giriş yap.", 401, { kod: "bekleyen" });
  const h = await hesapOku(uid);
  if (!h) return hata("Hesap bulunamadı.", 404);
  basariliGiris(`giris:${ozet(h.email)}`);
  basariliGiris(`iki:${uid}`);
  const yontem = `${kayit.veri.yontem} + ${yedekMi(kod) ? "yedek kod" : "doğrulama uygulaması"}`;
  const oturum = await oturumAc(req, uid, yontem);
  if (!oturum) return hata("Oturum açılamadı. Yeniden dene.", 500);
  const son = await hesapGuncelle(uid, rolYukselt);
  const { ok: _ok, ...ben } = await benYaniti(son?.hesap ?? h, oturum.oturum.id); void _ok;
  return cerezliYanit(ben, [oturum.cerez, bekleyenCereziSil()]);
}
