"use client";

import { create } from "zustand";
import { alanlariKoru } from "./gocHelper";
import { persist } from "zustand/middleware";

/**
 * useKazanc — Para Kazan merkezinin GERÇEK defteri (M12).
 *
 * Amaç: "kazandın 🎉" diyen ama hiçbir yere yazmayan sahte butonları bitirmek.
 * Her kazanç bir hareket (Hareket) olarak buraya düşer; bakiye/bekleyen/toplam
 * bu defterden hesaplanır. Çekim talebi de gerçek bir kayıt üretir.
 *
 * Kredi bakiyesi useAuth'ta tutulur; burası KAZANÇ GEÇMİŞİdir (muhasebe defteri).
 */

export type HareketTur = "gorev" | "referans" | "paylasim" | "icerik" | "cekim";
export type HareketDurum = "onaylandi" | "bekliyor" | "reddedildi";

export interface Hareket {
  id: string;
  tur: HareketTur;
  baslik: string;
  aciklama?: string;
  /** Kredi cinsinden tutar. Çekimde NEGATİF. */
  kredi: number;
  durum: HareketDurum;
  tarih: number;
}

export interface Davet {
  id: string;
  /** Davet gönderilen e-posta/etiket. */
  kime: string;
  durum: "gonderildi" | "katildi";
  kredi: number;
  tarih: number;
}

/** Gönderilen içerik (sosyal paylaşım linki) — ekip doğrulayınca kredi düşer. */
export interface IcerikGonderim {
  id: string;
  link: string;
  platform: string;
  durum: "inceleniyor" | "onaylandi" | "reddedildi";
  kredi: number;
  tarih: number;
}

interface KazancState {
  hareketler: Hareket[];
  davetler: Davet[];
  gonderimler: IcerikGonderim[];
  /** Tamamlanan tek-seferlik görevlerin id'leri (tekrar kazanılmasın). */
  yapilanGorevler: string[];
  hareketEkle: (h: Omit<Hareket, "id" | "tarih"> & { tarih?: number }) => string;
  gorevTamamla: (gorevId: string, baslik: string, kredi: number) => boolean;
  davetEkle: (kime: string) => string;
  icerikGonder: (link: string, platform: string) => string;
  cekimTalep: (kredi: number, yontem: string) => string;
}

let sayac = 0;
const yid = (p: string) => { sayac += 1; return `${p}_${sayac}_${Date.now().toString(36)}`; };

export const useKazanc = create<KazancState>()(
  persist(
    (set, get) => ({
      hareketler: [],
      davetler: [],
      gonderimler: [],
      yapilanGorevler: [],

      hareketEkle: (h) => {
        const id = yid("hr");
        set((s) => ({ hareketler: [{ ...h, id, tarih: h.tarih ?? Date.now() }, ...s.hareketler] }));
        return id;
      },

      gorevTamamla: (gorevId, baslik, kredi) => {
        if (get().yapilanGorevler.includes(gorevId)) return false;
        const id = yid("hr");
        set((s) => ({
          yapilanGorevler: [...s.yapilanGorevler, gorevId],
          hareketler: [{ id, tur: "gorev", baslik, kredi, durum: "onaylandi", tarih: Date.now() }, ...s.hareketler],
        }));
        return true;
      },

      davetEkle: (kime) => {
        const id = yid("dv");
        set((s) => ({
          davetler: [{ id, kime, durum: "gonderildi", kredi: 500, tarih: Date.now() }, ...s.davetler],
          hareketler: [
            { id: yid("hr"), tur: "referans", baslik: `Davet: ${kime}`, aciklama: "Arkadaşın katılınca onaylanır", kredi: 500, durum: "bekliyor", tarih: Date.now() },
            ...s.hareketler,
          ],
        }));
        return id;
      },

      icerikGonder: (link, platform) => {
        const id = yid("gn");
        set((s) => ({
          gonderimler: [{ id, link, platform, durum: "inceleniyor", kredi: 1000, tarih: Date.now() }, ...s.gonderimler],
          hareketler: [
            { id: yid("hr"), tur: "icerik", baslik: `${platform} paylaşımı`, aciklama: link, kredi: 1000, durum: "bekliyor", tarih: Date.now() },
            ...s.hareketler,
          ],
        }));
        return id;
      },

      cekimTalep: (kredi, yontem) => {
        const id = yid("hr");
        set((s) => ({
          hareketler: [
            { id, tur: "cekim", baslik: `Çekim talebi · ${yontem}`, kredi: -Math.abs(kredi), durum: "bekliyor", tarih: Date.now() },
            ...s.hareketler,
          ],
        }));
        return id;
      },
    }),
    { name: "vayra-kazanc", version: 1, migrate: alanlariKoru },
  ),
);

/** Onaylanmış kazanç (çekimler düşülmüş) = çekilebilir bakiye. */
export function bakiyeHesapla(hareketler: Hareket[]): number {
  return hareketler
    .filter((h) => h.durum === "onaylandi")
    .reduce((a, h) => a + h.kredi, 0);
}

/** Onay bekleyen (pozitif) kazanç toplamı. */
export function bekleyenHesapla(hareketler: Hareket[]): number {
  return hareketler
    .filter((h) => h.durum === "bekliyor" && h.kredi > 0)
    .reduce((a, h) => a + h.kredi, 0);
}

/** Bugüne kadar kazanılan toplam (çekimler hariç). */
export function toplamKazancHesapla(hareketler: Hareket[]): number {
  return hareketler
    .filter((h) => h.durum === "onaylandi" && h.kredi > 0)
    .reduce((a, h) => a + h.kredi, 0);
}

/** 1000 kredi = 10 ₺ (şeffaf dönüşüm oranı). */
export const KREDI_TL_ORAN = 0.01;
export const MIN_CEKIM_KREDI = 5000;

export function krediTL(kredi: number): string {
  return (kredi * KREDI_TL_ORAN).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 });
}
