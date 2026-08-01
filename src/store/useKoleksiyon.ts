"use client";

import { create } from "zustand";
import { alanlariKoru } from "./gocHelper";
import { persist } from "zustand/middleware";

export interface Koleksiyon {
  id: string;
  ad: string;
  uretimIdler: string[]; // içindeki üretim id'leri
  olusturma: number;
}

interface KoleksiyonState {
  koleksiyonlar: Koleksiyon[];
  olustur: (ad: string) => string;
  sil: (id: string) => void;
  yenidenAdlandir: (id: string, ad: string) => void;
  uretimEkle: (koleksiyonId: string, uretimId: string) => void;
  uretimCikar: (koleksiyonId: string, uretimId: string) => void;
}

let sayac = 0;
function yeniId() {
  sayac += 1;
  return `kol_${sayac}_${Math.floor(performance.now())}`;
}

export const useKoleksiyon = create<KoleksiyonState>()(
  persist(
    (set) => ({
      koleksiyonlar: [],
      olustur: (ad) => {
        const id = yeniId();
        set((s) => ({ koleksiyonlar: [{ id, ad, uretimIdler: [], olusturma: Date.now() }, ...s.koleksiyonlar] }));
        return id;
      },
      sil: (id) => set((s) => ({ koleksiyonlar: s.koleksiyonlar.filter((k) => k.id !== id) })),
      yenidenAdlandir: (id, ad) =>
        set((s) => ({ koleksiyonlar: s.koleksiyonlar.map((k) => (k.id === id ? { ...k, ad } : k)) })),
      uretimEkle: (koleksiyonId, uretimId) =>
        set((s) => ({
          koleksiyonlar: s.koleksiyonlar.map((k) =>
            k.id === koleksiyonId && !k.uretimIdler.includes(uretimId)
              ? { ...k, uretimIdler: [uretimId, ...k.uretimIdler] }
              : k,
          ),
        })),
      uretimCikar: (koleksiyonId, uretimId) =>
        set((s) => ({
          koleksiyonlar: s.koleksiyonlar.map((k) =>
            k.id === koleksiyonId ? { ...k, uretimIdler: k.uretimIdler.filter((x) => x !== uretimId) } : k,
          ),
        })),
    }),
    { name: "vayra-koleksiyon", version: 1, migrate: alanlariKoru },
  ),
);
