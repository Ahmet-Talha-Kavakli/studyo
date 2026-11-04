import { PRESETLER, HAZIR_VIDEOLAR, type Preset } from "@/lib/presetVeri";
import { EFEKT_PRESETLERI } from "@/lib/presetVeriEfekt";
import type { OzelPreset } from "@/store/usePresetler";

/**
 * Preset kataloğu — resmi presetler (presetVeri) ile kullanıcının kendi presetlerini tek modelde
 * birleştirir. Sayfa, kartlar, ayrıntı penceresi ve üretim bu modeli kullanır.
 */
export interface KatalogPreset {
  slug: string;
  ad: string;
  aciklama: string;
  /** Modele giden hareket tarifi. */
  tarif: string;
  kredi: number;
  kategoriler: string[];
  /** Örnek çıktı videosu (yoksa yalnız kapak). */
  video?: string;
  kapak: string;
  etiket?: "Yeni" | "Trend";
  pro?: boolean;
  oneCikan?: boolean;
  ozel?: boolean;
  /** Kendi presetin henüz yayınlanmadı (preset stüdyosunda taslak). */
  taslak?: boolean;
  /** Varsayılan sıralama (öne çıkan). */
  sira: number;
  sureSn: number;
  /** Topluluk presetinde yaratıcının tutamacı (@ad); yoksa preset Vayra'nın. */
  yazar?: string;
  /** Yaratıcı payı: kullanıcının her kullanımda ek ödediği, tamamı yaratıcıya giden kredi (kredi alanına dahildir). */
  ekKredi?: number;
  /** Yaratıcı istemi gösteriyor mu (gizliyse yalnız sonuç görünür). */
  istemGorunur?: boolean;
  gorunurluk?: "topluluk" | "baglanti" | "ozel";
  kullanimSayi?: number;
  begeniSayi?: number;
  /** Yayın tarihi (ms). */
  tarih?: number;
  /** Topluluk presetinin dayandığı Vayra efekti. */
  taban?: string;
}

/** Görünen kategori adları — veri büyük harfli anahtar tutar. */
export const KATEGORI_AD: Record<string, string> = {
  "KAMERA HAREKETİ": "Kamera hareketi", DÖNÜŞÜM: "Dönüşüm", AKSİYON: "Aksiyon", FANTASTİK: "Fantastik", SPOR: "Spor",
  UZAY: "Uzay", KAÇIŞ: "Kaçış", SİNEMATİK: "Sinematik", OYUN: "Oyun", VIRAL: "Viral", KORKU: "Korku",
};
export const KATEGORI_SIRA = ["VIRAL", "KAMERA HAREKETİ", "DÖNÜŞÜM", "AKSİYON", "SİNEMATİK", "FANTASTİK", "KORKU", "OYUN", "SPOR", "UZAY", "KAÇIŞ"];

/** Editoryal işaretler: yeni eklenenler, bu hafta en çok denenenler ve vitrin. */
const YENI = new Set(["sketch-to-fabric", "elevate", "ice-statue", "city-titan", "disintegration", "liquid-metal", "eyes-in", "medusa", "thunder-god", "lidar-scan"]);
const TREND = new Set(["earth-zoom", "selfie-twin", "moonwalk", "sticker-peel", "action-figure", "set-on-fire", "bullet-time", "clones", "money-rain"]);
const VITRIN = ["earth-zoom", "fairytale-castle", "action-figure", "selfie-twin", "elevate"];

/** Önizleme videosu henüz olmayan presetler için konuya uygun kapak (projede üretilmiş görseller).
    Uygun görseli olmayanlar tasarlanmış kapakla gösterilir — alakasız stok görsel kullanılmaz. */
const KAPAK: Record<string, string> = {
  "blue-depth": "/gercek/orig/preset-mavi-derinlik.webp",
  "ice-statue": "/gercek/sinema/ps-freezing.webp",
  "baseball-game": "/gercek/orig/preset-beyzbol-maci.webp",
  "drift-king": "/gercek/arac/vfx-drift.webp",
  "kung-fu-hit": "/gercek/arac/vfx-kungfu.webp",
  "city-titan": "/gercek/kesfet/titan-savasivividworks.webp",
  "zombie-escape": "/gercek/sinema/ps-zombie.webp",
  "slow-mo-punch": "/gercek/sinema/ps-facepunch.webp",
  "orbital-presence": "/gercek/kesfet/uzay-istasyonu-yorungesiveo-3-1.webp",
  "football-invasion": "/gercek/sinema/ps-sprint.webp",
  "mighty-fighter": "/gercek/orig/rec-viking.webp",
  "wild-chase": "/gercek/sinema/ps-car.webp",
  "paparazzi-run": "/gercek/sinema/ps-outfit.webp",
};

function resmi(p: Preset, i: number): KatalogPreset {
  const videoVar = HAZIR_VIDEOLAR.has(p.video);
  return {
    slug: p.video,
    ad: p.ad,
    aciklama: p.aciklama,
    tarif: p.veoPrompt,
    kredi: p.kredi,
    kategoriler: p.kategoriler,
    video: videoVar ? `/gercek/preset-video/${p.video}.mp4` : undefined,
    kapak: videoVar ? `/gercek/preset-video/${p.video}.webp` : (p.kapak ?? KAPAK[p.video] ?? ""),
    etiket: YENI.has(p.video) ? "Yeni" : TREND.has(p.video) ? "Trend" : undefined,
    pro: !!p.premium,
    oneCikan: VITRIN.includes(p.video),
    // Önizlemesi olanlar önde; vitrin en başta
    sira: (VITRIN.includes(p.video) ? 0 : videoVar ? 100 : 200) + i,
    sureSn: 8,
  };
}

export const RESMI_PRESETLER: KatalogPreset[] = [...PRESETLER, ...EFEKT_PRESETLERI].map(resmi);
export const VITRIN_PRESETLER = VITRIN.map((s) => RESMI_PRESETLER.find((p) => p.slug === s)!).filter(Boolean);

/** Kullanıcı presetinin bedeli: 8 sn görselden videonun taban bedeli. */
export const OZEL_KREDI = 30;

export function ozeldenKatalog(p: OzelPreset): KatalogPreset {
  return {
    slug: p.slug, ad: p.ad, aciklama: p.aciklama, tarif: p.tarif, kredi: OZEL_KREDI, kategoriler: [p.kategori],
    kapak: p.kapak ?? "", video: p.kapakVideo, ozel: true, taslak: p.durum === "taslak", sira: 1000, sureSn: 8,
  };
}

/** İki preseti karıştır: ana preset hareketi taşır, ikincisi atmosfer ve olay katar. Bedel: ana + ikincinin yarısı. */
export function karisimTarifi(ana: KatalogPreset, ek: KatalogPreset) {
  return `${ana.tarif} Blend in elements of a second effect: ${ek.tarif} Keep the primary motion dominant and the subject's identity consistent.`;
}
export const karisimKredi = (ana: KatalogPreset, ek?: KatalogPreset | null) => ana.kredi + (ek ? Math.ceil(ek.kredi / 2) : 0);
