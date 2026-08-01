"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* KVKK talep durum overlay'i — persist "vayra-admin-kvkk".
   DSR taleplerinin durumu (tamamlandı/reddedildi) + işlem geçmişi. */

export interface KvkkIslem {
  id: string;
  talepId: string;
  eylem: string;
  yapan: string;
  zaman: number;
}

interface KvkkState {
  durumDelta: Record<string, string>; // talepId → yeni durum
  islemler: KvkkIslem[];
  durumDegistir: (talepId: string, durum: string, eylem: string, yapan: string) => void;
  durumGetir: (talepId: string) => string | undefined;
}

let _n = 0;
export const useAdminKvkk = create<KvkkState>()(
  persist(
    (set, get) => ({
      durumDelta: {},
      islemler: [],
      durumDegistir: (talepId, durum, eylem, yapan) => set((s) => ({
        durumDelta: { ...s.durumDelta, [talepId]: durum },
        islemler: [{ id: `kv_${Date.now().toString(36)}_${_n++}`, talepId, eylem, yapan, zaman: Date.now() }, ...s.islemler].slice(0, 300),
      })),
      durumGetir: (talepId) => get().durumDelta[talepId],
    }),
    { name: "vayra-admin-kvkk", version: 1 },
  ),
);
