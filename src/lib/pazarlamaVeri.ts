/* ============================================================
   PAZARLAMA STÜDYOSU — VERİ KATMANI
   Referans: referanslar/marketing/* (119 ekran görüntüsü)

   Higgsfield /marketing-studio birebir. Tüm metinler Türkçe.

   ŞEMA KURALI (kullanıcının verdiği ayrım + referans doğrulaması):
     sema "tam"  → composer çip satırı: [Stil][Kanca][Ortam][Ayar]
                   ve Kanca seçilince ÜSTTE "Kanca istemi" şeridi
     sema "sade" → composer çip satırı: [Stil][Ayar]  (Kanca/Ortam YOK)
   ============================================================ */

/* ══════════════════ STİL (PRESET) KATALOĞU ══════════════════ */

export type StilRenk =
  | "camgobegi" | "macenta" | "pembe" | "menekse" | "turkuaz"
  | "lime" | "yesil" | "turuncu";

export const STIL_GRADYAN: Record<StilRenk, string> = {
  camgobegi: "linear-gradient(135deg,#4FC3F7,#2196F3)",
  macenta: "linear-gradient(135deg,#E14A8B,#C0392B)",
  pembe: "linear-gradient(135deg,#EC4899,#DC2626)",
  menekse: "linear-gradient(135deg,#8B5CF6,#EC4899)",
  turkuaz: "linear-gradient(135deg,#5EEAD4,#7C3AED)",
  lime: "var(--sn-lime,#c8fa4b)",
  yesil: "linear-gradient(135deg,#A3E635,#16A34A)",
  turuncu: "linear-gradient(135deg,#FB923C,#DC2626)",
};

/** Lime rozetli stillerde glif KOYU olur (referans: sanal deneme ailesi). */
export const STIL_GLIF_KOYU: StilRenk[] = ["lime"];

/** "tam" → Kanca+Ortam var · "sade" → yok (referans: uretme-paneli-product/2). */
export type PanelSema = "tam" | "sade";

/** Ana sayfa + stil modalı filtre sekmeleri. */
export type StilTur = "TikTok" | "UGC" | "Ticari";

export interface PazStil {
  slug: string;
  ad: string;
  ozet: string;
  renk: StilRenk;
  ikon: string;
  tur: StilTur;
  /** Kart üstünde "Symphony / Vayra" ortak marka şeridi. */
  markaSerit?: boolean;
  sema: PanelSema;
  /** Bu stilin varsayılan süresi (referans: sade şemada 10 sn, tamda 15 sn). */
  sure: string;
  tohumlar: [string, string, string];
}

/* Referanstaki 26 stil, ızgara sırası birebir.
   `tam` olanlar kullanıcının saydığı 18 stil; kalan 8'i `sade`. */
