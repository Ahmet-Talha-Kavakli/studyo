/**
 * sinemaSecici — Sinema Stüdyo'nun composer ÜSTÜNDEKİ seçicilerinin verisi.
 *
 * Referans: ~/Desktop/referanslar/modeller/video/cinema-studio-{2.5,3.0,3.5}
 *
 * Üç ayrı seçici dünyası var (model sürümüne göre):
 *  3.5 → Tür · Stil · Kamera hapları → DÖNEN ÇARK modalı
 *        (Stil = 3 sütun: Renk Paleti / Işık / Kamera Hareket Stili)
 *        (Kamera = 4 sütun: Kamera / Lens / Odak Uzaklığı / Diyafram)
 *  3.0 → Yönetmen Paneli · Tür · Kamera Hareketi · Hız Rampası → IZGARA modalı
 *  2.5 → Yönetmen Paneli barı (karakter yuvaları + hareket + hız eğrisi + süre)
 *
 * Higgsfield'daki tutarsız büyük/küçük harfler kasıtlı korunmadı — Türkçeye
 * çevrildiği için tutarlı yazım kullanıldı.
 */

/* ------------------------------------------------------------------ */
/* Tür — 3.5 ve 3.0 ortak (7 tür, referansla birebir sıra)             */
/* ------------------------------------------------------------------ */
export type SeciciOge = { ad: string; kat: string };

export const TURLER: SeciciOge[] = [
  { ad: "Genel", kat: "soyut" },
  { ad: "Aksiyon", kat: "sinematik" },
  { ad: "Korku", kat: "sinematik" },
  { ad: "Komedi", kat: "portre" },
  { ad: "Noir", kat: "portre" },
  { ad: "Dram", kat: "portre" },
  { ad: "Epik", kat: "manzara" },
];

/* ------------------------------------------------------------------ */
/* Stil — 3.5, ÜÇ sütunlu çark                                         */
/* ------------------------------------------------------------------ */
export const RENK_PALETI: SeciciOge[] = [
  { ad: "Doğal Temiz", kat: "portre" },
  { ad: "Soluk Sıcak", kat: "manzara" },
  { ad: "Hiper Neon", kat: "soyut" },
  { ad: "Teal Turuncu Epik", kat: "sinematik" },
  { ad: "Sodyum Gece", kat: "sinematik" },
  { ad: "Gümüş Kromat", kat: "soyut" },
];

export const ISIK: SeciciOge[] = [
  { ad: "Oto", kat: "soyut" },
  { ad: "Yumuşak Çapraz", kat: "portre" },
  { ad: "Kontre Jur", kat: "sinematik" },
  { ad: "Tepeden Düşen", kat: "portre" },
  { ad: "Pencere Işığı", kat: "portre" },
  { ad: "Sert Nokta", kat: "sinematik" },
];

export const KAMERA_HAREKET_STILI: SeciciOge[] = [
  { ad: "Tek Çekim", kat: "sinematik" },
  { ad: "Epik Ölçek", kat: "manzara" },
  { ad: "Yakın Gözlemci", kat: "portre" },
  { ad: "İmkânsız Kamera", kat: "3d" },
  { ad: "Belgesel Kapış", kat: "portre" },
  { ad: "Sabit Tripod", kat: "sinematik" },
];

/* ------------------------------------------------------------------ */
/* Kamera — 3.5, DÖRT sütunlu çark                                     */
/* ------------------------------------------------------------------ */
export const KAMERALAR: SeciciOge[] = [
  { ad: "Temiz Dijital", kat: "urun" },
  { ad: "İnce Film", kat: "sinematik" },
  { ad: "16mm Grenli", kat: "portre" },
  { ad: "Anamorfik", kat: "sinematik" },
];

export const LENSLER: SeciciOge[] = [
  { ad: "Klinik Keskin", kat: "urun" },
  { ad: "Aşırı Makro", kat: "urun" },
  { ad: "Yumuşak Portre", kat: "portre" },
  { ad: "Vintage Parlama", kat: "sinematik" },
];

export const ODAK_UZAKLIKLARI = [18, 24, 35, 50, 75, 100, 135];

export const DIYAFRAMLAR: SeciciOge[] = [
  { ad: "f/1.4 Sığ", kat: "portre" },
  { ad: "f/2.8 Portre", kat: "portre" },
  { ad: "f/5.6 Dengeli", kat: "urun" },
  { ad: "f/11 Derin Odak", kat: "manzara" },
];

/* ------------------------------------------------------------------ */
/* Kamera Hareketi — 3.0 ızgara modalı (18 hareket, referans sırası)    */
/* ------------------------------------------------------------------ */
export const KAMERA_HAREKETLERI: string[] = [
  "Sabit", "Elde", "Uzaklaş", "Yakınlaş", "Kamera takip", "Sola kaydır",
  "Sağa kaydır", "Yukarı eğ", "Aşağı eğ", "Etrafında dön", "İçeri kaydır", "Dışarı kaydır",
  "Vinç yukarı", "Vinç aşağı", "Drone çekimi", "Sola dolly", "Sağa dolly", "360 dönüş",
];

