/* Şablon: Kavis Akademi — online kurs platformu. Katalog "kurslar" tablosundan (arama, kategori, seviye, fiyat süzgeci ve
 * sıralama), kurs sayfası (ön izleme videosu, müfredat akordiyonu, eğitmen, "yorumlar" tablosundan değerlendirmeler),
 * vayra.uye ile üyelik ve kayıt ("kayitlar" tablosu, kural sahibi: her üye yalnız kendi kaydını görür ve günceller),
 * ders oynatıcısı ve ders ders ilerleme (üyenin kaydına yazılır), Derslerim sayfası ve tamamlama belgesi. */
import type { SablonTablo } from "./kurulum";
import { ORTAK_JS } from "./ortak";

const KATEGORILER = ["Tasarım", "Yazılım", "Veri", "Fotoğraf"];
const SEVIYELER = ["Başlangıç", "Orta", "İleri"];

const EGITMENLER: Record<string, { ad: string; unvan: string; foto: string; hakkinda: string }> = {
  nazli: { ad: "Nazlı Ekinci", unvan: "Ürün tasarımcısı", foto: "/gercek/paz/av-mei.webp", hakkinda: "On iki yıldır bankacılık ve e-ticaret ürünleri tasarlıyor. Üç şirkette tasarım sistemi kurdu; anlatırken her kavramı gerçek bir ekranla gösteriyor." },
  baris: { ad: "Barış Tunç", unvan: "Yazılım geliştirici", foto: "/gercek/paz/av-liam.webp", hakkinda: "Önyüz geliştirici olarak ajanslarda ve girişimlerde çalıştı. Bugüne kadar dört binden fazla öğrenciye ilk web sayfasını yazdırdı." },
  gizem: { ad: "Gizem Kara", unvan: "Veri analisti", foto: "/gercek/paz/av-lily.webp", hakkinda: "Perakende ve lojistik şirketlerinde veri analizi yapıyor. Karmaşık tabloları herkesin anlayacağı sorulara çevirmeyi seviyor." },
  arda: { ad: "Arda Yalın", unvan: "Fotoğrafçı", foto: "/gercek/paz/av-kai.webp", hakkinda: "Moda ve portre fotoğrafçısı. İstanbul'daki stüdyosunda on yıldır çekim yapıyor, hafta sonları atölye veriyor." },
  ece: { ad: "Ece Toprak", unvan: "Arayüz metni yazarı", foto: "/gercek/paz/av-jia.webp", hakkinda: "Uygulamaların düğme, hata ve bildirim metinlerini yazıyor. Kelimelerin de tasarımın bir parçası olduğuna inanıyor." },
};

type Bolum = [string, [string, number][]];
type KursTanim = { id: string; baslik: string; kategori: string; seviye: string; fiyat: number; egitmen: string; puan: number; degerlendirme: number; ogrenci: number; gorsel: string; video: string; ozet: string; aciklama: string; kazanimlar: string[]; bolumler: Bolum[]; one: boolean };

const TANIMLAR: KursTanim[] = [
  {
    id: "web-gelistirme", baslik: "Sıfırdan Web Geliştirme: HTML, CSS ve JavaScript", kategori: "Yazılım", seviye: "Başlangıç", fiyat: 2290, egitmen: "baris", puan: 4.9, degerlendirme: 1284, ogrenci: 9420, gorsel: "/gercek/havuz/gorsel/mk-is-1730.webp", video: "/gercek/havuz/video/mk-is-1730.mp4", one: true,
    ozet: "Hiç kod yazmadan başla, kursun sonunda kendi kişisel siteni yayına al.",
    aciklama: "Web'in nasıl çalıştığından başlayıp HTML ile sayfa iskeletini, CSS ile düzeni ve JavaScript ile etkileşimi adım adım kuruyoruz. Her bölüm küçük bir alıştırmayla biter; son bölümde baştan sona kendi kişisel siteni yazıp yayına alıyorsun.",
    kazanimlar: ["Anlamlı HTML ile erişilebilir sayfalar yazmak", "Flexbox ve Grid ile duyarlı yerleşim kurmak", "JavaScript ile sayfaya etkileşim eklemek", "Siteni ücretsiz bir barındırma ile yayına almak"],
    bolumler: [
      ["HTML ile ilk adımlar", [["Web nasıl çalışır?", 15], ["İlk HTML sayfan", 22], ["Bağlantılar, görseller ve listeler", 20], ["Formlar", 25]]],
      ["CSS ile düzen", [["Seçiciler ve kutu modeli", 26], ["Flexbox ile yerleşim", 30], ["Grid ile sayfa düzeni", 28], ["Duyarlı tasarım ve medya sorguları", 24]]],
      ["JavaScript ile etkileşim", [["Değişkenler, koşullar ve döngüler", 32], ["İşlevler ve diziler", 29], ["Sayfayı JavaScript ile değiştirmek", 31], ["Olaylar ve form doğrulama", 27]]],
      ["Proje ve yayın", [["Kişisel sitenin iskeleti", 35], ["Siteni yayına almak", 18]]],
    ],
  },
  {
    id: "arayuz-temelleri", baslik: "Arayüz Tasarımının Temelleri", kategori: "Tasarım", seviye: "Başlangıç", fiyat: 1490, egitmen: "nazli", puan: 4.8, degerlendirme: 932, ogrenci: 6210, gorsel: "/gercek/galeri/soyut2.webp", video: "/gercek/havuz/video/mk-teknoloji-41183.mp4", one: true,
    ozet: "Hiyerarşi, boşluk, tipografi ve renkle derli toplu ekranlar tasarla.",
    aciklama: "İyi bir arayüzün arkasındaki birkaç basit kuralı öğreniyor, her kuralı gerçek ekranlar üzerinde uyguluyoruz. Kurs, bir kayıt ekranını baştan tasarlayıp sunduğun bir projeyle biter.",
    kazanimlar: ["Görsel hiyerarşi ve okuma sırası kurmak", "Yazı tipi ve renk paleti seçmek", "Izgara ile tutarlı sayfalar tasarlamak", "Tasarımını sunmak ve geri bildirim almak"],
    bolumler: [
      ["Tasarımcı gibi bakmak", [["İyi arayüzü ne yapar?", 12], ["Hiyerarşi ve okuma sırası", 16], ["Boşluk ve hizalama", 18]]],
      ["Tipografi ve renk", [["Yazı tipi seçmek ve eşleştirmek", 20], ["Okunaklı metin boyutları", 14], ["Renk paleti kurmak", 22], ["Kontrast ve erişilebilirlik", 15]]],
      ["Bileşenler ve ekranlar", [["Düğmeler, formlar ve durumlar", 24], ["Izgara ile sayfa kurmak", 21], ["Mobil ve masaüstü uyarlama", 19]]],
      ["Proje", [["Bir kayıt ekranını baştan tasarlamak", 38], ["Tasarımını sunmak", 17]]],
    ],
  },
  {
    id: "python-veri", baslik: "Python ile Veri Analizi", kategori: "Veri", seviye: "Başlangıç", fiyat: 1990, egitmen: "gizem", puan: 4.8, degerlendirme: 706, ogrenci: 5130, gorsel: "/gercek/havuz/gorsel/mk-is-308.webp", video: "/gercek/havuz/video/mk-is-308.mp4", one: true,
    ozet: "pandas ile tabloları temizle, grafiklerle bulgularını anlat.",
    aciklama: "Python'u veri analizi için yetecek kadar öğreniyor, ardından pandas ile gerçek bir satış verisini okuyup temizliyor, grafiklerle anlatıyoruz. Matematik bilgisi gerekmez.",
    kazanimlar: ["Not defterinde Python ile çalışmak", "pandas ile süzme, gruplama ve birleştirme", "Eksik ve hatalı veriyi temizlemek", "Bulguları doğru grafikle anlatmak"],
    bolumler: [
      ["Python temelleri", [["Kurulum ve ilk not defteri", 14], ["Veri türleri ve listeler", 22], ["Koşullar, döngüler, işlevler", 27]]],
      ["pandas ile veri", [["Tablo okumak ve incelemek", 24], ["Süzme, sıralama, gruplama", 29], ["Eksik ve hatalı veriyi temizlemek", 26]]],
      ["Görselleştirme", [["Doğru grafiği seçmek", 18], ["matplotlib ile grafikler", 25], ["Bulguları anlatmak", 17]]],
      ["Proje", [["Bir e-ticaret satış verisini analiz etmek", 40]]],
    ],
  },
  {
    id: "fotograf-temelleri", baslik: "Fotoğrafın Temelleri: Işık ve Kompozisyon", kategori: "Fotoğraf", seviye: "Başlangıç", fiyat: 1290, egitmen: "arda", puan: 4.7, degerlendirme: 541, ogrenci: 3880, gorsel: "/gercek/galeri/urun7.webp", video: "/gercek/havuz/video/mk-moda-52055.mp4", one: true,
    ozet: "Makinen ya da telefonunla ışığı okuyarak daha iyi kareler çek.",
    aciklama: "Pozlamanın üç ayağını, doğal ışığın farklı saatlerdeki karakterini ve kompozisyon kurallarını öğreniyoruz. Her derste bir çekim ödevi var; telefonla da takip edebilirsin.",
    kazanimlar: ["Diyafram, enstantane ve ISO ayarlarını bilinçli seçmek", "Doğal ışığı okumak ve yönlendirmek", "Kompozisyon kurallarını yerinde kullanmak", "Tutarlı bir fotoğraf dizisi hazırlamak"],
    bolumler: [
      ["Makineni tanı", [["Diyafram, enstantane, ISO", 21], ["Pozlama üçgeni uygulaması", 18], ["Odak modları", 14]]],
      ["Işık", [["Doğal ışığı okumak", 20], ["Altın saat ve mavi saat", 15], ["İç mekânda pencere ışığı", 17]]],
      ["Kompozisyon", [["Üçler kuralı ve ötesi", 16], ["Çizgiler, çerçeveler, katmanlar", 19], ["Bir fotoğraf dizisi kurmak", 22]]],
    ],
  },
  {
    id: "react", baslik: "React ile Modern Arayüzler", kategori: "Yazılım", seviye: "Orta", fiyat: 2490, egitmen: "baris", puan: 4.8, degerlendirme: 618, ogrenci: 4270, gorsel: "/gercek/havuz/gorsel/mk-teknoloji-29991.webp", video: "/gercek/havuz/video/mk-teknoloji-29991.mp4", one: true,
    ozet: "Bileşenler, durum ve veri çekmeyle gerçek bir uygulama yaz.",
    aciklama: "JavaScript temellerini bilenler için React'e hızlı ama sağlam bir giriş. Bileşen düşüncesinden özel kancalara kadar ilerliyor, sonunda bir film arama uygulamasını yayına alıyoruz.",
    kazanimlar: ["Bileşen ve props ile düşünmek", "Durum ve formları yönetmek", "API'den veri çekmek ve hata durumlarını ele almak", "Kendi kancalarını yazmak"],
    bolumler: [
      ["React'e giriş", [["Neden React?", 12], ["Bileşenler ve JSX", 24], ["Props ile veri aktarmak", 22]]],
      ["Durum ve etkileşim", [["useState ile durum", 26], ["Listeler ve anahtarlar", 18], ["Formlar ve kontrollü alanlar", 25]]],
      ["Veri ve yan etkiler", [["useEffect ve veri çekmek", 28], ["Yükleniyor ve hata durumları", 20], ["Özel kancalar yazmak", 23]]],
      ["Proje", [["Film arama uygulaması", 42], ["Performans ve yayın", 21]]],
    ],
  },
  {
    id: "tasarim-sistemi", baslik: "Tasarım Sistemi Kurmak", kategori: "Tasarım", seviye: "İleri", fiyat: 1890, egitmen: "nazli", puan: 4.9, degerlendirme: 287, ogrenci: 1640, gorsel: "/gercek/havuz/gorsel/mk-is-42656.webp", video: "/gercek/havuz/video/mk-is-42656.mp4", one: true,
    ozet: "Belirteçlerden bileşen kütüphanesine, ekiplerin gerçekten kullandığı bir sistem.",
    aciklama: "Var olan bir ürünün envanterini çıkarıp tasarım belirteçlerini, bileşen kütüphanesini ve dokümantasyonu birlikte kuruyoruz. Son bölüm sistemi ekiplere benimsetmek ve sürümlemek üzerine.",
    kazanimlar: ["Arayüz envanteri çıkarmak", "Renk, boşluk ve yazı belirteçleri tanımlamak", "Durumları ve varyantları olan bileşenler kurmak", "Sistemi sürümlemek ve benimsetmek"],
    bolumler: [
      ["Temeller", [["Tasarım sistemi neyi çözer?", 14], ["Arayüz envanteri çıkarmak", 22], ["Tasarım belirteçleri", 26]]],
      ["Bileşen kütüphanesi", [["Bileşen anatomisi ve varyantlar", 28], ["Boş, yükleniyor ve hata durumları", 19], ["Erişilebilir bileşenler", 24]]],
      ["Yönetim ve benimsetme", [["Dokümantasyon yazmak", 18], ["Sürümleme ve değişiklik notları", 16], ["Ekiplere benimsetmek", 21]]],
    ],
  },
  {
    id: "studyo-portre", baslik: "Stüdyo Işığıyla Portre", kategori: "Fotoğraf", seviye: "Orta", fiyat: 1690, egitmen: "arda", puan: 4.7, degerlendirme: 198, ogrenci: 1120, gorsel: "/gercek/havuz/gorsel/mk-moda-50641.webp", video: "/gercek/havuz/video/mk-moda-50641.mp4", one: false,
    ozet: "Tek ışıktan üç ışıklı düzenlere, stüdyoda etkileyici portreler.",
    aciklama: "Küçük bir bütçeyle stüdyo kurmaktan klasik portre ışık düzenlerine ve ten rengini doğru düzenlemeye kadar stüdyo portresinin bütün adımları.",
    kazanimlar: ["Bütçene uygun stüdyo ekipmanı seçmek", "Rembrandt ve kelebek ışığını kurmak", "Modeli rahatlatıp yönlendirmek", "Ten rengini doğal düzenlemek"],
    bolumler: [
      ["Stüdyo kurulumu", [["Ekipman listesi ve bütçe", 16], ["Softbox, şemsiye ve yansıtıcı", 20]]],
      ["Işık düzenleri", [["Tek ışıkla portre", 24], ["Rembrandt ve kelebek ışığı", 22], ["İki ve üç ışıklı düzenler", 27]]],
      ["Çekim ve düzenleme", [["Modeli yönlendirmek", 18], ["Ten rengini doğru düzenlemek", 23]]],
    ],
  },
  {
    id: "sql-giris", baslik: "SQL ile Veriye Soru Sormak", kategori: "Veri", seviye: "Başlangıç", fiyat: 0, egitmen: "gizem", puan: 4.6, degerlendirme: 1530, ogrenci: 12750, gorsel: "/gercek/havuz/gorsel/mk-teknoloji-4938.webp", video: "/gercek/havuz/video/mk-teknoloji-4938.mp4", one: false,
    ozet: "Ücretsiz kısa kurs: SELECT'ten JOIN'e, ilk sorgularını yaz.",
    aciklama: "Veritabanından veri çekmenin dili SQL'e kısa ve ücretsiz bir giriş. Tarayıcıda çalışan alıştırmalarla ilk sorgularından tabloları birleştirmeye kadar ilerliyorsun.",
    kazanimlar: ["SELECT ve WHERE ile veri çekmek", "Sonuçları sıralamak ve sınırlamak", "COUNT, SUM ve AVG ile özetlemek", "JOIN ile tabloları birleştirmek"],
    bolumler: [
      ["İlk sorgular", [["Tablolar ve SELECT", 14], ["WHERE ile süzmek", 16], ["Sıralama ve sınır", 11]]],
      ["Birleştirme ve özet", [["COUNT, SUM, AVG", 17], ["GROUP BY", 19], ["JOIN ile tabloları birleştirmek", 24]]],
    ],
  },
  {
    id: "arayuz-metni", baslik: "Arayüz Metni Yazmak", kategori: "Tasarım", seviye: "Başlangıç", fiyat: 0, egitmen: "ece", puan: 4.8, degerlendirme: 402, ogrenci: 3360, gorsel: "/gercek/havuz/gorsel/mk-yasam-4948.webp", video: "/gercek/havuz/video/mk-yasam-4948.mp4", one: false,
    ozet: "Ücretsiz kısa kurs: düğmeler, hata mesajları ve boş durumlar için açık metinler.",
    aciklama: "Bir uygulamadaki küçük metinlerin kullanıcı deneyimini nasıl değiştirdiğini görüyor, düğme, hata mesajı ve boş durum metinlerini birlikte yeniden yazıyoruz.",
    kazanimlar: ["Açık, kısa ve insanca yazmak", "Yol gösteren hata mesajları yazmak", "Boş durumları fırsata çevirmek", "Ekibin için bir ses tonu rehberi hazırlamak"],
    bolumler: [
      ["Kelimelerle tasarım", [["Arayüz metni neden önemli?", 10], ["Açık, kısa, insanca", 14]]],
      ["Uygulama", [["Düğmeler ve bağlantılar", 12], ["Hata mesajları", 16], ["Boş durumlar ve ilk deneyim", 15], ["Ses tonu rehberi hazırlamak", 18]]],
    ],
  },
];

