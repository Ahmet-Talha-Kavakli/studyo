import Link from "next/link";
import type { YasalBolum } from "@/components/sirket/YasalBelge";
import { ILETISIM, SIRKET, TR_SIRKET } from "@/lib/kurumsal/site";

export const GIZLILIK_META = { yururluk: "1 Ekim 2026", surum: "3.0" };

export const GIZLILIK_GECMIS = [
  { tarih: "1 Ekim 2026", not: "Vayra Earn (kreatör programı) kapsamında işlenen kimlik, ödeme ve sosyal hesap verileri eklendi; saklama süreleri tablosu genişletildi." },
  { tarih: "1 Temmuz 2026", not: "Türkiye'deki kullanıcılar için veri sorumlusu Vayra Teknoloji A.Ş. olarak belirlendi; KVKK aydınlatma metni ayrı belgeye taşındı." },
  { tarih: "15 Ocak 2026", not: "Yapay zekâ ve model eğitimi bölümü eklendi." },
];

export const GIZLILIK: YasalBolum[] = [
  {
    id: "kapsam", baslik: "Kapsam ve veri sorumlusu",
    kisaca: "Bu politika Vayra'yı kullanan herkes için geçerli. Türkiye'deysen verilerinden Vayra Teknoloji A.Ş., diğer ülkelerdeysen Vayra Technologies B.V. sorumlu.",
    bloklar: [
      { t: "p", m: <>Bu Gizlilik Politikası; vayra.ai web sitesi, Vayra uygulaması, API&apos;si, Vayra Earn kreatör programı ve bunlara bağlı tüm hizmetleri (birlikte &ldquo;Hizmet&rdquo;) kullandığında kişisel verilerinin nasıl işlendiğini açıklar.</> },
      { t: "tablo", basliklar: ["Bulunduğun yer", "Veri sorumlusu", "Uygulanan mevzuat"], satirlar: [
        ["Türkiye", <><b>{TR_SIRKET.yasalAd}</b><br />{TR_SIRKET.adres}<br />MERSİS {TR_SIRKET.mersis}</>, "6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK)"],
        ["Avrupa Ekonomik Alanı, Birleşik Krallık ve diğer ülkeler", <><b>{SIRKET.yasalAd}</b><br />{ILETISIM.adres}<br />{SIRKET.ticaretSicil}</>, "AB Genel Veri Koruma Tüzüğü (GDPR), UK GDPR ve yerel mevzuat"],
      ] },
      { t: "p", m: <>Türkiye&apos;deki kullanıcılar için KVKK&apos;nın 10. maddesi kapsamındaki aydınlatma bilgileri ayrıca <Link href="/veri-koruma">KVKK Aydınlatma Metni</Link>&apos;nde yer alır. Veri koruma görevlimize <a href={`mailto:${ILETISIM.gizlilik}`}>{ILETISIM.gizlilik}</a> adresinden ulaşabilirsin.</> },
    ],
  },
  {
    id: "toplanan", baslik: "Topladığımız veriler",
    kisaca: "Hesap bilgilerin, yazdığın istemler ve ürettiğin içerikler, ödeme kayıtların ve teknik kullanım verileri. Kart numaranı biz saklamayız.",
    bloklar: [
      { t: "tablo", basliklar: ["Kategori", "Örnekler", "Kaynak"], satirlar: [
        ["Hesap ve kimlik", "Ad, e-posta, şifre özeti (hash), profil fotoğrafı, dil ve bölge tercihi", "Senden"],
        ["İçerik", "İstemler, yüklediğin görsel/ses/video dosyaları, referans görseller, ürettiğin çıktılar, proje ve kanvas içerikleri", "Senden ve Hizmetten"],
        ["Ödeme ve fatura", "Plan, kredi hareketleri, fatura adresi, vergi bilgisi, ödeme kuruluşunun verdiği işlem kimliği ve kartın son 4 hanesi", "Senden ve ödeme kuruluşundan"],
        ["Kullanım ve cihaz", "IP adresi, tarayıcı ve cihaz bilgisi, oturum kayıtları, hata kayıtları, hangi özelliği ne zaman kullandığın", "Otomatik"],
        ["İletişim", "Destek talepleri, e-posta yazışmaları, anket yanıtları", "Senden"],
        ["Vayra Earn", "Bağladığın sosyal hesap kullanıcı adları ve takipçi sayıları, gönderi bağlantıları ve görüntülenme istatistikleri, ad-soyad, T.C. kimlik numarası, doğum yılı, IBAN veya Papara hesap numarası", "Senden, sosyal platformlardan ve NVİ'den"],
      ] },
      { t: "not", m: <>Kart bilgilerini doğrudan ödeme kuruluşuna girersin; tam kart numarası ve güvenlik kodu Vayra sunucularına ulaşmaz ve saklanmaz.</> },
    ],
  },
  {
    id: "amaclar", baslik: "Verileri neden ve hangi hukuki sebeple işliyoruz",
    kisaca: "Hizmeti sunmak, ödemeleri almak, güvenliği sağlamak ve yasal yükümlülükleri yerine getirmek için. Pazarlama e-postaları yalnız iznin varsa.",
    bloklar: [
      { t: "tablo", basliklar: ["Amaç", "İşlenen veriler", "Hukuki sebep (GDPR / KVKK)"], satirlar: [
        ["Hesabını oluşturmak ve yönetmek", "Hesap, iletişim", "Sözleşmenin ifası — GDPR 6(1)(b) / KVKK 5(2)(c)"],
        ["İstemlerini işleyip içerik üretmek", "İçerik, kullanım", "Sözleşmenin ifası"],
        ["Kredi, plan ve faturalama", "Ödeme, hesap", "Sözleşmenin ifası; vergi mevzuatı — GDPR 6(1)(c) / KVKK 5(2)(ç)"],
        ["Kötüye kullanımı ve dolandırıcılığı önlemek, içerik güvenliği denetimi", "İçerik, kullanım, cihaz", "Meşru menfaat — GDPR 6(1)(f) / KVKK 5(2)(f)"],
        ["Ürünü geliştirmek, hataları gidermek", "Kullanım (mümkün olduğunca anonimleştirilmiş)", "Meşru menfaat"],
        ["Destek taleplerini yanıtlamak", "İletişim, hesap", "Sözleşmenin ifası"],
        ["Kreatör ödemeleri ve kimlik doğrulama (Vayra Earn)", "Kimlik, ödeme, sosyal hesap", "Sözleşmenin ifası; vergi ve kara para aklamayla mücadele mevzuatı"],
        ["Kampanya ve yenilik e-postaları", "İletişim", "Açık rıza — GDPR 6(1)(a) / KVKK 5(1); istediğin an geri alınabilir"],
      ] },
    ],
  },
  {
    id: "yapay-zeka", baslik: "Yapay zekâ ve içeriğin",
    kisaca: "İstemlerin ve içeriklerin modellerimizi eğitmek için kullanılmaz. Üretim için yalnız ilgili model sağlayıcısına, gerektiği kadar iletilir.",
    bloklar: [
      { t: "liste", m: [
        <><b>Model eğitimi yok:</b> İstemlerini, yüklediğin dosyaları ve çıktılarını kendi modellerimizi ya da üçüncü taraf modelleri eğitmek için kullanmayız ve sağlayıcılarımızın kullanmasına izin vermeyiz.</>,
        <><b>Sağlayıcılara iletim:</b> Seçtiğin model başka bir şirkete aitse (ör. video ya da ses modeli), üretim için gereken istem ve dosyalar o sağlayıcıya şifreli olarak iletilir. Sağlayıcılarla veri işleme sözleşmesi imzalarız; veriler üretimden sonra sağlayıcı tarafında en geç 30 gün içinde silinir.</>,
        <><b>Güvenlik denetimi:</b> Yasaklı içeriği (ör. çocuk istismarı, rızasız mahrem içerik) önlemek için istemler ve çıktılar otomatik denetimden geçer. Şüpheli durumlar sınırlı yetkili ekip üyelerince incelenebilir.</>,
        <><b>Topluluk:</b> Bir çıktıyı Keşfet&apos;te paylaşmadıkça içeriklerin herkese açık değildir. Paylaştığın içeriği istediğin zaman yayından kaldırabilirsin.</>,
      ] },
    ],
  },
  {
    id: "paylasim", baslik: "Verileri kimlerle paylaşıyoruz",
    kisaca: "Yalnız hizmeti sunmamıza yardım eden sözleşmeli sağlayıcılarla ve kanunen zorunlu olduğunda. Verilerini satmayız.",
    bloklar: [
      { t: "liste", m: [
        <><b>Hizmet sağlayıcılar (alt işleyiciler):</b> barındırma, depolama, ödeme, e-posta, destek ve yapay zekâ model sağlayıcıları. Güncel liste <Link href="/guvenlik#alt-isleyiciler">Güvenlik sayfasında</Link>.</>,
        <><b>Grup şirketleri:</b> {SIRKET.yasalAd} ile {TR_SIRKET.kisaAd} arasında, hizmetin sunulması için gerekli ölçüde.</>,
        <><b>Ödeme ve bankacılık:</b> kreatör ödemeleri için Papara ve bankalar; faturalama için ödeme kuruluşları.</>,
        <><b>Yetkili kurumlar:</b> mahkeme kararı, savcılık talebi veya mevzuatın zorunlu kıldığı hâllerde; talebin hukuka uygunluğunu inceleyerek ve gerekli asgari veriyle.</>,
        <><b>Şirket işlemleri:</b> birleşme, devralma veya varlık satışı hâlinde, aynı korumayı sürdürme taahhüdüyle.</>,
      ] },
      { t: "not", m: <>Kişisel verilerini reklam amacıyla satmayız, kiralamayız ve davranışsal reklam ağlarıyla paylaşmayız.</> },
    ],
  },
  {
    id: "aktarim", baslik: "Yurt dışına aktarım",
    kisaca: "Sunucularımız Avrupa, ABD ve Singapur'da. Aktarımlar standart sözleşme maddeleri ve ek güvencelerle korunur.",
    bloklar: [
      { t: "p", m: "Varsayılan veri bölgemiz Avrupa Birliği'dir (Frankfurt ve Amsterdam). Bazı model sağlayıcıları ve yedekleme hizmetleri ABD'de veya Singapur'da bulunabilir." },
      { t: "liste", m: [
        <>AEA dışına aktarımlarda Avrupa Komisyonu&apos;nun <b>Standart Sözleşme Maddeleri</b> ve gerekli ek teknik önlemler (şifreleme, erişim kısıtları) uygulanır.</>,
        <>Türkiye&apos;den yurt dışına aktarımlarda KVKK md. 9 uyarınca Kurul&apos;un ilan ettiği <b>standart sözleşmeler</b> kullanılır ve sözleşmeler imzadan itibaren 5 iş günü içinde Kurul&apos;a bildirilir.</>,
        "Kurumsal planlarda veri ikamet bölgesini (AB, ABD, Asya-Pasifik) sen seçebilirsin.",
      ] },
    ],
  },
  {
    id: "saklama", baslik: "Saklama süreleri",
    kisaca: "Veriyi gerektiği kadar tutarız. Hesabını silersen içeriklerin 30 gün içinde silinir; faturalar kanunen 10 yıl saklanır.",
    bloklar: [
      { t: "tablo", basliklar: ["Veri", "Süre", "Gerekçe"], satirlar: [
        ["Hesap bilgileri", "Hesap açık olduğu sürece + silme talebinden sonra 30 gün", "Hizmetin sunulması, geri alma imkânı"],
        ["Üretimler ve yüklenen dosyalar", "Sen silene ya da hesap silinene kadar; silmeden sonra 30 gün içinde yedeklerden de silinir", "Hizmetin sunulması"],
        ["Fatura ve ödeme kayıtları", "10 yıl", "Vergi Usul Kanunu, Türk Ticaret Kanunu"],
        ["Kreatör kimlik ve ödeme bilgileri", "Son ödemeden itibaren 10 yıl", "Vergi ve mali mevzuat"],
        ["Güvenlik ve erişim kayıtları", "2 yıl", "5651 sayılı Kanun, güvenlik"],
        ["Destek yazışmaları", "Talep kapandıktan sonra 3 yıl", "Hizmet kalitesi, olası uyuşmazlıklar"],
        ["Pazarlama izinleri", "İzin geri alınana kadar + 3 yıl ispat kaydı", "Ticari İletişim Yönetmeliği"],
      ] },
    ],
  },
  {
    id: "guvenlik", baslik: "Güvenlik",
    kisaca: "Veriler aktarımda ve depoda şifrelenir; erişim en az yetki ilkesiyle sınırlıdır ve kayıt altındadır.",
    bloklar: [
      { t: "p", m: <>Aktarımda TLS 1.3, depolamada AES-256 şifreleme; çok faktörlü kimlik doğrulama, en az yetki ilkesi, erişim kayıtları, düzenli sızma testleri ve olay müdahale planı uygularız. Ayrıntılar <Link href="/guvenlik">Güvenlik sayfasında</Link>. Bir veri ihlali, haklarını etkileyecek nitelikteyse sana ve yetkili otoriteye mevzuatın öngördüğü sürede (GDPR&apos;de 72 saat, KVKK&apos;da en kısa sürede ve en geç 72 saat) bildirilir.</> },
    ],
  },
  {
    id: "haklar", baslik: "Hakların ve nasıl kullanırsın",
    kisaca: "Verilerine erişebilir, düzeltebilir, silebilir, dışa aktarabilir ve işlemeye itiraz edebilirsin. Çoğu işlem ayarlardan anında yapılır; diğerleri için 30 gün içinde yanıt veririz.",
    bloklar: [
      { t: "liste", m: [
        <><b>Erişim ve taşınabilirlik:</b> Üretimlerini Kitaplık&apos;tan tek tek ya da toplu indirebilirsin. Tüm hesap verilerinin makine tarafından okunabilir bir kopyasını e-postayla talep edebilirsin.</>,
        <><b>Düzeltme:</b> profil bilgilerini Ayarlar&apos;dan güncelleyebilirsin.</>,
        <><b>Silme:</b> Ayarlar › Profil › Hesap Silme Yönetimi&apos;nden hesabını kalıcı olarak silebilirsin. Kanunen saklamamız gereken kayıtlar (ör. faturalar) bu süre boyunca saklanır.</>,
        <><b>İtiraz ve kısıtlama:</b> meşru menfaate dayanan işlemelere itiraz edebilir, işlemenin kısıtlanmasını isteyebilirsin.</>,
        <><b>Rızayı geri alma:</b> pazarlama e-postalarındaki abonelikten çık bağlantısından ya da bildirim tercihlerinden; çerezler için <Link href="/cerezler">çerez tercihlerinden</Link>.</>,
        <><b>Otomatik kararlar:</b> Hukuki sonuç doğuran, yalnız otomatik işlemeye dayalı karar vermeyiz. Hesap kısıtlamaları gibi kararlar her zaman bir insan tarafından incelenebilir.</>,
      ] },
      { t: "p", m: <>Talebini <a href={`mailto:${ILETISIM.gizlilik}`}>{ILETISIM.gizlilik}</a> adresine, Türkiye&apos;deysen ayrıca <a href={`mailto:${ILETISIM.kvkk}`}>{ILETISIM.kvkk}</a> ya da KEP adresimiz <b>{TR_SIRKET.kep}</b> üzerinden iletebilirsin. Kimliğini doğruladıktan sonra en geç 30 gün içinde ücretsiz yanıt veririz.</> },
    ],
  },
  {
    id: "cocuklar", baslik: "Yaş sınırı",
    kisaca: "Vayra'yı kullanmak için 18 yaşını doldurmuş olmalısın.",
    bloklar: [
      { t: "p", m: "Hizmet 18 yaş altındaki kişilere yönelik değildir ve bu kişilerden bilerek veri toplamayız. 18 yaşından küçük birine ait bir hesap fark edersek hesabı kapatır ve verileri sileriz." },
    ],
  },
  {
    id: "cerezler", baslik: "Çerezler",
    kisaca: "Zorunlu çerezler dışındakiler için iznini alırız; tercihlerini istediğin an değiştirebilirsin.",
    bloklar: [{ t: "p", m: <>Kullandığımız çerez ve benzeri teknolojilerin listesi, amaçları ve süreleri <Link href="/cerezler">Çerez Politikası</Link>&apos;nda yer alır.</> }],
  },
  {
    id: "degisiklikler", baslik: "Bu politikadaki değişiklikler",
    kisaca: "Önemli bir değişiklik olursa yürürlükten en az 30 gün önce e-postayla haber veririz.",
    bloklar: [{ t: "p", m: "Politikayı zaman zaman güncelleyebiliriz. Haklarını etkileyen önemli değişiklikleri, yürürlük tarihinden en az 30 gün önce e-posta ve uygulama içi bildirimle duyururuz. Tüm sürümler aşağıdaki değişiklik geçmişinde listelenir." }],
  },
  {
    id: "sikayet", baslik: "Şikâyet hakkı",
    kisaca: "Önce bize yaz; çözemezsek denetim otoritesine başvurabilirsin.",
    bloklar: [
      { t: "liste", m: [
        <>Türkiye: <b>Kişisel Verileri Koruma Kurulu</b> — kvkk.gov.tr (önce veri sorumlusuna başvurman ve 30 günlük yanıt süresinin dolması gerekir).</>,
        <>Hollanda / AEA: <b>Autoriteit Persoonsgegevens</b> — autoriteitpersoonsgegevens.nl ya da bulunduğun ülkenin denetim otoritesi.</>,
        <>Birleşik Krallık: <b>Information Commissioner&apos;s Office (ICO)</b> — ico.org.uk.</>,
      ] },
    ],
  },
];
