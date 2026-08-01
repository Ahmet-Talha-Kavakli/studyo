"use client";

import { create } from "zustand";
import { alanlariKoru } from "./gocHelper";
import { persist } from "zustand/middleware";

/* ============================================================
   MÜZİK STÜDYOSU VERİ KATMANI — Udio mimarisi, Vayra dili.

   Udio'nun en güçlü mimari kararı: STİL ve SES (vokal) ayrı,
   birinci sınıf varlıklar. Bir parçanın hem stili hem sesi var;
   ikisi de tek tek kaydedilip başka parçalarda kullanılabiliyor.
   Bunu aynen alıyoruz.

   Bize özel eklediklerimiz:
   · Soy ağacı (kok/ebeveyn) — uzat/remix zincirleri gerçekten
     ağaç olarak saklanır, "Ağaçlar" görünümü buradan beslenir.
   · Bölüm haritası (bolumler) — inpaint/bölüm değiştirme için
     parçanın Giriş/Nakarat/Köprü haritası üretimle beraber gelir.
   ============================================================ */

export type ParcaDurum = "uretiliyor" | "tamam" | "hata";
export type TuretmeTur = "yeni" | "uzat" | "remix" | "duzenle";

/** Parçanın zaman ekseni haritası — bölüm bazlı düzenlemeyi mümkün kılar. */
export interface Bolum {
  ad: string;      // Giriş · Kıta · Nakarat · Köprü · Çıkış
  bas: number;     // saniye
  bit: number;
}

export interface Stil {
  id: string;
  ad: string;
  tur: string;         // Elektronik, Hip Hop…
  tohum: string;       // kapak deseni
  kaydedilmis?: boolean;
  kaynakParcaId?: string; // "Parçayı stil olarak kullan" ile üretildiyse
}

export interface Ses {
  id: string;
  ad: string;
  cinsiyet: "Kadın" | "Erkek" | "Nötr";
  tohum: string;
  kaydedilmis?: boolean;
}

export interface Parca {
  id: string;
  ad: string;
  istem: string;
  sozler: string;
  enstrumantal: boolean;
  stilId?: string;
  sesId?: string;
  model: string;
  sure: number;          // saniye
  tohum: number;
  durum: ParcaDurum;
  ilerleme: number;      // 0–100
  olusturma: number;
  bolumler: Bolum[];
  /* — soy ağacı — */
  kokId: string;         // ağacın kökü (kendisi kökse kendi id'si)
  ebeveynId?: string;
  turetme: TuretmeTur;
  surum: number;         // aynı kök altındaki sıra (v1, v2…)
  /* — kullanıcı — */
  begeni?: 1 | -1;
  yayinda?: boolean;
  klasorId?: string;
  dinlenme: number;
}

export interface Klasor { id: string; ad: string; olusturma: number }

/* ── Tür taksonomisi (Udio "All Genres" karşılığı) ── */
export const TURLER = [
  "Tümü", "Pop", "Elektronik", "Hip Hop", "R&B", "Rock", "Country",
  "Klasik", "Jazz", "Lo-fi", "Reggaeton", "Metal", "Folk", "Ambient", "Türkü", "Arabesk",
];

/* ── Hazır stiller (Keşfet sekmesi) ── */
export const HAZIR_STILLER: Stil[] = [
  { id: "st_1", ad: "Durdurulamaz Enerji", tur: "Elektronik", tohum: "ms-unstoppable" },
  { id: "st_2", ad: "Gece Yarısı Kadife", tur: "R&B", tohum: "ms-velvet" },
  { id: "st_3", ad: "Sokak Marşı", tur: "Hip Hop", tohum: "ms-street" },
  { id: "st_4", ad: "Kadeh Sesi", tur: "Arabesk", tohum: "ms-kadeh" },
  { id: "st_5", ad: "Yağmurlu Pencere", tur: "Lo-fi", tohum: "ms-rain" },
  { id: "st_6", ad: "Anadolu Psychedelia", tur: "Türkü", tohum: "ms-anadolu" },
  { id: "st_7", ad: "Neon Otoyol", tur: "Elektronik", tohum: "ms-neon" },
  { id: "st_8", ad: "Pirinç Nefesli", tur: "Jazz", tohum: "ms-brass" },
  { id: "st_9", ad: "Kırık Amfi", tur: "Rock", tohum: "ms-amp" },
  { id: "st_10", ad: "Tozlu Yol", tur: "Country", tohum: "ms-dust" },
  { id: "st_11", ad: "Buz Salonu", tur: "Ambient", tohum: "ms-ice" },
  { id: "st_12", ad: "Yaz Balkonu", tur: "Pop", tohum: "ms-summer" },
];

