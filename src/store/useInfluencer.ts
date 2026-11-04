"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Karakterin görünüş özellikleri (sihirbazda seçilir; foto/şablon kaynaklılarda kısmen dolu olabilir). */
export interface InfOzellikler {
  cinsiyet: string;
  yas: string;
  koken: string;
  sacStil: string;
  sacRenk: string;
  goz: string;
  vucut: string;
  tenDetay: string[];
  tarz: string;
  aksesuar: string[];
}

export interface Influencer {
  id: string;
  ad: string;
  /** Sosyal medya kullanıcı adı (başında @ yok). */
  kullaniciAdi: string;
  nis: string;
  ton: string;
  biyografi: string;
  ozellikler: InfOzellikler;
  /** Ana portre (kimlik görseli). */
  portre: string;
  /** Ek referans görselleri (yüklenen fotoğraflar, seçilen sonuçlar). Tutarlılığı artırır. */
  referanslar: string[];
  kaynak: "tasarim" | "foto" | "sablon";
  /** Portre gerçek üretim değil, örnek görsel (demo/şablon). */
  ornek?: boolean;
  /** Diğer araçlarda @Ad ile çağrılabilsin diye bağlı element. */
  elementId?: string;
  elementAd?: string;
  olusturma: number;
  guncelleme?: number;
}

interface InfluencerState {
  karakterler: Influencer[];
  aktifId: string | null;
  /** Demo üretimler için plan önizlemesi: üretim id → sahne görseli (gerçek çıktı değil). */
  onizleme: Record<string, string>;
  ekle: (k: Omit<Influencer, "id" | "olusturma">) => string;
  guncelle: (id: string, p: Partial<Omit<Influencer, "id" | "olusturma">>) => void;
  sil: (id: string) => void;
  sec: (id: string | null) => void;
  onizlemeYaz: (uretimId: string, gorsel: string) => void;
}

const yeniId = () => `inf_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const useInfluencer = create<InfluencerState>()(
  persist(
    (set) => ({
      karakterler: [],
      aktifId: null,
      onizleme: {},
      ekle: (k) => {
        const id = yeniId();
        set((s) => ({ karakterler: [{ ...k, id, olusturma: Date.now() }, ...s.karakterler], aktifId: id }));
        return id;
      },
      guncelle: (id, p) => set((s) => ({ karakterler: s.karakterler.map((x) => (x.id === id ? { ...x, ...p, guncelleme: Date.now() } : x)) })),
      sil: (id) => set((s) => {
        const l = s.karakterler.filter((x) => x.id !== id);
        return { karakterler: l, aktifId: s.aktifId === id ? (l[0]?.id ?? null) : s.aktifId };
      }),
      sec: (id) => set({ aktifId: id }),
      onizlemeYaz: (uretimId, gorsel) => set((s) => {
        const g = Object.entries(s.onizleme);
        // Sınırlı tut: en eski kayıtlar düşer.
        const kalan = g.length > 400 ? Object.fromEntries(g.slice(g.length - 300)) : s.onizleme;
        return { onizleme: { ...kalan, [uretimId]: gorsel } };
      }),
    }),
    { name: "vayra-influencer", version: 1 },
  ),
);
