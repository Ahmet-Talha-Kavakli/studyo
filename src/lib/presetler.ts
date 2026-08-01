/**
 * Preset kütüphaneleri — Pazarlama & video studio'ları için stil/hook/sahne
 * hazır ayarları. Tamamen özgün Vayra içeriği. Her preset prompt'a eklenir.
 */

export interface Preset {
  id: string;
  ad: string;
  ozet: string;
  kategori: string;
  tohum: string; // önizleme gradyanı için
  prompt: string; // prompt'a eklenecek metin
}

export interface PresetGrubu {
  anahtar: "stil" | "hook" | "sahne";
  etiket: string;
  kategoriler: string[];
  presetler: Preset[];
}

export const PAZARLAMA_PRESETLERI: PresetGrubu[] = [
  {
    anahtar: "stil",
    etiket: "Stil",
    kategoriler: ["Tümü", "TikTok", "UGC", "Reklam", "Sinematik"],
    presetler: [
      { id: "s1", ad: "TikTok Enerjik", ozet: "Hızlı kesim, dikey, ham enerji", kategori: "TikTok", tohum: "pz-s1", prompt: "TikTok tarzı hızlı kesimli dikey enerjik reklam" },
      { id: "s2", ad: "UGC Samimi", ozet: "El kamerası, gerçek kullanıcı hissi", kategori: "UGC", tohum: "pz-s2", prompt: "UGC tarzı samimi el kamerası, gerçek kullanıcı anlatımı" },
      { id: "s3", ad: "Vitrin Reklam", ozet: "Temiz stüdyo, ürün odaklı", kategori: "Reklam", tohum: "pz-s3", prompt: "temiz stüdyo ışığında ürün odaklı profesyonel reklam" },
      { id: "s4", ad: "Sinematik Anlatı", ozet: "Geniş açı, sığ alan derinliği", kategori: "Sinematik", tohum: "pz-s4", prompt: "sinematik geniş açı, sığ alan derinliği, film grenli reklam" },
      { id: "s5", ad: "Sokak Röportajı", ozet: "Spontane, kalabalık arka plan", kategori: "UGC", tohum: "pz-s5", prompt: "sokak röportajı tarzı spontane, kalabalık arka plan" },
      { id: "s6", ad: "Ürün Tanıtımı", ozet: "360° dönen ürün, makro", kategori: "Reklam", tohum: "pz-s6", prompt: "360 derece dönen ürün, makro çekim, temiz zemin" },
      { id: "s7", ad: "Trend Klip", ozet: "Popüler geçişler, hızlı ritim", kategori: "TikTok", tohum: "pz-s7", prompt: "trend geçişler, hızlı ritim, popüler TikTok formatı" },
      { id: "s8", ad: "Marka Filmi", ozet: "Duygusal, yavaş, atmosferik", kategori: "Sinematik", tohum: "pz-s8", prompt: "duygusal marka filmi, yavaş tempolu, atmosferik ışık" },
    ],
  },
  {
    anahtar: "hook",
    etiket: "Kanca",
    kategoriler: ["Tümü", "Şok", "Yumuşak", "Soru", "İstatistik"],
    presetler: [
      { id: "h1", ad: "Şaşırtıcı Açılış", ozet: "İlk 2 saniyede beklenmedik an", kategori: "Şok", tohum: "pz-h1", prompt: "ilk iki saniyede şaşırtıcı, beklenmedik açılış" },
      { id: "h2", ad: "Merak Sorusu", ozet: "İzleyiciye doğrudan soru", kategori: "Soru", tohum: "pz-h2", prompt: "izleyiciye doğrudan merak uyandıran soruyla başla" },
      { id: "h3", ad: "Çarpıcı İstatistik", ozet: "Rakamla dikkat çek", kategori: "İstatistik", tohum: "pz-h3", prompt: "çarpıcı bir istatistik/rakamla dikkat çekerek başla" },
      { id: "h4", ad: "Yumuşak Giriş", ozet: "Sakin, güven veren ton", kategori: "Yumuşak", tohum: "pz-h4", prompt: "sakin, güven veren yumuşak bir tonla başla" },
      { id: "h5", ad: "Önce/Sonra", ozet: "Dönüşümü hemen göster", kategori: "Şok", tohum: "pz-h5", prompt: "önce/sonra dönüşümünü ilk saniyede göster" },
      { id: "h6", ad: "Sır Vaadi", ozet: "\"Kimsenin bilmediği...\"", kategori: "Soru", tohum: "pz-h6", prompt: "bir sır/az bilinen bilgi vaadiyle başla" },
    ],
  },
  {
    anahtar: "sahne",
    etiket: "Sahne",
    kategoriler: ["Tümü", "Gerçekçi", "Stüdyo", "Dış Mekan", "Soyut"],
    presetler: [
      { id: "sa1", ad: "Modern Ofis", ozet: "Aydınlık, minimal, kurumsal", kategori: "Gerçekçi", tohum: "pz-sa1", prompt: "modern aydınlık minimal ofis ortamı" },
      { id: "sa2", ad: "Beyaz Stüdyo", ozet: "Sonsuz beyaz zemin", kategori: "Stüdyo", tohum: "pz-sa2", prompt: "sonsuz beyaz stüdyo zemini, yumuşak ışık" },
      { id: "sa3", ad: "Şehir Sokağı", ozet: "Neon, hareket, kalabalık", kategori: "Dış Mekan", tohum: "pz-sa3", prompt: "gece şehir sokağı, neon ışıklar, hareket" },
      { id: "sa4", ad: "Doğa/Kır", ozet: "Gün ışığı, yeşil, huzur", kategori: "Dış Mekan", tohum: "pz-sa4", prompt: "doğal kır manzarası, altın saat gün ışığı" },
      { id: "sa5", ad: "Soyut Gradyan", ozet: "Renkli akışkan arka plan", kategori: "Soyut", tohum: "pz-sa5", prompt: "soyut renkli akışkan gradyan arka plan" },
      { id: "sa6", ad: "Ev/Salon", ozet: "Sıcak, yaşayan mekan", kategori: "Gerçekçi", tohum: "pz-sa6", prompt: "sıcak, yaşayan ev salonu ortamı" },
    ],
  },
];