const KURSLAR = TANIMLAR.map((k, i) => {
  const mufredat = k.bolumler.map(([ad, dersler], b) => ({ ad, dersler: dersler.map(([d, dk], j) => ({ anahtar: `b${b + 1}d${j + 1}`, ad: d, dk })) }));
  const dk = k.bolumler.reduce((t, [, d]) => t + d.reduce((x, [, m]) => x + m, 0), 0);
  return { id: k.id, baslik: k.baslik, kategori: k.kategori, seviye: k.seviye, fiyat: k.fiyat, egitmen: k.egitmen, puan: k.puan, degerlendirme: k.degerlendirme, ogrenci: k.ogrenci, gorsel: k.gorsel, video: k.video, ozet: k.ozet, aciklama: k.aciklama, kazanimlar: k.kazanimlar.join("\n"), mufredat, dersSayisi: mufredat.reduce((t, b) => t + b.dersler.length, 0), sureDk: dk, one: k.one, aktif: true, sira: i + 1 };
});

const YORUMLAR = [
  ["web-gelistirme", "Merve A.", 5, "Daha önce iki kez başlayıp bırakmıştım. Bölüm sonlarındaki küçük alıştırmalar sayesinde bu sefer bitirdim, sitem yayında."],
  ["web-gelistirme", "Oğuz T.", 5, "Flexbox ve Grid bölümleri tek başına kursun ücretine değer. Barış Hoca çok sakin ve net anlatıyor."],
  ["web-gelistirme", "Hande K.", 4, "Tempo başlangıç için çok iyi. JavaScript bölümüne bir iki alıştırma daha eklenebilir."],
  ["arayuz-temelleri", "Kerem S.", 5, "Yazılımcıyım, tasarımdan hiç anlamazdım. Artık ekranlarım derli toplu görünüyor, ekip arkadaşlarım bile fark etti."],
  ["arayuz-temelleri", "Selin D.", 5, "Kontrast ve erişilebilirlik dersi gözümü açtı. Proje bölümündeki geri bildirim kısmı çok faydalı."],
  ["python-veri", "Tuğba Y.", 5, "Excel'de saatler süren raporlarımı artık birkaç satırla hazırlıyorum. Gizem Hanım'ın örnekleri gerçek işten."],
  ["python-veri", "Cem B.", 4, "Temizleme bölümü çok iyiydi. Görselleştirme kısmı biraz kısa kalmış ama yeterli."],
  ["fotograf-temelleri", "Aylin Ö.", 5, "Telefonla çektiğim fotoğraflar bile değişti. Altın saat dersinden sonra her akşam dışarı çıkıyorum."],
  ["react", "Emir G.", 5, "Özel kancalar bölümü nihayet kafamda oturdu. Film uygulaması portfolyomda duruyor."],
  ["tasarim-sistemi", "Duygu M.", 5, "Şirketteki dağınık bileşenleri bu kurstaki envanter yöntemiyle topladık. Sürümleme dersi altın değerinde."],
  ["sql-giris", "Burcu E.", 5, "Ücretsiz olmasına şaşırdım. JOIN'i ilk defa bu kadar net anladım."],
  ["arayuz-metni", "Levent İ.", 5, "Hata mesajlarımızı bu kurstan sonra baştan yazdık, destek talepleri gözle görülür azaldı."],
].map(([kursId, ad, puan, metin], i) => ({ id: `y${i + 1}`, kursId, ad, puan, metin }));

const TABLOLAR: Record<string, SablonTablo> = {
  kurslar: {
    aciklama: "Kurs kataloğu. Ana sayfa, katalog, kurs ve ders sayfaları bu tablodan okur. mufredat: [{ ad, dersler: [{ anahtar, ad, dk }] }]; anahtarlar değişirse öğrenci ilerlemesi eşleşmez. one: ana sayfada öne çıkar.",
    kurallar: { okuma: "herkes", ekleme: "kapali", duzenleme: "kapali" },
    sema: [
      { ad: "baslik", tur: "metin", zorunlu: true },
      { ad: "kategori", tur: "secim", zorunlu: true, secenekler: KATEGORILER },
      { ad: "seviye", tur: "secim", zorunlu: true, secenekler: SEVIYELER },
      { ad: "fiyat", tur: "sayi", zorunlu: true, aciklama: "TL, KDV dahil; 0 ücretsiz" },
      { ad: "egitmen", tur: "secim", secenekler: Object.keys(EGITMENLER), aciklama: "Eğitmen kimliği (app.js içindeki EGITMENLER)" },
      { ad: "puan", tur: "sayi" },
      { ad: "degerlendirme", tur: "sayi", aciklama: "Değerlendirme sayısı" },
      { ad: "ogrenci", tur: "sayi", aciklama: "Öğrenci sayısı" },
      { ad: "gorsel", tur: "gorsel" },
      { ad: "video", tur: "url", aciklama: "Ön izleme ve ders videosu" },
      { ad: "ozet", tur: "metin" },
      { ad: "aciklama", tur: "uzunMetin" },
      { ad: "kazanimlar", tur: "uzunMetin", aciklama: "Her satıra bir kazanım" },
      { ad: "mufredat", tur: "json" },
      { ad: "dersSayisi", tur: "sayi" },
      { ad: "sureDk", tur: "sayi", aciklama: "Toplam video süresi, dakika" },
      { ad: "one", tur: "mantiksal", varsayilan: false },
      { ad: "aktif", tur: "mantiksal", varsayilan: true },
      { ad: "sira", tur: "sayi" },
    ],
    kayitlar: KURSLAR,
  },
  kayitlar: {
    aciklama: "Üyelerin kurs kayıtları ve ilerlemesi. Kural sahibi: her üye yalnız kendi kaydını görür ve günceller. tamamlanan: biten derslerin anahtarları.",
    kurallar: { okuma: "sahibi", ekleme: "uyeler", duzenleme: "sahibi" },
    sema: [
      { ad: "kursId", tur: "iliski", iliski: "kurslar", zorunlu: true },
      { ad: "kursAd", tur: "metin" },
      { ad: "uye", tur: "metin", aciklama: "Üye kimliği (önizlemede süzmek için; yayında uyeId kullanılır)" },
      { ad: "tamamlanan", tur: "json", varsayilan: [] },
      { ad: "sonDers", tur: "metin" },
      { ad: "durum", tur: "secim", secenekler: ["Deneme", "Aktif", "Tamamlandı"], varsayilan: "Aktif" },
    ],
    kayitlar: [],
  },
  yorumlar: {
    aciklama: "Kurs değerlendirmeleri. Herkes okur; yalnız giriş yapmış üyeler yazar, her üye kendi yorumunu düzenleyebilir.",
    kurallar: { okuma: "herkes", ekleme: "uyeler", duzenleme: "sahibi" },
    sema: [
      { ad: "kursId", tur: "iliski", iliski: "kurslar", zorunlu: true },
      { ad: "ad", tur: "metin", zorunlu: true, aciklama: "Görünen ad, örneğin Merve A." },
      { ad: "puan", tur: "sayi", zorunlu: true, aciklama: "1 ile 5 arası" },
      { ad: "metin", tur: "uzunMetin", zorunlu: true },
      { ad: "uye", tur: "metin" },
    ],
    kayitlar: YORUMLAR,
  },
};

const LOGO = '<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="13" fill="#1f2a44"/><path d="M10 27c3-9 8-14 15-14 2.5 0 4 .6 5 1.3" fill="none" stroke="#ffc83d" stroke-width="4" stroke-linecap="round"/><circle cx="29" cy="25.5" r="3.3" fill="#3cc39a"/></svg>';
const ARA = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>';
const OK = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

const ust = (aktif: string) => `<a class="atla" href="#icerik">İçeriğe geç</a>
<header class="ust-kap">
  <div class="ust">
    <a class="logo" href="index.html" aria-label="Kavis Akademi ana sayfa">${LOGO}<span>Kavis<b>Akademi</b></span></a>
    <nav class="menu" data-menu aria-label="Ana menü">
${[["kurslar.html", "Kurslar"], ["kurslar.html?kategori=Tasar%C4%B1m", "Tasarım"], ["kurslar.html?kategori=Yaz%C4%B1l%C4%B1m", "Yazılım"], ["kurslar.html?kategori=Veri", "Veri"], ["kurslar.html?kategori=Foto%C4%9Fraf", "Fotoğraf"], ["derslerim.html", "Derslerim"]].map(([h, a]) => `      <a href="${h}"${h === aktif ? ' aria-current="page"' : ""}>${a}</a>`).join("\n")}
    </nav>
    <a class="hesap" id="hesap" href="derslerim.html"><span class="avatar" aria-hidden="true">${'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" stroke-linecap="round"/></svg>'}</span><span id="hesapAd">Giriş yap</span></a>
    <button class="menu-dugme" type="button" data-menu-ac aria-expanded="false" aria-label="Menüyü aç"><span></span><span></span></button>
  </div>
</header>`;

const alt = `<footer class="alt">
  <div class="alt-ic">
    <div class="alt-marka"><a class="logo" href="index.html">${LOGO}<span>Kavis<b>Akademi</b></span></a><p>Tasarım, yazılım, veri ve fotoğraf için uygulamalı online kurslar. Kendi hızında izle, alıştırmalarla öğren.</p></div>
    <div><h4>Kategoriler</h4>${KATEGORILER.map((k) => `<p><a href="kurslar.html?kategori=${encodeURIComponent(k)}">${k}</a></p>`).join("")}</div>
    <div><h4>Akademi</h4><p><a href="kurslar.html">Bütün kurslar</a></p><p><a href="derslerim.html">Derslerim</a></p><p><a href="index.html#sss">Sık sorulanlar</a></p><p><a href="mailto:destek@kavisakademi.com">destek@kavisakademi.com</a></p></div>
    <form class="bulten" data-vayra-form="Bülten" data-vayra-tesekkur="Teşekkürler, yeni kurslar açıldığında haber vereceğiz.">
      <h4>Yeni kurslardan haberin olsun</h4>
      <p>Ayda bir e-posta: yeni kurslar ve ücretsiz dersler.</p>
      <div class="bulten-satir"><label class="gizli" for="bultenEposta">E-posta adresin</label><input id="bultenEposta" name="eposta" type="email" required autocomplete="email" placeholder="ornek@posta.com" /><button class="dugme" type="submit">Abone ol</button></div>
    </form>
  </div>
  <p class="alt-not">Kavis Eğitim Teknolojileri Ltd. Şti. · Moda Cad. No: 214, Kadıköy / İstanbul · Ücretli kurslarda 14 gün içinde koşulsuz iade.</p>
</footer>
<dialog class="pencere" id="girisPencere" aria-labelledby="girisBaslik"><div class="pencere-ic"><button class="kapat" type="button" data-kapat aria-label="Kapat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button><h2 id="girisBaslik">Kavis'e hoş geldin</h2><p>Kursa kaydolmak ve ilerlemeni kaydetmek için giriş yap ya da ücretsiz üye ol.</p><div id="girisYer"></div></div></dialog>`;

const sayfa = (dosya: string, baslik: string, aciklama: string, govde: string) => `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${baslik}</title>
  <meta name="description" content="${aciklama}" />
  <meta name="theme-color" content="#fffaf0" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&family=Nunito+Sans:opsz,wght@6..12,400;6..12,600;6..12,700;6..12,800&display=swap" />
  <link rel="icon" href="ikon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="stil.css" />
</head>
<body data-sayfa="${dosya.replace(".html", "")}">
${ust(dosya)}
<main id="icerik">
${govde}
</main>
${alt}
<script src="app.js"></script>
</body>
</html>
`;

const sureYaz = (dk: number) => (dk < 60 ? `${dk} dakika` : `${(Math.round(dk / 30) / 2).toLocaleString("tr-TR")} saat`);
const YILDIZ = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 3.2l2.6 5.5 6 .8-4.4 4.1 1.1 5.9L12 16.6l-5.3 2.9 1.1-5.9-4.4-4.1 6-.8z"/></svg>';
const kursKarti = (k: (typeof KURSLAR)[number]) => `<a class="kurs-kart" href="kurs.html?id=${k.id}" data-kat="${k.kategori}">
      <span class="kk-gorsel"><img src="${k.gorsel}" alt="" loading="lazy" /><span class="kat-etiket">${k.kategori}</span></span>
      <span class="kk-govde"><b>${k.baslik}</b><span class="kk-egitmen"><img src="${EGITMENLER[k.egitmen].foto}" alt="" loading="lazy" />${EGITMENLER[k.egitmen].ad}</span>
      <span class="kk-meta"><span class="puan">${YILDIZ}${k.puan.toLocaleString("tr-TR")}<small>(${k.degerlendirme.toLocaleString("tr-TR")})</small></span><span>${k.seviye}</span><span>${sureYaz(k.sureDk)}</span></span>
      <span class="kk-fiyat">${k.fiyat ? k.fiyat.toLocaleString("tr-TR") + " TL" : "Ücretsiz"}</span></span>
    </a>`;
