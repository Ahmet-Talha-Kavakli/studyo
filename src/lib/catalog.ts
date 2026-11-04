/* ============================================================
   VAYRA — Merkezi Katalog
   Tüm modeller, studiolar, uygulamalar, planlar burada.
   Landing + dashboard bu tek kaynaktan beslenir.
   ============================================================ */

export type ModelTur = "video" | "gorsel" | "3d" | "ses" | "muzik";

/**
 * Model kısıtları — Higgsfield birebir: her model kendi süre/çözünürlük/oran
 * seçeneklerini ve ses/unlimited desteğini getirir. Composer bunlara göre çipleri
 * DEĞİŞTİRİR (ör. Veo süre {8sn} sabit, Seedance {5,10,15sn} + Unlimited).
 * Alan yoksa composer'ın kendi varsayılan listesi kullanılır.
 */
export interface ModelKisit {
  /** Video süre seçenekleri (ör. ["5sn","10sn"]). Tek eleman = sabit. */
  sureler?: string[];
  /** Çözünürlük/kalite seçenekleri (ör. ["720p","1080p","4K"]). */
  cozunurlukler?: string[];
  /** En-boy oran seçenekleri. Verilmezse tam liste. */
  oranlar?: string[];
  /** Adet/batch üst sınırı (görsel). */
  maksAdet?: number;
  /** Senkron ses destekliyor mu (video). */
  ses?: boolean;
  /** "Unlimited mode" toggle'ı destekliyor mu (Seedance vb.). */
  sinirsizMod?: boolean;
  /** Saniye başına kredi (kalite fiyatlandırması, motion-control vb.). */
  krediSn?: number;
}

export interface AIModel {
  id: string;
  ad: string;
  saglayici: string;
  tur: ModelTur;
  aciklama: string;
  kredi: number; // üretim başına kredi
  rozet?: "Yeni" | "Pro" | "Hızlı" | "Vayra";
  yetenekler: string[];
  /** Modele özel dinamik kısıtlar (Higgsfield birebir). */
  kisit?: ModelKisit;
}

