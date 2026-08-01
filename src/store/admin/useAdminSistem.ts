"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* Sistem ayarları — feature flag, global limitler, bakım modu, kayıt. persist. */

export interface FeatureFlag {
  id: string;
  ad: string;
  aciklama: string;
  durum: "acik" | "kapali" | "kismi";
  yuzde: number;
  hedef: string;
}

const VARSAYILAN_FLAGLER: FeatureFlag[] = [
  { id: "f1", ad: "3D Stüdyo (yeni)", aciklama: "Meshy 3D üretim", durum: "kismi", yuzde: 25, hedef: "Ultra tier" },
  { id: "f2", ad: "Seedance 2.0 4K", aciklama: "4K video modeli", durum: "kismi", yuzde: 10, hedef: "Tüm kullanıcılar" },
  { id: "f3", ad: "AI asistan (beta)", aciklama: "Panel içi AI", durum: "acik", yuzde: 100, hedef: "Tümü" },
  { id: "f4", ad: "Yeni ödeme akışı", aciklama: "Basitleştirilmiş checkout", durum: "kapali", yuzde: 0, hedef: "—" },
  { id: "f5", ad: "Topluluk feed'i", aciklama: "Flow sosyal akış", durum: "acik", yuzde: 100, hedef: "Tümü" },
];

interface SistemState {
  flagler: FeatureFlag[];
  bakimModu: boolean;
  kayitAcik: boolean;
  davetModu: boolean;
  maxDosyaMB: number;
  maxEszamanliJob: number;
  gunlukGenerationTavan: number;
  yeniKullaniciBonusKredi: number;

  flagDurum: (id: string, durum: "acik" | "kapali" | "kismi") => void;
  flagYuzde: (id: string, yuzde: number) => void;
  bakimToggle: () => void;
  kayitToggle: () => void;
  davetToggle: () => void;
  ayarGuncelle: (delta: Partial<Pick<SistemState, "maxDosyaMB" | "maxEszamanliJob" | "gunlukGenerationTavan" | "yeniKullaniciBonusKredi">>) => void;
}

export const useAdminSistem = create<SistemState>()(
  persist(
    (set) => ({
      flagler: VARSAYILAN_FLAGLER,
      bakimModu: false,
      kayitAcik: true,
      davetModu: false,
      maxDosyaMB: 50,
      maxEszamanliJob: 8,
      gunlukGenerationTavan: 200,
      yeniKullaniciBonusKredi: 100,

      flagDurum: (id, durum) => set((s) => ({ flagler: s.flagler.map((f) => (f.id === id ? { ...f, durum, yuzde: durum === "acik" ? 100 : durum === "kapali" ? 0 : f.yuzde } : f)) })),
      flagYuzde: (id, yuzde) => set((s) => ({ flagler: s.flagler.map((f) => (f.id === id ? { ...f, yuzde, durum: yuzde === 0 ? "kapali" : yuzde === 100 ? "acik" : "kismi" } : f)) })),
      bakimToggle: () => set((s) => ({ bakimModu: !s.bakimModu })),
      kayitToggle: () => set((s) => ({ kayitAcik: !s.kayitAcik })),
      davetToggle: () => set((s) => ({ davetModu: !s.davetModu })),
      ayarGuncelle: (delta) => set((s) => ({ ...s, ...delta })),
    }),
    { name: "vayra-admin-sistem" },
  ),
);
