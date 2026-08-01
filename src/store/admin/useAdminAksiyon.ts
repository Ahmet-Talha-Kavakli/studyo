"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* Admin kullanıcı aksiyon overlay'leri — persist "vayra-admin-aksiyon".
   Seed deterministik; buradaki delta'lar seed üstüne uygulanır (gerçek DB yok).
   Kredi düzeltme, durum, tier, etiket, not, manuel ledger, iade kaydı. */

export interface ManuelLedger {
  id: string;
  kullaniciId: string;
  tarih: number;
  miktar: number;
  sebep: string;
  yapan: string;
}

export interface AdminNot {
  id: string;
  kullaniciId: string;
  tarih: number;
  metin: string;
  yazan: string;
}

interface AksiyonState {
  krediDelta: Record<string, number>; // kullaniciId → net kredi düzeltme
  durumDelta: Record<string, string>; // kullaniciId → yeni durum
  planDelta: Record<string, string>; // kullaniciId → yeni plan
  etiketDelta: Record<string, string[]>; // kullaniciId → eklenen etiketler
  notlar: AdminNot[];
  manuelLedger: ManuelLedger[];

  krediDuzelt: (id: string, miktar: number) => void;
  durumDegistir: (id: string, durum: string) => void;
  planDegistir: (id: string, plan: string) => void;
  etiketEkle: (id: string, etiket: string) => void;
  etiketKaldir: (id: string, etiket: string) => void;
  notEkle: (id: string, metin: string, yazan: string) => void;
  ledgerEkle: (l: Omit<ManuelLedger, "id" | "tarih">) => void;
  notlarGetir: (id: string) => AdminNot[];
  ledgerGetir: (id: string) => ManuelLedger[];
  etiketGetir: (id: string) => string[];
}

export const useAdminAksiyon = create<AksiyonState>()(
  persist(
    (set, get) => ({
      krediDelta: {},
      durumDelta: {},
      planDelta: {},
      etiketDelta: {},
      notlar: [],
      manuelLedger: [],

      krediDuzelt: (id, miktar) => set((s) => ({ krediDelta: { ...s.krediDelta, [id]: (s.krediDelta[id] ?? 0) + miktar } })),
      durumDegistir: (id, durum) => set((s) => ({ durumDelta: { ...s.durumDelta, [id]: durum } })),
      planDegistir: (id, plan) => set((s) => ({ planDelta: { ...s.planDelta, [id]: plan } })),
      etiketEkle: (id, etiket) => set((s) => ({ etiketDelta: { ...s.etiketDelta, [id]: [...new Set([...(s.etiketDelta[id] ?? []), etiket])] } })),
      etiketKaldir: (id, etiket) => set((s) => ({ etiketDelta: { ...s.etiketDelta, [id]: (s.etiketDelta[id] ?? []).filter((e) => e !== etiket) } })),
      notEkle: (id, metin, yazan) =>
        set((s) => ({ notlar: [{ id: Math.random().toString(36).slice(2), kullaniciId: id, tarih: Date.now(), metin, yazan }, ...s.notlar] })),
      ledgerEkle: (l) =>
        set((s) => ({ manuelLedger: [{ ...l, id: Math.random().toString(36).slice(2), tarih: Date.now() }, ...s.manuelLedger] })),

      notlarGetir: (id) => get().notlar.filter((n) => n.kullaniciId === id),
      ledgerGetir: (id) => get().manuelLedger.filter((l) => l.kullaniciId === id),
      etiketGetir: (id) => get().etiketDelta[id] ?? [],
    }),
    { name: "vayra-admin-aksiyon" },
  ),
);
