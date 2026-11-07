/* Şablon: Ürün Zirvesi İstanbul 2027 — iki günlük ürün ve teknoloji konferansı. Program "oturumlar" tablosundan (gün sekmeleri,
 * salon ve tür süzgeci), yıldızlanan oturumlarla kişisel "Programım" (localStorage, çakışma uyarısı, takvime aktarma),
 * "konusmacilar" tablosundan konuşmacılar ve ayrıntı penceresi, "biletler" tablosundan bilet türleri; kalan kontenjan kişisel
 * veri göstermeden api/kalan.js sunucu fonksiyonundan gelir, kayıt "kayitlar" tablosuna yazılır (ziyaretçi ekler, okuyamaz).
 * Geri sayım, mekân haritası, SSS ve bülten formu. */
import type { SablonTablo } from "./kurulum";
import { ORTAK_JS } from "./ortak";

const GUNLER = [
  { tarih: "2027-04-14", ad: "1. gün", uzun: "14 Nisan Çarşamba" },
  { tarih: "2027-04-15", ad: "2. gün", uzun: "15 Nisan Perşembe" },
];
const SALONLAR = ["Ana Sahne", "Tasarım Salonu", "Atölye Odası"];
const TURLER = ["Konuşma", "Panel", "Atölye", "Ara"];

const KONUSMACILAR = [
  { id: "zeynep", ad: "Zeynep Arslan", unvan: "Ürün Direktörü", sirket: "Kumbara", foto: "/gercek/paz/av-naomi.webp", hakkinda: "Kumbara'da dört ürün ekibini yönetiyor; uygulamanın aylık aktif kullanıcısı onun döneminde üç katına çıktı. Zirvenin açılış ve kapanışını yapıyor.", one: true },
  { id: "selin", ad: "Selin Aydın", unvan: "Yapay Zekâ Ürün Yöneticisi", sirket: "Sinyal Bank", foto: "/gercek/paz/av-priya.webp", hakkinda: "Bankacılıkta sohbet tabanlı asistanların ürün tarafını kuruyor. Daha önce arama ve öneri sistemleri üzerinde çalıştı; güvenilir yapay zekâ deneyimleri üzerine yazıyor.", one: true },
  { id: "emre", ad: "Emre Yazıcı", unvan: "Kurucu ortak ve ürün başkanı", sirket: "Rota Mobilite", foto: "/gercek/paz/av-malik.webp", hakkinda: "Paylaşımlı ulaşım girişimi Rota'yı iki arkadaşıyla kurdu, bugün altı şehirde çalışıyorlar. Yol haritası yerine sonuç haritasıyla çalışmayı savunuyor.", one: true },
  { id: "defne", ad: "Defne Koç", unvan: "Tasarım Sistemleri Lideri", sirket: "Atlas Pazaryeri", foto: "/gercek/paz/av-hana.webp", hakkinda: "Atlas'ın tasarım sistemini yedi ürün ekibinin ortak diline dönüştüren ekibin lideri. Bileşen kütüphanelerini birer ürün gibi yönetmeyi anlatıyor.", one: true },
  { id: "asli", ad: "Aslı Demir", unvan: "Genel Müdür", sirket: "Defne Sağlık", foto: "/gercek/muzik/vs-kehribar.webp", hakkinda: "Dijital sağlık girişimi Defne Sağlık'ın genel müdürü. Yirmi yıllık kariyerinin yarısını telekom ürünlerinde, yarısını sağlıkta geçirdi.", one: true },
  { id: "kaan", ad: "Kaan Öztürk", unvan: "Mühendislik Başkan Yardımcısı", sirket: "Lokma", foto: "/gercek/paz/av-tae.webp", hakkinda: "Lokma'da 140 kişilik mühendislik organizasyonundan sorumlu. Platform ekipleriyle ürün ekipleri arasındaki iş bölümünü yeniden kurguladı.", one: true },
  { id: "elif", ad: "Elif Şahin", unvan: "Kullanıcı Araştırmaları Müdürü", sirket: "Defne Sağlık", foto: "/gercek/paz/av-margot.webp", hakkinda: "Hastalar, hekimler ve eczacılarla yüzlerce görüşme yaptı. Araştırma bulgularını karar vericilere kısa ve ikna edici biçimde anlatma üzerine atölyeler veriyor.", one: true },
  { id: "murat", ad: "Murat Kaya", unvan: "Kurucu ortak", sirket: "Pusula Girişim Sermayesi", foto: "/gercek/muzik/vs-depo.webp", hakkinda: "Erken aşama yazılım girişimlerine yatırım yapan Pusula'nın kurucu ortağı. Kendisi de iki şirket kurup sattı; kurucularla ürün kararları üzerine panel yönetiyor.", one: true },
  { id: "ipek", ad: "İpek Güler", unvan: "Ürün Pazarlama Direktörü", sirket: "Kumbara", foto: "/gercek/paz/av-sofia.webp", hakkinda: "Fiyatlandırma, paketleme ve lansman konularında çalışıyor. Kumbara'nın abonelik modeline geçişini yöneten ekibin başındaydı.", one: false },
  { id: "deniz", ad: "Deniz Aksu", unvan: "Erişilebilirlik Uzmanı", sirket: "Bağımsız danışman", foto: "/gercek/muzik/vs-kuyu.webp", hakkinda: "Kamu ve özel sektörde onlarca dijital hizmetin erişilebilirlik denetimini yaptı. Ekran okuyucu kullanıcılarıyla birlikte test etmeyi öğretiyor.", one: false },
  { id: "can", ad: "Can Erdem", unvan: "Baş Tasarımcı", sirket: "Kervan Lojistik", foto: "/gercek/paz/av-ryu.webp", hakkinda: "Kuryeler ve depo çalışanları için sahada kullanılan uygulamaları tasarlıyor. Tasarımcı ile geliştiricinin aynı masada çalıştığı ekipler kurdu.", one: false },
  { id: "onur", ad: "Onur Tekin", unvan: "Veri Bilimi Lideri", sirket: "Lokma", foto: "/gercek/muzik/vs-kuzey.webp", hakkinda: "Teslimat süresi tahmini ve kurye atama modellerinden sorumlu. Deney tasarımı ve ürün metrikleri üzerine konuşuyor.", one: false },
  { id: "nil", ad: "Nil Bayram", unvan: "Kıdemli Ürün Tasarımcısı", sirket: "Atlas Pazaryeri", foto: "/gercek/paz/av-yuna.webp", hakkinda: "Arayüz metinleri, boş durumlar ve hareket tasarımıyla ilgileniyor. Küçük ayrıntıların algılanan kaliteyi nasıl değiştirdiğini ölçüyor.", one: false },
  { id: "burak", ad: "Burak Çelik", unvan: "Büyüme Lideri", sirket: "Yalı Oyun", foto: "/gercek/paz/av-niko.webp", hakkinda: "Mobil oyunlarda öğrendiği büyüme döngülerini ürün ekiplerine uyarlıyor. Yalı Oyun'un iki oyununu on milyon indirmenin üzerine taşıdı.", one: false },
  { id: "tolga", ad: "Tolga Şen", unvan: "Teknoloji Direktörü", sirket: "Kervan Lojistik", foto: "/gercek/paz/av-jayden.webp", hakkinda: "Gerçek zamanlı takip ve rota planlama sistemlerinin mimarı. Yapay zekâ destekli geliştirme araçlarını ekiplerine yayan isimlerden.", one: false },
  { id: "yasemin", ad: "Yasemin Özer", unvan: "Moderatör, Ürün Sohbetleri podcast'i", sirket: "Ürün Sohbetleri", foto: "/gercek/paz/av-amara.webp", hakkinda: "Haftalık Ürün Sohbetleri podcast'inin sunucusu. Zirvenin panellerini yönetiyor ve ikinci gün canlı yayın kaydını yapıyor.", one: false },
];

type Oturum = { id: string; gun: string; bas: string; bit: string; salon: string; tur: string; baslik: string; ozet: string; konusmacilar: string };
const O = (id: string, gun: number, bas: string, bit: string, salon: string, tur: string, baslik: string, konusmacilar: string, ozet: string): Oturum => ({ id, gun: GUNLER[gun].tarih, bas, bit, salon, tur, baslik, konusmacilar, ozet });
const OTURUMLAR: Oturum[] = [
  O("g1-kayit", 0, "08:30", "09:30", "Fuaye", "Ara", "Kayıt, yaka kartı ve kahve", "", "Yaka kartını fuayedeki kayıt masalarından al; QR kodunu telefonundan göstermen yeterli."),
  O("g1-acilis", 0, "09:30", "10:00", "Ana Sahne", "Konuşma", "Açılış: ürün ekipleri 2027'de neyi farklı yapacak?", "zeynep", "Bir yılda yüzlerce ürün ekibiyle yapılan görüşmelerden çıkan beş değişim ve bu iki günün yol haritası."),
  O("g1-yz", 0, "10:00", "10:40", "Ana Sahne", "Konuşma", "Yapay zekâ özellikleri gerçek kullanıcıyla buluşunca", "selin", "Bankacılık asistanının ilk altı ayı: neler işe yaradı, neleri geri aldık ve güveni nasıl ölçtük."),
  O("g1-sistem", 0, "10:00", "10:40", "Tasarım Salonu", "Konuşma", "Tasarım sistemi bir ürün gibi yönetilir", "defne", "Bileşen kütüphanesine yol haritası, kullanıcı araştırması ve sürüm notu yazmanın faydaları."),
  O("g1-gorusme", 0, "10:00", "11:30", "Atölye Odası", "Atölye", "Atölye: iyi bir kullanıcı görüşmesi nasıl yapılır?", "elif", "Yönlendirmeyen sorular, sessizliği kullanmak ve notları bulguya çevirmek; eşli uygulamalı çalışma. 40 kişilik."),
  O("g1-ara1", 0, "10:40", "11:00", "Fuaye", "Ara", "Kahve arası", "", "Sponsor alanında ürün demoları ve tanışma köşesi."),
  O("g1-fiyat", 0, "11:00", "11:40", "Ana Sahne", "Konuşma", "Fiyatlandırma deneyleri: on iki ayda öğrendiklerimiz", "ipek", "Ücretsiz plandan aboneliğe geçişte denediğimiz yedi fiyat sayfası ve dönüşüme etkileri."),
  O("g1-erisim", 0, "11:00", "11:40", "Tasarım Salonu", "Konuşma", "Erişilebilirlik bir kontrol listesi değildir", "deniz", "Ekran okuyucu kullanıcılarıyla yapılan testlerden canlı kayıtlar ve ekiplerin en sık atladığı on konu."),
  O("g1-panel", 0, "11:50", "12:40", "Ana Sahne", "Panel", "Panel: kurucular ürün kararlarını nasıl veriyor?", "murat,asli,emre", "Erken aşamada sezgi ile veri arasındaki denge, yatırımcı baskısı ve hayır demenin maliyeti."),
  O("g1-koda", 0, "11:50", "12:30", "Tasarım Salonu", "Konuşma", "Tasarım dosyasından koda: aynı masada çalışmak", "can", "Tasarımcı ve geliştiricinin aynı sprintte, aynı belgede çalıştığı bir ekip düzeni."),
  O("g1-ogle", 0, "12:40", "13:50", "Fuaye", "Ara", "Öğle yemeği", "", "Haliç Terası'nda açık büfe; vejetaryen ve glutensiz seçenekler işaretli."),
  O("g1-deney", 0, "13:50", "14:30", "Ana Sahne", "Konuşma", "Teslimat süresini dokuz dakika kısaltan deney", "onur", "Bir hipotezden şehir çapında yayına: deney tasarımı, yan etkiler ve karar toplantısı."),
  O("g1-prototip", 0, "13:50", "15:20", "Atölye Odası", "Atölye", "Atölye: bir haftada tıklanabilir prototip", "can,defne", "Problem tanımından test edilebilir prototipe uzanan beş adımlık bir sprint, küçük gruplarla. 40 kişilik."),
  O("g1-anlatim", 0, "13:50", "14:30", "Tasarım Salonu", "Konuşma", "Araştırma bulgularını yöneticilere anlatmak", "elif", "Yüz sayfalık rapor yerine üç cümle: bulguyu karara bağlayan anlatım kalıpları."),
  O("g1-platform", 0, "14:40", "15:20", "Ana Sahne", "Konuşma", "Platform ekipleriyle ürün ekipleri arasındaki sözleşme", "kaan", "Kimin neyi, ne zaman teslim edeceğini yazılı hâle getirince hız nasıl arttı."),
  O("g1-hareket", 0, "14:40", "15:20", "Tasarım Salonu", "Konuşma", "Hareket tasarımı ve algılanan hız", "nil", "Aynı yükleme süresi, iki farklı his: geçişlerin ve iskelet ekranların ölçülen etkisi."),
  O("g1-ara2", 0, "15:20", "15:50", "Fuaye", "Ara", "Kahve arası", "", "Konuşmacılarla soru cevap masası fuayede kurulu."),
  O("g1-yzpanel", 0, "15:50", "16:40", "Ana Sahne", "Panel", "Panel: yapay zekâ ekip yapısını nasıl değiştiriyor?", "yasemin,selin,tolga,kaan", "Kodlama asistanları, yeni roller ve ürün ekibinin büyüklüğü üzerine açık bir tartışma."),
  O("g1-metrik", 0, "15:50", "17:20", "Atölye Odası", "Atölye", "Atölye: ürün metrikleri ağacı kurmak", "onur", "Kuzey yıldızı metriğinden ekip hedeflerine inen bir ağacı kendi ürününle birlikte kur. 40 kişilik."),
  O("g1-kapanis", 0, "16:50", "17:30", "Ana Sahne", "Konuşma", "Yavaş ürünler, sadık kullanıcılar", "asli", "Sağlıkta güvenin hızdan daha değerli olduğu durumlar ve bunun ürün kararlarına yansıması."),
  O("g1-resepsiyon", 0, "17:30", "19:30", "Haliç Terası", "Ara", "Tanışma resepsiyonu", "", "Haliç manzarasında içecekler, canlı müzik ve konuşmacılarla sohbet."),
  O("g2-kahve", 1, "09:00", "09:30", "Fuaye", "Ara", "Kahve ve tanışma", "", "İkinci güne hafif bir başlangıç; kayıt masası açık."),
  O("g2-buyume", 1, "09:30", "10:10", "Ana Sahne", "Konuşma", "Büyüme döngüleri: oyunlardan ürünlere dersler", "burak", "Davet, ödül ve geri dönüş döngülerini oyun dışı ürünlere taşırken dikkat edilecekler."),
  O("g2-metin", 1, "09:30", "10:10", "Tasarım Salonu", "Konuşma", "Boş durumlar, hata mesajları ve küçük metinler", "nil", "Kullanıcının en çok takıldığı anlarda yazılan iki cümlenin destek taleplerine etkisi."),
  O("g2-denetim", 1, "09:30", "11:00", "Atölye Odası", "Atölye", "Atölye: erişilebilirlik denetimi uygulaması", "deniz", "Kendi ürününü klavye ve ekran okuyucuyla denetle, bulguları önceliklendir. 40 kişilik."),
  O("g2-lojistik", 1, "10:20", "11:00", "Ana Sahne", "Konuşma", "Lojistikte gerçek zamanlı ürün: sahadan notlar", "tolga", "Bağlantının koptuğu depolarda çalışan bir uygulamayı ayakta tutmanın mühendisliği."),
  O("g2-sohbet", 1, "10:20", "11:00", "Tasarım Salonu", "Konuşma", "Sohbet arayüzleri için tasarım ilkeleri", "selin", "Ne zaman sohbet, ne zaman form? Yapay zekâ arayüzlerinde beklenti yönetimi."),
  O("g2-ara1", 1, "11:00", "11:20", "Fuaye", "Ara", "Kahve arası", "", "Sponsor alanında ürün demoları."),
  O("g2-kuresel", 1, "11:20", "12:10", "Ana Sahne", "Panel", "Panel: Türkiye'den küresel ürün çıkarmak", "murat,burak,zeynep", "Yerelleştirme, ödeme altyapısı, ekip kurmak ve ilk yurt dışı pazarı seçmek."),
  O("g2-lansman", 1, "11:20", "12:00", "Tasarım Salonu", "Konuşma", "Lansman metni yazmak: ürün duyurusunun anatomisi", "ipek", "Bir özelliği kullanıcıya anlatan sayfa, e-posta ve uygulama içi mesaj nasıl yazılır."),
  O("g2-yzatolye", 1, "11:20", "12:50", "Atölye Odası", "Atölye", "Atölye: yapay zekâ ile hızlı prototip", "selin,tolga", "Bir fikri doksan dakikada çalışan bir prototipe dönüştürüyoruz; dizüstü bilgisayarını getir. 40 kişilik."),
  O("g2-ogle", 1, "12:10", "13:20", "Fuaye", "Ara", "Öğle yemeği", "", "Haliç Terası'nda açık büfe."),
  O("g2-sonuc", 1, "13:20", "14:00", "Ana Sahne", "Konuşma", "Yol haritası yerine sonuç haritası", "emre", "Tarihli özellik listesini bırakıp ölçülebilir sonuçlara göre planlamaya geçen bir şirketin hikâyesi."),
  O("g2-guven", 1, "13:20", "14:00", "Tasarım Salonu", "Konuşma", "Hassas verilerle tasarım: sağlıkta güven", "elif", "Kullanıcıdan sağlık verisi isterken izin, açıklama ve kontrolü tasarlamak."),
  O("g2-tahmin", 1, "14:10", "14:50", "Ana Sahne", "Konuşma", "Mühendislik ile ürün arasında tahmin oyunu bitmeli", "kaan", "Süre tahmini yerine küçük teslimatlar ve görünür risklerle çalışan ekipler."),
  O("g2-fiyatklinik", 1, "14:10", "15:40", "Atölye Odası", "Atölye", "Atölye: fiyat sayfası kliniği", "ipek", "Katılımcıların fiyat sayfalarını canlı olarak birlikte inceliyor ve yeniden yazıyoruz. 40 kişilik."),
  O("g2-mobil", 1, "14:10", "14:50", "Tasarım Salonu", "Konuşma", "Mobil uygulamada ilk otuz saniye", "can", "İlk açılış, izin istekleri ve ilk başarı anı: kaybedilen kullanıcıyı geri kazanmak."),
  O("g2-veri", 1, "15:00", "15:40", "Ana Sahne", "Konuşma", "Veri ekipleri ürün ekiplerine nasıl yerleşir?", "onur", "Merkezi analiz ekibinden ürün ekiplerine dağılan veri bilimcilerin ilk yılı."),
  O("g2-ara2", 1, "15:40", "16:10", "Fuaye", "Ara", "Kahve arası", "", "Konuşmacılarla soru cevap masası fuayede."),
  O("g2-canli", 1, "16:10", "17:00", "Ana Sahne", "Panel", "Canlı kayıt: Ürün Sohbetleri", "yasemin,zeynep,emre", "Podcast'in zirve bölümü seyirci sorularıyla salonda kaydediliyor."),
  O("g2-kapanis", 1, "17:00", "17:30", "Ana Sahne", "Konuşma", "Kapanış ve ürün ekibi ödülleri", "zeynep", "İki günün özeti ve topluluğun oylarıyla seçilen yılın ürün ekipleri."),
];

