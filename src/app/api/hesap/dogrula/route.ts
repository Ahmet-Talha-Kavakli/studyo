import { belirtecKullan, belirtecOku, belirtecUret } from "@/lib/hesap/belirtec";
import { epostaIndeksSil, epostaIndeksYaz, epostaKilidi, epostadanUid, hesapGuncelle, hesapOku, kilitle, olayEkle } from "@/lib/hesap/depo";
import { baglantiGonder, bildirimGonder } from "@/lib/hesap/eposta";
import { cihazAdi, govdeOku, hata, hizHatasi, hizSiniri, istemciIp, kokenDenetle, tamam } from "@/lib/hesap/guvenlik";
import { rolYukselt } from "@/lib/hesap/hesap";
import { oturumGerekli } from "@/lib/hesap/yetki";

export const runtime = "nodejs";

const GECERSIZ = "Bu doğrulama bağlantısının süresi dolmuş ya da daha önce kullanılmış.";

/**
 *  { belirtec }             e-posta doğrulama ya da e-posta değişikliği bağlantısını uygular (oturum gerekmez)
 *  { belirtec, kontrol }    bağlantının türü ve geçerliliği (değişiklik onay ekranı için)
 *  { islem: "gonder" }      oturumdaki hesaba doğrulama bağlantısını yeniden gönderir (saatte 3)
 */
export async function POST(req: Request) {
  const k = kokenDenetle(req);
  if (k) return k;
  const g = await govdeOku<{ belirtec?: string; islem?: string; kontrol?: boolean }>(req);
  if (!g) return hata("İstek okunamadı.");

  if (g.islem === "gonder") {
    const o = await oturumGerekli(req);
    if (o instanceof Response) return o;
    if (o.hesap.epostaDogrulandi) return tamam({ zatenDogrulandi: true });
    const bekle = hizSiniri(`dogrula-gonder:${o.hesap.uid}`, 3, 3_600_000, false);
    if (bekle) return hizHatasi(bekle);
    const b = await belirtecUret("dogrula", { uid: o.hesap.uid, email: o.hesap.email }, 24 * 3_600_000);
    const s = await baglantiGonder(req, "dogrula", o.hesap.email, b);
    if (!s.gonderildi && !s.gelistirmeBaglantisi) return hata(s.hata ?? "E-posta gönderilemedi.", 503, { kod: "eposta-servisi" });
    return tamam({ dogrulama: s });
  }

  const ipBekle = hizSiniri(`dogrula:ip:${istemciIp(req)}`, 30, 600_000);
  if (ipBekle) return hizHatasi(ipBekle);
  const cihaz = cihazAdi(req), ip = istemciIp(req);

  if (g.kontrol) {
    const d = await belirtecOku<{ email: string }>(g.belirtec, "dogrula");
    if (d) return tamam({ tur: "dogrula", email: d.veri.email });
    const e = await belirtecOku<{ yeni: string }>(g.belirtec, "eposta");
    if (e) return tamam({ tur: "eposta", email: e.veri.yeni });
    return hata(GECERSIZ, 410, { kod: "gecersiz" });
  }

  const d = await belirtecKullan<{ uid: string; email: string }>(g.belirtec, "dogrula");
  if (d) {
    const r = await hesapGuncelle(d.uid, (h) => {
      if (h.email !== d.email) return false;
      if (!h.epostaDogrulandi) { h.epostaDogrulandi = true; olayEkle(h, "eposta-dogrula", cihaz, h.email, ip); }
      rolYukselt(h);
      return true;
    });
    if (!r?.sonuc) return hata("Bu bağlantı artık bu hesabın e-postasına ait değil.", 410, { kod: "gecersiz" });
    return tamam({ tur: "dogrula", email: d.email });
  }

  const e = await belirtecKullan<{ uid: string; eski: string; yeni: string }>(g.belirtec, "eposta");
  if (!e) return hata(GECERSIZ, 410, { kod: "gecersiz" });
  const h0 = await hesapOku(e.uid);
  if (!h0 || h0.email !== e.eski || h0.bekleyenEposta !== e.yeni) return hata("Bu değişiklik isteği artık geçerli değil.", 410, { kod: "gecersiz" });
  // İki adresin dizini birlikte değişir: önce eski, sonra yeni adresin kilidi (sıra her zaman aynı, kilitlenme olmaz).
  const [ilk, ikinci] = [e.eski, e.yeni].sort();
  const sonuc = await kilitle(epostaKilidi(ilk), () => kilitle(epostaKilidi(ikinci), async () => {
    const sahibi = await epostadanUid(e.yeni);
    if (sahibi && sahibi !== e.uid) return "alinmis" as const;
    const r = await hesapGuncelle(e.uid, (h) => {
      h.email = e.yeni; h.epostaDogrulandi = true; delete h.bekleyenEposta;
      olayEkle(h, "eposta", cihaz, `Eski adres: ${e.eski}`, ip);
      rolYukselt(h);
    });
    if (!r) return "yok" as const;
    await epostaIndeksYaz(e.yeni, e.uid);
    if ((await epostadanUid(e.eski)) === e.uid) await epostaIndeksSil(e.eski);
    return "tamam" as const;
  }));
  if (sonuc === "alinmis") return hata("Bu e-posta bu arada başka bir hesapta kullanılmaya başlandı.", 409);
  if (sonuc === "yok") return hata("Hesap bulunamadı.", 404);
  bildirimGonder(e.eski, "Vayra e-posta adresin değişti", `Vayra hesabının e-posta adresi ${e.yeni} olarak değiştirildi. Bu sen değilsen hemen bizimle iletişime geç.`);
  return tamam({ tur: "eposta", email: e.yeni });
}
