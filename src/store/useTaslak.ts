"use client";

import { create } from "zustand";
import { alanlariKoru } from "./gocHelper";
import { persist } from "zustand/middleware";
import type { ModelTur } from "@/lib/catalog";

export interface Taslak {
  id: string;
  prompt: string;
  tur: ModelTur;
  model?: string;
  arac?: string; // hangi stüdyo
  olusturma: number;
}

interface TaslakState {
  taslaklar: Taslak[];
  kaydet: (t: Omit<Taslak, "id" | "olusturma">) => string;
  sil: (id: string) => void;
  temizle: () => void;
}

let sayac = 0;
function yeniId() {
  sayac += 1;
  return `t_${sayac}_${Math.floor(performance.now())}`;
}

export const useTaslak = create<TaslakState>()(
  persist(
    (set) => ({
      taslaklar: [],
      kaydet: (t) => {
        const id = yeniId();
        set((s) => ({ taslaklar: [{ ...t, id, olusturma: Date.now() }, ...s.taslaklar].slice(0, 30) }));
        return id;
      },
      sil: (id) => set((s) => ({ taslaklar: s.taslaklar.filter((x) => x.id !== id) })),
      temizle: () => set({ taslaklar: [] }),
    }),
    { name: "vayra-taslak", version: 1, migrate: alanlariKoru },
  ),
);
