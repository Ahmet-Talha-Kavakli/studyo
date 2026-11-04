"use client";

/* Sahne şeridi: seçilen çekimlerin sıralı listesi (üretim id'leri). Birden çok sahne tutulur;
   tarayıcıda kalıcıdır. Üretim silinince şeritte "kayıp" olarak görünmez, süzülür. */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Sahne = { id: string; ad: string; cekimler: string[]; guncelleme: number };

type Durum = {
  sahneler: Sahne[];
  aktifId: string;
  sec: (id: string) => void;
  yeni: (ad?: string) => string;
  adDegis: (id: string, ad: string) => void;
  sil: (id: string) => void;
  ekle: (uretimId: string, sahneId?: string) => boolean;
  cikar: (uretimId: string, sahneId?: string) => void;
  sirala: (cekimler: string[], sahneId?: string) => void;
};

const yeniId = () => `sh_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
const ilk: Sahne = { id: "sh_ilk", ad: "Sahne 1", cekimler: [], guncelleme: 0 };

export const useSahne = create<Durum>()(
  persist(
    (set, get) => {
      const yaz = (id: string | undefined, f: (s: Sahne) => Sahne) =>
        set((d) => ({ sahneler: d.sahneler.map((s) => (s.id === (id ?? d.aktifId) ? { ...f(s), guncelleme: Date.now() } : s)) }));
      return {
        sahneler: [ilk],
        aktifId: ilk.id,
        sec: (id) => set({ aktifId: id }),
        yeni: (ad) => {
          const id = yeniId();
          set((d) => ({ sahneler: [...d.sahneler, { id, ad: ad ?? `Sahne ${d.sahneler.length + 1}`, cekimler: [], guncelleme: Date.now() }], aktifId: id }));
          return id;
        },
        adDegis: (id, ad) => yaz(id, (s) => ({ ...s, ad: ad.trim().slice(0, 40) || s.ad })),
        sil: (id) => set((d) => {
          const l = d.sahneler.filter((s) => s.id !== id);
          const kalan = l.length ? l : [{ ...ilk, id: yeniId() }];
          return { sahneler: kalan, aktifId: kalan.some((s) => s.id === d.aktifId) ? d.aktifId : kalan[0].id };
        }),
        ekle: (u, sahneId) => {
          const s = get().sahneler.find((x) => x.id === (sahneId ?? get().aktifId));
          if (!s || s.cekimler.includes(u)) return false;
          yaz(s.id, (x) => ({ ...x, cekimler: [...x.cekimler, u] }));
          return true;
        },
        cikar: (u, sahneId) => yaz(sahneId, (s) => ({ ...s, cekimler: s.cekimler.filter((x) => x !== u) })),
        sirala: (cekimler, sahneId) => yaz(sahneId, (s) => ({ ...s, cekimler })),
      };
    },
    { name: "vayra-sinema-sahne", version: 1 },
  ),
);