export const PAZ_STILLER: PazStil[] = [
  { slug: "ugc", ad: "UGC", ozet: "Gerçekçi sosyal medya videoları",
    renk: "camgobegi", ikon: "user-square", tur: "UGC", sema: "tam", sure: "15 sn",
    tohumlar: ["paz-ugc-1", "paz-ugc-2", "paz-ugc-3"] },

  { slug: "bu-cihaz-beni-kurtardi", ad: "Bu Cihaz Beni Kurtardı",
    ozet: "Ürün özelliklerini içerik üreticisi tavsiyesine çevir",
    renk: "macenta", ikon: "smartphone", tur: "TikTok", markaSerit: true, sema: "tam", sure: "15 sn",
    tohumlar: ["paz-cihaz-1", "paz-cihaz-2", "paz-cihaz-3"] },

  { slug: "dev-figur", ad: "Dev Figür", ozet: "Abartılı, kaydırmayı durduran ürün anları",
    renk: "pembe", ikon: "maximize", tur: "TikTok", sema: "sade", sure: "10 sn",
    tohumlar: ["paz-dev-1", "paz-dev-2", "paz-dev-3"] },

  { slug: "kutu-acma-deneme", ad: "Kutu Açma Deneme", ozet: "Tek çekimde kutuyu aç ve dene",
    renk: "pembe", ikon: "package-open", tur: "UGC", sema: "tam", sure: "15 sn",
    tohumlar: ["paz-kutudeneme-1", "paz-kutudeneme-2", "paz-kutudeneme-3"] },

  { slug: "kutu-acma-asmr", ad: "Kutu Açma ASMR", ozet: "Tatmin edici ASMR kutu açma deneyimi",
    renk: "turkuaz", ikon: "mic", tur: "TikTok", sema: "tam", sure: "15 sn",
    tohumlar: ["paz-asmr-1", "paz-asmr-2", "paz-asmr-3"] },

  { slug: "sneaker-deneme", ad: "Sneaker Deneme", ozet: "Sanal ayakkabı deneme videoları",
    renk: "menekse", ikon: "footprints", tur: "UGC", sema: "tam", sure: "15 sn",
    tohumlar: ["paz-sneaker-1", "paz-sneaker-2", "paz-sneaker-3"] },

  { slug: "cift-paylasimi", ad: "Çift Paylaşımı", ozet: "Bir çift ürünü evde paylaşıyor",
    renk: "pembe", ikon: "home", tur: "Ticari", markaSerit: true, sema: "tam", sure: "15 sn",
    tohumlar: ["paz-cift-1", "paz-cift-2", "paz-cift-3"] },

  { slug: "selfie-yorum", ad: "Selfie Yorumu", ozet: "Samimi selfie tarzı kullanıcı yorumları",
    renk: "macenta", ikon: "mic-vocal", tur: "UGC", markaSerit: true, sema: "tam", sure: "15 sn",
    tohumlar: ["paz-selfie-1", "paz-selfie-2", "paz-selfie-3"] },

  { slug: "kameraya-dogrudan", ad: "Kameraya Doğrudan", ozet: "Üretici doğrudan kameraya konuşuyor",
    renk: "turuncu", ikon: "camera", tur: "UGC", markaSerit: true, sema: "tam", sure: "15 sn",
    tohumlar: ["paz-kamera-1", "paz-kamera-2", "paz-kamera-3"] },

  { slug: "gizli-puf-noktasi", ad: "Gizli Püf Noktası", ozet: "Ürünle ilgili zekice bir püf noktası göster",
    renk: "menekse", ikon: "sparkles", tur: "TikTok", markaSerit: true, sema: "tam", sure: "15 sn",
    tohumlar: ["paz-puf-1", "paz-puf-2", "paz-puf-3"] },

  { slug: "ezme-testi", ad: "Ezme Testi", ozet: "Tatmin edici ezme ve dayanıklılık testleri",
    renk: "pembe", ikon: "hammer", tur: "TikTok", sema: "tam", sure: "15 sn",
    tohumlar: ["paz-ezme-1", "paz-ezme-2", "paz-ezme-3"] },

  { slug: "hiper-hareket", ad: "Hiper Hareket", ozet: "Yüksek enerjili ürün hareket patlamaları",
    renk: "turuncu", ikon: "zap", tur: "Ticari", sema: "sade", sure: "10 sn",
    tohumlar: ["paz-hiper-1", "paz-hiper-2", "paz-hiper-3"] },

  { slug: "kamera-pov", ad: "Kamera POV", ozet: "Sürükleyici birinci ağızdan ürün anları",
    renk: "turuncu", ikon: "video", tur: "TikTok", markaSerit: true, sema: "tam", sure: "15 sn",
    tohumlar: ["paz-pov-1", "paz-pov-2", "paz-pov-3"] },

  { slug: "klasik-modern", ad: "Klasik Modernle Buluşuyor", ozet: "Zamansız ve çağdaş stili harmanla",
    renk: "menekse", ikon: "shuffle", tur: "Ticari", markaSerit: true, sema: "tam", sure: "15 sn",
    tohumlar: ["paz-klasik-1", "paz-klasik-2", "paz-klasik-3"] },

  { slug: "dagiiniktan-tertemize", ad: "Dağınıktan Tertemize", ozet: "Dağınıktan tertemize dönüşümler",
    renk: "pembe", ikon: "wand-2", tur: "TikTok", markaSerit: true, sema: "sade", sure: "10 sn",
    tohumlar: ["paz-temiz-1", "paz-temiz-2", "paz-temiz-3"] },

  { slug: "gizemli-kutu", ad: "Gizemli Kutu", ozet: "Merak uyandıran gizemli kutu açılışları",
    renk: "pembe", ikon: "box", tur: "TikTok", markaSerit: true, sema: "sade", sure: "10 sn",
    tohumlar: ["paz-gizem-1", "paz-gizem-2", "paz-gizem-3"] },

  { slug: "yeniden-kutulama", ad: "Yeniden Kutulama", ozet: "Yeniden paketleme ve kutulama anları",
    renk: "turkuaz", ikon: "package", tur: "TikTok", sema: "sade", sure: "10 sn",
    tohumlar: ["paz-rebox-1", "paz-rebox-2", "paz-rebox-3"] },

  { slug: "tv-reklami", ad: "TV Reklamı", ozet: "Samimi hikâyeler, güçlendirilmiş anlatım",
    renk: "macenta", ikon: "tv", tur: "Ticari", sema: "sade", sure: "10 sn",
    tohumlar: ["paz-tv-1", "paz-tv-2", "paz-tv-3"] },

  { slug: "bagimlilik", ad: "Bağımlılık", ozet: "Elden bırakılamayan ürün tutkusu",
    renk: "pembe", ikon: "clapperboard", tur: "UGC", sema: "tam", sure: "15 sn",
    tohumlar: ["paz-bagimlilik-1", "paz-bagimlilik-2", "paz-bagimlilik-3"] },

  { slug: "once-ve-sonra", ad: "Önce & Sonra", ozet: "Dönüşümleri ve sonuçları sergile",
    renk: "menekse", ikon: "columns-2", tur: "Ticari", sema: "tam", sure: "15 sn",
    tohumlar: ["paz-oncesonra-1", "paz-oncesonra-2", "paz-oncesonra-3"] },

  { slug: "egitim", ad: "Eğitim", ozet: "Adım adım kullanım anlatımı",
    renk: "yesil", ikon: "file-search", tur: "UGC", sema: "tam", sure: "15 sn",
    tohumlar: ["paz-egitim-1", "paz-egitim-2", "paz-egitim-3"] },

  { slug: "kutu-acma", ad: "Kutu Açma", ozet: "Yüksek kaliteli kutu açma",
    renk: "camgobegi", ikon: "package-open", tur: "UGC", sema: "tam", sure: "15 sn",
    tohumlar: ["paz-kutu-1", "paz-kutu-2", "paz-kutu-3"] },

  { slug: "ugc-sanal-deneme", ad: "UGC Sanal Deneme", ozet: "Satın almadan önce dene",
    renk: "lime", ikon: "shirt", tur: "UGC", sema: "tam", sure: "15 sn",
    tohumlar: ["paz-sanal-1", "paz-sanal-2", "paz-sanal-3"] },

  { slug: "pro-sanal-deneme", ad: "Pro Sanal Deneme", ozet: "Gelişmiş sanal deneme",
    renk: "lime", ikon: "shirt", tur: "UGC", sema: "sade", sure: "10 sn",
    tohumlar: ["paz-prosanal-1", "paz-prosanal-2", "paz-prosanal-3"] },

  { slug: "serbest-kart", ad: "Serbest Kart", ozet: "Özel fikirler için benzersiz ve yaratıcı video modu",
    renk: "yesil", ikon: "layers", tur: "Ticari", sema: "sade", sure: "10 sn",
    tohumlar: ["paz-serbest-1", "paz-serbest-2", "paz-serbest-3"] },

  { slug: "urun-incelemesi", ad: "Ürün İncelemesi", ozet: "Samimi ürün incelemeleri",
    renk: "camgobegi", ikon: "star", tur: "UGC", sema: "tam", sure: "15 sn",
    tohumlar: ["paz-inceleme-1", "paz-inceleme-2", "paz-inceleme-3"] },
];

