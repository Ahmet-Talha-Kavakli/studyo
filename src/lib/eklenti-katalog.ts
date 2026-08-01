/**
 * EKLENTİ KATALOĞU — Higgsfield /plugins TIPATIP Türkçe klonu
 * -----------------------------------------------------------
 * Higgsfield'da 5 eklenti var. Hepsi TEK dinamik rota ile render edilir
 * (/panel/eklentiler/[slug]). Bu dosya her eklentinin verisini tutar:
 * slug, ad, hedef uygulama, hero metni, adımlar, özellik blokları, renk.
 *
 * Marka aksanı yine cyan (--color-aksan). Buradaki `vurgu` renkleri
 * SADECE ilgili uygulamanın kimliğini yansıtan dekoratif hero gradyanı
 * içindir (Photoshop mavi, Premiere mor, DaVinci turuncu vb.).
 */

export type EklentiOzellik = {
  /** BÜYÜK HARF başlık */
  baslik: string;
  /** Açıklama paragrafı */
  metin: string;
  /** Mockup kartı için stok görsel kategorisi */
  kategori: string;
};

export type EklentiAdim = {
  /** Kart içindeki emoji/ikon illüstrasyon */
  emoji: string;
  /** BÜYÜK HARF adım başlığı (panel dışında) */
  baslik: string;
  /** Adım açıklaması (panel dışında) */
  metin: string;
};

export type Eklenti = {
  slug: string;
  /** Kısa ad (kart + hero) */
  ad: string;
  /** Hedef uygulama tam adı ("Adobe Photoshop") */
  uygulama: string;
  /** Kart alt etiketi / kategori */
  etiket: string;
  /** Hero büyük açıklama */
  aciklama: string;
  /** Kart ve index için tek satır kısa açıklama */
  kisa: string;
  /** Dekoratif hero gradyanı (uygulama kimliği) */
  vurgu: string;
  /** Hero rozet metni (uygulama tipi) */
  rozet: string;
  /** İndir CTA metni */
  ctaMetin: string;
  /** "Üç adımda başla" başlığı (Minecraft'ta farklı) */
  adimBaslik: string;
  /** İşletim sistemi mi yoksa oyun sürümü mü segmenti */
  segmentTipi: "os" | "surum";
  /** 3 adım */
  adimlar: [EklentiAdim, EklentiAdim, EklentiAdim];
  /** 2-3 özellik bloğu */
  ozellikler: EklentiOzellik[];
  /** Stok görsel kategorisi (hero mockup) */
  kategori: string;
};

/** Ortak Adobe eklentisi adımları (macOS/.DMG akışı). */
function adobeAdimlar(uygulama: string): [EklentiAdim, EklentiAdim, EklentiAdim] {
  return [
    {
      emoji: "💿",
      baslik: ".DMG'Yİ İNDİR",
      metin: "Yükleyici dosyasını indir ve indirilenler klasöründen aç.",
    },
    {
      emoji: "✅",
      baslik: "YÜKLEYİCİYİ ÇALIŞTIR",
      metin: "Kurulum sihirbazını takip et; birkaç saniyede tamamlanır.",
    },
    {
      emoji: "🎨",
      baslik: `${uygulama.toUpperCase()}'Yİ AÇ, VAYRA'YI BUL`,
      metin: "Eklentiler menüsünden Vayra'yı seç ve üretmeye başla.",
    },
  ];
}