/**
 * Viral VFX Preset koleksiyonu — tek tıkla büyük-bütçe efekt şablonları.
 * Higgsfield "Viral Presets" karşılığı; olustur (video/görsel) modunda prompt'a eklenir.
 * Tamamen özgün Vayra içeriği.
 */
export interface VFXPreset {
  id: string;
  ad: string;
  ozet: string;
  kategori: "Efekt" | "Dönüşüm" | "Aksiyon" | "Sinematik";
  emoji: string;
  tohum: string;
  prompt: string;
}

export const VIRAL_VFX_PRESETLER: VFXPreset[] = [
  { id: "vfx1", ad: "Patlama", ozet: "Sinematik patlama, kıvılcım, yavaş çekim", kategori: "Efekt", emoji: "💥", tohum: "vfx-patlama", prompt: "sinematik büyük patlama, uçuşan kıvılcımlar, yavaş çekim şok dalgası, hyper-detaylı" },
  { id: "vfx2", ad: "Drift Yarış", ozet: "Lastik dumanı, hız çizgileri, düşük açı", kategori: "Aksiyon", emoji: "🏎️", tohum: "vfx-drift", prompt: "drift yarış sahnesi, lastik dumanı, hız çizgileri, düşük açı kamera, dinamik hareket bulanıklığı" },
  { id: "vfx3", ad: "CGI Çözümleme", ozet: "Wireframe→render dönüşümü", kategori: "Dönüşüm", emoji: "🧩", tohum: "vfx-cgi", prompt: "CGI breakdown, wireframe'den fotogerçekçi render'a dönüşüm, teknik katman geçişi" },
  { id: "vfx4", ad: "Kung Fu Vuruş", ozet: "Impact anı, hız çizgileri, toz", kategori: "Aksiyon", emoji: "🥋", tohum: "vfx-kungfu", prompt: "kung fu dövüş sahnesi, darbe anı freeze, hız çizgileri, toz patlaması, sinematik" },
  { id: "vfx5", ad: "Fırtına Devi", ozet: "Dev bulut varlık, şimşek", kategori: "Sinematik", emoji: "🌩️", tohum: "vfx-storm", prompt: "devasa fırtına devi, bulutlardan oluşan yaratık, şimşek gözler, epik ölçek, sinematik" },
  { id: "vfx6", ad: "Android Montaj", ozet: "Robot parça parça birleşir", kategori: "Dönüşüm", emoji: "🤖", tohum: "vfx-android", prompt: "android/robot parçalarının havada birleşip montajlanması, metalik yüzey, mekanik detay" },
  { id: "vfx7", ad: "3D Render", ozet: "Studio stüdyo, temiz render", kategori: "Sinematik", emoji: "🧊", tohum: "vfx-3d", prompt: "yüksek kalite 3D render, stüdyo ışığı, subsurface scattering, temiz kompozisyon" },
  { id: "vfx8", ad: "Sıvı Dönüşüm", ozet: "Cıva gibi morph geçiş", kategori: "Dönüşüm", emoji: "🌊", tohum: "vfx-liquid", prompt: "sıvı metal (cıva) morph dönüşümü, akışkan yüzey, yansıma, gerçekçi simülasyon" },
  { id: "vfx9", ad: "Bullet Time", ozet: "Donmuş an, 360° kamera", kategori: "Aksiyon", emoji: "🕶️", tohum: "vfx-bullet", prompt: "bullet time efekti, zamanda donmuş an, 360 derece dönen kamera, uçuşan parçacıklar" },
  { id: "vfx10", ad: "Yaz Sisi", ozet: "Sıcak, dreamy, ışık huzmesi", kategori: "Sinematik", emoji: "☀️", tohum: "vfx-summer", prompt: "yaz sisi estetiği, sıcak dreamy ton, ışık huzmeleri, nostaljik film grenli" },
  { id: "vfx11", ad: "Mavi Derinlik", ozet: "Su altı, ışık kırılması", kategori: "Sinematik", emoji: "🌌", tohum: "vfx-blue", prompt: "mavi derinlik su altı sahnesi, ışık kırılması, kabarcıklar, atmosferik perspektif" },
  { id: "vfx12", ad: "Neon Glitch", ozet: "Dijital bozulma, siberpunk", kategori: "Efekt", emoji: "⚡", tohum: "vfx-glitch", prompt: "neon glitch efekti, dijital bozulma, siberpunk renkler, tarama çizgileri, RGB kayması" },
];

