"use client";

import type { StudyoGomuluProps } from "@/components/studyo/tipler";

import { useState, useMemo, useRef, useEffect, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, ChevronRight, Heart, Download, Copy, MoreHorizontal,
  Search, Check, BarChart3, Sparkles, Minus, Share2, UserSquare,
  RefreshCw, Recycle, Wand2, Palette, Maximize2, Scissors, Expand, Crop,
  X, XCircle, ChevronLeft, ChevronDown, Info, RotateCcw,
  MessageCircle, Video as VideoIcon, Smile, ImagePlus, Box, Trash2, Upload, FolderPlus,
  Sun, Pencil, Eraser, SlidersHorizontal, MousePointer2, Square, ArrowUpRight, Type, Circle, Undo2, Redo2, Layers, Gem,
  Link2, Briefcase, Pin, AtSign,
  FileImage, FileType2, FileArchive,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { Tooltip } from "@/components/ui/Tooltip";
import { GirdiModal } from "@/components/panel/uc-boyut/GirdiModal";
import { CizimCanvas, type CizimCanvasRef } from "@/components/panel/CizimCanvas";
import { STOK_GORSELLER } from "@/lib/stok-gorseller";
import { useAuth } from "@/store/useAuth";
import { useElements, type ElementTur } from "@/store/useElements";
import { cn, saltUrl, onizlemeArka, INDIRME_FORMATLARI, gorseliFormatlaIndir, istemTemizle } from "@/lib/utils";
import { urlIndir, metinIndir } from "@/lib/gercekEylem";
import { uretimBaslat as uretimBaslatHam, uretimHataToast } from "@/lib/uretimMotoru";
import { useAktifProje } from "@/lib/useAktifProje";
import { icerikDenetle, kategoriEtiket } from "@/lib/moderasyon";
import { MODELLER } from "@/lib/catalog";
import { useProjeler } from "@/store/useProjeler";
import { useKoleksiyon } from "@/store/useKoleksiyon";
import { useSecim } from "@/store/useSecim";
import { useReferansKopru } from "@/store/useReferansKopru";
import { useAyarKopru } from "@/store/useAyarKopru";
import { useYorumlar, goreliZaman } from "@/store/useYorumlar";
import { ElementMentionInput } from "@/components/panel/ElementMentionInput";
import { ElementSeciciModal } from "@/components/panel/element/ElementSeciciModal";
import { oranSayi } from "@/components/panel/UretimKarti";
import {
  MobilComposerKabuk, MobilYukleAlani, MobilIstemKutusu, MobilAltCipler, MobilAltCip, MobilAyarCekmecesi, MobilUretButonu,
  MobilSecici, type SeciciOge,
} from "@/components/panel/MobilComposer";

/**
 * Görsel Stüdyosu — Higgsfield /ai/image BİREBİR (HIGGSFIELD-SPEC.md §2.1).
 * Full-bleed justified medya ızgarası (görsel = sayfa) + yüzen alt prompt dock
 * + model seçici popover + kart hover rayı + boyut kaydırıcı.
 */

// Soul (Ruh) moodboard presetleri — Higgsfield "CREATE YOUR MOODBOARD" birebir
const MOODBOARD_PRESETLERI = [
  "Genel", "Sıcak Ambiyans", "Y2K Stüdyo", "Swag Dönemi", "Teatral Işık", "Y2K Sokak",
  "2000'ler Grup", "Frutiger Aero", "Drain", "Dünya Dışı", "Editöryel Sokak", "Doğa Işığı",
  "Yeni Indie", "Su Altı", "80'ler Korku", "Tek Kullanımlık Kamera", "Nötr Pastel Film", "Sıcak Canlı Film",
];

/* GERÇEK gorsel-sayfası görselleri — moodboard/renk/çizim presetleri için Nano Banana ile üretildi. */
const GORSEL_GERCEK: Record<string, string> = {
  // Moodboard presetleri (tohum: "gorsel-mood-" + ad)
  "gorsel-mood-Genel": "/gercek/gorsel/mood-genel.webp",
  "gorsel-mood-Sıcak Ambiyans": "/gercek/gorsel/mood-sicak-ambiyans.webp",
  "gorsel-mood-Y2K Stüdyo": "/gercek/gorsel/mood-y2k-studyo.webp",
  "gorsel-mood-Swag Dönemi": "/gercek/gorsel/mood-swag-donemi.webp",
  "gorsel-mood-Teatral Işık": "/gercek/gorsel/mood-teatral-isik.webp",
  "gorsel-mood-Y2K Sokak": "/gercek/gorsel/mood-y2k-sokak.webp",
  "gorsel-mood-2000'ler Grup": "/gercek/gorsel/mood-2000ler-grup.webp",
  "gorsel-mood-Frutiger Aero": "/gercek/gorsel/mood-frutiger-aero.webp",
  "gorsel-mood-Drain": "/gercek/gorsel/mood-drain.webp",
  "gorsel-mood-Dünya Dışı": "/gercek/gorsel/mood-dunya-disi.webp",
  "gorsel-mood-Editöryel Sokak": "/gercek/gorsel/mood-editoryel-sokak.webp",
  "gorsel-mood-Doğa Işığı": "/gercek/gorsel/mood-doga-isigi.webp",
  "gorsel-mood-Yeni Indie": "/gercek/gorsel/mood-yeni-indie.webp",
  "gorsel-mood-Su Altı": "/gercek/gorsel/mood-su-alti.webp",
  "gorsel-mood-80'ler Korku": "/gercek/gorsel/mood-80ler-korku.webp",
  "gorsel-mood-Tek Kullanımlık Kamera": "/gercek/gorsel/mood-tek-kullanimlik-kamera.webp",
  "gorsel-mood-Nötr Pastel Film": "/gercek/gorsel/mood-notr-pastel-film.webp",
  "gorsel-mood-Sıcak Canlı Film": "/gercek/gorsel/mood-sicak-canli-film.webp",
  // Moodboard hero şerit (a/b/c)
  "gorsel-mood-a": "/gercek/gorsel/mood-hero-a.webp",
  "gorsel-mood-b": "/gercek/gorsel/mood-hero-b.webp",
  "gorsel-mood-c": "/gercek/gorsel/mood-hero-c.webp",
  // Renk transferi
  "renk-hero": "/gercek/gorsel/renk-hero.webp",
  "renk-ornek-Film Renkleri": "/gercek/gorsel/renk-film.webp",
  "renk-ornek-Lime Jam": "/gercek/gorsel/renk-lime.webp",
  "renk-ornek-Şeker Pembe": "/gercek/gorsel/renk-pembe.webp",
  "renk-ornek-Nostaljik Mavi": "/gercek/gorsel/renk-mavi.webp",
  "renk-ornek-Yumuşak Palet": "/gercek/gorsel/renk-yumusak.webp",
  "renk-ornek-Siyah Parlak": "/gercek/gorsel/renk-siyah.webp",
  // Çizim tuvali
  "cizim-tuval": "/gercek/gorsel/cizim-tuval.webp",
  // Karakter modal hero örnek portreleri
  "kar-a": "/gercek/galeri/portre2.webp",
  "kar-b": "/gercek/galeri/portre4.webp",
  // Karakter modalı örnek portre ızgarası (6 kayıtlı karakter)
  "gorsel-karakter-Talha": "/gercek/gorsel/gorsel-karakter-Talha.webp",
  "gorsel-karakter-Emma": "/gercek/gorsel/gorsel-karakter-Emma.webp",
  "gorsel-karakter-Kai": "/gercek/gorsel/gorsel-karakter-Kai.webp",
  "gorsel-karakter-Sofia": "/gercek/gorsel/gorsel-karakter-Sofia.webp",
  "gorsel-karakter-Leo": "/gercek/gorsel/gorsel-karakter-Leo.webp",
  "gorsel-karakter-Aria": "/gercek/gorsel/gorsel-karakter-Aria.webp",
  // İyileştirici tip örnekleri + açı padi
  "iyilestir-Yumuşak ten": "/gercek/gorsel/iyilestir-yumusak.webp",
  "iyilestir-Gerçekçi ten": "/gercek/gorsel/iyilestir-gercekci.webp",
  "iyilestir-Kusurlu ten": "/gercek/gorsel/iyilestir-kusurlu.webp",
  "acilar-pad": "/gercek/gorsel/acilar-pad.webp",
};
/** Tohum için gerçek görsel yolu (yoksa undefined → stok onizlemeArka). */
function gorselGercek(tohum: string): string | undefined {
  return GORSEL_GERCEK[tohum];
}
/** Gerçek varsa CSS background, yoksa stok. */
function gorselArkaG(tohum: string, kat: string): string {
  const g = GORSEL_GERCEK[tohum];
  return g ? `url("${g}") center/cover no-repeat` : onizlemeArka(tohum, kat);
}

// Soul Hex renk transferi presetleri — her biri bir renk paleti
const RENK_TRANSFER_PRESETLERI: { ad: string; renkler: string[] }[] = [
  { ad: "Film Renkleri", renkler: ["#3a4a3f", "#c9b596", "#8a6d5a", "#2b2118"] },
  { ad: "Lime Jam", renkler: ["#a6e22e", "#2d3a12", "#f0f7d4", "#5a7020"] },
  { ad: "Şeker Pembe", renkler: ["#ff9ec7", "#ffd6e8", "#c44f8a", "#5a1f3a"] },
  { ad: "Nostaljik Mavi", renkler: ["#4a6b8a", "#a8c4d8", "#2b3a4a", "#dce8f0"] },
  { ad: "Yumuşak Palet", renkler: ["#d8c4b0", "#a89078", "#f0e4d4", "#6b5a48"] },
  { ad: "Siyah Parlak", renkler: ["#1c1e20", "#3a3a3a", "#6b6b6b", "#0f1113"] },
];

/** Seçili renk transferi adından palet renklerini döndür (yoksa undefined). */
function renkPaleti(ad: string | null): string[] | undefined {
  if (!ad) return undefined;
  return RENK_TRANSFER_PRESETLERI.find((p) => p.ad === ad)?.renkler;
}

// Model composer davranışı (Higgsfield birebir: her model kendi çip setini + composer düzenini gösterir).
//   "standart" → prompt + oran/çözünürlük/adet çipleri
//   "swap"     → iki yükleme kutusu (Kaynak yüz/karakter + Hedef görsel), prompt yok
//   "flux"     → prompt + gelişmiş ayar (CFG + Kalite Adımı) çipi
//   "kontext"  → prompt + Prompt Geliştir (aç/kapa) çipi
//   "recraft"  → prompt + Vektör modu + Kalite (Standart/HD) çipleri
//   "vary"     → Nano Banana Pro/2 → Draw çipi + Sınırsız toggle
type ModelTip = "standart" | "swap" | "flux" | "kontext" | "recraft" | "vary";
type GorselModel = {
  ad: string;
  ozet: string;
  rozet?: "Yeni" | "Sınırsız";
  grup?: "one" | "tum"; // "one" = Öne çıkan modeller, "tum" = Tüm modeller
  tip?: ModelTip;
  kredi?: number; // temel kredi (adetle çarpılır)
  cizim?: boolean; // Draw çipi göster
  // ── Higgsfield birebir: modele göre composer çipleri (higg-gorsel-model analizi) ──
  cozunurluk?: boolean; // Çözünürlük çipi (2K/1K) göster
  kaliteSeviye?: string[]; // Çözünürlük yerine kalite seviyesi çipi (örn ["Düşük","Orta","Yüksek"])
  sinirsizToggle?: boolean; // "Sınırsız" (Unlimited) toggle göster
  adetGizli?: boolean; // Adet stepper'ı gizle (Face/Character Swap, WAN)
  soul?: boolean; // Higgsfield Soul: + Karakter kartı göster
  varsayilanOran?: string; // Model açılınca varsayılan oran (1:1 / 3:4 / Auto)
};
const GORSEL_MODELLER: GorselModel[] = [
  // ── Öne çıkan modeller ── (Higgsfield birebir composer davranışı)
  { ad: "Vayra Ruh 2.0", ozet: "Yeni nesil ultra-gerçekçi moda görselleri", grup: "one", kredi: 2, soul: true, cozunurluk: true, varsayilanOran: "3:4" },
  { ad: "Vayra Ruh Sinema", ozet: "Sinema kalitesinde görsel üretimi", grup: "one", kredi: 3, soul: true, cozunurluk: true, varsayilanOran: "3:4" },
  { ad: "GPT Image 2", ozet: "Neredeyse kusursuz metinle 4K görsel", rozet: "Yeni", grup: "one", kredi: 7, kaliteSeviye: ["Düşük", "Orta", "Yüksek"], varsayilanOran: "1:1" },
  { ad: "Seedream 5.0 Pro", ozet: "Akıllı görsel akıl yürütmeyle tutarlı görseller", rozet: "Yeni", grup: "one", kredi: 3, cozunurluk: true, varsayilanOran: "3:4" },
  { ad: "Seedream 5.0 lite", ozet: "Akıllı görsel akıl yürütme", rozet: "Sınırsız", grup: "one", kredi: 2, cozunurluk: true, sinirsizToggle: true, varsayilanOran: "3:4" },
  { ad: "Seedream 4.5", ozet: "ByteDance'in yeni nesil 4K görsel modeli", rozet: "Sınırsız", grup: "one", kredi: 2, cozunurluk: true, sinirsizToggle: true, varsayilanOran: "3:4" },
  { ad: "Nano Banana Pro", ozet: "Google'ın amiral gemisi üretim modeli", grup: "one", tip: "vary", cizim: true, kredi: 4, sinirsizToggle: true, varsayilanOran: "3:4" },
  { ad: "Nano Banana 2", ozet: "Flash hızında Pro kalite", grup: "one", tip: "vary", cizim: true, kredi: 3, sinirsizToggle: true, varsayilanOran: "3:4" },
  { ad: "Nano Banana 2 Lite", ozet: "Hızlı, hafif görsel üretimi", rozet: "Yeni", grup: "one", tip: "vary", cizim: true, kredi: 2, sinirsizToggle: true, varsayilanOran: "3:4" },
  { ad: "Recraft V4.1", ozet: "Fotogerçekçi ve etkileyici görsel üretimi", rozet: "Yeni", grup: "one", tip: "recraft", kredi: 1.25, kaliteSeviye: ["Standart", "HD"], varsayilanOran: "1:1" },
  // ── Tüm modeller ──
  { ad: "Auto", ozet: "Her prompt için en iyi model, senin yerine seçilir", grup: "tum", kredi: 2, cozunurluk: true, varsayilanOran: "1:1" },
  { ad: "Nano Banana", ozet: "Google'ın standart üretim modeli", rozet: "Sınırsız", grup: "tum", tip: "vary", cizim: true, kredi: 1, sinirsizToggle: true, varsayilanOran: "3:4" },
  { ad: "Vayra Ruh", ozet: "Ultra-gerçekçi moda görselleri", grup: "tum", kredi: 2, soul: true, cozunurluk: true, varsayilanOran: "3:4" },
  { ad: "Vayra Yüz Değiştir", ozet: "Kusursuz yüz değiştirme", grup: "tum", tip: "swap", kredi: 2, adetGizli: true, varsayilanOran: "3:4" },
  { ad: "Vayra Karakter Değiştir", ozet: "Kusursuz karakter değiştirme", grup: "tum", tip: "swap", kredi: 2, adetGizli: true, varsayilanOran: "3:4" },
  { ad: "Seedream 4.0", ozet: "ByteDance'in gelişmiş görsel düzenleme modeli", grup: "tum", kredi: 1, kaliteSeviye: ["Temel", "Pro"], varsayilanOran: "3:4" },
  { ad: "GPT Image 1.5", ozet: "Gerçek-renk hassas render", grup: "tum", kredi: 2, kaliteSeviye: ["Düşük", "Orta", "Yüksek"], varsayilanOran: "1:1" },
  { ad: "Grok Imagine", ozet: "xAI'nin çok yönlü görsel stilleri", grup: "tum", kredi: 1, kaliteSeviye: ["Standart", "Yüksek"], cozunurluk: true, varsayilanOran: "Auto" },
  { ad: "Recraft V4.1 Utility", ozet: "Düz, eşit ışıkla sade sahneler", rozet: "Yeni", grup: "tum", tip: "recraft", kredi: 1.25, kaliteSeviye: ["Standart", "HD"], varsayilanOran: "1:1" },
  { ad: "Z-Image", ozet: "Anında gerçekçi portreler", grup: "tum", kredi: 0.15, varsayilanOran: "3:4" },
  { ad: "Kling O1", ozet: "Kling'in fotogerçekçi görsel modeli", rozet: "Sınırsız", grup: "tum", kredi: 0.5, cozunurluk: true, sinirsizToggle: true, varsayilanOran: "3:4" },
  { ad: "FLUX.2 Pro", ozet: "Hız için optimize detay", rozet: "Sınırsız", grup: "tum", kredi: 1, cozunurluk: true, sinirsizToggle: true, varsayilanOran: "3:4" },
  { ad: "FLUX.2 Flex", ozet: "Yeni nesil görsel üretimi", grup: "tum", tip: "flux", kredi: 3, cozunurluk: true, varsayilanOran: "3:4" },
  { ad: "FLUX.2 Max", ozet: "En üst hassasiyet ve hız", grup: "tum", kredi: 4, cozunurluk: true, varsayilanOran: "3:4" },
  { ad: "Flux Kontext Max", ozet: "Hassasiyetle düzenle", grup: "tum", tip: "kontext", kredi: 1.5, varsayilanOran: "3:4" },
  { ad: "GPT Image", ozet: "Çok yönlü metinden görsele AI", rozet: "Sınırsız", grup: "tum", kredi: 2, kaliteSeviye: ["Düşük", "Orta", "Yüksek"], sinirsizToggle: true, varsayilanOran: "1:1" },
  { ad: "Çoklu Referans", ozet: "Tek seferde çoklu düzenleme", rozet: "Sınırsız", grup: "tum", tip: "kontext", kredi: 1.5, varsayilanOran: "3:4" },
  { ad: "WAN 2.2", ozet: "Yüksek sadakatli sinematik görseller", grup: "tum", tip: "kontext", kredi: 1, adetGizli: true, varsayilanOran: "3:4" },
];
// Aktif modelin tanımını getir (composer davranışını buradan sürer).
function modelBul(ad: string): GorselModel {
  return GORSEL_MODELLER.find((m) => m.ad === ad) ?? GORSEL_MODELLER[0];
}

// Higgsfield /ai/image en-boy oranları — dikeyden yataya doğru sıralı (Higgsfield birebir),
// her oranın w/h değeri satırdaki şekil ikonunu gerçek orana göre çizmek için.
const ORANLAR: { deger: string; w: number; h: number; sinematik?: boolean }[] = [
  { deger: "9:16", w: 9, h: 16 },
  { deger: "3:4", w: 3, h: 4 },
  { deger: "2:3", w: 2, h: 3 },
  { deger: "1:1", w: 1, h: 1 },
  { deger: "4:3", w: 4, h: 3 },
  { deger: "3:2", w: 3, h: 2 },
  { deger: "16:9", w: 16, h: 9, sinematik: true },
  { deger: "21:9", w: 21, h: 9, sinematik: true },
];

// Oran şekil ikonu — Higgsfield gibi, gerçek en-boy oranını yansıtan çerçeve.
function OranIkon({ w, h, className }: { w: number; h: number; className?: string }) {
  const KUTU = 18; // ikon çizim alanı (px)
  const olcek = w >= h ? KUTU / w : KUTU / h;
  const gw = Math.max(6, Math.round(w * olcek));
  const gh = Math.max(6, Math.round(h * olcek));
  return (
    <span className={cn("flex h-[18px] w-[18px] items-center justify-center", className)} aria-hidden>
      <span
        className="rounded-[3px]"
        style={{ width: gw, height: gh, border: "2px solid #ffffff", boxShadow: "0 0 0 0.5px rgba(0,0,0,0.4)" }}
      />
    </span>
  );
}

/* ── Varlık görüntüleyici (lightbox) araç paneli ──────────────────────
   Higgsfield /ai/image asset viewer'ın araç rayı + drill-down alt panelleri. */
type AracId =
  | "renk" | "upscale" | "iyilestirici" | "isik" | "inpaint" | "acilar" | "reframe" | "arkaplan";

// Higgsfield "EDIT IMAGE" araçları birebir: 6 araç, hepsi drill-down alt-panel açar.
const ARACLAR: { id: AracId; ad: string; ikon: typeof RefreshCw; rozet?: string }[] = [
  { id: "renk", ad: "Renk Derecelendirme", ikon: Palette, rozet: "Yeni" },
  { id: "upscale", ad: "Upscale", ikon: Maximize2 },
  { id: "iyilestirici", ad: "İyileştirici", ikon: Wand2 },
  { id: "isik", ad: "Yeniden Işıklandır", ikon: Sun },
  { id: "inpaint", ad: "İç Boyama", ikon: Scissors },
  { id: "reframe", ad: "Yeniden Çerçevele", ikon: Crop },
  { id: "arkaplan", ad: "Arka Planı Kaldır", ikon: Eraser },
  { id: "acilar", ad: "Açılar", ikon: RotateCcw },
];

// Renk Derecelendirme presetleri (3×3)
const RENK_PRESETLERI = [
  "None", "Doğal", "S&B Film",
  "Split Tone", "Yumuşak Ten", "Doğa",
  "Sinematik", "16mm Film", "Eski Lens",
];

// Akordiyon efekt bölümleri: her biri kendi slider'larıyla
type EfektBolum = { id: string; ad: string; sliderlar: { ad: string; min: number; max: number; on: number }[] };
const EFEKT_BOLUMLERI: EfektBolum[] = [
  { id: "renk-duzelt", ad: "Renk Düzelt", sliderlar: [{ ad: "Sıcaklık", min: -100, max: 100, on: 0 }, { ad: "Ton", min: -100, max: 100, on: 0 }, { ad: "Doygunluk", min: -100, max: 100, on: 0 }] },
  { id: "detay-yumusat", ad: "Detay Yumuşat", sliderlar: [{ ad: "Miktar", min: 0, max: 100, on: 40 }] },
  { id: "bloom", ad: "Bloom", sliderlar: [{ ad: "Şiddet", min: 0, max: 100, on: 25 }, { ad: "Eşik", min: 0, max: 100, on: 60 }] },
  { id: "halation", ad: "Halation", sliderlar: [{ ad: "Miktar", min: 0, max: 100, on: 30 }] },
  { id: "lens-talimatlari", ad: "Lens Talimatları", sliderlar: [{ ad: "Bozulma", min: -100, max: 100, on: 0 }, { ad: "Vinyet", min: 0, max: 100, on: 20 }] },
  { id: "pozlama", ad: "Pozlama", sliderlar: [{ ad: "Pozlama", min: -100, max: 100, on: 0 }, { ad: "Kontrast", min: -100, max: 100, on: 0 }] },
  { id: "film-grain", ad: "Film Grain", sliderlar: [{ ad: "Miktar", min: 0, max: 100, on: 15 }, { ad: "Boyut", min: 0, max: 100, on: 50 }] },
];

// Upscale modelleri
const UPSCALE_MODELLERI = [
  { ad: "Topaz", ozet: "Genel amaçlı varsayılan model" },
  { ad: "Vayra Upscale", ozet: "Yüksek kaliteli detay yeniden yapılandırma" },
  { ad: "Nano", ozet: "Hızlı, düşük kredili büyütme" },
];
const UPSCALE_OLCEK = ["x1", "x2", "x4", "x8", "x16"];

// Görsel ızgarası — gerçek stok görsellerinden justified feed (SSR güvenli, deterministik)
// Ana galeri feed — GERÇEK AI-üretimi çeşitli görseller (Nano Banana ile üretildi).
// 6 kategori × 12 = 72 görsel. Higgsfield örnek/topluluk galerisi birebir.
const GALERI_KATEGORILERI = ["portre", "urun", "sinematik", "soyut", "manzara", "3d"] as const;
const TUM_GORSELLER = GALERI_KATEGORILERI.flatMap((kat) =>
  Array.from({ length: 12 }, (_, i) => `/gercek/galeri/${kat}${i + 1}.webp`),
);

/* GÖMÜLÜ MOD ayrıntıları: @/components/studyo/tipler
   (2026-08-02) — /panel/projeler/[id] "Tüm varlıklar" sekmesi bu
   sayfayı `gomulu` ile mount eder ve YALNIZ composer'ı gösterir. Composer
   kopyalanmaz: burada ne varsa orada da BİREBİR o çalışır; tek kaynak.
   `onUretildi`: üretim projeye/klasöre bağlansın diye çağrılır. */
export function GorselStudyo({ gomulu, projeId, onUretildi }: StudyoGomuluProps = {}) {
  const { aktifProjeId: seciliProjeId } = useAktifProje();
  /* Gömülüyken üretim GÖMÜLDÜĞÜ projeye yazılır — tüm `uretimBaslat`
     çağrıları zaten bu değeri kullanıyor, tek yerden yönlendirmek yeterli. */
  const aktifProjeId = gomulu && projeId ? projeId : seciliProjeId;
  /* Tek sarmalayıcı: her `uretimBaslat` çağrısını tek tek değiştirmek yerine
     burada yakalayıp gömen sayfaya haber veriyoruz (klasöre atama vb.). */
  const uretimBaslat: typeof uretimBaslatHam = (istek) => {
    const s = uretimBaslatHam(istek);
    if (s.ok && s.id) onUretildi?.(s.id);
    return s;
  };
  const { kullanici } = useAuth();
  const elementEkleStore = useElements((s) => s.ekle);
  const elementListe = useElements((s) => s.elementler);
  // Gerçek görsel üretimlerin — ızgaranın BAŞINA gelir (Higgsfield canlılık).
  // useMemo: selector'da .filter yeni referans üretip sonsuz döngü yaratır (bilinen bug).
  const tumUretimler = useProjeler((s) => s.uretimler);
  const silUretim = useProjeler((s) => s.sil);
  const guncelle = useProjeler((s) => s.guncelle);
  // Kart menüsündeki "Klasöre ekle" için gerçek koleksiyon store'u.
  const koleksiyonlar = useKoleksiyon((s) => s.koleksiyonlar);
  const koleksiyonOlustur = useKoleksiyon((s) => s.olustur);
  const koleksiyonaEkle = useKoleksiyon((s) => s.uretimEkle);
  // Çoklu seçim (Higgsfield birebir: sol-üst kutu → seçim toolbar'ı)
  const secililer = useSecim((s) => s.secililer);
  const secimToggle = useSecim((s) => s.toggle);
  const secimTemizle = useSecim((s) => s.temizle);
  const secimVar = secililer.length > 0;
  // Sayfadan ayrılınca seçimi temizle (seçim geçici UI durumu).
  useEffect(() => () => secimTemizle(), [secimTemizle]);
  const gorselUretimleri = useMemo(
    () => tumUretimler.filter((u) => u.tur === "gorsel" && (u.durum === "tamam" || u.durum === "isleniyor" || u.durum === "kuyrukta" || u.durum === "hata")),
    [tumUretimler],
  );
  const [prompt, setPrompt] = useState("iMac, Apple klavye, Magic Mouse");
  const [modelAcik, setModelAcik] = useState(false);
  const [model, setModel] = useState("Seedream 5.0 lite");
  // Soul (Ruh) modeli seçiliyse composer'a Karakter + Moodboard + Renk Transferi panelleri gelir.
  // Aktif modelin composer tipini sür (Higgsfield birebir: model → farklı composer).
  const aktifModelTanim = modelBul(model);
  const modelTip: ModelTip = aktifModelTanim.tip ?? "standart";
  const soulMu = Boolean(aktifModelTanim.soul); // Higgsfield Soul: + Karakter kartı
  const swapMu = modelTip === "swap";
  const yuzMu = /yüz|face/i.test(model); // Yüz Değiştir vs Karakter Değiştir metin farkı
  // Modele özel kalite seviyesi (çözünürlük yerine): Düşük/Orta/Yüksek vb.
  const [kaliteSeviye, setKaliteSeviye] = useState<string>("");
  const [kaliteSeviyeAcik, setKaliteSeviyeAcik] = useState(false);
  const kaliteSecenek = aktifModelTanim.kaliteSeviye;
  // Aktif kalite seviyesi geçerli değilse ilk seçeneğe düş.
  const aktifKalite = kaliteSecenek && kaliteSecenek.includes(kaliteSeviye) ? kaliteSeviye : (kaliteSecenek?.[0] ?? "");
  // Model seç: seçince modelin varsayılan oranını + kalite seviyesini uygula (Higgsfield birebir).
  const modelSec = (ad: string) => {
    setModel(ad);
    const t = modelBul(ad);
    if (t.varsayilanOran && ORANLAR.some((o) => o.deger === t.varsayilanOran)) setOran(t.varsayilanOran);
    setKaliteSeviye(t.kaliteSeviye?.[0] ?? "");
  };
  const [karakterModal, setKarakterModal] = useState(false);
  const [seciliKarakter, setSeciliKarakter] = useState<string | null>(null);
  const [karakterSekme, setKarakterSekme] = useState<"tumu" | "soul" | "soul2" | "sinema">("tumu");
  const [moodboardModal, setMoodboardModal] = useState(false);
  const [seciliMoodboard, setSeciliMoodboard] = useState("Genel");
  const [moodAra, setMoodAra] = useState("");
  const [renkModal, setRenkModal] = useState(false);
  const [seciliRenk, setSeciliRenk] = useState<string | null>(null);
  // ── Modele özel composer durumları ──
  const [swapKaynak, setSwapKaynak] = useState<string | null>(null); // Your Photo (kaynak yüz/karakter)
  const [swapHedef, setSwapHedef] = useState<string | null>(null);   // Target Image (hedef görsel)
  const swapKaynakRef = useRef<HTMLInputElement>(null);
  const swapHedefRef = useRef<HTMLInputElement>(null);
  const [vektorMod, setVektorMod] = useState(false);        // Recraft: Vektör (SVG) modu
  const [kaliteMod, setKaliteMod] = useState<"Standart" | "HD">("Standart"); // Recraft kalite
  const [promptGelistir, setPromptGelistir] = useState(true); // Kontext: Prompt geliştir aç/kapa
  const [cfg, setCfg] = useState(5);                        // FLUX: Prompt Gücü (CFG)
  const [kaliteAdim, setKaliteAdim] = useState(30);         // FLUX: Kalite Adımları
  const [fluxAyarAcik, setFluxAyarAcik] = useState(false);  // FLUX ayar popover
  const [cizimModal, setCizimModal] = useState(false);      // Draw → çizim modalı
  const [cizimSekme, setCizimSekme] = useState<"sketch" | "draw" | "edit">("edit");
  const [cizimModelAcik, setCizimModelAcik] = useState(false);  // çizim modalı model dropdown'u
  const cizimCanvasRef = useRef<CizimCanvasRef | null>(null);   // GERÇEK çizim tuvali ref'i
  // Nav mega-panelinden ?model=… ile gelindiğinde o modeli seçili başlat (Higgsfield birebir).
  const aramaParam = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    const istenen = aramaParam.get("model");
    if (!istenen) return;
    const norm = (s: string) => s.toLowerCase().replace(/vayra\s*/g, "").replace(/[^a-z0-9]/g, "");
    const hedef = norm(istenen);
    const bulunan = GORSEL_MODELLER.find((m) => norm(m.ad) === hedef || norm(m.ad).includes(hedef) || hedef.includes(norm(m.ad)));
    if (bulunan) setModel(bulunan.ad);
  }, [aramaParam]);
  const [modelAra, setModelAra] = useState("");
  const [oran, setOran] = useState("1:1");
  const [oranAcik, setOranAcik] = useState(false);
  const [cozunurluk, setCozunurluk] = useState("4K");
  const [cozunurlukAcik, setCozunurlukAcik] = useState(false);
  const COZUNURLUKLER = ["1K", "2K", "4K"];
  const [adet, setAdet] = useState(1);
  const [mobilModelAcik, setMobilModelAcik] = useState(false);
  const [elementSeciciAcik, setElementSeciciAcik] = useState(false);
  const [sinirsiz, setSinirsiz] = useState(false);
  const [boyut, setBoyut] = useState(30);        // ızgaraya uygulanan (yalnız bırakınca)
  const [boyutGorsel, setBoyutGorsel] = useState(30); // slider thumb'ı (anlık)
  // Sürüklerken ızgarayı yeniden düzenleme (kasma) YAPMA; sadece bırakınca uygula.
  const boyutuKomite = () => { setBoyut(boyutGorsel); };
  const [hover, setHover] = useState<string | null>(null);
  const [begeni, setBegeni] = useState<string[]>([]);
  const [menu, setMenu] = useState<string | null>(null);

  // ── Varlık görüntüleyici (lightbox) ──
  const [seciliKart, setSeciliKart] = useState<string | null>(null); // görsel URL | null
  const [aktifArac, setAktifArac] = useState<AracId | null>(null);
  const [lbSekme, setLbSekme] = useState<"info" | "araclar" | "yorumlar">("info"); // Higgsfield: Info/Tools/Comments
  const [yorum, setYorum] = useState("");
  // Renk derecelendirme durumu
  const [preset, setPreset] = useState("None");
  const [efektAcik, setEfektAcik] = useState<Record<string, boolean>>({});
  const [efektGenis, setEfektGenis] = useState<string | null>("renk-duzelt");
  // Upscale durumu
  const [upModel, setUpModel] = useState("Topaz");
  const [upModelAcik, setUpModelAcik] = useState(false);
  const [upOlcek, setUpOlcek] = useState("x2");
  const [upGelismis, setUpGelismis] = useState(false);
  const [upKeskinlik, setUpKeskinlik] = useState(30);
  const [upDenoise, setUpDenoise] = useState(20);
  const [upYuz, setUpYuz] = useState(false);
  // Referans görsel (composer + butonuyla yüklenir; üretimde prompt'a not düşer)
  const [referanslar, setReferanslar] = useState<{ ad: string; url: string }[]>([]);
  // m54: stok galeriden gizlenen görseller (kullanıcı "Sil" der demez galeriden çıkar).
  const [gizliStok, setGizliStok] = useState<string[]>([]);
  const [medyaOnizle, setMedyaOnizle] = useState<string | null>(null); // referans tam-ekran önizleme (madde 11)
  // Prompt kutusu elle-yükseklik (dock TEPESİNDEKİ tutamaktan sürüklenir).
  // null = otomatik büyüme. Tutamak dock'un en üstünde sabit durur.
  const [promptYuk, setPromptYuk] = useState<number | null>(null);
  const promptRef = useRef<HTMLTextAreaElement | null>(null);
  const promptSurukle = (e: React.PointerEvent) => {
    e.preventDefault();
    const ta = promptRef.current;
    const baslaY = e.clientY;
    const baslaH = ta ? ta.getBoundingClientRect().height : (promptYuk ?? 48);
    const tasi = (ev: PointerEvent) => setPromptYuk(Math.max(48, Math.min(340, baslaH + (baslaY - ev.clientY))));
    const birak = () => { window.removeEventListener("pointermove", tasi); window.removeEventListener("pointerup", birak); };
    window.addEventListener("pointermove", tasi);
    window.addEventListener("pointerup", birak);
  };
  const medyaRef = useRef<HTMLInputElement>(null);
  const referansYukle = (dosyalar: FileList | null) => {
    if (!dosyalar?.length) return;
    Array.from(dosyalar).slice(0, 4).forEach((d) => {
      const okuyucu = new FileReader();
      okuyucu.onload = () => setReferanslar((v) => [...v, { ad: d.name, url: String(okuyucu.result) }].slice(0, 4));
      okuyucu.readAsDataURL(d);
    });
    toast.success("Referans eklendi 🖼", { description: "Üretimde bu görsel(ler) referans alınacak" });
  };

  // Swap modelleri için tek görsel yükleyici (kaynak/hedef kutuları).
  const swapYukle = (dosyalar: FileList | null, hedef: "kaynak" | "hedef") => {
    const d = dosyalar?.[0];
    if (!d) return;
    const okuyucu = new FileReader();
    okuyucu.onload = () => {
      const url = String(okuyucu.result);
      if (hedef === "kaynak") setSwapKaynak(url); else setSwapHedef(url);
    };
    okuyucu.readAsDataURL(d);
  };

  // Üretilen görseli composer'a referans olarak ekle (Higgsfield birebir).
  // gorselUrl CSS gradient/url() olabilir → saltUrl ile ham görsel adresini çıkar (boş kutu bug fix).
  const referansEkle = (ham: string) => {
    const url = saltUrl(ham) ?? ham;
    if (!/^(data:|https?:|\/)/.test(url)) { toast.error("Bu görsel referans olarak eklenemedi"); return; }
    setReferanslar((v) => {
      if (v.some((r) => r.url === url)) { toast("Bu görsel zaten referansta"); return v; }
      return [...v, { ad: "Üretilen görsel", url }].slice(0, 4);
    });
    toast.success("Referans olarak eklendi 🖼", { description: "Sonraki üretim bu görseli referans alacak." });
  };

  // m7/m13: referans köprüsünü dinle — UretimDetay "Referans" dediğinde (aynı sayfa
  // veya başka türden yönlendirilerek gelindiğinde) görseli composer'a GERÇEKTEN ekle.
  const refIstek = useReferansKopru((s) => s.istek);
  const refTuket = useReferansKopru((s) => s.tuket);
  useEffect(() => {
    if (!refIstek) return;
    // Görsel referansı: url varsa doğrudan referans listesine ekle.
    if (refIstek.url && /^(data:|https?:|\/)/.test(refIstek.url)) {
      setReferanslar((v) => {
        if (v.some((r) => r.url === refIstek.url)) return v;
        return [...v, { ad: refIstek.baslik || "Referans", url: refIstek.url }].slice(0, 4);
      });
      toast.success("Referans olarak eklendi 🖼", { description: "Sonraki üretim bu görseli referans alacak." });
    } else if (refIstek.prompt) {
      // görsel yoksa prompt'u composer'a taşı
      setPrompt((p) => (p ? p : refIstek.prompt));
      toast.success("Referans prompt eklendi", { description: refIstek.baslik });
    }
    refTuket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refIstek]);

  /* AYAR GERİ YÜKLEME — detay panelindeki "Bu ayarlarla üret" düğmesini dinler.
     Üretimin gerçekten kullandığı model/oran/çözünürlük/prompt/referans
     composer'a birebir uygulanır (kullanıcı kararı 2026-07-31). */
  const ayarIstek = useAyarKopru((s) => s.istek);
  const ayarTuket = useAyarKopru((s) => s.tuket);
  useEffect(() => {
    if (!ayarIstek || ayarIstek.tur !== "gorsel") return;
    if (ayarIstek.prompt) setPrompt(ayarIstek.prompt);
    // Model/oran/çözünürlük yalnızca bu sayfanın tanıdığı bir değerse uygulanır;
    // tanımadığı bir değeri set etmek seçiciyi boş gösterirdi.
    if (ayarIstek.model) setModel(ayarIstek.model);
    if (ayarIstek.oran) setOran(ayarIstek.oran);
    if (ayarIstek.cozunurluk) setCozunurluk(ayarIstek.cozunurluk);
    if (ayarIstek.referanslar?.length) {
      setReferanslar((v) => {
        const yeni = [...v];
        for (const r of ayarIstek.referanslar!) {
          if (!yeni.some((x) => x.url === r.url)) yeni.push(r);
        }
        return yeni.slice(0, 4);
      });
    }
    ayarTuket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ayarIstek]);

  /* Kart menüsü "Klasöre ekle" alt-menüsü için GERÇEK klasör listesi (madde 1).
     Adet bilgisi kullanıcıya hangi klasörün dolu olduğunu gösterir. */
  const klasorListesi = useMemo(
    () => koleksiyonlar.map((k) => ({ id: k.id, ad: k.ad, adet: k.uretimIdler.length })),
    [koleksiyonlar],
  );
  /** Bir üretimi/stok görseli seçilen klasöre ekler. */
  const klasoreEkle = (klasorId: string, uretimId: string) => {
    koleksiyonaEkle(klasorId, uretimId);
    const k = koleksiyonlar.find((x) => x.id === klasorId);
    toast.success("Klasöre eklendi", { description: k?.ad });
  };
  /* Yeni klasör — GERÇEK isim sorma ekranı (kullanıcı kararı 2026-07-31).
     Önce "Klasör 3" gibi otomatik ad veriyordu; kullanıcı adı belirleyemiyordu.
     Artık GirdiModal açılır, ad girilir, klasör kurulup varlık içine eklenir. */
  const [yeniKlasorIcin, setYeniKlasorIcin] = useState<string | null>(null);
  const yeniKlasoreEkle = (uretimId: string) => setYeniKlasorIcin(uretimId);
  const yeniKlasorKaydet = (ad: string) => {
    const temiz = ad.trim();
    const hedef = yeniKlasorIcin;
    setYeniKlasorIcin(null);
    if (!temiz || !hedef) return;
    const kid = koleksiyonOlustur(temiz);
    koleksiyonaEkle(kid, hedef);
    toast.success("Klasör oluşturuldu", { description: `${temiz} — 1 varlık` });
  };

  /* "Yeniden kullan" — bir ÜRETİMİ composer'a geri yükler (2026-08-02).
     Kullanıcı: "kopyaladığımızda 'AI Stilist · Editorial · 1:1 · 1 adet'
     olarak prompt kutusuna ekliyor, bu yanlış — sadece promptu yazacak,
     diğerlerini AYAR olarak seçecek."

     Kök neden: kart menüsündeki kopyalama, `u.prompt`u ham hâliyle yazıyordu;
     o alan ise üretim sırasında eklenen ayar notlarını (" · 1:1", " · 4K"…)
     taşıyor. Doğrusu: metin olarak yalnız kullanıcının YAZDIĞI istem
     (`hamIstem`, eski kayıtlarda `istemTemizle` ile ayıklanır); model/oran/
     çözünürlük ise gerçek seçici durumlarına yazılır. */
  const uretimiGeriYukle = (u?: { prompt?: string; baslik?: string; model?: string; meta?: Record<string, unknown> } | null) => {
    if (!u) return;
    const p = (u.meta?.hamIstem as string | undefined) ?? istemTemizle(u.prompt || u.baslik || "");
    if (p) setPrompt(p);
    if (u.model) setModel(u.model);
    const o = u.meta?.oran as string | undefined;
    const c = u.meta?.cozunurluk as string | undefined;
    if (o) setOran(o);
    if (c) setCozunurluk(c);
    toast.success("Ayarlar composer'a yüklendi", {
      description: [u.model, c, o].filter(Boolean).join(" · ") || undefined,
    });
  };

  /* "Bu ayarlarla üret" — açık üretimin GERÇEKTEN kullandığı her şeyi
     composer'a yükler ve lightbox'ı kapatır. Bu sayfanın kendi state'ine
     doğrudan yazar (köprüye gerek yok — aynı bileşen ağacındayız). */
  const ayarlariComposeraYukle = () => {
    const u = acikUretim;
    /* ÖNCE hamIstem: `prompt` alanında ayar notları var (" · 4K" gibi) ve
       onu yazmak her geri yüklemede metni şişiriyordu. Eski kayıtlarda
       hamIstem yoksa notları söküp temizleyerek düşeriz. */
    const p = u?.meta?.hamIstem ?? istemTemizle(u?.prompt || acikPrompt);
    if (p) setPrompt(p);
    if (u?.model) setModel(u.model);
    if (u?.meta?.oran) setOran(u.meta.oran);
    if (u?.meta?.cozunurluk) setCozunurluk(u.meta.cozunurluk);

    // Üretimin kendi görseli sonraki işe referans olur.
    const refUrl = saltUrl(u?.gorselUrl ?? seciliKart ?? "") ?? "";
    if (refUrl && /^(data:|https?:|\/)/.test(refUrl)) {
      setReferanslar((v) => (v.some((r) => r.url === refUrl)
        ? v
        : [...v, { ad: u?.baslik || "Referans", url: refUrl }].slice(0, 4)));
    }

    toast.success("Ayarlar composer'a yüklendi", {
      description: [u?.model ?? model, u?.meta?.cozunurluk, u?.meta?.oran].filter(Boolean).join(" · ") || undefined,
    });
    lightboxKapat();
  };

  // "Animate" → görseli video stüdyosuna başlangıç karesi olarak taşı ve yönlendir.
  const animasyonaGec = (url: string) => {
    if (typeof window !== "undefined") sessionStorage.setItem("vayra-animate-ref", url);
    toast.success("Video stüdyosuna aktarılıyor 🎬");
    router.push("/panel/video");
  };

  // "3D sahne oluştur" → görseli 3D stüdyosuna referans olarak taşı ve yönlendir.
  const sahne3dOlustur = (url: string) => {
    if (typeof window !== "undefined") sessionStorage.setItem("vayra-3d-ref", url);
    toast.success("3D sahne oluşturuluyor 🧊", { description: "Görselden 3D model üretiliyor." });
    router.push("/panel/3d");
  };

  // Element seçici popup (Higgsfield "Elements" — @ referansı). Seçilen elementi prompt'a ekler.
  const [elementSeciciModal, setElementSeciciModal] = useState(false);
  const elementEkle = (ad: string) => {
    setPrompt((p) => `${p}${p && !p.endsWith(" ") ? " " : ""}@${ad} `);
    setElementSeciciModal(false);
    toast.success(`@${ad} eklendi`, { description: "Referans prompt'a bağlandı" });
  };
  // Yeni Element modalı
  const [elementModal, setElementModal] = useState(false);
  const [elementAd, setElementAd] = useState("Freya");
  const [elementAciklama, setElementAciklama] = useState("");
  const [elementKategori, setElementKategori] = useState("Oto");
  const [elementKategoriAcik, setElementKategoriAcik] = useState(false);
  const [elementMedya, setElementMedya] = useState<string | null>(null);
  const elementMedyaRef = useRef<HTMLInputElement>(null);

  /* Element Stüdyosu'ndan "Kullan" ile gelen element — composer'a ekle.
     Eskiden o buton yalnız sayaç artırıp toast gösteriyordu; kullanıcı
     elementi hiçbir yerde kullanamıyordu (bildirilen hata). Artık element
     sayfası sessionStorage'a yazıp buraya yönlendiriyor, burada tüketiliyor. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ad = sessionStorage.getItem("vayra-element-kullan");
    if (!ad) return;
    sessionStorage.removeItem("vayra-element-kullan");
    setPrompt((p) => `${p}${p && !p.endsWith(" ") ? " " : ""}@${ad} `);
    toast.success(`@${ad} eklendi`, { description: "Referans prompt'a bağlandı" });
  }, []);

  const modelListe = GORSEL_MODELLER.filter((m) => m.ad.toLocaleLowerCase("tr").includes(modelAra.toLocaleLowerCase("tr")));

  // Lightbox/modal açıkken arka plan sayfası SABİT kalır (madde 10).
  useScrollKilit(seciliKart !== null || elementModal || medyaOnizle !== null || karakterModal || moodboardModal || renkModal || cizimModal);
  // Escape: en üstteki katmanı kapat (Soul modalları → medya önizleme → element → lightbox).
  useEscKapat(seciliKart !== null || elementModal || medyaOnizle !== null || karakterModal || moodboardModal || renkModal || cizimModal, () => {
    if (cizimModal) setCizimModal(false);
    else if (renkModal) setRenkModal(false);
    else if (moodboardModal) setMoodboardModal(false);
    else if (karakterModal) setKarakterModal(false);
    else if (medyaOnizle !== null) setMedyaOnizle(null);
    else if (elementModal) setElementModal(false);
    else if (seciliKart !== null) setSeciliKart(null);
  });
  // Escape: açık composer dropdown'larını da kapat (Higgsfield birebir).
  useEscKapat(modelAcik || oranAcik || cozunurlukAcik, () => {
    setModelAcik(false); setOranAcik(false); setCozunurlukAcik(false);
  });

  // Lightbox aç
  const lightboxAc = (url: string) => { setSeciliKart(url); setAktifArac(null); setLbSekme("info"); };
  const lightboxKapat = () => { setSeciliKart(null); setAktifArac(null); };
  const lbImgRef = useRef<HTMLImageElement>(null);

  // ── Soul hero'ları (Karakter / Ruh panosu / Renk transferi): gerçek dosya yükleme + üretim ──
  const soulRef = useRef<HTMLInputElement>(null);
  const soulTuru = useRef<"karakter" | "moodboard" | "renk">("karakter");
  const soulAc = (tur: "karakter" | "moodboard" | "renk") => { soulTuru.current = tur; soulRef.current?.click(); };
  const soulYukle = (dosyalar: FileList | null) => {
    const tur = soulTuru.current;
    if (!dosyalar?.length) return;
    const okuyucu = new FileReader();
    okuyucu.onload = () => {
      const url = String(okuyucu.result);
      if (tur === "karakter") {
        const sonuc = uretimBaslat({ baslik: "Karakter eğitimi", tur: "gorsel", model: "Ruh Karakter", prompt: "Yüklenen fotoğraflardan karakter eğitiliyor", kredi: 5, arac: "Karakter", projeId: aktifProjeId ?? undefined, meta: { oran, cozunurluk } });
        if (!sonuc.ok) return uretimHataToast(sonuc, "Karakter oluşturulamadı");
        toast.success("Karakterin eğitiliyor 📸", { description: "Fotoğraflarından tutarlı karakter üretiliyor · 5 kredi" });
        setKarakterModal(false);
      } else if (tur === "moodboard") {
        const sonuc = uretimBaslat({ baslik: "Ruh panosu", tur: "gorsel", model: "Ruh Panosu", prompt: "Referanslardan ruh panosu üretiliyor", kredi: 2, arac: "Moodboard", projeId: aktifProjeId ?? undefined, meta: { oran, cozunurluk } });
        if (!sonuc.ok) return uretimHataToast(sonuc, "Pano oluşturulamadı");
        setSeciliMoodboard("Özel pano");
        setReferanslar((v) => [...v, { ad: "Ruh panosu", url }].slice(0, 4));
        toast.success("Ruh panosu oluşturuluyor ✦", { description: "Referanslarından özel pano üretiliyor · 2 kredi" });
        setMoodboardModal(false);
      } else {
        const sonuc = uretimBaslat({ baslik: "Renk transferi", tur: "gorsel", model: "Vayra Hex", prompt: "Referans görselden renk paleti çıkarılıyor", kredi: 1, arac: "Renk Transferi", projeId: aktifProjeId ?? undefined, meta: { oran, cozunurluk } });
        if (!sonuc.ok) return uretimHataToast(sonuc, "Palet çıkarılamadı");
        setReferanslar((v) => [...v, { ad: "Renk referansı", url }].slice(0, 4));
        toast.success("Renk paleti çıkarılıyor ✦", { description: "Yüklediğin görselden palet üretiliyor · 1 kredi" });
        setRenkModal(false);
      }
    };
    okuyucu.readAsDataURL(dosyalar[0]);
  };
  // seciliKart'ın TUM_GORSELLER içindeki konumu (ileri/geri navigasyon için). Üretilen/harici görselde -1.
  const lbIndex = seciliKart ? TUM_GORSELLER.indexOf(seciliKart) : -1;

  /* Açık görselin KENDİ kayıtlı üretimi.
     Lightbox'a eskiden composer'ın CANLI `prompt` state'i veriliyordu; bu
     yüzden "yeşil elma" üretip composer'a "armut" yazınca, elmanın
     detayında "armut" görünüyordu (bildirilen hata). Artık üretim kaydından
     okunur; kayıt yoksa (stok galeri görseli) alan boş bırakılır —
     composer metnini göstermek her hâlükârda yanlış bilgi olur. */
  const acikUretim = useMemo(() => {
    if (!seciliKart) return undefined;
    const hedef = saltUrl(seciliKart) ?? seciliKart;
    return tumUretimler.find((u) => {
      const g = saltUrl(u.gorselUrl) ?? u.gorselUrl;
      const t = saltUrl(u.thumbnailUrl) ?? u.thumbnailUrl;
      return g === hedef || t === hedef;
    });
  }, [seciliKart, tumUretimler]);
  /** Lightbox'ta gösterilecek prompt — üretimin kendi metni. */
  const acikPrompt = acikUretim?.prompt ?? "";

  /* GÖRSEL ADI (madde 3) — lightbox başlığında düzenlenir, indirme dosya adı
     olarak kullanılır. Üretim kaydı varsa onun `baslik` alanına yazılır
     (kalıcı); stok görselde oturum içi ad tutulur. */
  const [adDuzenleniyor, setAdDuzenleniyor] = useState(false);
  const [adTaslak, setAdTaslak] = useState("");
  const [stokAdlari, setStokAdlari] = useState<Record<string, string>>({});
  const gorselAdi = useMemo(() => {
    if (acikUretim?.baslik) return acikUretim.baslik;
    if (seciliKart && stokAdlari[seciliKart]) return stokAdlari[seciliKart];
    return "İsimsiz görsel";
  }, [acikUretim, seciliKart, stokAdlari]);
  const adKaydet = () => {
    const yeni = adTaslak.trim();
    setAdDuzenleniyor(false);
    if (!yeni || yeni === gorselAdi) return;
    if (acikUretim) guncelle(acikUretim.id, { baslik: yeni });
    else if (seciliKart) setStokAdlari((v) => ({ ...v, [seciliKart]: yeni }));
    toast.success("Ad güncellendi", { description: `${yeni}.png olarak inecek` });
  };

  // Önceki/sonraki üretime geç (Higgsfield birebir sağ/sol ok).
  const lightboxGez = (yon: 1 | -1) => {
    if (lbIndex < 0) return;
    const yeni = lbIndex + yon;
    if (yeni < 0 || yeni >= TUM_GORSELLER.length) return;
    setSeciliKart(TUM_GORSELLER[yeni]);
    setAktifArac(null);
  };
  // Görselin KENDİSİNİ tarayıcı tam ekranına al (o modal ekranı değil).
  const tamEkranAc = () => {
    const el = lbImgRef.current;
    if (!el) return;
    if (document.fullscreenElement) { document.exitFullscreen?.(); return; }
    (el.requestFullscreen?.() ?? Promise.reject()).catch(() => toast.error("Tam ekran açılamadı."));
  };

  // Araç rayı tıklaması → ya alt panel aç ya da doğrudan aksiyon
  // Higgsfield birebir: tüm "EDIT IMAGE" araçları drill-down alt-panel açar.
  const aracTikla = (id: AracId) => { setAktifArac(id); };
  // İyileştir / Işık / Açılar için basit üretim eylemi (alt panelde "Uygula" ile tetiklenir).
  const aracUygula = (ad: string, kredi: number, ek: string) => {
    const sonuc = uretimBaslat({ baslik: ad, tur: "gorsel", model: ad, prompt: (prompt || "görsel") + " · " + ek, kredi, arac: ad, projeId: aktifProjeId ?? undefined, meta: { oran, cozunurluk } });
    if (!sonuc.ok) return uretimHataToast(sonuc, "İşlenemedi");
    toast.success(`${ad} başladı ✦`, { description: `${ek} · ${kredi} kredi` });
    setAktifArac(null);
  };

  const efektUygula = () => {
    const etiket = preset === "None" ? "Özel ayarlar" : preset;
    const sonuc = uretimBaslat({ baslik: `Renk · ${etiket}`, tur: "gorsel", model: "Renk Derecelendirme", prompt: (prompt || "görsel") + " · renk: " + etiket, kredi: 1, arac: "Renk", projeId: aktifProjeId ?? undefined, meta: { oran, cozunurluk } });
    if (!sonuc.ok) return uretimHataToast(sonuc, "Efekt uygulanamadı");
    toast.success("Efekt uygulanıyor ✦", { description: `${etiket} · 1 kredi` });
    setAktifArac(null);
  };
  const upscaleUygula = () => {
    const sonuc = uretimBaslat({ baslik: `Upscale ${upOlcek}`, tur: "gorsel", model: upModel, prompt: (prompt || "görsel") + ` · upscale ${upOlcek}`, kredi: 2, arac: "Upscale", projeId: aktifProjeId ?? undefined, meta: { oran, cozunurluk } });
    if (!sonuc.ok) return uretimHataToast(sonuc, "Büyütülemedi");
    toast.success(`${upModel} ile ${upOlcek} büyütülüyor ✦`, { description: "Upscale · 2 kredi" });
    setAktifArac(null);
  };
  const elementOlustur = () => {
    if (elementAd.trim().length < 1) return toast.error("Element adı gir.");
    const turHarita: Record<string, ElementTur> = { Karakter: "karakter", Nesne: "obje", Stil: "stil", Sahne: "mekan", Oto: "karakter" };
    const ad = elementAd.trim().replace(/\s+/g, "");
    elementEkleStore({
      ad, tur: turHarita[elementKategori] ?? "karakter",
      aciklama: elementAciklama.trim() || `${elementKategori} elementi`,
      tohum: "el-" + ad.toLowerCase(),
      // m7: modaldaki (ön-yüklenen veya seçilen) medya elemente eklensin.
      gorseller: elementMedya ? [elementMedya] : [],
    });
    toast.success(`"@${ad}" elementi oluşturuldu`, { description: "Artık istemlerde @ ile çağırabilirsin." });
    setElementModal(false);
    setElementAd("Freya"); setElementAciklama(""); setElementKategori("Oto"); setElementMedya(null);
  };

  /* m7: "Element oluştur" — artık anında element YARATMAZ. Yeni Element modalını
     seçilen görseli MEDYA olarak ön-yükleyip açar (higgs birebir). Kullanıcı adı/
     kategoriyi görüp onaylar; kayıt modaldeki "Oluştur" ile yapılır. */
  const elementModalAc = (gorsel?: string | null, istem?: string) => {
    const g = gorsel ? (saltUrl(gorsel) ?? gorsel) : null;
    setElementMedya(g && /^(data:|https?:|\/)/.test(g) ? g : null);
    setElementAd((istem || "").replace(/[^\p{L}\p{N}]/gu, "").slice(0, 14) || "Element");
    setElementAciklama((istem || "").slice(0, 80));
    setElementKategori("Oto");
    setElementModal(true);
  };

  /* Menüdeki "Element oluştur" — modal açmadan GERÇEK element yazar (useElements).
     Görsel varsa elementin görsellerine eklenir; ad çakışırsa sonuna sayı gelir. */
  const elementOlusturHizli = (istem: string, mdl: string, gorsel?: string | null) => {
    const kaynak = (istem || "Element").replace(/[^\p{L}\p{N}]/gu, "").slice(0, 12) || "Element";
    let ad = kaynak;
    let n = 2;
    while (elementListe.some((e) => e.ad.toLocaleLowerCase("tr") === ad.toLocaleLowerCase("tr"))) {
      ad = `${kaynak}${n++}`;
    }
    elementEkleStore({
      ad,
      tur: "karakter",
      aciklama: (istem || "Görselden oluşturuldu").slice(0, 60),
      tohum: (istem || "element") + mdl,
      gorseller: gorsel ? [gorsel] : [],
    });
    toast.success(`"@${ad}" elementi oluşturuldu`, { description: "Artık istemlerde @ ile çağırabilirsin." });
  };

  // Model → kredi. Önce GORSEL_MODELLER kataloğu (kredi alanı), sonra MODELLER, sonra lite kuralı.
  const modelKredi = (ad: string): number => {
    const g = GORSEL_MODELLER.find((x) => x.ad === ad);
    if (g?.kredi != null) return g.kredi;
    const m = MODELLER.find((x) => x.ad === ad);
    if (m) return m.kredi;
    if (/lite/i.test(ad)) return 1; // Seedream 5.0 lite = 1 kredi (Higgsfield birebir)
    return 4;
  };

  const uret = () => {
    // Swap modelleri: prompt yerine iki görsel gerekir (Higgsfield birebir doğrulama).
    if (swapMu) {
      if (!swapKaynak) return toast.error(yuzMu ? "Kaynak yüzü yükle." : "Kaynak karakteri yükle.", { description: "Sol kutuya eklemek istediğin görseli yükle." });
      if (!swapHedef) return toast.error("Hedef görseli yükle.", { description: "Sağ kutuya değiştirilecek görseli yükle." });
      const birim = modelKredi(model);
      const sonuc = uretimBaslat({
        baslik: `${yuzMu ? "Yüz" : "Karakter"} değiştirme`,
        tur: "gorsel",
        model,
        prompt: `${yuzMu ? "Yüz" : "Karakter"} değiştirme · kaynak → hedef`,
        kredi: birim,
        projeId: aktifProjeId ?? undefined,
        meta: { oran, cozunurluk },
      });
      if (!sonuc.ok) return uretimHataToast(sonuc);
      toast.success(`${yuzMu ? "Yüz" : "Karakter"} değiştiriliyor ✦`, { description: `${model} · ${oran}` });
      return;
    }

    if (prompt.trim().length < 2) return toast.error("Bir istem yaz.", { description: "Ne üretmek istediğini birkaç kelimeyle anlat." });

    // İçerik moderasyonu — üretimden ÖNCE. Engellenirse kredi HİÇ düşmez.
    const denetim = icerikDenetle(prompt);
    if (!denetim.izin) {
      toast.error(`İçerik engellendi · ${kategoriEtiket(denetim.kategori)}`, { description: denetim.mesaj });
      return;
    }

    const birim = modelKredi(model);
    const toplam = sinirsiz ? birim : birim * adet;
    // Yüklenen referanslar prompt'a not olarak eklenir (görsel-güdümlü üretim).
    const referansNot = referanslar.length ? ` · ${referanslar.length} referans görsele sadık kal` : "";
    // Ruh (Soul) modeli seçimleri prompt'a işlenir (moodboard/karakter/renk paleti).
    const soulNot = soulMu
      ? `${seciliMoodboard !== "Genel" ? ` · ${seciliMoodboard} ruh panosu` : ""}${seciliKarakter ? ` · @${seciliKarakter} karakteri` : ""}${seciliRenk ? ` · ${seciliRenk} renk paleti` : ""}`
      : "";
    // Modele özel notlar (Recraft vektör/kalite, Kontext prompt-geliştir, FLUX CFG/adım, kalite seviyesi).
    const modelNot = [
      modelTip === "recraft" && vektorMod ? " · vektör (SVG)" : "",
      modelTip === "recraft" ? ` · ${kaliteMod}` : "",
      modelTip === "kontext" && promptGelistir ? " · prompt geliştirildi" : "",
      modelTip === "flux" ? ` · CFG ${cfg} · ${kaliteAdim} adım` : "",
      seciliRenk && modelTip === "recraft" ? ` · ${seciliRenk} paleti` : "",
      kaliteSecenek && aktifKalite ? ` · ${aktifKalite} kalite` : "",
      aktifModelTanim.cozunurluk ? ` · ${cozunurluk}` : "",
    ].join("");

    const sonuc = uretimBaslat({
      baslik: prompt.slice(0, 48),
      tur: "gorsel",
      model,
      prompt: prompt + referansNot + soulNot + modelNot,
      kredi: toplam,
      projeId: aktifProjeId ?? undefined,
      /* hamIstem: kullanıcının YAZDIĞI metin — ayar notları (" · 4K",
         " · 1 referans görsele sadık kal" …) hariç. "Bu ayarlarla üret"
         composer'a bunu yazar; aksi halde notlar prompt kutusuna girip her
         geri yüklemede birikiyordu (kullanıcı: "saçma sapan bir hareket"). */
      meta: { oran, cozunurluk, hamIstem: prompt },
    });
    if (!sonuc.ok) return uretimHataToast(sonuc);
    toast.success("Görsel üretiliyor ✦", { description: `${model} · ${oran} · ${sinirsiz ? "sınırsız" : `${adet} varyasyon`}` });
  };

  // ── Gerçek indirme: data-uri/http ise dosya indir; gradient placeholder ise bilgi ver ──
  // `sessiz` → toplu indirmede tek tek toast basmasın (çağıran bir kez basar).
  const gorseliIndir = (arka?: string, ad = "vayra-gorsel", sessiz = false) => {
    // gorselUrl bir CSS background string ("url(...) , gradient"); ilk url(...)'i çıkar.
    const m = arka?.match(/url\((['"]?)(.*?)\1\)/);
    const kaynak = m?.[2] ?? (arka && /^(data:|https?:|\/)/.test(arka) ? arka : undefined);
    const dosya = `${ad.replace(/[^\w\s-]/g, "").trim().slice(0, 40) || "vayra"}`;
    if (kaynak) {
      const ok = urlIndir(kaynak, `${dosya}.png`);
      if (!sessiz) {
        if (ok) toast.success("İndiriliyor 📦", { description: `${dosya}.png` });
        else toast.error("İndirilemedi", { description: "Tarayıcı indirmeyi engelledi." });
      }
      return ok;
    }
    // Gerçek görsel dosyası yok (gradyan yer tutucu) → en azından künyeyi gerçekten indir.
    const ok = metinIndir(
      JSON.stringify({ baslik: ad, uygulama: "Vayra", disaAktarim: new Date().toISOString() }, null, 2),
      `${dosya}.json`,
      "application/json",
    );
    if (!sessiz) {
      if (ok) toast.success("Künye indirildi ✓", { description: "Medya dosyası yok — künye JSON olarak kaydedildi" });
      else toast.error("İndirilemedi");
    }
    return ok;
  };

  // ── GERÇEK toplu indirme: seçili id'ler hem üretimlerden hem galeriden çözülür ──
  const topluGorselIndir = () => {
    const hedefler = secililer
      .map((sid) => {
        const uret = gorselUretimleri.find((x) => x.id === sid);
        if (uret) return { arka: uret.gorselUrl, ad: uret.baslik || "vayra-gorsel" };
        // Galeri kartlarının kimliği `url + index` biçiminde üretilir.
        const gal = TUM_GORSELLER.find((url, i) => url + i === sid);
        return gal ? { arka: gal, ad: "vayra-gorsel" } : null;
      })
      .filter(Boolean) as { arka?: string; ad: string }[];
    if (!hedefler.length) return void toast.error("İndirilecek seçim yok");
    // Tarayıcı çoklu indirmeyi engellemesin diye aralıklı tetikle.
    hedefler.forEach((h, i) => setTimeout(() => gorseliIndir(h.arka, h.ad, true), i * 320));
    toast.success(`${hedefler.length} görsel indiriliyor ✓`, { description: "Tarayıcı indirmeleri sırayla başlatıldı" });
  };

  /* Seçimin kaç tanesi GERÇEK üretim kaydı? (kalanlar stok galeri görselleri —
     onlar üzerinde yayınla/klasör/sil yapılamaz.) */
  const seciliUretimIdler = () => secililer.filter((sid) => gorselUretimleri.some((x) => x.id === sid));

  /* Toplu yayınla — GERÇEK: store'da yayinda:true yapar. */
  const topluYayinla = () => {
    const idler = seciliUretimIdler();
    if (!idler.length) return void toast.info("Yayınlanacak üretim yok", { description: "Yalnızca kendi üretimlerin toplulukta yayınlanabilir." });
    idler.forEach((id) => guncelle(id, { yayinda: true }));
    toast.success(`${idler.length} üretim toplulukta yayınlandı 🌍`, { description: "Keşfet akışında görünecek." });
    secimTemizle();
  };

  /* Toplu koleksiyona ekle — GERÇEK: "Görseller" koleksiyonuna yazar. */
  const topluKoleksiyonaEkle = () => {
    const idler = seciliUretimIdler();
    if (!idler.length) return void toast.info("Eklenecek üretim yok", { description: "Yalnızca kendi üretimlerin koleksiyona eklenebilir." });
    const mevcut = koleksiyonlar.find((k) => k.ad === "Görseller");
    const kid = mevcut?.id ?? koleksiyonOlustur("Görseller");
    idler.forEach((id) => koleksiyonaEkle(kid, id));
    toast.success(`${idler.length} görsel klasöre eklendi`, { description: "Görseller" });
    secimTemizle();
  };

  /* Toplu sil — GERÇEK: store'dan siler. */
  const topluSil = () => {
    const idler = seciliUretimIdler();
    if (!idler.length) return void toast.info("Silinecek üretim yok", { description: "Stok galeri görselleri silinemiyor." });
    idler.forEach((id) => silUretim(id));
    toast.success(`${idler.length} üretim silindi`);
    secimTemizle();
  };

  // ── Gerçek yeniden-üret: verilen istemle uret akışını tekrar çağır (kredi düşer) ──
  const yenidenUret = (istem?: string) => {
    const kaynak = (istem ?? prompt).trim();
    if (kaynak.length < 2) return toast.error("Yeniden üretmek için bir istem gerekli.");
    const denetim = icerikDenetle(kaynak);
    if (!denetim.izin) return toast.error(`İçerik engellendi · ${kategoriEtiket(denetim.kategori)}`, { description: denetim.mesaj });
    const birim = modelKredi(model);
    const sonuc = uretimBaslat({ baslik: kaynak.slice(0, 48), tur: "gorsel", model, prompt: kaynak, kredi: birim, projeId: aktifProjeId ?? undefined, meta: { oran, cozunurluk } });
    if (!sonuc.ok) return uretimHataToast(sonuc);
    // Üretim başladı → lightbox'ı kapat, kullanıcı grid'in başında üretilen görseli görsün (madde 9).
    lightboxKapat();
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success("Yeniden üretiliyor ✦", { description: `${model} · ${oran}` });
  };

  // Boyut kaydırıcı → sütun genişliği (Higgsfield birebir: nav altı ince slider)
  const sutunGen = 120 + boyut * 2.4; // px
  // Kart araç boyutu artık KartAraclari içinde kartın gerçek genişliğinden ölçülür (Y2).

  /* ── MOBİL COMPOSER ──
     Referansta `Create Image` ekranı tam ekran bir formdur; masaüstündeki
     galeri + araç panelleri mobilde görünmez. Ortak MobilComposer'ı burada
     mevcut prompt/model/oran/adet state'leriyle bağlıyoruz. */
  const mobilModeller: SeciciOge[] = GORSEL_MODELLER.map((m) => ({ id: m.ad, ad: m.ad, ozet: m.ozet, rozet: m.rozet }));

  return (
    <>
    {/* Gömülüyken mobil tam-ekran kabuk YOK — dış sayfa kendi düzenini kurar. */}
    {!gomulu && (
    <>
    <MobilComposerKabuk
      baslik="Görsel Üret"
      modId="gorsel"
      onKapat={() => router.push("/panel")}
      altCipler={(() => {
        /* MODELE GÖRE DİNAMİK ÇİPLER (Higgsfield birebir):
           - kaliteSeviye varsa "kalite" çipi o seviyeleri gösterir; yoksa cozunurluk 1K/2K/4K.
           - adetGizli modellerde (Yüz/Karakter Değiştir, WAN) adet çipi YOK.
           - sinirsizToggle modellerde "Sınırsız" anahtarı eklenir. */
        const m = modelBul(model);
        const kaliteSecenek = m.kaliteSeviye ?? (m.cozunurluk ? ["1K", "2K", "4K"] : undefined);
        return (
          <MobilAltCipler
            oran={oran} oranSecenek={["1:1", "3:4", "4:3", "2:3", "3:2", "9:16", "16:9", "21:9"]} onOran={setOran}
            kalite={kaliteSecenek ? cozunurluk : undefined} kaliteSecenek={kaliteSecenek}
            onKalite={kaliteSecenek ? setCozunurluk : undefined}
            adet={m.adetGizli ? undefined : String(adet)} adetSecenek={m.adetGizli ? undefined : ["1", "2", "3", "4"]}
            onAdet={m.adetGizli ? undefined : (v) => setAdet(Number(v))}
            ekstra={
              <>
                {m.sinirsizToggle && (
                  <button onClick={() => setSinirsiz((v) => !v)}
                    className={cn("flex h-9 items-center gap-1.5 rounded-full px-3 text-[14px] font-medium transition-colors",
                      sinirsiz ? "bg-aksan text-zemin" : "bg-[#2a2c2e] text-white")}>
                    ∞ Sınırsız
                  </button>
                )}
                {/* Renk Transferi — seçiliyse butonun ARKA PLANI seçilen paletten (isim yerine renkler). */}
                {(m.soul || m.tip === "recraft") && (() => {
                  const palet = renkPaleti(seciliRenk);
                  return (
                    <button onClick={() => setRenkModal(true)}
                      className="relative flex h-9 items-center gap-1.5 overflow-hidden rounded-full px-3 text-[14px] font-medium text-white transition-colors"
                      style={palet
                        ? { background: `linear-gradient(90deg, ${palet.join(", ")})` }
                        : { background: "#2a2c2e" }}>
                      {/* Okunurluk için hafif koyu örtü (palet açık renkli olabilir) */}
                      {palet && <span aria-hidden className="absolute inset-0 bg-black/25" />}
                      <span className="relative flex items-center gap-1.5">
                        <Palette className="h-4 w-4 drop-shadow" />
                        {palet ? (
                          <span className="flex gap-1">
                            {palet.map((c) => <span key={c} className="h-3.5 w-3.5 rounded-full ring-1 ring-white/40" style={{ background: c }} />)}
                          </span>
                        ) : "Renk"}
                      </span>
                    </button>
                  );
                })()}
                {/* Recraft — Vektör (SVG) modu + Kalite (Standart/HD) */}
                {m.tip === "recraft" && (
                  <>
                    <button onClick={() => setVektorMod((v) => !v)}
                      className={cn("flex h-9 items-center gap-1.5 rounded-full px-3 text-[14px] font-medium transition-colors",
                        vektorMod ? "bg-aksan text-zemin" : "bg-[#2a2c2e] text-white")}>
                      <Layers className="h-4 w-4" /> Vektör
                    </button>
                    <MobilAltCip tip="kalite" deger={kaliteMod} secenekler={["Standart", "HD"]} onSec={(v) => setKaliteMod(v as "Standart" | "HD")} baslik="KALİTE" />
                  </>
                )}
                {/* Kontext — Prompt Geliştir aç/kapa */}
                {m.tip === "kontext" && (
                  <button onClick={() => setPromptGelistir((v) => !v)}
                    className={cn("flex h-9 items-center gap-1.5 rounded-full px-3 text-[14px] font-medium transition-colors",
                      promptGelistir ? "bg-aksan text-zemin" : "bg-[#2a2c2e] text-white")}>
                    <Wand2 className="h-4 w-4" /> Prompt Geliştir
                  </button>
                )}
              </>
            }
          />
        );
      })()}
      uretButonu={<MobilUretButonu kredi={modelKredi(model) * adet} onTikla={uret} devreDisi={!prompt.trim()} />}
    >
      {(() => {
        const m = modelBul(model);
        /* SWAP modelleri (Yüz/Karakter Değiştir): iki yükleme kutusu — istem yok. */
        if (m.tip === "swap") {
          return (
            <div className="grid grid-cols-2 gap-2">
              {([
                { url: swapKaynak, et: "Senin Fotoğrafın", ayar: setSwapKaynak },
                { url: swapHedef, et: "Hedef Görsel", ayar: setSwapHedef },
              ] as const).map((k, i) => (
                <label key={i} className="relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-[12px] bg-yuzey-2 text-center">
                  {k.url ? (<><span className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${k.url})` }} /><button onClick={(e) => { e.preventDefault(); k.ayar(null); }} className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"><X className="h-3.5 w-3.5" /></button></>) : (<><input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => k.ayar(String(r.result)); r.readAsDataURL(f); } e.target.value = ""; }} /><ImagePlus className="h-5 w-5 text-metin-2" /><span className="text-[13px] font-semibold text-white">{k.et}</span></>)}
                </label>
              ))}
            </div>
          );
        }
        /* Normal + soul + flux: referans yükleme + istem */
        return (
          <>
            <MobilYukleAlani etiket="Yüklemek için görsel seç" ipucu="(en fazla 14)" cokluBaslik="Referans görseller"
              gorseller={referanslar.map((r) => r.url)}
              onKaldir={(i) => setReferanslar((v) => v.filter((_, j) => j !== i))}
              onDosya={(dosyalar) => {
                Array.from(dosyalar).slice(0, 14 - referanslar.length).forEach((d) => {
                  const r = new FileReader();
                  r.onload = () => setReferanslar((v) => (v.length >= 14 ? v : [...v, { ad: d.name, url: String(r.result) }]));
                  r.readAsDataURL(d);
                });
              }} />
            {/* SOUL modelleri: Karakter + Moodboard kartları */}
            {m.soul && (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setKarakterModal(true)}
                  className="flex h-[68px] items-center justify-center gap-2 rounded-[12px] bg-yuzey-2 text-[14px] font-medium text-white">
                  <UserSquare className="h-[18px] w-[18px] text-metin-2" /> Karakter
                </button>
                <button onClick={() => setMoodboardModal(true)}
                  className="flex h-[68px] items-center justify-center gap-2 rounded-[12px] bg-yuzey-2 text-[14px] font-medium text-white">
                  <Sparkles className="h-[18px] w-[18px] text-metin-2" /> Moodboard
                </button>
              </div>
            )}
            <MobilIstemKutusu deger={prompt} onDegis={setPrompt} modelAdi={model} onModelTikla={() => setMobilModelAcik(true)}
              onElementAc={() => setElementSeciciAcik(true)} />
            {/* FLUX modelleri: gelişmiş ayarlar (CFG + kalite adımları) */}
            {m.tip === "flux" && (
              <button onClick={() => setFluxAyarAcik(true)}
                className="flex items-center gap-2 self-start rounded-full bg-[#2a2c2e] px-4 py-2.5 text-[14px] font-medium text-white">
                ⚙ Gelişmiş · CFG {cfg} · {kaliteAdim} adım
              </button>
            )}
            {/* Çizerek düzenleme destekli modeller (Nano Banana / Vary): Çiz butonu */}
            {m.cizim && (
              <button onClick={() => setCizimModal(true)}
                className="flex items-center gap-2 self-start rounded-full bg-[#2a2c2e] px-4 py-2.5 text-[14px] font-medium text-white">
                <Pencil className="h-4 w-4" /> Çiz
              </button>
            )}
          </>
        );
      })()}
    </MobilComposerKabuk>

    <MobilSecici acik={mobilModelAcik} onKapat={() => setMobilModelAcik(false)}
      ogeler={mobilModeller} seciliId={model} onSec={(o) => setModel(o.id)} aramaYerTutucu="Model ara…" />

    {/* @mention element seçici — seçince prompt'a @ad ekler */}
    <MobilSecici acik={elementSeciciAcik} onKapat={() => setElementSeciciAcik(false)} baslik="Element ekle"
      ogeler={elementListe.map((e) => ({ id: e.id, ad: e.ad, ozet: e.aciklama }))}
      onSec={(o) => { const e = elementListe.find((x) => x.id === o.id); if (e) setPrompt((p) => `${p}${p && !p.endsWith(" ") ? " " : ""}@${e.ad} `); }}
      aramaYerTutucu="Element ara…" />

    {/* FLUX gelişmiş ayarlar — CFG (prompt gücü) + kalite adımları */}
    <MobilAyarCekmecesi acik={fluxAyarAcik} onKapat={() => setFluxAyarAcik(false)} baslik="Gelişmiş ayarlar"
      onSifirla={() => { setCfg(5); setKaliteAdim(30); }} onKaydet={() => setFluxAyarAcik(false)}>
      <div>
        <div className="mb-1.5 flex items-center justify-between text-[14px]"><span className="text-white">Prompt Gücü (CFG)</span><span className="text-metin-2">{cfg}</span></div>
        <input type="range" min={1} max={15} step={0.5} value={cfg} onChange={(e) => setCfg(Number(e.target.value))} className="h-1.5 w-full cursor-pointer accent-aksan" />
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between text-[14px]"><span className="text-white">Kalite Adımları</span><span className="text-metin-2">{kaliteAdim}</span></div>
        <input type="range" min={10} max={60} step={1} value={kaliteAdim} onChange={(e) => setKaliteAdim(Number(e.target.value))} className="h-1.5 w-full cursor-pointer accent-aksan" />
      </div>
    </MobilAyarCekmecesi>
    </>
    )}

    {/* Gömülüyken: galeri/boyut kaydırıcı yok, YALNIZ composer dock'u.
        `relative` + min-h kaldırılır ki dock dış düzenin akışına otursun. */}
    <div className={gomulu ? "relative" : "relative hidden min-h-[calc(100vh-3rem)] sm:block"}>
      {/* Boyut kaydırıcı — nav'ın hemen altında, sağ tarafta. Mobilde gizli (dokunma ekranı). */}
      <div className={cn("justify-end px-4 py-2", gomulu ? "hidden" : "hidden sm:flex")}>
        <input
          type="range" min={0} max={100} value={boyutGorsel}
          onChange={(e) => setBoyutGorsel(Number(e.target.value))}
          onPointerUp={boyutuKomite}
          onKeyUp={boyutuKomite}
          onBlur={boyutuKomite}
          className="h-1 w-40 cursor-pointer appearance-none rounded-full bg-white/12 accent-aksan"
          aria-label="Küçük resim boyutu"
        />
      </div>

      {/* ══ Higgsfield birebir: TEK AKIŞ masonry feed (tarih grubu YOK — madde 1) ══
          Gerçek görsel oranını koruyan CSS multi-column masonry (madde 14): görseller
          kendi en-boy oranında, aralarında boşluksuz dizilir. Üretimler en başta. */}
      {/* Gömülüyken galeri YOK: üretimleri dış sayfa (proje varlıkları) gösterir. */}
      <div className={gomulu ? "hidden" : "px-1 pb-40"}>
        {(() => {
          const sutunSayisi = Math.max(2, Math.round(1400 / sutunGen));
          return (
            <div
              className="[column-fill:balance]"
              style={{ columnCount: sutunSayisi, columnGap: 4 }}
            >
        {/* Gerçek üretimlerin — en başta (Higgsfield canlılık: üretince anında belirir) */}
        {gorselUretimleri.map((u) => {
          const bitti = u.durum === "tamam";
          const hata = u.durum === "hata";
          // Gerçek en-boy oranı — kartın doğal yüksekliğini belirler (madde 14).
          const or = oranSayi(u);
          const arka = u.gorselUrl
            ? (/^(data:|https?:|\/)/.test(u.gorselUrl) ? `url("${u.gorselUrl}") center/cover no-repeat` : u.gorselUrl)
            : "linear-gradient(135deg,#1a1725,#12101a)";
          return (
            <motion.div
              key={u.id}
              layout
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative mb-1 block break-inside-avoid overflow-hidden rounded-[4px]"
            >
              <button
                type="button"
                onClick={() => bitti && u.gorselUrl && lightboxAc(u.gorselUrl)}
                className={cn("block w-full", bitti ? "cursor-pointer" : "cursor-default")}
                style={{ aspectRatio: String(or), background: hata ? "linear-gradient(135deg,#181818,#0f1113)" : arka }}
                aria-label={bitti ? "Üretilen görseli aç" : hata ? "Üretim başarısız" : "Üretiliyor"}
              >
                {/* Üretiliyor — ChatGPT tarzı ışıltı/tarama animasyonu (madde 13) */}
                {!bitti && !hata && (
                  <span className="hf-uretiliyor absolute inset-0 flex flex-col items-center justify-center gap-2.5">
                    <span className="hf-uretiliyor-tara" />
                    <span className="relative z-10 flex flex-col items-center gap-2">
                      <span className="hf-shimmer text-[13px] font-medium">Üretiliyor…</span>
                      <span className="h-1 w-24 overflow-hidden rounded-full bg-white/15">
                        <span className="block h-full rounded-full bg-aksan transition-all duration-500" style={{ width: `${Math.max(8, u.ilerleme)}%` }} />
                      </span>
                      <span className="text-[11px] tabular-nums text-white/70">%{u.ilerleme}</span>
                    </span>
                  </span>
                )}
                {/* Başarısız — Failed + Kredi iade + Retry/Delete (madde 12) */}
                {hata && (
                  <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
                    <span className="flex flex-wrap items-center justify-center gap-2">
                      <span className="glass-cip flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold text-white">
                        <XCircle className="h-4 w-4" /> Başarısız
                      </span>
                      <span className="glass-cip flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold text-white">
                        <Info className="h-4 w-4" /> Kredi iade edildi
                      </span>
                    </span>
                    <span className="text-[12px] leading-snug text-metin-3">Tekrar dene ya da istemini/girdini değiştir.</span>
                    <span className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); yenidenUret(u.prompt || u.baslik); }}
                        className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-zemin transition-transform hover:scale-105">
                        <RotateCcw className="h-3.5 w-3.5" /> Tekrar dene
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); silUretim(u.id); }}
                        className="hf-btn glass-cip flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold text-white">
                        <Trash2 className="h-3.5 w-3.5" /> Sil
                      </button>
                    </span>
                  </span>
                )}
              </button>

              {bitti && u.gorselUrl && (
                <>
                  {/* Hover vignette — dört kenardan içeri koyu (Higgsfield birebir) */}
                  <span className="uretim-vignette" />
                  {/* Seçim kutusu sol-üst (madde 11) */}
                  <button
                    onClick={(e) => { e.stopPropagation(); secimToggle(u.id); }}
                    aria-label="Seç"
                    className={cn(
                      "absolute left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-md border-2 backdrop-blur-sm transition-all",
                      secililer.includes(u.id) ? "border-aksan bg-aksan text-zemin opacity-100" : "pointer-events-none border-white/70 opacity-0 group-hover:pointer-events-auto group-hover:opacity-100",
                    )}
                  >
                    {secililer.includes(u.id) && <Check className="h-3 w-3" strokeWidth={3.5} />}
                  </button>
                  <KartAraclari
                    begenili={begeni.includes(u.id)}
                    onBegen={() => setBegeni((v) => v.includes(u.id) ? v.filter((x) => x !== u.id) : [...v, u.id])}
                    onIndir={() => gorseliIndir(u.gorselUrl, u.baslik || "vayra-gorsel")}
                    onKopyala={() => uretimiGeriYukle(u)}
                    onAc={() => lightboxAc(u.gorselUrl!)}
                    onYenidenUret={() => yenidenUret(u.prompt || u.baslik)}
                    onReferans={() => referansEkle(u.gorselUrl!)}
                    onAnimate={() => animasyonaGec(u.gorselUrl!)}
                    on3d={() => sahne3dOlustur(u.gorselUrl!)}
                    onElement={() => elementModalAc(u.gorselUrl, u.baslik || u.prompt)}
                    onYayinla={() => { guncelle(u.id, { yayinda: true }); toast.success("Toplulukta yayınlandı 🌍"); }}
                    klasorler={klasorListesi}
                    onKlasoreEkle={(kid) => klasoreEkle(kid, u.id)}
                    onYeniKlasor={() => yeniKlasoreEkle(u.id)}
                    indirmeFormatlari={[...INDIRME_FORMATLARI]}
                    onFormatIndir={(f) => void gorseliFormatlaIndir(u.gorselUrl!, u.baslik || "vayra-gorsel", f)}
                    onSil={() => { silUretim(u.id); toast("Üretim silindi"); }}
                  />
                </>
              )}
            </motion.div>
          );
        })}
        {TUM_GORSELLER.map((url, i) => {
          const id = url + i;
          if (gizliStok.includes(id)) return null; // m54: "Sil" denen stok görsel gizlenir
          const begenili = begeni.includes(id);
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.01, 0.35) }}
              onMouseEnter={() => setHover(id)}
              onMouseLeave={() => { setHover(id === hover ? null : hover); if (menu !== id) setMenu((m) => (m === id ? null : m)); }}
              className="group relative mb-1 block break-inside-avoid overflow-hidden rounded-[4px]"
            >
              <button
                type="button"
                onClick={() => lightboxAc(url)}
                className="block w-full cursor-pointer"
                aria-label="Görseli aç"
              >
                {/* Gerçek en-boy oranı korunur — object-cover değil doğal yükseklik (madde 14) */}
                <img src={url} alt="" loading="lazy" className="block w-full transition-transform duration-300 group-hover:scale-[1.03]" />
              </button>

              {/* Seçim kutusu sol üst — tıkla → çoklu seçim (Higgsfield birebir) */}
              <button
                onClick={(e) => { e.stopPropagation(); secimToggle(id); }}
                aria-label="Seç"
                className={cn(
                  "absolute left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-md border-2 backdrop-blur-sm transition-all",
                  secililer.includes(id)
                    ? "border-aksan bg-aksan text-zemin opacity-100"
                    : "pointer-events-none border-white/70 opacity-0 group-hover:pointer-events-auto group-hover:opacity-100",
                )}
              >
                {secililer.includes(id) && <Check className="h-3 w-3" strokeWidth={3.5} />}
              </button>

              {/* Hover vignette — DÖRT KENARDAN içeri koyu (Higgsfield birebir):
                  merkez berrak, kenarlar/köşeler kararır → köşe ikonları okunur. */}
              <span className="uretim-vignette" />
              <KartAraclari
                begenili={begenili}
                onBegen={() => setBegeni((v) => begenili ? v.filter((x) => x !== id) : [...v, id])}
                onIndir={() => gorseliIndir(url, "vayra-gorsel")}
                onKopyala={() => { setPrompt("Bu görseli yeniden kullan"); toast.success("İstem panele yazıldı"); }}
                onAc={() => lightboxAc(url)}
                onYenidenUret={() => yenidenUret()}
                onReferans={() => referansEkle(url)}
                onAnimate={() => animasyonaGec(url)}
                on3d={() => sahne3dOlustur(url)}
                onElement={() => elementModalAc(url)}
                klasorler={klasorListesi}
                onKlasoreEkle={(kid) => klasoreEkle(kid, id)}
                onYeniKlasor={() => yeniKlasoreEkle(id)}
                indirmeFormatlari={[...INDIRME_FORMATLARI]}
                onFormatIndir={(f) => void gorseliFormatlaIndir(url, `vayra-gorsel`, f)}
                onYayinla={() => { referansEkle(url); }}
                onSil={() => { setGizliStok((v) => [...v, id]); toast("Galeriden gizlendi"); }}
              />
            </motion.div>
          );
        })}
            </div>
          );
        })()}
      </div>

      {/* Seçim toolbar'ı — seçim varken composer yerine (Higgsfield birebir) */}
      <AnimatePresence>
        {secimVar && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4"
          >
            {/* Boyut bir tık büyütüldü (kullanıcı kararı 2026-07-31):
                py-2→py-2.5, metin 13→14.5px, ikonlar 4→4.5, dokunma
                hedefleri 9→10 birim. Alt composer dock'una yakın durduğu için
                fazlası dengeyi bozardı. */}
            <div className="glass-cip flex items-center gap-2 rounded-full py-2.5 pl-5 pr-2.5 shadow-2xl shadow-black/50">
              <span className="mr-1 text-[14.5px] font-semibold text-metin">{secililer.length} seçili</span>
              <span className="mx-1 h-6 w-px bg-kenar" />
              <button onClick={topluGorselIndir} className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[14px] text-metin-2 transition-colors hover:bg-white/8 hover:text-metin"><Download className="h-4.5 w-4.5" /> İndir</button>
              <button onClick={topluYayinla} className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[14px] text-metin-2 transition-colors hover:bg-white/8 hover:text-metin"><Sparkles className="h-4.5 w-4.5" /> Yayınla</button>
              <button onClick={topluKoleksiyonaEkle} className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[14px] text-metin-2 transition-colors hover:bg-white/8 hover:text-metin"><FolderPlus className="h-4.5 w-4.5" /> Ekle</button>
              <button onClick={() => { setBegeni((v) => [...new Set([...v, ...secililer])]); toast.success("Beğenildi ❤️"); }} className="flex h-10 w-10 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-white/8 hover:text-rose-400" aria-label="Beğen"><Heart className="h-4.5 w-4.5" /></button>
              <button onClick={topluSil} className="flex h-10 w-10 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-white/8 hover:text-tehlike" aria-label="Sil"><Trash2 className="h-4.5 w-4.5" /></button>
              <span className="mx-0.5 h-6 w-px bg-kenar" />
              <button onClick={secimTemizle} className="flex h-10 w-10 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-white/8 hover:text-metin" aria-label="Seçimi temizle"><X className="h-4.5 w-4.5" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Yüzen alt prompt dock (seçim yokken görünür) */}
      {/* Gömülüyken dock SABİT DEĞİL, akışta durur (dış sayfa altta konumlar). */}
      <div className={cn("flex justify-center transition-opacity",
        gomulu ? "w-full" : "pointer-events-none fixed inset-x-0 bottom-6 z-30 px-4",
        secimVar && !gomulu && "pointer-events-none opacity-0")}>
        <div className={cn("hf-kart pointer-events-auto relative w-full rounded-[26px] bg-[#1c1e20] p-4 shadow-2xl shadow-black/50",
          gomulu ? "max-w-none" : "max-w-5xl")}>
          {/* Boyut tutamağı — DOCK'UN EN TEPESİNDE sabit, ortada. İçerik ne olursa
              olsun hep yukarıda durur (metin kutusunun içinde değil). Yukarı çek =
              büyüt, aşağı = küçült. */}
          {!swapMu && (
            <div onPointerDown={promptSurukle}
              className="group/tut absolute -top-1.5 left-1/2 z-20 flex h-5 w-24 -translate-x-1/2 cursor-ns-resize items-center justify-center"
              aria-label="Kutu boyutunu ayarla" title="Sürükleyerek kutuyu büyüt/küçült">
              <span className="h-[5px] w-12 rounded-full transition-all group-hover/tut:h-[6px] group-hover/tut:w-14"
                style={{ background: "#55d6fd", opacity: 0.75 }} />
            </div>
          )}
          {/* Yüklenen referans thumbnail'ları — Higgsfield birebir: üst satırda
              görsel(ler) + yanlarında AYNI BOYUTTA kare "+" (görsel ekle) kutusu.
              Referans varken soldaki dairesel + gizlenir; metin altta tam genişlik. */}
          {referanslar.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {referanslar.map((r, i) => (
                <span key={i} className="group/ref relative h-16 w-16 overflow-visible rounded-xl border border-kenar">
                  {/* Hover'da yukarıda açılan büyük önizleme kartı (elementteki gibi) */}
                  <span className="menu-surface pointer-events-none absolute bottom-full left-1/2 z-[70] mb-2 w-52 -translate-x-1/2 overflow-hidden rounded-2xl opacity-0 shadow-2xl shadow-black/60 transition-opacity duration-150 group-hover/ref:opacity-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.url} alt={r.ad} className="block max-h-56 w-full object-cover" />
                    <span className="flex items-center gap-1.5 px-3 py-2 text-[12px] text-white/70">
                      <ImagePlus className="h-3.5 w-3.5 text-aksan" /> {r.ad}
                    </span>
                  </span>
                  {/* Tıkla → tam ekran önizleme */}
                  <button onClick={() => setMedyaOnizle(r.url)} className="block h-full w-full overflow-hidden rounded-xl" aria-label="Referansı büyüt">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.url} alt={r.ad} className="h-full w-full rounded-xl object-cover" />
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition-opacity group-hover/ref:opacity-100">
                      <Maximize2 className="h-4 w-4 text-white" />
                    </span>
                  </button>
                  {/* Hover'da sağ üst köşede çarpı → kaldır */}
                  <button
                    onClick={() => setReferanslar((v) => v.filter((_, j) => j !== i))}
                    className="absolute -right-1.5 -top-1.5 z-[71] flex h-5 w-5 items-center justify-center rounded-full bg-zemin text-white pointer-events-none opacity-0 shadow-lg ring-1 ring-white/20 transition-opacity group-hover/ref:opacity-100 group-hover/ref:pointer-events-auto hover:bg-tehlike"
                    aria-label="Referansı kaldır"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {/* Görselin SAĞINDA, aynı boyutta kare "+" — Higgsfield birebir */}
              <button onClick={() => medyaRef.current?.click()}
                className="hf-btn glass-ikon flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-metin-2 hover:text-metin"
                aria-label="Görsel ekle">
                <Plus className="h-6 w-6" />
              </button>
            </div>
          )}

          {/* Higgsfield birebir: sol kolon (prompt + çipler) · sağda SABİT Üret butonu.
              items-end → prompt kutusu yukarı büyürken buton altta sabit kalır. */}
          <div className="flex items-end gap-3">
            <div className="min-w-0 flex-1">
          {swapMu ? (
            /* Swap modelleri (Yüz/Karakter Değiştir): prompt yerine iki yükleme kutusu — Higgsfield birebir */
            <div className="grid grid-cols-2 gap-3">
              <input ref={swapKaynakRef} type="file" accept="image/*" className="hidden" onChange={(e) => { swapYukle(e.target.files, "kaynak"); e.target.value = ""; }} />
              <input ref={swapHedefRef} type="file" accept="image/*" className="hidden" onChange={(e) => { swapYukle(e.target.files, "hedef"); e.target.value = ""; }} />
              {([
                { url: swapKaynak, ref: swapKaynakRef, temizle: () => setSwapKaynak(null), ik: UserSquare, baslik: "Senin Fotoğrafın", alt: yuzMu ? "Eklemek istediğin yüzü yükle" : "Eklemek istediğin karakteri yükle" },
                { url: swapHedef, ref: swapHedefRef, temizle: () => setSwapHedef(null), ik: ImagePlus, baslik: "Hedef Görsel", alt: yuzMu ? "Değiştirilecek yüzün olduğu foto" : "Değiştirilecek karakterin olduğu foto" },
              ] as const).map((k, i) => (
                <button key={i} onClick={() => k.ref.current?.click()}
                  className="group/swap relative flex min-h-[128px] flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed border-kenar-2 p-4 text-center transition-colors hover:border-aksan/50">
                  {k.url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={k.url} alt={k.baslik} className="absolute inset-0 h-full w-full object-cover" />
                      <span className="absolute inset-0 bg-black/35 pointer-events-none opacity-0 transition-opacity group-hover/swap:opacity-100 group-hover/swap:pointer-events-auto" />
                      <span onClick={(e) => { e.stopPropagation(); k.temizle(); }}
                        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full glass-ikon text-white pointer-events-none opacity-0 transition-opacity group-hover/swap:opacity-100 group-hover/swap:pointer-events-auto hover:bg-tehlike"><X className="h-3.5 w-3.5" /></span>
                    </>
                  ) : (
                    <>
                      <k.ik className="h-5 w-5 text-metin-2" />
                      <span className="text-[14px] font-semibold text-metin">{k.baslik}</span>
                      <span className="text-[12px] text-metin-3">{k.alt}</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          ) : (
          /* Satır 1: + · prompt (standart composer) — kutu yukarı doğru büyür (items-end) */
          <div className="flex items-end gap-3">
            <input ref={medyaRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => { referansYukle(e.target.files); e.target.value = ""; }} />
            {/* Dairesel + yalnız referans YOKKEN. Referans varken kare + üstte
                (görselin sağında) durur; burada gösterince çift + olurdu. */}
            {referanslar.length === 0 && (
              <button onClick={() => medyaRef.current?.click()}
                className="hf-btn glass-ikon flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-metin-2 hover:text-metin" aria-label="Medya ekle">
                <Plus className="h-5 w-5" />
              </button>
            )}
            <ElementMentionInput
              inputRef={promptRef}
              deger={prompt}
              onDeger={setPrompt}
              onEnter={uret}
              cokSatir
              otoBuyu
              enBuyuk={340}
              elYukseklikDis={promptYuk}
              placeholder="Ne üretmek istediğini yaz…  (@ ile element ekle)"
              className="block w-full bg-transparent py-3 text-[16px] leading-relaxed outline-none placeholder:text-metin-3"
            />
          </div>
          )}

          {/* Satır 2: çipler */}
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {/* Model seçici */}
            <div className="relative">
              <button
                onClick={() => setModelAcik((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] transition-colors",
                  modelAcik ? "bg-transparent text-aksan ring-1 ring-aksan" : "glass-cip text-metin",
                )}
              >
                <BarChart3 className="h-3.5 w-3.5" /> {model} <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <AnimatePresence>
                {modelAcik && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setModelAcik(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.14 }}
                      className="menu-surface absolute bottom-full left-0 z-40 mb-2 max-h-[420px] w-80 overflow-hidden rounded-[16px]"
                    >
                      <div className="flex items-center gap-2 border-b border-kenar px-3 py-2.5">
                        <Search className="h-4 w-4 text-metin-3" />
                        <input value={modelAra} onChange={(e) => setModelAra(e.target.value)} placeholder="Ara…" className="w-full bg-transparent text-sm outline-none placeholder:text-metin-3" />
                      </div>
                      <div className="max-h-[360px] overflow-y-auto p-1.5">
                        {(() => {
                          // Higgsfield birebir: iki bölüm — "Öne çıkan modeller" + "Tüm modeller".
                          // Arama varken bölüm başlıkları gizlenir, düz liste gösterilir.
                          const one = modelListe.filter((m) => m.grup !== "tum");
                          const tum = modelListe.filter((m) => m.grup === "tum");
                          const KartSatir = (m: GorselModel) => (
                            <button key={m.ad} onClick={() => { modelSec(m.ad); setModelAcik(false); }}
                              className={cn("flex w-full items-center gap-3 rounded-[10px] p-2 text-left transition-colors hover:bg-white/6", model === m.ad && "bg-white/[0.06]")}>
                              <span className="glass-ikon flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                                <BarChart3 className={cn("h-4 w-4", model === m.ad ? "text-aksan" : "text-metin-2")} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-1.5">
                                  <span className="truncate text-sm font-medium">{m.ad}</span>
                                  {m.rozet === "Yeni" && <span className="rounded bg-aksan px-1 py-0.5 text-[9px] font-bold text-zemin">YENİ</span>}
                                  {m.rozet === "Sınırsız" && <span className="rounded bg-sky-500/25 px-1 py-0.5 text-[9px] font-bold text-sky-300">SINIRSIZ</span>}
                                </span>
                                <span className="block truncate text-[12px] text-metin-2">{m.ozet}</span>
                              </span>
                              {model === m.ad && <Check className="h-4 w-4 shrink-0 text-aksan" />}
                            </button>
                          );
                          if (modelAra.trim()) return modelListe.map(KartSatir);
                          return (
                            <>
                              {one.length > 0 && <p className="flex items-center gap-1.5 px-2 py-1.5 text-[12px] text-metin-2"><Sparkles className="h-3.5 w-3.5" /> Öne çıkan modeller</p>}
                              {one.map(KartSatir)}
                              {tum.length > 0 && <p className="mt-1 flex items-center gap-1.5 border-t border-kenar px-2 py-2 text-[12px] text-metin-2"><BarChart3 className="h-3.5 w-3.5" /> Tüm modeller</p>}
                              {tum.map(KartSatir)}
                            </>
                          );
                        })()}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Çözünürlük — SADECE cozunurluk bayraklı modellerde (Higgsfield birebir) */}
            {aktifModelTanim.cozunurluk && (
            <div className="relative">
              <button
                onClick={() => setCozunurlukAcik((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] transition-colors",
                  cozunurlukAcik ? "bg-transparent text-aksan ring-1 ring-aksan" : "glass-cip text-metin",
                )}
              >
                <Gem className="h-3.5 w-3.5" /> {cozunurluk} <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", cozunurlukAcik && "rotate-180")} />
              </button>
              <AnimatePresence>
                {cozunurlukAcik && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setCozunurlukAcik(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.14 }}
                      className="menu-surface absolute bottom-full left-0 z-40 mb-2 w-36 overflow-hidden rounded-[14px] p-1"
                    >
                      {COZUNURLUKLER.map((c) => (
                        <button
                          key={c}
                          onClick={() => { setCozunurluk(c); setCozunurlukAcik(false); }}
                          className={cn("flex w-full items-center justify-between rounded-[9px] px-2.5 py-2 text-[13px] transition-colors hover:bg-white/8", cozunurluk === c && "bg-white/[0.06]")}
                        >
                          <span className="flex items-center gap-2"><Gem className="h-3.5 w-3.5 text-metin-2" /> {c}</span>
                          {cozunurluk === c && <Check className="h-4 w-4 text-aksan" />}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            )}

            {/* Kalite seviyesi — çözünürlük YERİNE (GPT/Grok/Seedream 4.0/Recraft): Düşük/Orta/Yüksek */}
            {kaliteSecenek && kaliteSecenek.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setKaliteSeviyeAcik((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] transition-colors",
                  kaliteSeviyeAcik ? "bg-transparent text-aksan ring-1 ring-aksan" : "glass-cip text-metin",
                )}
              >
                <Gem className="h-3.5 w-3.5" /> {aktifKalite} <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", kaliteSeviyeAcik && "rotate-180")} />
              </button>
              <AnimatePresence>
                {kaliteSeviyeAcik && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setKaliteSeviyeAcik(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.14 }}
                      className="menu-surface absolute bottom-full left-0 z-40 mb-2 w-40 overflow-hidden rounded-[14px] p-1"
                    >
                      {kaliteSecenek.map((c) => (
                        <button
                          key={c}
                          onClick={() => { setKaliteSeviye(c); setKaliteSeviyeAcik(false); }}
                          className={cn("flex w-full items-center justify-between rounded-[9px] px-2.5 py-2 text-[13px] transition-colors hover:bg-white/8", aktifKalite === c && "bg-white/[0.06]")}
                        >
                          <span className="flex items-center gap-2"><Gem className="h-3.5 w-3.5 text-metin-2" /> {c}</span>
                          {aktifKalite === c && <Check className="h-4 w-4 text-aksan" />}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            )}

            {/* Oran — Higgsfield birebir: tek çip + dropdown (Sinematik rozetli) */}
            <div className="relative">
              <button
                onClick={() => setOranAcik((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] transition-colors",
                  oranAcik ? "bg-transparent text-aksan ring-1 ring-aksan" : "glass-cip text-metin",
                )}
              >
                {(() => { const o = ORANLAR.find((x) => x.deger === oran) ?? ORANLAR[3]; return <OranIkon w={o.w} h={o.h} />; })()} {oran} <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", oranAcik && "rotate-180")} />
              </button>
              <AnimatePresence>
                {oranAcik && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setOranAcik(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.14 }}
                      className="menu-surface absolute bottom-full left-0 z-40 mb-2 w-44 overflow-hidden rounded-[14px] p-1"
                    >
                      {ORANLAR.map((o) => (
                        <button
                          key={o.deger}
                          onClick={() => { setOran(o.deger); setOranAcik(false); }}
                          className={cn("flex w-full items-center justify-between rounded-[9px] px-2.5 py-2 text-[13px] transition-colors hover:bg-white/8", oran === o.deger && "bg-white/[0.06]")}
                        >
                          <span className="flex items-center gap-2.5">
                            <OranIkon w={o.w} h={o.h} /> {o.deger}
                            {o.sinematik && <span className="rounded bg-aksan/15 px-1.5 py-0.5 text-[9px] font-semibold text-aksan">Sinematik</span>}
                          </span>
                          {oran === o.deger && <Check className="h-4 w-4 text-aksan" />}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Adet stepper — Swap/WAN gibi modellerde gizli (Higgsfield birebir) */}
            {!aktifModelTanim.adetGizli && (
            <div className="glass-cip flex items-center gap-2 rounded-full px-2 py-1">
              <button onClick={() => setAdet((a) => Math.max(1, a - 1))} className="text-metin-2 hover:text-metin" aria-label="Azalt"><Minus className="h-3.5 w-3.5" /></button>
              <span className="text-[13px] tabular-nums">{adet}/4</span>
              <button onClick={() => setAdet((a) => Math.min(4, a + 1))} className="text-metin-2 hover:text-metin" aria-label="Artır"><Plus className="h-3.5 w-3.5" /></button>
            </div>
            )}

            {/* Sınırsız (Unlimited) toggle — SADECE sinirsizToggle bayraklı modellerde */}
            {aktifModelTanim.sinirsizToggle && (
            <button onClick={() => setSinirsiz((v) => !v)} className="glass-cip flex items-center gap-2 rounded-full px-3 py-2 text-[13px] text-metin">
              Sınırsız
              <span className={cn("relative h-4 w-7 rounded-full transition-colors", sinirsiz ? "bg-aksan" : "bg-white/20")}>
                <span className={cn("absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all", sinirsiz ? "left-3.5" : "left-0.5")} />
              </span>
            </button>
            )}

            {/* ═══ Element (@ referans) — Higgsfield "Elements" popup ═══ */}
            <button onClick={() => setElementSeciciModal(true)}
              className="glass-cip flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] text-metin hover:text-aksan">
              <AtSign className="h-3.5 w-3.5" /> Element
            </button>

            {/* ═══ RUH (Soul) + Recraft: Renk Transferi chip'i — seçiliyse palet renkleriyle ═══ */}
            {(soulMu || modelTip === "recraft") && (() => {
              const palet = renkPaleti(seciliRenk);
              return (
                <button onClick={() => setRenkModal(true)}
                  className="relative flex items-center gap-1.5 overflow-hidden rounded-full px-3 py-2 text-[13px] text-white transition-colors"
                  style={palet ? { background: `linear-gradient(90deg, ${palet.join(", ")})` } : undefined}>
                  {palet && <span aria-hidden className="absolute inset-0 bg-black/25" />}
                  {!palet && <span aria-hidden className="glass-cip absolute inset-0 rounded-full" />}
                  <span className="relative flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5 drop-shadow" />
                    {palet ? (
                      <span className="flex gap-1">
                        {palet.map((c) => <span key={c} className="h-3 w-3 rounded-full ring-1 ring-white/40" style={{ background: c }} />)}
                      </span>
                    ) : "Renk Transferi"}
                  </span>
                </button>
              );
            })()}

            {/* ═══ RECRAFT: Vektör modu + Kalite (Standart/HD) ═══ */}
            {modelTip === "recraft" && (
              <>
                <Tooltip side="top" label="Fotoğraf yerine düzenlenebilir vektör (SVG) üretir. Her boyutta net kalır — logo, ikon ve illüstrasyon için ideal.">
                  <button onClick={() => setVektorMod((v) => !v)} className="glass-cip flex items-center gap-2 rounded-full px-3 py-2 text-[13px] text-metin">
                    <Info className="h-3.5 w-3.5 text-metin-3" /> Vektör modu
                    <span className={cn("relative h-4 w-7 rounded-full transition-colors", vektorMod ? "bg-aksan" : "bg-white/20")}>
                      <span className={cn("absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all", vektorMod ? "left-3.5" : "left-0.5")} />
                    </span>
                  </button>
                </Tooltip>
                <button onClick={() => setKaliteMod((k) => (k === "Standart" ? "HD" : "Standart"))}
                  className="hf-btn glass-cip flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] text-metin">
                  <Sparkles className="h-3.5 w-3.5 text-metin-2" /> {kaliteMod}
                </button>
              </>
            )}

            {/* ═══ KONTEXT: Prompt Geliştir (aç/kapa) ═══ */}
            {modelTip === "kontext" && (
              <Tooltip side="top" label="İstemini otomatik zenginleştirir — daha detaylı ve tutarlı sonuç.">
                <button onClick={() => setPromptGelistir((v) => !v)}
                  className="hf-btn glass-cip flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] text-metin">
                  <Wand2 className={cn("h-3.5 w-3.5", promptGelistir ? "text-aksan" : "text-metin-2")} /> {promptGelistir ? "Açık" : "Kapalı"}
                </button>
              </Tooltip>
            )}

            {/* ═══ FLUX: gelişmiş ayar (CFG + Kalite Adımları) popover ═══ */}
            {modelTip === "flux" && (
              <div className="relative">
                <button onClick={() => setFluxAyarAcik((v) => !v)}
                  className={cn("flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] transition-colors", fluxAyarAcik ? "bg-transparent text-aksan ring-1 ring-aksan" : "glass-cip text-metin")}>
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                </button>
                <AnimatePresence>
                  {fluxAyarAcik && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setFluxAyarAcik(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.14 }}
                        className="menu-surface absolute bottom-full left-0 z-40 mb-2 w-72 rounded-[14px] p-3.5"
                      >
                        <div className="mb-3.5">
                          <div className="mb-1.5 flex items-center gap-1.5">
                            <span className="text-[13px] font-medium text-metin">Prompt Gücü (CFG)</span>
                            <Tooltip side="top" label="Yüksek değer istemini daha yakından izler ama yaratıcı çeşitliliği kısıtlar."><Info className="h-3.5 w-3.5 text-metin-3" /></Tooltip>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="glass-cip w-10 rounded-lg py-1 text-center text-[13px] tabular-nums">{cfg}</span>
                            <input type="range" min={1} max={15} value={cfg} onChange={(e) => setCfg(Number(e.target.value))} className="flex-1 accent-aksan" />
                          </div>
                        </div>
                        <div>
                          <div className="mb-1.5 flex items-center gap-1.5">
                            <span className="text-[13px] font-medium text-metin">Kalite Adımları</span>
                            <Tooltip side="top" label="Daha çok adım = daha detaylı ama daha yavaş üretim."><Info className="h-3.5 w-3.5 text-metin-3" /></Tooltip>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="glass-cip w-10 rounded-lg py-1 text-center text-[13px] tabular-nums">{kaliteAdim}</span>
                            <input type="range" min={10} max={60} value={kaliteAdim} onChange={(e) => setKaliteAdim(Number(e.target.value))} className="flex-1 accent-aksan" />
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ═══ VARY (Nano Banana): Draw çipi ═══ */}
            {aktifModelTanim.cizim && (
              <button onClick={() => { setCizimSekme("edit"); setCizimModal(true); }}
                className="hf-btn glass-cip flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] text-metin">
                <Pencil className="h-3.5 w-3.5 text-metin-2" /> Çiz
              </button>
            )}
          </div>

          {/* ═══ RUH modeli: Karakter + Moodboard kartları (composer sağ bloğu) ═══ */}
          {soulMu && (
            <div className="mt-2.5 flex items-stretch gap-2.5">
              {/* Karakter kutusu */}
              <button onClick={() => setKarakterModal(true)}
                className="flex h-[68px] w-[68px] shrink-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-dashed border-kenar-2 text-metin-3 transition-colors hover:border-aksan/50 hover:text-metin">
                {seciliKarakter ? (
                  <span className="h-full w-full" style={{ background: gorselArkaG("gorsel-karakter-" + seciliKarakter, "portre") }} />
                ) : (
                  <><Plus className="h-4 w-4" /><span className="text-[9px] font-medium uppercase tracking-wide">Karakter</span></>
                )}
              </button>
              {/* Moodboard kartı */}
              <button onClick={() => setMoodboardModal(true)}
                className="group/mb relative h-[68px] flex-1 overflow-hidden rounded-xl border border-kenar text-left transition-colors hover:border-aksan/50">
                <span className="absolute inset-0" style={{ background: gorselArkaG("gorsel-mood-" + seciliMoodboard, "sinematik") }} />
                <span className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20" />
                <span className="glass-cip absolute left-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"><Pencil className="h-2.5 w-2.5" /> Değiştir</span>
                <span className="hf-baslik absolute bottom-2 left-2 text-[13px] text-aksan">{seciliMoodboard.toUpperCase()}</span>
              </button>
            </div>
          )}
            </div>

            {/* Sağda SABİT yükseklikli Üret butonu (apple glass, parlama YOK).
                h-[88px] sabit → prompt kutusu büyüyüp küçülse de buton oynamaz. */}
            <button onClick={uret} className="hf-cta-glass flex h-[88px] w-[160px] shrink-0 items-center justify-center gap-2 text-[17px] font-bold tracking-wide">
              Üret <Sparkles className="h-[18px] w-[18px]" strokeWidth={2.5} /> {(() => { const k = sinirsiz ? modelKredi(model) : modelKredi(model) * adet; return Number.isInteger(k) ? k : k.toFixed(2).replace(/\.?0+$/, ""); })()}
            </button>
          </div>
        </div>
      </div>

      {/* Soul hero'ları için gizli dosya seçici (Karakter/Moodboard/Renk ortak) */}
      <input ref={soulRef} type="file" accept="image/*" multiple className="hidden"
        onChange={(e) => { soulYukle(e.target.files); e.target.value = ""; }} />

      {/* ═══ RUH: KARAKTER seçici modalı (Higgsfield "MAKE YOUR OWN CHARACTER") ═══ */}
      <AnimatePresence>
        {karakterModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md" onClick={() => setKarakterModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }} onClick={(e) => e.stopPropagation()}
              className="hf-kart flex max-h-[86vh] w-full max-w-[720px] flex-col overflow-hidden bg-[#131517] shadow-2xl">
              {/* Hero banner (Higgsfield "MAKE YOUR OWN CHARACTER" birebir) */}
              <div className="relative flex shrink-0 items-center justify-between gap-4 overflow-hidden border-b border-kenar px-6 py-5">
                <div className="relative z-10 max-w-[62%]">
                  <h2 className="hf-baslik text-[20px] leading-tight sm:text-[24px]">KENDİ KARAKTERİNİ YAP</h2>
                  <p className="mt-2 hidden text-[13px] leading-relaxed text-metin-2 sm:block">Farklı açılardan fotoğraf yükleyip karakterini eğit. Ardından aynı tutarlı karakteri yeni görsel ve videolarda kullan.</p>
                  <button onClick={() => soulAc("karakter")}
                    className="hf-cta hf-cta-parlak mt-3 flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-bold sm:mt-4">
                    Karakter oluştur <Sparkles className="h-4 w-4" />
                  </button>
                </div>
                <div className="relative z-10 hidden shrink-0 gap-2 sm:flex">
                  {["kar-a", "kar-b"].map((s, i) => (
                    <span key={s} className={cn("h-24 w-16 overflow-hidden rounded-lg", i === 1 && "translate-y-2")} style={{ background: gorselArkaG(s, "portre") }} />
                  ))}
                </div>
                <button onClick={() => setKarakterModal(false)} className="hf-btn glass-cip absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-metin-2 hover:text-metin" aria-label="Kapat"><X className="h-4 w-4" /></button>
              </div>
              <div className="shrink-0 border-b border-kenar px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  {([["tumu", "Tümü"], ["soul", "Ruh"], ["soul2", "Ruh 2.0"], ["sinema", "Ruh Sinema"]] as const).map(([id, ad]) => (
                    <button key={id} onClick={() => setKarakterSekme(id)} className={cn("rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors", karakterSekme === id ? "bg-white text-zemin" : "text-metin-2 hover:text-metin")}>{ad}</button>
                  ))}
                </div>
              </div>
              <div className="grid min-h-0 flex-1 grid-cols-3 gap-3 overflow-y-auto p-6 sm:grid-cols-4">
                <button onClick={() => soulAc("karakter")}
                  className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-kenar-2 text-metin-3 transition-colors hover:border-aksan/60 hover:text-metin">
                  <Plus className="h-6 w-6" /><span className="text-[12px] font-semibold">Karakter oluştur</span>
                </button>
                {["Talha", "Emma", "Kai", "Sofia", "Leo", "Aria"].map((k) => (
                  <button key={k} onClick={() => { setSeciliKarakter(k); setKarakterModal(false); toast.success(`Karakter: ${k}`); }}
                    className={cn("group overflow-hidden rounded-xl border text-left transition-all", seciliKarakter === k ? "border-aksan ring-2 ring-aksan/40" : "border-kenar hover:border-kenar-2")}>
                    <span className="block aspect-square" style={{ background: gorselArkaG("gorsel-karakter-" + k, "portre") }} />
                    <span className="block truncate px-2 py-1.5 text-[11px] text-metin-2">{k}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ RUH: MOODBOARD modalı (Higgsfield "CREATE YOUR MOODBOARD") ═══ */}
      <AnimatePresence>
        {moodboardModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md" onClick={() => setMoodboardModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }} onClick={(e) => e.stopPropagation()}
              className="hf-kart flex max-h-[86vh] w-full max-w-[760px] flex-col overflow-hidden bg-[#131517] shadow-2xl">
              {/* Hero banner (Higgsfield "CREATE YOUR MOODBOARD" birebir) */}
              <div className="relative flex shrink-0 items-center justify-between gap-4 overflow-hidden border-b border-kenar px-6 py-5">
                <div className="relative z-10 max-w-[62%]">
                  <h2 className="hf-baslik text-[22px] leading-tight sm:text-[26px]">RUH PANONU OLUŞTUR</h2>
                  <p className="mt-2 hidden text-[13px] leading-relaxed text-metin-2 sm:block">Referanslarını; stil, ton ve yaratıcı yönü tanımlayan net bir ruh panosuna dönüştür.</p>
                  <button onClick={() => soulAc("moodboard")}
                    className="hf-cta hf-cta-parlak mt-3 flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-bold sm:mt-4">
                    Panonu oluştur <Sparkles className="h-4 w-4" />
                  </button>
                </div>
                <div className="relative z-10 hidden shrink-0 gap-2 sm:flex">
                  {["gorsel-mood-a", "gorsel-mood-b", "gorsel-mood-c"].map((s, i) => (
                    <span key={s} className={cn("h-24 w-16 overflow-hidden rounded-lg", i === 1 && "translate-y-2")} style={{ background: gorselArkaG(s, "sinematik") }} />
                  ))}
                </div>
                <button onClick={() => setMoodboardModal(false)} className="hf-btn glass-cip absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-metin-2 hover:text-metin" aria-label="Kapat"><X className="h-4 w-4" /></button>
              </div>
              {/* Curated / My Moodboards + arama */}
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-kenar px-6 py-3">
                <div className="flex items-center gap-1">
                  <span className="glass-cip-aktif rounded-full px-3 py-1.5 text-[13px] font-medium text-metin">Seçilmiş</span>
                  <span className="hf-btn glass-cip rounded-full px-3 py-1.5 text-[13px] text-metin-2 hover:text-metin">Panolarım</span>
                </div>
                <div className="glass-cip flex items-center gap-2 rounded-full px-3 py-1.5">
                  <Search className="h-3.5 w-3.5 text-metin-3" />
                  <input value={moodAra} onChange={(e) => setMoodAra(e.target.value)} placeholder="Preset ara…" className="w-32 bg-transparent text-[13px] outline-none placeholder:text-metin-3" />
                </div>
              </div>
              <div className="grid min-h-0 flex-1 grid-cols-2 gap-3.5 overflow-y-auto p-6 sm:grid-cols-3">
                {MOODBOARD_PRESETLERI.filter((m) => m.toLocaleLowerCase("tr").includes(moodAra.toLocaleLowerCase("tr"))).map((m) => (
                  <button key={m} onClick={() => { setSeciliMoodboard(m); setMoodboardModal(false); toast.success(`Ruh panosu: ${m}`); }}
                    className={cn("hf-kart group relative aspect-[3/4] overflow-hidden", seciliMoodboard === m && "hf-kart-secili")}>
                    {/* Tek görsel katmanı — gerçek mood görseli (çift katman/titreme kaldırıldı) */}
                    {(() => {
                      const u = gorselGercek("gorsel-mood-" + m);
                      return u
                        ? <img src={u} alt={m} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
                        : <span className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.05]" style={{ background: gorselArkaG("gorsel-mood-" + m, "sinematik") }} />;
                    })()}
                    {/* Güçlü alt gradient — isim her zaman net okunur */}
                    <span className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    {seciliMoodboard === m && (
                      <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-aksan text-zemin"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>
                    )}
                    <span className="absolute inset-x-2.5 bottom-2.5 text-left text-[13px] font-bold leading-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">{m}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ RUH: RENK TRANSFERİ / SOUL HEX modalı ═══ */}
      <AnimatePresence>
        {renkModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md" onClick={() => setRenkModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }} onClick={(e) => e.stopPropagation()}
              className="hf-kart flex max-h-[86vh] w-full max-w-[720px] flex-col overflow-hidden bg-[#131517] shadow-2xl">
              {/* Hero banner (Higgsfield "CONTROL YOUR COLORS WITH SOUL HEX" birebir) */}
              <div className="relative flex shrink-0 items-center justify-between gap-4 overflow-hidden border-b border-kenar px-6 py-5">
                <div className="relative z-10 max-w-[62%]">
                  <h2 className="hf-baslik text-[20px] leading-tight sm:text-[24px]">RENKLERİNİ VAYRA HEX İLE YÖNET</h2>
                  <p className="mt-2 hidden text-[13px] leading-relaxed text-metin-2 sm:block">Bir referans görseli yükle; Vayra Hex renklerini kendi stiline taşısın.</p>
                  <button onClick={() => soulAc("renk")}
                    className="hf-cta hf-cta-parlak mt-3 flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-bold sm:mt-4">
                    Yükle & Oluştur <Sparkles className="h-4 w-4" />
                  </button>
                </div>
                <span className="relative z-10 hidden h-28 w-40 shrink-0 overflow-hidden rounded-xl sm:block" style={{ background: gorselArkaG("renk-hero", "sinematik") }} />
                <button onClick={() => setRenkModal(false)} className="hf-btn glass-cip absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-metin-2 hover:text-metin" aria-label="Kapat"><X className="h-4 w-4" /></button>
              </div>
              <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-y-auto p-6 sm:grid-cols-3">
                {seciliRenk && (
                  <button onClick={() => { setSeciliRenk(null); setRenkModal(false); toast("Renk transferi kaldırıldı"); }}
                    className="hf-btn glass-cip col-span-full flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] text-metin-2 hover:text-metin">
                    <X className="h-3.5 w-3.5" /> Renk transferini kaldır
                  </button>
                )}
                {RENK_TRANSFER_PRESETLERI.map((p) => (
                  <button key={p.ad} onClick={() => { setSeciliRenk(p.ad); setRenkModal(false); toast.success(`Renk paleti: ${p.ad}`); }}
                    className={cn("hf-kart overflow-hidden", seciliRenk === p.ad && "hf-kart-secili")}>
                    {/* Örnek görsel */}
                    <span className="block aspect-[4/3]" style={{ background: gorselArkaG("renk-ornek-" + p.ad, "sinematik") }} />
                    {/* Palet şeridi (Higgsfield birebir) */}
                    <span className="flex h-2.5">
                      {p.renkler.map((c) => <span key={c} className="flex-1" style={{ background: c }} />)}
                    </span>
                    <span className="block px-2.5 py-1.5 text-left text-[12px] font-medium text-metin">{p.ad}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ ÇİZİM (DRAW) modalı — Higgsfield "Draw to Edit / Sketch to Video" birebir ═══ */}
      <AnimatePresence>
        {cizimModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[85] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" onClick={() => setCizimModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 12 }} onClick={(e) => e.stopPropagation()}
              className="hf-kart relative flex max-h-[90vh] w-full max-w-[1080px] flex-col overflow-hidden bg-[#0f1113] shadow-2xl">
              {/* Üst sekmeler */}
              <div className="relative flex items-center justify-center gap-1 px-6 py-4">
                {([
                  { id: "sketch", ad: "Eskizden Videoya", yeni: true },
                  { id: "draw", ad: "Çizerek Videoya", yeni: false },
                  { id: "edit", ad: "Çizerek Düzenle", yeni: false },
                ] as const).map((s) => (
                  <button key={s.id} onClick={() => setCizimSekme(s.id)}
                    className={cn("flex items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-medium transition-colors",
                      cizimSekme === s.id ? "glass-cip-aktif text-metin" : "text-metin-2 hover:text-metin")}>
                    <Pencil className="h-4 w-4" /> {s.ad}
                    {s.yeni && <span className="rounded bg-aksan px-1.5 py-0.5 text-[9px] font-bold text-zemin">YENİ</span>}
                  </button>
                ))}
                <button onClick={() => setCizimModal(false)} className="hf-btn glass-ikon absolute right-4 top-3 flex h-9 w-9 items-center justify-center rounded-full text-metin-2 hover:text-metin" aria-label="Kapat"><X className="h-4 w-4" /></button>
              </div>

              {/* GERÇEK çizim tuvali — fare/dokunma ile çiz, kalem/silgi/renk/kalınlık/undo/redo taşır */}
              <div className="mx-6 flex-1 overflow-y-auto">
                <CizimCanvas ref={cizimCanvasRef} arka={cizimSekme === "edit" ? gorselArkaG("cizim-tuval", "sinematik") : undefined} />
              </div>

              {/* Alt çubuk: model seçici (sol) + Üret (sağ) — çizim araçları artık tuvalde */}
              <div className="flex items-center gap-3 px-6 py-4">
                {/* Model çipi → model dropdown */}
                <div className="relative">
                  <button onClick={() => setCizimModelAcik((v) => !v)} className="hf-btn glass-cip flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] text-metin">
                    <BarChart3 className="h-3.5 w-3.5" /> {model} <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", cizimModelAcik && "rotate-90")} />
                  </button>
                  <AnimatePresence>
                    {cizimModelAcik && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setCizimModelAcik(false)} />
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                          className="menu-surface absolute bottom-full left-0 z-50 mb-2 max-h-64 w-56 overflow-y-auto rounded-xl p-1.5">
                          {modelListe.slice(0, 14).map((m) => (
                            <button key={m.ad} onClick={() => { setModel(m.ad); setCizimModelAcik(false); }}
                              className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors", model === m.ad ? "bg-white/8 text-metin" : "text-metin-2 hover:bg-white/6 hover:text-metin")}>
                              <BarChart3 className="h-3.5 w-3.5 shrink-0" /> <span className="min-w-0 flex-1 truncate">{m.ad}</span>
                              {model === m.ad && <Check className="h-3.5 w-3.5 text-aksan" />}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Üret — GERÇEK çizimi (canvas dataUrl) referans olarak geçir */}
                <button onClick={() => {
                  if (cizimCanvasRef.current?.bosMu()) return toast.error("Önce tuvale bir şeyler çiz");
                  const cizimData = cizimCanvasRef.current?.dataUrl();
                  const cizimVideo = cizimSekme !== "edit";
                  const sonuc = uretimBaslat({ baslik: cizimVideo ? "Çizimden video" : "Çizimden görsel", tur: cizimVideo ? "video" : "gorsel", model, prompt: (prompt || "çizim") + " · tuvalden", kredi: 2, arac: "Çizim", projeId: aktifProjeId ?? undefined, meta: { oran, cozunurluk, gorselUrl: cizimData } });
                  if (!sonuc.ok) return uretimHataToast(sonuc, "Üretilemedi");
                  toast.success(cizimVideo ? "Video üretiliyor ✦" : "Görsel üretiliyor ✦", { description: `${model} · çizimden · 2 kredi` });
                  cizimCanvasRef.current?.temizle();
                  setCizimModal(false);
                }}
                  className="hf-cta hf-cta-parlak ml-auto flex items-center gap-2 rounded-[14px] px-5 py-2.5 text-[15px] font-bold">
                  {cizimSekme === "edit" ? "Görsel Üret" : "Video Üret"} <Sparkles className="h-4 w-4" /> 2
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════ VARLIK GÖRÜNTÜLEYİCİ (LIGHTBOX) ═══════════════════════ */}
      <AnimatePresence>
        {seciliKart && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[60] flex bg-black/85 backdrop-blur-sm"
            onClick={lightboxKapat}
          >
            {/* Kapat (sol üst) */}
            <button
              onClick={lightboxKapat}
              className="absolute left-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full glass-ikon text-white backdrop-blur transition-colors"
              aria-label="Kapat"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Büyük görsel alanı */}
            <div
              className="relative flex flex-1 items-center justify-center overflow-hidden p-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Görselin renklerinden türeyen blurlu arka plan (Higgsfield birebir — madde 15) */}
              <div
                key={"blur-" + seciliKart}
                className="pointer-events-none absolute inset-0 scale-125"
                style={{
                  backgroundImage: `url("${saltUrl(seciliKart) ?? seciliKart}")`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "blur(60px) saturate(1.5) brightness(0.55)",
                }}
              />
              <div className="pointer-events-none absolute inset-0 bg-black/30" />
              {/* Önceki (Higgsfield: sol ok ile önceki üretime geç) */}
              {lbIndex > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); lightboxGez(-1); }}
                  className="hf-btn glass-ikon absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white"
                  aria-label="Önceki görsel"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}

              <motion.img
                ref={lbImgRef}
                key={seciliKart}
                initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                src={saltUrl(seciliKart) ?? seciliKart}
                alt=""
                className="relative z-[5] max-h-full max-w-full rounded-xl object-contain shadow-2xl shadow-black/60"
              />

              {/* Sonraki (Higgsfield: sağ ok ile sonraki üretime geç) */}
              {lbIndex >= 0 && lbIndex < TUM_GORSELLER.length - 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); lightboxGez(1); }}
                  className="hf-btn glass-ikon absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white"
                  aria-label="Sonraki görsel"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}

              {/* Tam ekran — görselin KENDİSİNİ tarayıcı fullscreen'ine al (Higgsfield birebir) */}
              <button
                onClick={(e) => { e.stopPropagation(); tamEkranAc(); }}
                className="absolute bottom-4 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full glass-ikon text-white backdrop-blur transition-colors"
                aria-label="Tam ekran"
              >
                <Maximize2 className="h-5 w-5" />
              </button>
            </div>

            {/* Sağ araç paneli — slide-in. KUTU DIŞI kademesi (#131517): içindeki
                İSTEM/DETAYLAR kutuları (#1c1e20) ondan bir ton açık kalsın diye
                glass-strong (#1c1e20) yerine bg-yuzey kullanılır — merdiven korunur. */}
            <motion.aside
              initial={{ x: 340, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 340, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              onClick={(e) => e.stopPropagation()}
              className="flex w-[340px] shrink-0 flex-col border-l border-white/10 bg-yuzey shadow-[0_12px_36px_-12px_rgba(0,0,0,0.7)]"
            >
              <AnimatePresence mode="wait">
                {aktifArac === "renk" ? (
                  <RenkPaneli
                    key="renk"
                    preset={preset} setPreset={setPreset}
                    efektAcik={efektAcik} setEfektAcik={setEfektAcik}
                    efektGenis={efektGenis} setEfektGenis={setEfektGenis}
                    onGeri={() => setAktifArac(null)} onKapat={lightboxKapat}
                    onUygula={efektUygula}
                    onIndir={() => gorseliIndir(seciliKart ?? undefined, gorselAdi)}
                  />
                ) : aktifArac === "upscale" ? (
                  <UpscalePaneli
                    key="upscale"
                    model={upModel} setModel={setUpModel}
                    modelAcik={upModelAcik} setModelAcik={setUpModelAcik}
                    olcek={upOlcek} setOlcek={setUpOlcek}
                    gelismis={upGelismis} setGelismis={setUpGelismis}
                    keskinlik={upKeskinlik} setKeskinlik={setUpKeskinlik}
                    denoise={upDenoise} setDenoise={setUpDenoise}
                    yuz={upYuz} setYuz={setUpYuz}
                    onGeri={() => setAktifArac(null)} onKapat={lightboxKapat}
                    onUygula={upscaleUygula}
                  />
                ) : aktifArac === "iyilestirici" ? (
                  <IyilestiriciPaneli key="iyilestirici" onGeri={() => setAktifArac(null)} onKapat={lightboxKapat}
                    onUygula={() => aracUygula("İyileştirici", 2, "cilt ve doku iyileştirme")} />
                ) : aktifArac === "isik" ? (
                  <IsikPaneli key="isik" onGeri={() => setAktifArac(null)} onKapat={lightboxKapat}
                    onUygula={() => aracUygula("Yeniden Işıklandır", 2, "ışık yönü ve tonu yeniden")} />
                ) : aktifArac === "inpaint" ? (
                  <InpaintPaneli key="inpaint" onGeri={() => setAktifArac(null)} onKapat={lightboxKapat}
                    onUygula={() => aracUygula("İç Boyama", 3, "seçili alanı yeniden çiz")} />
                ) : aktifArac === "acilar" ? (
                  <AcilarPaneli key="acilar" onGeri={() => setAktifArac(null)} onKapat={lightboxKapat}
                    onUygula={() => aracUygula("Açılar", 1, "kamera açısı yeniden")} />
                ) : aktifArac === "reframe" ? (
                  <ReframePaneli key="reframe" onGeri={() => setAktifArac(null)} onKapat={lightboxKapat}
                    onUygula={(oran) => aracUygula("Yeniden Çerçevele", 2, `${oran} orana genişletildi (outpaint)`)} />
                ) : aktifArac === "arkaplan" ? (
                  <ArkaplanPaneli key="arkaplan" onGeri={() => setAktifArac(null)} onKapat={lightboxKapat}
                    onUygula={() => aracUygula("Arka Planı Kaldır", 2, "arka plan şeffaflaştırıldı (cutout)")} />
                ) : (
                  <motion.div
                    key="drawer"
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.16 }}
                    className="flex h-full flex-col"
                  >
                    {/* GÖRSEL ADI — düzenlenebilir (madde 3, 2026-07-31).
                        Eskiden burada "Vayra Kullanıcısı / Üretici" yazıyordu;
                        kullanıcıya hiçbir şey söylemiyordu. Artık görselin ADI
                        durur, kalemle değiştirilir ve İNDİRME DOSYA ADI da bu
                        olur (ahmet.png gibi). */}
                    <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3">
                      {adDuzenleniyor ? (
                        <input
                          autoFocus
                          value={adTaslak}
                          onChange={(e) => setAdTaslak(e.target.value)}
                          onBlur={adKaydet}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { e.preventDefault(); adKaydet(); }
                            if (e.key === "Escape") { e.preventDefault(); setAdDuzenleniyor(false); }
                          }}
                          aria-label="Görsel adı"
                          className="min-w-0 flex-1 rounded-lg bg-white/8 px-2.5 py-1.5 text-sm font-semibold text-white outline-none ring-1 ring-aksan/50"
                        />
                      ) : (
                        <button
                          onClick={() => { setAdTaslak(gorselAdi); setAdDuzenleniyor(true); }}
                          className="group/ad flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-white/6"
                          title="Adı düzenle"
                        >
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{gorselAdi}</span>
                          <Pencil className="h-3.5 w-3.5 shrink-0 text-metin-3 transition-colors group-hover/ad:text-aksan" />
                        </button>
                      )}
                      <button onClick={lightboxKapat} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-white/8 hover:text-metin" aria-label="Kapat">
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Segment: Bilgi / Araçlar / Yorumlar — Higgsfield birebir buzlu-cam sekmeler */}
                    <div className="flex gap-1.5 border-b border-white/8 px-2.5 py-2.5">
                      {([["info", "Bilgi", Info], ["araclar", "Araçlar", Wand2], ["yorumlar", "Yorumlar", MessageCircle]] as const).map(([id, ad, Ikon]) => (
                        <button
                          key={id}
                          onClick={() => setLbSekme(id)}
                          className={cn(
                            "flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-[13px] font-medium",
                            lbSekme === id ? "glass-cip-aktif text-white" : "glass-cip text-metin-2 hover:text-metin",
                          )}
                        >
                          <Ikon className={cn("h-3.5 w-3.5", lbSekme === id && "text-aksan")} /> {ad}
                        </button>
                      ))}
                    </div>

                    {/* İçerik */}
                    <div className="flex-1 overflow-y-auto">
                      {lbSekme === "info" && (
                        /* prompt: composer'ın canlı metni DEĞİL, bu üretimin
                           kendi kayıtlı metni (bkz. acikPrompt notu). Dosya
                           adı ve element açıklaması da ondan türetilir. */
                        <InfoSekmesi url={seciliKart} model={acikUretim?.model ?? model} oran={oran} prompt={acikPrompt} onKapat={lightboxKapat}
                          onIndir={() => gorseliIndir(seciliKart ?? undefined, gorselAdi)}
                          onYenidenUret={() => { yenidenUret(); lightboxKapat(); }}
                          onElement={() => elementModalAc(seciliKart, acikPrompt)}
                          onAyarlariYukle={() => ayarlariComposeraYukle()} />
                      )}
                      {lbSekme === "araclar" && (
                        <div className="p-2">
                          {/* Higgsfield "EDIT IMAGE" başlığı */}
                          <p className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-metin-3">
                            <Wand2 className="h-3.5 w-3.5" /> Görseli Düzenle
                          </p>
                          {ARACLAR.map((a) => {
                            const Ikon = a.ikon;
                            return (
                              <button
                                key={a.id}
                                onClick={() => aracTikla(a.id)}
                                className="flex w-full items-center gap-3 rounded-[11px] px-3 py-2.5 text-left text-sm transition-colors hover:bg-white/6"
                              >
                                {/* Higgsfield birebir: ikon kutusuz, sade */}
                                <Ikon className="h-[18px] w-[18px] shrink-0 text-metin-2" />
                                <span className="flex-1 font-medium">{a.ad}</span>
                                {a.rozet && <span className="rounded bg-aksan px-1.5 py-0.5 text-[9px] font-bold text-zemin">{a.rozet}</span>}
                                <ChevronRight className="h-4 w-4 text-metin-3" />
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {lbSekme === "yorumlar" && seciliKart && (
                        <YorumSekmesi yorum={yorum} setYorum={setYorum} konuId={seciliKart} />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ REFERANS TAM-EKRAN ÖNİZLEME (madde 11) ═══ */}
      <AnimatePresence>
        {medyaOnizle && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMedyaOnizle(null)}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-6 backdrop-blur-sm"
          >
            <button onClick={() => setMedyaOnizle(null)} className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full glass-ikon text-white transition-colors" aria-label="Kapat"><X className="h-5 w-5" /></button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
              initial={{ scale: 0.94 }} animate={{ scale: 1 }} exit={{ scale: 0.94 }}
              src={medyaOnizle} alt="Referans önizleme"
              onClick={(e) => e.stopPropagation()}
              className="max-h-[88vh] max-w-[88vw] rounded-2xl object-contain shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ ELEMENT SEÇİCİ (@ referans) — Higgsfield birebir popup ═══ */}
      <AnimatePresence>
        {elementSeciciModal && (
          <ElementSeciciModal onSec={(ad) => elementEkle(ad)} onKapat={() => setElementSeciciModal(false)} />
        )}
      </AnimatePresence>

      {/* ═══════════════════════ YENİ ELEMENT MODALI ═══════════════════════ */}
      <AnimatePresence>
        {elementModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4 backdrop-blur-md"
            onClick={() => setElementModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="hf-kart w-full max-w-[880px] overflow-hidden bg-[#232527] shadow-2xl shadow-black/60"
            >
              {/* Başlık */}
              <div className="flex items-center justify-between border-b border-kenar px-6 py-4">
                <h2 className="text-[18px] font-semibold">Yeni Element</h2>
                <button
                  onClick={() => setElementModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-aksan ring-1 ring-aksan transition-colors hover:bg-aksan/10"
                  aria-label="Kapat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* 2 sütun gövde */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr]">
                {/* Sol: meta */}
                <div className="space-y-4 p-6">
                  <input
                    value={elementAd}
                    onChange={(e) => setElementAd(e.target.value)}
                    placeholder="Element adı"
                    className="glass-cip w-full rounded-lg px-3.5 py-2.5 text-[15px] outline-none"
                  />
                  <textarea
                    value={elementAciklama}
                    onChange={(e) => setElementAciklama(e.target.value)}
                    placeholder="Açıklama ekle"
                    rows={3}
                    className="glass-cip w-full resize-none rounded-lg px-3.5 py-2.5 text-sm outline-none placeholder:text-metin-3"
                  />
                  {/* Kategori dropdown */}
                  <div>
                    <label className="mb-1.5 block text-[12px] text-metin-2">Kategori</label>
                    <div className="relative">
                      <button
                        onClick={() => setElementKategoriAcik((v) => !v)}
                        className="hf-btn glass-cip flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 text-sm"
                      >
                        {elementKategori}
                        <ChevronDown className={cn("h-4 w-4 text-metin-2 transition-transform", elementKategoriAcik && "rotate-180")} />
                      </button>
                      <AnimatePresence>
                        {elementKategoriAcik && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setElementKategoriAcik(false)} />
                            {/* m6: YANA açılır (alta değil) — modal içinde scroll gerektirmesin */}
                            <motion.div
                              initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.12 }}
                              className="menu-surface absolute left-full top-0 z-20 ml-2 w-44 overflow-hidden rounded-xl p-1"
                            >
                              {["Oto", "Karakter", "Nesne", "Stil", "Sahne"].map((k) => (
                                <button
                                  key={k}
                                  onClick={() => { setElementKategori(k); setElementKategoriAcik(false); }}
                                  className={cn("flex w-full items-center justify-between rounded-[9px] px-2.5 py-2 text-sm transition-colors hover:bg-white/8", elementKategori === k && "bg-white/[0.06]")}
                                >
                                  {k}
                                  {elementKategori === k && <Check className="h-4 w-4 text-aksan" />}
                                </button>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  {/* Workspace */}
                  <div>
                    <label className="mb-1.5 block text-[12px] text-metin-2">Çalışma alanı</label>
                    <div className="glass-cip flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full glass-ikon glass-ikon-lime text-[11px] font-bold text-aksan">
                        {(kullanici?.ad ?? "V").slice(0, 1).toLocaleUpperCase("tr")}
                      </span>
                      {kullanici?.ad ?? "Vayra Kullanıcısı"}
                    </div>
                  </div>
                </div>

                {/* Dikey hairline */}
                <div className="hidden w-px bg-kenar md:block" />

                {/* Sağ: medya yükleme (gerçek dosya seçici) */}
                <div className="p-6">
                  <label className="mb-1.5 block text-[12px] text-metin-2">Medya yükle</label>
                  <input ref={elementMedyaRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => {
                      const d = e.target.files?.[0]; e.target.value = "";
                      if (!d) return;
                      const ok = new FileReader();
                      ok.onload = () => { setElementMedya(String(ok.result)); toast.success("Medya eklendi 🖼"); };
                      ok.readAsDataURL(d);
                    }} />
                  <button
                    onClick={() => elementMedyaRef.current?.click()}
                    className="hf-btn glass-cip relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-xl text-metin-2"
                  >
                    {elementMedya ? (
                      <>
                        <img src={elementMedya} alt="Element medyası" className="absolute inset-0 h-full w-full object-cover" />
                        <span className="glass-cip absolute bottom-2 right-2 rounded-full px-2.5 py-1 text-[11px] text-white">Değiştir</span>
                      </>
                    ) : (
                      <>
                        <span className="flex h-12 w-12 items-center justify-center rounded-full glass-ikon">
                          <Plus className="h-6 w-6" />
                        </span>
                        <span className="text-sm">Sürükle bırak veya yüklemek için tıkla</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Alt aksiyon çubuğu */}
              <div className="flex items-center justify-end gap-2 border-t border-kenar px-6 py-4">
                <button
                  onClick={() => setElementModal(false)}
                  className="rounded-[11px] px-4 py-2.5 text-sm font-medium text-metin-2 transition-colors hover:bg-white/6 hover:text-metin"
                >
                  İptal
                </button>
                <button onClick={elementOlustur} className="hf-cta px-5 py-2.5 text-sm">
                  Oluştur
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Yeni klasör — kart menüsündeki "Klasöre ekle › Yeni klasör" akışı.
          Ortak GirdiModal kullanılıyor (ayrı bir ekran yazmaya gerek yok). */}
      <GirdiModal
        acik={yeniKlasorIcin !== null}
        baslik="Yeni klasör"
        etiket="Klasör adı"
        varsayilan=""
        kaydetAd="Oluştur"
        onKaydet={yeniKlasorKaydet}
        onKapat={() => setYeniKlasorIcin(null)}
      />
    </div>
    </>
  );
}

/* ═══════════════════════ SLIDER (range) ═══════════════════════ */
function Slider({
  ad, min, max, deger, setDeger, disabled, degeriSolda,
}: {
  ad: string; min: number; max: number; deger: number;
  setDeger: (n: number) => void; disabled?: boolean; degeriSolda?: boolean;
}) {
  return (
    <div className={cn("space-y-1.5", disabled && "opacity-40")}>
      <div className="flex items-center justify-between text-[12px]">
        <span className="flex items-center gap-1 text-metin-2">
          {ad}
          <Info className="h-3 w-3 text-metin-3" />
        </span>
        {!degeriSolda && <span className="tabular-nums text-metin">{deger}</span>}
      </div>
      <div className="flex items-center gap-2">
        {degeriSolda && <span className="w-8 shrink-0 text-[12px] tabular-nums text-metin">{deger}</span>}
        <input
          type="range" min={min} max={max} value={deger} disabled={disabled}
          onChange={(e) => setDeger(Number(e.target.value))}
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/12 accent-aksan disabled:cursor-not-allowed"
          aria-label={ad}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════ ALT PANEL BAŞLIĞI ═══════════════════════ */
function AltBaslik({ ikon: Ikon, ad, onGeri, onKapat }: { ikon: typeof Palette; ad: string; onGeri: () => void; onKapat: () => void }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-white/8 px-3 py-3.5">
      <button onClick={onGeri} className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-white/8 hover:text-metin" aria-label="Geri">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <span className="flex h-8 w-8 items-center justify-center rounded-full glass-ikon">
        <Ikon className="h-4 w-4 text-metin" />
      </span>
      <span className="flex-1 text-[15px] font-semibold">{ad}</span>
      <button onClick={onKapat} className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-white/8 hover:text-metin" aria-label="Kapat">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ═══════════════════════ RENK DERECELENDİRME PANELİ ═══════════════════════ */
function RenkPaneli({
  preset, setPreset, efektAcik, setEfektAcik, efektGenis, setEfektGenis, onGeri, onKapat, onUygula, onIndir,
}: {
  preset: string; setPreset: (s: string) => void;
  efektAcik: Record<string, boolean>; setEfektAcik: (f: (p: Record<string, boolean>) => Record<string, boolean>) => void;
  efektGenis: string | null; setEfektGenis: (s: string | null) => void;
  onGeri: () => void; onKapat: () => void; onUygula: () => void; onIndir: () => void;
}) {
  // Slider'lar için yerel değerler
  const [degerler, setDegerler] = useState<Record<string, number>>({});
  const sd = (k: string, on: number) => degerler[k] ?? on;

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.18 }}
      className="flex h-full flex-col"
    >
      <AltBaslik ikon={Palette} ad="Renk Derecelendirme" onGeri={onGeri} onKapat={onKapat} />

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {/* PRESETLER 3×3 */}
        <div className="glass-cip rounded-xl p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-metin-2">Presetler</p>
          <div className="grid grid-cols-3 gap-2.5">
            {RENK_PRESETLERI.map((p) => {
              const secili = preset === p;
              return (
                <button
                  key={p}
                  onClick={() => setPreset(p)}
                  className={cn(
                    "group/preset relative overflow-hidden rounded-lg text-center",
                    secili && "ring-2 ring-aksan ring-offset-2 ring-offset-[#252527]",
                  )}
                >
                  <span className="flex aspect-[86/62] items-center justify-center bg-gradient-to-br from-white/12 to-white/4">
                    {p === "None" && <span className="text-[10px] text-metin-3">Yok</span>}
                    {secili && (
                      <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-aksan text-zemin">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </span>
                  <span className="block truncate px-0.5 py-1 text-[11px] text-metin">{p}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Akordiyon efekt bölümleri */}
        {EFEKT_BOLUMLERI.map((b) => {
          const acik = efektAcik[b.id] ?? false;
          const genis = efektGenis === b.id;
          return (
            <div key={b.id} className="glass-cip overflow-hidden rounded-xl">
              <div className="flex items-center gap-2 px-3 py-2.5">
                <button
                  onClick={() => setEfektGenis(genis ? null : b.id)}
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  <ChevronDown className={cn("h-4 w-4 text-metin-2 transition-transform", !genis && "-rotate-90")} />
                  <span className="text-sm font-medium">{b.ad}</span>
                  <Info className="h-3.5 w-3.5 text-metin-3" />
                </button>
                {/* Bölüm toggle */}
                <button
                  onClick={() => setEfektAcik((p) => ({ ...p, [b.id]: !acik }))}
                  className={cn("relative h-4 w-7 shrink-0 rounded-full transition-colors", acik ? "bg-aksan" : "bg-white/20")}
                  aria-label={`${b.ad} aç/kapat`}
                >
                  <span className={cn("absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all", acik ? "left-3.5" : "left-0.5")} />
                </button>
              </div>
              <AnimatePresence initial={false}>
                {genis && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 px-3 pb-3">
                      {b.sliderlar.map((s) => {
                        const key = `${b.id}.${s.ad}`;
                        return (
                          <Slider
                            key={key} ad={s.ad} min={s.min} max={s.max}
                            deger={sd(key, s.on)} setDeger={(n) => setDegerler((d) => ({ ...d, [key]: n }))}
                            disabled={!acik}
                          />
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Alt sabit çubuk */}
      <div className="flex items-center gap-2 border-t border-white/8 p-3">
        <button
          onClick={() => { setPreset("None"); setEfektAcik(() => ({})); setDegerler({}); toast("Sıfırlandı"); }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full glass-ikon text-metin-2 transition-colors hover:text-metin"
          aria-label="Sıfırla"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          onClick={onIndir}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full glass-ikon text-metin-2 transition-colors hover:text-metin"
          aria-label="İndir"
        >
          <Download className="h-4 w-4" />
        </button>
        <button onClick={onUygula} className="hf-cta flex-1 py-2.5 text-sm">
          Efekti Uygula
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════ UPSCALE PANELİ ═══════════════════════ */
/* ═══ İyileştirici — cilt/doku iyileştirme (Higgsfield Enhancer birebir) ═══ */
function IyilestiriciPaneli({ onGeri, onKapat, onUygula }: { onGeri: () => void; onKapat: () => void; onUygula: () => void }) {
  const [tip, setTip] = useState("Gerçekçi ten");
  const tipler = ["Yumuşak ten", "Gerçekçi ten", "Kusurlu ten"];
  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.18 }} className="flex h-full flex-col">
      <AltBaslik ikon={Wand2} ad="İyileştirici" onGeri={onGeri} onKapat={onKapat} />
      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        <p className="text-[13px] text-metin-2">İyileştirme türünü seç:</p>
        <div className="grid grid-cols-2 gap-2">
          {tipler.map((t) => (
            <button key={t} onClick={() => setTip(t)}
              className={cn("relative overflow-hidden rounded-xl border text-left transition-colors", tip === t ? "border-aksan ring-1 ring-aksan/50" : "border-kenar hover:border-kenar-2")}>
              <span className="block aspect-[4/3]" style={{ background: gorselArkaG("iyilestir-" + t, "portre") }} />
              {tip === t && <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-aksan text-zemin"><Check className="h-3 w-3" /></span>}
              <span className="absolute bottom-1.5 left-2 text-[11px] font-medium text-white drop-shadow">{t}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="border-t border-white/8 p-3">
        <button onClick={onUygula} className="hf-cta flex w-full items-center justify-center gap-1.5 py-2.5 text-[14px]">İyileştir <Sparkles className="h-4 w-4" /> 4</button>
      </div>
    </motion.div>
  );
}

/* ═══ Yeniden Işıklandır (Higgsfield Relight birebir) ═══ */
function IsikPaneli({ onGeri, onKapat, onUygula }: { onGeri: () => void; onKapat: () => void; onUygula: () => void }) {
  const [yon, setYon] = useState("Ön");
  const [sertlik, setSertlik] = useState("Yumuşak");
  const [parlaklik, setParlaklik] = useState(50);
  const yonler = ["Üst", "Ön", "Sağ", "Sol", "Arka", "Alt"];
  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.18 }} className="flex h-full flex-col">
      <AltBaslik ikon={Sun} ad="Yeniden Işıklandır" onGeri={onGeri} onKapat={onKapat} />
      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-metin-2">Hızlı seçim</p>
          <div className="grid grid-cols-3 gap-1.5">
            {yonler.map((y) => (
              <button key={y} onClick={() => setYon(y)}
                className={cn("rounded-lg border py-2 text-[12px] transition-colors", yon === y ? "border-aksan bg-aksan/10 text-aksan" : "border-kenar text-metin-2 hover:text-metin")}>{y}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-metin-2">Işık ayarları</p>
          <div className="glass-cip mb-3 flex gap-1 rounded-full p-1">
            {["Yumuşak", "Sert"].map((s) => (
              <button key={s} onClick={() => setSertlik(s)}
                className={cn("flex-1 rounded-full py-1.5 text-[12px] transition-colors", sertlik === s ? "glass-cip-aktif text-metin" : "text-metin-2")}>{s}</button>
            ))}
          </div>
          <Slider ad="Parlaklık" min={0} max={100} deger={parlaklik} setDeger={setParlaklik} degeriSolda />
        </div>
      </div>
      <div className="border-t border-white/8 p-3">
        <button onClick={onUygula} className="hf-cta flex w-full items-center justify-center gap-1.5 py-2.5 text-[14px]">Üret <Sparkles className="h-4 w-4" /> 2</button>
      </div>
    </motion.div>
  );
}

/* ═══ İç Boyama — Inpaint (Higgsfield birebir) ═══ */
function InpaintPaneli({ onGeri, onKapat, onUygula }: { onGeri: () => void; onKapat: () => void; onUygula: () => void }) {
  const [arac, setArac] = useState<"fircayla" | "silgi">("fircayla");
  const [firca, setFirca] = useState(43);
  const [aciklama, setAciklama] = useState("");
  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.18 }} className="flex h-full flex-col">
      <AltBaslik ikon={Scissors} ad="İç Boyama" onGeri={onGeri} onKapat={onKapat} />
      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        <div className="glass-cip flex items-center gap-1 rounded-full p-1">
          <button onClick={() => setArac("fircayla")} className={cn("flex flex-1 items-center justify-center gap-1 rounded-full py-1.5 text-[12px] transition-colors", arac === "fircayla" ? "glass-cip-aktif text-metin" : "text-metin-2")}><Pencil className="h-3.5 w-3.5" /> Fırça</button>
          <button onClick={() => setArac("silgi")} className={cn("flex flex-1 items-center justify-center gap-1 rounded-full py-1.5 text-[12px] transition-colors", arac === "silgi" ? "glass-cip-aktif text-metin" : "text-metin-2")}><Eraser className="h-3.5 w-3.5" /> Silgi</button>
        </div>
        <Slider ad="Fırça boyutu" min={5} max={100} deger={firca} setDeger={setFirca} degeriSolda />
        <textarea value={aciklama} onChange={(e) => setAciklama(e.target.value)} rows={3}
          placeholder="Düzenlenecek alanı boya ve değişikliği yaz…"
          className="glass-cip w-full resize-none rounded-xl p-2.5 text-[13px] outline-none placeholder:text-metin-3" />
      </div>
      <div className="border-t border-white/8 p-3">
        <button onClick={onUygula} className="hf-cta flex w-full items-center justify-center gap-1.5 py-2.5 text-[14px]">Üret <Sparkles className="h-4 w-4" /> 3</button>
      </div>
    </motion.div>
  );
}

/* ═══ Açılar — kamera açısı (Higgsfield Angles birebir) ═══ */
function AcilarPaneli({ onGeri, onKapat, onUygula }: { onGeri: () => void; onKapat: () => void; onUygula: () => void }) {
  const [donme, setDonme] = useState(0);
  const [egim, setEgim] = useState(0);
  const [yakin, setYakin] = useState(0);
  const [oto, setOto] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.18 }} className="flex h-full flex-col">
      <AltBaslik ikon={RotateCcw} ad="Açılar" onGeri={onGeri} onKapat={onKapat} />
      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        {/* Küre pad */}
        <div className="glass-cip relative flex aspect-square w-full items-center justify-center rounded-xl">
          <span className="absolute inset-4 rounded-full border border-dashed border-kenar-2" />
          <span className="h-12 w-12 rounded-lg" style={{ background: gorselArkaG("acilar-pad", "sinematik") }} />
          <span className="pointer-events-none absolute bottom-2 text-[10px] text-metin-3">Kamera açısını sürükleyerek değiştir</span>
        </div>
        <label className="flex items-center gap-2 text-[13px] text-metin-2">
          <input type="checkbox" checked={oto} onChange={(e) => setOto(e.target.checked)} className="h-4 w-4 accent-aksan" />
          En iyi 12 açıdan üret
        </label>
        <Slider ad="Döndürme" min={-180} max={180} deger={donme} setDeger={setDonme} degeriSolda />
        <Slider ad="Eğim" min={-90} max={90} deger={egim} setDeger={setEgim} degeriSolda />
        <Slider ad="Yakınlaştır" min={0} max={100} deger={yakin} setDeger={setYakin} degeriSolda />
      </div>
      <div className="border-t border-white/8 p-3">
        <button onClick={onUygula} className="hf-cta flex w-full items-center justify-center gap-1.5 py-2.5 text-[14px]">Üret <Sparkles className="h-4 w-4" /> 1</button>
      </div>
    </motion.div>
  );
}

// Yeniden Çerçevele (Reframe / outpaint) — görseli farklı orana genişletir.
function ReframePaneli({ onGeri, onKapat, onUygula }: { onGeri: () => void; onKapat: () => void; onUygula: (oran: string) => void }) {
  const oranlar = ["16:9", "9:16", "1:1", "4:5", "3:2", "21:9"];
  const [oran, setOran] = useState("16:9");
  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.18 }} className="flex h-full flex-col">
      <AltBaslik ikon={Crop} ad="Yeniden Çerçevele" onGeri={onGeri} onKapat={onKapat} />
      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        <p className="text-[12px] text-metin-3">Görseli yeni en-boy oranına outpaint ile genişlet — kenarlar doğal doldurulur.</p>
        <div className="grid grid-cols-3 gap-2">
          {oranlar.map((o) => (
            <button key={o} onClick={() => setOran(o)}
              className={cn("flex flex-col items-center gap-1.5 rounded-xl border py-3 text-[12px] font-medium transition-colors",
                oran === o ? "border-aksan bg-aksan/10 text-aksan" : "border-kenar text-metin-2 hover:border-kenar-2")}>
              <span className="rounded-[3px] border-2 border-current" style={{ width: 26, height: 26 / (Number(o.split(":")[0]) / Number(o.split(":")[1])) }} />
              {o}
            </button>
          ))}
        </div>
      </div>
      <div className="border-t border-white/8 p-3">
        <button onClick={() => onUygula(oran)} className="hf-cta flex w-full items-center justify-center gap-1.5 py-2.5 text-[14px]">Genişlet <Sparkles className="h-4 w-4" /> 2</button>
      </div>
    </motion.div>
  );
}

// Arka Planı Kaldır — özneyi kesip şeffaf zemin bırakır (cutout).
function ArkaplanPaneli({ onGeri, onKapat, onUygula }: { onGeri: () => void; onKapat: () => void; onUygula: () => void }) {
  const [mod, setMod] = useState<"seffaf" | "beyaz" | "renk">("seffaf");
  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.18 }} className="flex h-full flex-col">
      <AltBaslik ikon={Eraser} ad="Arka Planı Kaldır" onGeri={onGeri} onKapat={onKapat} />
      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        <p className="text-[12px] text-metin-3">Özneyi otomatik seç, arka planı kaldır. Yeni zemini seç.</p>
        <div className="hf-dama flex aspect-video w-full items-center justify-center rounded-xl">
          <span className="rounded-lg px-3 py-1.5 text-[11px] font-medium text-ink-950" style={{ background: "rgba(255,255,255,0.8)" }}>Önizleme (şeffaf)</span>
        </div>
        <div className="space-y-1.5">
          {([["seffaf", "Şeffaf (PNG)"], ["beyaz", "Beyaz zemin"], ["renk", "Düz renk zemin"]] as const).map(([id, ad]) => (
            <button key={id} onClick={() => setMod(id)}
              className={cn("flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-[13px] transition-colors",
                mod === id ? "border-aksan bg-aksan/10 text-aksan" : "border-kenar text-metin-2 hover:border-kenar-2")}>
              {ad} {mod === id && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </div>
      <div className="border-t border-white/8 p-3">
        <button onClick={onUygula} className="hf-cta flex w-full items-center justify-center gap-1.5 py-2.5 text-[14px]">Uygula <Sparkles className="h-4 w-4" /> 2</button>
      </div>
    </motion.div>
  );
}

function UpscalePaneli({
  model, setModel, modelAcik, setModelAcik, olcek, setOlcek, gelismis, setGelismis,
  keskinlik, setKeskinlik, denoise, setDenoise, yuz, setYuz, onGeri, onKapat, onUygula,
}: {
  model: string; setModel: (s: string) => void;
  modelAcik: boolean; setModelAcik: (b: boolean) => void;
  olcek: string; setOlcek: (s: string) => void;
  gelismis: boolean; setGelismis: (b: boolean) => void;
  keskinlik: number; setKeskinlik: (n: number) => void;
  denoise: number; setDenoise: (n: number) => void;
  yuz: boolean; setYuz: (b: boolean) => void;
  onGeri: () => void; onKapat: () => void; onUygula: () => void;
}) {
  const aktifModel = UPSCALE_MODELLERI.find((m) => m.ad === model) ?? UPSCALE_MODELLERI[0];
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.18 }}
      className="flex h-full flex-col"
    >
      <AltBaslik ikon={Maximize2} ad="Upscale" onGeri={onGeri} onKapat={onKapat} />

      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        {/* MODEL satırı + Reset */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-metin-2">Model</span>
          <button
            onClick={() => { setModel("Topaz"); setOlcek("x2"); toast("Sıfırlandı"); }}
            className="flex items-center gap-1 text-[12px] text-metin-2 transition-colors hover:text-metin"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        </div>

        {/* Model select kartı */}
        <div className="relative">
          <button
            onClick={() => setModelAcik(!modelAcik)}
            className="hf-btn glass-cip flex w-full items-center gap-3 rounded-[10px] p-2.5 text-left"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg glass-ikon glass-ikon-lime">
              <Maximize2 className="h-4 w-4 text-aksan" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{aktifModel.ad}</span>
              <span className="block truncate text-[12px] text-metin-2">{aktifModel.ozet}</span>
            </span>
            <ChevronDown className={cn("h-4 w-4 shrink-0 text-metin-2 transition-transform", modelAcik && "rotate-180")} />
          </button>
          <AnimatePresence>
            {modelAcik && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setModelAcik(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.12 }}
                  className="menu-surface absolute left-0 top-full z-20 mt-1.5 w-full overflow-hidden rounded-xl p-1"
                >
                  {UPSCALE_MODELLERI.map((m) => (
                    <button
                      key={m.ad}
                      onClick={() => { setModel(m.ad); setModelAcik(false); }}
                      className={cn("flex w-full items-start gap-2.5 rounded-[9px] p-2 text-left transition-colors hover:bg-white/8", model === m.ad && "bg-white/[0.06]")}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{m.ad}</span>
                        <span className="block truncate text-[12px] text-metin-2">{m.ozet}</span>
                      </span>
                      {model === m.ad && <Check className="mt-0.5 h-4 w-4 shrink-0 text-aksan" />}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Ölçek çarpanı segmenti */}
        <div>
          <span className="mb-1.5 block text-[12px] text-metin-2">Ölçek çarpanı</span>
          <div className="glass-cip flex items-center gap-1 rounded-full p-1">
            {UPSCALE_OLCEK.map((o) => {
              const kapali = o === "x8" || o === "x16";
              return (
                <button
                  key={o}
                  disabled={kapali}
                  onClick={() => setOlcek(o)}
                  className={cn(
                    "flex-1 rounded-full py-1.5 text-[12px] transition-colors",
                    kapali ? "cursor-not-allowed text-metin-3 opacity-40" : olcek === o ? "bg-white text-zemin" : "text-metin-2 hover:text-metin",
                  )}
                >
                  {o}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gelişmiş ayarlar akordiyon */}
        <div className="glass-cip overflow-hidden rounded-xl">
          <button
            onClick={() => setGelismis(!gelismis)}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
          >
            <ChevronDown className={cn("h-4 w-4 text-metin-2 transition-transform", !gelismis && "-rotate-90")} />
            <span className="text-sm font-medium">Gelişmiş ayarlar</span>
          </button>
          <AnimatePresence initial={false}>
            {gelismis && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <div className="space-y-4 px-3 pb-3">
                  {/* Preset satırı */}
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-metin-2">Preset</span>
                    <span className="text-metin">Standard</span>
                  </div>
                  <Slider ad="Keskinlik" min={0} max={100} deger={keskinlik} setDeger={setKeskinlik} degeriSolda />
                  <Slider ad="Denoise" min={0} max={100} deger={denoise} setDeger={setDenoise} degeriSolda />
                  {/* Yüz iyileştirme toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Yüz iyileştirme</span>
                    <button
                      onClick={() => setYuz(!yuz)}
                      className={cn("relative h-4 w-7 shrink-0 rounded-full transition-colors", yuz ? "bg-aksan" : "bg-white/20")}
                      aria-label="Yüz iyileştirme"
                    >
                      <span className={cn("absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all", yuz ? "left-3.5" : "left-0.5")} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Alt CTA */}
      <div className="border-t border-white/8 p-3">
        <button onClick={onUygula} className="hf-cta flex w-full items-center justify-center gap-2 py-2.5 text-sm">
          <Sparkles className="h-4 w-4" /> Upscale <span className="opacity-70">2.0</span>
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════ BİLGİ SEKMESİ (Higgsfield Info) ═══════════════════════ */
function InfoSekmesi({
  url, model, oran, prompt, onKapat, onIndir, onYenidenUret, onElement, onAyarlariYukle,
}: {
  url: string | null; model: string; oran: string; prompt: string; onKapat: () => void;
  onIndir: () => void; onYenidenUret: () => void; onElement: () => void;
  /** "Bu ayarlarla üret" — üretimin model/oran/istem/referansını composer'a yükler. */
  onAyarlariYukle?: () => void;
}) {
  const [genis, setGenis] = useState(false);
  const [begenili, setBegenili] = useState(false);
  const [referansli, setReferansli] = useState(false);
  const [dahaAcik, setDahaAcik] = useState(false);
  // Deterministik meta (görsel URL'sinden) — Higgsfield "Details" birebir.
  const kod = (url ?? "").split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const boyutlar = ["1152x2048", "2048x2048", "1024x1536", "1536x1024", "2048x1152"];
  const boyut = boyutlar[kod % boyutlar.length];
  const tarih = ["12 Temmuz 2026", "13 Temmuz 2026", "5 Temmuz 2026", "2 Temmuz 2026"][kod % 4];
  const tamPrompt = prompt || "iMac, Apple klavye, Magic Mouse — temiz ürün fotoğrafı, yumuşak stüdyo ışığı, beyaz zemin";

  /* GERÇEK paylaşım (madde 5). Sıra:
     1) Web Share API + dosya → görselin KENDİSİ paylaşılır (mobil/Safari)
     2) Web Share API (yalnız url) → bağlantı paylaşılır
     3) Pano → görselin doğrudan adresi kopyalanır
     Eskisi her durumda yalnız sayfa URL'ini kopyalıyordu; alıcı görseli
     göremiyordu. */
  const gorseliPaylas = async () => {
    if (!url) return;
    const nav = typeof navigator !== "undefined" ? navigator : undefined;
    const mutlak = url.startsWith("http") || url.startsWith("data:")
      ? url
      : typeof location !== "undefined" ? new URL(url, location.origin).href : url;
    try {
      if (nav?.canShare && nav.share) {
        const yanit = await fetch(mutlak);
        const blob = await yanit.blob();
        const dosya = new File([blob], "vayra-gorsel.png", { type: blob.type || "image/png" });
        if (nav.canShare({ files: [dosya] })) {
          await nav.share({ files: [dosya], title: "Vayra görseli", text: tamPrompt.slice(0, 120) });
          return;
        }
      }
      if (nav?.share) { await nav.share({ title: "Vayra görseli", url: mutlak }); return; }
      throw new Error("paylaşım yok");
    } catch (e) {
      // Kullanıcı paylaşım sayfasını kapattıysa sessiz geç (hata değil).
      if (e instanceof DOMException && e.name === "AbortError") return;
      await navigator.clipboard?.writeText(mutlak).catch(() => {});
      toast.success("Görsel bağlantısı kopyalandı 🔗", { description: "Paylaşmak için yapıştırman yeterli." });
    }
  };
  const kisa = tamPrompt.length > 120 ? tamPrompt.slice(0, 120) + "…" : tamPrompt;

  const [detayAcik, setDetayAcik] = useState(true);
  const bas = "T"; // yazar baş harfi (Higgsfield avatar)
  return (
    <div className="flex h-full flex-col">
      {/* Kaydırılabilir içerik */}
      <div className="flex-1 space-y-5 overflow-y-auto p-4 [scrollbar-width:thin]">
        {/* PROMPT — Higgsfield birebir: başlık + Kopyala, metin KUTU İÇİNDE (panel-ic).
            Derinlik merdiveni: panel #131517 üstünde İSTEM kutusu #1c1e20. */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-metin-3">
              <Wand2 className="h-3.5 w-3.5" /> İstem
            </span>
            {/* ANA EYLEM: "Bu ayarlarla üret" — üretimin GERÇEKTEN kullandığı
                model/oran/çözünürlük/istem/element/referans composer'a dolar ve
                panel kapanır (kullanıcı kararı 2026-07-31). Salt kopyalama
                ikincil bir ikon butona indi. */}
            <div className="flex items-center gap-1">
              {onAyarlariYukle && (
                <button onClick={onAyarlariYukle}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-semibold text-aksan transition-colors hover:bg-aksan/10">
                  <Wand2 className="h-3 w-3" /> Bu ayarlarla üret
                </button>
              )}
              <button
                onClick={() => { navigator.clipboard?.writeText(tamPrompt); toast.success("İstem kopyalandı"); }}
                aria-label="İstemi kopyala"
                className="flex h-6 w-6 items-center justify-center rounded-md text-metin-3 transition-colors hover:bg-white/8 hover:text-metin"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>
          <div className="panel-ic rounded-[14px] p-3.5">
            <p className="text-[13.5px] leading-relaxed text-metin">{genis ? tamPrompt : kisa}</p>
            {tamPrompt.length > 120 && (
              <button onClick={() => setGenis((v) => !v)}
                className="hf-btn mt-2.5 flex w-full items-center justify-center gap-1 rounded-[10px] border border-kenar py-2 text-[12px] text-metin-2 hover:text-metin">
                {genis ? "Gizle" : "Tümünü gör"} <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", genis && "rotate-180")} />
              </button>
            )}
          </div>
        </div>

        {/* DETAYLAR — Higgsfield birebir: toggle başlık + satırlar KUTU İÇİNDE (panel-ic). */}
        <div>
          <button onClick={() => setDetayAcik((v) => !v)} className="mb-2 flex w-full items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-metin-3">
            <Info className="h-3.5 w-3.5" /> Detaylar
            <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", detayAcik && "rotate-180")} />
          </button>
          {detayAcik && (
            <div className="panel-ic space-y-2.5 rounded-[14px] p-3.5 text-[13.5px]">
              <DetaySatir k="Model" v={model} />
              <DetaySatir k="Moodboard" v="Genel" avatar />
              <DetaySatir k="Karakter" v="Talha" avatar />
              <DetaySatir k="Kalite" v="2K" />
              <DetaySatir k="Boyut" v={boyut} />
              <DetaySatir k="Oluşturma" v={tarih} />
            </div>
          )}
        </div>
      </div>

      {/* Alt SABİT CTA bloğu — Higgsfield birebir (scroll'dan bağımsız) */}
      <div className="glass-cip shrink-0 space-y-2.5 border-t border-white/8 p-3">
        {/* Videoya çevir (Higgsfield "Turn to video" — lime CTA) */}
        <button
          onClick={() => { toast.success("Videoya dönüştürülüyor 🎬", { description: "Video Stüdyosu'na taşındı" }); onKapat(); }}
          className="hf-cta flex w-full items-center justify-center gap-2 py-2.5 text-sm"
        >
          <VideoIcon className="h-4 w-4" /> Videoya çevir
        </button>

        {/* Recreate + Reference */}
        <div className="flex items-center gap-2">
          <button onClick={onYenidenUret} className="hf-btn glass-cip flex flex-1 items-center justify-center gap-1.5 rounded-[10px] py-2 text-[13px]">
            <RefreshCw className="h-3.5 w-3.5" /> Yeniden üret
          </button>
          <button
            onClick={() => { setReferansli((v) => !v); toast.success(referansli ? "Referans kaldırıldı" : "Referans olarak eklendi 👤", { description: referansli ? undefined : "Yeni üretimde bu görsel referans alınacak" }); }}
            className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border py-2 text-[13px] transition-colors",
              referansli ? "border-aksan/50 bg-aksan/10 text-aksan" : "glass-cip border-transparent")}>
            <UserSquare className="h-3.5 w-3.5" /> {referansli ? "Referans ✓" : "Referans"}
          </button>
        </div>

        {/* İndir · ♡ · ↗ · ⋯ */}
        <div className="flex items-center gap-2">
          <button onClick={onIndir} className="hf-btn glass-cip flex flex-1 items-center justify-center gap-1.5 rounded-[10px] py-2 text-[13px]">
            <Download className="h-3.5 w-3.5" /> İndir
          </button>
          <button onClick={() => { setBegenili((v) => !v); if (!begenili) toast.success("Beğenildi 💗"); }} aria-label="Beğen"
            className={cn("flex h-9 w-10 items-center justify-center rounded-[10px] bg-white/6 transition-colors hover:bg-white/10",
              begenili ? "text-rose-400" : "text-metin-2 hover:text-rose-400")}>
            <Heart className={cn("h-4 w-4", begenili && "fill-rose-400")} />
          </button>
          {/* PAYLAŞ (madde 5) — eskiden yalnız SAYFA url'ini kopyalıyordu, yani
              alıcı görseli göremiyordu ("fake"). Artık önce cihazın yerel
              paylaşım sayfası (Web Share) denenir ve GÖRSEL DOSYASI paylaşılır;
              desteklenmiyorsa görselin doğrudan bağlantısı panoya kopyalanır. */}
          <IkonAksiyon ikon={Share2} etiket="Paylaş" onClick={() => void gorseliPaylas()} />
          <div className="relative">
            <IkonAksiyon ikon={MoreHorizontal} etiket="Daha fazla" onClick={() => setDahaAcik((v) => !v)} />
            <AnimatePresence>
              {dahaAcik && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDahaAcik(false)} />
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                    className="menu-surface absolute bottom-11 right-0 z-50 w-44 overflow-hidden rounded-xl p-1 shadow-2xl">
                    {[
                      // m54: stok görsel — gerçek eylemler (yakında yok):
                      // yayınla→görseli üret+yayınla akışı, element oluştur→modal, sil→gizle.
                      { ad: "Görselden üret", ik: Upload, fn: () => { onYenidenUret(); } },
                      { ad: "Element oluştur", ik: UserSquare, fn: onElement },
                      { ad: "İndir", ik: Download, fn: onIndir, tehlike: false },
                    ].map((o) => (
                      <button key={o.ad} onClick={() => { o.fn(); setDahaAcik(false); }}
                        className={cn("flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors hover:bg-white/8", o.tehlike ? "text-rose-400" : "text-metin")}>
                        <o.ik className="h-3.5 w-3.5" /> {o.ad}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <span className="hidden">{bas}</span>
    </div>
  );
}

/** Higgsfield Details satırı — sağa hizalı değer, opsiyonel avatar (Moodboard/Karakter). */
function DetaySatir({ k, v, avatar }: { k: string; v: string; avatar?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-metin-3">{k}</span>
      <span className="flex items-center gap-1.5 font-medium text-metin">
        {v}
        {avatar && <span className="h-5 w-5 rounded-full ring-1 ring-white/15" style={{ background: onizlemeArka("detay-" + k + v, "portre") }} />}
      </span>
    </div>
  );
}

/** Lightbox alt satırdaki kare ikon aksiyonu (Higgsfield birebir). */
function IkonAksiyon({ ikon: Ikon, etiket, onClick, aktifSinif = "hover:text-metin" }: { ikon: typeof Heart; etiket: string; onClick: () => void; aktifSinif?: string }) {
  return (
    <button onClick={onClick} aria-label={etiket}
      className={cn("hf-btn glass-cip flex h-9 w-10 items-center justify-center rounded-[10px] text-metin-2", aktifSinif)}>
      <Ikon className="h-4 w-4" />
    </button>
  );
}

/* ═══ KART ARAÇLARI — hover'da çıkan araç ray'ı. Kartın GERÇEK boyutuna göre
   ölçeklenir (Y2), üç-nokta menüsü Higgsfield birebir (Y4), paylaş alt-menüsü
   kartın ekrandaki konumuna göre sağa/sola açılır (Y3). ═══ */
function KartAraclari({
  begenili, onBegen, onIndir, onKopyala, onAc, onYenidenUret,
  onReferans, onAnimate, on3d, onElement, onYayinla, onKlasor, onSil,
  klasorler, onKlasoreEkle, onYeniKlasor, indirmeFormatlari, onFormatIndir,
}: {
  begenili: boolean;
  onBegen: () => void; onIndir: () => void; onKopyala: () => void; onAc: () => void; onYenidenUret: () => void;
  onReferans?: () => void; onAnimate?: () => void; on3d?: () => void;
  onElement?: () => void; onYayinla?: () => void; onKlasor?: () => void; onSil?: () => void;
  /** GERÇEK klasör listesi — "Klasöre ekle" hover'ında yandan açılır (madde 1). */
  klasorler?: { id: string; ad: string; adet: number }[];
  onKlasoreEkle?: (id: string) => void;
  onYeniKlasor?: () => void;
  /** İndirme formatları — "İndir" hover'ında yandan açılır (madde 2). */
  indirmeFormatlari?: string[];
  onFormatIndir?: (format: string) => void;
}) {
  const [menuAcik, setMenuAcik] = useState(false);
  const [paylasAcik, setPaylasAcik] = useState(false);
  const [klasorAcik, setKlasorAcik] = useState(false);
  const [indirAcik, setIndirAcik] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const kokRef = useRef<HTMLDivElement>(null);
  const [menuKonum, setMenuKonum] = useState<{ top: number; left: number; paylasSaga: boolean } | null>(null);
  // Kartın gerçek genişliğini ölç → araç boyutunu ORANTILI seç (Y2: her zaman sığar).
  const [kartGen, setKartGen] = useState(240);
  const [kartYuk, setKartYuk] = useState(300);
  useEffect(() => {
    const el = kokRef.current?.parentElement; // .group kart div'i
    if (!el) return;
    const olc = () => { setKartGen(el.clientWidth); setKartYuk(el.clientHeight); };
    olc();
    const ro = new ResizeObserver(olc);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const boyutSinif: "kucuk" | "orta" | "buyuk" = kartGen < 150 ? "kucuk" : kartGen < 230 ? "orta" : "buyuk";
  // Kart KISA/yatay ise (4 dikey ikon sığmıyor) → ray'ı yatay yap. Buton yüksekliği ~28-40px;
  // 4 ikon + alt-orta 3 ikon dikeyde ~ kartYuk gerektirir. Eşik: 4 buton + boşluk < kartYuk.
  const btnPx = boyutSinif === "kucuk" ? 24 : boyutSinif === "orta" ? 32 : 36;
  const yatayRay = kartYuk < btnPx * 4 + 40; // dikey 4 ikon + üst/alt pay sığmıyorsa yatay diz

  // Menüyü aç: fixed koordinat + paylaş alt-menüsünün yönünü kartın konumuna göre belirle (Y3).
  const menuAc = () => {
    const r = menuBtnRef.current?.getBoundingClientRect();
    if (r) {
      const menuGen = 200;
      const sagaSigar = r.right + 8 + menuGen < window.innerWidth;
      const left = sagaSigar ? r.right + 8 : r.left - 8 - menuGen;
      // Paylaş alt-menüsü: ana menü ekranın sol yarısındaysa sağa, sağ yarısındaysa sola aç.
      const paylasSaga = left + menuGen / 2 < window.innerWidth / 2;
      setMenuKonum({ top: r.top, left, paylasSaga });
    }
    setMenuAcik((v) => !v);
  };
  // Paylaşım hedefleri (Higgsfield Share alt-menüsü birebir) — her biri ikonlu
  const paylasHedefleri: { ad: string; ikon: typeof Link2; fn: () => void }[] = [
    { ad: "Bağlantıyı kopyala", ikon: Link2, fn: () => { navigator.clipboard?.writeText(typeof location !== "undefined" ? location.href : "").catch(() => {}); toast.success("Bağlantı kopyalandı 🔗"); } },
    { ad: "X'te paylaş", ikon: AtSign, fn: () => { if (typeof window !== "undefined") window.open("https://twitter.com/intent/tweet?url=" + encodeURIComponent(location.href), "_blank"); } },
    { ad: "WhatsApp'ta paylaş", ikon: MessageCircle, fn: () => { if (typeof window !== "undefined") window.open("https://wa.me/?text=" + encodeURIComponent(location.href), "_blank"); } },
    { ad: "Pinterest'te paylaş", ikon: Pin, fn: () => { if (typeof window !== "undefined") window.open("https://pinterest.com/pin/create/button/?url=" + encodeURIComponent(location.href), "_blank"); } },
    { ad: "LinkedIn'de paylaş", ikon: Briefcase, fn: () => { if (typeof window !== "undefined") window.open("https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(location.href), "_blank"); } },
  ];
  // Kutu boyutuna göre buton + ikon ölçekleri (Y2)
  const btn = boyutSinif === "kucuk" ? "h-6 w-6" : boyutSinif === "orta" ? "h-8 w-8" : "h-9 w-9";
  const ik = boyutSinif === "kucuk" ? "h-3 w-3" : boyutSinif === "orta" ? "h-4 w-4" : "h-[18px] w-[18px]";
  const yerlesim = boyutSinif === "kucuk" ? "gap-1 right-1.5 top-1.5" : "gap-1.5 right-2 top-2";
  const rayYon = yatayRay ? "flex-row" : "flex-col"; // kısa kartta yatay diz (üç-nokta hep görünür)
  const IK = (Ikon: typeof Heart, etiket: string, fn: () => void, ekstra = "") => (
    <Tooltip label={etiket} side="left">
      <button onClick={(e) => { e.stopPropagation(); fn(); }} aria-label={etiket}
        className={cn("hf-btn glass-ikon flex items-center justify-center rounded-full text-white", btn, ekstra)}>
        <Ikon className={ik} />
      </button>
    </Tooltip>
  );
  const altBtn = boyutSinif === "kucuk" ? "h-6 w-6" : boyutSinif === "orta" ? "h-8 w-8" : "h-9 w-9";
  const altIk = boyutSinif === "kucuk" ? "h-3 w-3" : "h-4 w-4";
  const AltIK = (Ikon: typeof Heart, etiket: string, fn?: () => void, gizli = false) => (
    !gizli && fn ? (
      <Tooltip label={etiket} side="left">
        <button onClick={(e) => { e.stopPropagation(); fn(); }} aria-label={etiket}
          className={cn("hf-btn glass-ikon flex items-center justify-center rounded-full text-white hover:bg-aksan hover:text-zemin", altBtn)}>
          <Ikon className={altIk} />
        </button>
      </Tooltip>
    ) : null
  );

  // Higgsfield birebir menü sırası (Y4): Aç · Yeniden üret · Yeniden kullan · Element oluştur ·
  // Beğen · Paylaş> · Klasöre ekle> · Yayınla · İndir · —— · Sil
  const menuSatir = (Ikon: typeof Maximize2, ad: string, fn: () => void, tehlike = false) => (
    <button onClick={() => { fn(); setMenuAcik(false); }}
      className={cn("flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-[15px] font-medium transition-colors",
        tehlike ? "text-tehlike hover:bg-tehlike/10" : "text-white hover:bg-white/8")}>
      <Ikon className={cn("h-[18px] w-[18px]", tehlike ? "" : "text-white/70")} /> {ad}
    </button>
  );

  return (
    <div ref={kokRef}>
    {/* Alt-orta hızlı eylemler (Referans · Animate · 3D). Kısa/yatay kartta gizlenir —
        dikey ray yatayken çakışmasın; bu eylemler zaten ⋯ menüsünden erişilebilir. */}
    {(onReferans || onAnimate || on3d) && !yatayRay && (
      <div className="pointer-events-none absolute inset-x-0 bottom-2 z-20 flex items-center justify-center gap-1.5 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
        {AltIK(ImagePlus, "Referans olarak ekle", onReferans)}
        {AltIK(VideoIcon, "Animate (videoya çevir)", onAnimate)}
        {AltIK(Box, "3D sahne oluştur", on3d)}
      </div>
    )}
    {/* KALICI BEĞENİ ROZETİ (kullanıcı kararı 2026-07-31): beğenilmiş kartta
        kalp hover OLMADAN da görünür — /panel'deki galeri kartlarıyla aynı
        davranış. Araç rayının tamamı hover'a bağlı olduğu için beğeni durumu
        kartta hiç görünmüyordu; bu rozet yalnız beğeniliyken çıkar ve
        hover'da rayın kendi kalbine yerini bırakır (çift kalp olmasın). */}
    {begenili && (
      <span aria-hidden
        className={cn(
          "kart-begeni pointer-events-none absolute z-20 flex items-center justify-center rounded-full transition-opacity group-hover:opacity-0",
          // Rayın ilk butonuyla AYNI konum: hover'da rozet solup yerine ray
          // kalbi gelir, kayma hissi olmaz.
          boyutSinif === "kucuk" ? "right-1.5 top-1.5 h-6 w-6" : "right-2 top-2 h-8 w-8",
        )}>
        <Heart className={cn("fill-rose-400 text-rose-400", boyutSinif === "kucuk" ? "h-3 w-3" : "h-4 w-4")} />
      </span>
    )}
    <div className={cn("pointer-events-none absolute z-20 flex opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100", rayYon, yerlesim)}>
      {IK(Heart, "Beğen", onBegen, begenili ? "text-rose-400" : "")}
      {IK(Download, "İndir", onIndir)}
      {IK(Copy, "Yeniden kullan", onKopyala)}
      <div className="relative">
        <button ref={menuBtnRef} onClick={(e) => { e.stopPropagation(); menuAc(); }} aria-label="Daha fazla"
          className={cn("hf-btn glass-ikon flex items-center justify-center rounded-full text-white", btn)}>
          <MoreHorizontal className={ik} />
        </button>
        <AnimatePresence>
          {menuAcik && menuKonum && (
            <>
              <div className="fixed inset-0 z-[60]" onClick={(e) => { e.stopPropagation(); setMenuAcik(false); }} />
              <motion.div initial={{ opacity: 0, scale: 0.97, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.13 }}
                onClick={(e) => e.stopPropagation()}
                style={{ position: "fixed", top: menuKonum.top, left: menuKonum.left }}
                className="menu-surface z-[61] w-56 rounded-2xl p-1.5">
                {menuSatir(ArrowUpRight, "Aç", onAc)}
                {menuSatir(RefreshCw, "Yeniden üret", onYenidenUret)}
                {menuSatir(Copy, "Yeniden kullan", onKopyala)}
                {/* Varsayılanlar: bu kart bir ÜRETİM kaydı değilse (stok galeri) ilgili
                    prop gelmez. O durumda yalan söylemek yerine dürüst "yakında" deriz. */}
                {menuSatir(AtSign, "Element oluştur", onElement ?? (() => {}))}
                {menuSatir(Heart, "Beğen", onBegen)}
                {/* Paylaş → alt-menü (Higgsfield Share birebir) — Y3: konuma göre sağa/sola */}
                <div className="relative"
                  onMouseEnter={() => setPaylasAcik(true)} onMouseLeave={() => setPaylasAcik(false)}>
                  <button className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-[15px] font-medium text-white transition-colors hover:bg-white/8">
                    <Share2 className="h-[18px] w-[18px] text-white/70" /> Paylaş
                    <ChevronRight className="ml-auto h-4 w-4 text-white/40" />
                  </button>
                  <AnimatePresence>
                    {paylasAcik && (
                      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.12 }}
                        className={cn("menu-surface absolute top-0 w-56 rounded-2xl p-1.5", menuKonum.paylasSaga ? "left-full ml-1.5" : "right-full mr-1.5")}>
                        {paylasHedefleri.map((h) => (
                          <button key={h.ad} onClick={() => { h.fn(); setPaylasAcik(false); setMenuAcik(false); }}
                            className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-[15px] font-medium text-white transition-colors hover:bg-white/8">
                            <h.ikon className="h-[18px] w-[18px] text-white/70" /> {h.ad}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {/* KLASÖRE EKLE → alt-menü (madde 1, 2026-07-31).
                    Eskiden tek tıkla sabit "Görseller" klasörüne atıyordu — kullanıcı
                    haklı olarak "tamamen fake" dedi. Artık Paylaş ile aynı desende
                    GERÇEK klasör listesi açılır; yoksa yeni klasör kurulur. */}
                {klasorler && onKlasoreEkle ? (
                  <div className="relative"
                    onMouseEnter={() => setKlasorAcik(true)} onMouseLeave={() => setKlasorAcik(false)}>
                    <button className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-[15px] font-medium text-white transition-colors hover:bg-white/8">
                      <FolderPlus className="h-[18px] w-[18px] text-white/70" /> Klasöre ekle
                      <ChevronRight className="ml-auto h-4 w-4 text-white/40" />
                    </button>
                    <AnimatePresence>
                      {klasorAcik && (
                        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.12 }}
                          className={cn("menu-surface absolute top-0 max-h-64 w-60 overflow-y-auto rounded-2xl p-1.5", menuKonum.paylasSaga ? "left-full ml-1.5" : "right-full mr-1.5")}>
                          {klasorler.length === 0 && (
                            <p className="px-3 py-2 text-[13px] text-metin-3">Henüz klasör yok</p>
                          )}
                          {klasorler.map((k) => (
                            <button key={k.id} onClick={() => { onKlasoreEkle(k.id); setKlasorAcik(false); setMenuAcik(false); }}
                              className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-left text-[15px] font-medium text-white transition-colors hover:bg-white/8">
                              <FolderPlus className="h-[18px] w-[18px] shrink-0 text-white/70" />
                              <span className="min-w-0 flex-1 truncate">{k.ad}</span>
                              <span className="shrink-0 text-[12px] tabular-nums text-white/40">{k.adet}</span>
                            </button>
                          ))}
                          {onYeniKlasor && (
                            <>
                              <div className="my-1 h-px bg-white/8" />
                              <button onClick={() => { onYeniKlasor(); setKlasorAcik(false); setMenuAcik(false); }}
                                className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-[15px] font-medium text-aksan transition-colors hover:bg-aksan/10">
                                <Plus className="h-[18px] w-[18px]" /> Yeni klasör
                              </button>
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  menuSatir(FolderPlus, "Klasöre ekle", onKlasor ?? (() => {}))
                )}
                {menuSatir(Upload, "Yayınla", onYayinla ?? (() => {}))}
                {/* İNDİR → alt-menü (madde 2). Hover'da format seçenekleri açılır;
                    doğrudan tıklanırsa varsayılan formatta iner. */}
                {indirmeFormatlari && onFormatIndir ? (
                  <div className="relative"
                    onMouseEnter={() => setIndirAcik(true)} onMouseLeave={() => setIndirAcik(false)}>
                    <button onClick={() => { onIndir(); setMenuAcik(false); }}
                      className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-[15px] font-medium text-white transition-colors hover:bg-white/8">
                      <Download className="h-[18px] w-[18px] text-white/70" /> İndir
                      <ChevronRight className="ml-auto h-4 w-4 text-white/40" />
                    </button>
                    <AnimatePresence>
                      {indirAcik && (
                        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.12 }}
                          className={cn("menu-surface absolute top-0 w-56 rounded-2xl p-1.5", menuKonum.paylasSaga ? "left-full ml-1.5" : "right-full mr-1.5")}>
                          {indirmeFormatlari.map((f, i) => {
                            // Her formatın kendi ikonu + ne işe yaradığı (kullanıcı isteği).
                            const bilgi: Record<string, { ikon: typeof FileImage; not: string }> = {
                              png: { ikon: FileImage, not: "kayıpsız · saydam" },
                              jpg: { ikon: FileType2, not: "küçük dosya" },
                              webp: { ikon: FileArchive, not: "web için ideal" },
                            };
                            const { ikon: FIkon, not } = bilgi[f] ?? { ikon: FileImage, not: "" };
                            return (
                              <button key={f} onClick={() => { onFormatIndir(f); setIndirAcik(false); setMenuAcik(false); }}
                                className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-left transition-colors hover:bg-white/8">
                                <FIkon className="h-[18px] w-[18px] shrink-0 text-white/70" />
                                <span className="min-w-0 flex-1">
                                  <span className="block text-[15px] font-medium text-white">{f.toUpperCase()}</span>
                                  <span className="block text-[11px] text-white/40">{not}</span>
                                </span>
                                {i === 0 && <Check className="h-3.5 w-3.5 shrink-0 text-aksan" />}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  menuSatir(Download, "İndir", onIndir)
                )}
                <div className="my-1 h-px bg-white/8" />
                {menuSatir(Trash2, "Sil", onSil ?? (() => {}), true)}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
    </div>
  );
}

/* ═══════════════════════ YORUMLAR SEKMESİ (Higgsfield Comments) ═══════════════════════ */
const YORUM_RENKLERI = ["#ffffff", "#ff453a", "#ff9f0a", "#ffd60a", "#30d158", "#0a84ff", "#bf5af2"];
const HIZLI_EMOJI = ["👍", "❤️", "🔥", "✨", "😍", "👏", "🎉", "💯"];

function YorumSekmesi({ yorum, setYorum, konuId }: { yorum: string; setYorum: (s: string) => void; konuId: string }) {
  const [renk, setRenk] = useState("#ffffff");
  const [emojiAcik, setEmojiAcik] = useState(false);
  // m9/m23: GERÇEK kalıcı yorumlar (useYorumlar) — lightbox kapanıp açılınca korunur.
  const yorumEkle = useYorumlar((s) => s.ekle);
  const yorumBegeni = useYorumlar((s) => s.begeniToggle);
  const yorumSil = useYorumlar((s) => s.sil);
  // KRİTİK: selector'da .filter/.sort her render'da yeni referans üretip sonsuz
  // döngü yaratıyordu ("getSnapshot should be cached"). Ham diziyi al, useMemo ile türet.
  const tumYorumlar = useYorumlar((s) => s.yorumlar);
  const yorumlar = useMemo(
    () => tumYorumlar.filter((y) => y.konuId === konuId).sort((a, b) => b.zaman - a.zaman),
    [tumYorumlar, konuId],
  );
  const kullanici = useAuth((s) => s.kullanici);
  const gonder = () => {
    if (!yorum.trim()) return;
    yorumEkle(konuId, yorum.trim(), kullanici?.ad ?? "Sen");
    setYorum("");
  };
  const bas = (kullanici?.ad ?? "S").charAt(0).toLocaleUpperCase("tr");
  return (
    <div className="flex h-full flex-col">
      {yorumlar.length === 0 ? (
        /* Boş durum */
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full glass-ikon">
            <MessageCircle className="h-5 w-5 text-metin-3" />
          </span>
          <p className="text-sm font-medium">Henüz yorum yok</p>
          <p className="text-[12px] text-metin-3">İlk yorumu sen ekle.</p>
        </div>
      ) : (
        /* Yorum akışı */
        <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
          {yorumlar.map((y) => {
            // m10: salt-emoji yorumlar büyük render
            const saltEmoji = /^(\p{Extended_Pictographic}|️|‍|\s){1,8}$/u.test(y.metin);
            return (
              <motion.div key={y.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="group/y flex gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-aksan to-blue-500 text-[11px] font-bold text-zemin">{(y.yazar ?? bas).charAt(0).toLocaleUpperCase("tr")}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium">{y.yazar}</span>
                    <span className="text-[11px] text-metin-3">{goreliZaman(y.zaman)}</span>
                  </div>
                  <p className={cn("mt-0.5 break-words", saltEmoji ? "text-3xl leading-tight" : "text-[13px]")}>{y.metin}</p>
                  <div className="mt-1 flex items-center gap-3">
                    <button onClick={() => yorumBegeni(y.id)} className={cn("flex items-center gap-1 text-[11px] transition-colors", y.begendim ? "text-rose-400" : "text-metin-3 hover:text-metin")}>
                      <Heart className={cn("h-3 w-3", y.begendim && "fill-current")} /> {y.begeniler > 0 && y.begeniler}
                    </button>
                    {y.yazar === (kullanici?.ad ?? "Sen") && (
                      <button onClick={() => yorumSil(y.id)} className="text-[11px] text-metin-3 opacity-0 transition-all hover:text-rose-400 group-hover/y:opacity-100">Sil</button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Yorum girişi + renk paleti + emoji (Higgsfield birebir) */}
      <div className="border-t border-white/8 p-3">
        <div className="mb-2 flex items-center gap-1.5">
          {YORUM_RENKLERI.map((r) => (
            <button
              key={r}
              onClick={() => setRenk(r)}
              className={cn("h-4 w-4 rounded-full ring-offset-2 ring-offset-yuzey transition-all", renk === r && "ring-2 ring-white/60")}
              style={{ background: r }}
              aria-label={`Renk ${r}`}
            />
          ))}
          <button onClick={() => setEmojiAcik((v) => !v)} className="ml-auto flex h-6 w-6 items-center justify-center rounded-md text-metin-2 hover:bg-white/8 hover:text-metin" aria-label="Emoji">
            <Smile className="h-4 w-4" />
          </button>
        </div>
        {emojiAcik && (
          <div className="glass-cip mb-2 flex flex-wrap gap-1 rounded-lg p-2">
            {HIZLI_EMOJI.map((e) => (
              // m10: emoji'ye tıkla → DOĞRUDAN büyük emoji yorumu gönder (higgs/TikTok mantığı)
              <button key={e} onClick={() => { yorumEkle(konuId, e, kullanici?.ad ?? "Sen"); setEmojiAcik(false); }} className="flex h-9 w-9 items-center justify-center rounded text-xl hover:bg-white/10">
                {e}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            value={yorum}
            onChange={(e) => setYorum(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && gonder()}
            placeholder="Yorum ekle"
            className="glass-cip flex-1 rounded-full px-3 py-2 text-[13px] outline-none placeholder:text-metin-3"
            style={{ color: renk }}
          />
          <button onClick={gonder} className="flex h-8 w-8 items-center justify-center rounded-full bg-aksan text-zemin transition-transform hover:scale-105" aria-label="Gönder">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
