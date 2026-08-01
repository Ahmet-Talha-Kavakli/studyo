/**
 * SİNEMA STÜDYOSU — paylaşılan veri katmanı.
 * Ana ekran composer'ı (panel/sinema/page.tsx) ile proje detay composer'ı
 * (panel/sinema/[id]/page.tsx) aynı model kataloğunu, çipleri ve preset/kamera
 * verilerini kullanır. Saf veri + tip + modelYetenekBul burada tanımlıdır.
 * UI bileşenleri (CipDropdown, SpeedRampGrafik) sayfa dosyalarında kalır.
 */

/* ── Tür / Stil / Kamera çip verisi (Higgsfield Genre/Style/Camera birebir) ── */

// Tür çarkı (Higgsfield "Genre" BİREBİR sıra: General, Action, Horror, Comedy, Noir, Drama, Epic).
export const TURLER = [
  { id: "Genel", etiket: "Genel" }, { id: "Aksiyon", etiket: "Aksiyon" }, { id: "Korku", etiket: "Korku" },
  { id: "Komedi", etiket: "Komedi" }, { id: "Noir", etiket: "Noir" }, { id: "Dram", etiket: "Dram" },
  { id: "Epik", etiket: "Epik" },
];

// Stil Ayarları modalı: 3 sütun (Higgsfield: COLOR PALETTE / LIGHTING / CAMERA MOVESET STYLE).
export const STIL_SUTUN = {
  palet: [
    { id: "Oto", etiket: "Oto" }, { id: "Doğal Temiz", etiket: "Doğal Temiz" }, { id: "Sıcak Solgun", etiket: "Sıcak Solgun" },
    { id: "Soğuk Mavi", etiket: "Soğuk Mavi" }, { id: "Sepya Film", etiket: "Sepya Film" }, { id: "Solgun Pastel", etiket: "Solgun Pastel" },
  ],
  isik: [
    { id: "Oto", etiket: "Oto" }, { id: "Yumuşak Çapraz", etiket: "Yumuşak Çapraz" }, { id: "Contre Jour", etiket: "Contre Jour" },
    { id: "Tepe Düşüş", etiket: "Tepe Düşüş" }, { id: "Neon", etiket: "Neon" }, { id: "Altın Saat", etiket: "Altın Saat" },
  ],
  // Higgsfield "Camera Moveset Style": Classic Static, Silent Machine, Intimate Observer, Impossible Camera
  hareket: [
    { id: "Oto", etiket: "Oto" }, { id: "Klasik Statik", etiket: "Klasik Statik" }, { id: "Sessiz Makine", etiket: "Sessiz Makine" },
    { id: "Yakın Gözlemci", etiket: "Yakın Gözlemci" }, { id: "İmkansız Kamera", etiket: "İmkansız Kamera" }, { id: "Steadicam", etiket: "Steadicam" },
  ],
};

// Kamera Ayarları modalı: 4 sütun (Kamera / Lens / Odak / Diyafram)
export const KAMERA_SUTUN = {
  kamera: [{ id: "Oto", etiket: "Oto" }, { id: "İnce Film", etiket: "İnce Film" }, { id: "ARRI Alexa", etiket: "ARRI Alexa" }, { id: "RED", etiket: "RED" }, { id: "Bolex 16mm", etiket: "Bolex 16mm" }],
  lens: [{ id: "Oto", etiket: "Oto" }, { id: "Vintage Sis", etiket: "Vintage Sis" }, { id: "Anamorfik", etiket: "Anamorfik" }, { id: "Makro", etiket: "Makro" }, { id: "Balıkgözü", etiket: "Balıkgözü" }],
  odak: [{ id: "Oto", etiket: "Oto", alt: "mm" }, { id: "8mm", etiket: "8", alt: "mm" }, { id: "24mm", etiket: "24", alt: "mm" }, { id: "35mm", etiket: "35", alt: "mm" }, { id: "50mm", etiket: "50", alt: "mm" }, { id: "85mm", etiket: "85", alt: "mm" }],
  diyafram: [{ id: "Oto", etiket: "Oto" }, { id: "f/1.4", etiket: "f/1.4" }, { id: "f/2.8", etiket: "f/2.8" }, { id: "f/4 Orta", etiket: "f/4 Orta" }, { id: "f/8", etiket: "f/8" }, { id: "f/16", etiket: "f/16" }],
};