const KAT_BILGI: Record<string, [string, string]> = { "Tasarım": ["gunes", "Arayüz, tasarım sistemleri, metin"], "Yazılım": ["gok", "Web, JavaScript, React"], "Veri": ["nane", "Python, SQL, analiz"], "Fotoğraf": ["seftali", "Işık, kompozisyon, stüdyo"] };

const STIL = String.raw`/* Kavis Akademi — krem zemin, çivit mürekkep, ayçiçeği sarısı ve nane vurgu; Lexend başlıklar, Nunito Sans gövde. Yumuşak, yuvarlak, sıcak. */
:root {
  --zemin: #fffaf0; --kart: #ffffff; --murekkep: #1f2a44; --soluk: #5d6478; --gunes: #ffc83d; --gunes-acik: #fff0c2; --nane: #3cc39a; --nane-koyu: #1f8f6c; --nane-acik: #dcf6ec;
  --gok: #7cc4f5; --gok-acik: #e1f1fd; --seftali: #ff9f80; --seftali-acik: #ffe7df; --krem: #f6eedc; --cizgi: rgba(31, 42, 68, .12);
  --baslik: "Lexend", system-ui, sans-serif; --yazi: "Nunito Sans", system-ui, sans-serif; --yaricap: 26px;
}
[hidden] { display: none !important; }
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; background: var(--zemin); color: var(--murekkep); font: 16.5px/1.6 var(--yazi); -webkit-font-smoothing: antialiased; overflow-x: hidden; }
img, svg, video { display: block; max-width: 100%; }
a { color: inherit; }
h1, h2, h3 { font-family: var(--baslik); margin: 0; line-height: 1.12; letter-spacing: -.025em; font-weight: 600; }
:focus-visible { outline: 3px solid var(--nane); outline-offset: 2px; border-radius: 8px; }
.gizli { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.atla { position: absolute; left: -999px; top: 8px; background: var(--murekkep); color: #fff; padding: 8px 14px; border-radius: 10px; z-index: 50; }
.atla:focus { left: 12px; }

.ust-kap { position: sticky; top: 0; z-index: 30; padding: 12px clamp(12px, 3vw, 32px) 0; }
.ust { position: relative; max-width: 1280px; margin: 0 auto; display: flex; align-items: center; gap: 16px; padding: 10px 10px 10px 16px; background: color-mix(in srgb, var(--kart) 92%, transparent); backdrop-filter: blur(14px); border: 1px solid var(--cizgi); border-radius: 22px; }
.logo { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; font-family: var(--baslik); font-weight: 600; font-size: 20px; letter-spacing: -.03em; }
.logo svg { width: 38px; height: 38px; flex: none; }
.logo b { font-weight: 400; color: var(--soluk); margin-left: 4px; }
.menu { display: flex; gap: 2px; margin-left: auto; }
.menu a { text-decoration: none; padding: 10px 14px; border-radius: 14px; font-weight: 700; font-size: 15px; color: var(--soluk); }
.menu a:hover { background: var(--krem); color: var(--murekkep); }
.menu a[aria-current] { background: var(--gunes-acik); color: var(--murekkep); }
.hesap { display: inline-flex; align-items: center; gap: 9px; min-height: 46px; padding: 5px 16px 5px 5px; border-radius: 99px; background: var(--murekkep); color: #fff; text-decoration: none; font-weight: 700; font-size: 15px; white-space: nowrap; max-width: 220px; }
.hesap #hesapAd { overflow: hidden; text-overflow: ellipsis; }
.hesap .avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--gunes); color: var(--murekkep); display: grid; place-items: center; font-family: var(--baslik); font-weight: 600; flex: none; }
.hesap .avatar svg { width: 18px; height: 18px; }
.menu-dugme { display: none; width: 46px; height: 46px; border: 1px solid var(--cizgi); background: var(--kart); border-radius: 14px; cursor: pointer; flex-direction: column; justify-content: center; align-items: center; gap: 6px; flex: none; }
.menu-dugme span { width: 18px; height: 2px; border-radius: 2px; background: var(--murekkep); }

.dugme { display: inline-flex; align-items: center; justify-content: center; gap: 9px; min-height: 52px; padding: 13px 24px; border: 0; border-radius: 16px; background: var(--murekkep); color: #fff; font: 700 16px/1 var(--yazi); text-decoration: none; cursor: pointer; transition: transform .2s, background .2s; white-space: nowrap; }
.dugme svg { width: 18px; height: 18px; }
.dugme:hover { background: #2c3a5c; }
.dugme:active { transform: scale(.98); }
.dugme[disabled] { opacity: .5; cursor: not-allowed; }
.dugme.sari { background: var(--gunes); color: var(--murekkep); }
.dugme.sari:hover { background: #ffbb14; }
.dugme.nane { background: var(--nane); color: #fff; }
.dugme.nane:hover { background: var(--nane-koyu); }
.dugme.ikincil { background: var(--kart); color: var(--murekkep); border: 1.5px solid var(--cizgi); }
.dugme.ikincil:hover { border-color: var(--murekkep); }
.dugme.kucuk { min-height: 44px; padding: 10px 18px; font-size: 15px; border-radius: 14px; }
.metin-dugme { background: none; border: 0; padding: 8px 0; min-height: 44px; color: var(--soluk); font: 700 14.5px var(--yazi); text-decoration: underline; cursor: pointer; }

.kapsayici { max-width: 1280px; margin: 0 auto; padding: 0 clamp(16px, 4vw, 40px); }
.kahraman { display: grid; grid-template-columns: 1.05fr .95fr; gap: clamp(28px, 5vw, 72px); align-items: center; padding-block: clamp(36px, 6vw, 84px); }
.kahraman > * { min-width: 0; }
.ust-yazi { display: inline-flex; align-items: center; gap: 8px; padding: 7px 14px; border-radius: 99px; background: var(--nane-acik); color: var(--nane-koyu); font-weight: 800; font-size: 14px; }
.kahraman h1 { font-size: clamp(42px, 6vw, 80px); margin: 18px 0 20px; letter-spacing: -.04em; line-height: 1.04; }
mark { background: linear-gradient(transparent 58%, var(--gunes) 58%, var(--gunes) 92%, transparent 92%); color: inherit; padding: 0 .06em; }
.giris { font-size: clamp(17px, 1.5vw, 19.5px); color: var(--soluk); max-width: 540px; margin: 0 0 28px; }
.arama { display: flex; align-items: center; gap: 8px; max-width: 560px; padding: 8px 8px 8px 18px; background: var(--kart); border: 1.5px solid var(--cizgi); border-radius: 20px; }
.arama:focus-within { border-color: var(--murekkep); }
.arama svg { width: 22px; height: 22px; color: var(--soluk); flex: none; }
.arama input { flex: 1; min-width: 0; border: 0; background: transparent; font: 600 17px var(--yazi); color: var(--murekkep); padding: 10px 4px; min-height: 44px; }
.arama input:focus { outline: none; }
.populer { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 16px; color: var(--soluk); font-size: 14.5px; font-weight: 700; }
.populer a { text-decoration: none; padding: 8px 14px; border-radius: 99px; background: var(--krem); color: var(--murekkep); min-height: 40px; display: inline-flex; align-items: center; }
.populer a:hover { background: var(--gunes-acik); }
.vitrin { position: relative; padding: 0 0 26px 26px; }
.vitrin::before { content: ""; position: absolute; left: 0; bottom: 0; width: 72%; height: 72%; border-radius: 40px; background: var(--gunes); }
.vitrin figure { position: relative; margin: 0; border-radius: 36px; overflow: hidden; aspect-ratio: 4 / 4.2; background: var(--krem); }
.vitrin figure img { width: 100%; height: 100%; object-fit: cover; }
.yuzen { position: absolute; background: var(--kart); border: 1px solid var(--cizgi); border-radius: 20px; padding: 14px 16px; font-size: 14px; }
.yuzen.y1 { right: -14px; top: 9%; width: 250px; }
.yuzen.y2 { left: -6px; bottom: 60px; display: flex; align-items: center; gap: 12px; }
.yuzen b { display: block; font-family: var(--baslik); font-weight: 600; font-size: 15px; }
.yuzen small { color: var(--soluk); font-weight: 600; }
.cubuk { height: 10px; border-radius: 99px; background: var(--krem); overflow: hidden; margin: 10px 0 6px; }
.cubuk i { display: block; height: 100%; border-radius: inherit; background: var(--nane); transition: width .4s; }
.yigin { display: flex; }
.yigin img { width: 38px; height: 38px; border-radius: 50%; object-fit: cover; object-position: top; border: 3px solid #fff; margin-left: -10px; background: var(--krem); }
.yigin img:first-child { margin-left: 0; }

.rakam-serit { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding-bottom: clamp(32px, 5vw, 64px); }
.rakam-serit div { background: var(--kart); border: 1px solid var(--cizgi); border-radius: 22px; padding: 20px 22px; }
.rakam-serit b { display: block; font-family: var(--baslik); font-weight: 600; font-size: clamp(28px, 3vw, 40px); letter-spacing: -.04em; line-height: 1.1; }
.rakam-serit span { color: var(--soluk); font-weight: 600; font-size: 15px; }

.bolum { padding-block: clamp(44px, 7vw, 96px); }
.bolum-ust { display: flex; justify-content: space-between; align-items: end; gap: 18px; flex-wrap: wrap; margin-bottom: clamp(22px, 3vw, 36px); }
.bolum-ust h2 { font-size: clamp(30px, 4vw, 50px); letter-spacing: -.035em; }
.bolum-ust p { margin: 8px 0 0; color: var(--soluk); max-width: 560px; font-size: 17px; }
.kategoriler { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.kategori { position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; gap: 40px; min-height: 210px; padding: 24px; border-radius: 28px; text-decoration: none; transition: transform .25s; }
.kategori:hover { transform: translateY(-3px); }
.kategori h3 { font-size: 26px; }
.kategori p { margin: 6px 0 0; font-weight: 600; opacity: .8; }
.kategori .say { display: flex; justify-content: space-between; align-items: center; font-weight: 800; }
.kategori .say i { width: 46px; height: 46px; border-radius: 50%; background: rgba(255, 255, 255, .7); display: grid; place-items: center; }
.kategori .say i svg { width: 20px; height: 20px; }
.k-gunes { background: var(--gunes); } .k-gok { background: var(--gok); } .k-nane { background: var(--nane); color: #fff; } .k-seftali { background: var(--seftali); }
.k-nane .say i { color: var(--nane-koyu); }

.kurs-izgara { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
.kurs-kart { display: flex; flex-direction: column; background: var(--kart); border: 1px solid var(--cizgi); border-radius: var(--yaricap); overflow: hidden; text-decoration: none; transition: transform .25s, border-color .25s; }
.kurs-kart:hover { transform: translateY(-3px); border-color: rgba(31, 42, 68, .3); }
.kk-gorsel { position: relative; display: block; aspect-ratio: 16 / 10; background: var(--krem); overflow: hidden; }
.kk-gorsel img { width: 100%; height: 100%; object-fit: cover; }
.kat-etiket { position: absolute; left: 14px; top: 14px; padding: 6px 12px; border-radius: 99px; background: var(--kart); font-weight: 800; font-size: 13px; }
.kurs-kart[data-kat="Tasarım"] .kat-etiket { background: var(--gunes); }
.kurs-kart[data-kat="Yazılım"] .kat-etiket { background: var(--gok); }
.kurs-kart[data-kat="Veri"] .kat-etiket { background: var(--nane); color: #fff; }
.kurs-kart[data-kat="Fotoğraf"] .kat-etiket { background: var(--seftali); }
.kk-govde { display: flex; flex-direction: column; gap: 10px; padding: 18px 20px 20px; flex: 1; }
.kk-govde > b { font-family: var(--baslik); font-weight: 600; font-size: 19px; letter-spacing: -.02em; line-height: 1.25; }
.kk-egitmen { display: flex; align-items: center; gap: 8px; color: var(--soluk); font-weight: 700; font-size: 14.5px; }
.kk-egitmen img { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; object-position: top; background: var(--krem); }
.kk-meta { display: flex; flex-wrap: wrap; gap: 6px 14px; color: var(--soluk); font-size: 14px; font-weight: 600; }
.puan { display: inline-flex; align-items: center; gap: 4px; color: var(--murekkep); font-weight: 800; }
.puan svg { width: 16px; height: 16px; color: #f5a700; }
.puan small { color: var(--soluk); font-weight: 600; }
.kk-fiyat { margin-top: auto; padding-top: 10px; border-top: 1px dashed var(--cizgi); font-family: var(--baslik); font-weight: 600; font-size: 20px; }

.adimlar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; counter-reset: a; }
.adimlar div { background: var(--kart); border: 1px solid var(--cizgi); border-radius: 28px; padding: 26px; }
.adimlar div::before { counter-increment: a; content: counter(a); display: grid; place-items: center; width: 48px; height: 48px; border-radius: 16px; background: var(--gunes); font-family: var(--baslik); font-weight: 600; font-size: 20px; margin-bottom: 18px; }
.adimlar div:nth-child(2)::before { background: var(--gok); }
.adimlar div:nth-child(3)::before { background: var(--nane); color: #fff; }
.adimlar h3 { font-size: 21px; margin-bottom: 6px; }
.adimlar p { margin: 0; color: var(--soluk); }
.egitmen-serit { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 16px; }
.egitmen-kart { text-align: center; }
.egitmen-kart img { width: 100%; aspect-ratio: 1; border-radius: 50%; object-fit: cover; object-position: center 18%; background: var(--krem); margin-bottom: 12px; border: 6px solid var(--kart); }
.egitmen-kart b { display: block; font-family: var(--baslik); font-weight: 600; font-size: 18px; }
.egitmen-kart span { color: var(--soluk); font-weight: 600; font-size: 14.5px; }
.yorum-izgara { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.yorum { background: var(--kart); border: 1px solid var(--cizgi); border-radius: 26px; padding: 24px; display: flex; flex-direction: column; gap: 14px; }
.yorum p { margin: 0; font-size: 16.5px; }
.yorum footer { margin-top: auto; display: flex; justify-content: space-between; align-items: center; gap: 10px; font-weight: 800; flex-wrap: wrap; }
.yorum footer small { display: block; color: var(--soluk); font-weight: 600; }
.yildizlar { display: inline-flex; gap: 2px; color: #f5a700; }
.yildizlar svg { width: 17px; height: 17px; }
.yildizlar .bos-yildiz { color: #e5dcc6; }
.cagri { background: var(--murekkep); color: #fff; border-radius: 34px; padding: clamp(28px, 5vw, 60px); display: grid; grid-template-columns: 1.4fr 1fr; gap: 24px; align-items: center; overflow: hidden; position: relative; }
.cagri h2 { font-size: clamp(30px, 4vw, 52px); }
.cagri p { color: #c8cfe0; margin: 12px 0 0; }
.cagri .eylemler { justify-content: flex-end; }
.eylemler { display: flex; flex-wrap: wrap; gap: 10px; }
.sss { display: grid; gap: 10px; max-width: 900px; }
.sss details { background: var(--kart); border: 1px solid var(--cizgi); border-radius: 20px; }
.sss summary { list-style: none; cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 18px 22px; min-height: 56px; font-family: var(--baslik); font-weight: 600; font-size: 18px; }
.sss summary::-webkit-details-marker { display: none; }
.sss summary::after { content: "+"; flex: none; width: 32px; height: 32px; border-radius: 10px; background: var(--gunes-acik); display: grid; place-items: center; font: 600 20px/1 var(--baslik); transition: transform .2s; }
.sss details[open] summary::after { transform: rotate(45deg); }
.sss details p { margin: 0; padding: 0 22px 20px; color: var(--soluk); }

/* Katalog */
.sayfa-bas { padding-block: clamp(30px, 5vw, 60px) 10px; }
.sayfa-bas h1 { font-size: clamp(38px, 5.4vw, 66px); letter-spacing: -.04em; }
.sayfa-bas p { color: var(--soluk); font-size: 18px; margin: 10px 0 0; max-width: 620px; }
.katalog { display: grid; grid-template-columns: 270px 1fr; gap: 28px; align-items: start; padding-top: 24px; }
.katalog > * { min-width: 0; }
.suzgec { position: sticky; top: 100px; display: grid; gap: 18px; background: var(--kart); border: 1px solid var(--cizgi); border-radius: 24px; padding: 20px; }
.suzgec > div { min-width: 0; }
.suzgec h2 { font-size: 15px; font-family: var(--yazi); font-weight: 800; letter-spacing: 0; margin-bottom: 8px; }
.secenekler { display: grid; gap: 6px; }
.secenek { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 44px; padding: 8px 12px; border-radius: 12px; border: 0; background: transparent; font: 700 15px var(--yazi); color: var(--murekkep); cursor: pointer; text-align: left; }
.secenek:hover { background: var(--krem); }
.secenek[aria-pressed="true"] { background: var(--murekkep); color: #fff; }
.secenek small { color: inherit; opacity: .6; font-weight: 700; }
.ust-cubuk { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 18px; }
.ust-cubuk .arama { flex: 1 1 320px; max-width: none; }
label.alan { display: grid; gap: 6px; font-size: 14px; font-weight: 800; min-width: 0; }
.alan input, .alan select, .alan textarea { width: 100%; min-height: 50px; padding: 12px 14px; border-radius: 14px; border: 1.5px solid #ddd5c3; background: #fff; color: inherit; font: 600 16px var(--yazi); }
.alan textarea { min-height: 110px; resize: vertical; }
.alan input:focus, .alan select:focus, .alan textarea:focus { outline: none; border-color: var(--murekkep); box-shadow: 0 0 0 3px var(--gunes-acik); }
.sirala { display: flex; align-items: center; gap: 10px; font-weight: 700; color: var(--soluk); }
.sirala select { min-height: 48px; padding: 10px 12px; border-radius: 14px; border: 1.5px solid #ddd5c3; background: #fff; font: 700 15px var(--yazi); color: var(--murekkep); }
.bos { background: var(--kart); border: 2px dashed #e6dcc5; border-radius: 26px; padding: clamp(26px, 5vw, 52px); text-align: center; color: var(--soluk); }
.bos b { display: block; font-family: var(--baslik); font-weight: 600; font-size: 24px; color: var(--murekkep); margin-bottom: 8px; }
.bos .dugme { margin-top: 16px; }
.iskelet { height: 300px; border-radius: 26px; background: linear-gradient(90deg, #f4ecda, #fbf6ea, #f4ecda); background-size: 200% 100%; animation: parla 1.2s infinite; }
@keyframes parla { to { background-position: -200% 0; } }

/* Kurs sayfası */
.kurs-bas { background: var(--murekkep); color: #fff; border-radius: 34px; padding: clamp(24px, 4vw, 48px); display: grid; grid-template-columns: 1.1fr .9fr; gap: clamp(22px, 4vw, 48px); align-items: center; margin-top: 20px; }
.kurs-bas > * { min-width: 0; }
.iz { display: flex; flex-wrap: wrap; gap: 6px; font-weight: 700; font-size: 14.5px; color: #c8cfe0; margin-bottom: 14px; }
.iz a { color: #fff; }
.kurs-bas h1 { font-size: clamp(32px, 4.2vw, 54px); letter-spacing: -.035em; }
.kurs-bas .ozet { color: #d8deeb; font-size: 18px; margin: 14px 0 18px; }
.kurs-bas .kk-meta { color: #c8cfe0; font-size: 15px; gap: 8px 18px; }
.kurs-bas .puan { color: #fff; }
.kurs-bas .puan small { color: #c8cfe0; }
.kurs-bas .kk-egitmen { color: #fff; margin-top: 16px; }
.kurs-bas .kk-egitmen img { width: 40px; height: 40px; }
.oynatici { position: relative; aspect-ratio: 16 / 10; border-radius: 26px; overflow: hidden; background: #0f1628; }
.oynatici img, .oynatici video { width: 100%; height: 100%; object-fit: cover; }
.oynat { position: absolute; inset: 0; display: grid; place-items: center; border: 0; background: rgba(15, 22, 40, .25); cursor: pointer; color: var(--murekkep); }
.oynat span { display: inline-flex; align-items: center; gap: 10px; padding: 14px 22px 14px 16px; border-radius: 99px; background: var(--gunes); font: 800 16px var(--yazi); }
.oynat svg { width: 22px; height: 22px; }
.kurs-duzen { display: grid; grid-template-columns: 1fr 360px; gap: clamp(22px, 4vw, 48px); align-items: start; padding-top: clamp(28px, 4vw, 48px); }
.kurs-duzen > * { min-width: 0; }
.kurs-duzen section + section { margin-top: clamp(32px, 5vw, 56px); }
.kurs-duzen h2 { font-size: clamp(26px, 3vw, 34px); margin-bottom: 16px; }
.kazanim { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 22px; border-radius: 24px; background: var(--nane-acik); list-style: none; margin: 0; }
.kazanim li { display: flex; gap: 10px; font-weight: 700; }
.kazanim li::before { content: ""; flex: none; width: 22px; height: 22px; margin-top: 2px; border-radius: 50%; background: var(--nane) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='3.4'%3E%3Cpath d='M6 12l4 4 8-8'/%3E%3C/svg%3E") center / 13px no-repeat; }
.mufredat { display: grid; gap: 10px; }
.mufredat details { background: var(--kart); border: 1px solid var(--cizgi); border-radius: 20px; overflow: hidden; }
.mufredat summary { list-style: none; cursor: pointer; display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; align-items: center; padding: 16px 20px; min-height: 60px; }
.mufredat summary::-webkit-details-marker { display: none; }
.mufredat summary b { font-family: var(--baslik); font-weight: 600; font-size: 17.5px; }
.mufredat summary small { grid-column: 1; color: var(--soluk); font-weight: 600; }
.mufredat summary::after { content: ""; grid-row: 1 / 3; grid-column: 2; width: 30px; height: 30px; border-radius: 10px; background: var(--krem) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231f2a44' stroke-width='2.6' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") center / 16px no-repeat; transition: transform .2s; }
.mufredat details[open] summary::after { transform: rotate(180deg); }
.mufredat ol { list-style: none; margin: 0; padding: 0 12px 12px; display: grid; gap: 4px; }
.ders-satir { display: grid; grid-template-columns: 28px 1fr auto; gap: 12px; align-items: center; padding: 10px 10px; min-height: 48px; border-radius: 12px; text-decoration: none; font-weight: 600; }
a.ders-satir:hover { background: var(--krem); }
.ders-satir svg { width: 20px; height: 20px; color: var(--soluk); }
.ders-satir small { color: var(--soluk); font-weight: 700; white-space: nowrap; }
.ders-satir .rozet { padding: 3px 9px; border-radius: 99px; background: var(--gunes-acik); color: var(--murekkep); font-size: 12.5px; font-weight: 800; margin-left: 8px; white-space: nowrap; }
.ders-satir.bitti svg { color: var(--nane); }
.ders-satir[aria-current] { background: var(--gunes-acik); }
.egitmen-uzun { display: grid; grid-template-columns: 120px 1fr; gap: 20px; align-items: center; background: var(--kart); border: 1px solid var(--cizgi); border-radius: 26px; padding: 22px; }
.egitmen-uzun img { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; object-position: center 18%; background: var(--krem); }
.egitmen-uzun b { font-family: var(--baslik); font-weight: 600; font-size: 21px; display: block; }
.egitmen-uzun span { color: var(--nane-koyu); font-weight: 800; }
.egitmen-uzun p { margin: 8px 0 0; color: var(--soluk); }
.yorum-ozet { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
.yorum-ozet b { font-family: var(--baslik); font-weight: 600; font-size: 52px; letter-spacing: -.04em; line-height: 1; }
.yorum-liste { display: grid; gap: 12px; }
.yorum-liste .yorum { padding: 20px; }
.satin { position: sticky; top: 100px; background: var(--kart); border: 1px solid var(--cizgi); border-radius: 28px; padding: 24px; display: grid; gap: 16px; }
.satin .fiyat { font-family: var(--baslik); font-weight: 600; font-size: 40px; letter-spacing: -.04em; line-height: 1; }
.satin .fiyat small { display: block; font-family: var(--yazi); font-size: 14.5px; font-weight: 700; color: var(--soluk); letter-spacing: 0; margin-top: 8px; }
.satin .dugme { width: 100%; }
.satin ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; font-weight: 600; font-size: 15px; }
.satin li { display: flex; gap: 10px; align-items: center; }
.satin li svg { width: 20px; height: 20px; color: var(--nane-koyu); flex: none; }
.ilerleme-kutu { padding: 14px 16px; border-radius: 18px; background: var(--nane-acik); font-weight: 700; }
.ilerleme-kutu .cubuk { background: #fff; }
.form { display: grid; gap: 14px; }
.mesaj { border-radius: 14px; padding: 13px 15px; font-size: 14.5px; font-weight: 600; }
.mesaj b { display: block; }
.mesaj.hata { background: #fde5dc; color: #8a2a14; }
.mesaj.bilgi { background: var(--gunes-acik); color: #5e4500; }
.puan-sec { display: flex; gap: 4px; }
.puan-sec button { width: 44px; height: 44px; border: 0; border-radius: 12px; background: var(--krem); color: #e0d3b4; cursor: pointer; display: grid; place-items: center; }
.puan-sec button svg { width: 24px; height: 24px; }
.puan-sec button[aria-pressed="true"] { color: #f5a700; background: var(--gunes-acik); }

/* Ders oynatıcı */
.ders-duzen { display: grid; grid-template-columns: 1fr 360px; gap: 24px; align-items: start; padding-top: 22px; }
.ders-duzen > * { min-width: 0; }
.ders-ana .oynatici { aspect-ratio: 16 / 9; }
.ders-baslik { display: flex; justify-content: space-between; align-items: start; gap: 16px; flex-wrap: wrap; margin: 20px 0 10px; }
.ders-baslik h1 { font-size: clamp(26px, 3vw, 36px); }
.ders-baslik p { margin: 4px 0 0; color: var(--soluk); font-weight: 700; }
.ders-gezinti { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
.ders-yan { position: sticky; top: 100px; background: var(--kart); border: 1px solid var(--cizgi); border-radius: 26px; padding: 18px; max-height: calc(100vh - 120px); overflow: auto; }
.ders-yan h2 { font-size: 18px; line-height: 1.3; }
.ders-yan .bolum-ad { margin: 16px 0 4px; padding: 0 10px; font-size: 13.5px; font-weight: 800; color: var(--soluk); }
.ders-yan ol { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
.not-kutu { margin-top: 20px; background: var(--kart); border: 1px solid var(--cizgi); border-radius: 22px; padding: 20px; }
.not-kutu h2 { font-size: 19px; margin-bottom: 8px; }
.not-kutu p { margin: 0; color: var(--soluk); }
.kutlama { background: var(--gunes); border-radius: 26px; padding: 24px; margin-top: 20px; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
.kutlama h2 { font-size: 26px; }
.kutlama p { margin: 6px 0 0; font-weight: 600; }
.kapi { max-width: 640px; margin: clamp(32px, 6vw, 72px) auto; text-align: center; background: var(--kart); border: 1px solid var(--cizgi); border-radius: 30px; padding: clamp(26px, 5vw, 52px); }
.kapi h1 { font-size: clamp(28px, 4vw, 40px); margin-bottom: 10px; }
.kapi p { color: var(--soluk); }
.kapi .eylemler { justify-content: center; margin-top: 20px; }
.onizleme-not { display: flex; gap: 10px; align-items: center; padding: 12px 16px; border-radius: 16px; background: var(--gunes-acik); font-weight: 700; font-size: 14.5px; margin-bottom: 14px; }

/* Derslerim */
.panel-ust { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
.ozet-kartlar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 24px 0; }
.ozet-kartlar div { background: var(--kart); border: 1px solid var(--cizgi); border-radius: 22px; padding: 20px; }
.ozet-kartlar b { display: block; font-family: var(--baslik); font-weight: 600; font-size: 36px; letter-spacing: -.04em; line-height: 1.1; }
.ozet-kartlar span { color: var(--soluk); font-weight: 700; }
.kayit-liste { display: grid; gap: 14px; }
.kayit-kart { display: grid; grid-template-columns: 200px 1fr auto; gap: 20px; align-items: center; background: var(--kart); border: 1px solid var(--cizgi); border-radius: 26px; padding: 14px; }
.kayit-kart > img { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; border-radius: 18px; background: var(--krem); }
.kayit-kart h3 { font-size: 20px; }
.kayit-kart p { margin: 4px 0 0; color: var(--soluk); font-weight: 600; font-size: 14.5px; }
.kayit-kart .eylemler { padding-right: 8px; }
.giris-kutu { max-width: 480px; margin: 20px auto 0; background: var(--kart); border: 1px solid var(--cizgi); border-radius: 30px; padding: clamp(22px, 4vw, 34px); }
.giris-kutu h2 { font-size: 28px; margin-bottom: 6px; }
.giris-kutu > p { margin: 0 0 18px; color: var(--soluk); }
.sekme-satir { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 4px; border-radius: 16px; background: var(--krem); margin-bottom: 16px; }
.sekme-satir button { min-height: 46px; border: 0; border-radius: 12px; background: transparent; font: 800 15px var(--yazi); color: var(--soluk); cursor: pointer; }
.sekme-satir button[aria-selected="true"] { background: var(--kart); color: var(--murekkep); }
.hesap-alt { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 30px; padding-top: 22px; border-top: 1px solid var(--cizgi); }
.dugme.sil { background: #fde5dc; color: #8a2a14; }

dialog.pencere { width: min(480px, calc(100vw - 24px)); max-height: calc(100vh - 32px); padding: 0; border: 0; border-radius: 30px; background: var(--kart); color: var(--murekkep); overflow: auto; }
dialog.pencere::backdrop { background: rgba(31, 42, 68, .5); backdrop-filter: blur(3px); }
.pencere-ic { position: relative; padding: 28px 24px 24px; }
.pencere-ic h2 { font-size: 26px; padding-right: 44px; margin-bottom: 6px; }
.pencere-ic > p { margin: 0 0 18px; color: var(--soluk); }
.kapat { position: absolute; top: 14px; right: 14px; width: 46px; height: 46px; border-radius: 14px; border: 0; background: var(--krem); color: var(--murekkep); cursor: pointer; display: grid; place-items: center; }
.kapat svg { width: 20px; height: 20px; }

.alt { background: var(--murekkep); color: #c8cfe0; padding: clamp(46px, 6vw, 76px) clamp(16px, 4vw, 40px) 26px; margin-top: clamp(44px, 6vw, 88px); border-radius: 40px 40px 0 0; }
.alt-ic { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: 1.4fr .8fr .9fr 1.4fr; gap: 30px; }
.alt .logo { color: #fff; }
.alt .logo b { color: #9aa3ba; }
.alt .logo svg rect { fill: #33426a; }
.alt h4 { color: #fff; margin: 0 0 10px; font-size: 15px; }
.alt p { margin: 6px 0; font-size: 15px; }
.alt a { color: #eef1f8; text-decoration: none; }
.alt a:hover { text-decoration: underline; }
.alt-marka p { margin-top: 14px; max-width: 320px; }
.bulten-satir { display: flex; gap: 8px; margin-top: 12px; }
.bulten input { flex: 1; min-width: 0; min-height: 50px; padding: 12px 16px; border-radius: 14px; border: 1px solid rgba(255, 255, 255, .2); background: rgba(255, 255, 255, .07); color: #fff; font: 600 15px var(--yazi); }
.bulten input::placeholder { color: #9aa3ba; }
.bulten .dugme { background: var(--gunes); color: var(--murekkep); min-height: 50px; }
.alt-not { max-width: 1280px; margin: 36px auto 0; padding-top: 18px; border-top: 1px solid rgba(255, 255, 255, .12); font-size: 14px; }
.bildirim { position: fixed; left: 50%; bottom: 22px; transform: translate(-50%, 180%); background: var(--murekkep); color: #fff; padding: 14px 22px; border-radius: 16px; font-weight: 700; font-size: 15px; z-index: 60; transition: transform .35s; width: max-content; max-width: calc(100vw - 32px); }
.bildirim.acik { transform: translate(-50%, 0); }
.bildirim[data-tur="hata"] { background: #8a2a14; }

@media (max-width: 1100px) {
  .kurs-izgara { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .kategoriler { grid-template-columns: repeat(2, 1fr); }
  .egitmen-serit { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .alt-ic { grid-template-columns: 1fr 1fr; }
  .katalog { grid-template-columns: 1fr; }
  .suzgec { position: static; grid-template-columns: repeat(2, 1fr); }
  .kurs-duzen, .ders-duzen { grid-template-columns: 1fr; }
  .satin, .ders-yan { position: static; max-height: none; }
}
@media (max-width: 900px) {
  .menu { display: none; position: absolute; left: 0; right: 0; top: calc(100% + 8px); flex-direction: column; background: var(--kart); border: 1px solid var(--cizgi); border-radius: 20px; padding: 8px; }
  .menu.acik { display: flex; }
  .menu a { padding: 14px 16px; font-size: 17px; }
  .menu-dugme { display: inline-flex; }
  .hesap { margin-left: auto; }
  .kahraman, .kurs-bas, .cagri { grid-template-columns: 1fr; }
  .cagri .eylemler { justify-content: flex-start; }
  .vitrin { max-width: 520px; width: 100%; margin: 0 auto; }
  .yorum-izgara, .adimlar { grid-template-columns: 1fr; }
  .rakam-serit { grid-template-columns: repeat(2, 1fr); }
  .kayit-kart { grid-template-columns: 140px 1fr; }
  .kayit-kart .eylemler { grid-column: 1 / -1; padding: 0 4px 4px; }
}
@media (max-width: 600px) {
  .ust { gap: 8px; padding: 8px 8px 8px 12px; }
  .logo { font-size: 18px; }
  .logo b { display: none; }
  .logo svg { width: 34px; height: 34px; }
  .hesap { padding: 4px; }
  .hesap #hesapAd { display: none; }
  .kurs-izgara, .kategoriler { grid-template-columns: 1fr; }
  .kategori { min-height: 0; gap: 24px; }
  .egitmen-serit { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .yuzen.y1 { right: 0; width: 220px; top: 6%; }
  .yuzen.y2 { left: 0; bottom: 40px; }
  .vitrin { padding: 0 0 18px 18px; }
  .suzgec { grid-template-columns: 1fr; }
  .secenekler { display: flex; overflow-x: auto; scrollbar-width: none; margin-inline: -20px; padding-inline: 20px; }
  .secenek { flex: none; }
  .kazanim { grid-template-columns: 1fr; }
  .egitmen-uzun { grid-template-columns: 1fr; text-align: left; }
  .egitmen-uzun img { width: 96px; height: 96px; }
  .ozet-kartlar { grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
  .ozet-kartlar div { padding: 14px; }
  .ozet-kartlar b { font-size: 26px; }
  .ozet-kartlar span { font-size: 13px; }
  .kayit-kart { grid-template-columns: 1fr; }
  .alt-ic { grid-template-columns: 1fr; }
  .bulten-satir { flex-direction: column; }
  .eylemler .dugme { flex: 1 1 auto; }
  .alt { border-radius: 28px 28px 0 0; }
}
@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; scroll-behavior: auto !important; } }
`;