export const MODELLER: AIModel[] = [
  // ---- VİDEO ---- (kısıtlar Higgsfield birebir)
  { id: "seedance-2", ad: "Seedance 2.0", saglayici: "ByteDance", tur: "video", kredi: 42, rozet: "Pro",
    aciklama: "Senkron sesli çok çekimli filmler, 9 referansa kadar.", yetenekler: ["Çok çekim", "Senkron ses", "9 referans"],
    kisit: { sureler: ["5sn", "10sn", "15sn"], cozunurlukler: ["720p", "1080p"], oranlar: ["Auto", "16:9", "9:16", "1:1", "4:3", "3:4"], ses: true, sinirsizMod: true } },
  { id: "veo-31", ad: "Veo 3.1", saglayici: "Google", tur: "video", kredi: 55, rozet: "Pro",
    aciklama: "Atmosferik dış mekan sahneleri, küresel aydınlatma.", yetenekler: ["Sinematik", "Dış mekan", "1080p"],
    kisit: { sureler: ["8sn"], cozunurlukler: ["720p", "1080p"], oranlar: ["Auto", "16:9", "9:16"], ses: true } },
  { id: "kling-3", ad: "Kling 3.0", saglayici: "Kuaishou", tur: "video", kredi: 48,
    aciklama: "4K karakter odaklı hikâyeler, 6 kesime kadar storyboard.", yetenekler: ["4K", "Storyboard", "Karakter"],
    kisit: { sureler: ["5sn", "10sn"], cozunurlukler: ["1080p", "4K"], oranlar: ["16:9", "9:16", "1:1"], ses: true } },
  { id: "sora-2", ad: "Sora 2", saglayici: "OpenAI", tur: "video", kredi: 60, rozet: "Yeni",
    aciklama: "Fizik tutarlı, uzun süreli gerçekçi video üretimi.", yetenekler: ["Fizik", "Uzun süre", "Gerçekçi"],
    kisit: { sureler: ["10sn", "15sn", "20sn"], cozunurlukler: ["720p", "1080p"], oranlar: ["16:9", "9:16", "1:1"], ses: true } },
  { id: "wan-27", ad: "WAN 2.7", saglayici: "Alibaba", tur: "video", kredi: 38,
    aciklama: "Video referanslı stil transferi, yeniden çekim akışları.", yetenekler: ["Stil transfer", "Video ref"],
    kisit: { sureler: ["5sn", "10sn"], cozunurlukler: ["480p", "720p", "1080p"], oranlar: ["16:9", "9:16", "1:1"], ses: true } },
  { id: "hailuo-23", ad: "MiniMax Hailuo 2.3", saglayici: "MiniMax", tur: "video", kredi: 20, rozet: "Hızlı",
    aciklama: "Hızlı kısa-form ve stilize içerik, Fast/Standard mod.", yetenekler: ["Hızlı", "Kısa form", "Stilize"],
    kisit: { sureler: ["6sn", "10sn"], cozunurlukler: ["720p", "1080p"], oranlar: ["16:9", "9:16"], ses: false } },

  // ---- GÖRSEL ----
  { id: "ruh-2", ad: "Ruh 2.0", saglayici: "Vayra", tur: "gorsel", kredi: 4, rozet: "Vayra",
    aciklama: "Kültür-yerli moda & editorial foto modeli. Jenerik stok değil.", yetenekler: ["Editorial", "Moda", "Kimlik"],
    kisit: { cozunurlukler: ["1K", "2K"], oranlar: ["1:1", "3:4", "4:3", "2:3", "3:2", "9:16", "16:9"], maksAdet: 4 } },
  { id: "ruh-sinema", ad: "Ruh Sinema", saglayici: "Vayra", tur: "gorsel", kredi: 6, rozet: "Vayra",
    aciklama: "Sinematik kalite görseller, zengin doku ve mood.", yetenekler: ["Sinematik", "Doku", "Mood"],
    kisit: { cozunurlukler: ["1K", "2K", "4K"], oranlar: ["1:1", "3:4", "4:3", "16:9", "21:9"], maksAdet: 4 } },
  { id: "nano-banana-pro", ad: "Nano Banana Pro", saglayici: "Google", tur: "gorsel", kredi: 5, rozet: "Pro",
    aciklama: "Yüksek sadakatli, metin işleyebilen üstün görsel modeli.", yetenekler: ["Metin", "Yüksek çözünürlük"],
    kisit: { cozunurlukler: ["2K", "4K"], oranlar: ["1:1", "3:4", "4:3", "2:3", "3:2", "9:16", "16:9", "21:9"], maksAdet: 4 } },
  { id: "seedream-5", ad: "Seedream 5.0 Pro", saglayici: "ByteDance", tur: "gorsel", kredi: 7, rozet: "Pro",
    aciklama: "ByteDance'in üst düzey akıl yürütmeli görsel modeli.", yetenekler: ["Akıl yürütme", "Kompozisyon"],
    kisit: { cozunurlukler: ["1K", "2K", "4K"], oranlar: ["1:1", "3:4", "4:3", "2:3", "3:2", "9:16", "16:9", "21:9"], maksAdet: 4 } },
  { id: "flux-2", ad: "Flux 2", saglayici: "Black Forest Labs", tur: "gorsel", kredi: 5,
    aciklama: "Keskin detay ve tutarlı anatomi.", yetenekler: ["Detay", "Anatomi"],
    kisit: { cozunurlukler: ["1K", "2K"], oranlar: ["1:1", "3:4", "4:3", "9:16", "16:9"], maksAdet: 4 } },
  { id: "gpt-image-2", ad: "GPT Image 2", saglayici: "OpenAI", tur: "gorsel", kredi: 6, rozet: "Yeni",
    aciklama: "Talimat takibi güçlü, kompozit ve metin başarılı.", yetenekler: ["Talimat", "Kompozit"],
    kisit: { cozunurlukler: ["1K", "2K", "4K"], oranlar: ["1:1", "3:2", "2:3"], maksAdet: 2 } },

  // ---- 3D (Vayra 3D — Meshy motoru üstüne) ----
  { id: "meshy-metin3d", ad: "Vayra 3D · Metin", saglayici: "Vayra", tur: "3d", kredi: 25, rozet: "Vayra",
    aciklama: "Metinden dokulu, üretime hazır 3D model (GLB/FBX).", yetenekler: ["Metin→3D", "PBR doku", "Rig'e hazır"] },
  { id: "meshy-gorsel3d", ad: "Vayra 3D · Görsel", saglayici: "Vayra", tur: "3d", kredi: 30, rozet: "Vayra",
    aciklama: "Tek görselden 3D mesh çıkarımı.", yetenekler: ["Görsel→3D", "Otomatik topoloji"] },
  { id: "meshy-doku", ad: "Vayra 3D · Dokulama", saglayici: "Vayra", tur: "3d", kredi: 15,
    aciklama: "Mevcut mesh'e AI ile PBR doku üret.", yetenekler: ["Retexture", "PBR"] },
  { id: "meshy-animasyon", ad: "Vayra 3D · Rig & Animasyon", saglayici: "Vayra", tur: "3d", kredi: 20, rozet: "Yeni",
    aciklama: "3D karakterini otomatik rig'le ve hazır animasyonlarla canlandır.", yetenekler: ["Auto-rig", "Animasyon", "Karakter"] },

  // ---- MÜZİK / ŞARKI (Vayra Muse — Suno/Udio rakibi) ----
  { id: "vayra-muse-2", ad: "Vayra Muse 2", saglayici: "Vayra", tur: "muzik", kredi: 20, rozet: "Yeni",
    aciklama: "Sözlü, vokalli tam şarkı üret — istem veya kendi sözlerinden.", yetenekler: ["Şarkı", "Vokal", "20+ tür"] },
  { id: "vayra-muse-lite", ad: "Vayra Muse Lite", saglayici: "Vayra", tur: "muzik", kredi: 8,
    aciklama: "Hızlı müzik taslağı — düşük kredi.", yetenekler: ["Hızlı", "Taslak"] },
  { id: "vayra-instrumental", ad: "Vayra Enstrümantal", saglayici: "Vayra", tur: "muzik", kredi: 12,
    aciklama: "Yalnızca enstrümantal parça — vokalsiz.", yetenekler: ["Enstrümantal", "Beat", "Score"] },

  // ---- SES (FARK — ElevenLabs / Vali) ----
  { id: "eleven-tts", ad: "ElevenLabs TTS", saglayici: "ElevenLabs", tur: "ses", kredi: 3, rozet: "Vayra",
    aciklama: "32 dilde ultra-gerçekçi metin okuma.", yetenekler: ["32 dil", "Duygu", "Klon"] },
  { id: "eleven-klon", ad: "Ses Klonu", saglayici: "ElevenLabs", tur: "ses", kredi: 10,
    aciklama: "Kısa örnekten kendi sesini klonla.", yetenekler: ["Ses klonu", "60sn örnek"] },
  { id: "vali-muzik", ad: "Vali Müzik", saglayici: "Vali", tur: "ses", kredi: 8, rozet: "Yeni",
    aciklama: "Metinden telifsiz müzik ve jingle üret.", yetenekler: ["Müzik", "Jingle", "Telifsiz"] },
  { id: "vali-sfx", ad: "Vali SFX", saglayici: "Vali", tur: "ses", kredi: 2,
    aciklama: "Metinden ses efekti üret.", yetenekler: ["SFX", "Foley"] },
];

