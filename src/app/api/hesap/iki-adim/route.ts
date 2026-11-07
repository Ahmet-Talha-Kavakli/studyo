import { hesapGuncelle, olayEkle } from "@/lib/hesap/depo";
import { cihazAdi, govdeOku, hata, hataliDeneme, hizHatasi, hizSiniri, istemciIp, kilitHatasi, kilitKalan, tamam } from "@/lib/hesap/guvenlik";
import { hesapOzeti } from "@/lib/hesap/hesap";
import { ikiAdimKoduKullan, sirCoz, sirSifrele, yedekSeti } from "@/lib/hesap/ikiAdim";
import { otpauthAdresi, totpDogrula, totpSirUret } from "@/lib/hesap/totp";
import { oturumGerekli } from "@/lib/hesap/yetki";

export const runtime = "nodejs";

/**
 * İki adımlı doğrulama ayarları (oturum gerekli):
 *  kur           yeni sır üretir (15 dk geçerli kurulum), QR için otpauth adresi döner
 *  ac            kurulum sırrıyla üretilen kodu doğrular, açar; 10 yedek kodu bir kez gösterir
 *  kapat         uygulama kodu ya da yedek kodla kapatır
 *  yedek-yenile  uygulama koduyla yeni yedek kodlar üretir (eskilerin tamamı geçersiz)
 * Kod denemeleri hesap başına kilitlidir (5 hatada 1 dk, artarak).
 */
export async function POST(req: Request) {
  const o = await oturumGerekli(req);
  if (o instanceof Response) return o;
  const g = await govdeOku<{ islem?: string; kod?: string }>(req);
  const islem = g?.islem;
  const uid = o.hesap.uid, cihaz = cihazAdi(req), ip = istemciIp(req);
  const bekle = hizSiniri(`iki-ayar:${uid}`, 20, 600_000, false);
  if (bekle) return hizHatasi(bekle);
  const kilit = kilitKalan(`iki:${uid}`);
  if (islem !== "kur" && kilit) return kilitHatasi(kilit);
  const ozetle = (h: Parameters<typeof hesapOzeti>[0]) => hesapOzeti(h, o.oturum.id);

  if (islem === "kur") {
    if (o.hesap.ikiAdim) return hata("İki adımlı doğrulama zaten açık.", 409);
    const sir = totpSirUret();
    await hesapGuncelle(uid, (h) => { h.ikiAdimKurulum = { sir: sirSifrele(sir), bitis: Date.now() + 15 * 60_000 }; });
    return tamam({ sir, otpauth: otpauthAdresi(o.hesap.email, sir) });
  }

  if (islem === "ac") {
    const r = await hesapGuncelle(uid, (h) => {
      if (h.ikiAdim) return { durum: "acik" } as const;
      const k = h.ikiAdimKurulum;
      const sir = k && k.bitis > Date.now() ? sirCoz(k.sir) : null;
      if (!sir) return { durum: "sure" } as const;
      const adim = totpDogrula(sir, String(g?.kod ?? ""), 0);
      if (adim === null) return { durum: "hatali" } as const;
      const y = yedekSeti();
      h.ikiAdim = { sir: k!.sir, acilis: Date.now(), sonAdim: adim, yedekler: y.kayit };
      delete h.ikiAdimKurulum;
      olayEkle(h, "2fa-ac", cihaz, undefined, ip);
      return { durum: "tamam", kodlar: y.kodlar } as const;
    });
    const s = r?.sonuc;
    if (!s || s.durum === "sure") return hata("Kurulumun süresi doldu. Yeniden başlat.", 410, { kod: "sure" });
    if (s.durum === "acik") return hata("İki adımlı doğrulama zaten açık.", 409);
    if (s.durum === "hatali") { const yk = hataliDeneme(`iki:${uid}`); if (yk) return kilitHatasi(yk); return hata("Kod eşleşmedi. Telefonunun saatinin otomatik ayarlı olduğundan emin ol.", 400, { alan: "kod" }); }
    return tamam({ yedekKodlar: s.kodlar, hesap: ozetle(r!.hesap) });
  }

  if (islem === "kapat" || islem === "yedek-yenile") {
    if (!o.hesap.ikiAdim) return hata("İki adımlı doğrulama kapalı.", 409);
    if (islem === "yedek-yenile" && /[a-z]/i.test(String(g?.kod ?? ""))) return hata("Yedek kodları yenilemek için doğrulama uygulamandaki kodu gir.", 400, { alan: "kod" });
    const sonuc = await ikiAdimKoduKullan(uid, g?.kod, { cihaz, ip });
    if (sonuc !== "tamam") { const yk = hataliDeneme(`iki:${uid}`); if (yk) return kilitHatasi(yk); return hata("Kod hatalı ya da süresi geçti.", 400, { alan: "kod" }); }
    if (islem === "kapat") {
      const r = await hesapGuncelle(uid, (h) => { delete h.ikiAdim; delete h.ikiAdimKurulum; olayEkle(h, "2fa-kapat", cihaz, undefined, ip); });
      return tamam({ hesap: r ? ozetle(r.hesap) : null });
    }
    const y = yedekSeti();
    const r = await hesapGuncelle(uid, (h) => { if (h.ikiAdim) h.ikiAdim.yedekler = y.kayit; olayEkle(h, "yedek-yenile", cihaz, undefined, ip); });
    return tamam({ yedekKodlar: y.kodlar, hesap: r ? ozetle(r.hesap) : null });
  }

  return hata("İşlem tanınmadı.");
}
