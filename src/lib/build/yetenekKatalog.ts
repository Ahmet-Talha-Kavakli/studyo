/**
 * Vayra yetenekleri (skills): SKILL.md biçiminde hazır talimat paketleri. Ad ve açıklama her zaman modelin
 * bağlamındadır; gövde ve dosyalar yalnız görev açıklamaya uyduğunda yüklenir (üç kademeli yükleme).
 * İstemci ve sunucu ortak; sunucuya özgü hiçbir şey içermez.
 */
import { YETENEKLER_TICARET } from "./yetenekKatalogTicaret";
import { YETENEKLER_GELISTIRME } from "./yetenekKatalogGelistirme";
import { YETENEKLER_PAZARLAMA } from "./yetenekKatalogPazarlama";

export type YetenekKategori = "eticaret" | "web" | "mobil" | "marka" | "icerik" | "veri" | "gelistirme" | "pazarlama" | "musteri" | "finans" | "operasyon";
export const YETENEK_KATEGORI: Record<YetenekKategori, string> = {
  eticaret: "E-ticaret ve ödeme", web: "Web ve SEO", mobil: "Mobil yayın", marka: "Marka ve tasarım", icerik: "İçerik", veri: "Veri ve form",
  gelistirme: "Yazılım geliştirme", pazarlama: "Pazarlama", musteri: "Müşteri hizmetleri", finans: "Finans ve muhasebe", operasyon: "İş ve operasyon",
};

export type KatalogYetenek = {
  id: string; ad: string; baslik: string; aciklama: string; kategori: YetenekKategori; simge: string;
  govde: string; dosyalar: { yol: string; icerik: string }[]; ornekler: string[];
};

