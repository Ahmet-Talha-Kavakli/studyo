"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Kitaplık tercihleri — görünüm, yoğunluk ve akıllı klasörler (kaydedilmiş filtreler).
 * Akıllı klasör sabit bir liste değil, bir filtre kombinasyonudur: yeni üretimler
 * koşula uyuyorsa kendiliğinden içine düşer.
 */
export type Kapsam = string; // "tumu" | "favori" | "yukleme" | "cop" | "tur:<tur>" | "arac:<arac>" | "proje:<id>" | "akilli:<id>"
export type Zaman = "tumu" | "bugun" | "hafta" | "ay" | "yil";
export type Siralama = "yeni" | "eski" | "ad" | "kredi";

export interface Suzgec {
  q: string;
  modeller: string[];
  oranlar: string[];
  etiketler: string[];
  zaman: Zaman;
  durum: "tumu" | "tamam" | "hata";
}
export const BOS_SUZGEC: Suzgec = { q: "", modeller: [], oranlar: [], etiketler: [], zaman: "tumu", durum: "tumu" };

export interface AkilliKlasor { id: string; ad: string; kapsam: Kapsam; suzgec: Suzgec; tarih: number }

interface KitaplikState {
  gorunum: "izgara" | "liste";
  yogunluk: number; // kart genişliği (px)
  siralama: Siralama;
  akilli: AkilliKlasor[];
  araclarAcik: boolean;
  setGorunum: (g: "izgara" | "liste") => void;
  setYogunluk: (n: number) => void;
  setSiralama: (s: Siralama) => void;
  akilliEkle: (ad: string, kapsam: Kapsam, suzgec: Suzgec) => string;
  akilliSil: (id: string) => void;
  akilliYenidenAdlandir: (id: string, ad: string) => void;
  setAraclarAcik: (v: boolean) => void;
}

export const useKitaplik = create<KitaplikState>()(
  persist(
    (set) => ({
      gorunum: "izgara",
      yogunluk: 200,
      siralama: "yeni",
      akilli: [],
      araclarAcik: false,
      setGorunum: (gorunum) => set({ gorunum }),
      setYogunluk: (yogunluk) => set({ yogunluk }),
      setSiralama: (siralama) => set({ siralama }),
      akilliEkle: (ad, kapsam, suzgec) => {
        const id = `ak_${Date.now().toString(36)}`;
        set((s) => ({ akilli: [...s.akilli, { id, ad, kapsam, suzgec, tarih: Date.now() }] }));
        return id;
      },
      akilliSil: (id) => set((s) => ({ akilli: s.akilli.filter((a) => a.id !== id) })),
      akilliYenidenAdlandir: (id, ad) => set((s) => ({ akilli: s.akilli.map((a) => (a.id === id ? { ...a, ad } : a)) })),
      setAraclarAcik: (araclarAcik) => set({ araclarAcik }),
    }),
    { name: "vayra-kitaplik", version: 1 },
  ),
);
