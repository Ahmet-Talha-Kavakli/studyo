"use client";

import { create } from "zustand";
import { alanlariKoru } from "./gocHelper";
import { persist } from "zustand/middleware";

/* ============================================================
   KARAKTERLER — Higgsfield /character akışı birebir.

   Bir karakter = kullanıcının yüklediği referans fotoğraflardan
   EĞİTİLEN, sonra tüm üretimlerde tutarlı biçimde kullanılabilen
   kimlik. Element store'undan (useElements) farkı: burada gerçek
   bir eğitim süreci, foto kalitesi ve model seçimi var.
   ============================================================ */

export type KarakterModel = "Ruh 2.0" | "Ruh" | "Ruh Sinema";
export type KarakterDurum = "egitiliyor" | "hazir" | "hata";

export interface KarakterFoto {
  id: string;
  url: string;      // data: URI ya da /stok yolu
  genislik: number; // px — kalite skoru bundan hesaplanır
  yukseklik: number;
}

export interface Karakter {
  id: string;
  ad: string;
  model: KarakterModel;
  fotolar: KarakterFoto[];
  kapakId?: string;      // kapak olarak seçilen fotoğraf
  durum: KarakterDurum;
  ilerleme: number;      // 0–100, eğitim çubuğu
  olusturma: number;
  paylasildi?: boolean;  // "Ekiple paylaş"
}

/* ── Kalite eşikleri (referans: 4/80 "Kötü", 665px "İyi") ── */

export const FOTO_HEDEF = 80;      // halkanın tamamı
export const FOTO_ONERILEN = 20;   // "en iyi sonuç için 20+"

export type Derece = "kotu" | "orta" | "iyi" | "mukemmel";

/** Fotoğraf SAYISINA göre derece — referanstaki "Bad" rozeti 4 fotoda çıkıyor. */
export function adetDerece(n: number): Derece {
  if (n < 10) return "kotu";
  if (n < FOTO_ONERILEN) return "orta";
  if (n < 40) return "iyi";
  return "mukemmel";
}

/** Ortalama çözünürlüğe göre derece — referansta 665px "Good". */
export function cozunurlukDerece(px: number): Derece {
  if (px < 320) return "kotu";
  if (px < 512) return "orta";
  if (px < 1024) return "iyi";
  return "mukemmel";
}

export const DERECE_ETIKET: Record<Derece, string> = {
  kotu: "Kötü", orta: "Orta", iyi: "İyi", mukemmel: "Mükemmel",
};

/** Fotoğrafların ortalama kısa kenarı — kalite halkasının değeri. */
export function ortalamaCozunurluk(fotolar: KarakterFoto[]): number {
  if (!fotolar.length) return 0;
  const toplam = fotolar.reduce((t, f) => t + Math.min(f.genislik, f.yukseklik), 0);
  return Math.round(toplam / fotolar.length);
}

/** Tek tek fotoğrafın "düşük kalite" uyarısı alıp almayacağı. */
export function dusukKalite(f: KarakterFoto): boolean {
  return Math.min(f.genislik, f.yukseklik) < 320;
}

/* ── Otomatik ad önerisi (referansta "Mysterious Rhythm" gibi) ── */
const AD_SIFAT = ["Gizemli", "Sessiz", "Altın", "Kadife", "Kuzey", "Vahşi", "Sakin", "Karanlık", "Berrak", "Uzak"];
const AD_ISIM = ["Ritim", "Yankı", "Kıvılcım", "Gölge", "Rüzgâr", "Akış", "Deniz", "Tan", "Iz", "Nefes"];

/** Deterministik ad önerisi — SSR güvenli (Math.random yok). */
export function adOner(tohum: number): string {
  const h = Math.abs(Math.round(tohum));
  return `${AD_SIFAT[h % AD_SIFAT.length]} ${AD_ISIM[(h >> 3) % AD_ISIM.length]}`;
}

/* ── Eğitim kredisi ── */
export const KARAKTER_KREDI = 25; // referans: "Create ✦25"

interface KarakterState {
  karakterler: Karakter[];
  ekle: (k: Omit<Karakter, "id" | "olusturma" | "durum" | "ilerleme">) => string;
  guncelle: (id: string, patch: Partial<Karakter>) => void;
  sil: (id: string) => void;
  kapakSec: (id: string, fotoId: string) => void;
}

let sayac = 0;
function yeniId() {
  sayac += 1;
  return `kr_${sayac}_${Math.floor(performance.now())}`;
}

export const useKarakterler = create<KarakterState>()(
  persist(
    (set) => ({
      karakterler: [],
      ekle: (k) => {
        const id = yeniId();
        set((s) => ({
          karakterler: [
            { ...k, id, durum: "egitiliyor", ilerleme: 0, olusturma: Date.now() },
            ...s.karakterler,
          ],
        }));
        return id;
      },
      guncelle: (id, patch) =>
        set((s) => ({
          karakterler: s.karakterler.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      sil: (id) => set((s) => ({ karakterler: s.karakterler.filter((x) => x.id !== id) })),
      kapakSec: (id, fotoId) =>
        set((s) => ({
          karakterler: s.karakterler.map((x) => (x.id === id ? { ...x, kapakId: fotoId } : x)),
        })),
    }),
    { name: "vayra-karakterler", version: 1, migrate: alanlariKoru },
  ),
);
