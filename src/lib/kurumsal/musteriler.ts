/* Müşteri hikâyeleri — /referanslar listesi, /referanslar/[slug] detayı ve /kurumsal sayfası ortak kullanır.
   Örnek içeriktir; yayın öncesi gerçek müşteri onaylı vakalarla değiştirilmelidir. */

export type Sektor = "Ajans" | "E-ticaret" | "Medya" | "Film & dizi" | "Oyun" | "Eğitim";
export const SEKTORLER: ("Tümü" | Sektor)[] = ["Tümü", "Ajans", "E-ticaret", "Medya", "Film & dizi", "Oyun", "Eğitim"];

export interface MusteriHikaye {
  slug: string;
  sirket: string;
  sektor: Sektor;
  konum: string;
  ekip: string;
  baslik: string;            // sonuç cümlesi
  ozet: string;
  kapak: string;
  metrikler: { deger: string; etiket: string }[];
  kullanilan: string[];
  zorluk: string[];
  cozum: string[];
  sonuc: string[];
  alinti: { metin: string; kisi: string; unvan: string };
  oneCikan?: boolean;
}

export const HIKAYELER: MusteriHikaye[] = [
  {
    slug: "meridian-studio", sirket: "Meridian Studio", sektor: "Ajans", konum: "Paris, Fransa", ekip: "45 kişi",
    baslik: "Meridian Studio kampanya görsellerini 4 günden 4 saate indirdi",
    ozet: "Bağımsız bir yaratıcı ajans, moodboard'dan final görsele kadar tüm üretimini Vayra'ya taşıdı.",
    kapak: "/gercek/galeri/sinematik2.webp", oneCikan: true,
    metrikler: [{ deger: "%92", etiket: "daha kısa teslim" }, { deger: "3,1x", etiket: "daha fazla konsept" }, { deger: "%40", etiket: "daha düşük prodüksiyon maliyeti" }],
    kullanilan: ["Görsel", "Sinema Stüdyosu", "Kanvas", "Ekip çalışma alanı"],
    zorluk: [
      "Her kampanya için çekim, retuş ve versiyonlama süreci ortalama dört iş günü sürüyordu.",
      "Müşteri sunumlarında yalnız iki-üç konsept gösterebiliyor, alternatifler bütçeye takılıyordu.",
    ],
    cozum: [
      "Ekip, ortak marka kitleri ve kredi havuzuyla tüm konsept üretimini Vayra'ya taşıdı.",
      "Kanvas üzerinde moodboard → görsel → video akışını tek projede kurdular; müşteri yorumları aynı yerde toplandı.",
    ],
    sonuc: [
      "Bir kampanyanın ilk görsel seti artık aynı gün sunuluyor.",
      "Sunumlarda ortalama 9 konsept gösteriliyor; kazanılan teklif oranı belirgin şekilde arttı.",
    ],
    alinti: { metin: "Eskiden bir kampanya görseli için günlerce yazışırdık. Vayra ile aynı işi bir öğleden sonrada, daha yüksek kalitede çıkarıyoruz. Ekibimizin ritmini tamamen değiştirdi.", kisi: "Léa Fontaine", unvan: "Kreatif Direktör" },
  },
  {
    slug: "moda-sokak", sirket: "Moda Sokak", sektor: "E-ticaret", konum: "İstanbul, Türkiye", ekip: "120 kişi",
    baslik: "Moda Sokak 12.000 ürünün katalog görselini tek sezonda yeniledi",
    ozet: "Türkiye'nin hızlı büyüyen moda markası, ürün fotoğraflarını Pazarlama Stüdyosu'yla kampanya görsellerine dönüştürüyor.",
    kapak: "/gercek/orig/seed-editorial-moda-ruh20.webp",
    metrikler: [{ deger: "12.000", etiket: "ürün görseli" }, { deger: "%31", etiket: "sepete ekleme artışı" }, { deger: "₺0", etiket: "ek stüdyo çekimi" }],
    kullanilan: ["Pazarlama Stüdyosu", "Görsel", "API"],
    zorluk: ["Her sezon binlerce ürün için model çekimi ve arka plan değişikliği gerekiyordu.", "Pazar yerlerinin farklı görsel standartları ek iş yükü yaratıyordu."],
    cozum: ["Ürün fotoğrafları API ile toplu olarak Pazarlama Stüdyosu'na gönderildi; marka kitine uygun sahneler otomatik üretildi.", "Her pazar yeri için ayrı oran ve arka plan şablonları tanımlandı."],
    sonuc: ["Tüm katalog tek sezonda, ek çekim yapılmadan yenilendi.", "Yeni görsellerle sepete ekleme oranı ölçülebilir şekilde arttı."],
    alinti: { metin: "Bir ürünün fotoğrafını yüklüyoruz, dakikalar sonra kampanyaya hazır görseller geliyor. Ekibimiz artık çekim planlamak yerine kampanya kurguluyor.", kisi: "Elif Karaca", unvan: "E-ticaret Direktörü" },
  },
  {
    slug: "lumen-films", sirket: "Lumen Films", sektor: "Film & dizi", konum: "Osaka, Japonya", ekip: "28 kişi",
    baslik: "Lumen Films ön prodüksiyonu haftalardan günlere taşıdı",
    ozet: "Bağımsız bir yapım şirketi, storyboard ve ön görselleştirmeyi Sinema Stüdyosu'nda yapıyor.",
    kapak: "/gercek/orig/banner-neonmancer.webp",
    metrikler: [{ deger: "6x", etiket: "daha hızlı storyboard" }, { deger: "18", etiket: "yatırımcı sunumu" }, { deger: "%55", etiket: "daha az yeniden çekim" }],
    kullanilan: ["Sinema Stüdyosu", "Video", "Ses"],
    zorluk: ["Storyboard ve animatik hazırlığı her proje için haftalar alıyordu.", "Yatırımcılara filmin tonunu anlatmak zordu."],
    cozum: ["Senaryo sahneleri Sinema Stüdyosu'nda tutarlı karakterlerle görselleştirildi.", "Ses Stüdyosu ile geçici seslendirme ve müzik eklenerek animatikler üretildi."],
    sonuc: ["Ön prodüksiyon süresi belirgin şekilde kısaldı.", "Sette neyin çekileceği netleştiği için yeniden çekimler azaldı."],
    alinti: { metin: "Sinema Stüdyosu ile fırtına panolarını dakikalar içinde görselleştiriyoruz. Yatırımcı sunumlarımız artık çok daha ikna edici.", kisi: "Hana Kobayashi", unvan: "Yapım Amiri" },
  },
  {
    slug: "kite-media", sirket: "Kite Media", sektor: "Medya", konum: "Bengaluru, Hindistan", ekip: "60 kişi",
    baslik: "Kite Media haftalık içerik takvimini yarı sürede dolduruyor",
    ozet: "Sosyal medya ajansı, 40 markanın kısa video ihtiyacını viral presetler ve Uzun Video ile karşılıyor.",
    kapak: "/gercek/gorsel/gorsel-karakter-Sofia.webp",
    metrikler: [{ deger: "%50", etiket: "daha az üretim süresi" }, { deger: "40", etiket: "marka" }, { deger: "2,4x", etiket: "etkileşim" }],
    kullanilan: ["Viral presetler", "Video", "Uzun Video"],
    zorluk: ["40 markanın haftalık kısa video ihtiyacı küçük bir ekiple karşılanamıyordu."],
    cozum: ["Trend formatlar viral presetlerle şablonlaştırıldı; her marka için marka kiti tanımlandı."],
    sonuc: ["Haftalık içerik takvimi yarı sürede doluyor; etkileşim oranları arttı."],
    alinti: { metin: "Viral presetler sayesinde haftalık içerik takvimimizi yarı sürede dolduruyoruz. Müşterilerimiz çıkan işlerin stüdyo kalitesine inanamıyor.", kisi: "Priya Raghavan", unvan: "Sosyal Medya Yöneticisi" },
  },
  {
    slug: "pixel-union", sirket: "Pixel Union", sektor: "Oyun", konum: "Varşova, Polonya", ekip: "85 kişi",
    baslik: "Pixel Union konsept sanatı ve 3D varlıkları tek akışta üretiyor",
    ozet: "Bağımsız oyun stüdyosu, karakter konseptlerinden oyuna hazır 3D modellere geçişi hızlandırdı.",
    kapak: "/gercek/galeri/3d4.webp",
    metrikler: [{ deger: "%70", etiket: "daha hızlı konsept" }, { deger: "1.400", etiket: "3D varlık" }, { deger: "4", etiket: "hafta erken lansman" }],
    kullanilan: ["Görsel", "3D", "Kanvas"],
    zorluk: ["Konsept sanatından 3D modele geçiş, ayrı ekipler ve araçlar arasında haftalar sürüyordu."],
    cozum: ["Onaylanan konseptler doğrudan Görselden 3D'ye aktarıldı; düşük poligonlu modeller oyun motoruna hazır çıktı."],
    sonuc: ["Varlık üretim hattı kısaldı, oyun planlanandan dört hafta erken yayınlandı."],
    alinti: { metin: "Bir karakterin konseptinden oyuna giren 3D modeline kadar her şey aynı yerde. Sanat ekibimizin hızı ikiye katlandı.", kisi: "Tomasz Wójcik", unvan: "Sanat Direktörü" },
  },
  {
    slug: "akademi-plus", sirket: "Akademi Plus", sektor: "Eğitim", konum: "Ankara, Türkiye", ekip: "35 kişi",
    baslik: "Akademi Plus 900 ders videosunu 6 dilde yayınladı",
    ozet: "Çevrim içi eğitim platformu, ders anlatımlarını Ses Stüdyosu'yla çok dile taşıdı.",
    kapak: "/gercek/explainer-video/ex-claymotion.webp",
    metrikler: [{ deger: "900", etiket: "ders videosu" }, { deger: "6", etiket: "dil" }, { deger: "%65", etiket: "daha düşük yerelleştirme maliyeti" }],
    kullanilan: ["Ses", "Açıklayıcı video", "Altyazı"],
    zorluk: ["Derslerin farklı dillere çevrilip seslendirilmesi pahalı ve yavaştı."],
    cozum: ["Eğitmenlerin sesleri izinleriyle klonlandı; dersler aynı ses tonuyla altı dile seslendirildi."],
    sonuc: ["Katalog altı dilde yayınlandı, uluslararası öğrenci sayısı arttı."],
    alinti: { metin: "Eğitmenlerimizin kendi sesiyle altı dilde ders anlatabilmesi, yurt dışı büyümemizin anahtarı oldu.", kisi: "Burak Yıldız", unvan: "İçerik Direktörü" },
  },
];

