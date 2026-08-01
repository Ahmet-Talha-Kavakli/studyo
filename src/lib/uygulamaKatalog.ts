/* ══════════════════════════════════════════════════════════════════
   UYGULAMA KATALOĞU — referanslar/apps (89 klasör, 597 ekran) birebir.

   Referansta 8 kategori var; ana sayfa her kategoriden İLK 5 kartı
   gösteriyor, kategori sayfası tam listeyi.

   İSKELET VARYANTLARI (referans analizinden):
     "ikili"    → sol: yükleme+Üret · sağ: örnek çıktı        (baskın, ~70)
     "adim"     → 1 Yükle → 2 Izgara → 3 Büyüt sihirbazı      (shots, whats-next, zooms)
     "panel"    → tuval + sağ ayar paneli                     (relight)
     "tekKart"  → ortalanmış tek yükleme kartı                (skin-enhancer)
     "analiz"   → sol yükleme + sağ skor paneli               (virality)
   Ek alanlar: ikinci yükleme kutusu, preset seçici, metin girişi, kalite.
   ══════════════════════════════════════════════════════════════════ */

export type UygIskelet = "ikili" | "adim" | "panel" | "tekKart" | "analiz";
export type UygRozet = "PRO" | "YENİ" | "TREND";
export type UygGirdi = "gorsel" | "video" | "medya";

export interface Uyg {
  slug: string;
  ad: string;
  /** Kart ve detay sayfasındaki tek satır açıklama. */
  ozet: string;
  /** Detay sayfasındaki DEV BÜYÜK başlık (referansta ayrı metin). */
  vurgu?: string;
  kategori: string;
  rozet?: UygRozet;
  iskelet?: UygIskelet;      // varsayılan "ikili"
  girdi?: UygGirdi;          // varsayılan "gorsel"
  cikti: "gorsel" | "video";
  kredi: number;
  /** İkinci yükleme kutusu (Kıyafet Değiştir, Yeniden Rol vb.). */
  ikinciKutu?: { etiket: string; girdi: UygGirdi };
  /** Hazır ayar şeridi (Stil Anı, Mini Canlılar). */
  presetler?: string[];
  /** Serbest metin girişi (Kamyon Reklamı). */
  metinAlani?: string;
  /** Kalite seçici (Peluşlar: Standart/Yüksek). */
  kalite?: { ad: string; kredi: number }[];
  /** Topluluk üreticisi rozeti. */
  uretici?: string;
  /** Adım sihirbazı etiketleri. */
  adimlar?: string[];
  /** Kapak tohumu — deterministik önizleme. */
  tohum: string;
}

export const UYG_KATEGORILERI = [
  "Tümü", "Profesyonel", "Geliştir & Stil", "Yüz & Kimlik",
  "Video Düzenleme", "Reklam & Ürün", "Oyun & Karakter", "Ekstra", "Trend Şablonlar",
] as const;

/** Bölüm başlıkları + referanstaki alt açıklamalar (ana sayfa sırası). */
export const UYG_BOLUMLERI: { ad: string; ozet: string }[] = [
  { ad: "Profesyonel", ozet: "Çekim, açı ve kusursuz geçişler üret" },
  { ad: "Geliştir & Stil", ozet: "Fotoğraflarını yapay zekâ ile mükemmelleştir" },
  { ad: "Yüz & Kimlik", ozet: "Yüz ve karakter değiştir, görünümünü dönüştür" },
  { ad: "Video Düzenleme", ozet: "Videolarını kes, senkronla ve düzenle" },
  { ad: "Reklam & Ürün", ozet: "Anında profesyonel video reklamlar oluştur" },
  { ad: "Oyun & Karakter", ozet: "Oyun avatarları ve karakter dönüşümleri" },
  { ad: "Ekstra", ozet: "Keşfedilecek daha fazla yaratıcı araç" },
  { ad: "Trend Şablonlar", ozet: "Yapay zekâ şablonlarıyla viral içerik üret" },
];