/** Ana sayfa ızgarası = katalog sırası (referansta aynı). */
export const ANASAYFA_STILLERI = PAZ_STILLER;

export function stilBul(slug: string): PazStil | undefined {
  return PAZ_STILLER.find((s) => s.slug === slug);
}

/** Ana sayfa + stil modalı filtre sekmeleri (Tümü aktif = beyaz dolgu). */
export const PAZ_FILTRELER: { ad: string; ikon?: string; yeni?: boolean }[] = [
  { ad: "Tümü" },
  { ad: "TikTok", ikon: "music", yeni: true },
  { ad: "UGC", ikon: "user-square" },
  { ad: "Ticari", ikon: "circle-dollar-sign" },
];

/* ══════════════════ KANCALAR (Hook) ══════════════════
   Referans: Hook modalı — 9 kanca, sekmeler Tümü/Gösterişli/İnce. */

export interface PazKanca {
  slug: string;
  ad: string;
  ozet: string;
  /** Kart çevrilince görünen TAM istem (Kanca istemi şeridinde de kullanılır). */
  istem: string;
  kat: "Gösterişli" | "İnce";
  tohum: string;
}

export const PAZ_KANCALAR: PazKanca[] = [
  { slug: "urun-carpmasi", ad: "Ürün Çarpması", ozet: "Nesne kadraja uçar, kişiye çarpar",
    istem: "Bir nesne kadraja uçarak girer ve kişiye çarpar. Kısa bir tepki anı, ardından ürüne geçiş.",
    kat: "Gösterişli", tohum: "kanca-carpma" },
  { slug: "baharatli", ad: "Baharatlı", ozet: "Köprücük kemiğinden yukarı kayan yakın çekim",
    istem: "Çekim, köprücük kemiğine aşırı yakın bir kadrajla başlar; kamera yavaşça yukarı kayarak kusursuz bir makyaj görünümünü ortaya çıkarır ve ardından ürüne döner.",
    kat: "İnce", tohum: "kanca-baharat" },
  { slug: "roportaj", ad: "Röportaj", ozet: "Sokak röportajı zinciri",
    istem: "Röportajcı ikinci bir yabancıya, tamamen ilk kişinin cevabına dayanan bir soru sorar; zincirleme tepkiler ürüne bağlanır.",
    kat: "İnce", tohum: "kanca-roportaj" },
  { slug: "rastgele-mikrofon", ad: "Rastgele Mikrofon", ozet: "Eline düşen absürt nesneyi mikrofon yapar",
    istem: "Sıradan bir vlog sırasında yukarıdan kişinin eline rastgele absürt bir nesne düşer ve kişi onu anında mikrofon olarak kullanıp tamamen ciddi bir ürün incelemesine devam eder.",
    kat: "Gösterişli", tohum: "kanca-mikrofon" },
  { slug: "urun-cakilmasi", ad: "Ürün Çakılması", ozet: "Ürün yukarıdan düşer ve parçalanır",
    istem: "Ürünün kendisi yukarıdan düşer ve parçalanarak ortalığı karıştırır; sert bir kesmeyle sağlam ürüne dönülür.",
    kat: "Gösterişli", tohum: "kanca-cakilma" },
  { slug: "tipi", ad: "Tipi", ozet: "Sıcak iç mekânı ani kar fırtınası basar",
    istem: "Sıcacık bir iç mekân sahnesini aniden şiddetli, imkânsız bir kar fırtınası vurur; kişi ürünle birlikte sakin kalır.",
    kat: "Gösterişli", tohum: "kanca-tipi" },
  { slug: "kamera-carpmasi", ad: "Kamera Çarpması", ozet: "Kameraman birine çarpar",
    istem: "Kameraman yanlışlıkla bir kişiye çarpar, elindekiler düşer ve kadraj doğal biçimde ürüne kilitlenir.",
    kat: "İnce", tohum: "kanca-kamera" },
  { slug: "urun-kacisi", ad: "Ürün Kaçışı", ozet: "Yüze gelen ürünü son anda eğilerek atlatır",
    istem: "Aniden bir ürün kişinin yüzüne doğru uçar; kişi hızla eğilip kaçar, sonra gülerek ürünü tanıtır.",
    kat: "Gösterişli", tohum: "kanca-kacis" },
  { slug: "efsane-fiyasko", ad: "Efsane Fiyasko", ozet: "Başarısız takla ve düşüş",
    istem: "Bir kişi geriye takla atmayı dener, başarısız olur ve düşer; toparlanıp ürünü göstererek kendine gelir.",
    kat: "Gösterişli", tohum: "kanca-fiyasko" },
];