export const hikayeBul = (slug: string) => HIKAYELER.find((h) => h.slug === slug);

/** Kısa müşteri sözleri (hikâyesi olmayan ekipler dâhil). */
export const SOZLER = [
  ...HIKAYELER.map((h) => ({ ...h.alinti, sirket: h.sirket, konum: h.konum })),
  { metin: "Video, görsel ve 3D'yi tek panelde toplaması bizim için oyun değiştirici oldu. Artık araçlar arasında dosya taşımıyoruz.", kisi: "Marcus Feld", unvan: "Kurucu", sirket: "Nova Collective", konum: "Berlin, Almanya" },
  { metin: "Fiyatlandırması şeffaf, çıktı kalitesi tutarlı. Bir yıldır kullanıyoruz ve teslim sürelerimiz gözle görülür şekilde kısaldı.", kisi: "Sarah Whitfield", unvan: "Marka Müdürü", sirket: "Atlas Creative", konum: "Toronto, Kanada" },
  { metin: "Tek kişilik bir stüdyo gibi çalışıyorum ve Vayra tam olarak bunu mümkün kılıyor.", kisi: "Diego Salazar", unvan: "Bağımsız yaratıcı", sirket: "Salazar Studio", konum: "Buenos Aires, Arjantin" },
];

/** Logo duvarı yerine yazı markası — örnek ekipler. */
export const EKIPLER = [
  "Meridian Studio", "Moda Sokak", "Lumen Films", "Kite Media", "Pixel Union", "Akademi Plus",
  "Nova Collective", "Atlas Creative", "Vertex Brand", "Northwind Digital", "Zenith Productions", "Harbor House",
];