export interface Studyo {
  id: string;
  ad: string;
  ikon: string;
  href: string;
  ozet: string;
  renk: string;
  fark?: boolean;
}

export const STUDYOLAR: Studyo[] = [
  { id: "sinema", ad: "Sinema Stüdyosu", ikon: "clapperboard", href: "/panel/sinema",
    ozet: "AI Yönetmen fikri çekimlere böler. 70+ kamera preset, timeline düzenleme.",
    renk: "from-vayra-500 to-fuchsia-500" },
  { id: "pazarlama", ad: "Pazarlama Stüdyosu", ikon: "megaphone", href: "/panel/pazarlama",
    ozet: "Ürün URL'inden yayına hazır reklam. UGC, avatar, hook, seslendirme.",
    renk: "from-amber-glow to-orange-500" },
  { id: "3d", ad: "3D Stüdyo", ikon: "box", href: "/panel/3d", fark: true,
    ozet: "Meshy ile metin/görselden üretime hazır 3D model. PBR doku, GLB çıktı.",
    renk: "from-cyan-glow to-blue-500" },
  { id: "ses", ad: "Ses Stüdyosu", ikon: "audio-lines", href: "/panel/ses", fark: true,
    ozet: "ElevenLabs & Vali ile seslendirme, ses klonu, müzik ve SFX.",
    renk: "from-emerald-400 to-teal-500" },
  { id: "karakter", ad: "Karakterler", ikon: "user-round", href: "/panel/karakter",
    ozet: "Karakterini eğit, tüm sahnelerde aynı yüz tutarlılığı.",
    renk: "from-rose-400 to-vayra-500" },
];

