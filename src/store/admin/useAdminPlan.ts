"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PLANLAR } from "@/lib/admin/tablolar";

/* Plan kataloğu CRUD — spec Modül 4.1. Panelden düzenlenebilir:
   fiyat (aylık/yıllık), kredi, kredi devir davranışı, erişilebilir modeller,
   limitler (eşzamanlı/günlük job, çözünürlük, video süre, kuyruk önceliği),
   özellikler (watermark, ticari, API, öncelikli destek), trial, görünürlük.
   Seed default üstüne override + yeni plan ekleme. */

export interface PlanTanim {
  id: string;
  ad: string;
  aciklama: string;
  fiyatAyTRY: number;
  fiyatYilTRY: number;
  kredi: number;
  krediDevreder: boolean; // kullanılmayan kredi devreder mi
  gorunur: "public" | "gizli" | "legacy";
  sira: number;
  // Erişilebilir model türleri (checkbox)
  modelTurleri: string[]; // "video","gorsel","3d","ses","muzik","upscale","lipsync"
  // Limitler
  esZamanliJob: number;
  gunlukJob: number;
  maxCozunurluk: string;
  maxVideoSn: number;
  kuyrukOncelik: number; // 1-10
  // Özellikler
  watermark: boolean;
  ticari: boolean;
  apiErisim: boolean;
  oncelikliDestek: boolean;
  // Trial
  trialGun: number;
  trialKartGerekli: boolean;
  stripePriceId: string;
}

const TUM_MODEL_TURLERI = ["video", "gorsel", "3d", "ses", "muzik", "upscale", "lipsync"];

/* Seed planlarından tam PlanTanim türet (catalog fiyat/kredi baz). */
function varsayilanPlanlar(): PlanTanim[] {
  const preset: Record<string, Partial<PlanTanim>> = {
    baslangic: { modelTurleri: ["gorsel", "ses"], esZamanliJob: 1, gunlukJob: 10, maxCozunurluk: "720p", maxVideoSn: 5, kuyrukOncelik: 1, watermark: true, ticari: false, apiErisim: false, oncelikliDestek: false, trialGun: 0, krediDevreder: false },
    arti: { modelTurleri: ["video", "gorsel", "ses", "muzik"], esZamanliJob: 3, gunlukJob: 60, maxCozunurluk: "1080p", maxVideoSn: 10, kuyrukOncelik: 4, watermark: false, ticari: true, apiErisim: false, oncelikliDestek: false, trialGun: 7, krediDevreder: false },
    ultra: { modelTurleri: TUM_MODEL_TURLERI, esZamanliJob: 6, gunlukJob: 200, maxCozunurluk: "4K", maxVideoSn: 20, kuyrukOncelik: 8, watermark: false, ticari: true, apiErisim: true, oncelikliDestek: true, trialGun: 7, krediDevreder: true },
    kurumsal: { modelTurleri: TUM_MODEL_TURLERI, esZamanliJob: 20, gunlukJob: 2000, maxCozunurluk: "4K", maxVideoSn: 60, kuyrukOncelik: 10, watermark: false, ticari: true, apiErisim: true, oncelikliDestek: true, trialGun: 14, krediDevreder: true },
  };
  return PLANLAR.map((p, i) => ({
    id: p.id,
    ad: p.ad,
    aciklama: `${p.ad} planı`,
    fiyatAyTRY: p.fiyatTRY,
    fiyatYilTRY: Math.round(p.fiyatTRY * 10), // ~2 ay bedava
    kredi: p.kredi,
    gorunur: "public" as const,
    sira: i + 1,
    trialKartGerekli: true,
    stripePriceId: `price_${p.id}_${1000 + i}`,
    krediDevreder: false,
    modelTurleri: [], esZamanliJob: 1, gunlukJob: 10, maxCozunurluk: "1080p", maxVideoSn: 10, kuyrukOncelik: 1,
    watermark: false, ticari: false, apiErisim: false, oncelikliDestek: false, trialGun: 0,
    ...preset[p.id],
  }));
}

interface PlanState {
  planlar: PlanTanim[];
  planGuncelle: (id: string, delta: Partial<PlanTanim>) => void;
  modelTuruToggle: (id: string, tur: string) => void;
  planEkle: (p: Omit<PlanTanim, "id" | "sira">) => void;
  planSil: (id: string) => void;
  sifirla: () => void;
}

export const useAdminPlan = create<PlanState>()(
  persist(
    (set) => ({
      planlar: varsayilanPlanlar(),
      planGuncelle: (id, delta) => set((s) => ({ planlar: s.planlar.map((p) => (p.id === id ? { ...p, ...delta } : p)) })),
      modelTuruToggle: (id, tur) => set((s) => ({
        planlar: s.planlar.map((p) => p.id === id
          ? { ...p, modelTurleri: p.modelTurleri.includes(tur) ? p.modelTurleri.filter((t) => t !== tur) : [...p.modelTurleri, tur] }
          : p),
      })),
      planEkle: (p) => set((s) => ({ planlar: [...s.planlar, { ...p, id: `plan_${Date.now().toString(36)}`, sira: s.planlar.length + 1 }] })),
      planSil: (id) => set((s) => ({ planlar: s.planlar.filter((p) => p.id !== id) })),
      sifirla: () => set({ planlar: varsayilanPlanlar() }),
    }),
    { name: "vayra-admin-plan", version: 1 },
  ),
);

export { TUM_MODEL_TURLERI };