/* ── Hazır sesler ── */
export const HAZIR_SESLER: Ses[] = [
  { id: "ss_1", ad: "Depo", cinsiyet: "Erkek", tohum: "vs-depo" },
  { id: "ss_2", ad: "Kehribar", cinsiyet: "Kadın", tohum: "vs-kehribar" },
  { id: "ss_3", ad: "Kuzey", cinsiyet: "Erkek", tohum: "vs-kuzey" },
  { id: "ss_4", ad: "Tül", cinsiyet: "Kadın", tohum: "vs-tul" },
  { id: "ss_5", ad: "Kuyu", cinsiyet: "Nötr", tohum: "vs-kuyu" },
  { id: "ss_6", ad: "Sahil", cinsiyet: "Kadın", tohum: "vs-sahil" },
];

/* ── Üretim kalitesi ── */
export const KALITELER = [
  { id: "hizli", ad: "En Hızlı", kredi: 2 },
  { id: "dengeli", ad: "Hızlı", kredi: 3 },
  { id: "yuksek", ad: "Yüksek", kredi: 4 },
  { id: "ultra", ad: "Ultra", kredi: 7 },
] as const;
export type KaliteId = (typeof KALITELER)[number]["id"];

export const MODEL_SURUMLERI = ["Vayra Nota 2.0", "Vayra Nota 1.5", "Vayra Nota Sinema"];

/* ── Bölüm haritası üretimi (deterministik) ── */
export function bolumUret(sure: number, enstrumantal: boolean): Bolum[] {
  const kalip = enstrumantal
    ? ["Giriş", "Tema", "Gelişme", "Doruk", "Çıkış"]
    : ["Giriş", "Kıta", "Nakarat", "Kıta", "Köprü", "Nakarat", "Çıkış"];
  const pay = sure / kalip.length;
  return kalip.map((ad, i) => ({
    ad,
    bas: Math.round(i * pay),
    bit: Math.round((i + 1) * pay),
  }));
}

/* ── Ad önerisi (deterministik, SSR güvenli) ── */
const AD_A = ["Gece", "Kırık", "Altın", "Sessiz", "Uzak", "Islak", "Yalın", "Derin", "Mavi", "Son"];
const AD_B = ["Yankı", "Sokak", "Nefes", "Ritim", "Vals", "Yolculuk", "Işık", "Sözler", "Fırtına", "Duvar"];
export function parcaAdOner(tohum: number): string {
  const h = Math.abs(Math.round(tohum));
  return `${AD_A[h % AD_A.length]} ${AD_B[(h >> 3) % AD_B.length]}`;
}

/* ── Dalga formu (deterministik) ── */
export function dalga(tohum: string, adet = 72): number[] {
  let h = 0;
  for (let i = 0; i < tohum.length; i++) h = (h * 31 + tohum.charCodeAt(i)) >>> 0;
  return Array.from({ length: adet }, (_, i) => {
    h = (h * 1103515245 + 12345) >>> 0;
    const taban = 0.25 + ((h >>> 16) % 1000) / 1000 * 0.7;
    /* Uçlarda sönümleme — gerçek dalga formu gibi */
    const zarf = Math.sin((i / adet) * Math.PI) * 0.45 + 0.55;
    return Math.max(0.08, Math.min(1, taban * zarf));
  });
}

