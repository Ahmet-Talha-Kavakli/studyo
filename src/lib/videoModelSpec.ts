/**
 * videoModelSpec — Higgsfield video composer'ının BİREBİR veri modeli.
 *
 * Referans: ~/Desktop/referanslar/modeller/video/* (46 model, 111 ekran görüntüsü)
 * ve ~/Desktop/referanslar/video-model-secici/* (11 ekran görüntüsü).
 *
 * TASARIM KARARI — neden veri-güdümlü:
 * Higgsfield'da composer modele göre TAMAMEN değişiyor: çipler gelir/gider,
 * yükleme kutuları biçim değiştirir, prompt kilitlenir, "Mode" değişince kutular
 * kaybolur, "Multi-shot: Custom" çekim şeridi açar. 46 modeli tek tek JSX'e
 * gömmek yerine her modeli bir SPEC olarak tanımlıyoruz; tek bir motor
 * (VideoComposer) bu spec'i render ediyor. Yeni model = tek satır veri.
 *
 * Ölçülen kurallar (referanstan birebir):
 *  - `+` çipi Grok Imagine Edit ve Kling 3.0 Motion Control HARİÇ her modelde var.
 *  - `@` çipi yalnız Elements-modu ve Edit modellerinde (`+`'dan dikey çizgiyle ayrık).
 *  - İki kutu varsa "Opsiyonel" etiketi SON kutuda; tek kutu varsa START'ta.
 *  - Mode=Ingredients/Elements → tüm kare kutuları kaybolur.
 *  - Multi-shot=Custom → composer ÜSTÜNDE çekim şeridi açılır, süre çipi kaybolur.
 *  - Kling 3.0 Motion Control: prompt kilitli ("İstem kapalı"), MOTION+CHARACTER kutuları.
 *  - Grok ailesi: composer üstünde amber "açık içerik" uyarı bandı.
 */

/* ------------------------------------------------------------------ */
/* Çip tipleri                                                         */
/* ------------------------------------------------------------------ */

/** Composer'da görünebilecek çip türleri (Higgsfield birebir). */
export type CipTuru =
  | "ekle"          // `+` — medya ekle
  | "mention"       // `@` — element referansı
  | "model"         // model adı + marka ikonu
  | "oran"          // en-boy oranı (popover)
  | "cozunurluk"    // 720p/1080p/4K (popover)
  | "sure"          // süre (popover)
  | "cokCekim"      // Multi-shot — dropdown (Off/Auto/Custom) veya switch
  | "mod"           // Mode: Frames/Ingredients/Elements (popover)
  | "iyilestir"     // ✧ İyileştir On/Off
  | "ses"           // 🔊 ses On/Off
  | "sayac"         // − 1/4 + (adet)
  | "bitrate"       // ✧ Yüksek/Standart (popover)
  | "sabitLens"     // Fixed Lens — yeşil switch
  | "otoAyar"       // Auto settings — yeşil switch
  | "gelismis"      // ⚙ ikon-only — Steps/Seed popover
  | "sahneKontrol"  // Scene control: Off/Video/Image (popover)
  | "tur"           // Sinema 2.5: Tür çipi (renk örnekli, "Genel")
  | "cekimKontrol"  // Çekim kontrolü: Akıllı/Özel Çoklu-çekim · Tek/Çoklu (popover)
  /* ── GÖRSEL modu çipleri (referans: modeller/gorsel/*) ── */
  | "kalite"        // ◇ Basic/High · Standard/Pro · Low/Orta/Yüksek · 1K/2K (popover)
  | "izgara"        // ⊞ 1x1 / 2x2 / 3x3 / 4x4 (popover)
  | "sinirsiz"      // "Sınırsız" + gerçek switch
  | "vektor"        // "Vektör kipi" + switch (Recraft)
  | "renkAktarim"   // "Renk aktarımı" (Recraft / Soul 2.0 — Soul'da "Yeni" rozetli)
  | "cfgAdim"       // ⚙ CFG + Adım kaydırıcıları (FLUX.2 Flex)
  | "gorselKip";    // Standart / Kalite (Grok Imagine görsel)

/** Sağdaki yükleme kutuları. */
export type KutuTuru =
  | "baslangic"     // START FRAME
  | "bitis"         // END FRAME
  | "videoRef"      // VIDEO REFERENCE (Edit modelleri)
  | "hareket"       // MOTION (Motion Control)
  | "karakter"      // CHARACTER (Motion Control)
  | "preset"        // GENERAL — dolu preset küçük resmi
  /* ── GÖRSEL modu kutuları ── */
  | "kadroKur"      // "Kadronu Kur" (AI Cast) — büyük gri kart
  | "kameraKurulum" // Kamera kurulum okuması (Sinematik Kameralar)
  | "gKarakter"     // CHARACTER (Soul 2.0)
  | "gStil";        // STYLE (Soul 2.0)

/** Multi-shot davranışı: dropdown mu, düz switch mi. */
export type CokCekimTipi = "dropdown" | "switch";

