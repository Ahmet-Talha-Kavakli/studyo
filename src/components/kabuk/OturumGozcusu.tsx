"use client";

import { useEffect } from "react";
import { useAuth } from "@/store/useAuth";
import { buOturum, oturumBaslat, oturumBitir, useHesap } from "@/store/useHesap";

/**
 * Bu cihazın oturumunu canlı tutar: giriş yapılmışsa oturum kaydı olduğundan emin olur,
 * dakikada bir "son görülme"yi günceller, çıkışta oturumu kapatır. Ayarlar › Güvenlik'teki
 * oturum listesi bu kayıtlardan gelir.
 */
export function OturumGozcusu() {
  useEffect(() => {
    const tazele = () => {
      const k = useAuth.getState().kullanici;
      if (!k) return;
      const s = buOturum();
      const h = useHesap.getState().getir(k.email);
      // Planlanan faturalama dönemi değişikliği yenileme anında devreye girer
      const ab = h.abonelik;
      if (ab.sonrakiDonem && ab.sonrakiDonemTarihi && Date.now() >= ab.sonrakiDonemTarihi) {
        useHesap.getState().guncelle(k.email, (x) => ({ ...x, abonelik: { ...x.abonelik, donem: ab.sonrakiDonem!, baslangic: ab.sonrakiDonemTarihi!, sonrakiDonem: undefined, sonrakiDonemTarihi: undefined } }));
      }
      if (!s || !h.oturumlar.some((o) => o.id === s)) { oturumBaslat(k.email, "Kayıtlı oturum"); return; }
      useHesap.getState().guncelle(k.email, (x) => ({ ...x, oturumlar: x.oturumlar.map((o) => (o.id === s ? { ...o, sonGorulme: Date.now() } : o)) }));
    };
    // persist hidrasyonu bitince ilk kontrol
    const ilk = setTimeout(tazele, 400);
    const aralik = setInterval(() => { if (document.visibilityState === "visible") tazele(); }, 60_000);
    let onceki = useAuth.getState().kullanici?.email ?? null;
    const birak = useAuth.subscribe((st) => {
      const simdi = st.kullanici?.email ?? null;
      // Hesap silindiyse kayıt yeniden oluşturulmasın
      if (onceki && !simdi && useHesap.getState().hesaplar[onceki.toLowerCase()]) oturumBitir(onceki);
      onceki = simdi;
    });
    return () => { clearTimeout(ilk); clearInterval(aralik); birak(); };
  }, []);
  return null;
}
