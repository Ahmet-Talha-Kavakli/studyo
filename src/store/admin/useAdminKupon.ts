"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* Kupon/promo kod yönetimi — persist "vayra-admin-kupon". Kalıcı oluşturma/silme. */

export interface Kupon {
  id: string;
  kod: string;
  tur: "yuzde" | "sabit" | "bonus_kredi" | "trial_uzatma";
  deger: number;
  kullanimLimit: number;
  kisiBasiLimit: number;
  kullanildi: number;
  baslangic: number;
  bitis: number;
  planlar: string;
  yeniKullanici: boolean;
  aktif: boolean;
  uretilenGelir: number;
}

const VARSAYILAN: Kupon[] = [
  { id: "k1", kod: "HOSGELDIN25", tur: "yuzde", deger: 25, kullanimLimit: 1000, kisiBasiLimit: 1, kullanildi: 412, baslangic: Date.UTC(2026, 6, 1), bitis: Date.UTC(2026, 8, 1), planlar: "Tümü", yeniKullanici: true, aktif: true, uretilenGelir: 84000 },
  { id: "k2", kod: "BONUS500", tur: "bonus_kredi", deger: 500, kullanimLimit: 500, kisiBasiLimit: 1, kullanildi: 238, baslangic: Date.UTC(2026, 6, 10), bitis: Date.UTC(2026, 7, 10), planlar: "Artı+", yeniKullanici: false, aktif: true, uretilenGelir: 42000 },
  { id: "k3", kod: "YAZINDIRIM", tur: "yuzde", deger: 40, kullanimLimit: 2000, kisiBasiLimit: 1, kullanildi: 1840, baslangic: Date.UTC(2026, 5, 1), bitis: Date.UTC(2026, 6, 15), planlar: "Ultra", yeniKullanici: false, aktif: false, uretilenGelir: 210000 },
];

interface KuponState {
  kuponlar: Kupon[];
  ekle: (k: Omit<Kupon, "id" | "kullanildi" | "uretilenGelir">) => void;
  toggle: (id: string) => void;
  sil: (id: string) => void;
}

export const useAdminKupon = create<KuponState>()(
  persist(
    (set) => ({
      kuponlar: VARSAYILAN,
      ekle: (k) => set((s) => ({ kuponlar: [{ ...k, id: Math.random().toString(36).slice(2), kullanildi: 0, uretilenGelir: 0 }, ...s.kuponlar] })),
      toggle: (id) => set((s) => ({ kuponlar: s.kuponlar.map((x) => (x.id === id ? { ...x, aktif: !x.aktif } : x)) })),
      sil: (id) => set((s) => ({ kuponlar: s.kuponlar.filter((x) => x.id !== id) })),
    }),
    { name: "vayra-admin-kupon" },
  ),
);
