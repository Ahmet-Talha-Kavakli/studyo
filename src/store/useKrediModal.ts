"use client";

import { create } from "zustand";

/**
 * useKrediModal — kredi/yükseltme/hız modalını açan merkezi store.
 * Avatar menüsündeki "Kredi yükle / Hız artır / Sınırsız modeller" gibi
 * aksiyonlar bu modalı ilgili sekmeyle açar.
 */
export type KrediSekme = "plan" | "kredi" | "sinirsiz" | "hiz";

interface KrediModalState {
  acik: boolean;
  sekme: KrediSekme;
  ac: (sekme?: KrediSekme) => void;
  kapat: () => void;
}

export const useKrediModal = create<KrediModalState>((set) => ({
  acik: false,
  sekme: "kredi",
  ac: (sekme = "kredi") => set({ acik: true, sekme }),
  kapat: () => set({ acik: false }),
}));
