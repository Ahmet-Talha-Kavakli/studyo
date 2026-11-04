/* SSS — kategorili, /sss sayfasında aranabilir. Cevaplar yasal belgelerle (şartlar, iade, gizlilik)
   ve ürünün gerçek davranışıyla tutarlı tutulur; bağlantılar ilgili ekrana götürür. */

export interface SSSMadde {
  s: string; // soru
  c: string; // cevap
  /** İlgili sayfa bağlantısı */
  baglanti?: { ad: string; href: string };
  /** Arama için ek anahtar kelimeler */
  anahtar?: string;
}

export interface SSSKategori {
  ad: string;
  /** Kısa açıklama (kategori kartı) */
  ozet: string;
  /** lucide simge adı (sayfada eşlenir) */
  ikon: string;
  maddeler: SSSMadde[];
}

export const SSS_KATEGORILER: SSSKategori[] = [
  {
    ad: "Genel", ozet: "Vayra nedir, kimler için, nasıl başlanır.", ikon: "Sparkles",
    maddeler: [
      { s: "Vayra nedir?", c: "Vayra; video, görsel, ses, müzik ve 3D üretimini tek yerde toplayan yaratıcı yapay zekâ platformudur. Dünyanın önde gelen modellerini sinema, pazarlama ve 3D gibi uçtan uca stüdyolarla birlikte sunar.", baglanti: { ad: "Modelleri gör", href: "/modeller" } },
      { s: "Ücretsiz deneyebilir miyim?", c: "Evet. Kayıt olduğunda 50 kredi hoş geldin hediyesi ve her gün 10 ücretsiz kredi alırsın; kredi kartı gerekmez.", baglanti: { ad: "Kaydol", href: "/kayit" } },
      { s: "Hangi dilleri destekliyor?", c: "Arayüz Türkçedir; modellerin çoğu Türkçe istemi doğrudan anlar. Ses ve altyazı üretimi 40'tan fazla dili destekler.", anahtar: "türkçe ingilizce dil" },
      { s: "Kaç yaşında olmam gerekiyor?", c: "Vayra'yı kullanmak için 18 yaşını doldurmuş olmalısın." },
      { s: "Ekip olarak kullanabilir miyiz?", c: "Evet. Ekip planı 10 üyeye kadar ortak kredi havuzu, ortak projeler ve marka kitleri sunar. SSO, denetim kaydı ve sözleşme ihtiyacı olan kurumlar için Kurumsal plan vardır.", baglanti: { ad: "Kurumsal", href: "/kurumsal" } },
      { s: "Mobilde kullanabilir miyim?", c: "Evet. Vayra tarayıcıda telefon ve tablette de çalışır; stüdyolar dokunmatik ekrana göre düzenlenmiş tek sütunlu bir akışla açılır.", anahtar: "telefon tablet ios android uygulama" },
    ],
  },
  {
    ad: "Fiyatlandırma ve krediler", ozet: "Planlar, krediler, iade ve iptal.", ikon: "CreditCard",
    maddeler: [
      { s: "Krediler nasıl çalışır?", c: "Her üretimin kredi bedeli, üretimden önce arayüzde gösterilir. Planın her fatura döneminde kredi yükler; ihtiyaç olursa süresi dolmayan ek kredi paketleri alabilirsin.", baglanti: { ad: "Kredi yükle", href: "/panel/kredi?sekme=kredi" } },
      { s: "Kullanılmayan krediler devreder mi?", c: "Artı ve üzeri planlarda kullanılmayan plan kredileri bir sonraki döneme devreder. Satın aldığın ek kredi paketlerinin süresi dolmaz." },
      { s: "Üretim başarısız olursa krediyi kaybeder miyim?", c: "Hayır. Teknik bir hata ya da içerik denetimi nedeniyle tamamlanmayan üretimin kredisi otomatik ve anında iade edilir; bildirimlerde de yazar." },
      { s: "İstediğim zaman iptal edebilir miyim?", c: "Evet. Ayarlar › Abonelik › Aboneliği iptal et ile yenilemeyi durdurursun; dönem sonuna kadar planın açık kalır, kalan kredilerin silinmez.", baglanti: { ad: "Abonelik", href: "/panel/ayarlar/abonelik" } },
      { s: "İade alabilir miyim?", c: "İlk ödemenden itibaren 7 gün içinde ve plan kredilerinin %10'undan azını kullandıysan tam iade alırsın. Hiç kullanılmamış kredi paketleri 14 gün içinde iade edilir.", baglanti: { ad: "İade politikası", href: "/iade" } },
      { s: "Fiyatlara KDV dahil mi?", c: "Fiyatlar Türk lirasıdır ve KDV hariç gösterilir; KDV ödeme ekranında ve makbuzda ayrıca yazar." },
      { s: "Yıllık ödemenin avantajı nedir?", c: "Yıllık faturalamada aylık eşdeğer fiyat %20 daha düşüktür. Aylıktan yıllığa geçiş bir sonraki yenilemede uygulanır.", baglanti: { ad: "Planları karşılaştır", href: "/fiyatlandirma" } },
      { s: "Sınırsız erişim nedir?", c: "Belirli bir modelde 1, 7 ya da 30 gün boyunca kredi harcamadan üretmeni sağlayan ektir. Süre bitince model normal kredi bedeline döner.", baglanti: { ad: "Sınırsız erişim", href: "/panel/kredi?sekme=sinirsiz" } },
      { s: "Öncelikli ve Turbo hız ne işe yarar?", c: "Yoğun saatlerde işler sıraya girer. Öncelikli seviye sıranın önüne geçer, Turbo ayrılmış kapasitede beklemeden çalışır. İstersen ek eşzamanlı üretim de ekleyebilirsin.", baglanti: { ad: "Hız", href: "/panel/kredi?sekme=hiz" } },
    ],
  },
  {
    ad: "Faturalama ve kodlar", ozet: "Makbuzlar, fatura bilgileri, otomatik yükleme, hediye kodları.", ikon: "ReceiptText",
    maddeler: [
      { s: "Makbuzlarımı nereden indiririm?", c: "Ayarlar › Faturalar'da her ödemenin makbuzu durur; açıp yazdırabilir ya da PDF olarak kaydedebilirsin. Tüm hareketleri CSV olarak da indirebilirsin.", baglanti: { ad: "Faturalar", href: "/panel/ayarlar/faturalar" } },
      { s: "Faturada şirket bilgilerim görünsün istiyorum.", c: "Ayarlar › Faturalar › Fatura bilgileri'nde kurumsal seçip unvan, vergi kimlik numarası ve vergi dairesini gir. Sonraki makbuzlarda bu bilgiler kullanılır.", anahtar: "vkn vergi kurumsal fatura" },
      { s: "Otomatik kredi yükleme nasıl çalışır?", c: "Açıkken bakiyen 100 kredinin altına indiğinde seçtiğin paket otomatik yüklenir ve makbuzu Faturalar'a düşer. Böylece üretimin yarıda kalmaz.", baglanti: { ad: "Otomatik yükleme", href: "/panel/ayarlar/abonelik" } },
      { s: "Promosyon kodunu nereye girerim?", c: "Ayarlar › Kodlar ve hediyeler'de. Her kod hesap başına bir kez kullanılabilir; kredisi anında eklenir.", baglanti: { ad: "Kod kullan", href: "/panel/ayarlar/hediye" } },
      { s: "Arkadaşıma kredi hediye edebilir miyim?", c: "Evet. Kodlar ve hediyeler'den tutarı seçip tek kullanımlık bir hediye kodu oluşturursun; kredi senden düşer, kodu kullanan kişinin hesabına eklenir. Kendi hediye kodunu kullanamazsın.", baglanti: { ad: "Hediye oluştur", href: "/panel/ayarlar/hediye" } },
      { s: "Kredimin nereye gittiğini nasıl görürüm?", c: "Ayarlar › Kullanım günlük harcamayı, modellere ve türlere göre dağılımı gösterir; stüdyo ve API harcaması birlikte görünür.", baglanti: { ad: "Kullanım", href: "/panel/ayarlar/kullanim" } },
    ],
  },
  {
    ad: "Üretim ve içerik", ozet: "Sahiplik, denetim, yükleme ve indirme.", ikon: "Wand2",
    maddeler: [
      { s: "Ürettiğim içerikler kime ait?", c: "Girdilerin ve çıktıların sana aittir. Ücretli planlarda ticari olarak kullanabilirsin." },
      { s: "İçeriklerim model eğitiminde kullanılıyor mu?", c: "Hayır. İstemlerin, dosyaların ve çıktıların ne bizim ne de model sağlayıcılarımızın modellerini eğitmek için kullanılır." },
      { s: "İçerik denetimi var mı?", c: "Evet. Kabul Edilebilir Kullanım Politikası'na aykırı istem ve çıktılar otomatik olarak engellenir ve kredisi iade edilir; tekrarlayan ihlallerde hesap kısıtlanabilir.", baglanti: { ad: "Kullanım politikası", href: "/kullanim-politikasi" } },
      { s: "Kendi görselimi ya da sesimi yükleyebilir miyim?", c: "Evet; referans görsel, video ve ses yükleyebilirsin. Ses klonlama yalnız kendi sesin ya da izinli sesler için kullanılabilir." },
      { s: "Hangi modeli seçmeliyim?", c: "Model kataloğunda ihtiyacına göre öneriler ve 3 modele kadar karşılaştırma var. Sinematik video için Veo ve Kling, ürün görseli için Nano Banana Pro iyi başlangıçlardır.", baglanti: { ad: "Model kataloğu", href: "/modeller" } },
      { s: "Üretim neden uzun sürüyor?", c: "Video üretimi modele ve süreye göre birkaç dakika sürebilir; yoğun saatlerde sıra oluşur. Üretim sürerken başka işler yapabilirsin, bitince bildirim alırsın. Öncelikli hız beklemeyi kısaltır." },
    ],
  },
  {
    ad: "Presetler ve stüdyolar", ozet: "Viral presetler, karıştırma, araçlar.", ikon: "Clapperboard",
    maddeler: [
      { s: "Preset nedir?", c: "Hareket, kamera ve efekti hazır taşıyan bir şablondur. Fotoğrafını ekleyip preseti seçersin; istem yazmadan 8 saniyelik video üretilir.", baglanti: { ad: "Presetler", href: "/panel/presetler" } },
      { s: "Preset için nasıl bir fotoğraf kullanmalıyım?", c: "Tek kişilik, yüzü net, önden ve iyi ışıkta çekilmiş bir fotoğraf en iyi sonucu verir. Kalabalık, bulanık ya da yüzü örtülü fotoğraflarda kimlik tutarlılığı düşer." },
      { s: "İki preseti birleştirebilir miyim?", c: "Evet. Preset ayrıntısındaki 'Başka bir presetle karıştır' ile ikinci presetin atmosferini eklersin; ana hareket korunur. Bedel, ana presete ikincinin yarısı eklenerek hesaplanır." },
      { s: "Kendi presetimi oluşturabilir miyim?", c: "Evet. Presetler › Preset oluştur ile hareketi tarif edip kaydedersin; Presetlerim sekmesinde durur ve her fotoğrafa tek tıkla uygulanır.", baglanti: { ad: "Presetlerim", href: "/panel/presetler?sekme=benim" } },
      { s: "Bir preseti arkadaşımla nasıl paylaşırım?", c: "Preset ayrıntısındaki bağlantı simgesi paylaşılabilir adresi kopyalar; açan kişi doğrudan o preseti görür." },
    ],
  },
  {
    ad: "Kitaplık ve projeler", ozet: "Arama, filtreler, toplu indirme, çöp kutusu.", ikon: "FolderOpen",
    maddeler: [
      { s: "Üretimlerim nerede?", c: "Hepsi Kitaplık'ta. Tür, model, oran ve tarihe göre filtreleyebilir, projelere ayırabilirsin.", baglanti: { ad: "Kitaplık", href: "/panel/kitaplik" } },
      { s: "Toplu indirebilir miyim?", c: "Evet. Kitaplık'ta Ctrl ile ya da alanı sürükleyerek seç, ardından ZIP olarak indir." },
      { s: "Sildiğim üretimi geri alabilir miyim?", c: "Silinen üretimler 30 gün çöp kutusunda bekler; bu süre içinde geri alabilirsin. Süre dolunca kalıcı olarak silinir." },
      { s: "Projeler ne işe yarar?", c: "Bir kampanya ya da film için üretimleri tek yerde toplar. Projeler sinema, pazarlama ve stüdyolar arasında ortaktır.", baglanti: { ad: "Projeler", href: "/panel/projeler" } },
    ],
  },
  {
    ad: "Hesap ve güvenlik", ozet: "Şifre, iki adımlı doğrulama, oturumlar, profil.", ikon: "ShieldCheck",
    maddeler: [
      { s: "İki adımlı doğrulamayı nasıl açarım?", c: "Ayarlar › Güvenlik › İki adımlı doğrulama › Kur. QR kodu doğrulama uygulamanla (Google Authenticator, 1Password, Authy) tara, 6 haneli kodu gir ve yedek kodlarını kaydet.", baglanti: { ad: "Güvenlik", href: "/panel/ayarlar/guvenlik" }, anahtar: "2fa totp authenticator" },
      { s: "Telefonumu kaybettim, nasıl giriş yaparım?", c: "Girişte 'Yedek kod kullan'ı seçip kaydettiğin yedek kodlardan birini gir. Her kod bir kez çalışır; giriş yaptıktan sonra yeni kodlar oluşturmanı öneririz.", anahtar: "yedek kod kayıp telefon" },
      { s: "Şifremi nasıl değiştiririm?", c: "Ayarlar › Güvenlik › Şifreyi değiştir. İstersen diğer cihazlardaki oturumları da aynı anda kapatabilirsin.", baglanti: { ad: "Şifre", href: "/panel/ayarlar/guvenlik" } },
      { s: "Hangi cihazlarda oturum açık?", c: "Ayarlar › Güvenlik › Aktif oturumlar'da tarayıcı, işletim sistemi ve son etkinlik görünür. Tanımadığın oturumu kapat ve şifreni değiştir." },
      { s: "E-posta adresimi değiştirebilir miyim?", c: "Evet. Ayarlar › Hesap › E-posta adresi › Değiştir. Güvenliğin için mevcut şifren istenir.", baglanti: { ad: "Hesap", href: "/panel/ayarlar/hesap" } },
      { s: "Arayüz rengini değiştirebilir miyim?", c: "Evet. Ayarlar › Görünüm ve davranış'tan altı vurgu renginden birini seç; hareketi azaltma ve kısayollar da oradadır.", baglanti: { ad: "Görünüm", href: "/panel/ayarlar/gorunum" } },
    ],
  },
  {
    ad: "Vayra Earn", ozet: "Kreatör programı, ödemeler, doğrulama.", ikon: "Coins",
    maddeler: [
      { s: "Vayra Earn nedir?", c: "Vayra ile ürettiğin içerikleri paylaşarak kampanyalardan görüntülenme başına, görevlerden sabit ödülle ve yarışmalardan kazanç elde ettiğin kreatör programıdır.", baglanti: { ad: "Vayra Earn", href: "/earn" } },
      { s: "Kazancımı ne zaman çekebilirim?", c: "Gönderiler 72 saatte incelenir, 7 gün boyunca kazanır ve 3 günlük beklemenin ardından çekilebilir olur. En az 250 TL'yi IBAN ya da Papara hesabına çekebilirsin." },
      { s: "Neden kimlik doğrulaması istiyorsunuz?", c: "Kazanç ödemeleri vergi mevzuatına tabidir. Ödeme yapabilmemiz için kimliğini bir kez doğrulaman gerekir." },
      { s: "Sosyal medya hesabımı nasıl bağlarım?", c: "Earn › Hesaplar'da, profil açıklamana ekleyeceğin tek kullanımlık kodla hesabını doğrularsın." },
    ],
  },
  {
    ad: "Güvenlik ve gizlilik", ozet: "Veri güvenliği, KVKK, veri silme ve indirme.", ikon: "Lock",
    maddeler: [
      { s: "Verilerim güvende mi?", c: "Veriler aktarımda TLS 1.3, depolamada AES-256 ile şifrelenir; erişim en az yetki ilkesiyle sınırlıdır ve kayıt altındadır.", baglanti: { ad: "Güvenlik", href: "/guvenlik" } },
      { s: "KVKK ve GDPR'a uyumlu musunuz?", c: "Evet. Türkiye'deki kullanıcılar için veri sorumlusu Vayra Teknoloji A.Ş.'dir ve KVKK kapsamında aydınlatma metnimiz yayındadır; diğer ülkeler için GDPR ve yerel mevzuat uygulanır.", baglanti: { ad: "Veri koruma", href: "/veri-koruma" } },
      { s: "Verilerim nerede tutulur?", c: "Varsayılan olarak Avrupa Birliği'nde (Frankfurt ve Amsterdam). Kurumsal planlarda ABD ya da Asya-Pasifik bölgesini de seçebilirsin." },
      { s: "Verilerimi nasıl indiririm?", c: "Ayarlar › Veriler ve gizlilik › Verilerini indir. Profilin, üretim kayıtların, faturaların ve tercihlerin tek bir JSON dosyasında iner; şifre ve doğrulama sırları dahil edilmez.", baglanti: { ad: "Veriler", href: "/panel/ayarlar/veriler" } },
      { s: "Hesabımı nasıl silerim?", c: "Ayarlar › Hesap › Hesabı sil. Onay için e-posta adresini ve şifreni girersin; profilin, üretimlerin ve kalan kredin kalıcı olarak silinir.", baglanti: { ad: "Hesabı sil", href: "/panel/ayarlar/hesap" } },
      { s: "Çerez tercihlerimi nasıl değiştiririm?", c: "Ayarlar › Veriler ve gizlilik'ten işlevsel, analitik ve pazarlama çerezlerini ayrı ayrı açıp kapatabilirsin.", baglanti: { ad: "Çerez politikası", href: "/cerezler" } },
    ],
  },
  {
    ad: "API ve geliştirici", ozet: "REST API, anahtarlar, webhook, sınırlar.", ikon: "Code2",
    maddeler: [
      { s: "API sunuyor musunuz?", c: "Evet. REST API ile 23 modelin tamamına programatik erişim var; anahtar oluşturma, oyun alanı ve istek günlüğü panelde.", baglanti: { ad: "Vayra API", href: "/panel/api" } },
      { s: "Test anahtarı nedir?", c: "vy_test_ ile başlayan anahtarlar kredi harcamaz ve örnek çıktı döndürür; entegrasyonu geliştirirken kullanılır. Canlı üretim için vy_live_ anahtarı gerekir." },
      { s: "Hız sınırları neler?", c: "Her anahtarın dakikalık istek sınırı ve isteğe bağlı aylık harcama tavanı vardır. Sınır aşılınca yanıt, ne kadar beklemen gerektiğini Retry-After başlığında söyler.", baglanti: { ad: "Hız limitleri", href: "/panel/api/hiz-limitleri" } },
      { s: "Webhook desteği var mı?", c: "Evet. Üretim başladığında, bittiğinde, başarısız olduğunda ve kredi azaldığında imzalı olay gönderilir; ulaşılamazsa yeniden denenir.", baglanti: { ad: "Webhook'lar", href: "/panel/api/webhooklar" } },
      { s: "Aynı isteği iki kez gönderirsem iki kez ücretlendirilir miyim?", c: "Idempotency-Key başlığını kullanırsan hayır: aynı anahtar ve gövdeyle gelen istek ilk üretimi döndürür.", anahtar: "idempotency çift ücret" },
    ],
  },
  {
    ad: "MCP ve entegrasyonlar", ozet: "Claude, Cursor, VS Code ve CLI.", ikon: "Plug",
    maddeler: [
      { s: "Vayra'yı Claude'a nasıl bağlarım?", c: "MCP & CLI sayfasında bir API anahtarı ve istemcini seç, yapılandırmayı kopyala. Claude Code için tek komut yeterli; Cursor ve VS Code için tek tıkla kurulum var.", baglanti: { ad: "MCP & CLI", href: "/panel/mcp" }, anahtar: "claude cursor vscode mcp" },
      { s: "Ajanın yaptığı üretimler ücretli mi?", c: "Evet; panelde olduğu gibi kredi harcar ve aynı sınırlar uygulanır. Bedel araç sonucunda yazar." },
      { s: "MCP desteklemeyen ortamlarda ne kullanırım?", c: "Bağımlılıksız Vayra CLI'yi: üretir, bitmesini bekler ve çıktıyı klasöre indirir. Betikler ve CI için uygundur.", baglanti: { ad: "CLI", href: "/panel/mcp#cli" } },
      { s: "Photoshop ya da Premiere eklentisi var mı?", c: "Şu an yok. Kendi araçlarından Vayra'ya ulaşmanın yolu MCP sunucusu ve CLI: Claude, Cursor ve VS Code'dan sohbetten çıkmadan üretebilirsin.", baglanti: { ad: "MCP & CLI", href: "/panel/mcp" } },
    ],
  },
];

/* Fiyatlandırma ile ilgili alt küme. */
export const FIYAT_SSS: SSSMadde[] = [
  ...SSS_KATEGORILER[1].maddeler,
  { s: "Plan değişikliği yapabilir miyim?", c: "İstediğin an yükseltebilir veya düşürebilirsin; fark orantılı olarak hesaplanır." },
];

/** Soru için kalıcı bağlantı kimliği. */
export const soruKimligi = (s: string) => s.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
