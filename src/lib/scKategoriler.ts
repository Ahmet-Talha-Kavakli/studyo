/**
 * Usta ana sayfa kategori galerileri — Higgsfield "WHAT SUPERCOMPUTER CAN DO"
 * altındaki kategori→kart yapısının birebir Türkçe karşılığı.
 *
 * Her kartın `istem`'i composer'a yazılır ve GERÇEK üretime (siteUretici / /api/uretim) gider.
 */

export interface SCKart {
  ad: string;
  ozet: string;
  istem: string;      // composer'a yazılıp gönderilecek örnek istem (gerçek üretim tetikler)
  tohum: string;      // kapak görseli için deterministik anahtar
  kategori: string;   // onizlemeArka kategori
}

export interface SCKategori {
  ad: string;
  ikon: string;       // lucide ikon adı (apple-glass rozet)
  renk: string;       // rozet gradyan başlangıç
  kartlar: SCKart[];
}

/** "SUPERCOMPUTER NELER YAPABİLİR" — akışın en üstündeki 3 vitrin kartı.
 *  Referans: higg-supercomputer 00.06.5x (Free Mode / $100K APP CONTEST / Explainer). */
export interface SCVitrin {
  ad: string;
  ozet: string;
  tohum: string;
  kategori: string;
  href?: string;      // varsa karta tıklayınca gidilecek rota
  istem?: string;     // yoksa composer'a yazılacak istem
  rozet?: string;
}

export const SC_VITRIN: SCVitrin[] = [
  {
    ad: "Serbest Mod",
    ozet: "Planına dahil — kredi harcamadan sınırsız üret",
    tohum: "sc-vit-free", kategori: "soyut", rozet: "Sınırsız",
    istem: "Serbest modda bir pazarlama kampanyası kurgusu hazırla",
  },
  {
    ad: "100.000$ Uygulama Yarışması",
    ozet: "Bir uygulama yap, yayınla, ödülü kap",
    tohum: "sc-vit-contest", kategori: "sinematik", rozet: "Yarışma",
    href: "/panel/supercomputer/uygulamalar",
  },
  {
    ad: "Vayra Açıklayıcı",
    ozet: "Fikrini anlatan videoyu uçtan uca üret",
    tohum: "sc-vit-explainer", kategori: "portre",
    istem: "Ürünümü anlatan 30 saniyelik dikey bir açıklayıcı video üret",
  },
];