const TEMEL: KatalogYetenek[] = [
  {
    id: "turk-eticaret-yasal", ad: "turk-eticaret-yasal", baslik: "Türk e-ticaret yasal sayfaları", kategori: "eticaret", simge: "/gercek/panel/gal-gpt-6.webp",
    aciklama: "Türkiye'de satış yapan bir site ya da uygulama için mesafeli satış sözleşmesi, ön bilgilendirme formu, iade ve cayma politikası, KVKK aydınlatma metni ve çerez bandı hazırlarken kullan.",
    ornekler: ["Mağazama mesafeli satış sözleşmesi ekle", "Siteme KVKK aydınlatma metni yaz", "İade politikası sayfası lazım"],
    govde: `# Türk e-ticaret yasal sayfaları

Bu yetenek, Türkiye'de tüketiciye satış yapan siteler için zorunlu bilgilendirme sayfalarını hazırlar. Metinler şablondur; kullanıcıya her zaman "yayından önce bir hukukçuya kontrol ettirin" notunu düş.

## Önce topla
Şu bilgiler yoksa kullanıcıya sor (en çok iki soruda):
- Satıcının unvanı, adresi, telefonu, e-postası, MERSİS ya da vergi numarası
- Satılan ürün ya da hizmet türü (fiziksel ürün, dijital içerik, hizmet)
- Teslim süresi, kargo ücreti politikası, iade adresi
- Ödeme yöntemleri (kart, havale, kapıda ödeme)

## Sayfalar
1. **Ön bilgilendirme formu**: satıcı bilgileri, ürünün temel nitelikleri, vergiler dahil toplam fiyat, ödeme ve teslim bilgisi, cayma hakkı ve kullanılamayacağı durumlar, şikâyet yolları (Tüketici Hakem Heyeti ve Tüketici Mahkemesi).
2. **Mesafeli satış sözleşmesi**: taraflar, konu, ürün bilgileri tablosu, teslimat, cayma hakkı (14 gün), cayma hakkının kullanılamayacağı ürünler, uyuşmazlık çözümü, yürürlük.
3. **İade ve cayma politikası**: 14 günlük cayma süresi, iade adımları, iade kargo ücreti, para iadesi süresi (en geç 14 gün), hasarlı ürün süreci.
4. **KVKK aydınlatma metni**: veri sorumlusu, işlenen veri kategorileri, işleme amaçları, hukuki sebepler, aktarım (kargo, ödeme kuruluşu, muhasebe), saklama süresi, ilgili kişi hakları (KVKK 11. madde) ve başvuru yolu.
5. **Çerez politikası ve bant**: zorunlu, işlevsel, analitik ve pazarlama ayrımı; "Reddet" ve "Kabul et" eşit ağırlıkta; tercihleri yönetme bağlantısı.

## Sitede uygulama
- Her sayfayı ayrı bir HTML sayfası yap ve altbilgiye bağlantı ver.
- Ödeme adımında "Ön bilgilendirme formunu ve mesafeli satış sözleşmesini okudum, onaylıyorum" onay kutusu zorunlu olsun; işaretlenmeden ödeme düğmesi çalışmasın.
- Çerez bandını ilk ziyarette göster, kararı localStorage'da sakla.

## Yapma
- Kullanıcının vermediği şirket bilgisini uydurma; yer tutucu bırak ve vurgula.
- Cayma hakkını kısaltan ya da tüketici aleyhine madde yazma.`,
    dosyalar: [{ yol: "references/cayma-istisnalari.md", icerik: "# Cayma hakkının kullanılamayacağı başlıca durumlar\n\n- Tüketicinin istekleri ya da kişisel ihtiyaçları doğrultusunda hazırlanan ürünler\n- Çabuk bozulabilen ya da son kullanma tarihi geçebilecek ürünler\n- Teslimden sonra ambalajı açılmış, sağlık ve hijyen açısından iadesi uygun olmayan ürünler\n- Elektronik ortamda anında ifa edilen hizmetler ve tüketiciye anında teslim edilen gayri maddi mallar\n- Cayma süresi dolmadan tüketicinin onayıyla ifasına başlanan hizmetler\n\nKesin liste için güncel Mesafeli Sözleşmeler Yönetmeliği'ne bakılmalıdır." }],
  },
  {
    id: "paytr-odeme", ad: "paytr-odeme", baslik: "PayTR iFrame ödeme", kategori: "eticaret", simge: "/gercek/galeri/3d5.webp",
    aciklama: "Bir siteye ya da uygulamaya PayTR iFrame API ile kartla ödeme eklerken kullan: token isteği, hash hesabı, bildirim adresi, test modu ve taksit ayarları.",
    ornekler: ["Siteme PayTR ile ödeme ekle", "PayTR bildirim adresi neden çalışmıyor?"],
    govde: `# PayTR iFrame ödeme

## Mimari
Ödeme iki parçalıdır ve gizli anahtarlar yalnız sunucuda durur:
1. **Sunucu** sipariş için PayTR'den token alır (merchant_key ve merchant_salt asla tarayıcıya gitmez).
2. **Tarayıcı** token ile PayTR iFrame'ini gösterir.
3. **Bildirim adresi (callback)** PayTR'nin sunucudan sunucuya gönderdiği sonucu doğrular, siparişi günceller ve düz metin \`OK\` döner.

## Token isteği (sunucu)
- Gerekli alanlar: merchant_id, user_ip, merchant_oid (benzersiz sipariş no, yalnız harf ve rakam), email, payment_amount (kuruş cinsinden tam sayı: 100.50 TL için 10050), user_basket (base64 JSON: [[ad, birim fiyat, adet], ...]), no_installment, max_installment, currency, test_mode, merchant_ok_url, merchant_fail_url, user_name, user_address, user_phone.
- hash_str = merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_installment + max_installment + currency + test_mode
- paytr_token = base64( HMAC-SHA256( hash_str + merchant_salt, anahtar: merchant_key ) )
- İstek: POST https://www.paytr.com/odeme/api/get-token (form-urlencoded). Yanıt status "success" ise token döner.

## Bildirim adresi
- Gelen hash'i doğrula: base64(HMAC-SHA256(merchant_oid + merchant_salt + status + total_amount, merchant_key)). Eşleşmezse işlemi reddet.
- status "success" ise siparişi ödendi yap; "failed" ise başarısız işaretle.
- Aynı bildirim birden çok kez gelebilir: işlemi idempotent yap (sipariş zaten ödendiyse tekrar işleme).
- Her durumda yanıt gövdesi yalnız \`OK\` olmalı; aksi hâlde PayTR bildirimi tekrar gönderir.

## Test
- test_mode=1 ile mağaza panelindeki test kartlarını kullan.
- merchant_ok_url yalnız kullanıcıyı yönlendirir; ödeme sonucuna asla bu sayfadan karar verme, yalnız bildirime güven.

## Vayra Build'de
Statik sitede gizli anahtar tutulamaz. Kullanıcıya şunu söyle: ödeme için sunucu tarafı gerekir (Vayra Bulut fonksiyonu ya da kendi sunucusu). Anahtarları ortam değişkeni olarak sunucuda sakla.`,
    dosyalar: [],
  },
  {
    id: "iyzico-odeme", ad: "iyzico-odeme", baslik: "iyzico ödeme formu", kategori: "eticaret", simge: "/gercek/galeri/3d2.webp",
    aciklama: "iyzico Checkout Form ile ödeme kurarken, ödeme sonucunu doğrularken, iade ve test kartlarıyla çalışırken kullan.",
    ornekler: ["iyzico ile ödeme sayfası kur", "iyzico callback sonrası ödeme nasıl doğrulanır?"],
    govde: `# iyzico Checkout Form

## Akış
1. **Başlat (sunucu)**: sepet, alıcı (ad, soyad, e-posta, kimlik no, adres, IP) ve tutar bilgisiyle Checkout Form başlatma isteği gönderilir; yanıtta form içeriği (checkoutFormContent) ve token döner. Resmî sunucu kütüphanesini (iyzipay) kullan.
2. **Göster (tarayıcı)**: dönen içerik sayfaya eklenir; iyzico kendi formunu açar.
3. **Sonuç (sunucu)**: iyzico kullanıcıyı callbackUrl adresine token ile POST eder. Sunucu bu token ile ödeme sonucunu iyzico'dan **sorgular** (retrieve); paymentStatus SUCCESS ise sipariş ödendi olur.

## Kurallar
- API anahtarı ve gizli anahtar yalnız sunucuda, ortam değişkeninde.
- Tutarlar: sepet kalemlerinin toplamı price alanına, indirimli son tutar paidPrice alanına eşit olmalı; uyuşmazlık hata verir.
- callbackUrl'e gelen istekteki bilgilere güvenme; sonucu her zaman sorgula.
- Sandbox ortamında sandbox anahtarları ve iyzico'nun test kartları kullanılır; canlıya geçince taban adres ve anahtarlar değişir.
- Siparişi idempotent işle: aynı token iki kez gelirse ikinci kez ödendi yapma.

## İade
İade, ödeme kalemi (paymentTransactionId) üzerinden yapılır; kısmi iade mümkündür. İade sonucunu siparişe yaz ve müşteriye bildir.

## Vayra Build'de
Ödeme sunucu tarafı ister: Vayra Bulut fonksiyonu ya da kullanıcının sunucusu. Statik sayfaya gizli anahtar koyma.`,
    dosyalar: [],
  },
  {
    id: "turkce-seo", ad: "turkce-seo", baslik: "Türkçe SEO", kategori: "web", simge: "/gercek/kesfet/blog-api.webp",
    aciklama: "Türkçe bir sitenin arama görünürlüğünü iyileştirirken kullan: başlık ve açıklama, Türkçe karakterli adresler, schema.org, site haritası, iç bağlantılar.",
    ornekler: ["Sitemin SEO'sunu düzelt", "Ürün sayfalarına schema ekle", "Başlık ve açıklamaları yaz"],
    govde: `# Türkçe SEO

## Sayfa başına
- **title**: 50 ile 60 karakter; ana anahtar kelime başta, marka sonda ("Kadıköy Kahve Dükkânı | Lumen Kahve").
- **meta description**: 140 ile 160 karakter; fayda + eylem çağrısı. Her sayfada benzersiz.
- **h1**: sayfada tek; title ile aynı konu, birebir aynı olmak zorunda değil.
- **Görseller**: anlamlı alt metni (Türkçe), genişlik ve yükseklik öznitelikleri, modern biçim (webp ya da avif), lazy loading (ilk ekrandaki hariç).

## Adresler
- Küçük harf, kelimeler tireyle: \`/menu/soguk-kahveler\`.
- Türkçe karakterleri çevir: ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u; İ→i.
- Gereksiz kelime (ve, ile, için) çıkarılabilir; adres kısa ve okunur kalsın.

## Yapılandırılmış veri (JSON-LD)
- Yerel işletme: LocalBusiness (ad, adres, telefon, açılış saatleri, geo, priceRange).
- Ürün: Product + Offer (fiyat, para birimi TRY, stok durumu).
- Sık sorulan sorular: FAQPage. Makale: Article.
- Veriler sayfada görünen bilgiyle tutarlı olmalı.

## Site düzeyi
- sitemap.xml ve robots.txt (Vayra yayınında otomatik üretilir; elle yazma).
- Kanonik adres: her sayfada \`<link rel="canonical">\`.
- Çok dilli sitede hreflang (tr ve en karşılıklı).
- İç bağlantılar: önemli sayfalara açıklayıcı bağlantı metniyle bağlantı ver ("tıklayın" değil).

## Denetim çıktısı
Değişiklikleri sayfa sayfa bir tablo olarak özetle: sayfa, önceki başlık, yeni başlık, açıklama, eklenen schema.`,
    dosyalar: [],
  },
  {
    id: "erisilebilirlik", ad: "erisilebilirlik-denetimi", baslik: "Erişilebilirlik denetimi", kategori: "web", simge: "/gercek/galeri/3d9.webp",
    aciklama: "Bir site ya da uygulamayı WCAG 2.2 AA düzeyine göre denetlerken ve düzeltirken kullan: kontrast, klavye, ekran okuyucu, formlar, hareket.",
    ornekler: ["Sitemi erişilebilirlik açısından denetle", "Kontrast sorunlarını düzelt"],
    govde: `# Erişilebilirlik denetimi (WCAG 2.2 AA)

## Denetim sırası
1. **Kontrast**: normal metin en az 4.5:1, büyük metin (24 px ya da 18.66 px kalın) en az 3:1, arayüz öğeleri ve odak halkası en az 3:1.
2. **Klavye**: her etkileşimli öğeye Tab ile ulaşılır; sıra mantıklı; odak görünür (outline kaldırılmamış); tuzak yok; menüler Esc ile kapanır.
3. **Anlam**: tek h1, başlık seviyeleri atlanmaz; düğme için \`<button>\`, bağlantı için \`<a href>\`; landmark'lar (header, nav, main, footer).
4. **Görseller**: bilgi taşıyan görselde anlamlı alt; süs görselinde alt="".
5. **Formlar**: her girdinin görünür label'ı; hata mesajı alana bağlı (aria-describedby) ve rengin yanında metinle; zorunlu alanlar belirtilmiş.
6. **Dokunma hedefi**: en az 24×24 CSS pikseli (2.2 kriteri); mobilde 44 önerilir.
7. **Hareket**: prefers-reduced-motion'a saygı; otomatik oynayan içerik durdurulabilir.
8. **Dil**: \`<html lang="tr">\`; başka dildeki bölümde lang özniteliği.

## Çıktı
Bulguları önem sırasıyla tablo yap: kriter, sorun, nerede, düzeltme. Sonra düzeltmeleri uygula ve neyi değiştirdiğini kısaca yaz.`,
    dosyalar: [],
  },
  {
    id: "app-store-yayin", ad: "app-store-yayin", baslik: "App Store yayın listesi", kategori: "mobil", simge: "/gercek/build/sablon/evcil-dostum.webp",
    aciklama: "Bir mobil uygulamayı App Store'a göndermeye hazırlarken kullan: ekran görüntüleri, gizlilik etiketleri, izin metinleri, inceleme notu, TestFlight.",
    ornekler: ["Uygulamamı App Store'a hazırla", "App Store inceleme notu yaz"],
    govde: `# App Store yayın kontrol listesi

## Mağaza sayfası
- Uygulama adı (en çok 30 karakter), alt başlık (30), anahtar kelimeler (100, virgülle), tanıtım metni (170), açıklama (4000).
- Ekran görüntüleri: iPhone için 6.9 inç ekran boyutu (1320×2868 ya da 1290×2796 dikey) istenir; iPad destekleniyorsa 13 inç (2064×2752). En az 1, en çok 10 görsel; ilk üçü en önemli.
- Uygulama önizleme videosu isteğe bağlı (15 ile 30 saniye).
- Destek adresi ve gizlilik politikası adresi zorunlu.

## Gizlilik
- App Privacy (gizlilik etiketleri): toplanan her veri türü, kullanım amacı, kullanıcıyla ilişkilendirilip ilişkilendirilmediği, izleme amaçlı olup olmadığı.
- İzleme yapılıyorsa App Tracking Transparency izni.
- Hesap oluşturan uygulamada uygulama içinden hesap silme zorunlu.

## İzin metinleri (Info.plist)
Kamera, fotoğraflar, konum, mikrofon, bildirim gibi her izin için kullanıcıya NEDEN gerektiğini anlatan Türkçe metin. Genel metin ("Uygulama için gerekli") reddedilir.

## İnceleme
- Giriş gerektiren uygulamada inceleme ekibine demo hesap bilgisi.
- İnceleme notu: uygulamanın ne yaptığı, gizli özellik varsa nasıl açıldığı.
- Web sitesini sarmalayan, yerel değeri olmayan uygulamalar reddedilebilir (4.2 Minimum Functionality): uygulamaya yerel özellikler (bildirim, çevrimdışı, paylaşım, cihaz özellikleri) ekle.

## Yayın
TestFlight ile iç test → harici test (beta incelemesi) → incelemeye gönder → aşamalı yayın (7 gün).`,
    dosyalar: [],
  },
  {
    id: "google-play-yayin", ad: "google-play-yayin", baslik: "Google Play yayını", kategori: "mobil", simge: "/gercek/build/sablon/su-takip.webp",
    aciklama: "Bir Android uygulamasını Google Play'e yüklerken kullan: AAB ve imzalama, Data safety formu, içerik derecelendirmesi, test kanalları, aşamalı yayın.",
    ornekler: ["Uygulamamı Google Play'e yükle", "Data safety formunu doldur"],
    govde: `# Google Play yayını

## Paket
- Yükleme biçimi Android App Bundle (.aab). Play App Signing açık; yükleme anahtarını güvenli sakla.
- Hedef API düzeyi Google'ın güncel zorunluluğunu karşılamalı (her yıl yükselir); Play Console uyarılarını kontrol et.
- versionCode her yüklemede artar.

## Mağaza girişi
- Uygulama adı (30), kısa açıklama (80), tam açıklama (4000).
- Uygulama simgesi 512×512 PNG, öne çıkan görsel 1024×500, telefon ekran görüntüleri en az 2 (önerilen 1080×1920 ya da üstü, 9:16).

## Politika formları
- **Data safety**: toplanan ve paylaşılan veriler, şifreleme, silme talebi yolu.
- **İçerik derecelendirmesi** anketi, **hedef kitle ve içerik**, reklam içeriyor mu, haber uygulaması mı, devlet uygulaması mı.
- Hesap oluşturuluyorsa uygulama içinden ve web'den hesap silme bağlantısı.

## Test ve yayın
- Yeni kişisel geliştirici hesaplarında üretime çıkmadan önce kapalı testte belirli sayıda test kullanıcısı ve süre şartı olabilir; Play Console'daki güncel şartı kontrol et.
- İç test → kapalı test → açık test → üretim; üretimde aşamalı yayın (%5, %20, %50, %100) ve çökme oranını izle.`,
    dosyalar: [],
  },
  {
    id: "marka-kilavuzu", ad: "marka-kilavuzu", baslik: "Marka kılavuzunu uygula", kategori: "marka", simge: "/gercek/galeri/3d3.webp",
    aciklama: "Bir markanın logo, renk, yazı tipi ve ses tonu kurallarını tasarıma ve içeriğe uygularken, tasarım belirteçlerine (token) çevirirken ya da tutarlılık denetlerken kullan.",
    ornekler: ["Sitemi marka kılavuzuma göre düzenle", "Marka renklerimden tasarım belirteçleri çıkar"],
    govde: `# Marka kılavuzunu uygula

## 1. Kılavuzu belirteçlere çevir
- Renkler: birincil, ikincil, vurgu, nötr ölçek (50'den 950'ye), başarı ve hata renkleri; her biri HEX ve CSS değişkeni (--renk-birincil).
- Yazı: başlık ve gövde yazı tipi, ölçek (12, 14, 16, 20, 24, 32, 48), satır yüksekliği, harf aralığı.
- Biçim: köşe yarıçapı, boşluk ölçeği (4'ün katları), gölge ya da çerçeve dili.
- Logo: güvenli alan, en küçük boyut, açık ve koyu zemin sürümleri, yasak kullanımlar.

## 2. Uygula
- Tüm sabit renkleri ve yazı tiplerini belirteçlere bağla; tek kaynaktan değişsin.
- Erişilebilirlik: metin ve zemin çiftlerinin kontrastı en az 4.5:1; marka rengi bunu sağlamıyorsa koyulaştırılmış bir metin sürümü üret.

## 3. Ses tonu
Kılavuzdaki 3 sıfatı (ör. sıcak, net, esprili) her metinde uygula; yasak kelimeler listesi varsa denetle.

## 4. Görsel üretiminde
Görsel üretirken isteme marka renklerini, ışık ve doku tarifini ekle; logoyu üretilen görsele yapay zekâyla çizdirme, sonradan yerleştir.

## Çıktı
Değişiklik özeti: hangi belirteç eklendi, hangi sayfada neler değişti, kontrast nedeniyle yapılan ayarlar.`,
    dosyalar: [],
  },
  {
    id: "tckn-adres-formu", ad: "tckn-adres-formu", baslik: "TCKN ve adres formu", kategori: "veri", simge: "/gercek/galeri/3d1.webp",
    aciklama: "Türkiye'ye özgü kimlik, telefon ve adres alanları olan formlar yaparken kullan: TCKN algoritma kontrolü, il ve ilçe seçici, telefon biçimi, KVKK onayı.",
    ornekler: ["Kayıt formuna TC kimlik no doğrulaması ekle", "İl ilçe seçicili adres formu yap"],
    govde: `# TCKN ve adres formu

## TC kimlik numarası (yalnız biçim kontrolü)
- 11 hane, yalnız rakam, ilk hane 0 olamaz.
- 10. hane = ((1.+3.+5.+7.+9. hanelerin toplamı) × 7 − (2.+4.+6.+8. hanelerin toplamı)) mod 10
- 11. hane = (ilk 10 hanenin toplamı) mod 10
- Bu yalnız biçimi doğrular; kişinin gerçekliğini doğrulamaz (o, resmî kimlik doğrulama hizmeti ister).
- TCKN hassas kişisel veridir: gerçekten gerekmedikçe isteme; istiyorsan amacını yaz, maskele (12*******90) ve şifreli sakla.

## Telefon
- Biçim: +90 5XX XXX XX XX; giriş sırasında otomatik boşluk; başta 0 yazılırsa kaldır.
- Doğrulama: 10 hane, 5 ile başlar (cep).

## Adres
- İl seçilince ilçe listesi dolsun (81 il); mahalle ve açık adres serbest metin; posta kodu 5 hane.
- Fatura ve teslimat adresi ayrı olabilir: "Faturamı aynı adrese kes" onay kutusu.
- Bireysel ya da kurumsal fatura seçimi: kurumsalda vergi dairesi ve vergi numarası (10 hane).

## Onaylar
- KVKK aydınlatma metni bağlantısı ve açık rıza (gerekiyorsa) ayrı onay kutusu; önceden işaretli olmasın.
- Ticari ileti izni ayrı ve isteğe bağlı.

## Hata mesajları
Alanın altında, Türkçe ve neyin yanlış olduğunu söyleyen: "TC kimlik numarası 11 haneli olmalı".`,
    dosyalar: [{ yol: "scripts/tckn.js", icerik: "export function tcknGecerli(t) {\n  if (!/^[1-9][0-9]{10}$/.test(t)) return false;\n  const d = [...t].map(Number);\n  const tek = d[0] + d[2] + d[4] + d[6] + d[8];\n  const cift = d[1] + d[3] + d[5] + d[7];\n  if (((tek * 7 - cift) % 10 + 10) % 10 !== d[9]) return false;\n  return d.slice(0, 10).reduce((a, b) => a + b, 0) % 10 === d[10];\n}\n" }],
  },
  {
    id: "cok-dilli-site", ad: "cok-dilli-site", baslik: "Çok dilli site (TR ve EN)", kategori: "web", simge: "/gercek/galeri/3d12.webp",
    aciklama: "Bir siteye ikinci dil eklerken ya da çok dilli yapı kurarken kullan: çeviri anahtarları, dil seçici, hreflang, tarih ve para biçimleri.",
    ornekler: ["Siteme İngilizce ekle", "Dil seçici yap"],
    govde: `# Çok dilli site

## Yapı
- Adresler: \`/\` Türkçe, \`/en/\` İngilizce (ya da her dil kendi klasöründe). Dil, adresten belli olsun; yalnız tarayıcı diline göre otomatik yönlendirme yapma, öneri bandı göster.
- Metinler bir sözlükte: \`ceviriler.json\` { "tr": {...}, "en": {...} }; anahtarlar anlamlı ("menu.baslik").
- Her dilde \`<html lang>\` doğru.

## SEO
- Her sayfada karşılıklı hreflang: \`<link rel="alternate" hreflang="tr" href=...>\`, en, ve x-default.
- Başlık ve açıklama her dilde ayrı yazılır; makine çevirisini kontrol et.

## Biçimler
- Tarih: tr "5 Kasım 2026", en "November 5, 2026" (Intl.DateTimeFormat).
- Para: tr "1.250,00 ₺", en "₺1,250.00" (Intl.NumberFormat, currency TRY).

## Dil seçici
Üst menüde kısa kodlar (TR · EN); seçili olan belirgin; seçim sayfanın karşılığına götürür, ana sayfaya atmaz.

## Çeviri kalitesi
Birebir çeviri değil yerelleştirme: deyimleri, birimleri ve örnekleri hedef dile uyarla. Marka adlarını çevirme.`,
    dosyalar: [],
  },
  {
    id: "icerik-takvimi", ad: "icerik-takvimi", baslik: "Sosyal medya içerik takvimi", kategori: "icerik", simge: "/gercek/kesfet/blog-shorts.webp",
    aciklama: "Bir marka için haftalık ya da aylık sosyal medya planı hazırlarken kullan: platform başına format, kanca, metin, etiket, görsel ve video üretimi.",
    ornekler: ["Bu hafta için Instagram planı çıkar", "Aylık içerik takvimi hazırla"],
    govde: `# Sosyal medya içerik takvimi

## Girdi
Marka, hedef kitle, ürünler, ton, yayın sıklığı ve platformlar. Eksikse en çok iki soru sor.

## Plan tablosu
| Gün | Platform | Format | Kanca (ilk cümle) | Gövde | Çağrı | Etiketler | Görsel/video tarifi |
- Kanca ilk 2 saniyede/ilk satırda merak uyandırsın.
- Karışım: %40 değer (bilgi, ipucu), %30 topluluk (soru, kullanıcı içeriği), %20 ürün, %10 marka hikâyesi.

## Formatlar
- Instagram gönderi 4:5 (1080×1350), Reels ve Story 9:16 (1080×1920).
- TikTok 9:16; ilk karede metin; 15 ile 30 saniye.
- LinkedIn: metin ağırlıklı, ilk 2 satır kanca, en çok 3 etiket.
- X: kısa, tek fikir; görsel 16:9.

## Üretim
Plan onaylanınca görselleri gorsel_uret ile platform oranında üret; video istenirse video_uret ile 9:16 kısa klip. Her görselin istemine marka renklerini ve tonunu ekle.

## Takip
Her içeriğe ölçülecek hedef yaz (kaydetme, paylaşım, tıklama) ve haftalık özette karşılaştır.`,
    dosyalar: [],
  },
  {
    id: "performans-butcesi", ad: "performans-butcesi", baslik: "Performans bütçesi", kategori: "web", simge: "/gercek/galeri/3d6.webp",
    aciklama: "Bir sitenin hızını iyileştirirken kullan: Core Web Vitals hedefleri, görsel ve yazı tipi optimizasyonu, gereksiz betiklerin ayıklanması.",
    ornekler: ["Sitem yavaş, hızlandır", "LCP'yi düşür"],
    govde: `# Performans bütçesi

## Hedefler (mobil, 75. yüzdelik)
- LCP en çok 2.5 sn, INP en çok 200 ms, CLS en çok 0.1.
- İlk yükte toplam JS en çok 170 KB (sıkıştırılmış), görseller toplamı en çok 1 MB.

## Görseller
- En büyük görsel (genelde hero) için \`fetchpriority="high"\`, lazy değil; diğerleri \`loading="lazy"\`.
- webp ya da avif; \`srcset\` ve \`sizes\` ile cihaza göre boyut; width ve height zorunlu (CLS).

## Yazı tipleri
- En çok 2 aile, gereken ağırlıklar; \`font-display: swap\`; kritik yazı tipini preload et; mümkünse kendi sunucunda barındır.

## Betikler
- Üçüncü taraf betikleri say ve gerekmeyeni kaldır; kalanları \`defer\`.
- Uzun görevleri böl; ana iş parçacığını 50 ms'den uzun kilitleyen işleri ertele.

## Çıktı
Önce ve sonra tablosu: ölçüt, önce, sonra, yapılan değişiklik.`,
    dosyalar: [],
  },
];

/** Bütün Vayra yetenekleri: temel 12 + alan alan genişletilmiş paketler. */
export const YETENEK_KATALOGU: KatalogYetenek[] = [...TEMEL, ...YETENEKLER_TICARET, ...YETENEKLER_GELISTIRME, ...YETENEKLER_PAZARLAMA];
