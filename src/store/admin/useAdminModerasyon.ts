"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* Moderasyon kararları + blocklist eklemeleri + kademeli yaptırım kuralları.
   İnceleme kuyruğunda verilen kararlar, panelden eklenen blocklist kuralları ve
   düzenlenebilir yaptırım kademeleri burada kalıcı tutulur. */

export type KararTuru = "onay" | "kaldir" | "uyar" | "ban" | "escalate";

export interface ModKarar {
  id: string;
  icerikId: string;
  kullanici?: string;
  karar: KararTuru;
  sebep?: string;
  mesaj?: string;
  krediIade?: boolean;
  yapan: string;
  zaman: number;
}

export interface BlocklistEk {
  id: string;
  kelime: string;
  kategori: string;
  davranis: "engelle" | "uyar" | "flagle";
}

export interface YaptirimKural {
  kademe: number; // 1..4
  etiket: string; // "1. ihlal"
  eylem: "uyari" | "aski" | "kalici";
  gun: number; // askı süresi (gün); uyarı/kalıcı için 0
}

const VARSAYILAN_YAPTIRIM: YaptirimKural[] = [
  { kademe: 1, etiket: "1. ihlal", eylem: "uyari", gun: 0 },
  { kademe: 2, etiket: "2. ihlal", eylem: "aski", gun: 1 },
  { kademe: 3, etiket: "3. ihlal", eylem: "aski", gun: 7 },
  { kademe: 4, etiket: "4. ihlal", eylem: "kalici", gun: 0 },
];

interface ModerasyonState {
  kararlar: ModKarar[];
  blocklistEk: BlocklistEk[];
  yaptirimKurallari: YaptirimKural[];

  kararVer: (k: Omit<ModKarar, "id" | "zaman">) => void;
  blocklistEkle: (b: Omit<BlocklistEk, "id">) => void;
  blocklistSil: (id: string) => void;
  yaptirimKuralGuncelle: (kademe: number, delta: Partial<YaptirimKural>) => void;
}

export const useAdminModerasyon = create<ModerasyonState>()(
  persist(
    (set) => ({
      kararlar: [],
      blocklistEk: [],
      yaptirimKurallari: VARSAYILAN_YAPTIRIM,

      kararVer: (k) =>
        set((s) => ({
          kararlar: [
            { ...k, id: `kr_${Date.now()}_${Math.round(Math.random() * 1e6).toString(36)}`, zaman: Date.now() },
            ...s.kararlar,
          ].slice(0, 500),
        })),
      blocklistEkle: (b) =>
        set((s) => ({
          blocklistEk: [
            { ...b, id: `ek_${Date.now()}_${Math.round(Math.random() * 1e6).toString(36)}` },
            ...s.blocklistEk,
          ],
        })),
      blocklistSil: (id) => set((s) => ({ blocklistEk: s.blocklistEk.filter((b) => b.id !== id) })),
      yaptirimKuralGuncelle: (kademe, delta) =>
        set((s) => ({
          yaptirimKurallari: s.yaptirimKurallari.map((k) => (k.kademe === kademe ? { ...k, ...delta } : k)),
        })),
    }),
    { name: "vayra-admin-moderasyon", version: 1 },
  ),
);