export interface Uygulama {
  id: string;
  ad: string;
  ozet: string;
  kategori: string;
  ikon: string;
  kredi: number;
  cikti: "gorsel" | "video" | "ses" | "3d";
  ciftKare?: boolean; // Başlangıç+Bitiş karesi gerektiren araçlar (Geçişler gibi) — Higgsfield "Start & End Frame"
}

export const UYGULAMALAR: Uygulama[] = [
  // Profesyonel
  { id: "virality", ad: "Viral Tahmin", ozet: "Paylaşmadan önce hook'unun viral skorunu ölç.", kategori: "Profesyonel", ikon: "trending-up", kredi: 2, cikti: "gorsel" },
  { id: "expand", ad: "Görsel Genişlet", ozet: "Görseli kenarlarının ötesine büyüt.", kategori: "Profesyonel", ikon: "maximize", kredi: 3, cikti: "gorsel" },
  { id: "angles", ad: "Açılar 2.0", ozet: "Herhangi bir görsele saniyeler içinde yeni açı.", kategori: "Profesyonel", ikon: "rotate-3d", kredi: 4, cikti: "gorsel" },
  { id: "shots", ad: "Çekimler", ozet: "Tek görselden 9 benzersiz çekim.", kategori: "Profesyonel", ikon: "grid-3x3", kredi: 6, cikti: "gorsel" },
  { id: "transitions", ad: "Geçişler", ozet: "Çekimler arası kusursuz geçişler.", kategori: "Profesyonel", ikon: "shuffle", kredi: 8, cikti: "video", ciftKare: true },
  // Geliştir & Stil
  { id: "skin", ad: "Cilt İyileştirici", ozet: "Doğal, gerçekçi cilt dokuları.", kategori: "Geliştir & Stil", ikon: "sparkles", kredi: 3, cikti: "gorsel" },
  { id: "stylist", ad: "AI Stilist", ozet: "Sanal deneme kabini — her şeyi anında dene.", kategori: "Geliştir & Stil", ikon: "shirt", kredi: 4, cikti: "gorsel" },
  { id: "relight", ad: "Yeniden Işıklandır", ozet: "Işık konumu, rengi ve parlaklığını ayarla.", kategori: "Geliştir & Stil", ikon: "sun", kredi: 4, cikti: "gorsel" },
  { id: "outfit", ad: "Kıyafet Değiştir", ozet: "Tek fotoğrafla herhangi bir kıyafeti dene.", kategori: "Geliştir & Stil", ikon: "shirt", kredi: 4, cikti: "gorsel" },
  { id: "stylesnap", ad: "Stil Anı", ozet: "Anında stil varyasyonlarıyla görünümünü değiştir.", kategori: "Geliştir & Stil", ikon: "wand-2", kredi: 3, cikti: "gorsel" },
  // Yüz & Kimlik
  { id: "faceswap", ad: "Yüz Değiştir", ozet: "Fotoğraflar için en iyi anlık yüz değiştirme.", kategori: "Yüz & Kimlik", ikon: "user-round", kredi: 3, cikti: "gorsel" },
  { id: "headshot", ad: "Vesikalık Üretici", ozet: "Saniyeler içinde stüdyo kalitesinde portre.", kategori: "Yüz & Kimlik", ikon: "id-card", kredi: 5, cikti: "gorsel" },
  { id: "charswap", ad: "Karakter Değiştir 2.0", ozet: "Görseldeki karakteri tek tıkla değiştir.", kategori: "Yüz & Kimlik", ikon: "users", kredi: 4, cikti: "gorsel" },
  { id: "recast", ad: "Recast", ozet: "Herhangi bir videoda karakter değişimi.", kategori: "Yüz & Kimlik", ikon: "clapperboard", kredi: 12, cikti: "video" },
  { id: "vfaceswap", ad: "Video Yüz Değiştir", ozet: "Videolar için sınıfının en iyisi yüz değiştirme.", kategori: "Yüz & Kimlik", ikon: "video", kredi: 10, cikti: "video" },
  // Video Düzenleme
  { id: "clipcut", ad: "ClipCut", ozet: "Tek selfie'yi anında kıyafet reel'ine çevir.", kategori: "Video Düzenleme", ikon: "scissors", kredi: 8, cikti: "video" },
  { id: "urbancuts", ad: "Urban Cuts", ozet: "Beat-senkron AI kıyafet videoları.", kategori: "Video Düzenleme", ikon: "music", kredi: 9, cikti: "video" },
  { id: "vbgremove", ad: "Video Arka Plan Sil", ozet: "Videolardan kare-mükemmel arka plan çıkar.", kategori: "Video Düzenleme", ikon: "eraser", kredi: 7, cikti: "video" },
  { id: "breakdown", ad: "Ayrıştır", ozet: "Görseli bileşenlerine böl.", kategori: "Video Düzenleme", ikon: "layers", kredi: 5, cikti: "gorsel" },
  // Reklam & Ürün
  { id: "clicktoad", ad: "Tıkla Reklam Ol", ozet: "Ürün linkini UGC ve profesyonel reklama çevir.", kategori: "Reklam & Ürün", ikon: "link", kredi: 15, cikti: "video" },
  { id: "billboard", ad: "Billboard Reklam", ozet: "Fotoğrafını devasa billboard'a taşı.", kategori: "Reklam & Ürün", ikon: "image", kredi: 6, cikti: "gorsel" },
  { id: "bullettime", ad: "Bullet Time", ozet: "Ürününün etrafında dinamik dönüş.", kategori: "Reklam & Ürün", ikon: "orbit", kredi: 12, cikti: "video" },
  { id: "truckad", ad: "Kamyon Reklam", ozet: "Markanı hareketli kamyon billboard'unda göster.", kategori: "Reklam & Ürün", ikon: "truck", kredi: 8, cikti: "video" },
  // Oyun & Karakter
  { id: "gamedump", ad: "Oyun Dünyası", ozet: "Kendini 12 ikonik oyun stiline dönüştür.", kategori: "Oyun & Karakter", ikon: "gamepad-2", kredi: 5, cikti: "gorsel" },
  { id: "plushies", ad: "Peluş", ozet: "Herhangi bir fotoğrafı sevimli peluşa çevir.", kategori: "Oyun & Karakter", ikon: "cat", kredi: 4, cikti: "gorsel" },
  { id: "simlife", ad: "Sim Hayat", ozet: "Kendini stilize yaşam simülasyonu karakterine çevir.", kategori: "Oyun & Karakter", ikon: "gamepad", kredi: 4, cikti: "gorsel" },
  // Video Düzenleme (ek)
  { id: "explainer", ad: "Açıklayıcı Video", ozet: "Herhangi bir konuyu altyazılı açıklayıcı videoya çevir (10 dk'ya kadar).", kategori: "Video Düzenleme", ikon: "graduation-cap", kredi: 20, cikti: "video" },
  { id: "upscale", ad: "Yükseltici (Upscale)", ozet: "Görsel ve videoyu 4K'ya çıkar (Topaz).", kategori: "Video Düzenleme", ikon: "arrow-up-narrow-wide", kredi: 6, cikti: "gorsel" },
  { id: "lipsync", ad: "Dudak Senkronu", ozet: "Sesi yüze senkronla, çok dilli çeviriyle.", kategori: "Yüz & Kimlik", ikon: "mic", kredi: 8, cikti: "video" },
  // Ekstra
  { id: "meme", ad: "Meme Üretici", ozet: "AI karakterlerle viral meme oluştur.", kategori: "Ekstra", ikon: "laugh", kredi: 2, cikti: "gorsel" },
  { id: "microbeasts", ad: "Mini Canlılar", ozet: "Kendini sevimli hayvanlarla çevrele.", kategori: "Ekstra", ikon: "bird", kredi: 3, cikti: "gorsel" },
  { id: "signboard", ad: "Tabela", ozet: "Kendini şık bir muralde gör.", kategori: "Ekstra", ikon: "signpost", kredi: 3, cikti: "gorsel" },
];

