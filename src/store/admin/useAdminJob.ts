"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* Job aksiyon overlay'i — persist "vayra-admin-job".
   Seed job'ları deterministik; buradaki delta'lar gerçek durum değişikliğini tutar.
   İptal, yeniden çalıştır (retry), öncelik verme, kredi iade, output sil, moderasyona gönder. */

export interface JobIslem {
  id: string;
  jobId: string;
  tur: "iptal" | "retry" | "oncelik" | "iade" | "sil" | "moderasyon";
  tarih: number;
  yapan: string;
  detay?: string;
}

interface JobState {
  durumDelta: Record<string, string>; // jobId → yeni durum (iptal/kuyrukta...)
  oncelikDelta: Record<string, number>; // jobId → yeni öncelik
  islemler: JobIslem[];

  durumDegistir: (jobId: string, durum: string) => void;
  oncelikVer: (jobId: string, oncelik: number) => void;
  islemEkle: (i: Omit<JobIslem, "id" | "tarih">) => void;
  toplu: (jobIdler: string[], durum: string, yapan: string, tur: JobIslem["tur"]) => void;
  durumGetir: (jobId: string) => string | undefined;
  oncelikGetir: (jobId: string) => number | undefined;
  jobIslemleri: (jobId: string) => JobIslem[];
}

let _n = 0;
const yeniId = () => `ji_${Date.now().toString(36)}_${_n++}`;

export const useAdminJob = create<JobState>()(
  persist(
    (set, get) => ({
      durumDelta: {},
      oncelikDelta: {},
      islemler: [],

      durumDegistir: (jobId, durum) => set((s) => ({ durumDelta: { ...s.durumDelta, [jobId]: durum } })),
      oncelikVer: (jobId, oncelik) => set((s) => ({ oncelikDelta: { ...s.oncelikDelta, [jobId]: oncelik } })),
      islemEkle: (i) => set((s) => ({ islemler: [{ ...i, id: yeniId(), tarih: Date.now() }, ...s.islemler].slice(0, 500) })),
      toplu: (jobIdler, durum, yapan, tur) =>
        set((s) => {
          const yeniDurum = { ...s.durumDelta };
          const yeniIslem: JobIslem[] = [];
          for (const jid of jobIdler) {
            yeniDurum[jid] = durum;
            yeniIslem.push({ id: yeniId(), jobId: jid, tur, tarih: Date.now(), yapan });
          }
          return { durumDelta: yeniDurum, islemler: [...yeniIslem, ...s.islemler].slice(0, 500) };
        }),
      durumGetir: (jobId) => get().durumDelta[jobId],
      oncelikGetir: (jobId) => get().oncelikDelta[jobId],
      jobIslemleri: (jobId) => get().islemler.filter((i) => i.jobId === jobId),
    }),
    { name: "vayra-admin-job" },
  ),
);
