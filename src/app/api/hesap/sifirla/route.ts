import { belirtecKullan, belirtecOku, belirtecUret } from "@/lib/hesap/belirtec";
import { EPOSTA_DESENI, epostaNormal, epostadanUid, hesapGuncelle, hesapOku, olayEkle, ozet } from "@/lib/hesap/depo";
import { baglantiGonder, baglantiKoku, bildirimGonder } from "@/lib/hesap/eposta";
import { basariliGiris, cihazAdi, gelistirme, govdeOku, hata, hizHatasi, hizSiniri, istemciIp, kokenDenetle, tamam } from "@/lib/hesap/guvenlik";
import { rolYukselt } from "@/lib/hesap/hesap";
import { oturumlariKapat } from "@/lib/hesap/oturum";
import { sifreOzetle, sifrePolitikasi } from "@/lib/hesap/sifre";
import { epostaKurulu } from "@/lib/build/bulutEposta";

export const runtime = "nodejs";

const maskele = (e: string) => e.replace(/^(.)(.*)(.@)/, (_, a: string, b: string, c: string) => `${a}${"•".repeat(Math.min(6, b.length))}${c}`);

/**
 * Şifre sıfırlama.
 *  { email }               bağlantı ister. Hesap olsun olmasın aynı yanıt ("kayıtlıysa gelir"); IP başına saatte 10, e-posta başına 3.
 *                          E-posta servisi yoksa üretimde 503 (hiçbir adres için gönderilemiyor; varlık sızmaz).
 *  { belirtec, kontrol }   bağlantının hâlâ geçerli olup olmadığı (sayfa açılınca)
 *  { belirtec, yeni }      yeni şifreyi yazar; bütün oturumlar kapanır, e-posta doğrulanmış sayılır.
 */
export async function POST(req: Request) {
  const k = kokenDenetle(req);
  if (k) return k;
  const g = await govdeOku<{ email?: string; belirtec?: string; yeni?: string; kontrol?: boolean }>(req);
  if (!g) return hata("İstek okunamadı.");

  if (g.belirtec) {
    const ipBekle = hizSiniri(`sifirla-b:ip:${istemciIp(req)}`, 30, 600_000);
    if (ipBekle) return hizHatasi(ipBekle);
    if (g.kontrol) {
      const b = await belirtecOku<{ uid: string; email: string }>(g.belirtec, "sifirla");
      return b ? tamam({ gecerli: true, email: maskele(b.veri.email) }) : hata("Bu sıfırlama bağlantısının süresi dolmuş ya da daha önce kullanılmış.", 410, { kod: "gecersiz" });
    }
    const on = await belirtecOku<{ uid: string; email: string }>(g.belirtec, "sifirla");
    if (!on) return hata("Bu sıfırlama bağlantısının süresi dolmuş ya da daha önce kullanılmış.", 410, { kod: "gecersiz" });
    const p = sifrePolitikasi(g.yeni, { email: on.veri.email });
    if (p) return hata(p, 400, { alan: "yeni" });
    const v = await belirtecKullan<{ uid: string; email: string }>(g.belirtec, "sifirla");
    if (!v) return hata("Bu sıfırlama bağlantısının süresi dolmuş ya da daha önce kullanılmış.", 410, { kod: "gecersiz" });
    const h = await hesapOku(v.uid);
    if (!h || h.email !== v.email) return hata("Bu sıfırlama bağlantısı artık geçerli değil.", 410, { kod: "gecersiz" });
    const yeniOzet = await sifreOzetle(g.yeni!);
    await hesapGuncelle(h.uid, (x) => {
      x.sifre = { ozet: yeniOzet, guncelleme: Date.now() };
      x.epostaDogrulandi = true;
      rolYukselt(x);
      olayEkle(x, "sifirla", cihazAdi(req), "E-postadaki bağlantıyla", istemciIp(req));
    });
    await oturumlariKapat(h.uid, { hepsi: true });
    basariliGiris(`giris:${ozet(h.email)}`);
    bildirimGonder(h.email, "Vayra şifren sıfırlandı", "Vayra hesabının şifresi e-postana gönderilen bağlantıyla sıfırlandı ve bütün cihazlardaki oturumlar kapatıldı. Bu sen değilsen hemen bizimle iletişime geç.");
    return tamam({ email: h.email });
  }

  const email = epostaNormal(String(g.email ?? ""));
  if (!EPOSTA_DESENI.test(email)) return hata("Geçerli bir e-posta adresi gir.", 400, { alan: "email" });
  // Servis eksikliği her adres için aynı yanıtı verir (hesabın varlığı sızmaz).
  if (!gelistirme() && !epostaKurulu()) return hata("E-posta servisi bu sunucuda kurulu değil; şifre sıfırlama bağlantısı gönderilemiyor.", 503, { kod: "eposta-servisi" });
  if (!baglantiKoku(req)) return hata("Bu sunucuda VAYRA_KOKEN tanımlı olmadığı için sıfırlama bağlantısı gönderilemiyor.", 503, { kod: "eposta-servisi" });
  const ipBekle = hizSiniri(`sifirla:ip:${istemciIp(req)}`, 10, 3_600_000);
  if (ipBekle) return hizHatasi(ipBekle);
  const genel = { mesaj: "Hesap kayıtlıysa sıfırlama bağlantısı birkaç dakika içinde gelir." };
  if (hizSiniri(`sifirla:e:${ozet(email)}`, 3, 3_600_000, false)) return tamam(genel);
  const uid = await epostadanUid(email);
  const h = uid ? await hesapOku(uid) : null;
  if (!h) return tamam(genel);
  const b = await belirtecUret("sifirla", { uid: h.uid, email: h.email }, 3_600_000);
  const s = await baglantiGonder(req, "sifirla", h.email, b);
  if (!s.gonderildi && !s.gelistirmeBaglantisi) console.error("[hesap] sıfırlama e-postası gönderilemedi:", s.hata);
  return tamam({ ...genel, ...(s.gelistirmeBaglantisi ? { gelistirmeBaglantisi: s.gelistirmeBaglantisi } : {}) });
}