export const KANCA_SEKMELERI = ["Tümü", "Gösterişli", "İnce"];

/* ══════════════════ ORTAMLAR (Setting) ══════════════════
   Referans: Setting modalı — 14 ortam, sekmeler Tümü/Gerçekçi/Gerçeküstü. */

export interface PazOrtam {
  slug: string;
  ad: string;
  ozet: string;
  istem: string;
  kat: "Gerçekçi" | "Gerçeküstü";
  tohum: string;
}

export const PAZ_ORTAMLAR: PazOrtam[] = [
  { slug: "yatak-odasi", ad: "Yatak Odası", ozet: "Yatakta ya da yastıklara yaslanmış, yumuşak pencere ışığı",
    istem: "Yatakta ya da yastıklara yaslanmış hâlde, yumuşak pencere ışığı. Toplanmamış yatak, rahat ve samimi bir atmosfer.",
    kat: "Gerçekçi", tohum: "ortam-yatak" },
  { slug: "ucak-kanadi", ad: "Uçak Kanadı", ozet: "Uçuş hâlindeki uçağın kanadında",
    istem: "Kişi irtifada, uçuş hâlindeki uçağın kanadında oturuyor. Sıradan bir ürün incelemesi yapıyormuş gibi son derece rahat.",
    kat: "Gerçeküstü", tohum: "ortam-ucak" },
  { slug: "doga", ad: "Doğa", ozet: "Patika, park, sahil ya da bahçe",
    istem: "Açık havada — ürüne göre patika, park, sahil ya da bahçe. Doğal gün ışığı ve canlı yeşil doku.",
    kat: "Gerçekçi", tohum: "ortam-doga" },
  { slug: "cati-kenari", ad: "Çatı Kenarı", ozet: "Gökdelen çatısının kenarında, şehir silüeti",
    istem: "Kişi gökdelen çatısının kenarında; arkada uzanan şehir silüeti. Yükseklik hissi ürünle kontrast oluşturur.",
    kat: "Gerçeküstü", tohum: "ortam-cati" },
  { slug: "spor-salonu", ad: "Spor Salonu", ozet: "Salon zemini, soyunma odası ya da antrenman sonrası bank",
    istem: "Salon zemini, soyunma odası ya da antrenman sonrası bank. Parlak tepe aydınlatması, ter ve enerji.",
    kat: "Gerçekçi", tohum: "ortam-spor" },
  { slug: "yanardag-agzi", ad: "Yanardağ Ağzı", ozet: "Aktif yanardağın ağzında, altta lav",
    istem: "Kişi aktif bir yanardağın ağzında oturuyor, altta lav akıyor. Sakin sakin ürün incelemesi yapıyor.",
    kat: "Gerçeküstü", tohum: "ortam-yanardag" },
  { slug: "banyo", ad: "Banyo", ozet: "Ayna selfie'si ya da ön kamera",
    istem: "Banyoda ayna selfie'si ya da ön kamera. Halka ışık veya makyaj masası aydınlatması.",
    kat: "Gerçekçi", tohum: "ortam-banyo" },
  { slug: "minik-yorumcu", ad: "Minik Yorumcu", ozet: "15 cm'e küçülmüş kişi, ürün onun boyunda",
    istem: "Kişi 15 santimetreye küçülmüş; ürün onun tam boyunda duruyor. Her şey normalmiş gibi anlatıyor.",
    kat: "Gerçeküstü", tohum: "ortam-minik" },
  { slug: "mutfak", ad: "Mutfak", ozet: "Tezgâh başında ya da adaya yaslanmış, doğal gün ışığı",
    istem: "Tezgâh başında ayakta ya da mutfak adasına yaslanmış, doğal gün ışığı. Temiz ve düzenli bir alan.",
    kat: "Gerçekçi", tohum: "ortam-mutfak" },
  { slug: "araba-tavani", ad: "Araba Tavanı", ozet: "Hareket hâlindeki arabanın tavanında, çöl yolu",
    istem: "Kişi hareket hâlindeki arabanın tavanında, çöl otoyolu, altın saat ışığı. Rüzgârda ürün incelemesi.",
    kat: "Gerçeküstü", tohum: "ortam-tavan" },
  { slug: "araba-ici", ad: "Araba İçi", ozet: "Yolcu ya da sürücü koltuğundan selfie",
    istem: "Yolcu ya da sürücü koltuğundan selfie; park hâlinde ya da seyir hâlinde. Yüze düşen pencere ışığı.",
    kat: "Gerçekçi", tohum: "ortam-araba" },
  { slug: "sokak", ad: "Sokak", ozet: "Kaldırımda yürürken ya da şehir sokağında",
    istem: "Kaldırımda yürürken ya da şehir sokağında ayakta, elde selfie. Şehir gürültüsü ve hareketi arka planda.",
    kat: "Gerçekçi", tohum: "ortam-sokak" },
  { slug: "ofis", ad: "Ofis", ozet: "Masa düzeni, açık dizüstü, yanında kahve",
    istem: "Masa düzeni, açık dizüstü bilgisayar, yanında kahve. Temiz modern alan, yumuşak aydınlatma.",
    kat: "Gerçekçi", tohum: "ortam-ofis" },
  { slug: "tren-suruculugu", ad: "Tren Sörfü", ozet: "Hareket hâlindeki trenin dışında asılı",
    istem: "Kişi hareket hâlindeki trenin dışında asılı duruyor, selfie çekiyor. Ürünü inceliyor — üzerine basan rüzgâr canlı demo.",
    kat: "Gerçeküstü", tohum: "ortam-tren" },
];

