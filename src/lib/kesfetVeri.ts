/**
 * Keşfet (/panel) sayfası verisi — Higgsfield "Explore" birebir Türkçe.
 * 17 bölüm: hero kartlar, SC showcase, proje galeri, yarışma, model banner'ları,
 * masonry galeriler (Seedance/Presetler/GPT Image/Pazarlama/Soul), chip bulutu.
 * SSR güvenli: statik/deterministik veri.
 */

/* ── 2. Hero 3-kart — GERÇEK Seedance 2.0 video (1080p, 7sn, autoplay) ── */
export const HERO_KARTLAR = [
  /* `nokta`: kart altındaki tür göstergesi — kartın kendi gradyanıyla aynı
     aileden, böylece künye videoyla görsel olarak bağlanır.
     Eski `etiket` alanı KALDIRILDI: video ÜSTÜNDE basılan büyük yazıydı,
     alttaki başlıkla tekrar ediyor ve görüntüyü kapatıyordu. Başka hiçbir
     yerde okunmuyordu (arandı), ölü alan bırakmamak için silindi. */
  { ad: "Video", ozet: "Tek cümleden sinematik sahne: kamera hareketi, ışık ve kurgu dahil", href: "/panel/video", tohum: "kesfet-video", video: "/gercek/hero-video/hero-video.mp4", grad: "from-cyan-500/40 via-teal-600/20 to-emerald-800/10", nokta: "bg-cyan-400" },
  { ad: "Müzik", ozet: "Şarkı, beat ve sahne müziği — vokalli ya da enstrümantal", href: "/panel/muzik", tohum: "kesfet-muzik", video: "/gercek/hero-video/hero-muzik.mp4", grad: "from-fuchsia-500/40 via-purple-700/20 to-indigo-900/10", nokta: "bg-fuchsia-400" },
  { ad: "3D", ozet: "Karakter, obje ve sahneleri üret; indirip projende kullan", href: "/panel/3d", tohum: "kesfet-3d", video: "/gercek/hero-video/hero-3d.mp4", grad: "from-amber-400/35 via-orange-600/15 to-rose-900/10", nokta: "bg-amber-400" },
] as const;

/* ── 4. "Her projenin içini keşfet" — 8 topluluk projesi ──
   TAMAMEN YENİLENDİ (2026-08-04): eski 8 kartın hepsi aynı temaydı (moda
   editoryal · kadın portresi) — vitrin tek bir türü tanıtıyor gibi
   duruyordu. Yeni set 8 AYRI tür gösterir: mimari, hava fotoğrafı, ürün
   makro, sokak, bilim-kurgu, yemek, macera sporu, soyut akışkan.
   `prompt` alanı görselin gerçek üretim istemidir. */
export const PROJE_KESFET = [
  { gorsel: "/gercek/proje-kesfet/kesfet-01.webp", baslik: "Beton Katedral", yazar: "mimar.efe", prompt: "vast brutalist concrete cathedral interior, single shaft of god-ray light through a high oculus, dust motes, monumental scale, architectural photography" },
  { gorsel: "/gercek/proje-kesfet/kesfet-02.webp", baslik: "Buzul Nehri", yazar: "kuzey.drone", prompt: "aerial drone view of a turquoise glacial river braiding through black volcanic sand in Iceland, abstract natural patterns, top-down" },
  { gorsel: "/gercek/proje-kesfet/kesfet-03.webp", baslik: "Çark ve Yakut", yazar: "saat.atolyesi", prompt: "macro product shot of a mechanical wristwatch movement, exposed gears and ruby jewels, dramatic rim lighting on dark reflective surface, luxury advertising" },
  { gorsel: "/gercek/proje-kesfet/kesfet-04.webp", baslik: "Yağmurlu Ara Sokak", yazar: "gece.kadraj", prompt: "rain-soaked Tokyo alley at night, steam rising from a ramen stall, red paper lanterns, reflections on wet asphalt, moody street photography" },
  { gorsel: "/gercek/proje-kesfet/kesfet-05.webp", baslik: "Terk Edilmiş Gövde", yazar: "orbit.kurgu", prompt: "colossal derelict spaceship hull drifting above a ringed gas giant, cold starlight, hard sci-fi concept art, immense sense of scale" },
  { gorsel: "/gercek/proje-kesfet/kesfet-06.webp", baslik: "Akdeniz Sofrası", yazar: "sofra.gunlugu", prompt: "overhead flat lay of a rustic Mediterranean feast, grilled fish, olives, lemon, fresh herbs on weathered wood, warm natural window light, food editorial" },
  { gorsel: "/gercek/proje-kesfet/kesfet-07.webp", baslik: "Sırt Çizgisi", yazar: "zirve.kaan", prompt: "lone climber silhouetted on a knife-edge granite ridge at sunrise, sea of clouds below, epic adventure sports photography, tiny figure vast landscape" },
  { gorsel: "/gercek/proje-kesfet/kesfet-08.webp", baslik: "Mürekkep Çarpışması", yazar: "akiskan.lab", prompt: "swirling liquid ink in water, deep indigo and molten copper pigments colliding, high-speed macro capture, abstract fluid art on black" },
] as const;