const BILETLER = [
  { id: "erken", ad: "Erken kayıt", fiyat: 2950, kontenjan: 300, ayrilan: 300, enAz: 1, enCok: 5, aciklama: "İlk 300 katılımcıya özel fiyat.", ozellikler: "İki gün bütün oturumlar\nAtölyelere öncelikli kayıt\nÖğle yemekleri ve kahve araları\nKayıtlara bir yıl erişim", sira: 1 },
  { id: "standart", ad: "Standart", fiyat: 3900, kontenjan: 900, ayrilan: 612, enAz: 1, enCok: 5, aciklama: "İki günlük tam katılım.", ozellikler: "İki gün bütün oturumlar\nAtölyelere kayıt, yer oldukça\nÖğle yemekleri ve kahve araları\nKayıtlara bir yıl erişim", sira: 2 },
  { id: "ogrenci", ad: "Öğrenci", fiyat: 1250, kontenjan: 120, ayrilan: 104, enAz: 1, enCok: 1, aciklama: "Geçerli öğrenci belgesiyle; girişte kontrol edilir.", ozellikler: "İki gün bütün oturumlar\nÖğle yemekleri ve kahve araları\nKişiye özel, devredilemez", sira: 3 },
  { id: "kurumsal", ad: "Kurumsal", fiyat: 3350, kontenjan: 200, ayrilan: 80, enAz: 5, enCok: 30, aciklama: "Beş ve üzeri kişilik ekipler için kişi başı fiyat.", ozellikler: "Standart biletin bütün hakları\nKurum adına tek fatura\nEkibe ayrılmış atölye yerleri\nKatılımcı adlarını sonradan değiştirme", sira: 4 },
];

const TABLOLAR: Record<string, SablonTablo> = {
  oturumlar: {
    aciklama: "Zirve programı. Program ve Programım sayfaları bu tablodan okur. konusmacilar alanı virgülle konuşmacı kimlikleridir (konusmacilar tablosu).",
    kurallar: { okuma: "herkes", ekleme: "kapali", duzenleme: "kapali" },
    sema: [
      { ad: "gun", tur: "secim", zorunlu: true, secenekler: GUNLER.map((g) => g.tarih) },
      { ad: "bas", tur: "metin", zorunlu: true, aciklama: "Başlangıç, SS:DD" },
      { ad: "bit", tur: "metin", zorunlu: true, aciklama: "Bitiş, SS:DD" },
      { ad: "salon", tur: "secim", zorunlu: true, secenekler: [...SALONLAR, "Fuaye", "Haliç Terası"] },
      { ad: "tur", tur: "secim", zorunlu: true, secenekler: TURLER },
      { ad: "baslik", tur: "metin", zorunlu: true },
      { ad: "ozet", tur: "uzunMetin" },
      { ad: "konusmacilar", tur: "metin", aciklama: "Virgülle konuşmacı kimlikleri, örneğin selin,tolga" },
      { ad: "aktif", tur: "mantiksal", varsayilan: true },
    ],
    kayitlar: OTURUMLAR.map((o) => ({ ...o, aktif: true })),
  },
  konusmacilar: {
    aciklama: "Konuşmacılar. one: ana sayfada öne çıkar. foto: görsel adresi.",
    kurallar: { okuma: "herkes", ekleme: "kapali", duzenleme: "kapali" },
    sema: [
      { ad: "ad", tur: "metin", zorunlu: true },
      { ad: "unvan", tur: "metin" },
      { ad: "sirket", tur: "metin" },
      { ad: "foto", tur: "gorsel" },
      { ad: "hakkinda", tur: "uzunMetin" },
      { ad: "one", tur: "mantiksal", varsayilan: false, aciklama: "Ana sayfada öne çıkar" },
      { ad: "sira", tur: "sayi" },
    ],
    kayitlar: KONUSMACILAR.map((k, i) => ({ ...k, sira: i + 1 })),
  },
  biletler: {
    aciklama: "Bilet türleri. Kalan bilet: kontenjan eksi ayrilan (gişe ve önceki satışlar) eksi siteden gelen kayıtlar. satista kapalıysa bilet satılmaz.",
    kurallar: { okuma: "herkes", ekleme: "kapali", duzenleme: "kapali" },
    sema: [
      { ad: "ad", tur: "metin", zorunlu: true },
      { ad: "fiyat", tur: "sayi", zorunlu: true, aciklama: "Kişi başı, KDV dahil, TL" },
      { ad: "kontenjan", tur: "sayi", zorunlu: true },
      { ad: "ayrilan", tur: "sayi", varsayilan: 0, aciklama: "Siteden önce satılan ya da ayrılan bilet sayısı" },
      { ad: "enAz", tur: "sayi", varsayilan: 1 },
      { ad: "enCok", tur: "sayi", varsayilan: 5 },
      { ad: "aciklama", tur: "metin" },
      { ad: "ozellikler", tur: "uzunMetin", aciklama: "Her satıra bir madde" },
      { ad: "satista", tur: "mantiksal", varsayilan: true },
      { ad: "sira", tur: "sayi" },
    ],
    kayitlar: BILETLER.map((b) => ({ ...b, satista: true })),
  },
  kayitlar: {
    aciklama: "Siteden gelen bilet kayıtları. Ziyaretçi ekleyebilir ama okuyamaz; kalan bilet sayısı api/kalan.js ile kişisel veri olmadan hesaplanır.",
    kurallar: { okuma: "kapali", ekleme: "herkes", duzenleme: "kapali" },
    sema: [
      { ad: "kod", tur: "metin", zorunlu: true, aciklama: "Kayıt kodu, UZ27-XXXXXX" },
      { ad: "bilet", tur: "metin", zorunlu: true, aciklama: "biletler tablosundaki kimlik" },
      { ad: "biletAd", tur: "metin" },
      { ad: "adet", tur: "sayi", zorunlu: true },
      { ad: "tutar", tur: "sayi", aciklama: "TL, KDV dahil" },
      { ad: "ad", tur: "metin", zorunlu: true },
      { ad: "eposta", tur: "eposta", zorunlu: true },
      { ad: "telefon", tur: "metin" },
      { ad: "sirket", tur: "metin" },
      { ad: "unvan", tur: "metin" },
      { ad: "katilimcilar", tur: "uzunMetin", aciklama: "Kurumsal kayıtta ekip üyelerinin adları" },
      { ad: "fatura", tur: "secim", secenekler: ["Bireysel", "Kurumsal"], varsayilan: "Bireysel" },
      { ad: "kvkk", tur: "mantiksal", zorunlu: true },
      { ad: "bulten", tur: "mantiksal", varsayilan: false },
      { ad: "durum", tur: "secim", secenekler: ["Ödeme bekliyor", "Ödendi", "İptal"], varsayilan: "Ödeme bekliyor" },
    ],
    kayitlar: [],
  },
};

const KALAN = String.raw`/* Sunucu fonksiyonu: bilet türlerine göre siteden satılan bilet adedi (GET /api/kalan).
 * "kayitlar" tablosu ziyaretçiye kapalıdır; burada yalnız sayılar döner, kimin kaydolduğu dönmez. İptal edilenler sayılmaz. */
export default async function (istek, vayra) {
  var kayitlar = await vayra.veri.liste("kayitlar", { sinir: 1000 });
  var satilan = {};
  kayitlar.forEach(function (k) {
    if (k.durum === "İptal" || !k.bilet) return;
    satilan[k.bilet] = (satilan[k.bilet] || 0) + Math.max(1, Number(k.adet) || 1);
  });
  return { durum: 200, basliklar: { "Cache-Control": "no-store" }, govde: { satilan: satilan } };
}
`;

const OK = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const LOGO = '<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="11" fill="currentColor"/><path d="M11 27 20 11l9 16" fill="none" stroke="#fbfaf7" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="20" cy="27" r="2.6" fill="#ff6b4a"/></svg>';

const ust = (aktif: string) => `<a class="atla" href="#icerik">İçeriğe geç</a>
<header class="ust">
  <a class="logo" href="index.html" aria-label="Ürün Zirvesi İstanbul ana sayfa">${LOGO}<span>Ürün Zirvesi<small>İstanbul 2027</small></span></a>
  <nav class="menu" data-menu aria-label="Ana menü">
${[["program.html", "Program"], ["konusmacilar.html", "Konuşmacılar"], ["programim.html", "Programım"], ["bilet.html", "Biletler"], ["index.html#mekan", "Mekân"]].map(([h, a]) => `    <a href="${h}"${h === aktif ? ' aria-current="page"' : ""}>${a}${h === "programim.html" ? ' <b class="sayi" data-programim-sayi hidden>0</b>' : ""}</a>`).join("\n")}
  </nav>
  <a class="dugme kucuk" href="bilet.html">Bilet al</a>
  <button class="menu-dugme" type="button" data-menu-ac aria-expanded="false" aria-label="Menüyü aç"><span></span><span></span></button>
</header>`;

const alt = `<footer class="alt">
  <div class="alt-ic">
    <div class="alt-marka"><a class="logo" href="index.html">${LOGO}<span>Ürün Zirvesi<small>İstanbul 2027</small></span></a><p>Ürün yöneticileri, tasarımcılar ve mühendisler için iki günlük zirve. 14 ile 15 Nisan 2027, Haliç Kongre Merkezi.</p></div>
    <div><h4>Zirve</h4><p><a href="program.html">Program</a></p><p><a href="konusmacilar.html">Konuşmacılar</a></p><p><a href="programim.html">Programım</a></p><p><a href="bilet.html">Biletler</a></p></div>
    <div><h4>İletişim</h4><p><a href="mailto:merhaba@urunzirvesi.com.tr">merhaba@urunzirvesi.com.tr</a></p><p><a href="mailto:sponsor@urunzirvesi.com.tr">sponsor@urunzirvesi.com.tr</a></p><p><a href="tel:+902129990027">0212 999 00 27</a></p><p><a href="kvkk.html">KVKK aydınlatma metni</a></p></div>
    <form class="bulten" data-vayra-form="Bülten" data-vayra-tesekkur="Teşekkürler, program duyurularını sana ilk biz göndereceğiz.">
      <h4>Duyurulardan haberin olsun</h4>
      <p>Yeni konuşmacılar ve atölye kayıtları açıldığında ayda en çok iki e-posta.</p>
      <div class="bulten-satir"><label class="gizli" for="bultenEposta">E-posta adresin</label><input id="bultenEposta" name="eposta" type="email" required autocomplete="email" placeholder="ornek@sirket.com" /><button class="dugme" type="submit">Abone ol</button></div>
    </form>
  </div>
  <p class="alt-not">Ürün Zirvesi İstanbul, Kavşak Etkinlik ve Organizasyon A.Ş. tarafından düzenlenir. Program değişikliklerini bu sitede duyururuz.</p>
</footer>`;

