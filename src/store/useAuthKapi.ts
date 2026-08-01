"use client";

import { create } from "zustand";
import { useAuth } from "./useAuth";

/**
 * useAuthKapi — "giriş kapısı" (auth gate).
 *
 * Misafir kullanıcı üret/kaydet gibi giriş gerektiren bir aksiyona kalkışınca
 * merkezi giriş/kayıt pop-up'ını açar. Kullanıcı giriş yaparsa, kapatılan
 * modaldan sonra bekleyen aksiyon (bekleyenEylem) otomatik çalıştırılır.
 *
 * Kullanım:
 *   const kapiKontrol = useAuthKapi((s) => s.kapiKontrol);
 *   const uret = () => kapiKontrol(() => gercektenUret());  // girişliyse direkt, değilse pop-up
 */
interface AuthKapiState {
  acik: boolean;
  baslik: string;
  altBaslik: string;
  bekleyenEylem: (() => void) | null;
  ac: (opts?: { baslik?: string; altBaslik?: string; eylem?: () => void }) => void;
  kapat: () => void;
  /** Girişliyse eylemi hemen çalıştırır; değilse pop-up açar ve eylemi giriş sonrasına kuyruğa alır. Girişli mi döndürür. */
  kapiKontrol: (eylem?: () => void, opts?: { baslik?: string; altBaslik?: string }) => boolean;
  /** Giriş/kayıt başarılı olduğunda çağrılır: modalı kapat + bekleyen eylemi çalıştır. */
  girisBasarili: () => void;
}

export const useAuthKapi = create<AuthKapiState>((set, get) => ({
  acik: false,
  baslik: "Vayra'ya hoş geldin",
  altBaslik: "Ücretsiz kaydol ve üretmeye başla",
  bekleyenEylem: null,

  ac: (opts) =>
    set({
      acik: true,
      baslik: opts?.baslik ?? "Vayra'ya hoş geldin",
      altBaslik: opts?.altBaslik ?? "Ücretsiz kaydol ve üretmeye başla",
      bekleyenEylem: opts?.eylem ?? null,
    }),

  kapat: () => set({ acik: false, bekleyenEylem: null }),

  kapiKontrol: (eylem, opts) => {
    if (useAuth.getState().girisYapildi) {
      eylem?.();
      return true;
    }
    set({
      acik: true,
      baslik: opts?.baslik ?? "Devam etmek için giriş yap",
      altBaslik: opts?.altBaslik ?? "Ücretsiz kaydol, saniyeler içinde üretmeye başla",
      bekleyenEylem: eylem ?? null,
    });
    return false;
  },

  girisBasarili: () => {
    const eylem = get().bekleyenEylem;
    set({ acik: false, bekleyenEylem: null });
    // Store güncellemesi işlensin diye bir tık sonra çalıştır.
    if (eylem) setTimeout(eylem, 60);
  },
}));