export const SC_KATEGORILER: SCKategori[] = [
  {
    ad: "PAZARLAMA", ikon: "Megaphone", renk: "#ec4899",
    kartlar: [
      { ad: "UGC Değerlendirme", ozet: "Güven veren, yaratıcı-tarzı içerik", istem: "Markam için UGC tarzı, güven veren bir ürün değerlendirme videosu kurgusu hazırla", tohum: "sc-ugc", kategori: "portre" },
      { ad: "AI Influencer", ozet: "Tutarlı sanal karakter oluştur", istem: "Markam için tutarlı bir sanal influencer karakteri ve kampanya konsepti oluştur", tohum: "sc-inf", kategori: "portre" },
      { ad: "Reklam Kampanyası", ozet: "Çok kanallı kampanya kurgusu", istem: "Ürünüm için dönüşüm odaklı, çok kanallı bir pazarlama kampanyası planı üret", tohum: "sc-camp", kategori: "sinematik" },
    ],
  },
  {
    ad: "E-TİCARET", ikon: "ShoppingBag", renk: "#22c55e",
    kartlar: [
      { ad: "Ürün Animasyonu", ozet: "Ürününü harekete geçir", istem: "Ürünümü hareketli, sinematik bir ürün animasyonu videosuna dönüştür", tohum: "sc-panim", kategori: "urun" },
      { ad: "Ürün Çekimi", ozet: "Stüdyosuz stüdyo fotoğrafı", istem: "Ürünüm için stüdyo kalitesinde profesyonel bir ürün fotoğrafı üret", tohum: "sc-pshoot", kategori: "urun" },
    ],
  },
  {
    ad: "OYUN YAPIMI", ikon: "Gamepad2", renk: "#3b82f6",
    kartlar: [
      { ad: "Oyun Yapıcı", ozet: "Oynanabilir 2D oyun kur", istem: "Eğlenceli, oynanabilir bir yılan oyunu yap, adı Nova olsun", tohum: "sc-game", kategori: "sinematik" },
      { ad: "Oyun Varlık Paketi", ozet: "Sprite, tileset ve UI ikonları", istem: "Retro bir platform oyunu için sprite, tileset ve UI ikon paketi üret", tohum: "sc-asset", kategori: "3d" },
    ],
  },
  {
    ad: "3D ÜRETİM", ikon: "Box", renk: "#a855f7",
    kartlar: [
      { ad: "3D Nesne Üretimi", ozet: "İstemden temiz 3D model", istem: "Fütüristik bir astronot kaskının temiz, üretime hazır 3D modelini oluştur", tohum: "sc-3d", kategori: "3d" },
      { ad: "3D Karakter", ozet: "Rig'li karakter modeli", istem: "Sevimli bir robot karakterin rig'li ve animasyonlu 3D modelini üret", tohum: "sc-3dchar", kategori: "3d" },
    ],
  },
  {
    ad: "SİTELER", ikon: "Globe", renk: "#14b8a6",
    kartlar: [
      { ad: "Landing Sayfası", ozet: "Dönüşüm odaklı açılış sayfası", istem: "Modern bir kahve dükkanı için dönüşüm odaklı bir landing sayfası yap, adı Roasted olsun", tohum: "sc-land", kategori: "sinematik" },
      { ad: "Girişim Sitesi", ozet: "Startup için pazarlama sitesi", istem: "Bir teknoloji girişimi için modern pazarlama sitesi yap, adı Vertex olsun", tohum: "sc-startup", kategori: "sinematik" },
    ],
  },
  {
    ad: "MARKA & TASARIM", ikon: "Palette", renk: "#f59e0b",
    kartlar: [
      { ad: "Panel / Dashboard", ozet: "Verilerini görselleştir", istem: "Satış ekibim için analitik bir dashboard paneli tasarla", tohum: "sc-dash", kategori: "soyut" },
      { ad: "Marka Kimliği", ozet: "Amiral kampanyalar için tasarım", istem: "Yeni markam için modern bir marka kimliği ve landing sayfası tasarla, adı Aura olsun", tohum: "sc-brand", kategori: "soyut" },
    ],
  },
  {
    ad: "SES & MÜZİK", ikon: "Music", renk: "#f97316",
    kartlar: [
      { ad: "Video için SFX", ozet: "Videolarına ses efekti", istem: "Gerilim sahnesi için kapı gıcırtısı ve ayak sesi efektleri üret", tohum: "sc-sfx", kategori: "soyut" },
      { ad: "Video Müziği", ozet: "Videon için özgün müzik", istem: "Videom için rahatlatıcı lo-fi çalışma müziği üret", tohum: "sc-music", kategori: "soyut" },
    ],
  },
];

/** Composer altındaki hızlı-başlangıç çipleri (Higgsfield birebir). */
export const SC_CIPLER = [
  { ad: "Pazarlama yürüt", oneri: "Markam için dönüşüm odaklı bir pazarlama kampanyası kur ve tüm kanallara yay." },
  { ad: "Uygulamalar", rozet: "Yarışma", href: "/panel/supercomputer/uygulamalar" },
  { ad: "Tasarım oluştur", oneri: "Ürünüm için modern bir tasarım sistemi ve landing sayfası tasarla." },
  { ad: "Oyunlar", href: "/panel/supercomputer/oyunlar" },
  { ad: "Vayra MCP", href: "/panel/mcp" },
];

/* ═══════════════════════════════════════════════════════════════
   COMPOSER MODEL SEÇİCİ — referanslar/modeller birebir.
   Yapı: [Modlar] → [Öne çıkan modeller] → [Tüm modeller]
   Her satır hover'da sağda maliyet etiketi + yanında kredi tooltip'i gösterir.
   Kredi değerleri referanstaki "Typical message cost" balonlarından alındı.
   ═══════════════════════════════════════════════════════════════ */

/** Maliyet bandı — etiket rengi buradan türetilir. */
export type SCMaliyet = "dusuk" | "orta" | "yuksek" | "sinirsiz";

export const SC_MALIYET_ETIKET: Record<SCMaliyet, string> = {
  dusuk: "Düşük maliyet",
  orta: "Orta maliyet",
  yuksek: "Yüksek maliyet",
  sinirsiz: "Sınırsız",
};

export type SCModel = {
  ad: string;
  ozet: string;
  yeni?: boolean;
  one?: boolean;
  saglayici: string;
  maliyet: SCMaliyet;
  /** Ortalama mesaj kredisi — hover tooltip'inde "~X kredi". */
  kredi?: number;
};