/* ── Model kataloğu ── */
// yetenek: composer çipleri MODELE GÖRE değişir (Higgsfield birebir — her modelin farklı kontrol seti).
export type ModelYetenek = {
  cerceve?: boolean;      // START/END FRAME kartları (Higgsfield: START + END(Opsiyonel))
  director?: boolean;     // Yönetmen Paneli (Movement + Speed ramp) — Sinema Stüdyo
  multishot?: boolean;    // Çok-çekim (Multi-shot) çipi — Kling
  motionControl?: boolean;// Motion Control: "İstem devre dışı" + Sahne kontrolü + HAREKET/KARAKTER
  bitrate?: boolean;      // Bitrate çipi (Yüksek/Standart) — Seedance
  sesli?: boolean;        // Ses aç/kapa çipi
  preset?: boolean;       // Preset (GENEL) çipi — Sinema Stüdyo 3.5
  mode?: boolean;         // Mod çipi (Kareler/Elementler) — Kling O1 Video
  videoRef?: boolean;     // VIDEO REFERANS kartı — Kling Omni Edit
  autoSettings?: boolean; // "Oto ayarlar" yeşil toggle — Omni Edit
  seed?: boolean;         // Seed popover çipi — Higgsfield Lite
  uyari?: boolean;        // Açık içerik amber uyarı bandı — Grok Imagine 1.5
  oranlar?: string[];     // desteklenen aspect ratio'lar
  cozunurlukler?: string[]; // desteklenen çözünürlükler
  sureler?: string[];     // desteklenen süreler
  kredi: number;          // ÜRET kredisi
  eskiKredi?: number;     // üstü çizili indirim fiyatı
};
export type SinemaModel = { ad: string; ozet: string; rozet?: "Yeni" | "Sınırsız" | "Özel" | "Premium"; meta?: string[]; ses?: boolean; yetenek?: ModelYetenek };