export type VideoModelSpec = {
  ad: string;
  /** Model seçicide gösterilen aile (flyout grubu). */
  aile: string;
  /** Marka ikonu anahtarı — MarkaIkon bileşeni çözer. */
  marka: string;
  /** Çip sırası — soldan sağa, referanstaki sırayla. */
  cipler: CipTuru[];
  /** Sağdaki yükleme kutuları — referanstaki sırayla. */
  kutular: KutuTuru[];
  /** Kredi maliyeti. */
  kredi: number;
  /** Üstü çizili eski fiyat (indirim) — yalnız HappyHorse'da var. */
  krediEski?: number;

  /* ── Varsayılan değerler (model seçilince uygulanır) ── */
  oran?: string;
  oranlar?: string[];      // bu modelin oran havuzu (popover içeriği)
  coz?: string;
  cozler?: string[];
  sure?: number;
  sureler?: number[];
  cokCekimTipi?: CokCekimTipi;
  cokCekimDeger?: "Kapalı" | "Oto" | "Özel";
  modlar?: string[];       // Mode popover seçenekleri
  mod?: string;
  iyilestir?: boolean;
  ses?: boolean;
  bitrate?: string;
  sahneKontrol?: string;
  sahneKontrolSecenek?: string[];
  adim?: number;           // Gelişmiş: Steps
  tohum?: string;          // Gelişmiş: Seed

  /* ── Özel davranışlar ── */
  promptKilitli?: boolean; // Motion Control — "İstem kapalı"
  uyariBandi?: boolean;    // Grok — amber açık-içerik uyarısı
  /** Bu modda kare kutuları gizlenir (Mode=Ingredients/Elements). */
  modKutuGizle?: string[];
  /** Sinema Stüdyo: composer ÜSTÜNDEKİ seçici düzeni.
   *  car      → 3.5: Tür/Stil/Kamera hapları + dönen çark modalı
   *  izgara   → 3.0: Yönetmen Paneli + Tür + Kamera Hareketi + Hız Rampası, ızgara modal
   *  yonetmen → 2.5: Yönetmen Paneli barı (karakter yuvaları + hız eğrisi grafiği) */
  secici?: "car" | "izgara" | "yonetmen";
  /** Çekim kontrolü çipinin başlangıç değeri. */
  cekimKontrol?: string;

  /* ── GÖRSEL modu alanları (referans: modeller/gorsel/*) ── */
  /** Sayaç üst sınırı: `− n/ADET +` (görselde 4 veya 10). */
  adetMax?: number;
  /** Sayacın başlangıç değeri. */
  adetVar?: number;
  /** Kalite çipi değeri + havuzu (Temel/Yüksek · Standart/Pro · Düşük/Orta/Yüksek). */
  kalite?: string;
  kaliteler?: string[];
  /** Izgara üretimi (Sinematik Kameralar): 1x1..4x4. */
  izgara?: string;
  /** Grok görsel kipi: Standart / Kalite. */
  gorselKip?: string;
  /** FLUX.2 Flex gelişmiş: CFG değeri. */
  cfg?: number;
  /** Prompt yer tutucusu modele özelse (AI Kadro: "Karakterini anlat"). */
  yerTutucu?: string;
  /** Kredi yerine ücretsiz kota metni gösterilir (Ruh 2.0, Sinematik Mekanlar). */
  bedavaKota?: string;
};

/* ------------------------------------------------------------------ */
/* Ortak havuzlar                                                      */
/* ------------------------------------------------------------------ */

const O_TEMEL = ["16:9", "9:16"];
const O_UC = ["16:9", "9:16", "1:1"];
const O_OMNI = ["1:1", "16:9", "9:16"];
const O_BES = ["16:9", "9:16", "4:3", "3:4", "1:1"];
const O_SEEDANCE = ["Auto", "16:9", "9:16", "4:3", "3:4", "1:1", "21:9"];
const O_GROK = ["Auto", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "1:1"];
const O_LITE = ["Auto", "16:9", "9:16"];
const O_HAPPY = ["16:9", "9:16", "1:1", "4:3", "3:4"];
// Sinema Stüdyo 3.5/3.0 — referans sırası birebir (Auto ilk, 21:9 son)
const O_SINEMA = ["Auto", "1:1", "3:4", "9:16", "4:3", "16:9", "21:9"];
// Sinema Stüdyo 2.5 — Auto yok, 16:9 ve 21:9'da "Sinematik" rozeti
const O_SINEMA_25 = ["1:1", "3:4", "2:3", "9:16", "3:2", "4:3", "16:9", "21:9"];
/** Sinematik rozeti taşıyan oranlar (2.5 referansı). */
export const ORAN_SINEMATIK = ["16:9", "21:9"];

const MOD_FI = ["Frames", "Ingredients"];
const MOD_EF = ["Elements", "Frames"];

/* ------------------------------------------------------------------ */
/* 46 model — referanstan birebir                                      */
/* ------------------------------------------------------------------ */

