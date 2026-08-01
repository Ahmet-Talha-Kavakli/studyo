"use client";

import { create } from "zustand";
import { alanlariKoru } from "./gocHelper";
import { persist } from "zustand/middleware";

/** Kurulan/oluşturulan AI çalışan (Higgsfield "AI Employees" karşılığı). */
export interface Calisan {
  id: string;
  ad: string;
  rol: string;
  ozet: string;
  emoji: string;
  renk: string; // gradient sınıfı
  yetenekler: string[];
  konektorler: string[];
  ozel?: boolean; // kullanıcı tarafından oluşturuldu
  olusturma: number;
}

interface CalisanState {
  kurulu: Calisan[];
  kur: (c: Omit<Calisan, "olusturma">) => boolean; // false → zaten kurulu
  kaldir: (id: string) => void;
  olustur: (c: Omit<Calisan, "id" | "olusturma" | "ozel">) => void;
}

let sayac = 0;

export const useCalisan = create<CalisanState>()(
  persist(
    (set, get) => ({
      kurulu: [],
      kur: (c) => {
        if (get().kurulu.some((x) => x.id === c.id)) return false;
        set((s) => ({ kurulu: [...s.kurulu, { ...c, olusturma: Date.now() }] }));
        return true;
      },
      kaldir: (id) => set((s) => ({ kurulu: s.kurulu.filter((x) => x.id !== id) })),
      olustur: (c) => {
        sayac += 1;
        const id = `ozel-${Date.now()}-${sayac}`;
        set((s) => ({ kurulu: [...s.kurulu, { ...c, id, ozel: true, olusturma: Date.now() }] }));
      },
    }),
    { name: "vayra-calisan", version: 1, migrate: alanlariKoru },
  ),
);
