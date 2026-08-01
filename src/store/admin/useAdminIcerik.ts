"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* İçerik / CMS gerçek CRUD — spec Modül 10. persist "vayra-admin-icerik".
   Preset & template, blog/landing, duyuru, yasal metin yönetimi.
   Seed'den bağımsız kendi kanonik veri kaynağı (varsayılan seed'li). */

export interface Preset {
  id: string;
  ad: string;
  kategori: string;
  model: string;
  gizliPrompt: string; // kullanıcıya görünmez sistem prompt'u
  tier: string; // "Tümü" | "Artı+" | "Ultra"
  sira: number;
  aktif: boolean;
  kullanim: number;
}

export interface Blog {
  id: string;
  baslik: string;
  slug: string;
  ozet: string;
  icerik: string; // markdown
  dil: "TR" | "EN";
  durum: "taslak" | "yayin";
  tarih: number;
}

export interface Duyuru {
  id: string;
  baslik: string;
  metin: string;
  segment: string;
  baslangic: number;
  bitis: number;
  aktif: boolean;
  tur: "banner" | "changelog" | "bakim";
}

export interface YasalMetin {
  id: string;
  ad: string;
  versiyon: string; // "v3.2"
  icerik: string;
  tarih: number;
}

const G = 86400000;
const T = Date.UTC(2026, 6, 27, 12, 0, 0);

