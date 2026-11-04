"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { alanlariKoru } from "./gocHelper";

/**
 * Plan dışı satın alınan ekler: model bazında sınırsız erişimler, hız seviyesi
 * ve ek eşzamanlı üretim. /panel/kredi sekmeleri ve bakiye kartı buradan okur.
 * Demo: gerçek ödeme bağlanınca bu durum sunucudan gelecek.
 */
export type AktifSinirsiz = { model: string; kalite: string; bitis: number };
export type HizSeviye = "standart" | "oncelikli" | "turbo";

interface EklerState {
  sinirsizlar: AktifSinirsiz[];
  hiz: HizSeviye;
  ekEsZamanli: number;
  sinirsizEkle: (model: string, kalite: string, gun: number) => void;
  hizAyarla: (hiz: HizSeviye, ekEsZamanli: number) => void;
}

const GUN = 86_400_000;

export const useEkler = create<EklerState>()(
  persist(
    (set) => ({
      sinirsizlar: [],
      hiz: "standart",
      ekEsZamanli: 0,
      // Aynı model yeniden alınırsa süre mevcut bitişin üzerine eklenir.
      sinirsizEkle: (model, kalite, gun) =>
        set((s) => {
          const simdi = Date.now();
          const mevcut = s.sinirsizlar.find((x) => x.model === model && x.bitis > simdi);
          const bitis = (mevcut ? mevcut.bitis : simdi) + gun * GUN;
          return { sinirsizlar: [...s.sinirsizlar.filter((x) => x.model !== model), { model, kalite, bitis }] };
        }),
      hizAyarla: (hiz, ekEsZamanli) => set({ hiz, ekEsZamanli }),
    }),
    { name: "vayra-ekler", version: 1, migrate: alanlariKoru },
  ),
);

/** Süresi dolmamış sınırsız erişimler. */
export function aktifSinirsizlar(liste: AktifSinirsiz[], simdi = Date.now()) {
  return liste.filter((x) => x.bitis > simdi);
}