export const UYGULAMA_KATEGORILERI = [
  "Tümü", "Profesyonel", "Geliştir & Stil", "Yüz & Kimlik",
  "Video Düzenleme", "Reklam & Ürün", "Oyun & Karakter", "Ekstra",
];

export interface Plan {
  id: string;
  ad: string;
  fiyatUSD: number;
  fiyatTRY: number;
  kredi: number;
  populer?: boolean;
  rozet?: "populer" | "deger"; // MOST POPULAR (pembe) / BEST VALUE (mavi)
  yillikUSD?: number; // yıllık (aylık eşdeğer) fiyat — %30 indirimli
  ozet: string;
  ozellikler: string[];
  cta: string;
}

export const PLANLAR: Plan[] = [
  { id: "baslangic", ad: "Başlangıç", fiyatUSD: 15, fiyatTRY: 499, kredi: 200,
    ozet: "Keşfetmeye başlayanlar için.", cta: "Başla",
    ozellikler: ["200 kredi / ay", "Seçili modeller", "2 paralel video · 2 görsel", "Filigransız çıktı", "1080p'e kadar"] },
  { id: "arti", ad: "Artı", fiyatUSD: 49, yillikUSD: 39, fiyatTRY: 1299, kredi: 1000, populer: true, rozet: "populer",
    ozet: "Düzenli üretim yapan yaratıcılar için.", cta: "Artı'ya geç",
    ozellikler: ["1.000 kredi / ay", "Tüm modeller", "6 paralel video · 8 görsel", "3D & Ses stüdyosu", "Ruh ID (5 kimlik)", "Öncelikli kuyruk"] },
  { id: "ultra", ad: "Ultra", fiyatUSD: 129, yillikUSD: 99, fiyatTRY: 3299, kredi: 3000, rozet: "deger",
    ozet: "Stüdyolar ve yoğun kullanım için.", cta: "Ultra'ya geç",
    ozellikler: ["3.000 kredi (9.000'e kadar)", "En düşük kredi maliyeti (%60↓)", "8 paralel video · 8 görsel", "Sınırsız Ruh ID", "4K çıktı · Topaz upscale", "API & MCP erişimi"] },
  { id: "kurumsal", ad: "Kurumsal", fiyatUSD: 0, fiyatTRY: 0, kredi: 0,
    ozet: "Ekipler ve markalar için özel çözüm.", cta: "Bize ulaşın",
    ozellikler: ["Özel kredi havuzu", "SSO & ekip yönetimi", "Özel model eğitimi", "SLA & özel destek", "Marka güvenliği filtreleri"] },
];
