"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CizimNesne, CizimRol, CizimArac, Mod, Kamera } from "@/lib/cizimMotor";

/**
 * useCizim — Çizim Stüdyosu taslağı (kalıcı): mod, taban görsel, vektör çizimler, istem ve ayarlar.
 * Geri al / yinele oturumluk tutulur.
 */

export type Sadakat = "siki" | "dengeli" | "serbest";

export interface CizimAyar {
  videoModel: string;
  gorselModel: string;
  sure: number;
  /** Kamera "ozel" iken tarif. */
  kameraOzel?: string;
  /** Video: ses üretimi (destekleyen modelde). */
  ses?: boolean;
  oran: "16:9" | "9:16" | "1:1" | "4:3" | "3:4";  // boş tuval / eskiz için
  kamera: Kamera;
  stil: string;
  sadakat: Sadakat;
  cizimliKare: boolean;   // video: çizimli kareyi mi, temiz kareyi mi gönder
}

interface CizimState {
  mod: Mod;
  taban: string | null;               // taban görsel adresi
  tabanAd?: string;
  boyut: { W: number; H: number };    // artboard
  nesneler: CizimNesne[];
  istem: string;
  ayar: CizimAyar;
  arac: CizimArac;
  rol: CizimRol;
  kalinlik: number;
  secili: string | null;
  geri: CizimNesne[][];
  ileri: CizimNesne[][];

  modAyarla: (m: Mod) => void;
  tabanAyarla: (url: string | null, boyut?: { W: number; H: number }, ad?: string) => void;
  boyutAyarla: (b: { W: number; H: number }) => void;
  istemAyarla: (s: string) => void;
  ayarGuncelle: (p: Partial<CizimAyar>) => void;
  aracSec: (a: CizimArac) => void;
  rolSec: (r: CizimRol) => void;
  kalinlikAyarla: (k: number) => void;
  sec: (id: string | null) => void;

  /** Değişiklikten önce çağrılır (tek geri al adımı). */
  anlik: () => void;
  nesneleriYaz: (l: CizimNesne[], gecmise?: boolean) => void;
  nesneGuncelle: (id: string, p: Partial<CizimNesne>) => void;
  nesneSil: (id: string) => void;
  temizle: () => void;
  geriAl: () => void;
  yinele: () => void;
}

export const useCizim = create<CizimState>()(
  persist(
    (set, get) => ({
      mod: "video",
      taban: null,
      boyut: { W: 1600, H: 900 },
      nesneler: [],
      istem: "",
      ayar: { videoModel: "Kling 3.0", gorselModel: "Nano Banana Pro", sure: 5, oran: "16:9", kamera: "sabit", stil: "Fotoğraf", sadakat: "dengeli", cizimliKare: true },
      arac: "ok",
      rol: "hareket",
      kalinlik: 0.008,
      secili: null,
      geri: [],
      ileri: [],

      modAyarla: (m) => set((s) => ({
        mod: m,
        // Mod değişince araç/rol akıllı varsayılana döner
        ...(m === "eskiz" ? { arac: "kalem" as const, rol: "not" as const } : m === "duzenle" ? { arac: "kare" as const, rol: s.rol === "hareket" ? ("degistir" as const) : s.rol } : { arac: "ok" as const, rol: "hareket" as const }),
      })),
      tabanAyarla: (url, boyut, ad) => set((s) => ({ taban: url, tabanAd: ad, ...(boyut ? { boyut } : {}), geri: [...s.geri.slice(-49), s.nesneler], ileri: [] })),
      boyutAyarla: (b) => set({ boyut: b }),
      istemAyarla: (istem) => set({ istem }),
      ayarGuncelle: (p) => set((s) => ({ ayar: { ...s.ayar, ...p } })),
      aracSec: (arac) => set({ arac, ...(arac !== "sec" ? { secili: null } : {}) }),
      rolSec: (rol) => {
        set({ rol });
        const { secili, nesneler } = get();
        if (secili && nesneler.some((n) => n.id === secili)) get().nesneGuncelle(secili, { rol });
      },
      kalinlikAyarla: (k) => set({ kalinlik: Math.max(0.003, Math.min(0.03, k)) }),
      sec: (id) => set({ secili: id }),

      anlik: () => set((s) => ({ geri: [...s.geri.slice(-49), s.nesneler], ileri: [] })),
      nesneleriYaz: (l, gecmise = false) => set((s) => ({ nesneler: l, ...(gecmise ? { geri: [...s.geri.slice(-49), s.nesneler], ileri: [] } : {}) })),
      nesneGuncelle: (id, p) => set((s) => ({ nesneler: s.nesneler.map((n) => (n.id === id ? { ...n, ...p } : n)) })),
      nesneSil: (id) => set((s) => ({ geri: [...s.geri.slice(-49), s.nesneler], ileri: [], nesneler: s.nesneler.filter((n) => n.id !== id), secili: s.secili === id ? null : s.secili })),
      temizle: () => set((s) => ({ geri: [...s.geri.slice(-49), s.nesneler], ileri: [], nesneler: [], secili: null })),
      geriAl: () => set((s) => (s.geri.length ? { nesneler: s.geri[s.geri.length - 1], geri: s.geri.slice(0, -1), ileri: [...s.ileri, s.nesneler], secili: null } : {})),
      yinele: () => set((s) => (s.ileri.length ? { nesneler: s.ileri[s.ileri.length - 1], ileri: s.ileri.slice(0, -1), geri: [...s.geri, s.nesneler], secili: null } : {})),
    }),
    {
      name: "vayra-cizim",
      version: 1,
      partialize: (s) => ({ mod: s.mod, taban: s.taban?.startsWith("data:") ? null : s.taban, tabanAd: s.tabanAd, boyut: s.boyut, nesneler: s.nesneler, istem: s.istem, ayar: s.ayar, rol: s.rol, kalinlik: s.kalinlik }) as unknown as CizimState,
    },
  ),
);
