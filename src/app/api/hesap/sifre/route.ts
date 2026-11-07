import { hesapGuncelle, hesapOku, olayEkle, ozet } from "@/lib/hesap/depo";
import { bildirimGonder } from "@/lib/hesap/eposta";
import { cihazAdi, govdeOku, hata, hataliDeneme, hizHatasi, hizSiniri, istemciIp, kilitHatasi, kilitKalan, tamam } from "@/lib/hesap/guvenlik";
import { hesapOzeti } from "@/lib/hesap/hesap";
import { oturumBilgileri, oturumlariKapat } from "@/lib/hesap/oturum";
import { sifreDogrula, sifreOzetle, sifrePolitikasi } from "@/lib/hesap/sifre";
import { oturumGerekli } from "@/lib/hesap/yetki";

export const runtime = "nodejs";

/**
 * Şifre değiştir ya da (sosyal girişle açılmış hesapta) ilk kez belirle.
 * Şifre varsa mevcut şifre istenir; hatalı denemeler girişle aynı kilide sayılır. İstenirse diğer oturumlar kapanır.
 */
export async function POST(req: Request) {
  const o = await oturumGerekli(req);
  if (o instanceof Response) return o;
  const g = await govdeOku<{ mevcut?: string; yeni?: string; digerleriniKapat?: boolean }>(req);
  const h = o.hesap;
  const bekle = hizSiniri(`sifre:${h.uid}`, 10, 900_000, false);
  if (bekle) return hizHatasi(bekle);
  const kilitAnahtari = `giris:${ozet(h.email)}`;
  const kilit = kilitKalan(kilitAnahtari);
  if (kilit) return kilitHatasi(kilit);
  if (h.sifre) {
    if (!(await sifreDogrula(String(g?.mevcut ?? ""), h.sifre.ozet))) {
      const yk = hataliDeneme(kilitAnahtari);
      await hesapGuncelle(h.uid, (x) => olayEkle(x, "giris-hatali", cihazAdi(req), "Şifre değişikliğinde hatalı mevcut şifre", istemciIp(req)));
      if (yk) return kilitHatasi(yk);
      return hata("Şu anki şifre hatalı.", 400, { alan: "mevcut" });
    }
  }
  const yeni = String(g?.yeni ?? "");
  const p = sifrePolitikasi(yeni, { email: h.email, ad: h.profil.ad });
  if (p) return hata(p, 400, { alan: "yeni" });
  if (h.sifre && (await sifreDogrula(yeni, h.sifre.ozet))) return hata("Yeni şifre eskisiyle aynı olamaz.", 400, { alan: "yeni" });
  const ozetDeger = await sifreOzetle(yeni);
  const ilk = !h.sifre;
  await hesapGuncelle(h.uid, (x) => { x.sifre = { ozet: ozetDeger, guncelleme: Date.now() }; olayEkle(x, "sifre", cihazAdi(req), ilk ? "Şifre belirlendi" : "Şifre değiştirildi", istemciIp(req)); });
  const kapatilan = g?.digerleriniKapat ? await oturumlariKapat(h.uid, { haric: o.oturum.id }) : 0;
  bildirimGonder(h.email, "Vayra şifren değişti", `Vayra hesabının şifresi ${new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })} tarihinde ${ilk ? "belirlendi" : "değiştirildi"}. Bu sen değilsen hemen şifreni sıfırla ve oturumlarını kapat.`);
  const son = await hesapOku(h.uid);
  return tamam({ kapatilan, hesap: son ? hesapOzeti(son, o.oturum.id) : null, oturumlar: son ? oturumBilgileri(son, o.oturum.id) : [] });
}