export const SC_MODLAR: SCModel[] = [
  { ad: "Akıllı mod", ozet: "Derin düşünme, en yüksek kalite", saglayici: "akilli", maliyet: "orta", kredi: 3.87 },
  { ad: "Serbest mod", ozet: "Planına dahil", yeni: true, saglayici: "vayra", maliyet: "sinirsiz" },
];

/** saglayici: marka ikonu anahtarı (openai/anthropic/google/xai/deepseek/moonshot/glm/seed). */
export const SC_MODELLER: SCModel[] = [
  /* ── Öne çıkan modeller ── */
  { ad: "Kimi K3", ozet: "Gelişmiş çok-modlu akıl yürütme modeli", yeni: true, one: true, saglayici: "moonshot", maliyet: "orta", kredi: 4.9 },
  { ad: "GPT 5.6 Sol", ozet: "OpenAI'ın en iyisi", yeni: true, one: true, saglayici: "openai", maliyet: "yuksek", kredi: 8.84 },
  { ad: "Claude Fable 5", ozet: "Anthropic'in en zeki Claude modeli", yeni: true, one: true, saglayici: "anthropic", maliyet: "yuksek", kredi: 16.85 },
  { ad: "GLM 5.2", ozet: "Karmaşık görevler için açık ağırlıklı zekâ", one: true, saglayici: "glm", maliyet: "dusuk", kredi: 2.98 },
  { ad: "GPT-5.6 Terra", ozet: "Günlük kullanım için en iyi", yeni: true, one: true, saglayici: "openai", maliyet: "orta", kredi: 4.42 },
  { ad: "DeepSeek V4 Flash", ozet: "Yüksek hacim için en hızlı ve en ucuz", one: true, saglayici: "deepseek", maliyet: "dusuk", kredi: 0.11 },
  { ad: "Claude Opus 4.8", ozet: "Karmaşık, analitik işler için en iyi", one: true, saglayici: "anthropic", maliyet: "orta", kredi: 8.43 },
  { ad: "Claude Sonnet 5", ozet: "Anthropic'in şimdiye kadarki en ajanik modeli", yeni: true, one: true, saglayici: "anthropic", maliyet: "dusuk", kredi: 3.37 },
  { ad: "Grok 4.5", ozet: "xAI'nın araştırma için en akıllı modeli", yeni: true, one: true, saglayici: "xai", maliyet: "orta", kredi: 5.21 },
  { ad: "GPT 5.6 Luna", ozet: "Hızlı görevler için hafif model", yeni: true, one: true, saglayici: "openai", maliyet: "dusuk", kredi: 1.77 },
  { ad: "Seed 2.1 Turbo", ozet: "Dengeli çok-modlu model", one: true, saglayici: "seed", maliyet: "dusuk", kredi: 1.2 },
  /* ── Tüm modeller ── */
  { ad: "Claude Opus 4.6", ozet: "Uzun-form yaratıcı işler için en iyi", saglayici: "anthropic", maliyet: "orta", kredi: 8.43 },
  { ad: "Gemini 3.1 Pro", ozet: "Güçlü, her yönden dengeli model", saglayici: "google", maliyet: "dusuk", kredi: 3.07 },
  { ad: "GPT-5.5", ozet: "Çok adımlı görevler için en iyi", saglayici: "openai", maliyet: "yuksek", kredi: 8.57 },
  { ad: "Claude Sonnet 4.6", ozet: "Günlük işler için duyarlı", saglayici: "anthropic", maliyet: "orta", kredi: 5.06 },
  { ad: "DeepSeek V4 Pro", ozet: "Düşük maliyette en iyi kod kalitesi", saglayici: "deepseek", maliyet: "dusuk", kredi: 0.3 },
  { ad: "Kimi K2.6", ozet: "Ajanik kodlama ve uzun yapılar için en iyi", saglayici: "moonshot", maliyet: "dusuk", kredi: 2.5 },
  { ad: "Gemini 3.5 Flash", ozet: "Hızlı, yüksek kaliteli yanıtlar", saglayici: "google", maliyet: "dusuk", kredi: 2.26 },
  { ad: "Gemini 3.0 Flash", ozet: "Hızlı, hafif günlük model", saglayici: "google", maliyet: "dusuk", kredi: 0.53 },
  { ad: "Grok 4.3", ozet: "Araştırma ve analiz için en iyi", saglayici: "xai", maliyet: "dusuk", kredi: 2.3 },
];