/* slug üretici — Türkçe karakterleri sadeleştirir. */
export function slugYap(s: string): string {
  return s
    .toLowerCase()
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u")
    .replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/* versiyon artırıcı — "v3.2" → "v3.3" (minör bump). */
export function versiyonArtir(v: string): string {
  const m = /^v(\d+)\.(\d+)$/.exec(v.trim());
  if (!m) return "v1.0";
  return `v${m[1]}.${Number(m[2]) + 1}`;
}

const VARSAYILAN_PRESETLER: Preset[] = [
  { id: "pr_1", ad: "Sinematik Portre", kategori: "Portre", model: "Seedance 2.0", gizliPrompt: "cinematic portrait, 85mm lens, soft rim light, shallow depth of field, kodak portra film grain", tier: "Tümü", sira: 1, aktif: true, kullanim: 42800 },
  { id: "pr_2", ad: "Neon Cyberpunk", kategori: "Sinematik", model: "Veo 3.1", gizliPrompt: "neon cyberpunk city, rain reflections, teal and magenta lighting, anamorphic flare, blade runner mood", tier: "Artı+", sira: 2, aktif: true, kullanim: 31200 },
  { id: "pr_3", ad: "Ürün Stüdyo", kategori: "Ürün", model: "Nano Banana Pro", gizliPrompt: "product studio shot, seamless white background, softbox lighting, high detail, commercial photography", tier: "Tümü", sira: 3, aktif: true, kullanim: 28400 },
  { id: "pr_4", ad: "Moda Editoryal", kategori: "Moda", model: "Ruh 2.0", gizliPrompt: "high fashion editorial, vogue style, dramatic pose, studio backdrop, sharp couture detail", tier: "Ultra", sira: 4, aktif: true, kullanim: 19600 },
  { id: "pr_5", ad: "3D Karakter", kategori: "3D", model: "Ruh 2.0", gizliPrompt: "stylized 3d character, pixar-like, subsurface scattering, clean topology, hero pose", tier: "Ultra", sira: 5, aktif: false, kullanim: 8200 },
  { id: "pr_6", ad: "Viral Hook", kategori: "Video", model: "Seedance 2.0", gizliPrompt: "dynamic vertical video hook, fast cuts, high energy, trending format, punchy captions", tier: "Artı+", sira: 6, aktif: true, kullanim: 15400 },
];

const VARSAYILAN_BLOGLAR: Blog[] = [
  { id: "bl_1", baslik: "AI Video Üretmenin 10 Yolu", slug: "ai-video-uretmenin-10-yolu", ozet: "Yapay zeka ile hızlı ve etkili video üretme teknikleri.", icerik: "# AI Video Üretmenin 10 Yolu\n\nYapay zeka ile video üretimi artık herkes için erişilebilir.\n\n## 1. Doğru modeli seç\n\nİçeriğine uygun modeli seçmek kaliteyi belirler.", dil: "TR", durum: "yayin", tarih: T - 12 * G },
  { id: "bl_2", baslik: "Sinematik İçerik Rehberi", slug: "sinematik-icerik-rehberi", ozet: "Profesyonel görünümlü sinematik içerik için ipuçları.", icerik: "# Sinematik İçerik Rehberi\n\nSinematik görünüm için ışık ve kompozisyon kritik.", dil: "TR", durum: "yayin", tarih: T - 8 * G },
  { id: "bl_3", baslik: "Prompt Yazma Sanatı", slug: "prompt-yazma-sanati", ozet: "Etkili prompt yazmanın temel prensipleri.", icerik: "# Prompt Yazma Sanatı\n\nİyi bir prompt, iyi bir çıktının yarısıdır.", dil: "TR", durum: "taslak", tarih: T - 2 * G },
];

const VARSAYILAN_DUYURULAR: Duyuru[] = [
  { id: "du_1", baslik: "Yeni model yayında", metin: "Yeni model: Seedance 2.0 4K yayında!", segment: "Tüm kullanıcılar", baslangic: T - 3 * G, bitis: T + 7 * G, aktif: true, tur: "banner" },
  { id: "du_2", baslik: "v2.4 sürüm notları", metin: "v2.4 sürüm notları — 3D Stüdyo iyileştirmeleri ve daha hızlı üretim.", segment: "Aktif kullanıcılar", baslangic: T - G, bitis: T + 30 * G, aktif: true, tur: "changelog" },
  { id: "du_3", baslik: "Planlı bakım", metin: "Planlı bakım: 28 Tem 03:00-04:00 arası kısa kesinti olabilir.", segment: "Tüm kullanıcılar", baslangic: T + G, bitis: T + G, aktif: false, tur: "bakim" },
];

const VARSAYILAN_YASAL: YasalMetin[] = [
  { id: "y_1", ad: "Kullanım Şartları (ToS)", versiyon: "v3.2", icerik: "# Kullanım Şartları\n\nVayra hizmetlerini kullanarak bu şartları kabul etmiş olursunuz.", tarih: T - 26 * G },
  { id: "y_2", ad: "Gizlilik Politikası", versiyon: "v2.8", icerik: "# Gizlilik Politikası\n\nVerileriniz KVKK ve GDPR uyarınca işlenir.", tarih: T - 26 * G },
  { id: "y_3", ad: "İçerik Politikası", versiyon: "v1.5", icerik: "# İçerik Politikası\n\nÜretilen içerikler topluluk kurallarına uymalıdır.", tarih: T - 42 * G },
  { id: "y_4", ad: "KVKK Aydınlatma Metni", versiyon: "v2.0", icerik: "# KVKK Aydınlatma Metni\n\n6698 sayılı kanun kapsamında aydınlatma metni.", tarih: T - 26 * G },
  { id: "y_5", ad: "Çerez Politikası", versiyon: "v1.3", icerik: "# Çerez Politikası\n\nSitemiz deneyiminizi iyileştirmek için çerez kullanır.", tarih: T - 56 * G },
];

interface IcerikState {
  presetler: Preset[];
  bloglar: Blog[];
  duyurular: Duyuru[];
  yasalMetinler: YasalMetin[];

  presetEkle: (p: Omit<Preset, "id" | "sira" | "kullanim">) => void;
  presetGuncelle: (id: string, delta: Partial<Preset>) => void;
  presetSil: (id: string) => void;

  blogEkle: (b: Omit<Blog, "id" | "tarih">) => void;
  blogGuncelle: (id: string, delta: Partial<Blog>) => void;
  blogSil: (id: string) => void;
  blogYayinla: (id: string) => void;

  duyuruEkle: (d: Omit<Duyuru, "id">) => void;
  duyuruGuncelle: (id: string, delta: Partial<Duyuru>) => void;
  duyuruSil: (id: string) => void;
  duyuruToggle: (id: string) => void;

  yasalYeniVersiyon: (id: string, icerik: string) => void;
}

export const useAdminIcerik = create<IcerikState>()(
  persist(
    (set) => ({
      presetler: VARSAYILAN_PRESETLER,
      bloglar: VARSAYILAN_BLOGLAR,
      duyurular: VARSAYILAN_DUYURULAR,
      yasalMetinler: VARSAYILAN_YASAL,

      presetEkle: (p) => set((s) => ({ presetler: [{ ...p, id: `pr_${Date.now().toString(36)}`, sira: s.presetler.length + 1, kullanim: 0 }, ...s.presetler] })),
      presetGuncelle: (id, delta) => set((s) => ({ presetler: s.presetler.map((p) => (p.id === id ? { ...p, ...delta } : p)) })),
      presetSil: (id) => set((s) => ({ presetler: s.presetler.filter((p) => p.id !== id) })),

      blogEkle: (b) => set((s) => ({ bloglar: [{ ...b, id: `bl_${Date.now().toString(36)}`, tarih: Date.now() }, ...s.bloglar] })),
      blogGuncelle: (id, delta) => set((s) => ({ bloglar: s.bloglar.map((b) => (b.id === id ? { ...b, ...delta } : b)) })),
      blogSil: (id) => set((s) => ({ bloglar: s.bloglar.filter((b) => b.id !== id) })),
      blogYayinla: (id) => set((s) => ({ bloglar: s.bloglar.map((b) => (b.id === id ? { ...b, durum: "yayin", tarih: Date.now() } : b)) })),

      duyuruEkle: (d) => set((s) => ({ duyurular: [{ ...d, id: `du_${Date.now().toString(36)}` }, ...s.duyurular] })),
      duyuruGuncelle: (id, delta) => set((s) => ({ duyurular: s.duyurular.map((d) => (d.id === id ? { ...d, ...delta } : d)) })),
      duyuruSil: (id) => set((s) => ({ duyurular: s.duyurular.filter((d) => d.id !== id) })),
      duyuruToggle: (id) => set((s) => ({ duyurular: s.duyurular.map((d) => (d.id === id ? { ...d, aktif: !d.aktif } : d)) })),

      yasalYeniVersiyon: (id, icerik) => set((s) => ({
        yasalMetinler: s.yasalMetinler.map((y) => (y.id === id ? { ...y, versiyon: versiyonArtir(y.versiyon), icerik, tarih: Date.now() } : y)),
      })),
    }),
    { name: "vayra-admin-icerik", version: 1 },
  ),
);