const sayfa = (dosya: string, baslik: string, aciklama: string, govde: string) => `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${baslik}</title>
  <meta name="description" content="${aciklama}" />
  <meta name="theme-color" content="#fbfaf7" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&family=Figtree:wght@400;500;600;700&display=swap" />
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

const K = (id: string) => KONUSMACILAR.find((k) => k.id === id)!;
const konusmaciKarti = (k: (typeof KONUSMACILAR)[number]) => `<a class="konusmaci" href="konusmacilar.html#${k.id}"><span class="foto"><img src="${k.foto}" alt="${k.ad}" loading="lazy" /></span><b>${k.ad}</b><span>${k.unvan}, ${k.sirket}</span></a>`;
const fiyat = (n: number) => n.toLocaleString("tr-TR") + " TL";
const SAYI = { oturum: OTURUMLAR.filter((o) => o.tur !== "Ara").length, atolye: OTURUMLAR.filter((o) => o.tur === "Atölye").length, panel: OTURUMLAR.filter((o) => o.tur === "Panel").length, konusmaci: KONUSMACILAR.length };

const SSS = [
  ["Bilet fiyatına neler dahil?", "İki günlük bütün oturumlar, atölyelere kayıt hakkı, iki öğle yemeği, kahve araları, tanışma resepsiyonu ve oturum kayıtlarına bir yıllık erişim dahildir. Fiyatlara KDV dahildir."],
  ["Ödemeyi nasıl yapacağım?", "Kayıt formunu gönderdikten sonra 24 saat içinde e-posta adresine güvenli ödeme bağlantısı ve kayıt kodun gelir. Ödeme tamamlanınca yaka kartı QR kodun gönderilir."],
  ["Kurumsal fatura alabilir miyim?", "Evet. Kayıt sırasında fatura türünü Kurumsal seç; vergi bilgilerini ödeme adımında isteriz. Beş ve üzeri kişilik ekipler için Kurumsal bilet daha uygundur."],
  ["Biletimi başkasına devredebilir miyim?", "Öğrenci bileti dışındaki biletler 7 Nisan 2027'ye kadar ücretsiz devredilebilir. Kayıt kodunla birlikte merhaba@urunzirvesi.com.tr adresine yazman yeterli."],
  ["İptal ve iade koşulları neler?", "17 Mart 2027'ye kadar yapılan iptallerde ücretin tamamı, 7 Nisan 2027'ye kadar yarısı iade edilir. Bu tarihten sonra iade yapılmaz, bilet devri yapılabilir."],
  ["Atölyelere nasıl katılırım?", "Atölyeler 40 kişiliktir ve yerler zirve günü girişte, atölye kapısındaki kayıt masasında sıra ile verilir. Erken kayıt sahipleri önceliklidir."],
  ["Mekân erişilebilir mi?", "Haliç Kongre Merkezi'nin bütün salonları tekerlekli sandalye ile erişilebilir. Ana Sahne oturumlarında Türk İşaret Dili tercümanı ve canlı altyazı bulunur."],
];

const SPONSORLAR = [["Kumbara", "s1"], ["atlas", "s2"], ["ROTA", "s3"], ["Lokma", "s4"], ["Sinyal Bank", "s5"], ["kervan", "s6"], ["Defne Sağlık", "s7"], ["Pusula", "s8"]];

const STIL = String.raw`/* Ürün Zirvesi İstanbul — sıcak beyaz zemin, kobalt mavi ve mercan vurgu, lacivert mürekkep; Bricolage Grotesque başlıklar, Figtree gövde. */
:root {
  --zemin: #fbfaf7; --kart: #ffffff; --murekkep: #0d1433; --soluk: #5a6078; --kobalt: #2337ff; --kobalt-koyu: #1424c4; --kobalt-acik: #e8ebff;
  --mercan: #ff6b4a; --mercan-acik: #ffe9e3; --yesil: #0f9f7f; --yesil-acik: #dcf5ee; --krem: #f3f0e8; --cizgi: rgba(13, 20, 51, .1);
  --baslik: "Bricolage Grotesque", system-ui, sans-serif; --yazi: "Figtree", system-ui, sans-serif; --yaricap: 22px;
}
[hidden] { display: none !important; }
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; background: var(--zemin); color: var(--murekkep); font: 16px/1.6 var(--yazi); -webkit-font-smoothing: antialiased; overflow-x: hidden; }
img, svg { display: block; max-width: 100%; }
a { color: inherit; }
h1, h2, h3 { font-family: var(--baslik); margin: 0; line-height: 1.02; letter-spacing: -.035em; font-weight: 800; }
:focus-visible { outline: 3px solid var(--mercan); outline-offset: 2px; border-radius: 8px; }
.gizli { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.atla { position: absolute; left: -999px; top: 8px; background: var(--kobalt); color: #fff; padding: 8px 14px; border-radius: 10px; z-index: 50; }
.atla:focus { left: 12px; }

.ust { position: sticky; top: 0; z-index: 30; display: flex; align-items: center; gap: 18px; padding: 12px clamp(16px, 4vw, 56px); background: color-mix(in srgb, var(--zemin) 90%, transparent); backdrop-filter: blur(14px); border-bottom: 1px solid var(--cizgi); }
.logo { display: inline-flex; align-items: center; gap: 11px; text-decoration: none; font-family: var(--baslik); font-weight: 800; font-size: 19px; letter-spacing: -.03em; color: var(--murekkep); line-height: 1.05; }
.logo svg { width: 38px; height: 38px; color: var(--kobalt); flex: none; }
.logo small { display: block; font-family: var(--yazi); font-size: 12px; font-weight: 600; letter-spacing: 0; color: var(--soluk); }
.menu { display: flex; gap: 4px; margin-left: auto; }
.menu a { display: inline-flex; align-items: center; gap: 7px; text-decoration: none; padding: 10px 14px; border-radius: 99px; font-size: 15px; font-weight: 600; color: var(--soluk); }
.menu a:hover { color: var(--murekkep); background: var(--krem); }
.menu a[aria-current] { color: var(--kobalt); background: var(--kobalt-acik); }
.sayi { display: inline-grid; place-items: center; min-width: 22px; height: 22px; padding: 0 6px; border-radius: 99px; background: var(--mercan); color: #fff; font-size: 12px; font-weight: 700; }
.menu-dugme { display: none; width: 46px; height: 46px; border: 1px solid var(--cizgi); background: var(--kart); border-radius: 14px; cursor: pointer; flex-direction: column; justify-content: center; align-items: center; gap: 6px; }
.menu-dugme span { width: 18px; height: 2px; border-radius: 2px; background: var(--murekkep); }

.dugme { display: inline-flex; align-items: center; justify-content: center; gap: 9px; min-height: 52px; padding: 13px 26px; border: 0; border-radius: 99px; background: var(--kobalt); color: #fff; font: 700 16px/1 var(--yazi); text-decoration: none; cursor: pointer; transition: background .2s, transform .2s; white-space: nowrap; }
.dugme svg { width: 18px; height: 18px; }
.dugme:hover { background: var(--kobalt-koyu); }
.dugme:active { transform: scale(.98); }
.dugme[disabled] { opacity: .5; cursor: not-allowed; }
.dugme.kucuk { min-height: 44px; padding: 10px 20px; font-size: 15px; }
.dugme.ikincil { background: transparent; color: var(--murekkep); border: 1.5px solid rgba(13, 20, 51, .22); }
.dugme.ikincil:hover { border-color: var(--murekkep); background: var(--kart); }
.dugme.mercan { background: var(--mercan); }
.dugme.mercan:hover { background: #ec5534; }
.dugme.beyaz { background: #fff; color: var(--kobalt); }

.kapsayici { max-width: 1280px; margin: 0 auto; padding: 0 clamp(16px, 4vw, 48px); }
.kahraman { display: grid; grid-template-columns: 1.08fr .92fr; gap: clamp(28px, 4vw, 64px); align-items: center; padding-block: clamp(28px, 5vw, 72px) clamp(40px, 6vw, 88px); }
.kahraman > * { min-width: 0; }
.tarih-hap { display: inline-flex; align-items: center; gap: 10px; padding: 8px 16px 8px 10px; border-radius: 99px; background: var(--kart); border: 1px solid var(--cizgi); font-size: 14.5px; font-weight: 600; }
.tarih-hap i { width: 10px; height: 10px; border-radius: 50%; background: var(--mercan); box-shadow: 0 0 0 4px var(--mercan-acik); }
.kahraman h1 { font-size: clamp(58px, 9.4vw, 142px); margin: 22px 0 22px; letter-spacing: -.045em; line-height: .92; }
.kahraman h1 span { display: block; color: var(--kobalt); }
.kahraman h1 em { font-style: normal; color: var(--mercan); }
.giris { font-size: clamp(17px, 1.5vw, 19.5px); color: var(--soluk); max-width: 560px; margin: 0 0 30px; }
.eylemler { display: flex; flex-wrap: wrap; gap: 12px; }
.kolaj { position: relative; display: grid; grid-template-columns: 1fr .78fr; grid-template-rows: auto auto; gap: 14px; }
.kolaj figure { margin: 0; overflow: hidden; border-radius: 28px; background: var(--krem); }
.kolaj img { width: 100%; height: 100%; object-fit: cover; }
.kolaj .f1 { grid-column: 1 / 3; aspect-ratio: 16 / 9.4; border-radius: 28px 28px 28px 120px; }
.kolaj .f2 { aspect-ratio: 1 / .82; }
.sayac { background: var(--kobalt); color: #fff; border-radius: 28px; padding: 22px 22px 20px; display: flex; flex-direction: column; justify-content: space-between; gap: 14px; }
.sayac p { margin: 0; font-weight: 600; font-size: 14.5px; color: #c9d0ff; }
.sayac-kutular { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.sayac-kutular div { display: grid; }
.sayac-kutular b { font-family: var(--baslik); font-size: clamp(26px, 2.5vw, 36px); font-weight: 700; letter-spacing: -.04em; line-height: 1; font-variant-numeric: tabular-nums; }
.sayac-kutular span { font-size: 12.5px; color: #c9d0ff; margin-top: 4px; }

.serit { background: var(--murekkep); color: #fff; overflow: hidden; padding: 18px 0; }
.serit-ic { display: flex; gap: 36px; width: max-content; animation: kay 38s linear infinite; font-family: var(--baslik); font-weight: 700; font-size: clamp(20px, 2.4vw, 30px); letter-spacing: -.03em; }
.serit-ic span { display: inline-flex; align-items: center; gap: 36px; white-space: nowrap; }
.serit-ic span::after { content: ""; width: 12px; height: 12px; border-radius: 50%; background: var(--mercan); }
@keyframes kay { to { transform: translateX(-50%); } }

.bolum { padding-block: clamp(56px, 8vw, 112px); }
.bolum-ust { display: flex; justify-content: space-between; align-items: end; gap: 20px; flex-wrap: wrap; margin-bottom: clamp(24px, 3vw, 40px); }
.bolum-ust h2 { font-size: clamp(36px, 5vw, 64px); max-width: 760px; }
.bolum-ust p { margin: 10px 0 0; color: var(--soluk); max-width: 560px; font-size: 17px; }
.ust-yazi { display: block; color: var(--mercan); font-weight: 700; font-size: 15px; margin-bottom: 12px; letter-spacing: 0; }

.rakamlar { display: grid; grid-template-columns: 1.2fr repeat(4, 1fr); gap: 16px; align-items: stretch; }
.rakamlar > div { background: var(--kart); border: 1px solid var(--cizgi); border-radius: var(--yaricap); padding: 24px; }
.rakamlar .metin-kutu { background: transparent; border: 0; padding: 0 12px 0 0; }
.rakamlar .metin-kutu h2 { font-size: clamp(30px, 3.4vw, 44px); margin-bottom: 12px; }
.rakamlar .metin-kutu p { margin: 0; color: var(--soluk); }
.rakamlar b { display: block; font-family: var(--baslik); font-size: clamp(44px, 5vw, 72px); letter-spacing: -.05em; line-height: 1; color: var(--kobalt); }
.rakamlar span { display: block; margin-top: 10px; font-weight: 600; }
.rakamlar small { display: block; color: var(--soluk); font-size: 14px; margin-top: 4px; }

.salonlar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.salon { border-radius: 28px; padding: 28px; min-height: 280px; display: flex; flex-direction: column; justify-content: space-between; gap: 30px; text-decoration: none; transition: transform .25s; }
.salon:hover { transform: translateY(-3px); }
.salon.s-ana { background: var(--kobalt); color: #fff; }
.salon.s-tasarim { background: var(--mercan); color: #fff; }
.salon.s-atolye { background: var(--yesil-acik); color: var(--murekkep); }
.salon h3 { font-size: clamp(30px, 3vw, 40px); }
.salon p { margin: 10px 0 0; opacity: .88; }
.salon .alt-satir { display: flex; justify-content: space-between; align-items: center; font-weight: 700; }
.salon .ok { width: 48px; height: 48px; border-radius: 50%; display: grid; place-items: center; background: rgba(255, 255, 255, .18); }
.salon.s-atolye .ok { background: var(--yesil); color: #fff; }
.salon .ok svg { width: 20px; height: 20px; }

.konusmaci-izgara { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 22px 18px; }
.konusmaci { display: grid; gap: 4px; text-decoration: none; background: none; border: 0; padding: 0; text-align: left; font: inherit; color: inherit; cursor: pointer; }
.konusmaci .foto { display: block; aspect-ratio: 4 / 4.6; border-radius: 24px; overflow: hidden; background: var(--krem); margin-bottom: 10px; }
.konusmaci img { width: 100%; height: 100%; object-fit: cover; object-position: center 22%; transition: transform .5s; }
.konusmaci:hover img { transform: scale(1.04); }
.konusmaci b { font-family: var(--baslik); font-size: 20px; letter-spacing: -.025em; line-height: 1.15; }
.konusmaci > span:last-child { color: var(--soluk); font-size: 14.5px; line-height: 1.4; }

.vitrin-program { display: grid; grid-template-columns: .9fr 1.1fr; gap: clamp(24px, 4vw, 56px); align-items: start; }
.vitrin-program figure { margin: 0; border-radius: 28px; overflow: hidden; aspect-ratio: 4 / 4.4; position: sticky; top: 100px; }
.vitrin-program figure img { width: 100%; height: 100%; object-fit: cover; }
.akis { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--cizgi); }
.akis li { display: grid; grid-template-columns: 92px 1fr; gap: 18px; padding: 20px 0; border-bottom: 1px solid var(--cizgi); }
.akis time { font-family: var(--baslik); font-weight: 700; font-size: 22px; letter-spacing: -.03em; color: var(--kobalt); }
.akis h3 { font-size: 21px; letter-spacing: -.02em; line-height: 1.2; }
.akis p { margin: 6px 0 0; color: var(--soluk); font-size: 15px; }

.bilet-izgara { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.bilet { position: relative; background: var(--kart); border: 1.5px solid var(--cizgi); border-radius: 26px; padding: 26px 24px; display: flex; flex-direction: column; gap: 14px; text-align: left; font: inherit; color: inherit; }
.bilet.vurgu { background: var(--murekkep); color: #fff; border-color: var(--murekkep); }
.bilet h3 { font-size: 24px; letter-spacing: -.03em; }
.bilet .fiyat { font-family: var(--baslik); font-size: 40px; font-weight: 800; letter-spacing: -.05em; line-height: 1; }
.bilet .fiyat small { font-family: var(--yazi); font-size: 14px; font-weight: 600; letter-spacing: 0; color: var(--soluk); margin-left: 4px; }
.bilet.vurgu .fiyat small, .bilet.vurgu .aciklama { color: #b9bfd8; }
.bilet .aciklama { margin: 0; color: var(--soluk); font-size: 14.5px; }
.bilet ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; font-size: 14.5px; flex: 1; align-content: start; }
.bilet li { display: flex; gap: 10px; align-items: flex-start; }
.bilet li::before { content: ""; flex: none; width: 18px; height: 18px; margin-top: 2px; border-radius: 50%; background: var(--kobalt-acik) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232337ff' stroke-width='3.2'%3E%3Cpath d='M6 12l4 4 8-8'/%3E%3C/svg%3E") center / 11px no-repeat; }
.bilet.vurgu li::before { background-color: rgba(255, 255, 255, .14); background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='3.2'%3E%3Cpath d='M6 12l4 4 8-8'/%3E%3C/svg%3E"); }
.kalan { display: inline-flex; align-self: flex-start; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 99px; background: var(--yesil-acik); color: #0b6b55; font-size: 13.5px; font-weight: 700; }
.kalan.az { background: var(--mercan-acik); color: #b33a1d; }
.kalan.bitti { background: var(--krem); color: var(--soluk); }
.bilet.vurgu .kalan { background: rgba(255, 255, 255, .12); color: #fff; }
.bilet.tukendi { opacity: .62; }
.bilet.tukendi .fiyat { text-decoration: line-through; text-decoration-thickness: 3px; }
.bilet .dugme { width: 100%; }
.kdv { margin: 16px 0 0; color: var(--soluk); font-size: 14px; }

.mekan { display: grid; grid-template-columns: 1fr 1.25fr; gap: 16px; }
.mekan .kutu { background: var(--kobalt); color: #fff; border-radius: 28px; padding: clamp(24px, 3vw, 40px); display: flex; flex-direction: column; gap: 16px; }
.mekan .kutu h2 { font-size: clamp(32px, 3.6vw, 48px); }
.mekan .kutu p { margin: 0; color: #d4d9ff; }
.mekan dl { display: grid; gap: 14px; margin: 6px 0; }
.mekan dt { font-weight: 700; color: #fff; }
.mekan dd { margin: 2px 0 0; color: #d4d9ff; font-size: 15px; }
.mekan iframe { width: 100%; height: 100%; min-height: 380px; border: 0; border-radius: 28px; background: var(--krem); }

.sponsorlar { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 1px solid var(--cizgi); border-left: 1px solid var(--cizgi); }
.sponsorlar span { display: grid; place-items: center; min-height: 120px; border-right: 1px solid var(--cizgi); border-bottom: 1px solid var(--cizgi); color: #3a4160; font-size: 26px; text-align: center; padding: 10px; }
.s1 { font-family: var(--baslik); font-weight: 800; letter-spacing: -.05em; }
.s2 { font-family: var(--yazi); font-weight: 700; letter-spacing: -.04em; font-size: 30px !important; }
.s3 { font-family: var(--baslik); font-weight: 600; letter-spacing: .32em; font-size: 22px !important; }
.s4 { font-family: Georgia, serif; font-style: italic; font-weight: 700; font-size: 30px !important; }
.s5 { font-family: var(--yazi); font-weight: 800; text-transform: none; letter-spacing: -.02em; }
.s6 { font-family: var(--baslik); font-weight: 500; letter-spacing: -.02em; font-size: 30px !important; }
.s7 { font-family: Georgia, serif; font-weight: 400; letter-spacing: .01em; }
.s8 { font-family: var(--baslik); font-weight: 800; letter-spacing: .04em; font-size: 24px !important; }

.sss { display: grid; gap: 10px; max-width: 920px; }
.sss details { background: var(--kart); border: 1px solid var(--cizgi); border-radius: 20px; }
.sss summary { list-style: none; cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 18px; padding: 20px 22px; font-family: var(--baslik); font-weight: 700; font-size: 19px; letter-spacing: -.02em; min-height: 56px; }
.sss summary::-webkit-details-marker { display: none; }
.sss summary::after { content: ""; flex: none; width: 32px; height: 32px; border-radius: 50%; background: var(--kobalt-acik) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232337ff' stroke-width='2.6' stroke-linecap='round'%3E%3Cpath d='M12 6v12M6 12h12'/%3E%3C/svg%3E") center / 15px no-repeat; transition: transform .25s; }
.sss details[open] summary::after { transform: rotate(45deg); }
.sss details p { margin: 0; padding: 0 22px 22px; color: var(--soluk); }
.cagri { background: var(--mercan); color: #fff; border-radius: 32px; padding: clamp(28px, 5vw, 64px); display: flex; justify-content: space-between; align-items: center; gap: 24px; flex-wrap: wrap; }
.cagri h2 { font-size: clamp(34px, 4.6vw, 60px); max-width: 720px; }
.cagri p { margin: 12px 0 0; color: #fff2ee; max-width: 560px; }
.cagri .dugme { background: var(--murekkep); }

/* Program */
.sayfa-bas { padding-block: clamp(32px, 5vw, 64px) 8px; }
.sayfa-bas h1 { font-size: clamp(46px, 7vw, 96px); letter-spacing: -.05em; }
.sayfa-bas p { color: var(--soluk); font-size: 18px; max-width: 640px; margin: 14px 0 0; }
.suzgec { position: sticky; top: 71px; z-index: 10; background: color-mix(in srgb, var(--zemin) 94%, transparent); backdrop-filter: blur(10px); padding: 16px 0; border-bottom: 1px solid var(--cizgi); margin-bottom: 26px; display: flex; flex-wrap: wrap; gap: 12px 24px; align-items: center; }
.gun-sekmeler { display: inline-flex; padding: 5px; background: var(--krem); border-radius: 99px; gap: 4px; }
.gun-sekmeler button { border: 0; background: transparent; border-radius: 99px; padding: 10px 18px; min-height: 46px; font: 700 15px var(--yazi); color: var(--soluk); cursor: pointer; }
.gun-sekmeler button small { display: block; font-weight: 600; font-size: 12px; }
.gun-sekmeler button[aria-selected="true"] { background: var(--murekkep); color: #fff; }
.cipler { display: flex; flex-wrap: wrap; gap: 8px; }
.cip { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 9px 16px; border-radius: 99px; border: 1.5px solid var(--cizgi); background: var(--kart); font: 600 14.5px var(--yazi); color: var(--murekkep); cursor: pointer; }
.cip i { width: 10px; height: 10px; border-radius: 50%; }
.cip[aria-pressed="true"] { border-color: var(--murekkep); background: var(--murekkep); color: #fff; }
.zaman-blok { display: grid; grid-template-columns: 110px 1fr; gap: 20px; padding: 18px 0; border-top: 1px solid var(--cizgi); }
.zaman-blok > time { font-family: var(--baslik); font-weight: 800; font-size: 28px; letter-spacing: -.04em; padding-top: 10px; }
.zaman-blok > div { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 14px; min-width: 0; }
.oturum { --renk: var(--kobalt); position: relative; background: var(--kart); border: 1px solid var(--cizgi); border-radius: 22px; padding: 20px 20px 16px; display: flex; flex-direction: column; gap: 10px; border-top: 5px solid var(--renk); min-width: 0; }
.oturum.secili { border-color: var(--renk); box-shadow: inset 0 0 0 1px var(--renk); }
.o-ust { display: flex; flex-wrap: wrap; gap: 6px 10px; align-items: center; font-size: 13.5px; font-weight: 700; color: var(--soluk); }
.o-salon { color: var(--renk); }
.o-tur { padding: 3px 9px; border-radius: 99px; background: var(--krem); color: var(--murekkep); }
.oturum h3 { font-size: 21px; letter-spacing: -.025em; line-height: 1.18; }
.oturum p { margin: 0; color: var(--soluk); font-size: 15px; }
.o-alt { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: auto; padding-top: 6px; }
.kisiler { display: flex; flex-wrap: wrap; gap: 8px 12px; min-width: 0; }
.kisi { display: inline-flex; align-items: center; gap: 8px; text-decoration: none; font-weight: 600; font-size: 14px; min-height: 36px; }
.kisi img { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; object-position: center 20%; background: var(--krem); }
.kisi span { white-space: nowrap; }
.kisi:hover span { color: var(--kobalt); text-decoration: underline; }
.yildiz { flex: none; display: inline-flex; align-items: center; gap: 7px; min-height: 44px; padding: 8px 14px; border-radius: 99px; border: 1.5px solid var(--cizgi); background: var(--kart); font: 700 14px var(--yazi); color: var(--murekkep); cursor: pointer; }
.yildiz svg { width: 18px; height: 18px; }
.yildiz[aria-pressed="true"] { background: var(--mercan); border-color: var(--mercan); color: #fff; }
.ara { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; padding: 14px 18px; border-radius: 18px; background: var(--krem); color: var(--soluk); font-weight: 600; font-size: 15px; grid-column: 1 / -1; }
.ara b { color: var(--murekkep); }
.cakisma { display: flex; gap: 8px; align-items: flex-start; padding: 10px 12px; border-radius: 14px; background: var(--mercan-acik); color: #9c2f14; font-size: 14px; font-weight: 600; }
.cakisma svg { width: 18px; height: 18px; flex: none; margin-top: 2px; }
.bos { background: var(--kart); border: 1.5px dashed rgba(13, 20, 51, .2); border-radius: 26px; padding: clamp(28px, 5vw, 56px); text-align: center; color: var(--soluk); }
.bos b { display: block; font-family: var(--baslik); font-size: 26px; letter-spacing: -.03em; color: var(--murekkep); margin-bottom: 8px; }
.bos .dugme { margin-top: 18px; }
.iskelet { height: 160px; border-radius: 22px; background: linear-gradient(90deg, #f0ede5, #f8f6f0, #f0ede5); background-size: 200% 100%; animation: parla 1.2s infinite; }
@keyframes parla { to { background-position: -200% 0; } }

/* Programım */
.programim-ozet { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between; background: var(--kart); border: 1px solid var(--cizgi); border-radius: 24px; padding: 18px 20px; margin: 24px 0 30px; }
.programim-ozet .rozetler { display: flex; flex-wrap: wrap; gap: 10px; }
.programim-ozet .rozetler span { padding: 8px 14px; border-radius: 99px; background: var(--krem); font-weight: 700; font-size: 14.5px; }
.programim-ozet .rozetler span.uyari { background: var(--mercan-acik); color: #9c2f14; }
.programim-ozet .eylemler { gap: 8px; }
.gun-baslik { font-size: clamp(28px, 3.4vw, 40px); margin: 34px 0 14px; display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; }
.gun-baslik small { font-family: var(--yazi); font-size: 16px; font-weight: 600; letter-spacing: 0; color: var(--soluk); }
.zaman-cizgi { display: grid; gap: 12px; }
.zaman-cizgi .oturum { display: grid; grid-template-columns: 120px 1fr auto; align-items: start; gap: 18px; border-top-width: 1px; border-left: 5px solid var(--renk); }
.zaman-cizgi .oturum time { font-family: var(--baslik); font-weight: 800; font-size: 22px; letter-spacing: -.03em; line-height: 1.1; }
.zaman-cizgi .oturum time small { display: block; font-family: var(--yazi); font-size: 13.5px; font-weight: 600; color: var(--soluk); letter-spacing: 0; margin-top: 4px; }
.zaman-cizgi .icerik { display: grid; gap: 8px; min-width: 0; }

/* Konuşmacılar sayfası */
dialog.pencere { width: min(900px, calc(100vw - 24px)); max-height: calc(100vh - 32px); padding: 0; border: 0; border-radius: 30px; background: var(--kart); color: var(--murekkep); overflow: auto; }
dialog.pencere::backdrop { background: rgba(13, 20, 51, .55); backdrop-filter: blur(3px); }
.pencere-ic { display: grid; grid-template-columns: 320px 1fr; }
.pencere-ic > img { width: 100%; height: 100%; min-height: 420px; object-fit: cover; object-position: center 20%; background: var(--krem); }
.pencere-govde { padding: clamp(22px, 3vw, 36px); display: grid; gap: 14px; align-content: start; min-width: 0; }
.pencere-govde h2 { font-size: clamp(30px, 3.4vw, 42px); padding-right: 44px; }
.pencere-govde .unvan { margin: 0; color: var(--kobalt); font-weight: 700; }
.pencere-govde > p { margin: 0; color: var(--soluk); }
.pencere-govde h3 { font-size: 18px; margin-top: 8px; }
.mini-oturum { display: grid; grid-template-columns: 1fr auto; gap: 10px 14px; align-items: center; padding: 14px 16px; border-radius: 18px; background: var(--zemin); border-left: 4px solid var(--renk, var(--kobalt)); }
.mini-oturum b { display: block; font-size: 15.5px; line-height: 1.3; }
.mini-oturum small { color: var(--soluk); font-weight: 600; }
.kapat { position: absolute; top: 14px; right: 14px; width: 46px; height: 46px; border-radius: 50%; border: 0; background: var(--krem); color: var(--murekkep); cursor: pointer; display: grid; place-items: center; z-index: 2; }
.kapat svg { width: 20px; height: 20px; }

/* Bilet */
.bilet-duzen { display: grid; grid-template-columns: 1.15fr .85fr; gap: clamp(20px, 3vw, 40px); align-items: start; padding-bottom: 40px; }
.bilet-duzen > * { min-width: 0; }
.secim-izgara { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
button.bilet { cursor: pointer; transition: border-color .2s, transform .2s; }
button.bilet:hover:not(:disabled) { border-color: var(--kobalt); }
button.bilet[aria-pressed="true"] { border-color: var(--kobalt); box-shadow: inset 0 0 0 2px var(--kobalt); }
button.bilet[aria-pressed="true"]::after { content: ""; position: absolute; top: 18px; right: 18px; width: 28px; height: 28px; border-radius: 50%; background: var(--kobalt) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='3.2'%3E%3Cpath d='M6 12l4 4 8-8'/%3E%3C/svg%3E") center / 15px no-repeat; }
button.bilet:disabled { cursor: not-allowed; }
.form-kart { position: sticky; top: 90px; background: var(--kart); border: 1px solid var(--cizgi); border-radius: 28px; padding: clamp(20px, 3vw, 30px); }
.form-kart h2 { font-size: 28px; margin-bottom: 4px; }
.form-kart > p { margin: 0 0 18px; color: var(--soluk); font-size: 15px; }
.form { display: grid; gap: 14px; }
.ikili { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
label.alan { display: grid; gap: 6px; font-size: 14px; font-weight: 700; min-width: 0; }
.alan input, .alan select, .alan textarea { width: 100%; min-height: 50px; padding: 12px 14px; border-radius: 14px; border: 1.5px solid #d8d6e0; background: #fff; color: inherit; font: 500 16px var(--yazi); }
.alan textarea { min-height: 90px; resize: vertical; }
.alan input:focus, .alan select:focus, .alan textarea:focus { outline: none; border-color: var(--kobalt); box-shadow: 0 0 0 3px var(--kobalt-acik); }
.alan small { color: var(--soluk); font-weight: 500; }
.adet { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; border-radius: 16px; background: var(--zemin); }
.adet span { font-weight: 700; }
.adet span small { display: block; color: var(--soluk); font-weight: 500; font-size: 13px; }
.stepper { display: inline-flex; align-items: center; gap: 6px; }
.stepper button { width: 44px; height: 44px; border-radius: 50%; border: 1.5px solid #d8d6e0; background: #fff; font: 700 20px var(--yazi); color: var(--murekkep); cursor: pointer; }
.stepper button:disabled { opacity: .35; cursor: not-allowed; }
.stepper output { min-width: 34px; text-align: center; font-family: var(--baslik); font-weight: 800; font-size: 22px; }
.toplam { display: flex; justify-content: space-between; align-items: baseline; padding: 14px 0 0; border-top: 1px solid var(--cizgi); }
.toplam b { font-family: var(--baslik); font-size: 32px; letter-spacing: -.04em; }
.onay { display: flex; gap: 12px; align-items: flex-start; font-size: 14px; color: var(--soluk); }
.onay input { width: 22px; height: 22px; margin-top: 1px; accent-color: var(--kobalt); flex: none; }
.mesaj { border-radius: 14px; padding: 14px 16px; font-size: 14.5px; }
.mesaj b { display: block; }
.mesaj.hata { background: #fde8e2; color: #8a2a14; }
.mesaj.bilgi { background: #fff4d9; color: #6a4b00; }
.basari { max-width: 760px; margin: clamp(32px, 6vw, 72px) auto; background: var(--kart); border: 1px solid var(--cizgi); border-radius: 32px; overflow: hidden; }
.basari-ust { background: var(--kobalt); color: #fff; padding: clamp(26px, 4vw, 44px); }
.basari-ust h1 { font-size: clamp(34px, 5vw, 56px); margin: 10px 0 8px; }
.basari-ust p { margin: 0; color: #d4d9ff; }
.basari-ust .kod { display: inline-flex; padding: 8px 14px; border-radius: 12px; background: rgba(255, 255, 255, .14); font-family: var(--baslik); font-weight: 800; font-size: 20px; letter-spacing: .04em; }
.basari-govde { padding: clamp(22px, 4vw, 40px); }
.basari dl { display: grid; grid-template-columns: auto 1fr; gap: 10px 22px; margin: 0 0 24px; }
.basari dt { color: var(--soluk); font-weight: 600; }
.basari dd { margin: 0; font-weight: 700; }
.basari ol { margin: 0 0 24px; padding-left: 20px; color: var(--soluk); display: grid; gap: 6px; }

.metin { max-width: 820px; padding-block: clamp(32px, 5vw, 64px); }
.metin h1 { font-size: clamp(36px, 5vw, 56px); margin-bottom: 16px; }
.metin h2 { font-size: 23px; margin: 30px 0 8px; letter-spacing: -.02em; }
.metin p, .metin li { color: var(--soluk); }

.alt { background: var(--murekkep); color: #b9bfd8; padding: clamp(48px, 6vw, 80px) clamp(16px, 4vw, 56px) 28px; margin-top: clamp(40px, 6vw, 80px); }
.alt-ic { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: 1.3fr .7fr 1fr 1.4fr; gap: 32px; }
.alt .logo { color: #fff; }
.alt .logo small { color: #8d94b4; }
.alt .logo svg { color: var(--kobalt); }
.alt h4 { color: #fff; margin: 0 0 10px; font-size: 15px; }
.alt p { margin: 6px 0; font-size: 14.5px; }
.alt a { color: #e3e6f5; text-decoration: none; }
.alt a:hover { text-decoration: underline; }
.alt-marka p { margin-top: 14px; max-width: 320px; }
.bulten-satir { display: flex; gap: 8px; margin-top: 12px; }
.bulten input { flex: 1; min-width: 0; min-height: 50px; padding: 12px 16px; border-radius: 99px; border: 1px solid rgba(255, 255, 255, .2); background: rgba(255, 255, 255, .06); color: #fff; font: 500 15px var(--yazi); }
.bulten input::placeholder { color: #8d94b4; }
.bulten .dugme { min-height: 50px; padding: 12px 20px; }
.alt-not { max-width: 1280px; margin: 40px auto 0; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, .12); font-size: 13.5px; }
.bildirim { position: fixed; left: 50%; bottom: 22px; transform: translate(-50%, 180%); background: var(--murekkep); color: #fff; padding: 14px 22px; border-radius: 18px; font-weight: 600; font-size: 15px; z-index: 60; transition: transform .35s; width: max-content; max-width: calc(100vw - 32px); }
.bildirim.acik { transform: translate(-50%, 0); }
.bildirim[data-tur="hata"] { background: #9c2f14; }

@media (max-width: 1120px) {
  .rakamlar { grid-template-columns: repeat(2, 1fr); }
  .rakamlar .metin-kutu { grid-column: 1 / -1; padding: 0 0 8px; }
  .bilet-izgara { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .konusmaci-izgara { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .alt-ic { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 920px) {
  .menu { display: none; position: absolute; left: 12px; right: 12px; top: calc(100% + 8px); flex-direction: column; background: var(--kart); border: 1px solid var(--cizgi); border-radius: 20px; padding: 8px; }
  .menu.acik { display: flex; }
  .menu a { padding: 14px 16px; font-size: 17px; }
  .menu-dugme { display: inline-flex; }
  .ust .dugme.kucuk { margin-left: auto; }
  .kahraman, .vitrin-program, .mekan, .bilet-duzen { grid-template-columns: 1fr; }
  .salonlar { grid-template-columns: 1fr; }
  .salon { min-height: 0; }
  .vitrin-program figure { position: static; aspect-ratio: 16 / 10; }
  .form-kart { position: static; }
  .suzgec { top: 70px; }
  .pencere-ic { grid-template-columns: 1fr; }
  .pencere-ic > img { min-height: 0; aspect-ratio: 4 / 3.4; }
  .sponsorlar { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .ust { gap: 10px; }
  .logo { font-size: 17px; }
  .logo small { display: none; }
  .logo svg { width: 34px; height: 34px; }
  .kahraman h1 { font-size: clamp(54px, 17vw, 80px); }
  .kolaj { grid-template-columns: 1fr; }
  .kolaj .f1 { grid-column: auto; border-radius: 24px 24px 24px 72px; }
  .kolaj .f2 { display: none; }
  .rakamlar { grid-template-columns: 1fr 1fr; gap: 10px; }
  .rakamlar > div { padding: 18px; }
  .konusmaci-izgara { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 12px; }
  .konusmaci b { font-size: 17px; }
  .konusmaci > span:last-child { font-size: 13.5px; }
  .bilet-izgara, .secim-izgara { grid-template-columns: 1fr; }
  .akis li { grid-template-columns: 1fr; gap: 4px; }
  .zaman-blok { grid-template-columns: 1fr; gap: 10px; }
  .zaman-blok > time { padding-top: 0; font-size: 24px; }
  .zaman-blok > div { grid-template-columns: minmax(0, 1fr); }
  .zaman-cizgi .oturum { grid-template-columns: 1fr; gap: 10px; }
  .o-alt { flex-wrap: wrap; }
  .mini-oturum { grid-template-columns: 1fr; }
  .mini-oturum .yildiz { justify-self: start; }
  .suzgec { position: static; display: grid; gap: 10px; }
  .suzgec .cipler { flex-wrap: nowrap; overflow-x: auto; margin-inline: -16px; padding: 2px 16px 4px; scrollbar-width: none; }
  .suzgec .cipler::-webkit-scrollbar { display: none; }
  .cip { flex: none; }
  #sonucSayi { margin-left: 0 !important; }
  .gun-sekmeler { width: 100%; }
  .gun-sekmeler button { flex: 1; }
  .ikili { grid-template-columns: 1fr; }
  .alt-ic { grid-template-columns: 1fr; }
  .bulten-satir { flex-direction: column; }
  .cagri .dugme { width: 100%; }
  .eylemler .dugme { flex: 1 1 auto; }
  .sponsorlar span { min-height: 92px; font-size: 21px; }
}
@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; scroll-behavior: auto !important; } }
`;

const UYGULAMA = ORTAK_JS + String.raw`
/* ── Ürün Zirvesi İstanbul ──
 * Veriler tablolardan gelir: oturumlar, konusmacilar, biletler. Şablon galerisindeki canlı önizlemede veritabanı bağlı
 * değildir; sayfa o zaman aşağıdaki gömülü kopyalarla çalışır. Programım listesi tarayıcıda (localStorage) saklanır. */
var OTURUM_YEDEK = ${JSON.stringify(OTURUMLAR.map((o) => ({ ...o, aktif: true })))};
var KONUSMACI_YEDEK = ${JSON.stringify(KONUSMACILAR.map((k, i) => ({ ...k, sira: i + 1 })))};
var BILET_YEDEK = ${JSON.stringify(BILETLER.map((b) => ({ ...b, satista: true })))};
var GUNLER = ${JSON.stringify(GUNLER)};
var SALONLAR = ${JSON.stringify(SALONLAR)};
var RENK = { "Ana Sahne": "var(--kobalt)", "Tasarım Salonu": "var(--mercan)", "Atölye Odası": "var(--yesil)" };
var BASLANGIC = Date.parse("2027-04-14T09:30:00+03:00");
var ANAHTAR = "urun-zirvesi-2027-programim";
var SAYFA = document.body.dataset.sayfa;
var YILDIZ = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 3.2l2.6 5.5 6 .8-4.4 4.1 1.1 5.9L12 16.6l-5.3 2.9 1.1-5.9-4.4-4.1 6-.8z"/></svg>';
var YILDIZ_BOS = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M12 3.2l2.6 5.5 6 .8-4.4 4.1 1.1 5.9L12 16.6l-5.3 2.9 1.1-5.9-4.4-4.1 6-.8z"/></svg>';
var UYARI = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17.4h.01"/></svg>';

/* ── Veri ── */
var sozler = {};
function getir(tablo, yedek, secenek) {
  if (!sozler[tablo]) sozler[tablo] = (veriVar() ? vayra.veri.liste(tablo, secenek || { sinir: 500 }).catch(function () { return yedek.slice(); }) : Promise.resolve(yedek.slice()));
  return sozler[tablo];
}
function oturumlar() { return getir("oturumlar", OTURUM_YEDEK).then(function (l) { return l.filter(function (o) { return o.aktif !== false; }).sort(function (a, b) { return (a.gun + a.bas + SALONLAR.indexOf(a.salon)).localeCompare(b.gun + b.bas + SALONLAR.indexOf(b.salon)); }); }); }
function konusmacilar() { return getir("konusmacilar", KONUSMACI_YEDEK).then(function (l) { return l.slice().sort(function (a, b) { return (a.sira || 99) - (b.sira || 99); }); }); }
function biletler() { return getir("biletler", BILET_YEDEK).then(function (l) { return l.slice().sort(function (a, b) { return (a.sira || 9) - (b.sira || 9); }); }); }
function satilanlar() {
  if (!fonksiyonVar()) return Promise.resolve({});
  return fonksiyonOku("kalan").then(function (j) { return (j && j.satilan) || {}; }).catch(function () { return {}; });
}
function kalan(b, satilan) { return b.satista === false ? 0 : Math.max(0, Number(b.kontenjan || 0) - Number(b.ayrilan || 0) - Number(satilan[b.id] || 0)); }
function kalanEtiket(n) { return n === 0 ? '<span class="kalan bitti">Tükendi</span>' : n <= 25 ? '<span class="kalan az">Son ' + n + " bilet</span>" : '<span class="kalan">' + n + " bilet kaldı</span>"; }

/* ── Programım (tarayıcıda) ── */
function secilenler() { try { var l = JSON.parse(localStorage.getItem(ANAHTAR) || "[]"); return Array.isArray(l) ? l : []; } catch (e) { return []; } }
function secilenYaz(l) { try { localStorage.setItem(ANAHTAR, JSON.stringify(l)); } catch (e) { /* yok say */ } rozetCiz(); }
function rozetCiz() { var n = secilenler().length; $$("[data-programim-sayi]").forEach(function (r) { r.textContent = String(n); r.hidden = !n; }); }
function cakisiyor(a, b) { return a.id !== b.id && a.gun === b.gun && a.tur !== "Ara" && b.tur !== "Ara" && saatDakika(a.bas) < saatDakika(b.bit) && saatDakika(b.bas) < saatDakika(a.bit); }
function cakisanlar(o, liste) { return liste.filter(function (x) { return cakisiyor(o, x); }); }
var tumOturumlar = [], kisiler = {};
function yildizla(id) {
  var l = secilenler(), i = l.indexOf(id), o = tumOturumlar.find(function (x) { return x.id === id; });
  if (i >= 0) { l.splice(i, 1); secilenYaz(l); bildir("Programından çıkarıldı."); }
  else {
    l.push(id); secilenYaz(l);
    var c = o ? cakisanlar(o, tumOturumlar.filter(function (x) { return l.indexOf(x.id) >= 0; })) : [];
    bildir(c.length ? "Programına eklendi. Dikkat: " + c[0].baslik + " ile aynı saatte." : "Programına eklendi.", c.length ? "hata" : "bilgi");
    olay("programa_ekle", { oturum: id });
  }
  $$('[data-yildiz="' + id + '"]').forEach(function (b) { yildizDugme(b, l.indexOf(id) >= 0); });
  if (SAYFA === "programim") programimCiz();
  if (SAYFA === "program") $$(".oturum[data-id]").forEach(function (k) { k.classList.toggle("secili", secilenler().indexOf(k.dataset.id) >= 0); });
}
function yildizDugme(b, secili) { b.setAttribute("aria-pressed", String(secili)); b.innerHTML = (secili ? YILDIZ : YILDIZ_BOS) + "<span>" + (secili ? "Programımda" : "Programıma ekle") + "</span>"; }
document.addEventListener("click", function (e) { var b = e.target.closest("[data-yildiz]"); if (b) { e.preventDefault(); yildizla(b.dataset.yildiz); } });

/* ── Ortak çizimler ── */
function kisilerHtml(ids, foto) {
  return String(ids || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean).map(function (id) {
    var k = kisiler[id]; if (!k) return "";
    return '<a class="kisi" href="konusmacilar.html#' + encodeURIComponent(id) + '">' + (foto !== false && k.foto ? '<img src="' + kacir(k.foto) + '" alt="" loading="lazy" />' : "") + "<span>" + kacir(k.ad) + "</span></a>";
  }).join("");
}
function gunAd(t) { var g = GUNLER.find(function (x) { return x.tarih === t; }); return g ? g.uzun : tarihYaz(t, { weekday: "long" }); }
function oturumKarti(o) {
  var s = secilenler().indexOf(o.id) >= 0;
  return '<article class="oturum' + (s ? " secili" : "") + '" data-id="' + kacir(o.id) + '" style="--renk:' + (RENK[o.salon] || "var(--kobalt)") + '">'
    + '<div class="o-ust"><span class="o-salon">' + kacir(o.salon) + '</span><span class="o-tur">' + kacir(o.tur) + "</span><span>" + kacir(o.bas) + " ile " + kacir(o.bit) + "</span></div>"
    + "<h3>" + kacir(o.baslik) + "</h3>" + (o.ozet ? "<p>" + kacir(o.ozet) + "</p>" : "")
    + '<div class="o-alt"><div class="kisiler">' + kisilerHtml(o.konusmacilar) + '</div><button class="yildiz" type="button" data-yildiz="' + kacir(o.id) + '" aria-pressed="' + s + '">' + (s ? YILDIZ : YILDIZ_BOS) + "<span>" + (s ? "Programımda" : "Programıma ekle") + "</span></button></div></article>";
}
function hazirla() { return Promise.all([oturumlar(), konusmacilar()]).then(function (r) { tumOturumlar = r[0]; kisiler = {}; r[1].forEach(function (k) { kisiler[k.id] = k; }); return r; }); }

/* ── Ana sayfa: geri sayım ve kalan biletler ── */
function sayacCiz() {
  var yer = $("#sayac"); if (!yer) return;
  var f = Math.max(0, BASLANGIC - Date.now()), s = Math.floor(f / 1000);
  if (!f) { yer.innerHTML = "<p>Zirve başladı. Programı takip et.</p>"; return; }
  var d = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60];
  $$("[data-sayac]", yer).forEach(function (b, i) { b.textContent = String(d[i]).padStart(i ? 2 : 1, "0"); });
  setTimeout(sayacCiz, 1000);
}
function biletKalanlariCiz() {
  if (!$("[data-kalan]")) return;
  Promise.all([biletler(), satilanlar()]).then(function (r) {
    r[0].forEach(function (b) {
      var n = kalan(b, r[1]), yer = $('[data-kalan="' + b.id + '"]');
      if (!yer) return;
      yer.innerHTML = kalanEtiket(n);
      var kart = yer.closest(".bilet"); if (kart) kart.classList.toggle("tukendi", n === 0);
      var d = kart && $(".dugme", kart); if (d && n === 0) { d.setAttribute("aria-disabled", "true"); d.textContent = "Tükendi"; d.classList.add("ikincil"); d.removeAttribute("href"); }
    });
  });
}
if (SAYFA === "index") { sayacCiz(); biletKalanlariCiz(); }

/* ── Program sayfası ── */
if (SAYFA === "program") {
  var secGun = GUNLER[0].tarih, secSalon = "Hepsi", secTur = "Hepsi", q = new URLSearchParams(location.search);
  if (GUNLER.some(function (g) { return g.tarih === q.get("gun"); })) secGun = q.get("gun");
  if (SALONLAR.indexOf(q.get("salon")) >= 0) secSalon = q.get("salon");
  function suzgecCiz() {
    $("#gunSekme").innerHTML = GUNLER.map(function (g) { return '<button type="button" role="tab" data-gun="' + g.tarih + '" aria-selected="' + (g.tarih === secGun) + '">' + g.ad + "<small>" + g.uzun + "</small></button>"; }).join("");
    $("#salonCip").innerHTML = ["Hepsi"].concat(SALONLAR).map(function (s) { return '<button class="cip" type="button" data-salon="' + s + '" aria-pressed="' + (s === secSalon) + '">' + (RENK[s] ? '<i style="background:' + RENK[s] + '"></i>' : "") + (s === "Hepsi" ? "Bütün salonlar" : s) + "</button>"; }).join("");
    $("#turCip").innerHTML = ["Hepsi", "Konuşma", "Panel", "Atölye"].map(function (s) { return '<button class="cip" type="button" data-tur="' + s + '" aria-pressed="' + (s === secTur) + '">' + (s === "Hepsi" ? "Bütün türler" : s) + "</button>"; }).join("");
  }
  function listeCiz() {
    var l = tumOturumlar.filter(function (o) { return o.gun === secGun && (o.tur === "Ara" ? secSalon === "Hepsi" && secTur === "Hepsi" : (secSalon === "Hepsi" || o.salon === secSalon) && (secTur === "Hepsi" || o.tur === secTur)); });
    var gruplar = {}, sira = [];
    l.forEach(function (o) { if (!gruplar[o.bas]) { gruplar[o.bas] = []; sira.push(o.bas); } gruplar[o.bas].push(o); });
    sira.sort(function (a, b) { return saatDakika(a) - saatDakika(b); });
    $("#programListe").innerHTML = sira.length ? sira.map(function (s) {
      return '<section class="zaman-blok" aria-label="' + s + '"><time>' + s + "</time><div>" + gruplar[s].map(function (o) {
        return o.tur === "Ara" ? '<div class="ara"><b>' + kacir(o.baslik) + "</b><span>" + kacir(o.bas) + " ile " + kacir(o.bit) + ", " + kacir(o.salon) + "</span></div>" : oturumKarti(o);
      }).join("") + "</div></section>";
    }).join("") : '<div class="bos"><b>Bu seçime uyan oturum yok</b>Başka bir salon ya da tür seç.</div>';
    $("#sonucSayi").textContent = l.filter(function (o) { return o.tur !== "Ara"; }).length + " oturum";
  }
  document.addEventListener("click", function (e) {
    var g = e.target.closest("[data-gun]"), s = e.target.closest("[data-salon]"), t = e.target.closest("[data-tur]");
    if (g) secGun = g.dataset.gun; else if (s) secSalon = s.dataset.salon; else if (t) secTur = t.dataset.tur; else return;
    suzgecCiz(); listeCiz();
    var u = new URL(location.href); u.searchParams.set("gun", secGun); if (secSalon === "Hepsi") u.searchParams.delete("salon"); else u.searchParams.set("salon", secSalon);
    history.replaceState(null, "", u.pathname + u.search);
  });
  suzgecCiz();
  $("#programListe").innerHTML = '<div class="iskelet"></div><div class="iskelet" style="margin-top:14px"></div>';
  hazirla().then(listeCiz).catch(function (e) { $("#programListe").innerHTML = '<div class="bos"><b>Program yüklenemedi</b>' + kacir(e && e.message || "") + "</div>"; });
}

/* ── Programım ── */
function programimCiz() {
  var yer = $("#programim"), l = secilenler(), secili = tumOturumlar.filter(function (o) { return l.indexOf(o.id) >= 0; });
  // Tablodan silinen oturumları listeden temizle.
  if (tumOturumlar.length && secili.length !== l.length) secilenYaz(secili.map(function (o) { return o.id; }));
  var cakismaSayi = secili.filter(function (o) { return cakisanlar(o, secili).length; }).length;
  $("#ozetRozet").innerHTML = '<span>' + secili.length + " oturum</span>" + (cakismaSayi ? '<span class="uyari">' + cakismaSayi + " oturum çakışıyor</span>" : secili.length ? "<span>Çakışma yok</span>" : "");
  $("#takvimAktar").disabled = !secili.length; $("#temizle").disabled = !secili.length;
  if (!secili.length) { yer.innerHTML = '<div class="bos"><b>Programın henüz boş</b>Programdaki oturumların yanındaki yıldıza dokun; seçtiklerin burada saat sırasıyla toplanır, aynı saate denk gelenleri işaretleriz.<br><a class="dugme" href="program.html">Programa git</a></div>'; return; }
  yer.innerHTML = GUNLER.map(function (g) {
    var gunL = secili.filter(function (o) { return o.gun === g.tarih; });
    if (!gunL.length) return "";
    return '<h2 class="gun-baslik">' + g.ad + "<small>" + g.uzun + ", " + gunL.length + ' oturum</small></h2><div class="zaman-cizgi">' + gunL.map(function (o) {
      var c = cakisanlar(o, secili);
      return '<article class="oturum" style="--renk:' + (RENK[o.salon] || "var(--kobalt)") + '"><time>' + kacir(o.bas) + "<small>" + kacir(o.bit) + "'" + saatEki(saatDakika(o.bit), "e") + " kadar</small></time>"
        + '<div class="icerik"><div class="o-ust"><span class="o-salon">' + kacir(o.salon) + '</span><span class="o-tur">' + kacir(o.tur) + "</span></div><h3>" + kacir(o.baslik) + '</h3><div class="kisiler">' + kisilerHtml(o.konusmacilar) + "</div>"
        + (c.length ? '<div class="cakisma">' + UYARI + "<span>Aynı saatte: " + c.map(function (x) { return kacir(x.baslik) + " (" + kacir(x.salon) + ")"; }).join(", ") + "</span></div>" : "") + "</div>"
        + '<button class="yildiz" type="button" data-yildiz="' + kacir(o.id) + '" aria-pressed="true">' + YILDIZ + "<span>Programımda</span></button></article>";
    }).join("") + "</div>";
  }).join("");
}
if (SAYFA === "programim") {
  $("#programim").innerHTML = '<div class="iskelet"></div>';
  hazirla().then(programimCiz);
  $("#temizle").addEventListener("click", function () { if (confirm("Programındaki bütün oturumlar çıkarılsın mı?")) { secilenYaz([]); programimCiz(); } });
  $("#takvimAktar").addEventListener("click", function () {
    var l = secilenler(), secili = tumOturumlar.filter(function (o) { return l.indexOf(o.id) >= 0; });
    var s = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Urun Zirvesi Istanbul//Programim//TR", "CALSCALE:GREGORIAN"];
    secili.forEach(function (o) {
      var t = o.gun.replace(/-/g, "");
      s.push("BEGIN:VEVENT", "UID:" + o.id + "@urunzirvesi.com.tr", "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z", "DTSTART;TZID=Europe/Istanbul:" + t + "T" + o.bas.replace(":", "") + "00", "DTEND;TZID=Europe/Istanbul:" + t + "T" + o.bit.replace(":", "") + "00", "SUMMARY:" + o.baslik.replace(/,/g, "\\,"), "LOCATION:Haliç Kongre Merkezi\\, " + o.salon, "END:VEVENT");
    });
    s.push("END:VCALENDAR");
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([s.join("\r\n")], { type: "text/calendar" })); a.download = "urun-zirvesi-programim.ics"; document.body.appendChild(a); a.click(); a.remove();
    olay("programi_aktar", { oturum: secili.length });
  });
  window.addEventListener("storage", function (e) { if (e.key === ANAHTAR) programimCiz(); });
}

/* ── Konuşmacılar ── */
if (SAYFA === "konusmacilar") {
  var secS = "Hepsi", dlg = $("#pencere");
  function salonlari(k) { return tumOturumlar.filter(function (o) { return ("," + o.konusmacilar + ",").replace(/\s/g, "").indexOf("," + k.id + ",") >= 0; }); }
  function izgaraCiz() {
    var l = Object.keys(kisiler).map(function (id) { return kisiler[id]; }).sort(function (a, b) { return (a.sira || 99) - (b.sira || 99); })
      .filter(function (k) { return secS === "Hepsi" || salonlari(k).some(function (o) { return o.salon === secS; }); });
    $("#konusmaciIzgara").innerHTML = l.map(function (k) { return '<button class="konusmaci" type="button" data-kisi="' + kacir(k.id) + '"><span class="foto"><img src="' + kacir(k.foto) + '" alt="" loading="lazy" /></span><b>' + kacir(k.ad) + "</b><span>" + kacir(k.unvan) + ", " + kacir(k.sirket) + "</span></button>"; }).join("");
    $("#kSalon").innerHTML = ["Hepsi"].concat(SALONLAR).map(function (s) { return '<button class="cip" type="button" data-ks="' + s + '" aria-pressed="' + (s === secS) + '">' + (RENK[s] ? '<i style="background:' + RENK[s] + '"></i>' : "") + (s === "Hepsi" ? "Bütün konuşmacılar" : s) + "</button>"; }).join("");
  }
  function ac(id) {
    var k = kisiler[id]; if (!k) return;
    var l = salonlari(k), sec = secilenler();
    $("#pencereIc").innerHTML = '<button class="kapat" type="button" data-kapat aria-label="Kapat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button>'
      + '<div class="pencere-ic"><img src="' + kacir(k.foto) + '" alt="' + kacir(k.ad) + '" /><div class="pencere-govde"><h2 id="pencereBaslik">' + kacir(k.ad) + '</h2><p class="unvan">' + kacir(k.unvan) + ", " + kacir(k.sirket) + "</p><p>" + kacir(k.hakkinda || "") + "</p>"
      + (l.length ? "<h3>Zirvedeki oturumları</h3>" + l.map(function (o) { var s = sec.indexOf(o.id) >= 0; return '<div class="mini-oturum" style="--renk:' + (RENK[o.salon] || "var(--kobalt)") + '"><div><b>' + kacir(o.baslik) + "</b><small>" + kacir(gunAd(o.gun)) + ", " + kacir(o.bas) + " · " + kacir(o.salon) + '</small></div><button class="yildiz" type="button" data-yildiz="' + kacir(o.id) + '" aria-pressed="' + s + '">' + (s ? YILDIZ : YILDIZ_BOS) + "<span>" + (s ? "Programımda" : "Programıma ekle") + "</span></button></div>"; }).join("") : "")
      + "</div></div>";
    if (!dlg.open) dlg.showModal();
    if (location.hash !== "#" + id) history.replaceState(null, "", "#" + id);
  }
  dlg.addEventListener("click", function (e) { if (e.target === dlg || e.target.closest("[data-kapat]")) dlg.close(); });
  dlg.addEventListener("close", function () { history.replaceState(null, "", location.pathname + location.search); });
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-kisi]"); if (b) return ac(b.dataset.kisi);
    var s = e.target.closest("[data-ks]"); if (s) { secS = s.dataset.ks; izgaraCiz(); }
    var a = e.target.closest('a.kisi[href^="konusmacilar.html#"]'); if (a) { e.preventDefault(); ac(decodeURIComponent(a.getAttribute("href").split("#")[1])); }
  });
  window.addEventListener("hashchange", function () { var id = decodeURIComponent(location.hash.slice(1)); if (kisiler[id]) ac(id); });
  hazirla().then(function () { izgaraCiz(); var id = decodeURIComponent(location.hash.slice(1)); if (kisiler[id]) ac(id); });
}

/* ── Bilet ve kayıt ── */
if (SAYFA === "bilet") {
  var form = $("#kayit"), liste = [], satilan = {}, secB = null, adet = 1, mesaj = $("#mesaj");
  function bilet() { return liste.find(function (b) { return b.id === secB; }); }
  function secimCiz() {
    $("#biletSecim").innerHTML = liste.map(function (b) {
      var n = kalan(b, satilan), oz = String(b.ozellikler || "").split("\n").filter(Boolean);
      return '<button type="button" class="bilet' + (n === 0 ? " tukendi" : "") + '" data-bilet="' + kacir(b.id) + '" aria-pressed="' + (b.id === secB) + '"' + (n === 0 ? " disabled" : "") + ">"
        + "<h3>" + kacir(b.ad) + '</h3><div class="fiyat">' + kacir(tl(b.fiyat).replace(" TL", "")) + "<small>TL" + (b.enAz > 1 ? ", kişi başı" : "") + '</small></div><p class="aciklama">' + kacir(b.aciklama || "") + "</p><ul>" + oz.map(function (x) { return "<li>" + kacir(x) + "</li>"; }).join("") + "</ul>" + kalanEtiket(n) + "</button>";
    }).join("");
  }
  function formCiz() {
    var b = bilet(), n = b ? kalan(b, satilan) : 0;
    $("#secimYok").hidden = !!b; $("#formAlan").hidden = !b;
    if (!b) return;
    var enAz = Math.max(1, Number(b.enAz) || 1), enCok = Math.max(enAz, Math.min(Number(b.enCok) || 5, n));
    adet = Math.min(Math.max(adet, enAz), enCok);
    $("#biletAd").textContent = b.ad;
    $("#adetNot").textContent = enAz === enCok ? "Kişiye özel tek bilet" : enAz > 1 ? "En az " + enAz + ", en çok " + enCok + " kişi" : "En çok " + enCok + " bilet";
    $("#adet").textContent = String(adet);
    $("#azalt").disabled = adet <= enAz; $("#arttir").disabled = adet >= enCok;
    $("#toplam").textContent = tl(adet * b.fiyat);
    var kurumsal = b.id === "kurumsal" || enAz > 1;
    $("#katilimciAlan").hidden = !kurumsal; $("#katilimciAlan textarea").required = kurumsal;
    $("#sirketAlan input").required = kurumsal;
    $("#sirketYildiz").hidden = !kurumsal;
    if (kurumsal) form.elements.fatura.value = "Kurumsal";
  }
  $("#biletSecim").addEventListener("click", function (e) { var b = e.target.closest("[data-bilet]"); if (!b || b.disabled) return; secB = b.dataset.bilet; adet = 1; secimCiz(); formCiz(); if (innerWidth < 920) $("#formKart").scrollIntoView({ behavior: "smooth", block: "start" }); });
  $("#azalt").addEventListener("click", function () { adet--; formCiz(); });
  $("#arttir").addEventListener("click", function () { adet++; formCiz(); });
  function goster(tur, baslik, metin) { mesaj.hidden = false; mesaj.className = "mesaj " + tur; mesaj.innerHTML = "<b>" + kacir(baslik) + "</b>" + kacir(metin || ""); mesaj.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
  function kod() { var h = "ABCDEFGHJKLMNPRSTUVYZ23456789", s = ""; for (var i = 0; i < 6; i++) s += h.charAt(Math.floor(Math.random() * h.length)); return "UZ27-" + s; }
  form.addEventListener("submit", function (e) {
    e.preventDefault(); mesaj.hidden = true;
    var b = bilet(); if (!b) return goster("hata", "Bilet türü seç.", "");
    if (!form.reportValidity()) return;
    var f = new FormData(form);
    var k = { kod: kod(), bilet: b.id, biletAd: b.ad, adet: adet, tutar: adet * b.fiyat, ad: String(f.get("ad")).trim(), eposta: String(f.get("eposta")).trim(), telefon: String(f.get("telefon") || "").trim() || null, sirket: String(f.get("sirket") || "").trim() || null, unvan: String(f.get("unvan") || "").trim() || null, katilimcilar: String(f.get("katilimcilar") || "").trim() || null, fatura: String(f.get("fatura") || "Bireysel"), kvkk: true, bulten: f.get("bulten") === "on" };
    if (k.telefon && !/^[0-9 +()]{10,17}$/.test(k.telefon)) return goster("hata", "Telefon numarası geçersiz.", "0532 123 45 67 biçiminde yazabilirsin.");
    if (!veriVar()) return goster("bilgi", "Bu canlı önizlemede kayıt alınmaz.", "Şablonu kullanınca kayıtlar veritabanındaki kayitlar tablosuna düşer ve kalan bilet sayısı kendiliğinden azalır.");
    var d = $("#gonder"); d.disabled = true; d.textContent = "Kaydediliyor…";
    // Göndermeden hemen önce kontenjanı yeniden denetle.
    satilanlar().then(function (s) {
      satilan = s;
      if (kalan(b, satilan) < adet) { secimCiz(); formCiz(); throw new Error("KONTENJAN"); }
      return vayra.veri.ekle("kayitlar", k);
    }).then(function () { olay("bilet_kayit", { bilet: b.id, adet: adet }); basari(k); })
      .catch(function (err) {
        if (err && err.message === "KONTENJAN") goster("hata", "Bu bilet türünde yeterli yer kalmadı.", "Kalan sayıları yeniledik; adedi azalt ya da başka bir bilet türü seç.");
        else goster("hata", "Kayıt gönderilemedi.", (err && err.message ? err.message + ". " : "") + "Lütfen yeniden dene.");
      }).finally(function () { d.disabled = false; d.textContent = "Kaydı tamamla"; });
  });
  function basari(k) {
    $("#icerik").innerHTML = '<section class="kapsayici"><div class="basari" role="status"><div class="basari-ust"><span class="kod">' + kacir(k.kod) + "</span><h1>Kaydın alındı, görüşmek üzere.</h1><p>Ödeme bağlantısı ve faturan 24 saat içinde " + kacir(k.eposta) + " adresine gelecek. Ödeme tamamlanınca yaka kartı QR kodun gönderilir.</p></div>"
      + '<div class="basari-govde"><dl><dt>Bilet</dt><dd>' + kacir(k.biletAd) + " × " + k.adet + "</dd><dt>Tutar</dt><dd>" + kacir(tl(k.tutar)) + " (KDV dahil)</dd><dt>Ad soyad</dt><dd>" + kacir(k.ad) + "</dd><dt>Tarih</dt><dd>14 ile 15 Nisan 2027, Haliç Kongre Merkezi</dd></dl>"
      + "<ol><li>E-postandaki bağlantıdan ödemeyi tamamla.</li><li>Programdan izlemek istediğin oturumları yıldızla.</li><li>Zirve sabahı QR kodunla fuayeden yaka kartını al.</li></ol>"
      + '<div class="eylemler"><a class="dugme" href="program.html">Programımı oluştur</a><button class="dugme ikincil" type="button" id="takvim">Takvimime ekle</button></div></div></div></section>';
    window.scrollTo(0, 0);
    $("#takvim").addEventListener("click", function () {
      var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Urun Zirvesi Istanbul//Bilet//TR", "BEGIN:VEVENT", "UID:" + k.kod + "@urunzirvesi.com.tr", "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z", "DTSTART;TZID=Europe/Istanbul:20270414T083000", "DTEND;TZID=Europe/Istanbul:20270415T173000", "SUMMARY:Ürün Zirvesi İstanbul 2027", "LOCATION:Haliç Kongre Merkezi\\, Sütlüce\\, Beyoğlu / İstanbul", "DESCRIPTION:Kayıt kodu " + k.kod, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" })); a.download = "urun-zirvesi-2027.ics"; document.body.appendChild(a); a.click(); a.remove();
    });
  }
  $("#biletSecim").innerHTML = '<div class="iskelet"></div><div class="iskelet"></div>';
  Promise.all([biletler(), satilanlar()]).then(function (r) {
    liste = r[0].filter(function (b) { return b.satista !== false || true; }); satilan = r[1];
    var istenen = new URLSearchParams(location.search).get("tur");
    var ilk = liste.find(function (b) { return b.id === istenen && kalan(b, satilan) > 0; }) || liste.find(function (b) { return kalan(b, satilan) > 0; });
    secB = ilk ? ilk.id : null;
    secimCiz(); formCiz();
  });
}

/* Galeri önizlemesinde (köprü yokken) kodsuz formlar sayfayı yenilemesin. */
document.addEventListener("submit", function (e) {
  var f = e.target;
  if (!f.hasAttribute || !f.hasAttribute("data-vayra-form") || e.defaultPrevented) return;
  e.preventDefault(); bildir("Bu canlı önizlemede form gönderilmez; şablonu kullanınca gelen kutuna düşer.");
});
rozetCiz();
`;

const SIMGE_TAKVIM = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>';

export const KONFERANS = {
  id: "konferans",
  ad: "Ürün Zirvesi · Konferans",
  tur: "site" as const,
  aciklama: "İki günlük ürün konferansı: gün ve salon süzgeçli program, yıldızlı kişisel program, konuşmacılar, kontenjanlı bilet kaydı ve geri sayım",
  kapak: "/gercek/build/sablon/konferans.webp",
  tablolar: TABLOLAR,
  dosyalar: {
    "index.html": sayfa("index.html", "Ürün Zirvesi İstanbul 2027 · 14 ile 15 Nisan, Haliç Kongre Merkezi", "Ürün yöneticileri, tasarımcılar ve mühendisler için iki günlük zirve: konuşmalar, paneller ve atölyeler. 14 ile 15 Nisan 2027, İstanbul.", `<section class="kapsayici kahraman">
  <div>
    <span class="tarih-hap"><i></i>14 ile 15 Nisan 2027 · Haliç Kongre Merkezi, İstanbul</span>
    <h1>Ürün <span>Zirvesi</span><em>İstanbul</em></h1>
    <p class="giris">Ürün yöneticileri, tasarımcılar ve mühendisler iki gün boyunca aynı çatı altında. ${SAYI.oturum} oturum, ${SAYI.atolye} atölye, üç salon ve bol koridor sohbeti.</p>
    <div class="eylemler"><a class="dugme" href="bilet.html">Biletini al ${OK}</a><a class="dugme ikincil" href="program.html">Programı incele</a></div>
  </div>
  <div class="kolaj">
    <figure class="f1"><img src="/gercek/havuz/gorsel/mk-muzik-4188.webp" alt="Ana sahnede ışıklar altında kalabalık salon" /></figure>
    <figure class="f2"><img src="/gercek/havuz/gorsel/mk-is-4809.webp" alt="Masa başında çalışan ürün ekibi" /></figure>
    <div class="sayac" id="sayac" aria-live="off"><p>Açılış konuşmasına kalan</p><div class="sayac-kutular"><div><b data-sayac>0</b><span>gün</span></div><div><b data-sayac>00</b><span>saat</span></div><div><b data-sayac>00</b><span>dakika</span></div><div><b data-sayac>00</b><span>saniye</span></div></div></div>
  </div>
</section>
<div class="serit" aria-hidden="true"><div class="serit-ic">${[0, 1].map(() => ["Ürün yönetimi", "Tasarım sistemleri", "Yapay zekâ ile ürün", "Büyüme", "Kullanıcı araştırması", "Erişilebilirlik", "Fiyatlandırma", "Mühendislik kültürü"].map((x) => `<span>${x}</span>`).join("")).join("")}</div></div>
<section class="kapsayici bolum">
  <div class="rakamlar">
    <div class="metin-kutu"><span class="ust-yazi">Neden Ürün Zirvesi?</span><h2>Slayt değil, sahadan dersler.</h2><p>Konuşmacılarımızın hepsi ürününü bugün yönetiyor. Her oturumda bir karar, bir deney ya da bir hata ve ondan çıkan ders var.</p></div>
    <div><b>2</b><span>gün</span><small>14 ile 15 Nisan</small></div>
    <div><b>${SAYI.konusmaci}</b><span>konuşmacı</span><small>Ürün, tasarım, mühendislik</small></div>
    <div><b>${SAYI.atolye}</b><span>atölye</span><small>40 kişilik uygulamalı</small></div>
    <div><b>1.400</b><span>katılımcı</span><small>Geçen yıl 1.150 kişiydik</small></div>
  </div>
</section>
<section class="kapsayici bolum" style="padding-top:0">
  <div class="bolum-ust"><div><span class="ust-yazi">Üç salon, üç tempo</span><h2>Nereden başlayacağını seç.</h2></div><a class="dugme ikincil" href="program.html">Bütün program</a></div>
  <div class="salonlar">
    <a class="salon s-ana" href="program.html?salon=Ana+Sahne"><div><h3>Ana Sahne</h3><p>Açılış, kapanış, paneller ve ürün liderlerinden büyük resim. 1.200 kişilik.</p></div><div class="alt-satir"><span>${OTURUMLAR.filter((o) => o.salon === "Ana Sahne").length} oturum</span><span class="ok">${OK}</span></div></a>
    <a class="salon s-tasarim" href="program.html?salon=Tasar%C4%B1m+Salonu"><div><h3>Tasarım Salonu</h3><p>Tasarım sistemleri, arayüz metinleri, erişilebilirlik ve araştırma. 350 kişilik.</p></div><div class="alt-satir"><span>${OTURUMLAR.filter((o) => o.salon === "Tasarım Salonu").length} oturum</span><span class="ok">${OK}</span></div></a>
    <a class="salon s-atolye" href="program.html?salon=At%C3%B6lye+Odas%C4%B1"><div><h3>Atölye Odası</h3><p>Dizüstü bilgisayarını getir: 90 dakikalık, 40 kişilik uygulamalı çalışmalar.</p></div><div class="alt-satir"><span>${SAYI.atolye} atölye</span><span class="ok">${OK}</span></div></a>
  </div>
</section>
<section class="kapsayici bolum" style="padding-top:0">
  <div class="bolum-ust"><div><span class="ust-yazi">Konuşmacılar</span><h2>Ürünü bugün yöneten insanlar.</h2></div><a class="dugme ikincil" href="konusmacilar.html">Bütün konuşmacılar</a></div>
  <div class="konusmaci-izgara">
${KONUSMACILAR.filter((k) => k.one).map(konusmaciKarti).join("\n")}
  </div>
</section>
<section class="kapsayici bolum" style="padding-top:0">
  <div class="vitrin-program">
    <figure><img src="/gercek/havuz/gorsel/mk-portre-42648.webp" alt="Sahnede grafik anlatan konuşmacı" loading="lazy" /></figure>
    <div>
      <span class="ust-yazi">Ana Sahne, ${GUNLER[0].uzun}</span>
      <h2 style="font-size:clamp(34px,4.4vw,56px);margin-bottom:26px">İlk günün akışı</h2>
      <ol class="akis">
${OTURUMLAR.filter((o) => o.gun === GUNLER[0].tarih && o.salon === "Ana Sahne").slice(0, 6).map((o) => `        <li><time>${o.bas}</time><div><h3>${o.baslik}</h3><p>${o.konusmacilar.split(",").map((x) => K(x).ad).join(", ")}</p></div></li>`).join("\n")}
      </ol>
      <div class="eylemler" style="margin-top:26px"><a class="dugme" href="program.html">Programı aç ve yıldızla</a></div>
    </div>
  </div>
</section>
<section class="kapsayici bolum" style="padding-top:0" id="biletler">
  <div class="bolum-ust"><div><span class="ust-yazi">Biletler</span><h2>Yerini şimdiden ayır.</h2><p>Fiyatlara KDV, öğle yemekleri ve kayıtlara bir yıllık erişim dahildir.</p></div></div>
  <div class="bilet-izgara">
${BILETLER.map((b) => `    <div class="bilet${b.id === "standart" ? " vurgu" : ""}"><h3>${b.ad}</h3><div class="fiyat">${b.fiyat.toLocaleString("tr-TR")}<small>TL${b.enAz > 1 ? ", kişi başı" : ""}</small></div><p class="aciklama">${b.aciklama}</p><ul>${b.ozellikler.split("\n").map((x) => `<li>${x}</li>`).join("")}</ul><span data-kalan="${b.id}"></span><a class="dugme${b.id === "standart" ? " mercan" : ""}" href="bilet.html?tur=${b.id}">${b.ad} bileti al</a></div>`).join("\n")}
  </div>
</section>
<section class="kapsayici bolum" style="padding-top:0" id="mekan">
  <div class="mekan">
    <div class="kutu">
      <span class="ust-yazi" style="color:#ffd2c7">Mekân</span>
      <h2>Haliç Kongre Merkezi</h2>
      <p>Haliç kıyısında, tarihi tütün depolarından dönüştürülmüş kongre merkezi. Bütün salonlar aynı katta, terası denize bakıyor.</p>
      <dl>
        <div><dt>Adres</dt><dd>Sütlüce Mah. Karaağaç Cad. No: 1, Beyoğlu / İstanbul</dd></div>
        <div><dt>Toplu ulaşım</dt><dd>Şişhane metro durağından zirve servisi her 15 dakikada bir. Sütlüce vapur iskelesine 4 dakika yürüme.</dd></div>
        <div><dt>Otopark</dt><dd>Kongre merkezi otoparkı, katılımcılara günlük 250 TL.</dd></div>
      </dl>
      <div class="eylemler"><a class="dugme beyaz" href="https://www.openstreetmap.org/?mlat=41.0563&amp;mlon=28.9454#map=16/41.0563/28.9454" target="_blank" rel="noopener">Yol tarifi al</a></div>
    </div>
    <iframe title="Haliç Kongre Merkezi harita konumu" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=28.932%2C41.049%2C28.958%2C41.063&amp;layer=mapnik&amp;marker=41.0563%2C28.9454"></iframe>
  </div>
</section>
<section class="kapsayici bolum" style="padding-top:0">
  <div class="bolum-ust"><div><span class="ust-yazi">Destekçiler</span><h2>Zirveyi mümkün kılanlar</h2></div><a class="dugme ikincil" href="mailto:sponsor@urunzirvesi.com.tr">Sponsor ol</a></div>
  <div class="sponsorlar">${SPONSORLAR.map(([a, s]) => `<span class="${s}">${a}</span>`).join("")}</div>
</section>
<section class="kapsayici bolum" style="padding-top:0" id="sss">
  <div class="bolum-ust"><div><span class="ust-yazi">Sık sorulanlar</span><h2>Aklına takılanlar</h2></div></div>
  <div class="sss">
${SSS.map(([s, c], i) => `    <details${i === 0 ? " open" : ""}><summary>${s}</summary><p>${c}</p></details>`).join("\n")}
  </div>
</section>
<section class="kapsayici">
  <div class="cagri"><div><h2>14 Nisan sabahı Haliç'te buluşalım.</h2><p>Standart biletlerin yarısından fazlası satıldı. Ekibinle geliyorsan Kurumsal bilete bak.</p></div><a class="dugme" href="bilet.html">Biletini al ${OK}</a></div>
</section>`),
    "program.html": sayfa("program.html", "Program · Ürün Zirvesi İstanbul 2027", "İki günlük zirve programı: Ana Sahne, Tasarım Salonu ve Atölye Odası oturumları, saatleri ve konuşmacıları.", `<section class="kapsayici sayfa-bas">
  <span class="ust-yazi">Program</span>
  <h1>İki gün, üç salon.</h1>
  <p>Gününü ve salonunu seç, izlemek istediğin oturumları yıldızla. Seçtiklerin Programım sayfasında saat sırasıyla toplanır.</p>
</section>
<section class="kapsayici">
  <div class="suzgec" aria-label="Program süzgeci">
    <div class="gun-sekmeler" id="gunSekme" role="tablist" aria-label="Gün"></div>
    <div class="cipler" id="salonCip" aria-label="Salon"></div>
    <div class="cipler" id="turCip" aria-label="Oturum türü"></div>
    <span id="sonucSayi" style="margin-left:auto;color:var(--soluk);font-weight:600" aria-live="polite"></span>
  </div>
  <div id="programListe"></div>
  <p style="margin-top:28px"><a class="dugme ikincil" href="programim.html">${SIMGE_TAKVIM} Programımı gör</a></p>
</section>`),
    "programim.html": sayfa("programim.html", "Programım · Ürün Zirvesi İstanbul 2027", "Yıldızladığın oturumlar, saat sırası ve çakışma uyarılarıyla.", `<section class="kapsayici sayfa-bas">
  <span class="ust-yazi">Programım</span>
  <h1>Senin zirven.</h1>
  <p>Yıldızladığın oturumlar bu cihazda saklanır. Aynı saate denk gelenleri işaretliyoruz; listeni takvimine aktarabilirsin.</p>
</section>
<section class="kapsayici">
  <div class="programim-ozet"><div class="rozetler" id="ozetRozet"></div><div class="eylemler"><button class="dugme kucuk" type="button" id="takvimAktar">${SIMGE_TAKVIM} Takvimime aktar</button><button class="dugme kucuk ikincil" type="button" id="temizle">Listeyi temizle</button></div></div>
  <div id="programim" aria-live="polite"></div>
</section>`),
    "konusmacilar.html": sayfa("konusmacilar.html", "Konuşmacılar · Ürün Zirvesi İstanbul 2027", "Ürün yöneticileri, tasarımcılar, mühendisler ve kurucular: Ürün Zirvesi İstanbul 2027 konuşmacıları.", `<section class="kapsayici sayfa-bas">
  <span class="ust-yazi">Konuşmacılar</span>
  <h1>${SAYI.konusmaci} konuşmacı.</h1>
  <p>Her biri ürününü bugün yönetiyor. Bir konuşmacıya dokun, hakkında bilgiyi ve zirvedeki oturumlarını gör.</p>
</section>
<section class="kapsayici">
  <div class="cipler" id="kSalon" style="margin:24px 0 28px" aria-label="Salona göre süz"></div>
  <div class="konusmaci-izgara" id="konusmaciIzgara">
${KONUSMACILAR.map((k) => `    <button class="konusmaci" type="button" data-kisi="${k.id}"><span class="foto"><img src="${k.foto}" alt="" loading="lazy" /></span><b>${k.ad}</b><span>${k.unvan}, ${k.sirket}</span></button>`).join("\n")}
  </div>
</section>
<dialog class="pencere" id="pencere" aria-labelledby="pencereBaslik"><div id="pencereIc" style="position:relative"></div></dialog>`),
    "bilet.html": sayfa("bilet.html", "Bilet al · Ürün Zirvesi İstanbul 2027", "Ürün Zirvesi İstanbul 2027 bilet türleri ve kayıt: Erken kayıt, Standart, Öğrenci ve Kurumsal.", `<section class="kapsayici sayfa-bas">
  <span class="ust-yazi">Biletler</span>
  <h1>Yerini ayır.</h1>
  <p>Bilet türünü seç, bilgilerini yaz. Ödeme bağlantısı ve faturan 24 saat içinde e-postana gelir. Fiyatlara KDV dahildir.</p>
</section>
<section class="kapsayici bilet-duzen" style="margin-top:28px">
  <div class="secim-izgara" id="biletSecim" aria-label="Bilet türleri"></div>
  <aside class="form-kart" id="formKart">
    <p id="secimYok" class="mesaj bilgi" style="margin:0"><b>Bütün biletler tükendi.</b>Bekleme listesi için merhaba@urunzirvesi.com.tr adresine yaz.</p>
    <form class="form" id="kayit" novalidate>
      <div id="formAlan" class="form">
        <div><h2>Kayıt bilgileri</h2><p style="margin:0;color:var(--soluk);font-size:15px">Seçili bilet: <b id="biletAd" style="color:var(--murekkep)"></b></p></div>
        <div class="adet"><span>Bilet adedi<small id="adetNot"></small></span><div class="stepper"><button type="button" id="azalt" aria-label="Bir azalt">−</button><output id="adet" aria-live="polite">1</output><button type="button" id="arttir" aria-label="Bir arttır">+</button></div></div>
        <label class="alan">Ad soyad<input name="ad" required minlength="3" autocomplete="name" /></label>
        <label class="alan">E-posta<input name="eposta" type="email" required autocomplete="email" inputmode="email" /></label>
        <div class="ikili">
          <label class="alan">Cep telefonu<input name="telefon" type="tel" autocomplete="tel" inputmode="tel" placeholder="05xx xxx xx xx" /></label>
          <label class="alan">Unvan<input name="unvan" autocomplete="organization-title" placeholder="Ürün yöneticisi" /></label>
        </div>
        <label class="alan" id="sirketAlan">Şirket<span id="sirketYildiz" hidden> (zorunlu)</span><input name="sirket" autocomplete="organization" /></label>
        <label class="alan" id="katilimciAlan" hidden>Katılımcıların adları<textarea name="katilimcilar" rows="3" placeholder="Her satıra bir ad soyad"></textarea><small>Adları zirveden bir hafta öncesine kadar değiştirebilirsin.</small></label>
        <label class="alan">Fatura türü<select name="fatura"><option>Bireysel</option><option>Kurumsal</option></select></label>
        <label class="onay"><input type="checkbox" name="kvkk" required /> <span><a href="kvkk.html" target="_blank" rel="noopener">Aydınlatma metnini</a> okudum; kaydım için kişisel verilerimin işlenmesini kabul ediyorum.</span></label>
        <label class="onay"><input type="checkbox" name="bulten" /> <span>Program duyurularını e-postayla almak istiyorum.</span></label>
        <div class="toplam"><span>Toplam, KDV dahil</span><b id="toplam">0 TL</b></div>
        <div id="mesaj" class="mesaj" role="alert" hidden></div>
        <button class="dugme" id="gonder" type="submit">Kaydı tamamla</button>
      </div>
    </form>
  </aside>
</section>`),
    "kvkk.html": sayfa("kvkk.html", "KVKK aydınlatma metni · Ürün Zirvesi İstanbul", "Ürün Zirvesi İstanbul kayıt sürecinde işlenen kişisel verilere ilişkin aydınlatma metni.", `<section class="kapsayici metin">
  <h1>Kişisel verilerin işlenmesine ilişkin aydınlatma metni</h1>
  <p>Kavşak Etkinlik ve Organizasyon A.Ş. olarak, Ürün Zirvesi İstanbul 2027 kayıt sürecinde işlediğimiz kişisel verileriniz hakkında 6698 sayılı Kişisel Verilerin Korunması Kanunu'nun 10. maddesi uyarınca sizi bilgilendiririz.</p>
  <h2>Veri sorumlusu</h2>
  <p>Kavşak Etkinlik ve Organizasyon A.Ş., Kuştepe Mah. Mecidiyeköy Yolu Cad. No: 12, Şişli / İstanbul. İletişim: kvkk@urunzirvesi.com.tr</p>
  <h2>İşlenen veriler ve amaçlar</h2>
  <p>Ad soyad, e-posta, telefon, şirket ve unvan bilgileriniz; kaydınızın oluşturulması, ödeme bağlantısı ve faturanın gönderilmesi, yaka kartınızın hazırlanması ve zirve günü girişinizin yapılması amacıyla işlenir. İzin vermeniz hâlinde e-posta adresiniz program duyuruları için kullanılır.</p>
  <h2>Hukuki sebep ve aktarım</h2>
  <p>Verileriniz sözleşmenin kurulması ve ifası ile hukuki yükümlülüklerimizin yerine getirilmesi sebeplerine dayanılarak işlenir. Ödeme, e-posta ve barındırma hizmeti aldığımız tedarikçilerle yalnız bu amaçlarla sınırlı olarak paylaşılır; sponsorlarla paylaşılmaz.</p>
  <h2>Saklama süresi</h2>
  <p>Kayıt bilgileri zirveden sonra iki yıl, fatura bilgileri mevzuatta öngörülen süre boyunca saklanır.</p>
  <h2>Haklarınız</h2>
  <p>Kanun'un 11. maddesi kapsamındaki haklarınız için kvkk@urunzirvesi.com.tr adresine yazabilirsiniz. Başvurunuz en geç 30 gün içinde ücretsiz yanıtlanır.</p>
  <p><a class="dugme" href="bilet.html">Bilet sayfasına dön</a></p>
</section>`),
    "ikon.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="11" fill="#2337ff"/><path d="M11 27 20 11l9 16" fill="none" stroke="#fbfaf7" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="20" cy="27" r="2.6" fill="#ff6b4a"/></svg>',
    "stil.css": STIL,
    "app.js": UYGULAMA,
    "api/kalan.js": KALAN,
  },
};