export const VIDEO_MODELLERI: VideoModelSpec[] = [
  /* ═══ Sinema Stüdyo — sayfanın kendi imza modelleri ═══
     Referans: modeller/video/cinema-studio-{2.5,3.0,3.5}
     3.5 → Tür/Stil/Kamera çark seçicileri, 4sn, ~96→80 kredi
     3.0 → Yönetmen Paneli + Tür + Kamera Hareketi + Hız Rampası, 8sn, 492→160
     2.5 → Yönetmen Paneli (karakter yuvaları + hız eğrisi), 12sn, 48, kare kutuları */
  {
    ad: "Sinema Stüdyo 3.5", aile: "Sinema Stüdyo", marka: "vayra",
    cipler: ["ekle", "mention", "model", "oran", "cozunurluk", "sure", "sayac", "ses"],
    kutular: [],
    kredi: 80, krediEski: 96, oran: "Auto", oranlar: O_SINEMA,
    coz: "1080p", cozler: ["720p", "1080p", "4K"], sure: 4, sureler: [4, 6, 8, 10],
    ses: true, secici: "car",
  },
  {
    ad: "Sinema Stüdyo 3.0", aile: "Sinema Stüdyo", marka: "vayra",
    cipler: ["ekle", "mention", "model", "oran", "cozunurluk", "sure", "sayac", "ses", "cekimKontrol"],
    kutular: [],
    kredi: 160, krediEski: 492, oran: "Auto", oranlar: O_SINEMA,
    coz: "1080p", cozler: ["720p", "1080p", "4K"], sure: 8, sureler: [4, 8, 12],
    ses: true, secici: "izgara", cekimKontrol: "Akıllı",
  },
  {
    ad: "Sinema Stüdyo 2.5", aile: "Sinema Stüdyo", marka: "vayra",
    cipler: ["ekle", "model", "oran", "cozunurluk", "sayac", "ses", "tur", "cekimKontrol"],
    kutular: ["baslangic", "bitis"],
    kredi: 48, oran: "16:9", oranlar: O_SINEMA_25,
    coz: "1080p", cozler: ["720p", "1080p"], sure: 12, sureler: [4, 8, 12],
    ses: true, secici: "yonetmen", cekimKontrol: "Tek çekim",
  },

  /* ═══ Minimax Hailuo ═══ */
  {
    ad: "Minimax Hailuo 2.3 Fast", aile: "Minimax Hailuo", marka: "minimax",
    cipler: ["ekle", "model", "cozunurluk", "sure", "iyilestir"],
    kutular: ["baslangic", "preset"],
    kredi: 4, coz: "768p", cozler: ["768p"], sure: 6, sureler: [6, 8, 10], iyilestir: true,
  },
  {
    ad: "Minimax Hailuo 2.3", aile: "Minimax Hailuo", marka: "minimax",
    cipler: ["ekle", "model", "cozunurluk", "sure", "iyilestir"],
    kutular: ["baslangic", "preset"],
    kredi: 6, coz: "768p", cozler: ["768p"], sure: 6, sureler: [6, 8, 10], iyilestir: true,
  },
  {
    ad: "Minimax Hailuo 02 Fast", aile: "Minimax Hailuo", marka: "minimax",
    cipler: ["ekle", "model", "cozunurluk", "sure", "iyilestir"],
    kutular: ["baslangic", "bitis", "preset"],
    kredi: 6, coz: "768p", cozler: ["768p"], sure: 6, sureler: [6, 8, 10], iyilestir: true,
  },
  {
    ad: "Minimax Hailuo 02", aile: "Minimax Hailuo", marka: "minimax",
    cipler: ["ekle", "model", "cozunurluk", "sure", "iyilestir"],
    kutular: ["baslangic", "bitis", "preset"],
    kredi: 6, coz: "768p", cozler: ["768p"], sure: 6, sureler: [6, 8, 10], iyilestir: true,
  },

  /* ═══ Kling ═══ */
  {
    ad: "Kling 3.0", aile: "Kling", marka: "kling",
    cipler: ["ekle", "mention", "model", "oran", "cozunurluk", "sure", "cokCekim", "iyilestir", "ses"],
    kutular: ["baslangic", "bitis"],
    kredi: 90, oran: "16:9", oranlar: O_UC, coz: "4K", cozler: ["720p", "1080p", "4K"],
    sure: 15, sureler: [3, 5, 8, 10, 15], cokCekimTipi: "dropdown", cokCekimDeger: "Kapalı", iyilestir: true,
  },
  {
    ad: "Kling 3.0 Turbo", aile: "Kling", marka: "kling",
    cipler: ["ekle", "model", "oran", "cozunurluk", "sure"],
    kutular: ["baslangic"],
    kredi: 22.5, oran: "16:9", oranlar: O_UC, coz: "720p", cozler: ["720p", "1080p"],
    sure: 15, sureler: [3, 5, 8, 10, 15],
  },
  {
    ad: "Kling 3.0 Omni", aile: "Kling", marka: "kling",
    cipler: ["ekle", "mention", "model", "oran", "cozunurluk", "sure", "cokCekim", "mod", "ses"],
    kutular: ["baslangic", "bitis"],
    kredi: 30, oran: "1:1", oranlar: O_OMNI, coz: "4K", cozler: ["720p", "1080p", "4K"],
    sure: 5, sureler: [3, 5, 10, 15], modlar: MOD_EF, mod: "Frames", modKutuGizle: ["Elements"],
    cokCekimTipi: "dropdown", cokCekimDeger: "Kapalı",
  },
  {
    ad: "Kling 3.0 Omni Edit", aile: "Kling", marka: "kling",
    cipler: ["ekle", "mention", "model", "cozunurluk", "otoAyar"],
    kutular: ["videoRef"],
    kredi: 9, coz: "720p", cozler: ["720p", "1080p"],
  },
  {
    ad: "Kling 3.0 Motion Control", aile: "Kling", marka: "kling",
    cipler: ["model", "cozunurluk", "gelismis", "sahneKontrol"],
    kutular: ["hareket", "karakter"],
    kredi: 10, coz: "1080p", cozler: ["720p", "1080p"], promptKilitli: true,
    sahneKontrol: "Image", sahneKontrolSecenek: ["Off", "Video", "Image"], tohum: "Rastgele",
  },
  {
    ad: "Kling Motion Control", aile: "Kling", marka: "kling",
    cipler: ["model", "cozunurluk", "gelismis", "sahneKontrol"],
    kutular: ["hareket", "karakter"],
    kredi: 7, coz: "1080p", cozler: ["720p", "1080p"], promptKilitli: true,
    sahneKontrol: "Video", sahneKontrolSecenek: ["Off", "Video", "Image"], tohum: "Rastgele",
  },
  {
    ad: "Kling 2.6", aile: "Kling", marka: "kling",
    cipler: ["ekle", "model", "oran", "sure", "iyilestir", "ses"],
    kutular: ["baslangic", "preset"],
    kredi: 10, oran: "16:9", oranlar: O_UC, sure: 5, sureler: [5, 10], iyilestir: true, ses: true,
  },
  {
    ad: "Kling 2.5 Turbo", aile: "Kling", marka: "kling",
    cipler: ["ekle", "model", "cozunurluk", "sure", "iyilestir"],
    kutular: ["baslangic", "bitis", "preset"],
    kredi: 6, coz: "1080p", cozler: ["720p", "1080p"], sure: 5, sureler: [5, 10], iyilestir: true,
  },
  {
    ad: "Kling 2.1", aile: "Kling", marka: "kling",
    cipler: ["ekle", "model", "cozunurluk", "sure", "iyilestir"],
    kutular: ["baslangic", "bitis", "preset"],
    kredi: 10, coz: "1080p", cozler: ["720p", "1080p"], sure: 5, sureler: [5, 10], iyilestir: true,
  },
  {
    ad: "Kling 2.1 Master", aile: "Kling", marka: "kling",
    cipler: ["ekle", "model", "sure", "iyilestir"],
    kutular: ["baslangic", "bitis", "preset"],
    kredi: 25, sure: 5, sureler: [5, 10], iyilestir: true,
  },
  {
    ad: "Kling O1 Video", aile: "Kling", marka: "kling",
    cipler: ["ekle", "mention", "model", "oran", "cozunurluk", "sure", "mod"],
    kutular: ["baslangic", "bitis"],
    kredi: 10, oran: "1:1", oranlar: O_OMNI, coz: "1080p", cozler: ["720p", "1080p"],
    sure: 5, sureler: [5, 10], modlar: MOD_EF, mod: "Frames", modKutuGizle: ["Elements"],
  },
  {
    ad: "Kling O1 Video Edit", aile: "Kling", marka: "kling",
    cipler: ["ekle", "mention", "model", "cozunurluk", "otoAyar"],
    kutular: ["videoRef"],
    kredi: 15, coz: "720p", cozler: ["720p", "1080p"],
  },

  /* ═══ OpenAI Sora 2 ═══ */
  {
    ad: "Sora 2", aile: "OpenAI Sora 2", marka: "openai",
    cipler: ["ekle", "model", "oran", "sure"],
    kutular: ["baslangic"],
    kredi: 29, oran: "16:9", oranlar: O_TEMEL, sure: 12, sureler: [4, 8, 12],
  },
  {
    ad: "Sora 2 Pro", aile: "OpenAI Sora 2", marka: "openai",
    cipler: ["ekle", "model", "oran", "cozunurluk", "sure"],
    kutular: ["baslangic"],
    kredi: 89, oran: "16:9", oranlar: O_TEMEL, coz: "720p", cozler: ["720p", "1080p"], sure: 12, sureler: [4, 8, 12],
  },
  {
    ad: "Sora 2 Max", aile: "OpenAI Sora 2", marka: "openai",
    cipler: ["ekle", "model", "oran", "cozunurluk", "sure"],
    kutular: ["baslangic"],
    kredi: 33, oran: "16:9", oranlar: O_TEMEL, coz: "720p", cozler: ["720p", "1080p"], sure: 12, sureler: [4, 8, 12],
  },
  {
    ad: "Sora 2 Pro Max", aile: "OpenAI Sora 2", marka: "openai",
    cipler: ["ekle", "model", "oran", "cozunurluk", "sure"],
    kutular: ["baslangic"],
    kredi: 93, oran: "16:9", oranlar: O_TEMEL, coz: "720p", cozler: ["720p", "1080p"], sure: 12, sureler: [4, 8, 12],
  },

  /* ═══ Google Veo ═══ */
  {
    ad: "Google Veo 3.1", aile: "Google Veo", marka: "google",
    cipler: ["ekle", "model", "oran", "cozunurluk", "sure", "cokCekim", "mod", "iyilestir"],
    kutular: ["baslangic", "bitis"],
    kredi: 58, oran: "16:9", oranlar: O_TEMEL, coz: "720p", cozler: ["720p", "1080p"],
    sure: 8, sureler: [4, 6, 8], cokCekimTipi: "switch", modlar: MOD_FI, mod: "Frames",
    modKutuGizle: ["Ingredients"], iyilestir: true,
  },
  {
    ad: "Google Veo 3.1 Fast", aile: "Google Veo", marka: "google",
    cipler: ["ekle", "model", "oran", "cozunurluk", "sure", "cokCekim", "mod"],
    kutular: ["baslangic", "bitis"],
    kredi: 22, oran: "16:9", oranlar: O_TEMEL, coz: "720p", cozler: ["720p", "1080p"],
    sure: 8, sureler: [4, 6, 8], cokCekimTipi: "switch", modlar: MOD_FI, mod: "Frames",
    modKutuGizle: ["Ingredients"],
  },
  {
    ad: "Google Veo 3.1 Lite", aile: "Google Veo", marka: "google",
    cipler: ["ekle", "model", "oran", "cozunurluk", "sure", "ses"],
    kutular: ["baslangic", "bitis"],
    kredi: 12, oran: "Auto", oranlar: O_LITE, coz: "720p", cozler: ["720p", "1080p"],
    sure: 8, sureler: [4, 6, 8], ses: true,
  },
  {
    ad: "Google Veo 3", aile: "Google Veo", marka: "google",
    cipler: ["ekle", "model", "oran", "cozunurluk", "iyilestir"],
    kutular: ["baslangic", "bitis", "preset"],
    kredi: 58, oran: "16:9", oranlar: O_TEMEL, coz: "720p", cozler: ["720p", "1080p"], iyilestir: true,
  },
  {
    ad: "Google Veo 3 Fast", aile: "Google Veo", marka: "google",
    cipler: ["ekle", "model", "oran", "cozunurluk", "iyilestir"],
    kutular: ["baslangic", "bitis", "preset"],
    kredi: 22, oran: "16:9", oranlar: O_TEMEL, coz: "720p", cozler: ["720p", "1080p"], iyilestir: true,
  },
  {
    ad: "Gemini Omni Flash", aile: "Gemini Omni Flash", marka: "google",
    cipler: ["ekle", "model", "oran", "sure", "sayac"],
    kutular: [],
    kredi: 24, oran: "16:9", oranlar: O_TEMEL, sure: 8, sureler: [4, 6, 8, 10],
  },

  /* ═══ Higgsfield (Vayra) ═══ */
  {
    ad: "Vayra Lite", aile: "Vayra", marka: "vayra",
    cipler: ["ekle", "model", "sure", "gelismis", "iyilestir"],
    kutular: ["baslangic", "bitis", "preset"],
    kredi: 5, sure: 5, sureler: [3, 5], iyilestir: true, tohum: "Rastgele",
  },
  {
    ad: "Vayra Standard", aile: "Vayra", marka: "vayra",
    cipler: ["ekle", "model", "sure", "gelismis", "iyilestir"],
    kutular: ["baslangic", "bitis", "preset"],
    kredi: 24, sure: 5, sureler: [3, 5], iyilestir: true, adim: 60, tohum: "Rastgele",
  },
  {
    ad: "Vayra Turbo", aile: "Vayra", marka: "vayra",
    cipler: ["ekle", "model", "sure", "gelismis", "iyilestir"],
    kutular: ["baslangic", "bitis", "preset"],
    kredi: 10, sure: 5, sureler: [3, 5], iyilestir: true, adim: 60, tohum: "Rastgele",
  },

  /* ═══ Wan ═══ */
  {
    ad: "Wan 2.7", aile: "Wan", marka: "wan",
    cipler: ["ekle", "model", "oran", "cozunurluk", "sure", "gelismis"],
    kutular: ["baslangic", "bitis"],
    kredi: 30, oran: "16:9", oranlar: O_BES, coz: "1080p", cozler: ["720p", "1080p"],
    sure: 12, sureler: [2, 5, 8, 12, 15], tohum: "Rastgele",
  },
  {
    ad: "Wan 2.6", aile: "Wan", marka: "wan",
    cipler: ["ekle", "model", "cozunurluk", "sure", "cokCekim"],
    kutular: [],
    kredi: 13, coz: "720p", cozler: ["720p", "1080p"], sure: 5, sureler: [5, 10, 15],
    cokCekimTipi: "switch",
  },
  {
    ad: "Wan 2.5", aile: "Wan", marka: "wan",
    cipler: ["ekle", "model", "oran", "cozunurluk", "sure", "iyilestir"],
    kutular: ["baslangic", "preset"],
    kredi: 13, oran: "16:9", oranlar: O_TEMEL, coz: "720p", cozler: ["480p", "720p", "1080p"],
    sure: 5, sureler: [5, 10], iyilestir: true,
  },
  {
    ad: "Wan 2.5 Fast", aile: "Wan", marka: "wan",
    cipler: ["ekle", "model", "oran", "cozunurluk", "sure", "iyilestir"],
    kutular: ["baslangic", "preset"],
    kredi: 9, oran: "16:9", oranlar: O_TEMEL, coz: "720p", cozler: ["480p", "720p", "1080p"],
    sure: 5, sureler: [5, 10], iyilestir: true,
  },
  {
    ad: "Wan 2.2", aile: "Wan", marka: "wan",
    cipler: ["ekle", "model", "sure", "gelismis", "iyilestir"],
    kutular: ["baslangic", "preset"],
    kredi: 14, sure: 5, sureler: [5], iyilestir: true, adim: 30, tohum: "Rastgele",
  },
  {
    ad: "Wan 2.2 Fast", aile: "Wan", marka: "wan",
    cipler: ["ekle", "model", "gelismis", "iyilestir"],
    kutular: ["baslangic", "preset"],
    kredi: 5, iyilestir: true, tohum: "Rastgele",
  },

  /* ═══ Seedance ═══ */
  {
    ad: "Seedance 2.0", aile: "Seedance", marka: "seedance",
    cipler: ["ekle", "mention", "model", "oran", "cozunurluk", "sure", "sayac", "bitrate", "ses"],
    kutular: [],
    kredi: 135, krediEski: 480, oran: "Auto", oranlar: O_SEEDANCE, coz: "1080p", cozler: ["720p", "1080p", "4K"],
    sure: 15, sureler: [4, 8, 12, 15], bitrate: "Yüksek",
  },
  {
    ad: "Seedance 2.0 Fast", aile: "Seedance", marka: "seedance",
    cipler: ["ekle", "mention", "model", "oran", "cozunurluk", "sure", "sayac", "bitrate", "ses"],
    kutular: [],
    kredi: 53, oran: "Auto", oranlar: O_SEEDANCE, coz: "720p", cozler: ["720p", "1080p"],
    sure: 15, sureler: [4, 8, 12, 15], bitrate: "Yüksek",
  },
  {
    ad: "Seedance 2.0 Mini", aile: "Seedance", marka: "seedance",
    cipler: ["ekle", "mention", "model", "oran", "cozunurluk", "sure", "sayac", "ses"],
    kutular: [],
    kredi: 38, oran: "Auto", oranlar: O_SEEDANCE, coz: "720p", cozler: ["720p"],
    sure: 15, sureler: [4, 8, 12, 15],
  },
  {
    ad: "Seedance 1.5 Pro", aile: "Seedance", marka: "seedance",
    cipler: ["ekle", "model", "oran", "cozunurluk", "sure", "sabitLens", "ses"],
    kutular: ["baslangic", "bitis"],
    kredi: 10, oran: "Auto", oranlar: O_SEEDANCE, coz: "720p", cozler: ["720p", "1080p"],
    sure: 8, sureler: [4, 8, 12], ses: true,
  },
  {
    ad: "Seedance Pro", aile: "Seedance", marka: "seedance",
    cipler: ["ekle", "model", "cozunurluk", "sure", "cokCekim", "iyilestir"],
    kutular: ["baslangic", "preset"],
    kredi: 8, coz: "720p", cozler: ["720p", "1080p"], sure: 5, sureler: [5, 10],
    cokCekimTipi: "dropdown", cokCekimDeger: "Kapalı", iyilestir: true,
  },
  {
    ad: "Seedance Pro Fast", aile: "Seedance", marka: "seedance",
    cipler: ["ekle", "model", "cozunurluk", "sure", "cokCekim", "iyilestir"],
    kutular: ["baslangic", "preset"],
    kredi: 4, coz: "720p", cozler: ["720p", "1080p"], sure: 5, sureler: [5, 10],
    cokCekimTipi: "dropdown", cokCekimDeger: "Kapalı", iyilestir: true,
  },

  /* ═══ Grok Imagine ═══ */
  {
    ad: "Grok Imagine", aile: "Grok Imagine", marka: "grok",
    cipler: ["ekle", "model", "oran", "cozunurluk", "sure"],
    kutular: ["baslangic"],
    kredi: 23, oran: "Auto", oranlar: O_GROK, coz: "720p", cozler: ["720p"],
    sure: 15, sureler: [1, 5, 10, 15], uyariBandi: true,
  },
  {
    ad: "Grok Imagine 1.5", aile: "Grok Imagine", marka: "grok",
    cipler: ["ekle", "model", "cozunurluk", "sure"],
    kutular: ["baslangic"],
    kredi: 67.5, coz: "720p", cozler: ["720p"], sure: 15, sureler: [1, 5, 10, 15], uyariBandi: true,
  },
  {
    ad: "Grok Imagine Edit", aile: "Grok Imagine", marka: "grok",
    cipler: ["model", "cozunurluk"],
    kutular: ["videoRef"],
    kredi: 6, coz: "720p", cozler: ["720p"], uyariBandi: true,
  },

  /* ═══ HappyHorse ═══ */
  {
    ad: "HappyHorse", aile: "HappyHorse", marka: "happyhorse",
    cipler: ["ekle", "model", "oran", "cozunurluk", "sure", "sayac"],
    kutular: ["baslangic"],
    kredi: 54, krediEski: 96, oran: "16:9", oranlar: O_HAPPY, coz: "1080p", cozler: ["720p", "1080p"],
    sure: 12, sureler: [3, 5, 8, 12, 15],
  },
];

