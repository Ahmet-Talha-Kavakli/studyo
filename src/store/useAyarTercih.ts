"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useTercih } from "./useTercih";

/**
 * Ayarlar › Üretim, Gizlilik, Depolama, Dil ve bölge, Bildirim türleri.
 * Görünüm, kısayol, kredi eşiği ve otomatik yükleme gibi eski tercihler useTercih'te kalır.
 */
export type Gorunurluk = "ozel" | "baglanti" | "acik";
export type BildirimKanal = "uygulama" | "eposta" | "tarayici";
export type BildirimOlay = "uretim" | "uzun" | "kredi" | "fatura" | "guvenlik" | "topluluk" | "urun" | "kampanya";

export interface AyarTercih {
  uretim: {
    gorselModel: string | null; oran: string; adet: number; gelistir: boolean;
    videoModel: string | null; sure: string; cozunurluk: string; ses: boolean;
    muzikModel: string | null; hatirla: boolean;
  };
  gizlilik: { gorunurluk: Gorunurluk; remiks: boolean; istemGoster: boolean; profilde: boolean; hassas: "bulanik" | "goster" | "gizle"; filigran: boolean; kimlikBilgisi: boolean; egitim: boolean };
  depolama: { copGun: 7 | 30 | 90; bicim: "png" | "jpg" | "webp"; otoIndir: boolean; klasor: "tur" | "tarih" | "proje" };
  bolge: { dil: "tr" | "en"; saatDilimi: string; tarih: "gun" | "iso" | "uzun"; hafta: "pzt" | "paz"; sayi: "tr" | "en" };
  bildirim: Record<BildirimOlay, Record<BildirimKanal, boolean>>;
  ayarla: <K extends "uretim" | "gizlilik" | "depolama" | "bolge">(k: K, p: Partial<AyarTercih[K]>) => void;
  bildirimAyarla: (o: BildirimOlay, k: BildirimKanal, v: boolean) => void;
  uretimSifirla: () => void;
}

const URETIM: AyarTercih["uretim"] = { gorselModel: null, oran: "1:1", adet: 2, gelistir: true, videoModel: null, sure: "5", cozunurluk: "1080p", ses: true, muzikModel: null, hatirla: true };
const k = (uygulama: boolean, eposta: boolean, tarayici: boolean) => ({ uygulama, eposta, tarayici });

export const useAyarTercih = create<AyarTercih>()(
  persist(
    (set) => ({
      uretim: URETIM,
      gizlilik: { gorunurluk: "ozel", remiks: true, istemGoster: true, profilde: true, hassas: "bulanik", filigran: false, kimlikBilgisi: true, egitim: false },
      depolama: { copGun: 30, bicim: "png", otoIndir: false, klasor: "tur" },
      bolge: { dil: "tr", saatDilimi: "Europe/Istanbul", tarih: "gun", hafta: "pzt", sayi: "tr" },
      bildirim: {
        uretim: k(true, false, true), uzun: k(true, true, true), kredi: k(true, true, false), fatura: k(true, true, false),
        guvenlik: k(true, true, false), topluluk: k(true, false, false), urun: k(true, true, false), kampanya: k(false, false, false),
      },
      ayarla: (key, p) => set((s) => ({ [key]: { ...s[key], ...p } }) as Partial<AyarTercih>),
      bildirimAyarla: (o, kanal, v) => set((s) => ({ bildirim: { ...s.bildirim, [o]: { ...s.bildirim[o], [kanal]: v } } })),
      uretimSifirla: () => set({ uretim: URETIM }),
    }),
    { name: "vayra-ayar-tercih", version: 1 },
  ),
);

/**
 * Yeni üretimlerin gerçek görünürlüğü. Üretim motoru yalnız useTercih.otoYayin'a bakar;
 * "herkese açık" onunla, "özel / bağlantıyla" ayrımı bu depoda tutulur.
 */
export function useGorunurluk(): Gorunurluk {
  const oto = useTercih((s) => s.otoYayin);
  const g = useAyarTercih((s) => s.gizlilik.gorunurluk);
  return oto ? "acik" : g === "acik" ? "ozel" : g;
}
