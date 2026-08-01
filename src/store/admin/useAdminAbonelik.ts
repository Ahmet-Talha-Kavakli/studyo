"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* Abonelik aksiyon overlay'i — persist "vayra-admin-abonelik".
   İptal/duraklat/yeniden/plan değiştir/tarih kaydır/indirim gerçek durum değişikliği. */

export interface AbonelikIslem {
  id: string;
  aboId: string;
  tur: string;
  tarih: number;
  yapan: string;
  detay?: string;
}

interface AbonelikState {
  durumDelta: Record<string, string>; // aboId → yeni durum
  indirimDelta: Record<string, number>; // aboId → uygulanan indirim %
  yenilemeKaydir: Record<string, number>; // aboId → yeni yenileme ms
  islemler: AbonelikIslem[];

  durumDegistir: (aboId: string, durum: string, yapan: string, detay?: string) => void;
  indirimUygula: (aboId: string, yuzde: number, yapan: string) => void;
  yenilemeAyarla: (aboId: string, yeniMs: number, yapan: string) => void;
  durumGetir: (aboId: string) => string | undefined;
  indirimGetir: (aboId: string) => number | undefined;
}

let _n = 0;
const yeniId = () => `ai_${Date.now().toString(36)}_${_n++}`;

export const useAdminAbonelik = create<AbonelikState>()(
  persist(
    (set, get) => ({
      durumDelta: {},
      indirimDelta: {},
      yenilemeKaydir: {},
      islemler: [],

      durumDegistir: (aboId, durum, yapan, detay) => set((s) => ({
        durumDelta: { ...s.durumDelta, [aboId]: durum },
        islemler: [{ id: yeniId(), aboId, tur: durum, tarih: Date.now(), yapan, detay }, ...s.islemler].slice(0, 400),
      })),
      indirimUygula: (aboId, yuzde, yapan) => set((s) => ({
        indirimDelta: { ...s.indirimDelta, [aboId]: yuzde },
        islemler: [{ id: yeniId(), aboId, tur: "indirim", tarih: Date.now(), yapan, detay: `%${yuzde} indirim` }, ...s.islemler].slice(0, 400),
      })),
      yenilemeAyarla: (aboId, yeniMs, yapan) => set((s) => ({
        yenilemeKaydir: { ...s.yenilemeKaydir, [aboId]: yeniMs },
        islemler: [{ id: yeniId(), aboId, tur: "tarih_kaydir", tarih: Date.now(), yapan }, ...s.islemler].slice(0, 400),
      })),
      durumGetir: (aboId) => get().durumDelta[aboId],
      indirimGetir: (aboId) => get().indirimDelta[aboId],
    }),
    { name: "vayra-admin-abonelik", version: 1 },
  ),
);