// Higgsfield Cinema Studio video modelleri BİREBİR (higg-cinema 010-021, 042-081).
// Kredi/rozet/spec ekran görüntülerinden ölçüldü. Çipler yetenek'e göre gösterilir.
export const VIDEO_MODELLERI: { grup: string; ogeler: SinemaModel[] }[] = [
  { grup: "Sinematik modeller", ogeler: [
    { ad: "Sinema Stüdyo 3.5", ozet: "Kamera seçimi, stil presetleri ve AI yönetmen", rozet: "Yeni",
      yetenek: { director: true, preset: true, sesli: true, oranlar: ["Oto", "16:9", "9:16", "1:1"], cozunurlukler: ["720p", "1080p"], sureler: ["4s", "5s", "8s"], kredi: 80, eskiKredi: 96 } },
    { ad: "Sinema Stüdyo 3.0", ozet: "Gelişmiş kamera ve hız-rampa kontrolü",
      yetenek: { director: true, cerceve: true, oranlar: ["16:9", "9:16", "1:1"], cozunurlukler: ["720p", "1080p"], sureler: ["4s", "8s", "12s"], kredi: 24 } },
    { ad: "Sinema Stüdyo 2.5", ozet: "Başlangıç kareli kamera hareketleri",
      yetenek: { director: true, cerceve: true, oranlar: ["16:9", "9:16"], cozunurlukler: ["1080p"], sureler: ["4s", "12s"], kredi: 16 } },
  ]},
  { grup: "Öne çıkan modeller", ogeler: [
    { ad: "Seedance 2.0", ozet: "Sinematik, çok-çekimli", meta: ["4K", "4-15sn"],
      yetenek: { bitrate: true, cerceve: true, oranlar: ["Oto", "16:9", "9:16", "1:1"], cozunurlukler: ["1080p", "4K"], sureler: ["4s", "8s", "12s", "15s"], kredi: 108, eskiKredi: 444 } },
    { ad: "Seedance 2.0 Mini", ozet: "Hafif, hızlı çekim", rozet: "Özel", meta: ["720p", "4-15sn"],
      yetenek: { bitrate: true, oranlar: ["Oto", "16:9", "9:16"], cozunurlukler: ["720p"], sureler: ["4s", "8s", "15s"], kredi: 24 } },
    { ad: "Seedance 2.0 Fast", ozet: "Hızlı Seedance", meta: ["720p", "4-15sn"],
      yetenek: { oranlar: ["16:9", "9:16"], cozunurlukler: ["720p"], sureler: ["4s", "8s"], kredi: 12 } },
    { ad: "Gemini Omni Flash", ozet: "Google — hızlı üretim", rozet: "Yeni", meta: ["720p", "4-10sn"],
      yetenek: { cerceve: true, sesli: true, oranlar: ["Oto", "16:9", "9:16"], cozunurlukler: ["720p"], sureler: ["4s", "8s", "10s"], kredi: 12 } },
    { ad: "Kling 3.0", ozet: "Kusursuz hareket, gelişmiş video kontrolü", meta: ["4K", "3-15sn"], ses: true,
      yetenek: { cerceve: true, multishot: true, sesli: true, oranlar: ["16:9", "9:16", "1:1"], cozunurlukler: ["1080p", "4K"], sureler: ["3s", "5s", "10s", "15s"], kredi: 60 } },
    { ad: "Kling 3.0 Turbo", ozet: "Hızlı Kling", rozet: "Yeni", meta: ["1080p", "3-15sn"], ses: true,
      yetenek: { cerceve: true, oranlar: ["16:9", "9:16"], cozunurlukler: ["720p"], sureler: ["5s"], kredi: 7.5 } },
    { ad: "Kling 3.0 Motion Control", ozet: "Karakterinle herhangi bir hareketi kopyala", meta: ["1080p", "3-30sn"],
      yetenek: { motionControl: true, cozunurlukler: ["1080p"], kredi: 10 } },
    { ad: "HappyHorse", ozet: "Sesli, yüksek dinamik", rozet: "Yeni", meta: ["1080p", "3-15sn"], ses: true,
      yetenek: { sesli: true, oranlar: ["16:9", "9:16"], cozunurlukler: ["1080p"], sureler: ["3s", "5s", "15s"], kredi: 33 } },
    { ad: "Grok Imagine", ozet: "xAI — çok yönlü stiller", meta: ["720p", "1-15sn"],
      yetenek: { oranlar: ["Oto", "16:9", "9:16", "1:1"], cozunurlukler: ["720p"], sureler: ["5s", "10s"], kredi: 6 } },
    { ad: "Grok Imagine 1.5", ozet: "xAI — yeni nesil", rozet: "Yeni", meta: ["720p", "1-15sn"],
      yetenek: { uyari: true, cerceve: true, oranlar: ["Oto", "16:9", "9:16"], cozunurlukler: ["720p"], sureler: ["5s", "10s"], kredi: 22.5 } },
    { ad: "Google Veo 3.1 Lite", ozet: "Google — sesli sahneler", rozet: "Yeni", meta: ["1080p", "4-8sn"], ses: true,
      yetenek: { cerceve: true, sesli: true, oranlar: ["Oto", "16:9", "9:16"], cozunurlukler: ["720p", "1080p"], sureler: ["4s", "8s"], kredi: 12 } },
    { ad: "Wan 2.7", ozet: "Yüksek-sadakat sinematik", rozet: "Yeni", meta: ["1080p", "2-15sn"],
      yetenek: { sesli: true, oranlar: ["16:9", "9:16"], cozunurlukler: ["1080p"], sureler: ["2s", "5s", "15s"], kredi: 22.5 } },
  ]},
  { grup: "Tüm modeller", ogeler: [
    { ad: "Minimax Hailuo 2.3 Fast", ozet: "En hızlı, en uygun", meta: ["768p", "6-10sn"],
      yetenek: { cerceve: true, sesli: true, cozunurlukler: ["768p"], sureler: ["6s", "10s"], kredi: 4 } },
    { ad: "Minimax Hailuo 2.3", ozet: "Yüksek dinamik, VFX-hazır", rozet: "Premium", meta: ["1080p", "6-10sn"],
      yetenek: { cerceve: true, sesli: true, cozunurlukler: ["1080p"], sureler: ["6s", "10s"], kredi: 6 } },
    { ad: "Minimax Hailuo 02", ozet: "Yüksek dinamik hareket", meta: ["1080p", "6-10sn"],
      yetenek: { cerceve: true, sesli: true, cozunurlukler: ["768p", "1080p"], sureler: ["6s", "10s"], kredi: 6 } },
    { ad: "Kling 3.0 Omni Edit", ozet: "Metinle video düzenleme", rozet: "Özel", meta: ["1080p", "3-10sn"],
      yetenek: { videoRef: true, autoSettings: true, cozunurlukler: ["720p"], kredi: 9 } },
    { ad: "Kling O1 Video", ozet: "Kling fotogerçekçi video modeli", rozet: "Premium", meta: ["1080p", "5-10sn"],
      yetenek: { mode: true, cerceve: true, oranlar: ["1:1", "16:9", "9:16"], cozunurlukler: ["1080p"], sureler: ["5s", "10s"], kredi: 10 } },
    { ad: "OpenAI Sora 2", ozet: "Çok-çekimli, sesli üretim", rozet: "Premium", meta: ["720p", "4-12sn"], ses: true,
      yetenek: { cerceve: true, oranlar: ["16:9", "9:16"], cozunurlukler: ["720p"], sureler: ["4s", "8s", "12s"], kredi: 20 } },
    { ad: "Sora 2 Max", ozet: "Sora üst kalite", rozet: "Premium", meta: ["1080p", "4-12sn"], ses: true,
      yetenek: { cerceve: true, oranlar: ["16:9", "9:16"], cozunurlukler: ["720p", "1080p"], sureler: ["4s", "8s", "12s"], kredi: 33 } },
    { ad: "Higgsfield Lite", ozet: "Higgsfield hafif", rozet: "Premium", meta: ["720p", "3-5sn"],
      yetenek: { seed: true, cerceve: true, sesli: true, cozunurlukler: ["720p"], sureler: ["3s", "5s"], kredi: 5 } },
    { ad: "Wan 2.5", ozet: "Sesli, daha fazla özgürlük", rozet: "Premium", meta: ["1080p", "5-10sn"], ses: true,
      yetenek: { sesli: true, oranlar: ["16:9", "9:16"], cozunurlukler: ["1080p"], sureler: ["5s", "10s"], kredi: 22.5 } },
  ]},
];