/* ------------------------------------------------------------------ */
/* Hız Rampası — 3.0 ızgara modalı (7 seçenek) + eğri şekilleri        */
/* ------------------------------------------------------------------ */
export type HizRampa = { ad: string; egri: number[] };
/** egri: 5 düğüm, 0..1 aralığında normalize yükseklik (grafik çizimi için). */
export const HIZ_RAMPALARI: HizRampa[] = [
  { ad: "Oto", egri: [0.5, 0.62, 0.5, 0.42, 0.5] },
  { ad: "Ağır çekim", egri: [0.85, 0.68, 0.5, 0.32, 0.15] },
  { ad: "Hızlan", egri: [0.15, 0.32, 0.5, 0.7, 0.9] },
  { ad: "Flaş giriş", egri: [0.95, 0.4, 0.45, 0.5, 0.5] },
  { ad: "Flaş çıkış", egri: [0.5, 0.5, 0.45, 0.4, 0.95] },
  { ad: "Mermi zamanı", egri: [0.5, 0.8, 0.12, 0.8, 0.5] },
  { ad: "Kahraman anı", egri: [0.35, 0.85, 0.2, 0.55, 0.5] },
];

/* ------------------------------------------------------------------ */
/* Seçici tanımları — hangi model hangi hapları gösterir               */
/* ------------------------------------------------------------------ */
export type HapTanim = {
  id: string;
  etiket: string;
  /** Tek sütunlu çark mı, çok sütunlu mu, ızgara mı. */
  tip: "car" | "carCok" | "izgara" | "buton";
  /** Tek sütunlu çark/ızgara için seçenekler. */
  ogeler?: SeciciOge[];
  /** Çok sütunlu çark için sütun tanımları. */
  sutunlar?: { baslik: string; ogeler: SeciciOge[] }[];
  /** Modal başlığı. */
  baslik: string;
};

export const HAPLAR_35: HapTanim[] = [
  { id: "tur", etiket: "Tür", tip: "car", ogeler: TURLER, baslik: "Tür" },
  {
    id: "stil", etiket: "Stil", tip: "carCok", baslik: "Stil Ayarları",
    sutunlar: [
      { baslik: "RENK PALETİ", ogeler: RENK_PALETI },
      { baslik: "IŞIK", ogeler: ISIK },
      { baslik: "KAMERA HAREKET STİLİ", ogeler: KAMERA_HAREKET_STILI },
    ],
  },
  {
    id: "kamera", etiket: "Kamera", tip: "carCok", baslik: "Kamera Ayarları",
    sutunlar: [
      { baslik: "KAMERA", ogeler: KAMERALAR },
      { baslik: "LENS", ogeler: LENSLER },
      { baslik: "ODAK UZAKLIĞI", ogeler: ODAK_UZAKLIKLARI.map((m) => ({ ad: `${m}mm`, kat: "urun" })) },
      { baslik: "DİYAFRAM", ogeler: DIYAFRAMLAR },
    ],
  },
];

export const HAPLAR_30: HapTanim[] = [
  { id: "yonetmen", etiket: "Yönetmen Paneli", tip: "buton", baslik: "Yönetmen Paneli" },
  { id: "tur", etiket: "Tür", tip: "izgara", ogeler: TURLER, baslik: "Tür" },
  {
    id: "hareket", etiket: "Kamera Hareketi", tip: "izgara",
    ogeler: KAMERA_HAREKETLERI.map((a) => ({ ad: a, kat: "sinematik" })), baslik: "Kamera Hareketi",
  },
  {
    id: "hiz", etiket: "Hız Rampası", tip: "izgara",
    ogeler: HIZ_RAMPALARI.map((h) => ({ ad: h.ad, kat: "aksiyon" })), baslik: "Hız Rampası",
  },
];

/** Varsayılan seçili değerler — model değişince buradan kurulur. */
export const VARSAYILAN_SECIM: Record<string, string> = {
  tur: "Genel",
  renkPaleti: "Doğal Temiz",
  isik: "Oto",
  kameraHareketStili: "Tek Çekim",
  kamera: "Temiz Dijital",
  lens: "Klinik Keskin",
  odak: "50mm",
  diyafram: "f/5.6 Dengeli",
  hareket: "Sabit",
  hiz: "Oto",
};

/** Stil/Kamera haplarının etiketi — seçimlerden virgüllü özet üretir (referans birebir). */
export function hapOzet(parcalar: string[]): string {
  return parcalar.filter(Boolean).join(", ");
}