/**
 * Kamera Kontrolleri kütüphanesi — Higgsfield "Camera Controls" karşılığı.
 * Her hareket kategorili + açıklamalı; video üretiminde prompt'a eklenir.
 */
export interface KameraHareket {
  id: string;
  ad: string;
  ozet: string;
  kategori: "Yakınlaş" | "Yörünge" | "Kaydırma" | "Dinamik" | "Sabit";
  prompt: string;
}

export const KAMERA_HAREKETLERI: KameraHareket[] = [
  { id: "kam-auto", ad: "Otomatik", ozet: "AI en uygun hareketi seçer", kategori: "Sabit", prompt: "" },
  { id: "kam-dollyin", ad: "Dolly In", ozet: "Özneye doğru yumuşak yaklaşma", kategori: "Yakınlaş", prompt: "kamera özneye doğru yumuşak dolly in hareketi" },
  { id: "kam-dollyout", ad: "Dolly Out", ozet: "Özneden geriye açılma", kategori: "Yakınlaş", prompt: "kamera özneden geriye dolly out ile açılıyor" },
  { id: "kam-zoomin", ad: "Zoom In", ozet: "Optik yakınlaştırma", kategori: "Yakınlaş", prompt: "hızlı optik zoom in, detaya odak" },
  { id: "kam-orbit", ad: "Orbit", ozet: "Özne etrafında 360° dönüş", kategori: "Yörünge", prompt: "kamera özne etrafında 360 derece orbit hareketi" },
  { id: "kam-arc", ad: "Yay (Arc)", ozet: "Yarım daire yörünge", kategori: "Yörünge", prompt: "kamera yarım daire yay çizerek özneyi dönüyor" },
  { id: "kam-pan", ad: "Pan", ozet: "Yatay tarama", kategori: "Kaydırma", prompt: "yatay pan hareketi, sahneyi sağdan sola tarıyor" },
  { id: "kam-tilt", ad: "Tilt", ozet: "Dikey tarama", kategori: "Kaydırma", prompt: "dikey tilt hareketi, aşağıdan yukarı açılım" },
  { id: "kam-truck", ad: "Truck", ozet: "Yatay yana kayma", kategori: "Kaydırma", prompt: "kamera yatay truck ile yana kayıyor, paralaks etkisi" },
  { id: "kam-crane", ad: "Crane", ozet: "Dikey vinç yükselişi", kategori: "Dinamik", prompt: "crane ile dikey yükselen kamera, geniş açılım" },
  { id: "kam-handheld", ad: "Handheld", ozet: "El kamerası, doğal titreşim", kategori: "Dinamik", prompt: "handheld el kamerası, doğal titreşim, gerçekçi his" },
  { id: "kam-fpv", ad: "FPV Drone", ozet: "Akışkan drone uçuşu", kategori: "Dinamik", prompt: "cinematic FPV drone, tek çekim akışkan uçuş, hızlı geçişler" },
  { id: "kam-bullet", ad: "Bullet Time", ozet: "Donmuş an, 360° kayış", kategori: "Dinamik", prompt: "bullet time, donmuş an etrafında dönen kamera" },
  { id: "kam-static", ad: "Sabit", ozet: "Tripod, hareketsiz çerçeve", kategori: "Sabit", prompt: "sabit tripod kamera, hareketsiz stabil çerçeve" },
];