// Higgsfield Cinema Studio GÖRSEL modelleri BİREBİR (higg-cinema 111-117).
// Görsel modu: oran + kalite (1K/2K/4K) + adet; süre yok, kredi düşük (0.25 vb.).
export const GORSEL_YETENEK: ModelYetenek = { oranlar: ["Oto", "1:1", "3:4", "9:16", "4:3", "16:9", "21:9"], cozunurlukler: ["1K", "2K", "4K"], kredi: 0.25 };
export const GORSEL_MODELLERI: { grup: string; ogeler: SinemaModel[] }[] = [
  { grup: "Sinematik modeller", ogeler: [
    { ad: "AI Kadro", ozet: "İfadeli yüzler ve detaylı stil", yetenek: GORSEL_YETENEK },
    { ad: "Sinematik Mekanlar", ozet: "Sinematik ışıklı zengin ortamlar", yetenek: GORSEL_YETENEK },
    { ad: "Ruh Sinema", ozet: "Sinematik görsel üretimi", yetenek: GORSEL_YETENEK },
    { ad: "Sinematik Kameralar", ozet: "Kamera kontrollü görsel üretimi", yetenek: GORSEL_YETENEK },
  ]},
  { grup: "Öne çıkan modeller", ogeler: [
    { ad: "Vayra Ruh 2.0", ozet: "Yeni nesil ultra-gerçekçi görseller", yetenek: GORSEL_YETENEK },
    { ad: "Vayra Ruh Sinema", ozet: "Sinema-kalite görsel üretimi", yetenek: GORSEL_YETENEK },
    { ad: "GPT Image 2", ozet: "Neredeyse kusursuz metinle 4K", rozet: "Sınırsız", yetenek: GORSEL_YETENEK },
    { ad: "Seedream 5.0 Pro", ozet: "Zeki görsel akıl yürütmeyle tutarlı görseller", rozet: "Yeni", yetenek: GORSEL_YETENEK },
    { ad: "Seedream 5.0 Lite", ozet: "Zeki görsel akıl yürütme", rozet: "Sınırsız", yetenek: GORSEL_YETENEK },
    { ad: "Seedream 4.5", ozet: "ByteDance yeni nesil 4K görsel düzenleme", rozet: "Sınırsız", yetenek: GORSEL_YETENEK },
    { ad: "Nano Banana Pro", ozet: "Google amiral gemisi üretim modeli", rozet: "Sınırsız", yetenek: GORSEL_YETENEK },
    { ad: "Nano Banana 2", ozet: "Flash hızında pro kalite", rozet: "Yeni", yetenek: GORSEL_YETENEK },
    { ad: "Nano Banana 2 Lite", ozet: "Hızlı hafif görsel üretimi", rozet: "Yeni", yetenek: GORSEL_YETENEK },
    { ad: "Recraft V4.1", ozet: "Fotogerçekçi ve ifadeli üretim", rozet: "Yeni", yetenek: GORSEL_YETENEK },
  ]},
  { grup: "Tüm modeller", ogeler: [
    { ad: "Oto", ozet: "Her istem için en iyi model, senin için seçilir", yetenek: GORSEL_YETENEK },
    { ad: "Vayra Ruh", ozet: "Ultra-gerçekçi moda görselleri", yetenek: GORSEL_YETENEK },
    { ad: "GPT Image 1.5", ozet: "Gerçek-renk hassas render", yetenek: GORSEL_YETENEK },
    { ad: "GPT Image", ozet: "Çok yönlü metinden görsele", rozet: "Sınırsız", yetenek: GORSEL_YETENEK },
    { ad: "Nano Banana", ozet: "Google standart üretim modeli", rozet: "Sınırsız", yetenek: GORSEL_YETENEK },
    { ad: "Seedream 4.0", ozet: "ByteDance gelişmiş görsel düzenleme", yetenek: GORSEL_YETENEK },
    { ad: "Grok Imagine", ozet: "xAI çok yönlü görsel stiller", yetenek: GORSEL_YETENEK },
    { ad: "Recraft V4.1 Utility", ozet: "Düz, eşit ışıklı sade sahneler", rozet: "Yeni", yetenek: GORSEL_YETENEK },
    { ad: "Z-Image", ozet: "Anında gerçekçi portreler", yetenek: GORSEL_YETENEK },
    { ad: "Kling O1", ozet: "Kling'in fotogerçekçi görsel modeli", rozet: "Sınırsız", yetenek: GORSEL_YETENEK },
    { ad: "FLUX.2 Pro", ozet: "Hız-optimize detay", rozet: "Sınırsız", yetenek: GORSEL_YETENEK },
    { ad: "FLUX.2 Flex", ozet: "Hassasiyetle düzenle", yetenek: GORSEL_YETENEK },
    { ad: "FLUX.2 MAX", ozet: "Keskin metin, maksimum detay", yetenek: GORSEL_YETENEK },
    { ad: "Flux Kontext Max", ozet: "Hassasiyetle düzenle", yetenek: GORSEL_YETENEK },
    { ad: "Çoklu Referans", ozet: "Tek seferde birden fazla düzenleme", yetenek: GORSEL_YETENEK },
    { ad: "WAN 2.2", ozet: "Yüksek-sadakat sinematik görseller", yetenek: GORSEL_YETENEK },
  ]},
];

