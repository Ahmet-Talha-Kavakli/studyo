"use client";

import { create } from "zustand";

/**
 * Kart çoklu-seçimi — Higgsfield birebir.
 * Kartın sol-üst kutucuğu buraya yazar; sayfa altındaki toplu işlem çubuğu buradan okur.
 * Kalıcı DEĞİL (persist yok): seçim geçici bir kullanıcı arayüzü durumudur.
 */
interface SecimState {
  secililer: string[];
  toggle: (id: string) => void;
  temizle: () => void;
  secili: (id: string) => boolean;
}

export const useSecim = create<SecimState>()((set, get) => ({
  secililer: [],
  toggle: (id) =>
    set((s) => ({
      secililer: s.secililer.includes(id)
        ? s.secililer.filter((x) => x !== id)
        : [...s.secililer, id],
    })),
  temizle: () => set({ secililer: [] }),
  secili: (id) => get().secililer.includes(id),
}));
