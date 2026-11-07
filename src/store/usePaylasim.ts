"use client";

import { create } from "zustand";
import { alanlariKoru } from "./gocHelper";
import { persist } from "zustand/middleware";

/**
 * usePaylasim — Topluluk paylaşım & büyüme sistemi (M20).
 *
 * Kullanıcılar kendi preset'lerini ve uygulama akışlarını toplulukla paylaşır.
 * Paylaşılan içerik "Topluluk" sekmesinde görünür; kullanım/görüntülenme
 * topladıkça sahibi Para Kazan'da kredi kazanır (view-milestone mantığı).
 *
 * Kurgusal topluluk paylaşımları (deterministik) + kullanıcının kendi
 * paylaşımları birlikte listelenir.
 */

export type PaylasimTur = "preset" | "uygulama";

export interface Paylasim {
  id: string;
  tur: PaylasimTur;
  ad: string;
  aciklama: string;
  tohum: string;         // önizleme
  kategori: string;      // stok görsel kategorisi
  yazar: string;         // @kullanıcı
  benimMi: boolean;
  kullanim: number;      // kaç kez kullanıldı (kurgusal taban)
  begeni: number;
  olusturma: number;
  // kullanıcının kendi paylaşımı için payload (yeniden üretim için)
  prompt?: string;
  model?: string;
  // m26: preset pazarı ekonomisi
  minFiyat?: number;     // modele + komisyona göre hesaplanan taban fiyat (kredi)
  ekstraFiyat?: number;  // yayıncının taban üstüne eklediği fiyat (kredi)
  kazanc?: number;       // yayıncıya biriken bakiye (ekstranın yarısı × kullanım)
  /** Gerçek kapak: yayıncının kitaplığındaki üretim çıktısı. */
  gorsel?: string;
  /** Kaynak üretim kimliği (kitaplık). */
  uretimId?: string;
}

/** m26: Bir preset modeline göre minimum fiyat (taban maliyet + %30 platform komisyonu). */
export function presetMinFiyat(model?: string): number {
  const tabanMaliyet: Record<string, number> = {
    "Kling 3.0": 12, "Ruh Sinema": 10, "Ruh 2.0": 8, "Nano Banana Pro": 9,
    "Seedance 2.0": 14, "Veo 3.1": 13, "Sora 2": 16,
  };
  const taban = tabanMaliyet[model ?? ""] ?? 8;
  return Math.ceil(taban * 1.3); // %30 komisyon
}

// Topluluk paylaşımı sunucuda yok: uydurma kullanıcı ve sayı gösterilmez.
const TOPLULUK_TOHUM: Omit<Paylasim, "id" | "benimMi" | "olusturma">[] = [];

interface PaylasimState {
  benimPaylasimlar: Paylasim[];
  gizlenen: string[]; // kurgusal olanlardan gizlenenler
  paylas: (p: Omit<Paylasim, "id" | "benimMi" | "olusturma" | "kullanim" | "begeni" | "yazar"> & { yazar: string }) => string;
  paylasimKaldir: (id: string) => void;
  begeniToggle: (id: string) => void;
  begenilenler: string[];
  kullanildi: (id: string) => void; // birinin paylaşımını kullanınca
}

let sayac = 0;
const yid = () => { sayac += 1; return `pl_${sayac}_${Math.floor(performance.now())}`; };

export const usePaylasim = create<PaylasimState>()(
  persist(
    (set) => ({
      benimPaylasimlar: [],
      gizlenen: [],
      begenilenler: [],
      paylas: (p) => {
        const id = yid();
        const yeni: Paylasim = { ...p, id, benimMi: true, kullanim: 0, begeni: 0, olusturma: Date.now() };
        set((s) => ({ benimPaylasimlar: [yeni, ...s.benimPaylasimlar] }));
        return id;
      },
      paylasimKaldir: (id) => set((s) => ({ benimPaylasimlar: s.benimPaylasimlar.filter((x) => x.id !== id) })),
      begeniToggle: (id) =>
        set((s) => ({ begenilenler: s.begenilenler.includes(id) ? s.begenilenler.filter((x) => x !== id) : [...s.begenilenler, id] })),
      kullanildi: (id) =>
        set((s) => ({ benimPaylasimlar: s.benimPaylasimlar.map((x) => (x.id === id ? { ...x, kullanim: x.kullanim + 1, kazanc: (x.kazanc ?? 0) + Math.floor((x.ekstraFiyat ?? 0) / 2) } : x)) })),
    }),
    { name: "vayra-paylasim", version: 1, migrate: alanlariKoru },
  ),
);

/** Kullanıcının paylaşımları (topluluk kaydı olmadığı için kurgusal paylaşım eklenmez). */
export function toplulukPaylasimlar(benimPaylasimlar: Paylasim[], gizlenen: string[], begenilenler: string[]): Paylasim[] {
  const kurgusal: Paylasim[] = TOPLULUK_TOHUM.map((p, i) => ({
    ...p,
    id: `topluluk_${i}`,
    benimMi: false,
    olusturma: 0,
    begeni: p.begeni + (begenilenler.includes(`topluluk_${i}`) ? 1 : 0),
  })).filter((p) => !gizlenen.includes(p.id));
  return [...benimPaylasimlar, ...kurgusal];
}

/** Görüntülenme/kullanıma göre kazanılan kredi (Para Kazan ile aynı kademe). */
export function paylasimKredi(kullanim: number): number {
  if (kullanim >= 100_000) return 5000;
  if (kullanim >= 30_000) return 2000;
  if (kullanim >= 10_000) return 1000;
  if (kullanim >= 1_000) return 250;
  if (kullanim >= 100) return 50;
  return 0;
}
