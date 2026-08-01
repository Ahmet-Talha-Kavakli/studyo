"use client";

/**
 * useComposer — Sinema Stüdyosu composer durumunun TEK kaynağı.
 *
 * Neden store: Ana Sayfa ile Üretimlerim/Favorilerim/Elementlerim ayrı render
 * dallarında (erken `return`) çalışıyor. Durum `useState` ile tutulunca sayfa
 * değişince bileşen yeniden kurulup composer sıfırlanıyordu — kullanıcı ana
 * sayfada "Sinema Stüdyo 3.5" seçse bile Üretimlerim'de varsayılana dönüyordu.
 * Artık her iki sayfa da AYNI durumu okur/yazar.
 *
 * `persist` yok: oturum içinde paylaşım yeterli, yeniden yüklemede varsayılana
 * dönmesi Higgsfield davranışıyla uyumlu.
 */

import { create } from "zustand";
import type { VideoComposerDeger } from "@/components/panel/VideoComposer";
import type { SinemaSecim } from "@/components/panel/SinemaSecici";
import { modelBul } from "@/lib/videoModelSpec";
import { VARSAYILAN_SECIM } from "@/lib/sinemaSecici";

/** Bir modelin spec'inden başlangıç composer durumu üret. */
export function komposerVarsayilan(modelAd: string): VideoComposerDeger {
  const s = modelBul(modelAd);
  return {
    istem: "", model: modelAd,
    oran: s?.oran ?? "Auto", coz: s?.coz ?? "1080p", sure: s?.sure ?? 4,
    cokCekim: s?.cokCekimDeger ?? "Kapalı", mod: s?.mod ?? "Frames",
    iyilestir: s?.iyilestir ?? false, ses: s?.ses ?? true, adet: s?.adetVar ?? 2,
    bitrate: s?.bitrate ?? "Yüksek", sabitLens: false, otoAyar: true,
    sahneKontrol: s?.sahneKontrol ?? "Video", adim: s?.adim ?? 30, tohum: s?.tohum ?? "Rastgele",
    baslangic: null, bitis: null, videoRef: null, hareket: null, karakter: null, cekimler: [],
    tur: "Genel", cekimKontrol: s?.cekimKontrol ?? "Akıllı", mentionlar: [],
    kalite: s?.kalite ?? s?.coz ?? "2K", izgara: s?.izgara ?? "1x1",
    sinirsiz: false, vektor: false, renkAktarim: false,
    gorselKip: s?.gorselKip ?? "Standart", cfg: s?.cfg ?? 5,
    gKarakter: null, gStil: null,
  };
}

type ComposerDurum = {
  kip: "gorsel" | "video";
  model: string;
  deger: VideoComposerDeger;
  secim: SinemaSecim;
  /** Kısmi güncelleme (çip/prompt değişiklikleri). */
  guncelle: (y: Partial<VideoComposerDeger>) => void;
  /** Model seç → spec varsayılanlarını uygula. */
  modelSec: (ad: string) => void;
  /** Görsel/Video kipini değiştir (her kipin kendi varsayılan modeli var). */
  kipDegis: (k: "gorsel" | "video") => void;
  secimAyarla: (s: SinemaSecim) => void;
};

const BASLANGIC_MODEL = "Sinema Stüdyo 3.5";

export const useComposer = create<ComposerDurum>((set) => ({
  kip: "video",
  model: BASLANGIC_MODEL,
  deger: komposerVarsayilan(BASLANGIC_MODEL),
  secim: { ...VARSAYILAN_SECIM },

  guncelle: (y) => set((st) => ({ deger: { ...st.deger, ...y } })),

  modelSec: (ad) => set((st) => {
    const s = modelBul(ad);
    if (!s) return { model: ad, deger: { ...st.deger, model: ad } };
    return {
      model: ad,
      deger: {
        ...st.deger, model: ad,
        oran: s.oran ?? st.deger.oran, coz: s.coz ?? st.deger.coz, sure: s.sure ?? st.deger.sure,
        cokCekim: s.cokCekimDeger ?? st.deger.cokCekim, mod: s.mod ?? st.deger.mod,
        iyilestir: s.iyilestir ?? false, ses: s.ses ?? false,
        bitrate: s.bitrate ?? st.deger.bitrate, sahneKontrol: s.sahneKontrol ?? st.deger.sahneKontrol,
        adim: s.adim ?? st.deger.adim, tohum: s.tohum ?? st.deger.tohum,
        cekimKontrol: s.cekimKontrol ?? st.deger.cekimKontrol, cekimler: [],
        adet: s.adetVar ?? st.deger.adet,
        kalite: s.kalite ?? s.coz ?? st.deger.kalite,
        izgara: s.izgara ?? st.deger.izgara,
        gorselKip: s.gorselKip ?? st.deger.gorselKip,
        cfg: s.cfg ?? st.deger.cfg,
        sinirsiz: false, vektor: false, renkAktarim: false,
      },
    };
  }),

  kipDegis: (k) => set(() => {
    const ad = k === "gorsel" ? "Ruh Sinema" : BASLANGIC_MODEL;
    return { kip: k, model: ad, deger: komposerVarsayilan(ad) };
  }),

  secimAyarla: (s) => set({ secim: s }),
}));