/* ── 3. SC showcase — 6 ürün/model kartı ──
   logo: GERÇEK marka SVG'si (public/marka/*.svg, Simple Icons resmi brand asset).
   marka: sağlayıcının resmi marka rengi (logo karesi zemini). Vayra'nınkiler
   kendi logomuzla (lucide ikon + lime). */
export const SC_URUN_KARTLARI = [
  { ad: "Vayra Akademi", ozet: "Vayra'yı öğren ve üret", ikon: "BookOpen", marka: "#dafd55", href: "/panel/supercomputer/ayarlar/beceriler", rozet: "ÜCRETSİZ ÖĞREN", rozetTip: "lime" },
  { ad: "Nano Banana Pro", ozet: "Yüksek kaliteli görseller üret", logo: "/marka/googlegemini.svg", marka: "#8E75B2", href: "/panel/gorsel", rozet: "Görsel", rozetTip: "gri" },
  { ad: "Seedance 2.0", ozet: "Saniyeler içinde yüksek kaliteli videolar", logo: "/marka/bytedance.svg", marka: "#3C8CFF", href: "/panel/video", rozet: "Video", rozetTip: "gri" },
  { ad: "MCP & CLI", ozet: "Claude'u yaratıcı bir motora dönüştür", logo: "/marka/claude.svg", marka: "#D97757", href: "/panel/mcp", rozet: "TREND", rozetTip: "pembe" },
  { ad: "Gemini Omni Flash", ozet: "Her girdiden video üret ve düzenle", logo: "/marka/googlegemini.svg", marka: "#8E75B2", href: "/panel/video", rozet: "YENİ", rozetTip: "lime" },
  { ad: "Sinema Stüdyosu 3.5", ozet: "Zahmetsizce sinematik sahneler oluştur", ikon: "Clapperboard", marka: "#dafd55", href: "/panel/sinema", rozet: "", rozetTip: "" },
] as const;

/* SC_AJAN_ADIMLAR KALDIRILDI: donmuş mockup'ın metinleriydi. Canlı vitrin
   (components/panel/SCVitrin.tsx) kendi iş/adım tanımlarını taşıyor —
   her adımın süresi ve ürettiği çıktılar orada birlikte duruyor. */

/* ── 5. Yarışma uygulama grid ── */
export const YARISMA_UYGULAMALAR = [
  { ad: "Karakter Sayfası", tohum: "app-charsheet", goruntulenme: 7584, kredi: 5511, kat: "portre" },
  { ad: "Video Editör", tohum: "app-videoeditor", goruntulenme: 14400, kredi: 1131, kat: "sinematik" },
  { ad: "Hook Stüdyo", tohum: "app-hookstudio", goruntulenme: 14500, kredi: 57900, kat: "portre" },
  { ad: "Sıradaki Rakibin SENSİN", tohum: "app-opponent", goruntulenme: 19500, kredi: 75800, kat: "sinematik" },
  { ad: "Bir Yerlerde", tohum: "app-somewhere", goruntulenme: 7439, kredi: 47000, kat: "manzara" },
  { ad: "Sticker Paketi", tohum: "app-stickerpack", goruntulenme: 1592, kredi: 1819, kat: "3d" },
  { ad: "Kedicik", tohum: "app-kitten", goruntulenme: 8210, kredi: 3400, kat: "portre" },
  { ad: "Neon Rüya", tohum: "app-neondream", goruntulenme: 5120, kredi: 12800, kat: "soyut" },
  { ad: "Altın Saat", tohum: "app-goldenhour", goruntulenme: 9930, kredi: 22100, kat: "manzara" },
] as const;

