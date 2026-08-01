"use client";

import { create } from "zustand";

/* Admin AI sohbet durumu (persist YOK — oturumla sınırlı). */

export interface AiAdim { tool: string; girdi: unknown; sonuc?: unknown }
export interface AiMesaj {
  id: string;
  rol: "kullanici" | "asistan";
  metin: string;
  adimlar?: AiAdim[];
  veri?: unknown;
  yukleniyor?: boolean;
}

interface AiState {
  mesajlar: AiMesaj[];
  calisiyor: boolean;
  ekle: (m: Omit<AiMesaj, "id">) => string;
  guncelle: (id: string, delta: Partial<AiMesaj>) => void;
  setCalisiyor: (v: boolean) => void;
  temizle: () => void;
}

export const useAdminAi = create<AiState>((set) => ({
  mesajlar: [],
  calisiyor: false,
  ekle: (m) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ mesajlar: [...s.mesajlar, { ...m, id }] }));
    return id;
  },
  guncelle: (id, delta) => set((s) => ({ mesajlar: s.mesajlar.map((x) => (x.id === id ? { ...x, ...delta } : x)) })),
  setCalisiyor: (v) => set({ calisiyor: v }),
  temizle: () => set({ mesajlar: [] }),
}));