const UYGULAMA = ORTAK_JS + String.raw`
/* ── Kavis Akademi ──
 * Katalog "kurslar" tablosundan, değerlendirmeler "yorumlar" tablosundan okunur; şablon galerisindeki canlı önizlemede
 * veritabanı bağlı değildir, sayfa o zaman gömülü kopyalarla çalışır. Kayıt ve ilerleme "kayitlar" tablosunda: kural
 * "sahibi", yani yayında her üye yalnız kendi kaydını görür (uyeId sunucuda eklenir); önizlemede site sahibi her şeyi
 * görür, bu yüzden kayıtlar ayrıca "uye" alanıyla süzülür. */
var KURS_YEDEK = ${JSON.stringify(KURSLAR)};
var YORUM_YEDEK = ${JSON.stringify(YORUMLAR)};
var EGITMENLER = ${JSON.stringify(EGITMENLER)};
var KATEGORILER = ${JSON.stringify(KATEGORILER)};
var SEVIYELER = ${JSON.stringify(SEVIYELER)};
var SAYFA = document.body.dataset.sayfa;
var YILDIZ = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 3.2l2.6 5.5 6 .8-4.4 4.1 1.1 5.9L12 16.6l-5.3 2.9 1.1-5.9-4.4-4.1 6-.8z"/></svg>';
var TIK = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12.3 2.7 2.7L16 9.7"/></svg>';
var TIK_DOLU = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="m7.8 12.3 2.8 2.8 5.6-5.6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var OYNAT = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l5.5-3.5z" fill="currentColor"/></svg>';
var KILIT = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/></svg>';
var OK = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

function uyeVar() { return !!(window.vayra && window.vayra.uye); }
var ben = null;
var sozler = {};
function kurslar() {
  if (!sozler.k) sozler.k = (veriVar() ? vayra.veri.liste("kurslar", { sinir: 500 }).catch(function () { return KURS_YEDEK.slice(); }) : Promise.resolve(KURS_YEDEK.slice()))
    .then(function (l) { return l.filter(function (k) { return k.aktif !== false; }).sort(function (a, b) { return (a.sira || 99) - (b.sira || 99); }); });
  return sozler.k;
}
function yorumlar(kursId) {
  return (veriVar() ? vayra.veri.liste("yorumlar", { kursId: kursId, sirala: "olusturma", yon: "azalan", sinir: 100 }).catch(function () { return YORUM_YEDEK.filter(function (y) { return y.kursId === kursId; }); }) : Promise.resolve(YORUM_YEDEK.filter(function (y) { return y.kursId === kursId; })));
}
function benimMi(k) { return ben && (k.uyeId ? k.uyeId === ben.id : k.uye === ben.id); }
function kayitlarim() {
  if (!ben || !veriVar()) return Promise.resolve([]);
  return vayra.veri.liste("kayitlar", { sinir: 500 }).then(function (l) { return l.filter(benimMi); }).catch(function () { return []; });
}
function dersler(k) {
  var l = [];
  (Array.isArray(k.mufredat) ? k.mufredat : []).forEach(function (b, bi) { (b.dersler || []).forEach(function (d) { l.push({ anahtar: d.anahtar, ad: d.ad, dk: d.dk, bolum: bi, bolumAd: b.ad }); }); });
  return l;
}
function sureYaz(dk) { dk = Number(dk) || 0; return dk < 60 ? dk + " dakika" : (Math.round(dk / 30) / 2).toLocaleString("tr-TR") + " saat"; }
function fiyatYaz(n) { return Number(n) ? tl(n) : "Ücretsiz"; }
function egitmen(k) { return EGITMENLER[k.egitmen] || { ad: "Kavis eğitmeni", unvan: "", foto: "", hakkinda: "" }; }
function yildizlar(p) { var h = ""; for (var i = 1; i <= 5; i++) h += i <= Math.round(p) ? YILDIZ : YILDIZ.replace('fill="currentColor"', 'fill="currentColor" class="bos-yildiz"'); return '<span class="yildizlar" aria-label="5 üzerinden ' + p + ' puan">' + h + "</span>"; }
function ilerleme(k, kayit) { var t = dersler(k).length, n = (Array.isArray(kayit && kayit.tamamlanan) ? kayit.tamamlanan : []).filter(function (a) { return dersler(k).some(function (d) { return d.anahtar === a; }); }).length; return { n: n, t: t, oran: t ? Math.round(n / t * 100) : 0 }; }
function sonraki(k, kayit) { var t = (kayit && kayit.tamamlanan) || []; var d = dersler(k).find(function (x) { return t.indexOf(x.anahtar) < 0; }); return d || dersler(k)[0]; }
function kursKarti(k) {
  var e = egitmen(k);
  return '<a class="kurs-kart" href="kurs.html?id=' + encodeURIComponent(k.id) + '" data-kat="' + kacir(k.kategori) + '"><span class="kk-gorsel"><img src="' + kacir(k.gorsel) + '" alt="" loading="lazy" /><span class="kat-etiket">' + kacir(k.kategori) + "</span></span>"
    + '<span class="kk-govde"><b>' + kacir(k.baslik) + '</b><span class="kk-egitmen">' + (e.foto ? '<img src="' + kacir(e.foto) + '" alt="" loading="lazy" />' : "") + kacir(e.ad) + "</span>"
    + '<span class="kk-meta"><span class="puan">' + YILDIZ + Number(k.puan || 0).toLocaleString("tr-TR") + "<small>(" + Number(k.degerlendirme || 0).toLocaleString("tr-TR") + ")</small></span><span>" + kacir(k.seviye) + "</span><span>" + sureYaz(k.sureDk) + "</span></span>"
    + '<span class="kk-fiyat">' + fiyatYaz(k.fiyat) + "</span></span></a>";
}

/* ── Hesap: üst çubuk, giriş formu, giriş penceresi ── */
function hesapCiz() {
  var a = $("#hesapAd"), av = $("#hesap .avatar");
  if (!a) return;
  if (ben) { var ad = String(ben.ad || ben.eposta || "Üye").trim(); a.textContent = "Derslerim"; av.textContent = ad.charAt(0).toLocaleUpperCase("tr-TR"); $("#hesap").setAttribute("aria-label", "Derslerim, " + ad); }
}
function girisFormuCiz(yer, sonra) {
  if (!uyeVar()) { yer.innerHTML = '<p class="mesaj bilgi" style="margin:0"><b>Bu canlı önizlemede üyelik çalışmaz.</b>Şablonu kullanınca öğrenciler buradan ücretsiz hesap açar, kursa kaydolur ve ilerlemeleri kaydedilir.</p>'; return; }
  var mod = "giris";
  yer.innerHTML = '<div class="sekme-satir" role="tablist"><button type="button" role="tab" aria-selected="true" data-mod="giris">Giriş yap</button><button type="button" role="tab" aria-selected="false" data-mod="kayit">Üye ol</button></div>'
    + '<form class="form" novalidate><label class="alan" data-ad hidden>Ad soyad<input name="ad" autocomplete="name" /></label><label class="alan">E-posta<input name="eposta" type="email" required autocomplete="email" inputmode="email" /></label><label class="alan">Şifre<input name="sifre" type="password" required minlength="8" autocomplete="current-password" /></label>'
    + '<div class="mesaj hata" role="alert" hidden></div><button class="dugme" type="submit">Giriş yap</button><button class="metin-dugme" type="button" data-unuttum>Şifremi unuttum</button></form>';
  var f = $("form", yer), m = $(".mesaj", yer), gonder = $("[type=submit]", yer);
  $$("[data-mod]", yer).forEach(function (b) {
    b.addEventListener("click", function () {
      mod = b.dataset.mod; $$("[data-mod]", yer).forEach(function (x) { x.setAttribute("aria-selected", String(x === b)); });
      $("[data-ad]", yer).hidden = mod !== "kayit"; $("[name=ad]", yer).required = mod === "kayit"; $("[name=sifre]", yer).autocomplete = mod === "kayit" ? "new-password" : "current-password";
      gonder.textContent = mod === "kayit" ? "Ücretsiz üye ol" : "Giriş yap"; $("[data-unuttum]", yer).hidden = mod === "kayit";
    });
  });
  $("[data-unuttum]", yer).addEventListener("click", function () {
    var e = String(f.elements.eposta.value).trim();
    if (!e) { m.hidden = false; m.textContent = "Önce e-posta adresini yaz."; return; }
    vayra.uye.sifremiUnuttum(e).then(function () { bildir("Şifre sıfırlama bağlantısı " + e + " adresine gönderildi."); }).catch(function (err) { m.hidden = false; m.textContent = err.message; });
  });
  f.addEventListener("submit", function (e) {
    e.preventDefault(); m.hidden = true;
    if (!f.reportValidity()) return;
    var v = new FormData(f); gonder.disabled = true;
    (mod === "kayit" ? vayra.uye.kayit(String(v.get("eposta")).trim(), String(v.get("sifre")), String(v.get("ad")).trim()) : vayra.uye.giris(String(v.get("eposta")).trim(), String(v.get("sifre"))))
      .then(function (u) { ben = u; hesapCiz(); olay(mod === "kayit" ? "kayit_ol" : "giris_yap"); if (sonra) sonra(u); })
      .catch(function (err) { m.hidden = false; m.textContent = err.message; gonder.disabled = false; });
  });
}
var pencere = $("#girisPencere");
function girisAc(sonra) {
  girisFormuCiz($("#girisYer"), function (u) { pencere.close(); if (sonra) sonra(u); });
  if (!pencere.open) pencere.showModal();
}
pencere.addEventListener("click", function (e) { if (e.target === pencere || e.target.closest("[data-kapat]")) pencere.close(); });

/* ── Kayıt (kursa kaydolma) ── */
function kaydol(k, dugme) {
  if (!uyeVar() || !veriVar()) return bildir("Bu canlı önizlemede kayıt alınmaz; şablonu kullanınca üyeler kursa kaydolur.");
  if (!ben) return girisAc(function () { kaydol(k, dugme); });
  if (dugme) { dugme.disabled = true; dugme.textContent = "Kaydediliyor…"; }
  return kayitlarim().then(function (l) {
    var var_ = l.find(function (x) { return x.kursId === k.id; });
    if (var_) return var_;
    return vayra.veri.ekle("kayitlar", { kursId: k.id, kursAd: k.baslik, uye: ben.id, tamamlanan: [], durum: Number(k.fiyat) ? "Deneme" : "Aktif" });
  }).then(function () {
    olay("kursa_kayit", { kurs: k.id, kategori: k.kategori });
    location.href = "ders.html?kurs=" + encodeURIComponent(k.id) + "&ders=" + encodeURIComponent(dersler(k)[0] ? dersler(k)[0].anahtar : "");
  }).catch(function (e) { bildir("Kaydolunamadı: " + (e && e.message || "bağlantı sorunu"), "hata"); if (dugme) { dugme.disabled = false; dugme.textContent = "Kursa kaydol"; } });
}

/* ── Ana sayfa ── */
if (SAYFA === "index") {
  kurslar().then(function (l) {
    var one = l.filter(function (k) { return k.one; }).slice(0, 6);
    $("#oneCikan").innerHTML = (one.length ? one : l.slice(0, 6)).map(kursKarti).join("");
    KATEGORILER.forEach(function (c) { var s = $('[data-kat-say="' + c + '"]'); if (s) s.textContent = l.filter(function (k) { return k.kategori === c; }).length + " kurs"; });
  });
}

/* ── Katalog ── */
if (SAYFA === "kurslar") {
  var q = new URLSearchParams(location.search), tum = [];
  var s = { ara: q.get("ara") || "", kategori: KATEGORILER.indexOf(q.get("kategori")) >= 0 ? q.get("kategori") : "Hepsi", seviye: SEVIYELER.indexOf(q.get("seviye")) >= 0 ? q.get("seviye") : "Hepsi", fiyat: ["Ücretsiz", "Ücretli"].indexOf(q.get("fiyat")) >= 0 ? q.get("fiyat") : "Hepsi", sira: "onerilen" };
  $("#ara").value = s.ara;
  function normal(x) { return String(x || "").toLocaleLowerCase("tr-TR"); }
  function secenekCiz(yer, ad, l, sayac) {
    $(yer).innerHTML = l.map(function (x) { var n = sayac(x); return '<button class="secenek" type="button" data-alan="' + ad + '" data-deger="' + kacir(x) + '" aria-pressed="' + (s[ad] === x) + '">' + (x === "Hepsi" ? "Hepsi" : kacir(x)) + "<small>" + n + "</small></button>"; }).join("");
  }
  function uygun(k, haric) {
    var a = normal(s.ara);
    return (!a || normal(k.baslik + " " + k.ozet + " " + k.kategori + " " + egitmen(k).ad).indexOf(a) >= 0)
      && (haric === "kategori" || s.kategori === "Hepsi" || k.kategori === s.kategori)
      && (haric === "seviye" || s.seviye === "Hepsi" || k.seviye === s.seviye)
      && (haric === "fiyat" || s.fiyat === "Hepsi" || (s.fiyat === "Ücretsiz" ? !Number(k.fiyat) : Number(k.fiyat) > 0));
  }
  function ciz() {
    secenekCiz("#kKategori", "kategori", ["Hepsi"].concat(KATEGORILER), function (x) { return tum.filter(function (k) { return uygun(k, "kategori") && (x === "Hepsi" || k.kategori === x); }).length; });
    secenekCiz("#kSeviye", "seviye", ["Hepsi"].concat(SEVIYELER), function (x) { return tum.filter(function (k) { return uygun(k, "seviye") && (x === "Hepsi" || k.seviye === x); }).length; });
    secenekCiz("#kFiyat", "fiyat", ["Hepsi", "Ücretsiz", "Ücretli"], function (x) { return tum.filter(function (k) { return uygun(k, "fiyat") && (x === "Hepsi" || (x === "Ücretsiz" ? !Number(k.fiyat) : Number(k.fiyat) > 0)); }).length; });
    var l = tum.filter(function (k) { return uygun(k); });
    if (s.sira === "puan") l.sort(function (a, b) { return b.puan - a.puan || b.degerlendirme - a.degerlendirme; });
    if (s.sira === "kisa") l.sort(function (a, b) { return a.sureDk - b.sureDk; });
    if (s.sira === "fiyat") l.sort(function (a, b) { return a.fiyat - b.fiyat; });
    $("#sonuc").textContent = l.length + " kurs";
    $("#katalogIzgara").innerHTML = l.length ? l.map(kursKarti).join("") : '<div class="bos" style="grid-column:1/-1"><b>Aradığın kursu bulamadık</b>Başka bir kelime dene ya da süzgeçleri temizle.<br><button class="dugme" type="button" id="temizle">Süzgeçleri temizle</button></div>';
    var u = new URL(location.href); ["ara", "kategori", "seviye", "fiyat"].forEach(function (x) { if (s[x] && s[x] !== "Hepsi") u.searchParams.set(x, s[x]); else u.searchParams.delete(x); });
    history.replaceState(null, "", u.pathname + u.search);
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-alan]"); if (b) { s[b.dataset.alan] = b.dataset.deger; ciz(); return; }
    if (e.target.closest("#temizle")) { s = { ara: "", kategori: "Hepsi", seviye: "Hepsi", fiyat: "Hepsi", sira: s.sira }; $("#ara").value = ""; ciz(); }
  });
  var bekle;
  $("#ara").addEventListener("input", function (e) { clearTimeout(bekle); bekle = setTimeout(function () { s.ara = e.target.value.trim(); ciz(); }, 160); });
  $("#araForm").addEventListener("submit", function (e) { e.preventDefault(); s.ara = $("#ara").value.trim(); ciz(); });
  $("#sirala").addEventListener("change", function (e) { s.sira = e.target.value; ciz(); });
  $("#katalogIzgara").innerHTML = '<div class="iskelet"></div><div class="iskelet"></div><div class="iskelet"></div>';
  kurslar().then(function (l) { tum = l; ciz(); });
}

/* ── Kurs sayfası ── */
if (SAYFA === "kurs") {
  var kursId = new URLSearchParams(location.search).get("id"), kurs = null, kayit = null, secPuan = 5;
  function videoAc(yer, k) { yer.innerHTML = '<video src="' + kacir(k.video) + '" poster="' + kacir(k.gorsel) + '" controls autoplay muted playsinline loop></video>'; olay("onizleme_izle", { kurs: k.id }); }
  function satinCiz() {
    var k = kurs, p = ilerleme(k, kayit), s = sonraki(k, kayit), yer = $("#satin");
    var dahil = ['<li>' + TIK + dersler(k).length + " ders, " + sureYaz(k.sureDk) + " video</li>", "<li>" + TIK + "Süresiz erişim, kendi hızında</li>", "<li>" + TIK + "Alıştırmalar ve proje</li>", "<li>" + TIK + "Tamamlama belgesi</li>"];
    if (kayit) {
      yer.innerHTML = '<div class="ilerleme-kutu">Bu kursa kayıtlısın<div class="cubuk"><i style="width:' + p.oran + '%"></i></div><small>' + p.n + " / " + p.t + " ders tamamlandı</small></div>"
        + '<a class="dugme nane" href="ders.html?kurs=' + encodeURIComponent(k.id) + "&ders=" + encodeURIComponent(s.anahtar) + '">' + (p.n ? "Kaldığın yerden devam et" : "Derse başla") + "</a><ul>" + dahil.join("") + "</ul>";
      return;
    }
    yer.innerHTML = '<div class="fiyat">' + fiyatYaz(k.fiyat) + "<small>" + (Number(k.fiyat) ? "Tek seferlik ödeme, KDV dahil · 7 gün ücretsiz dene" : "Ücretsiz kısa kurs, üyelik yeter") + "</small></div>"
      + '<button class="dugme sari" type="button" id="kaydol">' + (Number(k.fiyat) ? "Kaydol, 7 gün ücretsiz dene" : "Ücretsiz kaydol") + "</button>"
      + '<a class="dugme ikincil" href="ders.html?kurs=' + encodeURIComponent(k.id) + "&ders=" + encodeURIComponent(dersler(k)[0] ? dersler(k)[0].anahtar : "") + '">İlk dersi ücretsiz izle</a><ul>' + dahil.join("") + "</ul>"
      + (Number(k.fiyat) ? '<p style="margin:0;color:var(--soluk);font-size:14px">Deneme bitmeden ödeme bağlantısı e-postana gelir. 14 gün içinde koşulsuz iade.</p>' : "");
    $("#kaydol").addEventListener("click", function (e) { kaydol(k, e.currentTarget); });
  }
  function yorumlariCiz() {
    yorumlar(kurs.id).then(function (l) {
      var ort = l.length ? l.reduce(function (t, y) { return t + Number(y.puan || 0); }, 0) / l.length : kurs.puan;
      var form = kayit && !l.some(benimMi) ? '<form class="form yorum" id="yorumForm" novalidate style="margin-bottom:12px"><b style="font-family:var(--baslik);font-weight:600;font-size:18px">Kursu değerlendir</b><div class="puan-sec" role="group" aria-label="Puan">' + [1, 2, 3, 4, 5].map(function (i) { return '<button type="button" data-puan="' + i + '" aria-pressed="' + (i <= secPuan) + '" aria-label="' + i + ' yıldız">' + YILDIZ + "</button>"; }).join("") + '</div><label class="alan">Yorumun<textarea name="metin" required minlength="10" maxlength="600" placeholder="Kurs sana ne kazandırdı?"></textarea></label><button class="dugme" type="submit">Yorumu gönder</button></form>' : "";
      $("#yorumlar").innerHTML = '<div class="yorum-ozet"><b>' + ort.toLocaleString("tr-TR", { maximumFractionDigits: 1, minimumFractionDigits: 1 }) + "</b><div>" + yildizlar(ort) + '<div style="color:var(--soluk);font-weight:700">' + Number(kurs.degerlendirme || l.length).toLocaleString("tr-TR") + " değerlendirme</div></div></div>" + form
        + '<div class="yorum-liste">' + (l.length ? l.map(function (y) { return '<article class="yorum">' + yildizlar(y.puan) + "<p>" + kacir(y.metin) + "</p><footer><span>" + kacir(y.ad) + "</span></footer></article>"; }).join("") : '<div class="bos"><b>Henüz yorum yok</b>İlk yorumu kursu bitirenler yazacak.</div>') + "</div>";
      var f = $("#yorumForm"); if (!f) return;
      $$("[data-puan]", f).forEach(function (b) { b.addEventListener("click", function () { secPuan = Number(b.dataset.puan); $$("[data-puan]", f).forEach(function (x) { x.setAttribute("aria-pressed", String(Number(x.dataset.puan) <= secPuan)); }); }); });
      f.addEventListener("submit", function (e) {
        e.preventDefault(); if (!f.reportValidity()) return;
        var ad = String(ben.ad || "Kavis öğrencisi").trim().split(/\s+/), gorunen = ad[0] + (ad[1] ? " " + ad[1].charAt(0) + "." : "");
        vayra.veri.ekle("yorumlar", { kursId: kurs.id, ad: gorunen, puan: secPuan, metin: String(f.elements.metin.value).trim(), uye: ben.id })
          .then(function () { bildir("Teşekkürler, yorumun yayında."); olay("yorum_yaz", { kurs: kurs.id, puan: secPuan }); yorumlariCiz(); })
          .catch(function (err) { bildir("Yorum gönderilemedi: " + err.message, "hata"); });
      });
    });
  }
  function ciz() {
    var k = kurs, e = egitmen(k), dl = dersler(k), t = (kayit && kayit.tamamlanan) || [];
    document.title = k.baslik + " · Kavis Akademi";
    $("#kursIcerik").innerHTML = '<section class="kapsayici"><div class="kurs-bas"><div><nav class="iz" aria-label="Konum"><a href="kurslar.html">Kurslar</a><span aria-hidden="true">/</span><a href="kurslar.html?kategori=' + encodeURIComponent(k.kategori) + '">' + kacir(k.kategori) + "</a></nav>"
      + "<h1>" + kacir(k.baslik) + '</h1><p class="ozet">' + kacir(k.ozet) + '</p><div class="kk-meta"><span class="puan">' + YILDIZ + Number(k.puan).toLocaleString("tr-TR") + "<small>(" + Number(k.degerlendirme).toLocaleString("tr-TR") + " değerlendirme)</small></span><span>" + Number(k.ogrenci).toLocaleString("tr-TR") + " öğrenci</span><span>" + kacir(k.seviye) + "</span><span>" + dl.length + " ders, " + sureYaz(k.sureDk) + "</span></div>"
      + '<div class="kk-egitmen">' + (e.foto ? '<img src="' + kacir(e.foto) + '" alt="" />' : "") + "<span>" + kacir(e.ad) + ", " + kacir(e.unvan) + "</span></div></div>"
      + '<div class="oynatici" id="onizleme"><img src="' + kacir(k.gorsel) + '" alt="" /><button class="oynat" type="button" id="oynat" aria-label="Ön izleme videosunu oynat"><span>' + OYNAT + "Ön izlemeyi oynat</span></button></div></div></section>"
      + '<section class="kapsayici kurs-duzen"><div><section><h2>Neler öğreneceksin?</h2><p style="color:var(--soluk);margin:-4px 0 18px;font-size:17px">' + kacir(k.aciklama) + '</p><ul class="kazanim">' + String(k.kazanimlar || "").split("\n").filter(Boolean).map(function (x) { return "<li>" + kacir(x) + "</li>"; }).join("") + "</ul></section>"
      + '<section><h2>Müfredat</h2><div class="mufredat">' + (k.mufredat || []).map(function (b, bi) {
        var bd = dl.filter(function (d) { return d.bolum === bi; }), sure = bd.reduce(function (x, d) { return x + Number(d.dk || 0); }, 0);
        return "<details" + (bi === 0 ? " open" : "") + "><summary><b>" + (bi + 1) + ". " + kacir(b.ad) + "</b><small>" + bd.length + " ders · " + sureYaz(sure) + "</small></summary><ol>" + bd.map(function (d, di) {
          var acik = kayit || (bi === 0 && di === 0), bitti = t.indexOf(d.anahtar) >= 0;
          var ic = (bitti ? TIK_DOLU : acik ? OYNAT : KILIT) + "<span>" + kacir(d.ad) + (bi === 0 && di === 0 && !kayit ? '<span class="rozet">Ücretsiz</span>' : "") + "</span><small>" + d.dk + " dk</small>";
          return "<li>" + (acik ? '<a class="ders-satir' + (bitti ? " bitti" : "") + '" href="ders.html?kurs=' + encodeURIComponent(k.id) + "&ders=" + encodeURIComponent(d.anahtar) + '">' + ic + "</a>" : '<div class="ders-satir">' + ic + "</div>") + "</li>";
        }).join("") + "</ol></details>";
      }).join("") + "</div></section>"
      + '<section><h2>Eğitmen</h2><div class="egitmen-uzun">' + (e.foto ? '<img src="' + kacir(e.foto) + '" alt="' + kacir(e.ad) + '" />' : "") + "<div><b>" + kacir(e.ad) + "</b><span>" + kacir(e.unvan) + "</span><p>" + kacir(e.hakkinda) + "</p></div></div></section>"
      + '<section><h2>Öğrenciler ne diyor?</h2><div id="yorumlar"></div></section></div>'
      + '<aside class="satin" id="satin"></aside></section>'
      + '<section class="kapsayici bolum" style="padding-bottom:0"><div class="bolum-ust"><h2>Benzer kurslar</h2></div><div class="kurs-izgara" id="benzer"></div></section>';
    $("#oynat").addEventListener("click", function () { videoAc($("#onizleme"), k); });
    satinCiz(); yorumlariCiz();
    kurslar().then(function (l) { var b = l.filter(function (x) { return x.id !== k.id; }).sort(function (a, c) { return (c.kategori === k.kategori) - (a.kategori === k.kategori); }).slice(0, 3); $("#benzer").innerHTML = b.map(kursKarti).join(""); });
  }
  (uyeVar() ? vayra.uye.ben().catch(function () { return null; }) : Promise.resolve(null)).then(function (u) { ben = u; hesapCiz(); return Promise.all([kurslar(), kayitlarim()]); }).then(function (r) {
    kurs = r[0].find(function (k) { return k.id === kursId; }) || (!kursId ? r[0][0] : null);
    if (!kurs) { $("#kursIcerik").innerHTML = '<section class="kapsayici"><div class="kapi"><h1>Kurs bulunamadı</h1><p>Aradığın kurs yayından kaldırılmış olabilir.</p><div class="eylemler"><a class="dugme" href="kurslar.html">Bütün kurslar</a></div></div></section>'; return; }
    kayit = r[1].find(function (x) { return x.kursId === kurs.id; }) || null;
    ciz();
  });
}

/* ── Ders oynatıcısı ── */
if (SAYFA === "ders") {
  var qd = new URLSearchParams(location.search), dk = null, dkayit = null, yerel = [], anahtar = qd.get("ders");
  function tamamlananlar() { return dkayit ? (Array.isArray(dkayit.tamamlanan) ? dkayit.tamamlanan : []) : yerel; }
  function erisim(d) { return !veriVar() || !!dkayit || dersler(dk)[0].anahtar === d.anahtar; }
  function belgeIndir() {
    var ad = kacir(ben && ben.ad ? ben.ad : "Kavis öğrencisi"), tarih = tarihYaz(istanbul().tarih, { year: "numeric" });
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1130" viewBox="0 0 1600 1130"><rect width="1600" height="1130" fill="#fffaf0"/><rect x="40" y="40" width="1520" height="1050" rx="48" fill="none" stroke="#1f2a44" stroke-width="4"/><circle cx="1380" cy="900" r="170" fill="#ffc83d"/><text x="120" y="230" font-family="Lexend, Arial" font-size="40" fill="#5d6478">Kavis Akademi · Tamamlama belgesi</text><text x="120" y="420" font-family="Lexend, Arial" font-size="96" font-weight="600" fill="#1f2a44">' + ad + '</text><text x="120" y="520" font-family="Arial" font-size="40" fill="#5d6478">aşağıdaki kursun bütün derslerini tamamlamıştır:</text><text x="120" y="630" font-family="Lexend, Arial" font-size="56" font-weight="600" fill="#1f2a44">' + kacir(dk.baslik) + '</text><text x="120" y="900" font-family="Arial" font-size="34" fill="#1f2a44">' + kacir(tarih) + " · " + dersler(dk).length + " ders, " + kacir(sureYaz(dk.sureDk)) + '</text><text x="120" y="960" font-family="Arial" font-size="34" fill="#1f2a44">Eğitmen: ' + kacir(egitmen(dk).ad) + "</text></svg>";
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })); a.download = "kavis-belge-" + dk.id + ".svg"; document.body.appendChild(a); a.click(); a.remove();
    olay("belge_indir", { kurs: dk.id });
  }
  function ciz() {
    var dl = dersler(dk), d = dl.find(function (x) { return x.anahtar === anahtar; }) || dl[0], i = dl.indexOf(d), t = tamamlananlar(), p = ilerleme(dk, { tamamlanan: t }), bitti = t.indexOf(d.anahtar) >= 0;
    anahtar = d.anahtar;
    document.title = d.ad + " · " + dk.baslik + " · Kavis Akademi";
    var yan = '<h2>' + kacir(dk.baslik) + '</h2><div class="cubuk"><i style="width:' + p.oran + '%"></i></div><small style="color:var(--soluk);font-weight:700">' + p.n + " / " + p.t + " ders tamamlandı, yüzde " + p.oran + "</small>"
      + (dk.mufredat || []).map(function (b, bi) { return '<p class="bolum-ad">' + (bi + 1) + ". " + kacir(b.ad) + "</p><ol>" + dl.filter(function (x) { return x.bolum === bi; }).map(function (x) {
        var ok = t.indexOf(x.anahtar) >= 0, ac = erisim(x);
        return "<li>" + (ac ? '<a class="ders-satir' + (ok ? " bitti" : "") + '" href="ders.html?kurs=' + encodeURIComponent(dk.id) + "&ders=" + encodeURIComponent(x.anahtar) + '"' + (x.anahtar === d.anahtar ? ' aria-current="page"' : "") + ">" : '<div class="ders-satir">') + (ok ? TIK_DOLU : ac ? OYNAT : KILIT) + "<span>" + kacir(x.ad) + "</span><small>" + x.dk + " dk</small>" + (ac ? "</a>" : "</div>") + "</li>";
      }).join("") + "</ol>"; }).join("");
    var ana;
    if (!erisim(d)) {
      ana = '<div class="kapi" style="margin-top:0"><h1>Bu ders kayıtlı öğrencilere açık</h1><p>' + kacir(dk.baslik) + " kursunun ilk dersi herkese ücretsiz. Devam etmek için kursa kaydol.</p><div class=\"eylemler\"><button class=\"dugme sari\" type=\"button\" id=\"kaydol\">" + (Number(dk.fiyat) ? "Kaydol, 7 gün ücretsiz dene" : "Ücretsiz kaydol") + '</button><a class="dugme ikincil" href="kurs.html?id=' + encodeURIComponent(dk.id) + '">Kurs sayfası</a></div></div>';
    } else {
      ana = (!veriVar() ? '<div class="onizleme-not">Canlı önizleme: işaretlediğin dersler bu sayfada kalır, kaydedilmez.</div>' : !dkayit ? '<div class="onizleme-not">Ücretsiz ön izleme dersi. İlerlemeni kaydetmek için kursa kaydol.</div>' : "")
        + '<div class="oynatici"><video src="' + kacir(dk.video) + '" poster="' + kacir(dk.gorsel) + '" controls muted playsinline preload="metadata"></video></div>'
        + '<div class="ders-baslik"><div><p>' + (d.bolum + 1) + ". bölüm · " + kacir(d.bolumAd) + " · Ders " + (i + 1) + " / " + dl.length + "</p><h1>" + kacir(d.ad) + "</h1></div>"
        + (dkayit || !veriVar() ? '<button class="dugme ' + (bitti ? "ikincil" : "nane") + '" type="button" id="isaretle">' + (bitti ? "İşareti kaldır" : (i < dl.length - 1 ? "Tamamladım, sonraki ders" : "Tamamladım")) + "</button>" : '<button class="dugme sari" type="button" id="kaydol">' + (Number(dk.fiyat) ? "Kaydol ve devam et" : "Ücretsiz kaydol") + "</button>") + "</div>"
        + '<div class="ders-gezinti">' + (i > 0 ? '<a class="dugme ikincil kucuk" href="ders.html?kurs=' + encodeURIComponent(dk.id) + "&ders=" + encodeURIComponent(dl[i - 1].anahtar) + '">Önceki ders</a>' : "") + (i < dl.length - 1 && erisim(dl[i + 1]) ? '<a class="dugme ikincil kucuk" href="ders.html?kurs=' + encodeURIComponent(dk.id) + "&ders=" + encodeURIComponent(dl[i + 1].anahtar) + '">Sonraki ders</a>' : "") + '<a class="dugme ikincil kucuk" href="kurs.html?id=' + encodeURIComponent(dk.id) + '">Kurs sayfası</a></div>'
        + (p.n === p.t && p.t ? '<div class="kutlama"><div><h2>Kursu bitirdin, tebrikler!</h2><p>' + p.t + " dersin hepsini tamamladın. Belgeni indirip paylaşabilirsin.</p></div><button class=\"dugme\" type=\"button\" id=\"belge\">Belgeni indir</button></div>" : "")
        + '<div class="not-kutu"><h2>Bu derste</h2><p>' + kacir(d.ad) + " konusunu " + kacir(egitmen(dk).ad) + " ile adım adım işliyoruz. Videoyu izledikten sonra bölüm alıştırmasını kendi bilgisayarında tekrarla; takıldığın yerde videoya geri dönebilirsin.</p></div>";
    }
    $("#dersIcerik").innerHTML = '<section class="kapsayici ders-duzen"><div class="ders-ana">' + ana + '</div><aside class="ders-yan" aria-label="Kurs içeriği">' + yan + "</aside></section>";
    var k = $("#kaydol"); if (k) k.addEventListener("click", function (e) { kaydol(dk, e.currentTarget); });
    var b = $("#belge"); if (b) b.addEventListener("click", belgeIndir);
    var m = $("#isaretle"); if (m) m.addEventListener("click", function () { isaretle(d, i, m); });
  }
  function isaretle(d, i, dugme) {
    var dl = dersler(dk), t = tamamlananlar().slice(), var_ = t.indexOf(d.anahtar);
    if (var_ >= 0) t.splice(var_, 1); else t.push(d.anahtar);
    var tamam = dl.every(function (x) { return t.indexOf(x.anahtar) >= 0; });
    var ileri = var_ < 0 && i < dl.length - 1;
    function sonra() { if (var_ < 0) olay("ders_tamamla", { kurs: dk.id, ders: d.anahtar }); if (tamam && var_ < 0) bildir("Tebrikler, kursu bitirdin!"); if (ileri) anahtar = dl[i + 1].anahtar; history.replaceState(null, "", "ders.html?kurs=" + encodeURIComponent(dk.id) + "&ders=" + encodeURIComponent(anahtar)); ciz(); window.scrollTo({ top: 0, behavior: "smooth" }); }
    if (!dkayit) { yerel = t; return sonra(); }
    dugme.disabled = true;
    vayra.veri.guncelle("kayitlar", dkayit.id, { tamamlanan: t, sonDers: d.anahtar, durum: tamam ? "Tamamlandı" : (dkayit.durum === "Tamamlandı" ? "Aktif" : dkayit.durum) })
      .then(function (y) { dkayit = y || Object.assign(dkayit, { tamamlanan: t }); sonra(); })
      .catch(function (e) { bildir("İlerleme kaydedilemedi: " + e.message, "hata"); dugme.disabled = false; });
  }
  (uyeVar() ? vayra.uye.ben().catch(function () { return null; }) : Promise.resolve(null)).then(function (u) { ben = u; hesapCiz(); return Promise.all([kurslar(), kayitlarim()]); }).then(function (r) {
    dk = r[0].find(function (k) { return k.id === qd.get("kurs"); }) || (!qd.get("kurs") ? r[0][0] : null);
    if (!dk) { $("#dersIcerik").innerHTML = '<section class="kapsayici"><div class="kapi"><h1>Ders bulunamadı</h1><p>Bağlantı eski olabilir.</p><div class="eylemler"><a class="dugme" href="derslerim.html">Derslerim</a></div></div></section>'; return; }
    dkayit = r[1].find(function (x) { return x.kursId === dk.id; }) || null;
    ciz();
  });
}

/* ── Derslerim ── */
if (SAYFA === "derslerim") {
  var yer = $("#derslerim");
  function ciz() {
    if (!uyeVar()) { yer.innerHTML = '<div class="kapi"><h1>Derslerin burada toplanır</h1><p>Bu canlı önizlemede üyelik çalışmaz. Şablonu kullanınca öğrenciler hesap açar, kaydoldukları kursları ve ilerlemelerini burada görür.</p><div class="eylemler"><a class="dugme sari" href="ders.html?kurs=web-gelistirme&amp;ders=b1d1">Bir dersi dene</a><a class="dugme ikincil" href="kurslar.html">Kurslara göz at</a></div></div>'; return; }
    if (!ben) {
      yer.innerHTML = '<div class="giris-kutu"><h2>Derslerine devam et</h2><p>Giriş yap ya da ücretsiz üye ol; kaydolduğun kurslar ve ilerlemen burada.</p><div id="girisInline"></div></div>';
      girisFormuCiz($("#girisInline"), function () { ciz(); });
      return;
    }
    yer.innerHTML = '<div class="iskelet" style="height:180px"></div>';
    Promise.all([kurslar(), kayitlarim()]).then(function (r) {
      var l = r[1].map(function (x) { return { kayit: x, kurs: r[0].find(function (k) { return k.id === x.kursId; }) }; }).filter(function (x) { return x.kurs; })
        .sort(function (a, b) { return (b.kayit.guncelleme || 0) - (a.kayit.guncelleme || 0); });
      var bitenDers = l.reduce(function (t, x) { return t + ilerleme(x.kurs, x.kayit).n; }, 0), biten = l.filter(function (x) { var p = ilerleme(x.kurs, x.kayit); return p.t && p.n === p.t; }).length;
      var ad = String(ben.ad || "").split(" ")[0];
      yer.innerHTML = '<div class="panel-ust"><div><h1 style="font-size:clamp(34px,5vw,56px);letter-spacing:-.04em">' + (ad ? "Merhaba " + kacir(ad) + "." : "Derslerim") + '</h1><p style="color:var(--soluk);margin:6px 0 0;font-size:17px">' + kacir(ben.eposta || "") + '</p></div><a class="dugme sari" href="kurslar.html">Yeni kurs keşfet</a></div>'
        + '<div class="ozet-kartlar"><div><b>' + l.length + "</b><span>kayıtlı kurs</span></div><div><b>" + bitenDers + "</b><span>biten ders</span></div><div><b>" + biten + "</b><span>biten kurs</span></div></div>"
        + (l.length ? '<div class="kayit-liste">' + l.map(function (x) {
          var p = ilerleme(x.kurs, x.kayit), s = sonraki(x.kurs, x.kayit), tamam = p.t && p.n === p.t;
          return '<article class="kayit-kart"><img src="' + kacir(x.kurs.gorsel) + '" alt="" loading="lazy" /><div><h3>' + kacir(x.kurs.baslik) + "</h3><p>" + kacir(egitmen(x.kurs).ad) + " · " + (x.kayit.durum === "Deneme" ? "7 günlük deneme" : tamam ? "Tamamlandı" : "Devam ediyor") + '</p><div class="cubuk"><i style="width:' + p.oran + '%"></i></div><p>' + p.n + " / " + p.t + " ders, yüzde " + p.oran + "</p></div>"
            + '<div class="eylemler"><a class="dugme ' + (tamam ? "ikincil" : "nane") + '" href="ders.html?kurs=' + encodeURIComponent(x.kurs.id) + "&ders=" + encodeURIComponent(s.anahtar) + '">' + (tamam ? "Tekrar izle" : p.n ? "Devam et" : "Başla") + "</a></div></article>";
        }).join("") + "</div>" : '<div class="bos"><b>Henüz bir kursa kaydolmadın</b>Ücretsiz kısa kurslarla başlayabilirsin.<br><a class="dugme sari" href="kurslar.html?fiyat=%C3%9Ccretsiz">Kurslara göz at</a></div>')
        + '<div class="hesap-alt"><button class="dugme ikincil" type="button" id="cikis">Çıkış yap</button><button class="dugme sil" type="button" id="hesapSil">Hesabımı sil</button></div>';
      $("#cikis").addEventListener("click", function () { vayra.uye.cikis().then(function () { ben = null; location.reload(); }); });
      $("#hesapSil").addEventListener("click", function () {
        if (!confirm("Hesabın, kurs kayıtların ve ilerlemen kalıcı olarak silinecek. Emin misin?")) return;
        vayra.uye.hesabiSil().then(function () { ben = null; bildir("Hesabın silindi."); ciz(); }).catch(function (e) { bildir("Silinemedi: " + e.message, "hata"); });
      });
    });
  }
  (uyeVar() ? vayra.uye.ben().catch(function () { return null; }) : Promise.resolve(null)).then(function (u) { ben = u; hesapCiz(); ciz(); });
}

/* Ana sayfa ve katalogda üst çubuktaki hesap adı. */
if (["index", "kurslar"].indexOf(SAYFA) >= 0 && uyeVar()) vayra.uye.ben().then(function (u) { ben = u; hesapCiz(); }).catch(function () {});
/* Galeri önizlemesinde (köprü yokken) kodsuz formlar sayfayı yenilemesin. */
document.addEventListener("submit", function (e) {
  var f = e.target;
  if (!f.hasAttribute || !f.hasAttribute("data-vayra-form") || e.defaultPrevented) return;
  e.preventDefault(); bildir("Bu canlı önizlemede form gönderilmez; şablonu kullanınca gelen kutuna düşer.");
});
`;