/**
 * Metin render (poster/afiş) tasarım tipleri — Higgsfield "4K near-perfect text
 * rendering" karşılığı. Görselin içine okunabilir tipografi yerleştirir.
 */
export interface MetinTip {
  id: string;
  ad: string;
  emoji: string;
  prompt: string;
}

export const METIN_TASARIM_TIPLERI: MetinTip[] = [
  { id: "mt-poster", ad: "Poster", emoji: "🎨", prompt: "grafik poster tasarımı, güçlü tipografi hiyerarşisi, okunabilir keskin metin" },
  { id: "mt-dergi", ad: "Dergi Kapağı", emoji: "📖", prompt: "editorial dergi kapağı düzeni, başlık + alt başlık, profesyonel tipografi" },
  { id: "mt-afis", ad: "Afiş", emoji: "🪧", prompt: "etkinlik afişi, büyük çarpıcı başlık, tarih ve detay metinleri net" },
  { id: "mt-logo", ad: "Logo", emoji: "✳️", prompt: "minimal logo tasarımı, temiz vektörel metin, marka kimliği" },
  { id: "mt-sosyal", ad: "Sosyal Kart", emoji: "📱", prompt: "sosyal medya kartı, dikkat çekici başlık overlay, okunabilir kısa metin" },
  { id: "mt-urun", ad: "Ürün Etiketi", emoji: "🏷️", prompt: "ürün ambalaj/etiket tasarımı, marka adı ve bilgi metni net basılı" },
];