// Modelin composer yeteneklerini döndür (tanımlı değilse makul varsayılan).
export function modelYetenekBul(modelAd: string): ModelYetenek {
  for (const g of [...VIDEO_MODELLERI, ...GORSEL_MODELLERI]) {
    const m = g.ogeler.find((x) => x.ad === modelAd);
    if (m?.yetenek) return m.yetenek;
  }
  // Görsel modeli varsayılanı (Higgsfield: oran + çözünürlük + adet, düşük kredi)
  return { oranlar: ["Oto", "1:1", "3:4", "9:16", "4:3", "16:9", "21:9"], cozunurlukler: ["1K", "2K", "4K"], sureler: [], kredi: 0.25, preset: false };
}

/* ── Kamera hareketleri + hız rampaları (Yönetmen Paneli) ── */

// Kamera Hareketi modalı (Higgsfield "Camera movement" — 18 seçenek, 6 sütun) BİREBİR SIRA.
export const KAMERA_HAREKETLERI = [
  "Statik", "El Kamerası", "Uzaklaş", "Yakınlaş", "Kamera Takip", "Sola Pan",
  "Sağa Pan", "Yukarı Eğim", "Aşağı Eğim", "Yörünge", "Dolly İçeri", "Dolly Dışarı",
  "Vinç Yukarı", "Vinç Aşağı", "Drone Çekim", "Dolly Sol", "Dolly Sağ", "360 Roll",
];
// Speed Ramp seçenekleri (Higgsfield "Speed ramp" — 7 preset + Doğrusal/Özel eğri state'leri).
export const HIZ_RAMPALARI: { id: string; egri: number[] }[] = [
  { id: "Oto", egri: [40, 55, 62, 55, 40] },
  { id: "Yavaş Çekim", egri: [70, 55, 40, 28, 20] },
  { id: "Rampa Yukarı", egri: [20, 32, 45, 58, 72] },
  { id: "Flaş Giriş", egri: [80, 40, 30, 30, 30] },
  { id: "Flaş Çıkış", egri: [30, 30, 30, 40, 80] },
  { id: "Bullet Time", egri: [30, 60, 20, 60, 30] },
  { id: "Kahraman Anı", egri: [30, 62, 22, 58, 34] },
  { id: "Doğrusal", egri: [50, 50, 50, 50, 50] },
  { id: "Özel", egri: [40, 50, 60, 50, 40] },
];