const SSS = [
  ["Kurslara ne kadar süre erişebilirim?", "Kaydolduğun kurslara süresiz erişirsin. Kurs güncellendiğinde yeni dersler de hesabına eklenir."],
  ["Ücretli kursları denemeden almak zorunda mıyım?", "Hayır. Her kursun ilk dersi herkese açık; ücretli kurslarda kaydolduktan sonra 7 gün ücretsiz deneme süren var. Satın aldıktan sonra 14 gün içinde koşulsuz iade edilir."],
  ["Tamamlama belgesi veriyor musunuz?", "Evet. Bir kursun bütün derslerini tamamladığında adına düzenlenmiş belgeyi indirip paylaşabilirsin."],
  ["Telefondan izleyebilir miyim?", "Bütün dersler telefon, tablet ve bilgisayarda çalışır. İlerlemen hesabına kaydedildiği için cihaz değiştirsen de kaldığın yerden devam edersin."],
];

export const ONLINE_KURS = {
  id: "online-kurs",
  ad: "Kavis Akademi · Online Kurs",
  tur: "site" as const,
  aciklama: "Online kurs platformu: aramalı katalog, müfredatlı kurs sayfası, üyelikle kayıt, ders oynatıcı, ders ders ilerleme, yorumlar ve tamamlama belgesi",
  kapak: "/gercek/build/sablon/online-kurs.webp",
  tablolar: TABLOLAR,
  dosyalar: {
    "index.html": sayfa("index.html", "Kavis Akademi · Tasarım, yazılım, veri ve fotoğraf kursları", "Uygulamalı online kurslar: arayüz tasarımı, web geliştirme, Python ile veri analizi ve fotoğraf. Kendi hızında öğren.", `<section class="kapsayici kahraman">
  <div>
    <span class="ust-yazi">Yeni: React ile Modern Arayüzler yayında</span>
    <h1>Yeni bir beceri, <mark>kendi hızında.</mark></h1>
    <p class="giris">Tasarım, yazılım, veri ve fotoğraf için uygulamalı kurslar. Kısa dersler, gerçek projeler ve ilerlemeni takip eden bir panel.</p>
    <form class="arama" action="kurslar.html" role="search"><label class="gizli" for="anaAra">Kurs ara</label>${ARA}<input id="anaAra" name="ara" type="search" placeholder="Ne öğrenmek istiyorsun?" autocomplete="off" /><button class="dugme" type="submit">Ara</button></form>
    <div class="populer"><span>Çok arananlar:</span><a href="kurslar.html?ara=Python">Python</a><a href="kurslar.html?ara=React">React</a><a href="kurslar.html?ara=tasar%C4%B1m">Tasarım</a><a href="kurslar.html?ara=SQL">SQL</a></div>
  </div>
  <div class="vitrin">
    <figure><img src="/gercek/havuz/gorsel/mk-teknoloji-4938.webp" alt="Dizüstü bilgisayarda ders izleyen öğrenci" /></figure>
    <div class="yuzen y1"><b>Flexbox ile yerleşim</b><small>Sıfırdan Web Geliştirme · Ders 6</small><div class="cubuk"><i style="width:36%"></i></div><small>5 / 14 ders tamamlandı</small></div>
    <div class="yuzen y2"><span class="yigin"><img src="/gercek/paz/av-mei.webp" alt="" /><img src="/gercek/paz/av-liam.webp" alt="" /><img src="/gercek/paz/av-lily.webp" alt="" /></span><span><b>48.000 öğrenci</b><small>Ortalama puan 4,8</small></span></div>
  </div>
</section>
<section class="kapsayici">
  <div class="rakam-serit">
    <div><b>${KURSLAR.length}</b><span>uygulamalı kurs</span></div>
    <div><b>${KURSLAR.reduce((t, k) => t + k.dersSayisi, 0)}</b><span>kısa ders</span></div>
    <div><b>4,8</b><span>ortalama puan</span></div>
    <div><b>14 gün</b><span>koşulsuz iade</span></div>
  </div>
</section>
<section class="kapsayici bolum" style="padding-top:0">
  <div class="bolum-ust"><div><h2>Ne öğrenmek istersin?</h2><p>Dört alanda, başlangıçtan ileri seviyeye kadar kurslar.</p></div><a class="dugme ikincil" href="kurslar.html">Bütün kurslar</a></div>
  <div class="kategoriler">
${KATEGORILER.map((k) => `    <a class="kategori k-${KAT_BILGI[k][0]}" href="kurslar.html?kategori=${encodeURIComponent(k)}"><div><h3>${k}</h3><p>${KAT_BILGI[k][1]}</p></div><div class="say"><span data-kat-say="${k}">${KURSLAR.filter((x) => x.kategori === k).length} kurs</span><i>${OK}</i></div></a>`).join("\n")}
  </div>
</section>
<section class="kapsayici bolum" style="padding-top:0">
  <div class="bolum-ust"><div><h2>Öğrencilerin en sevdikleri</h2><p>Bu ay en çok kaydolunan ve en yüksek puan alan kurslar.</p></div></div>
  <div class="kurs-izgara" id="oneCikan">
${KURSLAR.filter((k) => k.one).slice(0, 6).map(kursKarti).join("\n")}
  </div>
</section>
<section class="kapsayici bolum" style="padding-top:0">
  <div class="bolum-ust"><div><h2>Nasıl çalışır?</h2></div></div>
  <div class="adimlar">
    <div><h3>İlk dersi ücretsiz izle</h3><p>Her kursun ilk dersi herkese açık. Anlatımı ve tempoyu beğenip beğenmediğine karar ver.</p></div>
    <div><h3>Kaydol ve kendi hızında ilerle</h3><p>Dersler 10 ile 40 dakika arası. Bitirdiğin dersleri işaretle, kaldığın yerden devam et.</p></div>
    <div><h3>Projeni bitir, belgeni al</h3><p>Her kurs gerçek bir projeyle biter. Bütün dersleri tamamlayınca belgen hazır.</p></div>
  </div>
</section>
<section class="kapsayici bolum" style="padding-top:0">
  <div class="bolum-ust"><div><h2>Eğitmenlerimiz</h2><p>Her biri anlattığı işi bugün yapıyor.</p></div></div>
  <div class="egitmen-serit">
${Object.values(EGITMENLER).map((e) => `    <div class="egitmen-kart"><img src="${e.foto}" alt="${e.ad}" loading="lazy" /><b>${e.ad}</b><span>${e.unvan}</span></div>`).join("\n")}
  </div>
</section>
<section class="kapsayici bolum" style="padding-top:0">
  <div class="bolum-ust"><div><h2>Öğrencilerden</h2></div></div>
  <div class="yorum-izgara">
${[YORUMLAR[0], YORUMLAR[3], YORUMLAR[5]].map((y) => `    <figure class="yorum" style="margin:0"><span class="yildizlar">${YILDIZ.repeat(5)}</span><p>${y.metin}</p><footer><span>${y.ad}<small>${KURSLAR.find((k) => k.id === y.kursId)!.baslik}</small></span></footer></figure>`).join("\n")}
  </div>
</section>
<section class="kapsayici bolum" style="padding-top:0" id="sss">
  <div class="bolum-ust"><div><h2>Sık sorulanlar</h2></div></div>
  <div class="sss">
${SSS.map(([s, c], i) => `    <details${i === 0 ? " open" : ""}><summary>${s}</summary><p>${c}</p></details>`).join("\n")}
  </div>
</section>
<section class="kapsayici">
  <div class="cagri"><div><h2>Bugün ilk dersini izle.</h2><p>Üye olmak ücretsiz. İki ücretsiz kısa kursla hemen başlayabilirsin.</p></div><div class="eylemler"><a class="dugme sari" href="kurslar.html?fiyat=%C3%9Ccretsiz">Ücretsiz kurslar</a><a class="dugme ikincil" href="kurslar.html">Bütün kurslar</a></div></div>
</section>`),
    "kurslar.html": sayfa("kurslar.html", "Kurslar · Kavis Akademi", "Tasarım, yazılım, veri ve fotoğraf kursları: seviyeye, fiyata ve kategoriye göre süz.", `<section class="kapsayici sayfa-bas">
  <h1>Bütün kurslar</h1>
  <p>Kategoriye, seviyeye ve fiyata göre süz; her kursun ilk dersi ücretsiz.</p>
</section>
<section class="kapsayici katalog">
  <aside class="suzgec" aria-label="Süzgeçler">
    <div><h2>Kategori</h2><div class="secenekler" id="kKategori"></div></div>
    <div><h2>Seviye</h2><div class="secenekler" id="kSeviye"></div></div>
    <div><h2>Fiyat</h2><div class="secenekler" id="kFiyat"></div></div>
  </aside>
  <div>
    <div class="ust-cubuk">
      <form class="arama" id="araForm" role="search"><label class="gizli" for="ara">Kurs ara</label>${ARA}<input id="ara" type="search" placeholder="Kurs, konu ya da eğitmen ara" autocomplete="off" /></form>
      <label class="sirala"><span id="sonuc" aria-live="polite"></span><span class="gizli">Sırala</span><select id="sirala"><option value="onerilen">Önerilen</option><option value="puan">En yüksek puan</option><option value="kisa">En kısa</option><option value="fiyat">Fiyat, düşükten</option></select></label>
    </div>
    <div class="kurs-izgara" id="katalogIzgara"></div>
  </div>
</section>`),
    "kurs.html": sayfa("kurs.html", "Kurs · Kavis Akademi", "Kurs ayrıntısı: müfredat, eğitmen, değerlendirmeler ve kayıt.", `<div id="kursIcerik"><section class="kapsayici" style="padding-top:20px"><div class="iskelet" style="height:420px"></div></section></div>`),
    "ders.html": sayfa("ders.html", "Ders · Kavis Akademi", "Ders oynatıcısı ve kurs içeriği.", `<div id="dersIcerik"><section class="kapsayici" style="padding-top:22px"><div class="iskelet" style="height:460px"></div></section></div>`),
    "derslerim.html": sayfa("derslerim.html", "Derslerim · Kavis Akademi", "Kaydolduğun kurslar ve ilerlemen.", `<section class="kapsayici" style="padding-top:clamp(28px,5vw,56px)" id="derslerim"><div class="iskelet" style="height:240px"></div></section>`),
    "ikon.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="13" fill="#1f2a44"/><path d="M10 27c3-9 8-14 15-14 2.5 0 4 .6 5 1.3" fill="none" stroke="#ffc83d" stroke-width="4" stroke-linecap="round"/><circle cx="29" cy="25.5" r="3.3" fill="#3cc39a"/></svg>',
    "stil.css": STIL,
    "app.js": UYGULAMA,
  },
};
