"use client";

import { create } from "zustand";
import { alanlariKoru } from "./gocHelper";
import { persist } from "zustand/middleware";

interface TercihState {
  sabitAraclar: string[]; // dashboard'da öne alınan araç adları
  sabitToggle: (ad: string) => void;
  // Hız & eşzamanlılık (Higgsfield "Boost speed" + "Increase Concurrent" karşılığı)
  hizKademe: number; // 0=Standart, 1=Öncelikli, 2=Turbo — kuyruk önceliği
  esZamanli: number; // aynı anda çalışabilen iş sayısı (2–8)
  hizAyarla: (k: number) => void;
  esZamanliAyarla: (n: number) => void;
  // Bildirim tercihleri (Ayarlar → kalıcı; üretim motoru "uretim" tercihine saygı duyar)
  bildirimTercih: { email: boolean; uretim: boolean; pazarlama: boolean };
  bildirimTercihAyarla: (patch: Partial<TercihState["bildirimTercih"]>) => void;
  // Stüdyo sidebar tercihi (genişlik + collapse) — anahtar başına kalıcı (M16).
  // Anahtar: sidebar'ın temel path'i ("/panel/sinema", "sc" vb). Böylece boyut/
  // küçük-mod değiştirip sayfa değişince normale dönme sorunu ortadan kalkar.
  sidebarTercih: Record<string, { genislik?: number; dar?: boolean }>;
  sidebarAyarla: (anahtar: string, patch: { genislik?: number; dar?: boolean }) => void;
  // Otomatik kredi yükleme (Higgsfield "Auto top-up"): bakiye bitince paket otomatik yenilensin mi.
  // KrediModal + YukseltModal'daki "Kur/Kapat" butonu bu GERÇEK tercihi değiştirir.
  otomatikYukleme: boolean;
  otomatikYuklemeToggle: () => boolean; // yeni durumu döner
  /* ── Görünüm ve davranış (Ayarlar › Görünüm) ── */
  /** Vurgu rengi kimliği — VURGU_RENKLERI'nden. */
  vurgu: string;
  /** Hareketi azalt: "sistem" işletim sistemi tercihine uyar. */
  hareket: "sistem" | "azalt" | "tam";
  /** Sekme arka plandayken işletim sistemi bildirimi göster. */
  masaustuBildirim: boolean;
  /** Üretim bitince kısa bir ses çal. */
  bildirimSesi: boolean;
  /** Bu krediye inince "Kredin azalıyor" uyarısı. */
  krediEsigi: number;
  /** Tek tuşlu panel kısayolları (g, v, s, k …). */
  kisayollar: boolean;
  /** Yeni üretimler Keşfet'te otomatik yayınlansın. */
  otoYayin: boolean;
  /** Otomatik yüklemede alınacak paketin kredisi (KREDI_PAKETLERI). */
  otoPaket: number;
  gorunumAyarla: (p: Partial<Pick<TercihState, "vurgu" | "hareket" | "masaustuBildirim" | "bildirimSesi" | "krediEsigi" | "kisayollar" | "otoYayin" | "otoPaket">>) => void;
}

export { VURGU_RENKLERI } from "@/lib/vurgu";

export const useTercih = create<TercihState>()(
  persist(
    (set, get) => ({
      sabitAraclar: [],
      sabitToggle: (ad) =>
        set((s) => ({
          sabitAraclar: s.sabitAraclar.includes(ad)
            ? s.sabitAraclar.filter((x) => x !== ad)
            : [...s.sabitAraclar, ad],
        })),
      hizKademe: 0,
      esZamanli: 2,
      hizAyarla: (k) => set({ hizKademe: Math.max(0, Math.min(2, k)) }),
      esZamanliAyarla: (n) => set({ esZamanli: Math.max(2, Math.min(8, n)) }),
      bildirimTercih: { email: true, uretim: true, pazarlama: false },
      bildirimTercihAyarla: (patch) => set((s) => ({ bildirimTercih: { ...s.bildirimTercih, ...patch } })),
      sidebarTercih: {},
      sidebarAyarla: (anahtar, patch) =>
        set((s) => ({ sidebarTercih: { ...s.sidebarTercih, [anahtar]: { ...s.sidebarTercih[anahtar], ...patch } } })),
      vurgu: "elektrik",
      hareket: "sistem",
      masaustuBildirim: false,
      bildirimSesi: false,
      krediEsigi: 200,
      kisayollar: true,
      otoYayin: false,
      otoPaket: 2500,
      gorunumAyarla: (p) => set(p),
      otomatikYukleme: false,
      otomatikYuklemeToggle: () => {
        const yeni = !get().otomatikYukleme;
        set({ otomatikYukleme: yeni });
        return yeni;
      },
    }),
    { name: "vayra-tercih", version: 6, migrate: alanlariKoru },
  ),
);