export const EKLENTILER: Eklenti[] = [
  {
    slug: "photoshop",
    ad: "Photoshop",
    uygulama: "Adobe Photoshop",
    etiket: "Görsel Düzenleme",
    rozet: "ADOBE EKLENTİSİ",
    kisa: "Vayra'nın üretken gücünü doğrudan Photoshop katmanlarına getir.",
    aciklama:
      "Yeniden çerçeveleme, arka plan kaldırma ve yükseltmeyi Photoshop'tan hiç çıkmadan yap. Katmanların canlı kalır, iş akışın bölünmez.",
    vurgu: "linear-gradient(135deg,#001e36 0%,#0a5cff 55%,#31a8ff 100%)",
    ctaMetin: "Photoshop İçin İndir",
    adimBaslik: "ÜÇ ADIMDA BAŞLA",
    segmentTipi: "os",
    adimlar: adobeAdimlar("Photoshop"),
    kategori: "portre",
    ozellikler: [
      {
        baslik: "YENİDEN ÇERÇEVELE",
        metin:
          "Herhangi bir orana kırp; Vayra kenarları akıllıca doldurur, kompozisyonu bozmaz. Instagram karesinden sinema 21:9'a tek tıkla geç.",
        kategori: "portre",
      },
      {
        baslik: "ARKA PLANI KALDIR",
        metin:
          "Konuyu piksel piksel kes, saç tellerine kadar temiz maske al. Şeffaf PNG olarak katman olarak geri döner.",
        kategori: "urun",
      },
      {
        baslik: "YÜKSELT",
        metin:
          "Düşük çözünürlüklü görselleri 4K'ya çıkar. Detaylar keskinleşir, gürültü temizlenir, baskıya hazır olur.",
        kategori: "soyut",
      },
    ],
  },
  {
    slug: "premiere-pro",
    ad: "Premiere Pro",
    uygulama: "Adobe Premiere Pro",
    etiket: "Video Kurgu",
    rozet: "ADOBE EKLENTİSİ",
    kisa: "Zaman çizelgesini terk etmeden AI video araçlarını kurguya kat.",
    aciklama:
      "Klipleri yeniden çerçevele, arka planı temizle ve çözünürlüğü yükselt — hepsi Premiere Pro zaman çizelgesinin içinde. Render'ı bekleme, akışta kal.",
    vurgu: "linear-gradient(135deg,#2a0845 0%,#6441a5 55%,#9d5cff 100%)",
    ctaMetin: "Premiere Pro İçin İndir",
    adimBaslik: "ÜÇ ADIMDA BAŞLA",
    segmentTipi: "os",
    adimlar: adobeAdimlar("Premiere Pro"),
    kategori: "sinematik",
    ozellikler: [
      {
        baslik: "YENİDEN ÇERÇEVELE",
        metin:
          "Yatay çekimi dikey Reels'e veya kareye dönüştür. Vayra konuyu takip eder, önemli anı kadrajda tutar.",
        kategori: "sinematik",
      },
      {
        baslik: "ARKA PLANI KALDIR",
        metin:
          "Yeşil perde olmadan konuyu ayır. Kare kare temiz alpha maske, kompozisyona hazır katman olarak döner.",
        kategori: "portre",
      },
      {
        baslik: "YÜKSELT",
        metin:
          "Arşiv görüntüsünü veya düşük çözünürlüklü klipleri 4K'ya taşı. Detay üretir, kompresyon izlerini siler.",
        kategori: "manzara",
      },
    ],
  },
  {
    slug: "davinci",
    ad: "DaVinci Resolve",
    uygulama: "DaVinci Resolve",
    etiket: "Renk & Kurgu",
    rozet: "RESOLVE EKLENTİSİ",
    kisa: "Renk odasının gücüne Vayra'nın üretken AI'ını ekle.",
    aciklama:
      "Renk sayfasında kal, Vayra ağır işi yapsın. Yeniden çerçeveleme, arka plan ayırma ve yükseltme doğrudan node grafiğine gelir.",
    vurgu: "linear-gradient(135deg,#3d1400 0%,#c2410c 55%,#fb923c 100%)",
    ctaMetin: "DaVinci İçin İndir",
    adimBaslik: "ÜÇ ADIMDA BAŞLA",
    segmentTipi: "os",
    adimlar: [
      {
        emoji: "💿",
        baslik: ".DMG'Yİ İNDİR",
        metin: "Resolve eklenti paketini indir ve indirilenlerden aç.",
      },
      {
        emoji: "✅",
        baslik: "YÜKLEYİCİYİ ÇALIŞTIR",
        metin: "Kurulumu tamamla; Resolve yeniden başlatıldığında hazır olur.",
      },
      {
        emoji: "🎨",
        baslik: "RESOLVE'U AÇ, VAYRA'YI BUL",
        metin: "Workspace menüsünden Vayra panelini aç ve üretmeye başla.",
      },
    ],
    kategori: "sinematik",
    ozellikler: [
      {
        baslik: "YENİDEN ÇERÇEVELE",
        metin:
          "Teslimat oranını değiştir; Vayra kadrajı korur, konuyu ortalar. Dikey ve yatay çıktılar tek zaman çizelgesinden.",
        kategori: "manzara",
      },
      {
        baslik: "ARKA PLANI KALDIR",
        metin:
          "Konu ile arka planı ayır, temiz matte üret. Renk düzeltmesini konu ve zemin için bağımsız uygula.",
        kategori: "portre",
      },
      {
        baslik: "YÜKSELT",
        metin:
          "SD arşivi HD/4K'ya yükselt. Grain'i korur, detay üretir, baskı ve yayın için hazırlar.",
        kategori: "soyut",
      },
    ],
  },
  {
    slug: "after-effects",
    ad: "After Effects",
    uygulama: "Adobe After Effects",
    etiket: "Hareket Grafikleri",
    rozet: "ADOBE EKLENTİSİ",
    kisa: "Kompozisyonlarına üretken AI katmanları ekle, render'da kal.",
    aciklama:
      "After Effects kompozisyonundan çıkmadan yeniden çerçevele, arka planı ayır ve yükselt. Katmanlar canlı, ifadelerin bozulmaz.",
    vurgu: "linear-gradient(135deg,#1a0033 0%,#7c3aed 55%,#a78bfa 100%)",
    ctaMetin: "After Effects İçin İndir",
    adimBaslik: "ÜÇ ADIMDA BAŞLA",
    segmentTipi: "os",
    adimlar: adobeAdimlar("After Effects"),
    kategori: "soyut",
    ozellikler: [
      {
        baslik: "YENİDEN ÇERÇEVELE",
        metin:
          "Kompozisyon oranını değiştir; Vayra içeriği akıllıca yeniden yerleştirir. Sosyal formatlara saniyeler içinde uyarla.",
        kategori: "soyut",
      },
      {
        baslik: "ARKA PLANI KALDIR",
        metin:
          "Roto'ya saatler harcama. Vayra kare kare temiz alpha çıkarır, katman olarak kompozisyona döner.",
        kategori: "portre",
      },
      {
        baslik: "YÜKSELT",
        metin:
          "Düşük çözünürlüklü kaynağı yükselt, motion graphics'i keskinleştir. 4K teslimat için hazır katman.",
        kategori: "sinematik",
      },
    ],
  },
  {
    slug: "minecraft",
    ad: "Minecraft",
    uygulama: "Minecraft",
    etiket: "Oyun İçi Üretim",
    rozet: "OYUN MODU",
    kisa: "Vayra'yı dünyanın içine getir — sohbete yaz, yapı belirsin.",
    aciklama:
      "Minecraft dünyanın içinden komut yaz, Vayra yapıları ve dokuları senin için üretsin. Yaratıcı moddan hiç çıkma, sadece hayal et.",
    vurgu: "linear-gradient(135deg,#0f2b0f 0%,#3ca340 55%,#8bd84b 100%)",
    ctaMetin: "Mod'u İndir",
    adimBaslik: "DÜNYANDA ÜRET",
    segmentTipi: "surum",
    adimlar: [
      {
        emoji: "🧱",
        baslik: "MOD'U İNDİR",
        metin: "Vayra mod dosyasını indir ve mods klasörüne kopyala.",
      },
      {
        emoji: "🎮",
        baslik: "OYUNU BAŞLAT",
        metin: "Fabric yükleyiciyle profili seç ve dünyayı başlat.",
      },
      {
        emoji: "✨",
        baslik: "SOHBETE YAZ, ÜRET",
        metin: "Sohbet kutusuna komut gir; yapılar dünyanda belirsin.",
      },
    ],
    kategori: "manzara",
    ozellikler: [
      {
        baslik: "YAPILARI ÜRET",
        metin:
          "Sohbete 'ortaçağ kalesi' yaz, Vayra bloğu bloğa kursun. Dev şatolar ve şehirler saniyeler içinde belirir.",
        kategori: "manzara",
      },
      {
        baslik: "DOKU ÜRET",
        metin:
          "Kendi doku paketini komutla oluştur. Vayra blokları senin tarzına göre yeniden boyar.",
        kategori: "soyut",
      },
      {
        baslik: "DÜNYAYI GENİŞLET",
        metin:
          "Var olan bir yapıyı büyüt veya devam ettir. Vayra çevreye uyumlu yeni bölgeler ekler.",
        kategori: "sinematik",
      },
    ],
  },
  {
    slug: "figma",
    ad: "Figma",
    uygulama: "Figma",
    etiket: "Tasarım Aracı",
    rozet: "YENİ",
    kisa: "Tasarım tuvalini terk etmeden AI görsel & video araçlarını kullan.",
    aciklama:
      "Figma dosyanın içinden görsel ve video üret, yeniden çerçevele, arka planı temizle. Prototiplerin canlansın, iş akışın bölünmesin.",
    vurgu: "linear-gradient(135deg,#1e1b2e 0%,#a259ff 55%,#f24e1e 100%)",
    ctaMetin: "Figma İçin Ekle",
    adimBaslik: "FİGMA'DA ÜRET",
    segmentTipi: "os",
    adimlar: [
      {
        emoji: "🧩",
        baslik: "EKLENTİYİ EKLE",
        metin: "Figma Community'den Vayra eklentisini çalışma alanına ekle.",
      },
      {
        emoji: "🎨",
        baslik: "TASARIMI SEÇ",
        metin: "Bir çerçeve ya da katman seç, Vayra panelini aç.",
      },
      {
        emoji: "✨",
        baslik: "ÜRET & YERLEŞTİR",
        metin: "Komut yaz; üretilen görsel/video doğrudan tuvaline düşsün.",
      },
    ],
    kategori: "soyut",
    ozellikler: [
      {
        baslik: "GÖRSEL ÜRET",
        metin:
          "Tasarımına uygun görselleri Figma içinde üret. Marka paletine sadık, tuvale hazır çıktı.",
        kategori: "portre",
      },
      {
        baslik: "PROTOTİPİ CANLANDIR",
        metin:
          "Statik ekranları kısa videolara çevir. Sunumların ve akışların hareketlensin.",
        kategori: "sinematik",
      },
      {
        baslik: "ARKA PLANI TEMİZLE",
        metin:
          "Seçili katmanın arka planını tek tıkla kaldır. Şeffaf varlıklar anında hazır.",
        kategori: "urun",
      },
    ],
  },
];

/** slug'a göre eklenti bulur (bulunamazsa undefined). */
export function eklentiBul(slug: string): Eklenti | undefined {
  return EKLENTILER.find((e) => e.slug === slug);
}