export function sureBicim(sn: number): string {
  const s = Math.max(0, Math.round(sn));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/* ── Tür → müzikal parametre (gerçek sentezleyiciyi besler) ── */
const TUR_PARAM: Record<string, { bpm: number; minor: boolean; yogunluk: number; parlaklik: number }> = {
  "Pop":        { bpm: 112, minor: false, yogunluk: 0.6, parlaklik: 0.75 },
  "Elektronik": { bpm: 128, minor: false, yogunluk: 0.85, parlaklik: 0.8 },
  "Hip Hop":    { bpm: 92,  minor: true,  yogunluk: 0.7, parlaklik: 0.45 },
  "R&B":        { bpm: 84,  minor: true,  yogunluk: 0.45, parlaklik: 0.55 },
  "Rock":       { bpm: 120, minor: false, yogunluk: 0.8, parlaklik: 0.6 },
  "Country":    { bpm: 100, minor: false, yogunluk: 0.5, parlaklik: 0.7 },
  "Klasik":     { bpm: 80,  minor: true,  yogunluk: 0.35, parlaklik: 0.6 },
  "Jazz":       { bpm: 96,  minor: true,  yogunluk: 0.45, parlaklik: 0.55 },
  "Lo-fi":      { bpm: 78,  minor: true,  yogunluk: 0.3, parlaklik: 0.35 },
  "Reggaeton":  { bpm: 96,  minor: true,  yogunluk: 0.75, parlaklik: 0.65 },
  "Metal":      { bpm: 150, minor: true,  yogunluk: 1,   parlaklik: 0.4 },
  "Folk":       { bpm: 96,  minor: false, yogunluk: 0.4, parlaklik: 0.65 },
  "Ambient":    { bpm: 70,  minor: true,  yogunluk: 0.2, parlaklik: 0.5 },
  "Türkü":      { bpm: 104, minor: true,  yogunluk: 0.55, parlaklik: 0.55 },
  "Arabesk":    { bpm: 88,  minor: true,  yogunluk: 0.5, parlaklik: 0.4 },
};

const KEYLER = ["C", "D", "E", "F", "G", "A", "B", "C#", "F#"];

/** Parçayı gerçek sentezleyicinin (muzikMotoru.bestele) anlayacağı ayara çevirir. */
export function besteAyari(p: Parca, tur?: string) {
  const t = TUR_PARAM[tur ?? ""] ?? { bpm: 110, minor: false, yogunluk: 0.55, parlaklik: 0.6 };
  return {
    tohum: `${p.id}-${p.tohum}`,
    bpm: t.bpm,
    key: KEYLER[p.tohum % KEYLER.length],
    minor: t.minor,
    /* Motor 240 sn üstünü kırpıyor; kütüphanede gösterilen süreyle tutarlı kalsın. */
    sure: Math.min(240, p.sure),
    yogunluk: t.yogunluk,
    parlaklik: t.parlaklik,
    enstrumantal: p.enstrumantal,
  };
}

interface MuzikState {
  parcalar: Parca[];
  stiller: Stil[];   // kullanıcının kaydettikleri
  sesler: Ses[];
  klasorler: Klasor[];
  parcaEkle: (p: Omit<Parca, "id" | "olusturma" | "durum" | "ilerleme" | "dinlenme">) => string;
  parcaGuncelle: (id: string, patch: Partial<Parca>) => void;
  parcaSil: (id: string) => void;
  stilKaydet: (s: Omit<Stil, "id">) => string;
  stilSil: (id: string) => void;
  sesKaydet: (s: Omit<Ses, "id">) => string;
  sesSil: (id: string) => void;
  klasorEkle: (ad: string) => string;
  klasorSil: (id: string) => void;
}

let sayac = 0;
const yeniId = (on: string) => { sayac += 1; return `${on}_${sayac}_${Math.floor(performance.now())}`; };

export const useMuzik = create<MuzikState>()(
  persist(
    (set) => ({
      parcalar: [],
      stiller: [],
      sesler: [],
      klasorler: [],
      parcaEkle: (p) => {
        const id = yeniId("pc");
        set((s) => ({
          parcalar: [
            { ...p, id, kokId: p.kokId || id, durum: "uretiliyor", ilerleme: 0, dinlenme: 0, olusturma: Date.now() },
            ...s.parcalar,
          ],
        }));
        return id;
      },
      parcaGuncelle: (id, patch) =>
        set((s) => ({ parcalar: s.parcalar.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      parcaSil: (id) => set((s) => ({ parcalar: s.parcalar.filter((x) => x.id !== id) })),
      stilKaydet: (st) => {
        const id = yeniId("st");
        set((s) => ({ stiller: [{ ...st, id, kaydedilmis: true }, ...s.stiller] }));
        return id;
      },
      stilSil: (id) => set((s) => ({ stiller: s.stiller.filter((x) => x.id !== id) })),
      sesKaydet: (sv) => {
        const id = yeniId("ss");
        set((s) => ({ sesler: [{ ...sv, id, kaydedilmis: true }, ...s.sesler] }));
        return id;
      },
      sesSil: (id) => set((s) => ({ sesler: s.sesler.filter((x) => x.id !== id) })),
      klasorEkle: (ad) => {
        const id = yeniId("kl");
        set((s) => ({ klasorler: [...s.klasorler, { id, ad, olusturma: Date.now() }] }));
        return id;
      },
      klasorSil: (id) =>
        set((s) => ({
          klasorler: s.klasorler.filter((x) => x.id !== id),
          parcalar: s.parcalar.map((p) => (p.klasorId === id ? { ...p, klasorId: undefined } : p)),
        })),
    }),
    { name: "vayra-muzik", version: 1, migrate: alanlariKoru },
  ),
);

/** Bir kökün tüm soyu — "Ağaçlar" görünümü için. */
export function soyAgaci(parcalar: Parca[], kokId: string): Parca[] {
  return parcalar.filter((p) => p.kokId === kokId).sort((a, b) => a.olusturma - b.olusturma);
}

/** Stil/ses id'sini ada çevirir (hazır + kullanıcı havuzu birlikte). */
export function stilBul(stiller: Stil[], id?: string): Stil | undefined {
  if (!id) return undefined;
  return [...stiller, ...HAZIR_STILLER].find((s) => s.id === id);
}
export function sesBul(sesler: Ses[], id?: string): Ses | undefined {
  if (!id) return undefined;
  return [...sesler, ...HAZIR_SESLER].find((s) => s.id === id);
}
