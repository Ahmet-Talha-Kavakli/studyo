"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* Panelden düzenlenebilir model kataloğu + kredi paketleri + iade kuralları + provider ayarları.
   Seed default'u üstüne override. "Provider fiyatı değişince deploy bekleme" — buradan anlık değişir. */

export interface ModelOverride {
  kredi?: number;
  maliyetUsd?: number;
  acik?: boolean;
  tierKilit?: string; // hangi tier'a açık
  badge?: string; // "new" | "pro" | "hot"
  sira?: number;
}

export interface KrediPaket {
  id: string;
  ad: string;
  kredi: number;
  fiyatTRY: number;
  bonus: number; // %
  gorunur: boolean;
  populer: boolean;
  sira: number;
}

export interface IadeKurali {
  id: string;
  ad: string;
  aktif: boolean;
  oran: number; // %
}

const VARSAYILAN_PAKETLER: KrediPaket[] = [
  { id: "p1", ad: "Mini", kredi: 500, fiyatTRY: 149, bonus: 0, gorunur: true, populer: false, sira: 1 },
  { id: "p2", ad: "Standart", kredi: 1500, fiyatTRY: 399, bonus: 10, gorunur: true, populer: true, sira: 2 },
  { id: "p3", ad: "Pro", kredi: 5000, fiyatTRY: 1199, bonus: 20, gorunur: true, populer: false, sira: 3 },
  { id: "p4", ad: "Studio", kredi: 15000, fiyatTRY: 2999, bonus: 30, gorunur: true, populer: false, sira: 4 },
];

const VARSAYILAN_IADE: IadeKurali[] = [
  { id: "i1", ad: "Job başarısız (failed)", aktif: true, oran: 100 },
  { id: "i2", ad: "Job zaman aşımı (timeout)", aktif: true, oran: 100 },
  { id: "i3", ad: "Provider hatası (5xx)", aktif: true, oran: 100 },
  { id: "i4", ad: "Kullanıcı iptali", aktif: false, oran: 50 },
  { id: "i5", ad: "İçerik moderasyondan döndü", aktif: false, oran: 0 },
];

interface ModellerState {
  override: Record<string, ModelOverride>;
  paketler: KrediPaket[];
  iadeKurallari: IadeKurali[];

  modelGuncelle: (id: string, delta: ModelOverride) => void;
  modelOverride: (id: string) => ModelOverride;
  paketGuncelle: (id: string, delta: Partial<KrediPaket>) => void;
  iadeKuralToggle: (id: string) => void;
  iadeOranAyarla: (id: string, oran: number) => void;
}

export const useAdminModeller = create<ModellerState>()(
  persist(
    (set, get) => ({
      override: {},
      paketler: VARSAYILAN_PAKETLER,
      iadeKurallari: VARSAYILAN_IADE,

      modelGuncelle: (id, delta) => set((s) => ({ override: { ...s.override, [id]: { ...s.override[id], ...delta } } })),
      modelOverride: (id) => get().override[id] ?? {},
      paketGuncelle: (id, delta) => set((s) => ({ paketler: s.paketler.map((p) => (p.id === id ? { ...p, ...delta } : p)) })),
      iadeKuralToggle: (id) => set((s) => ({ iadeKurallari: s.iadeKurallari.map((k) => (k.id === id ? { ...k, aktif: !k.aktif } : k)) })),
      iadeOranAyarla: (id, oran) => set((s) => ({ iadeKurallari: s.iadeKurallari.map((k) => (k.id === id ? { ...k, oran } : k)) })),
    }),
    { name: "vayra-admin-modeller" },
  ),
);
