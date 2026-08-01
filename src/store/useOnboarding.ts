"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * useOnboarding — YALNIZCA ilk kayıttan sonra bir kez gösterilen adım-adım
 * karşılama turu (kullanıcı isteği: "onboarding ilk kayıtta, adım adım, atla").
 *
 * Akış: kayıt sırasında `baslat()` çağrılır → panel açıldığında Onboarding
 * bileşeni turu gösterir → kullanıcı "Atla" veya son adımda "Başla" derse
 * `bitir()` ile kalıcı kapanır ve bir daha AÇILMAZ. Girişte (tekrar login)
 * tetiklenmez — sadece kayıt.
 */
interface OnboardingState {
  bekliyor: boolean;   // tur gösterilmeyi bekliyor mu (ilk kayıt sonrası true)
  tamamlandi: boolean; // tur bir kez gösterildi/atlandı → tekrar açılmaz
  baslat: () => void;  // kayıtta çağrılır
  bitir: () => void;   // atla/başla ile kapanınca çağrılır
}

export const useOnboarding = create<OnboardingState>()(
  persist(
    (set) => ({
      bekliyor: false,
      tamamlandi: false,
      baslat: () => set((s) => (s.tamamlandi ? s : { bekliyor: true })),
      bitir: () => set({ bekliyor: false, tamamlandi: true }),
    }),
    { name: "vayra-onboarding" },
  ),
);