/* ── 8. Orijinal seri banner ── */
export const ORIJINAL_BANNER = { ad: "KÖK BÖRÜ", altYazi: "Vayra Orijinal Seri'de yayında", tanim: "İlk yapay zeka dizisi yayın platformu", tohum: "kok-boru-banner", kat: "sinematik" };

/* ── 10. Viral preset kategori chip'leri ── */
export const PRESET_KATEGORILER = ["BEYZBOL MAÇI", "DRİFT YARIŞI", "CGI KIRILIM", "FUTBOL İSTİLASI", "YAZ SİSİ", "KUNG FU VURUŞ", "SON SERVİS", "ANDROID BİRLEŞ", "3D RENDER", "FIRTINA DEVİ", "MAVİ DERİNLİK", "PATLAMA", "ZAMAN DONDU"];

/* ── Masonry model showcase bölümleri (tekrar eden şablon) ── */
export interface KesfetBolum {
  id: string;
  baslik: string;
  ozet: string;
  tumunuGor: string;      // "Tümünü gör" buton etiketi (X yerine geçer)
  kat: string;            // onizlemeArka kategori
  oran: "dikey" | "yatay" | "karisik"; // galeri kart oranı
  sutun: number;
}
export const MODEL_BOLUMLERI: KesfetBolum[] = [
  { id: "seedance", baslik: "SEEDANCE 2.0", ozet: "Vayra topluluğundan premium AI video üretimlerine göz at.", tumunuGor: "Seedance 2.0", kat: "sinematik", oran: "karisik", sutun: 4 },
  { id: "presetler", baslik: "VAYRA VİRAL PRESETLER", ozet: "Patlamalardan gerçeküstü dönüşümlere, büyük bütçeli görsel efektler.", tumunuGor: "presetler", kat: "sinematik", oran: "dikey", sutun: 5 },
  { id: "gptimage", baslik: "GPT IMAGE 2", ozet: "Neredeyse kusursuz metin işleme ile 4K görseller.", tumunuGor: "GPT Image 2", kat: "urun", oran: "karisik", sutun: 4 },
  { id: "pazarlama", baslik: "PAZARLAMA STÜDYOSU", ozet: "Yaratıcıların ve markaların Pazarlama Stüdyosu ile ne ürettiğini gör.", tumunuGor: "Pazarlama Stüdyosu", kat: "portre", oran: "dikey", sutun: 4 },
  { id: "soulcinema", baslik: "VAYRA SOUL CINEMA", ozet: "Etkileyici Vayra Soul Cinema üretimleri için topluluk galerisini keşfet.", tumunuGor: "Soul Cinema", kat: "sinematik", oran: "karisik", sutun: 4 },
  { id: "soul2", baslik: "VAYRA SOUL 2.0", ozet: "Moda, estetik ve yaratıcı ifade için kültür-yerli bir foto modeli.", tumunuGor: "Vayra Soul 2.0", kat: "portre", oran: "karisik", sutun: 4 },
];

/* ── Banner'lar (Canvas / Photodump) ── */
export const CANVAS_BANNER = { rozet: "YENİ ÖZELLİK", baslik1: "TEK KANVAS.", baslik2: "HER İŞ AKIŞI.", ozet: "Moodboard oluştur, iş akışlarını zincirle ve ekibinle paylaş — hepsi tek kanvasta.", buton: "Kanvası Dene", href: "/panel/canvas" };
export const PHOTODUMP_BANNER = { rozet: "PHOTODUMP", baslik1: "FARKLI SAHNELER", baslik2: "AYNI YILDIZ", ozet: "Karakterini oluştur. Bir tık gerisini halleder.", buton: "Photodump'ı Dene", href: "/panel/karakter" };