/* ══════════════════════════════════════════════════════════════════ */
/* GÖRSEL MODELLERİ — referans: modeller/gorsel/* (21 model, 82 ekran)  */
/* ══════════════════════════════════════════════════════════════════ */

// Görsel oran havuzları (her model farklı — referanstan birebir)
const G_SEEDANCE = ["1:1", "4:3", "3:4", "16:9", "9:16", "2:3", "3:2", "21:9"];
const G_S5PRO = ["1:1", "4:3", "3:4", "16:9", "21:9", "9:16", "2:3", "3:2"];
const G_FLUX = ["Auto", "1:1", "4:3", "16:9", "3:2", "2:3", "9:16", "3:4"];
const G_FLUXMAX = ["Auto", "1:1", "4:3", "16:9", "3:2", "2:3", "9:16", "3:4", "5:4", "21:9"];
const G_KONTEKST = ["Auto", "2:3", "4:5", "9:16", "1:1", "4:3", "16:9", "2:1", "3:4"];
const G_SINEMATIK = ["1:1", "3:4", "2:3", "9:16", "3:2", "4:3", "16:9", "21:9"];
const G_SOUL2 = ["9:16", "3:4", "2:3", "1:1", "4:3", "16:9", "3:2"];
const G_GPT = ["Auto", "1:1", "3:2", "2:3", "16:9", "9:16", "4:3", "3:4", "21:9"];
const G_GROK = ["Auto", "1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "2:1", "1:2"];
const G_KLINGO1 = ["Auto", "1:1", "4:3", "3:2", "16:9", "21:9", "3:4", "2:3", "9:16"];
const G_RECRAFT = ["1:1", "3:4", "4:3", "4:5", "5:4", "3:2", "2:3", "16:9", "9:16"];
const G_WAN = ["9:16", "3:4", "2:3", "1:1", "4:3", "16:9", "3:2"];
const G_ZIMAGE = ["1:1", "4:3", "3:4", "16:9", "9:16"];

export const GORSEL_MODELLERI: VideoModelSpec[] = [
  /* ═══ Sinematik modeller (görsel moduna özel grup) ═══ */
  {
    ad: "AI Kadro", aile: "Sinematik", marka: "vayra",
    cipler: ["model", "kalite", "sayac"], kutular: ["kadroKur"],
    kredi: 0.25, coz: "2K", cozler: ["1K", "2K", "4K"], adetMax: 10, adetVar: 2,
    yerTutucu: "Karakterini anlat",
  },
  {
    ad: "Sinematik Mekanlar", aile: "Sinematik", marka: "vayra",
    cipler: ["model", "kalite", "sayac"], kutular: [],
    kredi: 3, coz: "2K", cozler: ["1K", "2K", "4K"], adetMax: 10, adetVar: 2,
    yerTutucu: "Mekanını anlat", bedavaKota: "3.000 ücretsiz üretim kaldı",
  },
  {
    ad: "Sinematik Kameralar", aile: "Sinematik", marka: "vayra",
    cipler: ["ekle", "mention", "model", "oran", "kalite", "izgara", "sayac"],
    kutular: ["kameraKurulum"],
    kredi: 4, oran: "16:9", oranlar: G_SINEMATIK, coz: "2K", cozler: ["1K", "2K", "4K"],
    adetMax: 4, adetVar: 2, izgara: "1x1",
  },
  {
    ad: "Ruh Sinema", aile: "Sinematik", marka: "vayra",
    cipler: ["model", "oran", "kalite", "sayac"], kutular: [],
    kredi: 0.25, oran: "16:9", oranlar: G_SINEMATIK, coz: "2K", cozler: ["1K", "2K", "4K"],
    adetMax: 4, adetVar: 2,
  },

  /* ═══ Öne çıkan görsel modelleri ═══ */
  {
    ad: "Ruh 2.0", aile: "Ruh", marka: "vayra",
    cipler: ["ekle", "model", "oran", "kalite", "sayac", "iyilestir", "renkAktarim"],
    kutular: ["gKarakter", "gStil"],
    kredi: 0, oran: "3:4", oranlar: G_SOUL2, coz: "2k", cozler: ["1.5k", "2k"],
    adetMax: 4, adetVar: 4, iyilestir: true, bedavaKota: "3000 ücretsiz üretim kaldı",
  },
  {
    ad: "GPT Image 2", aile: "OpenAI", marka: "openai",
    cipler: ["ekle", "mention", "model", "oran", "kalite", "cozunurluk", "sayac", "sinirsiz"],
    kutular: [],
    kredi: 7, oran: "Auto", oranlar: G_GPT, coz: "2K", cozler: ["1K", "2K", "4K"],
    kalite: "Yüksek", kaliteler: ["Düşük", "Orta", "Yüksek"], adetMax: 4, adetVar: 1,
  },
  {
    ad: "Grok Imagine Görsel", aile: "Grok Imagine", marka: "grok",
    cipler: ["ekle", "model", "oran", "kalite", "sayac", "gorselKip"], kutular: [],
    kredi: 1, oran: "Auto", oranlar: G_GROK, coz: "1K", cozler: ["1K", "2K"],
    adetMax: 4, adetVar: 1, gorselKip: "Standart",
  },

  /* ═══ Seedream ═══ */
  {
    ad: "Seedream 5.0 Pro", aile: "Seedream", marka: "seedance",
    cipler: ["ekle", "mention", "model", "oran", "kalite", "sayac"], kutular: [],
    kredi: 3, oran: "3:4", oranlar: G_S5PRO, coz: "2K", cozler: ["1K", "2K", "4K"], adetMax: 4, adetVar: 1,
  },
  {
    ad: "Seedream 5.0 lite", aile: "Seedream", marka: "seedance",
    cipler: ["ekle", "mention", "model", "oran", "kalite", "sayac", "sinirsiz"], kutular: [],
    kredi: 1, oran: "1:1", oranlar: G_SEEDANCE, coz: "4K", cozler: ["1K", "2K", "4K"], adetMax: 4, adetVar: 1,
  },
  {
    ad: "Seedream 4.5", aile: "Seedream", marka: "seedance",
    cipler: ["ekle", "mention", "model", "oran", "kalite", "sayac", "sinirsiz"], kutular: [],
    kredi: 1, oran: "16:9", oranlar: G_SEEDANCE, coz: "4K", cozler: ["1K", "2K", "4K"], adetMax: 4, adetVar: 1,
  },
  {
    ad: "Seedream 4.0", aile: "Seedream", marka: "seedance",
    cipler: ["ekle", "model", "oran", "kalite", "sayac"], kutular: [],
    kredi: 1, oran: "3:4", oranlar: G_SEEDANCE,
    kalite: "Temel", kaliteler: ["Temel", "Yüksek"], adetMax: 4, adetVar: 1,
  },

  /* ═══ FLUX ═══ */
  {
    ad: "FLUX.2 Pro", aile: "FLUX", marka: "flux",
    cipler: ["ekle", "model", "oran", "kalite", "sayac", "sinirsiz"], kutular: [],
    kredi: 1, oran: "3:4", oranlar: G_FLUX, coz: "1K", cozler: ["1K", "2K"], adetMax: 4, adetVar: 1,
  },
  {
    ad: "FLUX.2 Flex", aile: "FLUX", marka: "flux",
    cipler: ["ekle", "model", "oran", "kalite", "sayac", "cfgAdim"], kutular: [],
    kredi: 3, oran: "3:4", oranlar: G_FLUX, coz: "1K", cozler: ["1K", "2K"],
    adetMax: 4, adetVar: 1, cfg: 5, adim: 30,
  },
  {
    ad: "FLUX.2 MAX", aile: "FLUX", marka: "flux",
    cipler: ["ekle", "model", "oran", "kalite", "sayac"], kutular: [],
    kredi: 4, oran: "3:4", oranlar: G_FLUXMAX, coz: "1K", cozler: ["1K", "2K"], adetMax: 4, adetVar: 1,
  },
  {
    ad: "Flux Kontext Max", aile: "FLUX", marka: "flux",
    cipler: ["ekle", "model", "oran", "sayac", "iyilestir"], kutular: [],
    kredi: 1.5, oran: "3:4", oranlar: G_KONTEKST, adetMax: 4, adetVar: 1, iyilestir: true,
  },

  /* ═══ Diğerleri ═══ */
  {
    ad: "Kling O1 Görsel", aile: "Kling", marka: "kling",
    cipler: ["ekle", "model", "oran", "kalite", "sayac", "sinirsiz"], kutular: [],
    kredi: 0.5, oran: "3:4", oranlar: G_KLINGO1, coz: "1K", cozler: ["1K", "2K"], adetMax: 4, adetVar: 1,
  },
  {
    ad: "Çoklu Referans", aile: "Çoklu Referans", marka: "coklu",
    cipler: ["ekle", "model", "oran", "sayac", "iyilestir"], kutular: [],
    kredi: 1.5, oran: "3:4", oranlar: G_KONTEKST, adetMax: 4, adetVar: 1, iyilestir: true,
  },
  {
    ad: "Recraft V4.1", aile: "Recraft", marka: "recraft",
    cipler: ["model", "oran", "kalite", "sayac", "vektor", "renkAktarim"], kutular: [],
    kredi: 1.25, oran: "1:1", oranlar: G_RECRAFT,
    kalite: "Standart", kaliteler: ["Standart", "Pro"], adetMax: 4, adetVar: 1,
  },
  {
    ad: "Recraft V4.1 Utility", aile: "Recraft", marka: "recraft",
    cipler: ["model", "oran", "kalite", "sayac", "vektor", "renkAktarim"], kutular: [],
    kredi: 1.25, oran: "1:1", oranlar: G_RECRAFT,
    kalite: "Standart", kaliteler: ["Standart", "Pro"], adetMax: 4, adetVar: 1,
  },
  {
    ad: "WAN 2.2 Görsel", aile: "Wan", marka: "wan",
    cipler: ["model", "oran", "iyilestir"], kutular: [],
    kredi: 1, oran: "3:4", oranlar: G_WAN, iyilestir: true,
  },
  {
    ad: "Z-Image", aile: "Z-Image", marka: "zimage",
    cipler: ["model", "oran", "sayac"], kutular: [],
    kredi: 0.15, oran: "3:4", oranlar: G_ZIMAGE, adetMax: 4, adetVar: 1,
  },
];

/* ------------------------------------------------------------------ */
/* Model seçici grupları — referans: video-model-secici/*              */
/* ------------------------------------------------------------------ */

/** "Sinematik modeller" — Sinema Stüdyosu sürümleri (açıklamalı, meta çipsiz). */
export const SINEMATIK_MODELLER: { ad: string; ozet: string; rozet?: "Yeni" }[] = [
  { ad: "Sinema Stüdyo 3.5", ozet: "Kamera seçimi, stil ön ayarları ve yapay zekâ yönetmen", rozet: "Yeni" },
  { ad: "Sinema Stüdyo 3.0", ozet: "Gelişmiş kamera ve hız rampası kontrolü" },
  { ad: "Sinema Stüdyo 2.5", ozet: "Başlangıç karesiyle kamera hareketleri" },
];

/** "Öne çıkan modeller" — düz liste, meta çipli (referans sırası birebir). */
export const ONE_CIKAN_MODELLER: { ad: string; rozetler?: ("Yeni" | "Özel" | "Sınırsız")[] }[] = [
  { ad: "Seedance 2.0" },
  { ad: "Seedance 2.0 Mini", rozetler: ["Yeni", "Özel"] },
  { ad: "Seedance 2.0 Fast" },
  { ad: "Gemini Omni Flash", rozetler: ["Yeni"] },
  { ad: "Kling 3.0", rozetler: ["Sınırsız"] },
  { ad: "Kling 3.0 Turbo", rozetler: ["Yeni"] },
  { ad: "Kling 3.0 Motion Control" },
  { ad: "Grok Imagine 1.5", rozetler: ["Yeni"] },
  { ad: "Google Veo 3.1 Lite", rozetler: ["Yeni"] },
];

/** "Tüm modeller" — aile satırları, hover'da varyant flyout'u. */
export const MODEL_AILE_SIRASI: { ad: string; ozet: string; rozet?: "Sınırsız" }[] = [
  { ad: "Minimax Hailuo", ozet: "Yüksek dinamik, VFX'e hazır, en hızlı ve en ekonomik" },
  { ad: "Kling", ozet: "Gelişmiş video kontrolüyle kusursuz hareket", rozet: "Sınırsız" },
  { ad: "OpenAI Sora 2", ozet: "Ses üretimli çok çekimli video" },
  { ad: "Google Veo", ozet: "Ses kontrolüyle hassas video" },
  { ad: "Gemini Omni Flash", ozet: "Google — hızlı, akıllı üretim" },
  { ad: "Vayra", ozet: "Gelişmiş kamera kontrolleri ve efekt ön ayarları" },
  { ad: "Wan", ozet: "Kamera kontrollü, sesli, daha özgür video" },
  { ad: "Seedance", ozet: "Sinematik, çok çekimli video üretimi" },
  { ad: "Grok Imagine", ozet: "Gelişmiş video kontrolüyle kusursuz hareket" },
  { ad: "HappyHorse", ozet: "Yüksek dinamik, VFX'e hazır" },
];

/* ------------------------------------------------------------------ */
/* Yardımcılar                                                         */
/* ------------------------------------------------------------------ */

/** Video + görsel modellerinin tamamı (arama/çözümleme için tek havuz). */
export const TUM_MODELLER: VideoModelSpec[] = [...VIDEO_MODELLERI, ...GORSEL_MODELLERI];

export function modelBul(ad: string): VideoModelSpec | undefined {
  return TUM_MODELLER.find((m) => m.ad === ad);
}

/** Aile varyantları — kip'e göre doğru havuzdan (görsel/video ayrı listeler). */
export function aileVaryantlari(aile: string, kip: "video" | "gorsel" = "video"): VideoModelSpec[] {
  const havuz = kip === "gorsel" ? GORSEL_MODELLERI : VIDEO_MODELLERI;
  return havuz.filter((m) => m.aile === aile);
}

/* ── Görsel modu seçici grupları (referans: gorsel-model-secici/*) ── */
export const GORSEL_SINEMATIK = ["AI Kadro", "Sinematik Mekanlar", "Ruh Sinema", "Sinematik Kameralar"];
export const GORSEL_ONE_CIKAN: { ad: string; rozetler?: ("Yeni" | "Sınırsız")[] }[] = [
  { ad: "Ruh 2.0" },
  { ad: "Ruh Sinema" },
  { ad: "GPT Image 2", rozetler: ["Yeni", "Sınırsız"] },
  { ad: "Seedream 5.0 Pro", rozetler: ["Yeni"] },
  { ad: "Seedream 5.0 lite", rozetler: ["Sınırsız"] },
  { ad: "Seedream 4.5", rozetler: ["Sınırsız"] },
  { ad: "Recraft V4.1", rozetler: ["Yeni"] },
];
/** "Tüm modeller" — görsel modunda AİLE DEĞİL, düz liste (referans birebir). */
export const GORSEL_TUM = [
  "Ruh 2.0", "Ruh Sinema", "GPT Image 2", "Seedream 5.0 Pro", "Seedream 5.0 lite",
  "Seedream 4.5", "Seedream 4.0", "Grok Imagine Görsel", "Recraft V4.1", "Recraft V4.1 Utility",
  "Z-Image", "Kling O1 Görsel", "FLUX.2 Pro", "FLUX.2 Flex", "FLUX.2 MAX",
  "Flux Kontext Max", "Çoklu Referans", "WAN 2.2 Görsel",
];
/** Model açıklamaları — görsel seçicide alt satır (referans birebir). */
export const MODEL_OZET: Record<string, string> = {
  "AI Kadro": "İfadeli yüzler ve ayrıntılı stil",
  "Sinematik Mekanlar": "Sinematik ışıklandırmayla zengin ortamlar",
  "Ruh Sinema": "Sinematik görsel üretimi",
  "Sinematik Kameralar": "Kamera kontrolleriyle görsel üretimi",
  "Ruh 2.0": "Yeni nesil ultra gerçekçi moda görselleri",
  "GPT Image 2": "Neredeyse kusursuz metin işlemeyle 4K görseller",
  "Seedream 5.0 Pro": "Akıllı görsel muhakemeyle mantıksal tutarlı görseller",
  "Seedream 5.0 lite": "Akıllı görsel muhakeme",
  "Seedream 4.5": "Yeni nesil 4K görsel düzenleme modeli",
  "Seedream 4.0": "Gelişmiş görsel düzenleme modeli",
  "Grok Imagine Görsel": "xAI'den çok yönlü görsel stilleri",
  "Recraft V4.1": "Fotogerçekçi ve ifadeli görsel üretimi",
  "Recraft V4.1 Utility": "Düz, eşit ışıklı sade sahneler",
  "Z-Image": "Anında gerçekçi portreler",
  "Kling O1 Görsel": "Kling'in fotogerçekçi görsel modeli",
  "FLUX.2 Pro": "Hız için optimize edilmiş ayrıntı",
  "FLUX.2 Flex": "Hassas düzenleme",
  "FLUX.2 MAX": "Keskin metin, en yüksek ayrıntı",
  "Flux Kontext Max": "Hassas düzenleme",
  "Çoklu Referans": "Tek seferde çoklu düzenleme",
  "WAN 2.2 Görsel": "Yüksek sadakatli sinematik görseller",
};

/** Modelin belirli bir çipi var mı? */
export function cipVar(m: VideoModelSpec | undefined, c: CipTuru): boolean {
  return !!m?.cipler.includes(c);
}

/**
 * O anki duruma göre gösterilecek kutular.
 * Mode=Ingredients/Elements → kare kutuları gizlenir (referans birebir).
 * Multi-shot=Özel → süre çipi gizlenir (kutular etkilenmez).
 */
export function gorunenKutular(m: VideoModelSpec | undefined, mod: string | undefined): KutuTuru[] {
  if (!m) return [];
  if (mod && m.modKutuGizle?.includes(mod)) {
    return m.kutular.filter((k) => k !== "baslangic" && k !== "bitis");
  }
  return m.kutular;
}

/** Çok çekim "Özel" iken süre çipi kaybolur (Seedance Pro / Kling 3.0 referansı). */
export function sureGorunur(m: VideoModelSpec | undefined, cokCekim: string | undefined): boolean {
  if (!cipVar(m, "sure")) return false;
  return cokCekim !== "Özel";
}

/** Rozet etiketleri — model seçicide lime/mavi pill olarak basılır. */
export const ROZET_RENK: Record<string, string> = {
  "Yeni": "lime",
  "Özel": "lime",
  "Premium": "lime",
  "Sınırsız": "mavi",
};