/* ── Preset/Efekt seçici (Higgsfield "Presets" modalı BİREBİR) ── */
// Sekmeler (higg-cinema 082-101): Tümü / Yeni / Trend / Efektler / Temel Kamera / Epik Kamera / Nabzı Yakala.
export const PRESET_SEKMELERI = ["Tümü", "Yeni", "Trend", "Efektler", "Temel Kamera", "Epik Kamera", "Nabzı Yakala"] as const;
export type PresetSekme = (typeof PRESET_SEKMELERI)[number];
export type CinemaPreset = { ad: string; kategori: string; sekmeler: PresetSekme[]; top?: boolean; tohum: string };
// Higgsfield preset adları BİREBİR Türkçeleştirilmiş (higg-cinema 065-101 ölçüldü).
// top=true → "Top Seçim" rozeti. Masonry grid'de gösterilir.
export const CINEMA_PRESETLERI: CinemaPreset[] = [
  { ad: "GENEL", kategori: "sinematik", sekmeler: ["Tümü"], top: true, tohum: "ps-genel" },
  // ── Temel Kamera ──
  { ad: "DOLLY İÇERİ", kategori: "sinematik", sekmeler: ["Tümü", "Temel Kamera"], top: true, tohum: "ps-dollyin" },
  { ad: "DOLLY DIŞARI", kategori: "sinematik", sekmeler: ["Tümü", "Temel Kamera"], tohum: "ps-dollyout" },
  { ad: "SÜPER DOLLY İÇERİ", kategori: "sinematik", sekmeler: ["Tümü", "Temel Kamera"], top: true, tohum: "ps-superdollyin" },
  { ad: "SÜPER DOLLY DIŞARI", kategori: "sinematik", sekmeler: ["Tümü", "Temel Kamera"], tohum: "ps-superdollyout" },
  { ad: "ÇİFT DOLLY", kategori: "sinematik", sekmeler: ["Tümü", "Temel Kamera"], tohum: "ps-doubledolly" },
  { ad: "DOLLY SOL", kategori: "sinematik", sekmeler: ["Tümü", "Temel Kamera"], tohum: "ps-dollyleft" },
  { ad: "DOLLY SAĞ", kategori: "sinematik", sekmeler: ["Tümü", "Temel Kamera"], tohum: "ps-dollyright" },
  { ad: "YAKINLAŞ", kategori: "sinematik", sekmeler: ["Tümü", "Temel Kamera"], tohum: "ps-zoomin" },
  { ad: "UZAKLAŞ", kategori: "sinematik", sekmeler: ["Tümü", "Temel Kamera"], tohum: "ps-zoomout" },
  { ad: "STATİK", kategori: "sinematik", sekmeler: ["Tümü", "Temel Kamera"], top: true, tohum: "ps-static" },
  { ad: "EL KAMERASI", kategori: "sinematik", sekmeler: ["Tümü", "Temel Kamera"], top: true, tohum: "ps-handheld" },
  { ad: "YUKARI EĞİM", kategori: "sinematik", sekmeler: ["Tümü", "Temel Kamera"], tohum: "ps-tiltup" },
  { ad: "AŞAĞI EĞİM", kategori: "sinematik", sekmeler: ["Tümü", "Temel Kamera"], tohum: "ps-tiltdown" },
  // ── Epik Kamera ──
  { ad: "360 YÖRÜNGE", kategori: "sinematik", sekmeler: ["Tümü", "Epik Kamera"], top: true, tohum: "ps-360" },
  { ad: "KRES ZOOM İÇERİ", kategori: "aksiyon", sekmeler: ["Tümü", "Epik Kamera"], top: true, tohum: "ps-crashzoomin" },
  { ad: "KRES ZOOM DIŞARI", kategori: "aksiyon", sekmeler: ["Tümü", "Epik Kamera"], tohum: "ps-crashzoomout" },
  { ad: "DOLLY ZOOM İÇERİ", kategori: "sinematik", sekmeler: ["Tümü", "Epik Kamera"], top: true, tohum: "ps-dollyzoomin" },
  { ad: "DOLLY ZOOM DIŞARI", kategori: "sinematik", sekmeler: ["Tümü", "Epik Kamera"], tohum: "ps-dollyzoomout" },
  { ad: "FPV DRONE", kategori: "manzara", sekmeler: ["Tümü", "Epik Kamera"], top: true, tohum: "ps-fpv" },
  { ad: "VİNÇ YUKARI", kategori: "sinematik", sekmeler: ["Tümü", "Epik Kamera"], tohum: "ps-craneup" },
  { ad: "VİNÇ AŞAĞI", kategori: "sinematik", sekmeler: ["Tümü", "Epik Kamera"], tohum: "ps-cranedown" },
  { ad: "DUTCH AÇI", kategori: "sinematik", sekmeler: ["Tümü", "Epik Kamera"], tohum: "ps-dutch" },
  { ad: "YAY SOL", kategori: "sinematik", sekmeler: ["Tümü", "Epik Kamera"], tohum: "ps-arcleft" },
  { ad: "YAY SAĞ", kategori: "sinematik", sekmeler: ["Tümü", "Epik Kamera"], top: true, tohum: "ps-arcright" },
  { ad: "SNORRICAM", kategori: "sinematik", sekmeler: ["Tümü", "Epik Kamera"], top: true, tohum: "ps-snorricam" },
  { ad: "BALIKGÖZÜ", kategori: "sinematik", sekmeler: ["Tümü", "Epik Kamera"], tohum: "ps-fisheye" },
  { ad: "TEPEDEN", kategori: "sinematik", sekmeler: ["Tümü", "Epik Kamera"], tohum: "ps-overhead" },
  // ── Efektler ──
  { ad: "BULLET TIME", kategori: "aksiyon", sekmeler: ["Tümü", "Efektler"], top: true, tohum: "ps-bullet" },
  { ad: "ATEŞE VER", kategori: "soyut", sekmeler: ["Tümü", "Efektler"], top: true, tohum: "ps-fire" },
  { ad: "DAĞILMA", kategori: "soyut", sekmeler: ["Tümü", "Efektler"], top: true, tohum: "ps-disint" },
  { ad: "METAL DÖNÜŞÜMÜ", kategori: "soyut", sekmeler: ["Tümü", "Efektler"], top: true, tohum: "ps-metal" },
  { ad: "ERİME", kategori: "soyut", sekmeler: ["Tümü", "Efektler"], tohum: "ps-melt" },
  { ad: "GÖZLER İÇERİ", kategori: "portre", sekmeler: ["Tümü", "Efektler"], top: true, tohum: "ps-eyes" },
  { ad: "LEVİTASYON", kategori: "portre", sekmeler: ["Tümü", "Efektler"], tohum: "ps-levit" },
  { ad: "PARA YAĞMURU", kategori: "soyut", sekmeler: ["Tümü", "Efektler"], tohum: "ps-money" },
  { ad: "PORTAL", kategori: "soyut", sekmeler: ["Tümü", "Efektler"], tohum: "ps-portal" },
  { ad: "GLITCH", kategori: "soyut", sekmeler: ["Tümü", "Efektler"], tohum: "ps-glitch" },
  { ad: "X-RAY", kategori: "soyut", sekmeler: ["Tümü", "Efektler"], tohum: "ps-xray" },
  { ad: "KLONLAR", kategori: "portre", sekmeler: ["Tümü", "Efektler"], tohum: "ps-clones" },
  { ad: "DOKUNAÇLAR", kategori: "soyut", sekmeler: ["Tümü", "Efektler"], tohum: "ps-tentacles" },
  { ad: "BİNA PATLAMASI", kategori: "aksiyon", sekmeler: ["Tümü", "Efektler"], top: true, tohum: "ps-buildingexp" },
  { ad: "KAFA PATLAMASI", kategori: "soyut", sekmeler: ["Tümü", "Efektler"], tohum: "ps-headexp" },
  { ad: "3D DÖNÜŞ", kategori: "soyut", sekmeler: ["Tümü", "Efektler"], top: true, tohum: "ps-3drotation" },
  { ad: "MEDUSA GORGONA", kategori: "portre", sekmeler: ["Tümü", "Efektler"], tohum: "ps-medusa" },
  { ad: "MELEK KANATLARI", kategori: "portre", sekmeler: ["Tümü", "Efektler"], tohum: "ps-angelwings" },
  { ad: "KUM FIRTINASI", kategori: "manzara", sekmeler: ["Tümü", "Efektler"], tohum: "ps-sandstorm" },
  // ── Yeni / Trend ──
  { ad: "DÜNYA UZAKLAŞ", kategori: "manzara", sekmeler: ["Tümü", "Yeni", "Epik Kamera"], top: true, tohum: "ps-earthzoom" },
  { ad: "YÜZE YUMRUK", kategori: "aksiyon", sekmeler: ["Tümü", "Yeni"], top: true, tohum: "ps-facepunch" },
  { ad: "GÖK TANRISI", kategori: "soyut", sekmeler: ["Tümü", "Trend"], tohum: "ps-thundergod" },
  { ad: "DONMA", kategori: "soyut", sekmeler: ["Tümü", "Trend"], tohum: "ps-freezing" },
  { ad: "KLON PATLAMASI", kategori: "soyut", sekmeler: ["Tümü", "Yeni"], tohum: "ps-cloneexp" },
  { ad: "SİYAH GÖZYAŞLARI", kategori: "portre", sekmeler: ["Tümü", "Trend"], tohum: "ps-blacktears" },
  { ad: "BAHÇE AÇILIŞI", kategori: "manzara", sekmeler: ["Tümü", "Yeni"], tohum: "ps-gardenbloom" },
  { ad: "HİPERLAPSE", kategori: "manzara", sekmeler: ["Tümü", "Nabzı Yakala"], tohum: "ps-hyper" },
  { ad: "ZAMAN AKIŞI İNSAN", kategori: "sinematik", sekmeler: ["Tümü", "Nabzı Yakala"], tohum: "ps-timelapse" },
  { ad: "ZAMAN AKIŞI MANZARA", kategori: "manzara", sekmeler: ["Tümü", "Nabzı Yakala"], tohum: "ps-timelapseland" },
  { ad: "CANLI KONSER", kategori: "sinematik", sekmeler: ["Tümü", "Nabzı Yakala"], tohum: "ps-concert" },
  { ad: "RAP FLEX", kategori: "portre", sekmeler: ["Tümü", "Nabzı Yakala"], tohum: "ps-rapflex" },
  // ── Korku / Karakter / UGC (Tümü'de görünür) ──
  { ad: "KANLI GÖZLER", kategori: "portre", sekmeler: ["Tümü", "Efektler"], tohum: "ps-bloodyeyes" },
  { ad: "VAMPİR DÖNÜŞÜMÜ", kategori: "portre", sekmeler: ["Tümü", "Efektler"], tohum: "ps-vampire" },
  { ad: "ŞEYTAN DÖNÜŞÜMÜ", kategori: "portre", sekmeler: ["Tümü", "Efektler"], tohum: "ps-devil" },
  { ad: "ZOMBİ ÇÜRÜMESİ", kategori: "portre", sekmeler: ["Tümü", "Efektler"], tohum: "ps-zombie" },
  { ad: "MUMYA", kategori: "portre", sekmeler: ["Tümü", "Efektler"], tohum: "ps-mummy" },
  { ad: "AĞLAMA", kategori: "portre", sekmeler: ["Tümü"], tohum: "ps-cry" },
  { ad: "MUTLU MOD", kategori: "portre", sekmeler: ["Tümü"], tohum: "ps-happy" },
  { ad: "ÖFKELİ MOD", kategori: "portre", sekmeler: ["Tümü"], tohum: "ps-angry" },
  { ad: "SELFIE", kategori: "portre", sekmeler: ["Tümü"], tohum: "ps-selfie" },
  { ad: "AYNA SELFIE", kategori: "portre", sekmeler: ["Tümü"], tohum: "ps-mirror" },
  { ad: "GRUP FOTO", kategori: "portre", sekmeler: ["Tümü"], tohum: "ps-group" },
  { ad: "KIYAFET KONTROL", kategori: "portre", sekmeler: ["Tümü"], tohum: "ps-outfit" },
  { ad: "HIZLI KOŞU", kategori: "aksiyon", sekmeler: ["Tümü"], tohum: "ps-sprint" },
  { ad: "HAVUZ ATLAMA", kategori: "aksiyon", sekmeler: ["Tümü"], tohum: "ps-pool" },
  { ad: "TREN GEÇİŞİ", kategori: "aksiyon", sekmeler: ["Tümü"], tohum: "ps-train" },
  { ad: "ARABA KOVALAMACA", kategori: "aksiyon", sekmeler: ["Tümü"], tohum: "ps-car" },
  { ad: "KAYKAY KAYIŞI", kategori: "aksiyon", sekmeler: ["Tümü"], tohum: "ps-skate" },
  { ad: "BASKETBOL SMAÇ", kategori: "aksiyon", sekmeler: ["Tümü"], tohum: "ps-basketball" },
  { ad: "ÜRÜN VİTRİNİ", kategori: "urun", sekmeler: ["Tümü"], tohum: "ps-product" },
  { ad: "COLLAGE", kategori: "soyut", sekmeler: ["Tümü"], tohum: "ps-collage" },
  { ad: "POLİGON", kategori: "soyut", sekmeler: ["Tümü"], tohum: "ps-polygon" },
  { ad: "NOKTA BULUTU", kategori: "soyut", sekmeler: ["Tümü"], tohum: "ps-pointcloud" },
];

/* ── GERÇEK SİNEMA GÖRSELLERİ ──
 * Tüm sinema tohumları (ps-*, cs-hero-*, top-*, kh-*, tur-*, mc-lib-*) için
 * Nano Banana ile üretilmiş gerçek görseller public/gercek/sinema/<tohum>.webp.
 * Dosya adı tohumla birebir olduğu için prefix kontrolü yeterli. */
const SINEMA_GERCEK_PREFIX = ["ps-", "cs-hero-", "cs-p", "top-", "kh-", "tur-", "mc-lib-", "mc-", "sh-"];
/** Tohum için gerçek sinema görseli yolu (yoksa undefined → stok). */
export function sinemaGercek(tohum: string): string | undefined {
  return SINEMA_GERCEK_PREFIX.some((p) => tohum.startsWith(p))
    ? `/gercek/sinema/${tohum}.webp`
    : undefined;
}