export const ORTAM_SEKMELERI = ["Tümü", "Gerçekçi", "Gerçeküstü"];

/* ══════════════════ APP MODU ══════════════════
   Referans: uretme-paneli-app — çip satırı [Stil][Cihaz][Ayar]. */

export const CIHAZLAR: { ad: string; ozet: string; tohum: string }[] = [
  { ad: "Masaüstü", ozet: "Web siteniz veya masaüstü uygulamanız için UGC reklamı", tohum: "cihaz-masaustu" },
  { ad: "Mobil", ozet: "Mobil uygulamanız için UGC reklamı", tohum: "cihaz-mobil" },
];

/* ══════════════════ ÜRETİM AYARLARI ══════════════════ */

export const EN_BOY_ORANLARI = ["Otomatik", "16:9", "9:16", "4:3", "3:4", "1:1", "21:9"];
export const KALITELER = ["480p", "720p", "1080p"];
export const SURELER = ["5 sn", "8 sn", "10 sn", "15 sn"];

/** Kredi maliyeti — referansta her zaman üstü çizili indirim gösterilir.
    Ürün eklenmemişken 90→75, eklendiğinde 60→50 (referans birebir). */
export const PAZ_KREDI = {
  urunsuz: { liste: 90, indirimli: 75 },
  urunlu: { liste: 60, indirimli: 50 },
  app: { liste: 102, indirimli: 86 },
  /** Ucuz önizleme (9:16 kartındaki "Önizleme Üret · 20 KREDİ"). */
  onizleme: 20,
};