/* ── 17. "Daha fazla AI özelliği" chip bulutu ── */
export const OZELLIK_CIPLERI = [
  "Sinema Stüdyosu", "Görsel Efektler", "Vayra Soul", "Kling 2.1 Master", "Kamera Kontrolleri", "Viral", "Aksiyon Hareketleri", "Reklam", "MiniMax Hailuo 02", "Seedance Pro",
  "Topluluk", "Wan 2.2 Görsel", "Seedream 4.0", "Nano Banana", "Flux Kontext", "GPT Image", "Topaz", "Google Veo3", "Kling 2.5 Turbo", "Kling Avatar 2.0", "Claude MCP",
  "Wan 2.5", "Sora 2", "Sora 2 Presetler", "Banana Yerleştirme", "Ürün Yerleştirme", "Görsel Düzenle", "Çoklu Referans", "Büyüt", "Asistanlar", "YouTube", "TikTok", "Instagram Reels",
  "YouTube Shorts", "Nano Banana Pro", "Kling o1", "Karışık Medya Topluluk", "Soul Presetler", "Görsel Efekt Koleksiyonu",
];

/* ── Sahte topluluk galeri yazarları (hover overlay için) ── */
export const YAZARLAR = ["@cinemadreams", "@studio.ela", "@dreamscape", "@3dworks", "@wanderer", "@virtualstar", "@lumina", "@transform", "@piffle_jack", "@wer", "@byzantinetiger", "@modular_puffer"];

/* ── GERÇEK GÖRSELLER ──
 * Tohum → Gemini Nano Banana ile üretilmiş gerçek görsel yolu.
 * Her görsel temsil ettiği içeriğe göre özel üretildi (stok/gradyan değil).
 * gercekGorsel(tohum) ile sayfada `onizlemeArka` yerine kullanılır. */
export const GERCEK_GORSELLER: Record<string, string> = {
  // Hero kartlar
  "kesfet-sc-free": "/gercek/panel/hero-sc-free.webp",
  "kesfet-academy": "/gercek/panel/hero-academy.webp",
  "kesfet-mcp": "/gercek/panel/hero-mcp.webp",
  // Büyük bannerlar
  "seedance-tv": "/gercek/panel/seedance-tv.webp",
  "kok-boru-banner": "/gercek/panel/kok-boru.webp",
  "canvas-mockup": "/gercek/panel/canvas-mockup.webp",
  "photodump0": "/gercek/panel/photodump0.webp",
  "photodump1": "/gercek/panel/photodump1.webp",
  "photodump2": "/gercek/panel/photodump2.webp",
  "yarisma-heykel": "/gercek/panel/yarisma-heykel.webp",
  // Viral presetler (preset0..preset9)
  "preset0": "/gercek/panel/preset0.webp",
  "preset1": "/gercek/panel/preset1.webp",
  "preset2": "/gercek/panel/preset2.webp",
  "preset3": "/gercek/panel/preset3.webp",
  "preset4": "/gercek/panel/preset4.webp",
  "preset5": "/gercek/panel/preset5.webp",
  "preset6": "/gercek/panel/preset6.webp",
  "preset7": "/gercek/panel/preset7.webp",
  "preset8": "/gercek/panel/preset8.webp",
  "preset9": "/gercek/panel/preset9.webp",
  // Yarışma uygulamaları — kapak (tohum) + ikon (tohum + "ic")
  "app-charsheet": "/gercek/panel/app-charsheet.webp",
  "app-charsheetic": "/gercek/panel/app-charsheet-ic.webp",
  "app-videoeditor": "/gercek/panel/app-videoeditor.webp",
  "app-videoeditoric": "/gercek/panel/app-videoeditor-ic.webp",
  "app-hookstudio": "/gercek/panel/app-hookstudio.webp",
  "app-hookstudioic": "/gercek/panel/app-hookstudio-ic.webp",
  "app-opponent": "/gercek/panel/app-opponent.webp",
  "app-opponentic": "/gercek/panel/app-opponent-ic.webp",
  "app-somewhere": "/gercek/panel/app-somewhere.webp",
  "app-somewhereic": "/gercek/panel/app-somewhere-ic.webp",
  "app-stickerpack": "/gercek/panel/app-stickerpack.webp",
  "app-stickerpackic": "/gercek/panel/app-stickerpack-ic.webp",
  "app-kitten": "/gercek/panel/app-kitten.webp",
  "app-kittenic": "/gercek/panel/app-kitten-ic.webp",
  "app-neondream": "/gercek/panel/app-neondream.webp",
  "app-neondreamic": "/gercek/panel/app-neondream-ic.webp",
  "app-goldenhour": "/gercek/panel/app-goldenhour.webp",
  "app-goldenhouric": "/gercek/panel/app-goldenhour-ic.webp",
};

