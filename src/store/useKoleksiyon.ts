"use client";

import { create } from "zustand";
import { alanlariKoru } from "./gocHelper";
import { persist } from "zustand/middleware";

/**
 * Klasörler — kullanıcının üretimlerini düzenlediği gerçek klasörler (stüdyo kartları, kitaplık,
 * süzgeç çubuğu). Bir üretim tek klasörde durur: "taşı" önce diğer klasörlerden çıkarır.
 * Hesap açıksa düzen sunucuya da yazılır (lib/galeri/senkron → /api/hesap/galeri).
 */
export interface Koleksiyon {
  id: string;
  ad: string;
  uretimIdler: string[]; // içindeki üretim id'leri
  olusturma: number;
}

interface KoleksiyonState {
  koleksiyonlar: Koleksiyon[];
  olustur: (ad: string, uretimIdler?: string[]) => string;
  sil: (id: string) => void;
  yenidenAdlandir: (id: string, ad: string) => void;
  uretimEkle: (koleksiyonId: string, uretimId: string) => void;
  uretimCikar: (koleksiyonId: string, uretimId: string) => void;
  /** Üretimleri klasöre taşır (null: hiçbir klasörde değil). */
  tasi: (uretimIdler: string[], koleksiyonId: string | null) => void;
  /** Sunucudan gelen düzeni olduğu gibi uygular. */
  hepsiniYaz: (k: Koleksiyon[]) => void;
}

function yeniId() {
  // Sayfa yenilenince sıfırlanan sayaç yerine duvar saati + rastgele ek: id çakışmaz.
  return `kol_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Üretimin bulunduğu klasör (yoksa undefined). */
export const uretimKlasoru = (k: Koleksiyon[], uretimId: string) => k.find((x) => x.uretimIdler.includes(uretimId));

export const useKoleksiyon = create<KoleksiyonState>()(
  persist(
    (set) => ({
      koleksiyonlar: [],
      olustur: (ad, uretimIdler = []) => {
        const id = yeniId();
        set((s) => ({
          koleksiyonlar: [
            { id, ad: ad.trim().slice(0, 60) || "Yeni klasör", uretimIdler: [...uretimIdler], olusturma: Date.now() },
            ...s.koleksiyonlar.map((k) => (uretimIdler.length ? { ...k, uretimIdler: k.uretimIdler.filter((x) => !uretimIdler.includes(x)) } : k)),
          ],
        }));
        return id;
      },
      sil: (id) => set((s) => ({ koleksiyonlar: s.koleksiyonlar.filter((k) => k.id !== id) })),
      yenidenAdlandir: (id, ad) =>
        set((s) => ({ koleksiyonlar: s.koleksiyonlar.map((k) => (k.id === id ? { ...k, ad: ad.trim().slice(0, 60) || k.ad } : k)) })),
      uretimEkle: (koleksiyonId, uretimId) =>
        set((s) => ({
          koleksiyonlar: s.koleksiyonlar.map((k) =>
            k.id === koleksiyonId
              ? (k.uretimIdler.includes(uretimId) ? k : { ...k, uretimIdler: [uretimId, ...k.uretimIdler] })
              : (k.uretimIdler.includes(uretimId) ? { ...k, uretimIdler: k.uretimIdler.filter((x) => x !== uretimId) } : k),
          ),
        })),
      uretimCikar: (koleksiyonId, uretimId) =>
        set((s) => ({
          koleksiyonlar: s.koleksiyonlar.map((k) =>
            k.id === koleksiyonId ? { ...k, uretimIdler: k.uretimIdler.filter((x) => x !== uretimId) } : k,
          ),
        })),
      tasi: (idler, hedef) =>
        set((s) => ({
          koleksiyonlar: s.koleksiyonlar.map((k) => {
            const kalan = k.uretimIdler.filter((x) => !idler.includes(x));
            return k.id === hedef ? { ...k, uretimIdler: [...idler, ...kalan] } : kalan.length === k.uretimIdler.length ? k : { ...k, uretimIdler: kalan };
          }),
        })),
      hepsiniYaz: (koleksiyonlar) => set({ koleksiyonlar }),
    }),
    { name: "vayra-koleksiyon", version: 1, migrate: alanlariKoru },
  ),
);