/* ══════════════════ REKLAM REFERANSI ══════════════════ */

export interface ReklamRef {
  id: string;
  marka: string;
  baslik: string;
  kategori: string;
  platform: "TikTok" | "Instagram" | "YouTube";
  sure: string;
  tohum: string;
}

export const REKLAM_REFERANSLARI: ReklamRef[] = [
  { id: "r1", marka: "Lumea", baslik: "Cilt bakımı rutini kancası", kategori: "Güzellik", platform: "TikTok", sure: "0:14", tohum: "ref-lumea" },
  { id: "r2", marka: "Norvo", baslik: "Kablosuz kulaklık kutu açma", kategori: "Teknoloji", platform: "Instagram", sure: "0:18", tohum: "ref-norvo" },
  { id: "r3", marka: "Atlas Wear", baslik: "Sonbahar koleksiyonu deneme", kategori: "Moda", platform: "TikTok", sure: "0:12", tohum: "ref-atlas" },
  { id: "r4", marka: "Kahve No.7", baslik: "Sabah demleme ASMR", kategori: "Gıda & İçecek", platform: "TikTok", sure: "0:16", tohum: "ref-kahve" },
  { id: "r5", marka: "Nest+", baslik: "Ev düzenleme öncesi/sonrası", kategori: "Ev & Yaşam", platform: "YouTube", sure: "0:22", tohum: "ref-nest" },
  { id: "r6", marka: "Formo", baslik: "30 günlük dönüşüm", kategori: "Fitness", platform: "Instagram", sure: "0:20", tohum: "ref-formo" },
  { id: "r7", marka: "Pixel Arena", baslik: "Oyun kolu tepki testi", kategori: "Oyun", platform: "YouTube", sure: "0:25", tohum: "ref-pixel" },
  { id: "r8", marka: "Serum Co", baslik: "Tek damla farkı", kategori: "Güzellik", platform: "TikTok", sure: "0:11", tohum: "ref-serum" },
  { id: "r9", marka: "Volt", baslik: "Hızlı şarj karşılaştırma", kategori: "Teknoloji", platform: "TikTok", sure: "0:15", tohum: "ref-volt" },
  { id: "r10", marka: "Denim Lab", baslik: "Sanal deneme kabini", kategori: "Moda", platform: "Instagram", sure: "0:13", tohum: "ref-denim" },
  { id: "r11", marka: "Freş", baslik: "Buzdolabı doldurma", kategori: "Gıda & İçecek", platform: "TikTok", sure: "0:19", tohum: "ref-fres" },
  { id: "r12", marka: "Loom", baslik: "Yatak odası dönüşümü", kategori: "Ev & Yaşam", platform: "YouTube", sure: "0:24", tohum: "ref-loom" },
];