const u = (x: Uyg): Uyg => x;

export const UYGULAMALAR: Uyg[] = [
  /* ══════════ PROFESYONEL (9) ══════════ */
  u({ slug: "acilar", ad: "Açılar 2.0", ozet: "Herhangi bir görsel için saniyeler içinde yeni açı üret", kategori: "Profesyonel", rozet: "PRO", cikti: "gorsel", kredi: 4, tohum: "u-acilar" }),
  u({ slug: "sirada-ne-var", ad: "Sırada Ne Var?", ozet: "Tek sahneden 8 anlatı olasılığı keşfet", kategori: "Profesyonel", rozet: "YENİ", iskelet: "adim", adimlar: ["Yükle", "Varyasyonlar", "Büyüt"], cikti: "gorsel", kredi: 4, tohum: "u-sirada" }),
  u({ slug: "cekimler", ad: "Çekimler", ozet: "Tek görselden 9 benzersiz çekim", kategori: "Profesyonel", iskelet: "adim", adimlar: ["Yükle", "Izgara", "Büyüt"], cikti: "gorsel", kredi: 4, tohum: "u-cekim" }),
  u({ slug: "yakinlastirmalar", ad: "Yakınlaştırmalar", ozet: "Tek görselden 9 yakınlaştırma seviyesi", kategori: "Profesyonel", iskelet: "adim", adimlar: ["Yükle", "Izgara", "Büyüt"], cikti: "gorsel", kredi: 4, tohum: "u-zoom" }),
  u({ slug: "kamera-arkasi", ad: "Kamera Arkası", ozet: "Fotoğrafları kamera arkası videolarına dönüştür", kategori: "Profesyonel", cikti: "video", kredi: 12, tohum: "u-arka" }),
  u({ slug: "gecisler", ad: "Geçişler", ozet: "Çekimler arasında zahmetsizce kusursuz geçişler kur", kategori: "Profesyonel", rozet: "TREND", cikti: "video", kredi: 8, ikinciKutu: { etiket: "Bitiş karesi", girdi: "gorsel" }, tohum: "u-gecis" }),
  u({ slug: "gorsel-genislet", ad: "Görsel Genişlet", ozet: "Herhangi bir görseli kenarlarının ötesine büyüt", kategori: "Profesyonel", cikti: "gorsel", kredi: 3, tohum: "u-genislet" }),
  u({ slug: "renk-derecelendirme", ad: "Renk Derecelendirme", ozet: "Her görsel için profesyonel renk kontrolleri", kategori: "Profesyonel", iskelet: "panel", cikti: "gorsel", kredi: 2, tohum: "u-renk" }),
  u({ slug: "viral-tahmin", ad: "Viral Tahmin", ozet: "Paylaşmadan önce hook'unun ne kadar viral olacağını ölç", kategori: "Profesyonel", iskelet: "analiz", girdi: "video", cikti: "gorsel", kredi: 0, tohum: "u-viral" }),

  /* ══════════ GELİŞTİR & STİL (8) ══════════ */
  u({ slug: "ai-stilist", ad: "AI Stilist", ozet: "Yapay zekâ deneme kabinin. Her şeyi anında dene", kategori: "Geliştir & Stil", rozet: "YENİ", cikti: "gorsel", kredi: 4, presetler: ["Sokak", "Ofis", "Gece", "Spor", "Klasik", "Y2K"], tohum: "u-stilist" }),
  u({ slug: "yeniden-isiklandir", ad: "Yeniden Işıklandır", ozet: "Işık konumunu, rengini ve parlaklığını ayarla", kategori: "Geliştir & Stil", rozet: "PRO", iskelet: "panel", girdi: "medya", cikti: "gorsel", kredi: 2, tohum: "u-isik" }),
  u({ slug: "cilt-iyilestirici", ad: "Cilt İyileştirici", ozet: "Doğal, gerçekçi cilt dokuları", kategori: "Geliştir & Stil", rozet: "PRO", iskelet: "tekKart", girdi: "medya", cikti: "gorsel", kredi: 2, tohum: "u-cilt" }),
  u({ slug: "kiyafet-degistir", ad: "Kıyafet Değiştir", ozet: "Tek fotoğraf yükleyerek herhangi bir kıyafeti dene", kategori: "Geliştir & Stil", cikti: "gorsel", kredi: 2, ikinciKutu: { etiket: "Karakter görseli", girdi: "gorsel" }, tohum: "u-kiyafet" }),
  u({ slug: "stil-ani", ad: "Stil Anı", ozet: "Anında stil varyasyonlarıyla görünümünü dönüştür", kategori: "Geliştir & Stil", cikti: "gorsel", kredi: 2, presetler: ["Coquette", "Grunge", "Minimal", "Retro", "Neon", "Pastel"], tohum: "u-stilani" }),
  u({ slug: "kiyafet-otomati", ad: "Kıyafet Otomatı", ozet: "Kıyafetini ışıklı bir otomat vitrininde parçalarına ayır", kategori: "Geliştir & Stil", cikti: "gorsel", kredi: 2, tohum: "u-otomat" }),
  u({ slug: "simli-sticker", ad: "Simli Sticker", ozet: "Kendinin ışıldayan sticker versiyonunu oluştur", kategori: "Geliştir & Stil", cikti: "gorsel", kredi: 2, tohum: "u-simli" }),
  u({ slug: "kiyafet-cekimi", ad: "Kıyafet Çekimi", ozet: "Kıyafetleri profesyonel bir avatar çekimine dönüştür", kategori: "Geliştir & Stil", cikti: "video", kredi: 19, tohum: "u-kcekim" }),

  /* ══════════ YÜZ & KİMLİK (6) ══════════ */
  u({ slug: "yeniden-rol", ad: "Yeniden Rol", ozet: "Her video için sektör lideri karakter değiştirme", kategori: "Yüz & Kimlik", rozet: "PRO", girdi: "video", cikti: "video", kredi: 20, ikinciKutu: { etiket: "Karakter görseli", girdi: "gorsel" }, tohum: "u-recast" }),
  u({ slug: "karakter-degistir", ad: "Karakter Değiştir 2.0", ozet: "Görselindeki karakterleri tek tıkla değiştir", kategori: "Yüz & Kimlik", cikti: "gorsel", kredi: 3, ikinciKutu: { etiket: "Karakter görseli", girdi: "gorsel" }, tohum: "u-kardeg" }),
  u({ slug: "yuz-degistir", ad: "Yüz Değiştir", ozet: "Fotoğraflar için en iyi anında yüz değiştirme teknolojisi", kategori: "Yüz & Kimlik", cikti: "gorsel", kredi: 2, ikinciKutu: { etiket: "Yüz görseli", girdi: "gorsel" }, tohum: "u-yuzdeg" }),
  u({ slug: "ticari-yuzler", ad: "Ticari Yüzler", ozet: "Dijital kimliğini profesyonel yüzlerle güçlendir", kategori: "Yüz & Kimlik", cikti: "gorsel", kredi: 3, tohum: "u-ticari" }),
  u({ slug: "video-yuz-degistir", ad: "Video Yüz Değiştir", ozet: "Her video için sınıfının en iyisi yüz değiştirme", kategori: "Yüz & Kimlik", girdi: "video", cikti: "video", kredi: 18, ikinciKutu: { etiket: "Yüz görseli", girdi: "gorsel" }, tohum: "u-vyuz" }),
  u({ slug: "vesikalik-uretici", ad: "Vesikalık Üretici", ozet: "Saniyeler içinde stüdyo kalitesinde profesyonel vesikalık", kategori: "Yüz & Kimlik", cikti: "gorsel", kredi: 2, tohum: "u-vesika" }),

  /* ══════════ VİDEO DÜZENLEME (6) ══════════ */
  u({ slug: "klipkes", ad: "KlipKes", ozet: "Tek selfie'yi anında kıyafet reel'ine dönüştür", kategori: "Video Düzenleme", cikti: "video", kredi: 16, tohum: "u-klipkes" }),
  u({ slug: "sehir-kesitleri", ad: "Şehir Kesitleri", ozet: "Ritme senkron yeni nesil yapay zekâ kıyafet videoları", kategori: "Video Düzenleme", cikti: "video", kredi: 22, tohum: "u-sehir" }),
  u({ slug: "sticker-eslesme", ad: "Sticker Eşleşme Kesmesi", ozet: "Videonu ışıldayan bir sticker animasyonuna çevir", kategori: "Video Düzenleme", girdi: "video", cikti: "video", kredi: 25, tohum: "u-sticker" }),
  u({ slug: "parcalama", ad: "Parçalama", ozet: "Herhangi bir görseli tek tek bileşenlerine ayır", kategori: "Video Düzenleme", cikti: "gorsel", kredi: 3, tohum: "u-parca" }),
  u({ slug: "japon-sovu", ad: "Japon Şovu", ozet: "Fotoğrafını retro 4 panelli TV şovu sahnesine çevir", kategori: "Video Düzenleme", cikti: "video", kredi: 15, tohum: "u-japon" }),
  u({ slug: "video-arka-plan-sil", ad: "Video Arka Planı Sil", ozet: "Video yükle, arka planı kare kare kusursuz sil", kategori: "Video Düzenleme", girdi: "video", cikti: "video", kredi: 1, tohum: "u-vbg" }),

  /* ══════════ REKLAM & ÜRÜN (20) ══════════ */
  u({ slug: "tikla-reklam-ol", ad: "Tıkla Reklam Ol", ozet: "Ürün bağlantılarını UGC ve profesyonel video reklamlara çevir", kategori: "Reklam & Ürün", rozet: "PRO", cikti: "video", kredi: 24, metinAlani: "Ürün bağlantısını yapıştır", tohum: "u-tikla" }),
  u({ slug: "asmr-eklentisi", ad: "ASMR Eklentisi", ozet: "Ürününü bir ASMR videosuna kusursuzca yerleştir", kategori: "Reklam & Ürün", cikti: "video", kredi: 16, tohum: "u-asmre" }),
  u({ slug: "asmr-klasik", ad: "ASMR Klasik", ozet: "Fısıltılı geleneksel bir ASMR videosu üret", kategori: "Reklam & Ürün", cikti: "video", kredi: 16, tohum: "u-asmrk" }),
  u({ slug: "poster", ad: "Poster", ozet: "Ürününü çarpıcı bir poster tasarımına dönüştür", kategori: "Reklam & Ürün", vurgu: "ÜRÜNÜNÜ ÇARPICI BİR POSTERE DÖNÜŞTÜR", cikti: "video", kredi: 15, tohum: "u-poster" }),
  u({ slug: "mermi-zamani-sahne", ad: "Mermi Zamanı Sahne", ozet: "Ürününün etrafında dinamik uyarlanabilir arka planlarla dön", kategori: "Reklam & Ürün", cikti: "video", kredi: 18, tohum: "u-mzs" }),
  u({ slug: "bukalemun", ad: "Bukalemun", ozet: "Bir bukalemunun ürününün rengine bürünmesini izle", kategori: "Reklam & Ürün", cikti: "video", kredi: 16, tohum: "u-buka" }),
  u({ slug: "asmr-sunucu", ad: "ASMR Sunucu", ozet: "Fotoğrafını sürükleyici bir ASMR stüdyo sahnesine çevir", kategori: "Reklam & Ürün", cikti: "video", kredi: 16, tohum: "u-asmrs" }),
  u({ slug: "urun-cekimi", ad: "Ürün Çekimi", ozet: "Reklamın için cilalı bir kapanış karesi oluştur", kategori: "Reklam & Ürün", vurgu: "REKLAMIN İÇİN CİLALI BİR KAPANIŞ KARESİ", cikti: "video", kredi: 16, tohum: "u-packshot" }),
  u({ slug: "makro-sahne", ad: "Makro Sahne", ozet: "Ürün detaylarını uyarlanabilir bir makro sahnede sergile", kategori: "Reklam & Ürün", cikti: "video", kredi: 16, tohum: "u-makros" }),
  u({ slug: "sihirli-dugme", ad: "Sihirli Düğme", ozet: "Ürününü tuhaf ve büyülü bir sahneye yerleştir", kategori: "Reklam & Ürün", cikti: "video", kredi: 16, tohum: "u-sihirli" }),
  u({ slug: "kamyon-reklami", ad: "Kamyon Reklamı", ozet: "Markanı hareket eden bir kamyon panosunda sergile", kategori: "Reklam & Ürün", vurgu: "MARKANI HAREKET EDEN BİR KAMYONDA SERGİLE", cikti: "video", kredi: 19, metinAlani: "Marka mesajını yaz", tohum: "u-kamyon" }),
  u({ slug: "dev-urun", ad: "Dev Ürün", ozet: "Ürününü şehir silüetinde dev olarak konumlandır", kategori: "Reklam & Ürün", cikti: "video", kredi: 16, tohum: "u-dev" }),
  u({ slug: "mermi-zamani-beyaz", ad: "Mermi Zamanı Beyaz", ozet: "Ürününün etrafında temiz beyaz arka planda dön", kategori: "Reklam & Ürün", cikti: "video", kredi: 18, tohum: "u-mzb" }),
  u({ slug: "tekme-reklami", ad: "Tekme Reklamı", ozet: "Ürününün rakiplerini bir tekmeyle yendiğini göster", kategori: "Reklam & Ürün", cikti: "video", kredi: 16, tohum: "u-tekme" }),
  u({ slug: "billboard-reklami", ad: "Billboard Reklamı", ozet: "Fotoğrafını devasa bir billboard gösterisine çevir", kategori: "Reklam & Ürün", cikti: "video", kredi: 16, tohum: "u-billb" }),
  u({ slug: "grafiti-reklami", ad: "Grafiti Reklamı", ozet: "Ürününü canlı sokak grafiti sanatına dönüştür", kategori: "Reklam & Ürün", cikti: "video", kredi: 16, tohum: "u-grafiti" }),
  u({ slug: "mermi-zamani-sicrama", ad: "Mermi Zamanı Sıçrama", ozet: "Ürününü sinematik mermi zamanı aksiyonunda patlat", kategori: "Reklam & Ürün", cikti: "video", kredi: 18, tohum: "u-mzsic" }),
  u({ slug: "buzdolabi-reklami", ad: "Buzdolabı Reklamı", ozet: "Ürününü bir buzdolabı vitrininde sergile", kategori: "Reklam & Ürün", cikti: "video", kredi: 16, tohum: "u-buzdolabi" }),
  u({ slug: "volkan-reklami", ad: "Volkan Reklamı", ozet: "Ürününü patlayan bir volkanın önüne yerleştir", kategori: "Reklam & Ürün", cikti: "video", kredi: 16, tohum: "u-volkan" }),
  u({ slug: "makro-urun-cekimi", ad: "Makro Ürün Çekimi", ozet: "Ürününün çarpıcı makro detaylarını yakala", kategori: "Reklam & Ürün", cikti: "video", kredi: 16, tohum: "u-makrou" }),

  /* ══════════ OYUN & KARAKTER (10) ══════════ */
  u({ slug: "oyun-dokumu", ad: "Oyun Dökümü", ozet: "Kendini 12 ikonik video oyunu stiline dönüştür", kategori: "Oyun & Karakter", cikti: "video", kredi: 12, tohum: "u-odokum" }),
  u({ slug: "nano-vurus", ad: "Nano Vuruş", ozet: "Fotoğrafını anında taktik nişancı ajan videosuna dönüştür", kategori: "Oyun & Karakter", cikti: "video", kredi: 6, tohum: "u-nvurus" }),
  u({ slug: "nano-soygun", ad: "Nano Soygun", ozet: "Kendini gerçekçi açık dünya oyunu stilinde gör", kategori: "Oyun & Karakter", cikti: "video", kredi: 6, tohum: "u-nsoygun" }),
  u({ slug: "simlife", ad: "Simlife", ozet: "Kendini stilize bir yaşam simülasyonu karakterine dönüştür", kategori: "Oyun & Karakter", cikti: "video", kredi: 6, ikinciKutu: { etiket: "Kıyafet parçası", girdi: "gorsel" }, tohum: "u-simlife" }),
  u({ slug: "peluslar", ad: "Peluşlar", ozet: "Her fotoğrafı sevimli bir peluş animasyonuna dönüştür", kategori: "Oyun & Karakter", cikti: "video", kredi: 8, kalite: [{ ad: "Standart · 768p", kredi: 8 }, { ad: "Yüksek · 1080p", kredi: 10 }], tohum: "u-pelus" }),
  u({ slug: "3d-render", ad: "3D Render", ozet: "Her fotoğrafı çarpıcı bir 3D render nesneye çevir", kategori: "Oyun & Karakter", cikti: "gorsel", kredi: 4, tohum: "u-3dr" }),
  u({ slug: "3d-figur", ad: "3D Figür", ozet: "Fotoğrafını detaylı bir 3D figüre dönüştür", kategori: "Oyun & Karakter", cikti: "gorsel", kredi: 4, tohum: "u-3df" }),
  u({ slug: "piksel-oyun", ad: "Piksel Oyun", ozet: "Fotoğrafını retro piksel oyun grafiklerine çevir", kategori: "Oyun & Karakter", cikti: "video", kredi: 16, uretici: "xromara", tohum: "u-piksel" }),
  u({ slug: "tugla-kup", ad: "Tuğla Küp", ozet: "Fotoğrafını bir tuğla küp oyuncağa dönüştür", kategori: "Oyun & Karakter", cikti: "gorsel", kredi: 4, tohum: "u-tugla" }),
  u({ slug: "eskizden-gercege", ad: "Eskizden Gerçeğe", ozet: "Çizimini gerçekçi bir video sahnesine çevir", kategori: "Oyun & Karakter", cikti: "video", kredi: 16, uretici: "velquix", tohum: "u-eskiz" }),

  /* ══════════ EKSTRA (5) ══════════ */
  u({ slug: "boya-uygulamasi", ad: "Boya Uygulaması", ozet: "Fotoğrafını retro boya uygulaması sanatına dönüştür", kategori: "Ekstra", cikti: "gorsel", kredi: 2, tohum: "u-boya" }),
  u({ slug: "tabela", ad: "Tabela", ozet: "Kendini şık bir duvar resminde gör", kategori: "Ekstra", cikti: "gorsel", kredi: 2, tohum: "u-tabela" }),
  u({ slug: "mini-canlilar", ad: "Mini Canlılar", ozet: "Kendini sevimli hayvanlarla çevrele", kategori: "Ekstra", cikti: "gorsel", kredi: 1, presetler: ["Kedi", "Köpek", "Tavşan", "Panda", "Tilki", "Kuş"], tohum: "u-mini" }),
  u({ slug: "meme-uretici", ad: "AI Meme Üretici", ozet: "Yapay zekâ karakterleriyle viral meme'ler oluştur", kategori: "Ekstra", cikti: "gorsel", kredi: 2, tohum: "u-meme" }),
  u({ slug: "arka-plan-sil", ad: "Arka Plan Sil", ozet: "Selfie yükle, stüdyo kalitesinde profesyonel sonuç al", kategori: "Ekstra", cikti: "gorsel", kredi: 1, tohum: "u-arkasil" }),

  /* ══════════ TREND ŞABLONLAR (25) ══════════ */
  u({ slug: "evet-opucuk", ad: "Evet Öpücük", ozet: "Görselindeki kişiyi sürreal, meme tarzı bir öpücükle buluştur", kategori: "Trend Şablonlar", cikti: "video", kredi: 15, tohum: "u-opucuk" }),
  u({ slug: "lateks", ad: "Lateks", ozet: "Fotoğrafını şık siyah lateks stiline dönüştür", kategori: "Trend Şablonlar", cikti: "gorsel", kredi: 2, tohum: "u-lateks" }),
  u({ slug: "j-dergi", ad: "J-Dergi", ozet: "Fotoğrafını bir Japon dergi kapağına çevir", kategori: "Trend Şablonlar", cikti: "gorsel", kredi: 2, tohum: "u-jdergi" }),
  u({ slug: "hiz-treni", ad: "Hız Treni", ozet: "Fotoğrafını heyecanlı bir hız treni yolculuğuna koy", kategori: "Trend Şablonlar", vurgu: "FOTOĞRAFINI HIZ TRENİNE BİNDİR", cikti: "video", kredi: 15, uretici: "drexilo", tohum: "u-hiztren" }),
  u({ slug: "60lar-kafe", ad: "60'lar Kafe", ozet: "Fotoğrafını vintage bir 60'lar kafe sahnesine çevir", kategori: "Trend Şablonlar", cikti: "video", kredi: 15, tohum: "u-60kafe" }),
  u({ slug: "zafer-karti", ad: "Zafer Kartı", ozet: "Fotoğrafını kazanan bir poker kartına dönüştür", kategori: "Trend Şablonlar", vurgu: "FOTOĞRAFINI KAZANAN POKER KARTINA ÇEVİR", cikti: "video", kredi: 15, uretici: "nexara", tohum: "u-zafer" }),
  u({ slug: "kum-solucani", ad: "Kum Solucanı", ozet: "Kendini bir kum dünyası karakter sahnesine dönüştür", kategori: "Trend Şablonlar", vurgu: "FOTOĞRAFINI KUM DÜNYASI KARAKTERİNE ÇEVİR", cikti: "video", kredi: 26, tohum: "u-solucan" }),
  u({ slug: "skibidi", ad: "Skibidi", ozet: "Fotoğrafını Skibidi tuvalet meme'ine çevir", kategori: "Trend Şablonlar", vurgu: "FOTOĞRAFINI SKIBIDI MEME'İNE ÇEVİR", cikti: "video", kredi: 23, uretici: "flomira", tohum: "u-skibidi" }),
  u({ slug: "j-poster", ad: "J-Poster", ozet: "Fotoğrafını Japon tarzı bir postere çevir", kategori: "Trend Şablonlar", cikti: "gorsel", kredi: 2, tohum: "u-jposter" }),
  u({ slug: "maskot", ad: "Maskot", ozet: "Fotoğrafını bir futbol maskotu karakterine dönüştür", kategori: "Trend Şablonlar", cikti: "video", kredi: 15, tohum: "u-maskot" }),
  u({ slug: "firtina-yaratigi", ad: "Fırtına Yaratığı", ozet: "Fotoğrafını destansı bir fırtına yaratığı sahnesine çevir", kategori: "Trend Şablonlar", cikti: "video", kredi: 16, tohum: "u-firtina" }),
  u({ slug: "yanan-gun-batimi", ad: "Yanan Gün Batımı", ozet: "Fotoğrafını destansı bir yanan gün batımı sahnesine dönüştür", kategori: "Trend Şablonlar", cikti: "video", kredi: 15, tohum: "u-gunbatimi" }),
  u({ slug: "alevler-icinde", ad: "Alevler İçinde", ozet: "Fotoğrafını ikonik \"Bu İyi\" meme'ine çevir", kategori: "Trend Şablonlar", vurgu: "FOTOĞRAFINI İKONİK MEME'E ÇEVİR", cikti: "video", kredi: 19, uretici: "velquix", tohum: "u-alev" }),
  u({ slug: "cizgi-roman", ad: "Çizgi Roman", ozet: "Fotoğrafını çizgi roman sanat stiline dönüştür", kategori: "Trend Şablonlar", cikti: "gorsel", kredi: 2, tohum: "u-cizgi" }),
  u({ slug: "bulut-surfu", ad: "Bulut Sörfü", ozet: "Fotoğrafını rüya gibi pembe bir bulut sörfü sahnesine çevir", kategori: "Trend Şablonlar", cikti: "video", kredi: 15, tohum: "u-bulut" }),
  u({ slug: "mukbang", ad: "Mukbang", ozet: "Fotoğrafını viral bir yemek şovuna dönüştür", kategori: "Trend Şablonlar", vurgu: "FOTOĞRAFINI YEMEK ŞOVUNA ÇEVİR", cikti: "video", kredi: 16, uretici: "fronzila", tohum: "u-mukbang" }),
  u({ slug: "eriyen-karalama", ad: "Eriyen Karalama", ozet: "Fotoğrafını büyüleyici eriyen karalama sanatına çevir", kategori: "Trend Şablonlar", cikti: "video", kredi: 15, tohum: "u-eriyen" }),
  u({ slug: "giallo-korku", ad: "Giallo Korku", ozet: "Fotoğrafını bir giallo korku sahnesine dönüştür", kategori: "Trend Şablonlar", cikti: "video", kredi: 16, tohum: "u-giallo" }),
  u({ slug: "ronesans", ad: "Rönesans", ozet: "Fotoğrafını klasik bir galeri tablosuna çevir", kategori: "Trend Şablonlar", vurgu: "FOTOĞRAFINI GALERİ TABLOSUNA ÇEVİR", cikti: "video", kredi: 15, uretici: "plixora", tohum: "u-ronesans" }),
  u({ slug: "rap-tanrisi", ad: "Rap Tanrısı", ozet: "Fotoğrafını bir rap klibine dönüştür", kategori: "Trend Şablonlar", vurgu: "FOTOĞRAFINI RAP KLİBİNE ÇEVİR", cikti: "video", kredi: 23, uretici: "dravilo", tohum: "u-rap" }),
  u({ slug: "sabika-fotografi", ad: "Sabıka Fotoğrafı", ozet: "Fotoğrafını dramatik bir sabıka sahnesine çevir", kategori: "Trend Şablonlar", vurgu: "FOTOĞRAFINI SABIKA SAHNESİNE ÇEVİR", cikti: "video", kredi: 16, uretici: "venquira", tohum: "u-sabika" }),
  u({ slug: "gulyabani", ad: "Gulyabani", ozet: "Fotoğrafını bir gulyabani korku sahnesine dönüştür", kategori: "Trend Şablonlar", cikti: "video", kredi: 16, tohum: "u-gulyabani" }),
  u({ slug: "sosyal-medya-ikonu", ad: "Sosyal Medya İkonu", ozet: "Fotoğrafına animasyonlu sosyal medya ikonları ekle", kategori: "Trend Şablonlar", vurgu: "FOTOĞRAFINA SOSYAL MEDYA İKONLARI EKLE", cikti: "video", kredi: 15, uretici: "lomzaro", tohum: "u-smikon" }),
  u({ slug: "idol", ad: "İdol", ozet: "Fotoğrafını bir K-pop idol anına dönüştür", kategori: "Trend Şablonlar", cikti: "video", kredi: 15, tohum: "u-idol" }),
  u({ slug: "muz-yeme", ad: "Muz Yeme", ozet: "Fotoğrafını bir muz yeme sahnesine çevir", kategori: "Trend Şablonlar", cikti: "video", kredi: 15, tohum: "u-muz" }),
];

/** Kategoriye göre grupla (bölüm sırası korunur). */
export function bolumeGore(): { ad: string; ozet: string; uygulamalar: Uyg[] }[] {
  return UYG_BOLUMLERI.map((b) => ({
    ...b,
    uygulamalar: UYGULAMALAR.filter((x) => x.kategori === b.ad),
  })).filter((b) => b.uygulamalar.length > 0);
}

export function uygulamaBul(slug: string): Uyg | undefined {
  return UYGULAMALAR.find((x) => x.slug === slug);
}