/** Tohuma karşılık gerçek görsel yolu (yoksa undefined). */
export function gercekGorsel(tohum: string): string | undefined {
  return GERCEK_GORSELLER[tohum];
}

/* ── Model bölümü galeri havuzları ──
   Kullanıcı üretimi yoksa bu gerçek görsellerle dolar (stok/gradyan değil).
   Her bölüm kendi temasında 8 gerçek görsel. */
export const GALERI_HAVUZLARI: Record<string, string[]> = {
  seedance: Array.from({ length: 8 }, (_, i) => `/gercek/panel/gal-seedance-${i}.webp`),
  gptimage: Array.from({ length: 8 }, (_, i) => `/gercek/panel/gal-gpt-${i}.webp`),
  pazarlama: Array.from({ length: 8 }, (_, i) => `/gercek/panel/gal-pazarlama-${i}.webp`),
  soulcinema: Array.from({ length: 8 }, (_, i) => `/gercek/panel/gal-soulcinema-${i}.webp`),
  soul2: Array.from({ length: 8 }, (_, i) => `/gercek/panel/gal-soul2-${i}.webp`),
  presetler: Array.from({ length: 10 }, (_, i) => `/gercek/panel/preset${i}.webp`),
};

/** Bir model bölümü + kart indeksi için gerçek galeri görseli (yoksa undefined). */
export function galeriGorsel(bolumId: string, i: number): string | undefined {
  const havuz = GALERI_HAVUZLARI[bolumId];
  if (!havuz?.length) return undefined;
  return havuz[i % havuz.length];
}

/* ── GALERİ VİDEOLARI ──
   Pazarlama kartlarının görselleri Seedance 2.0 ile (görselden-videoya)
   6sn'lik videolara çevrildi; ilk kare kaynak görselle birebir aynı, bu
   yüzden görsel POSTER olarak kalır ve video onun üstüne biner.

   Burada YALNIZCA üretimi tamamlanmış indeksler listelenir — kalanlar
   üretildikçe bu diziye eklenir, o zamana dek o kartlar görsel gösterir
   (kırık video isteği oluşmaz). Pazarlama seti 8/8 tamamlandı.

   Yöntem eşlemesi (kart sırasıyla):
     0 Hyper Motion · 1 Unboxing ASMR · 2 Product Showcase · 3 Tutorial
     4 UGC · 5 Unboxing Try On · 6 Camera POV · 7 Couple Sharing */
const GALERI_VIDEO_HAZIR: Record<string, number[]> = {
  pazarlama: [0, 1, 2, 3, 4, 5, 6, 7],
};

/** Kart için video yolu — yoksa undefined (kart görsel olarak kalır). */
export function galeriVideo(bolumId: string, i: number): string | undefined {
  const havuz = GALERI_HAVUZLARI[bolumId];
  if (!havuz?.length) return undefined;
  const idx = i % havuz.length;
  if (!GALERI_VIDEO_HAZIR[bolumId]?.includes(idx)) return undefined;
  return `/gercek/paz-video/gal-${bolumId}-${idx}.mp4`;
}
