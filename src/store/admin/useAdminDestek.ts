"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Ticket } from "@/lib/admin/seed/moderasyon";

/* Destek — ticket üzerinde gerçek etki: mesaj thread yanıtları, durum deltası,
   atama, makro uygulama. persist "vayra-admin-destek".
   Seed thread'in ÜSTÜNE yazar (delta pattern); seed sabit kalır. */

export interface Yanit {
  id: string;
  ticketId: string;
  kim: "kullanici" | "destek";
  metin: string;
  yapan: string; // admin adı
  zaman: number;
}

interface DestekState {
  // ticketId -> yeni durum
  durumDelta: Record<string, Ticket["durum"]>;
  // ticketId -> atanan rol/kişi
  atamaDelta: Record<string, string>;
  // ticket'a eklenen yanıtlar (seed thread'in devamı)
  yanitlar: Yanit[];

  yanitla: (ticketId: string, metin: string, yapan: string) => void;
  durumDegistir: (ticketId: string, durum: Ticket["durum"]) => void;
  ata: (ticketId: string, kime: string) => void;
  // Makro: sistem yanıtı ekler + durumu yanıtlandı yapar. Döndürdüğü metin audit için.
  makroUygula: (ticketId: string, makroAd: string, sistemMetni: string, yapan: string) => void;

  ticketYanitlari: (ticketId: string) => Yanit[];
  ticketDurum: (t: Ticket) => Ticket["durum"];
  ticketAtama: (t: Ticket) => string | undefined;
}

export const useAdminDestek = create<DestekState>()(
  persist(
    (set, get) => ({
      durumDelta: {},
      atamaDelta: {},
      yanitlar: [],

      yanitla: (ticketId, metin, yapan) => set((s) => ({
        yanitlar: [...s.yanitlar, { id: `y_${Date.now().toString(36)}`, ticketId, kim: "destek", metin, yapan, zaman: Date.now() }],
        durumDelta: { ...s.durumDelta, [ticketId]: "yanitlandi" },
      })),

      durumDegistir: (ticketId, durum) => set((s) => ({ durumDelta: { ...s.durumDelta, [ticketId]: durum } })),

      ata: (ticketId, kime) => set((s) => ({ atamaDelta: { ...s.atamaDelta, [ticketId]: kime } })),

      makroUygula: (ticketId, _makroAd, sistemMetni, yapan) => set((s) => ({
        yanitlar: [...s.yanitlar, { id: `y_${Date.now().toString(36)}`, ticketId, kim: "destek", metin: sistemMetni, yapan, zaman: Date.now() }],
        durumDelta: { ...s.durumDelta, [ticketId]: "yanitlandi" },
      })),

      ticketYanitlari: (ticketId) => get().yanitlar.filter((y) => y.ticketId === ticketId),
      ticketDurum: (t) => get().durumDelta[t.id] ?? t.durum,
      ticketAtama: (t) => get().atamaDelta[t.id] ?? t.atanan,
    }),
    { name: "vayra-admin-destek", version: 1 },
  ),
);
