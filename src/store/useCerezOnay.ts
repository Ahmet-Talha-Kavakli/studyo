"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Çerez onayı — GDPR / KVKK md. 5/1 (açık rıza) ve ePrivacy uyarınca.
 * Zorunlu kategori her zaman açıktır; diğerleri varsayılan kapalıdır ve yalnız
 * kullanıcı izin verirse etkinleşir. Analitik veya pazarlama betiği eklenirse
 * `izinVar("analitik")` kontrolüyle yüklenmelidir.
 * Karar 12 ayda bir yeniden sorulur.
 */
export type CerezKategori = "islevsel" | "analitik" | "pazarlama";
export type CerezKarar = Record<CerezKategori, boolean>;

const GECERLILIK = 365 * 86_400_000;
export const CEREZ_SURUM = 1;

interface CerezState {
  karar: CerezKarar | null;
  tarih: number | null;
  surum: number;
  panelAcik: boolean;
  kaydet: (k: CerezKarar) => void;
  hepsiniKabul: () => void;
  zorunlulariKabul: () => void;
  panelAc: () => void;
  panelKapat: () => void;
}

export const useCerezOnay = create<CerezState>()(
  persist(
    (set) => ({
      karar: null, tarih: null, surum: CEREZ_SURUM, panelAcik: false,
      kaydet: (karar) => set({ karar, tarih: Date.now(), surum: CEREZ_SURUM, panelAcik: false }),
      hepsiniKabul: () => set({ karar: { islevsel: true, analitik: true, pazarlama: true }, tarih: Date.now(), surum: CEREZ_SURUM, panelAcik: false }),
      zorunlulariKabul: () => set({ karar: { islevsel: false, analitik: false, pazarlama: false }, tarih: Date.now(), surum: CEREZ_SURUM, panelAcik: false }),
      panelAc: () => set({ panelAcik: true }),
      panelKapat: () => set({ panelAcik: false }),
    }),
    { name: "vayra-cerez", partialize: (s) => ({ karar: s.karar, tarih: s.tarih, surum: s.surum }) },
  ),
);

/** Kararın verilip verilmediği (süresi dolmuş ya da eski sürüm karar yok sayılır). */
export const kararGecerli = (s: Pick<CerezState, "karar" | "tarih" | "surum">) =>
  !!s.karar && !!s.tarih && s.surum === CEREZ_SURUM && Date.now() - s.tarih < GECERLILIK;

export const izinVar = (k: CerezKategori) => {
  const s = useCerezOnay.getState();
  return kararGecerli(s) && !!s.karar?.[k];
};
