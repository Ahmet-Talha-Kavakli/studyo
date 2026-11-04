"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Kullanıcının ruh panoları (moodboard) ve renk paletleri. Pano = stil referansı olarak üretime
 * giden görseller; palet = istemde renk yönergesi olarak giden hex kodları. Görseller sunucu
 * deposunda durur, burada yalnız adresleri tutulur.
 */
export type Pano = { id: string; ad: string; gorseller: string[]; olusturma: number; guncelleme?: number;
  /** Görsellerden çıkarılan palet; `paletGonder` açıksa üretimde renk yönergesi olur. */
  renkler?: string[]; paletGonder?: boolean;
  /** Stil tarifi (istemde "Visual style" olarak gider), kaçınılanlar ve pano gücü. */
  tarif?: string; kacin?: string; guc?: PanoGuc;
  /** Tarayıcıda piksellerden ölçülen ruh etiketleri (Loş, Sıcak ton…). */
  etiketler?: string[] };
export type PanoGuc = "hafif" | "dengeli" | "guclu";
export type Palet = { id: string; ad: string; renkler: string[]; kaynak?: string; olusturma: number };

type State = {
  panolar: Pano[];
  paletler: Palet[];
  panoEkle: (ad: string, gorseller: string[]) => string;
  panoSil: (id: string) => void;
  panoGuncelle: (id: string, d: Partial<Omit<Pano, "id" | "olusturma">>) => void;
  panoGeriYukle: (p: Pano) => void;
  panoCogalt: (id: string) => string | null;
  paletEkle: (ad: string, renkler: string[], kaynak?: string) => string;
  paletSil: (id: string) => void;
};

export const PANO_MAKS_GORSEL = 8;

export const usePanolar = create<State>()(
  persist(
    (set, get) => ({
      panolar: [],
      paletler: [],
      panoEkle: (ad, gorseller) => {
        const id = crypto.randomUUID();
        set((s) => ({ panolar: [{ id, ad, gorseller: gorseller.slice(0, PANO_MAKS_GORSEL), olusturma: Date.now() }, ...s.panolar] }));
        return id;
      },
      panoSil: (id) => set((s) => ({ panolar: s.panolar.filter((p) => p.id !== id) })),
      panoGuncelle: (id, d) => set((s) => ({ panolar: s.panolar.map((p) => (p.id === id ? { ...p, ...d, ...(d.gorseller ? { gorseller: d.gorseller.slice(0, PANO_MAKS_GORSEL) } : {}), guncelleme: Date.now() } : p)) })),
      panoGeriYukle: (p) => set((s) => (s.panolar.some((x) => x.id === p.id) ? s : { panolar: [p, ...s.panolar] })),
      panoCogalt: (id) => {
        const p = get().panolar.find((x) => x.id === id);
        if (!p) return null;
        const yeni = crypto.randomUUID();
        set((s) => ({ panolar: [{ ...p, id: yeni, ad: `${p.ad} kopya`, olusturma: Date.now(), guncelleme: undefined }, ...s.panolar] }));
        return yeni;
      },
      paletEkle: (ad, renkler, kaynak) => {
        const id = crypto.randomUUID();
        set((s) => ({ paletler: [{ id, ad, renkler, kaynak, olusturma: Date.now() }, ...s.paletler].slice(0, 40) }));
        return id;
      },
      paletSil: (id) => set((s) => ({ paletler: s.paletler.filter((p) => p.id !== id) })),
    }),
    { name: "vayra-panolar", version: 1 },
  ),
);