/* ══════════════════ ÜRÜNLER (Ürün Bağlantısı) ══════════════════ */

export interface KayitliUrun {
  id: string;
  ad: string;
  aciklama: string;
  url: string;
  tohum: string;
  /** Çekilen görsel tohumları (referansta 5 kareli film şeridi). */
  gorseller: string[];
}

export const ORNEK_URUNLER: KayitliUrun[] = [
  {
    id: "p1",
    ad: "Finovela AI Yatırım Araştırma Asistanı",
    aciklama: "Piyasaları analiz eden, yüklenen grafikleri yorumlayan, stratejileri sanal portföyde test eden ve içgörü sunan yapay zekâ destekli bir yatırım araştırma aracı.",
    url: "https://finovela.com/",
    tohum: "urun-finovela",
    gorseller: ["urun-finovela-1", "urun-finovela-2", "urun-finovela-3", "urun-finovela-4", "urun-finovela-5"],
  },
  {
    id: "p2",
    ad: "Gece Onarıcı Serum 30ml",
    aciklama: "Gece boyunca cilt bariyerini onaran, hyaluronik asit ve niasinamid içeren yoğun bakım serumu.",
    url: "https://lumea.com.tr/gece-serum",
    tohum: "urun-serum",
    gorseller: ["urun-serum-1", "urun-serum-2", "urun-serum-3", "urun-serum-4", "urun-serum-5"],
  },
  {
    id: "p3",
    ad: "Seramik Yavaş Demleme Seti",
    aciklama: "El yapımı seramik dripper, cam sürahi ve ölçekli kaşıktan oluşan üç parçalı filtre kahve seti.",
    url: "https://kahveno7.com/seramik-set",
    tohum: "urun-kahve",
    gorseller: ["urun-kahve-1", "urun-kahve-2", "urun-kahve-3", "urun-kahve-4", "urun-kahve-5"],
  },
];
