import Link from "next/link";
import type { YasalBolum } from "@/components/sirket/YasalBelge";
import { ILETISIM, TR_SIRKET } from "@/lib/kurumsal/site";

export const KVKK_META = { yururluk: "1 Ekim 2026", surum: "2.0" };

export const KVKK_GECMIS = [
  { tarih: "1 Ekim 2026", not: "Vayra Earn kreatör programı kapsamındaki veri kategorileri ve NVİ kimlik doğrulaması eklendi." },
  { tarih: "1 Temmuz 2026", not: "İlk yayın: Türkiye'deki kullanıcılar için ayrı aydınlatma metni." },
];

/** 6698 sayılı KVKK md. 10 ve Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ uyarınca. */
export const KVKK: YasalBolum[] = [
  {
    id: "veri-sorumlusu", baslik: "Veri sorumlusu",
    kisaca: `Türkiye'deki kullanıcılarımızın kişisel verilerinden ${TR_SIRKET.kisaAd} sorumludur.`,
    bloklar: [
      { t: "p", m: <>6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) uyarınca, kişisel verileriniz veri sorumlusu sıfatıyla <b>{TR_SIRKET.yasalAd}</b> (&ldquo;Vayra&rdquo;) tarafından aşağıda açıklanan kapsamda işlenmektedir.</> },
      { t: "tablo", basliklar: ["Bilgi", "Değer"], satirlar: [
        ["Unvan", TR_SIRKET.yasalAd],
        ["Adres", TR_SIRKET.adres],
        ["MERSİS no", TR_SIRKET.mersis],
        ["Vergi dairesi / no", `${TR_SIRKET.vergiDairesi} / ${TR_SIRKET.vergiNo}`],
        ["KEP adresi", TR_SIRKET.kep],
        ["E-posta", ILETISIM.kvkk],
      ] },
    ],
  },
  {
    id: "kategoriler", baslik: "İşlenen kişisel veri kategorileri",
    kisaca: "Kimlik, iletişim, müşteri işlem, finans, işlem güvenliği ve yüklediğin içerikler; kreatörler için ek olarak T.C. kimlik ve banka bilgileri.",
    bloklar: [
      { t: "tablo", basliklar: ["Kategori", "Veriler"], satirlar: [
        ["Kimlik", "Ad, soyad; Vayra Earn kreatörleri için T.C. kimlik numarası ve doğum yılı"],
        ["İletişim", "E-posta adresi, telefon (paylaşılırsa), fatura adresi"],
        ["Müşteri işlem", "Plan ve kredi hareketleri, sipariş ve fatura kayıtları, destek talepleri"],
        ["Finans", "Ödeme işlem kimliği, kartın son 4 hanesi; kreatörler için IBAN ya da Papara hesap numarası"],
        ["İşlem güvenliği", "IP adresi, oturum ve erişim kayıtları, cihaz ve tarayıcı bilgisi, şifre özeti"],
        ["Görsel ve işitsel kayıtlar", "Yüklediğin fotoğraf, ses ve video dosyaları; ürettiğin içerikler"],
        ["Pazarlama", "İleti izinleri, kampanya tercihleri (yalnız açık rızanla)"],
        ["Sosyal medya", "Vayra Earn'e bağladığın hesap kullanıcı adı, takipçi sayısı, gönderi bağlantıları ve istatistikleri"],
      ] },
      { t: "not", m: <>Özel nitelikli kişisel veri (sağlık, biyometrik vb.) işlemeyi amaçlamayız. Yüklediğin bir görselde bu tür veri bulunuyorsa, yalnız senin talimatınla ve üretim amacıyla işlenir; yüz tanıma ya da kimlik tespiti yapılmaz.</> },
    ],
  },
  {
    id: "amaclar", baslik: "İşleme amaçları ve hukuki sebepler",
    kisaca: "Verilerin sözleşmeyi kurup yürütmek, yasal yükümlülükleri yerine getirmek ve meşru menfaatlerimiz için işlenir; pazarlama yalnız açık rızayla.",
    bloklar: [
      { t: "tablo", basliklar: ["Amaç", "Hukuki sebep (KVKK md. 5)"], satirlar: [
        ["Üyelik ve hesabın oluşturulması, yönetimi", "Sözleşmenin kurulması ve ifası — md. 5/2-c"],
        ["Yapay zekâ üretim hizmetinin sunulması", "Sözleşmenin ifası — md. 5/2-c"],
        ["Ödeme, faturalama ve muhasebe süreçleri", "Kanuni yükümlülük — md. 5/2-ç; sözleşmenin ifası — md. 5/2-c"],
        ["Mesafeli satış ve tüketici mevzuatından doğan yükümlülükler", "Kanunlarda açıkça öngörülme — md. 5/2-a"],
        ["Bilgi güvenliği, kötüye kullanım ve dolandırıcılığın önlenmesi", "Meşru menfaat — md. 5/2-f; 5651 sayılı Kanun — md. 5/2-a"],
        ["Kreatör kimlik doğrulaması ve kazanç ödemeleri", "Sözleşmenin ifası — md. 5/2-c; vergi mevzuatı — md. 5/2-ç"],
        ["Talep ve şikâyetlerin yönetimi", "Sözleşmenin ifası; bir hakkın tesisi, kullanılması veya korunması — md. 5/2-e"],
        ["Hizmetin geliştirilmesi ve istatistik", "Meşru menfaat — md. 5/2-f (mümkün olduğunca anonim)"],
        ["Kampanya, duyuru ve ticari elektronik ileti", "Açık rıza — md. 5/1"],
        ["Zorunlu olmayan çerezler", "Açık rıza — md. 5/1"],
      ] },
    ],
  },
  {
    id: "aktarim", baslik: "Kişisel verilerin aktarılması",
    kisaca: "Verilerin yurt içinde iş ortaklarımıza ve yetkili kurumlara; yurt dışında grup şirketimize ve sunucu/model sağlayıcılarına, KVKK md. 9'daki güvencelerle aktarılır.",
    bloklar: [
      { t: "liste", m: [
        <><b>Yurt içi:</b> ödeme kuruluşları ve bankalar (Papara dâhil), muhasebe ve mali müşavirlik hizmeti alınan kişiler, e-fatura entegratörü, hukuki danışmanlar ve kanunen yetkili kamu kurum ve kuruluşları.</>,
        <><b>Yurt dışı:</b> grup şirketimiz Vayra Technologies B.V. (Hollanda), bulut barındırma ve depolama sağlayıcıları (AB, ABD), yapay zekâ model sağlayıcıları (AB, ABD), e-posta ve destek platformları.</>,
        <>Yurt dışı aktarımlar KVKK md. 9 uyarınca öncelikle Kurul&apos;un belirlediği <b>standart sözleşmelerle</b> yapılır; sözleşmeler imzalanmalarından itibaren 5 iş günü içinde Kurum&apos;a bildirilir. Standart sözleşme bulunmayan arızi hâllerde md. 9/6 kapsamındaki istisnalara dayanılır.</>,
      ] },
      { t: "p", m: <>Güncel alt işleyici listesi <Link href="/guvenlik#alt-isleyiciler">Güvenlik sayfasında</Link> yayımlanır.</> },
    ],
  },
  {
    id: "yontem", baslik: "Toplama yöntemi",
    kisaca: "Verilerin web sitesi, uygulama, API ve e-posta üzerinden, kısmen otomatik yollarla toplanır.",
    bloklar: [
      { t: "p", m: "Kişisel verileriniz; vayra.ai web sitesi, Vayra uygulaması, API, destek kanalları ve e-posta aracılığıyla elektronik ortamda, kısmen otomatik (çerezler, sunucu kayıtları) ve kısmen otomatik olmayan yollarla (destek yazışmaları) toplanır. Vayra Earn kapsamında sosyal medya platformlarının resmî arayüzlerinden ve Nüfus ve Vatandaşlık İşleri Genel Müdürlüğü'nün kimlik doğrulama servisinden de veri alınır." },
    ],
  },
  {
    id: "haklar", baslik: "KVKK md. 11 kapsamındaki hakların",
    kisaca: "Verilerinin işlenip işlenmediğini öğrenme, bilgi isteme, düzeltme, silme, itiraz ve zararın giderilmesini isteme hakların var.",
    bloklar: [
      { t: "liste", sirali: true, m: [
        "Kişisel verilerinin işlenip işlenmediğini öğrenme,",
        "İşlenmişse buna ilişkin bilgi talep etme,",
        "İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,",
        "Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,",
        "Eksik veya yanlış işlenmişse düzeltilmesini isteme,",
        "KVKK md. 7'deki şartlar çerçevesinde silinmesini veya yok edilmesini isteme,",
        "Düzeltme, silme ve yok etme işlemlerinin verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme,",
        "Münhasıran otomatik sistemlerle analiz edilmesi sonucu aleyhine bir sonuç ortaya çıkmasına itiraz etme,",
        "Kanuna aykırı işleme sebebiyle zarara uğraman hâlinde zararın giderilmesini talep etme.",
      ] },
    ],
  },
  {
    id: "basvuru", baslik: "Başvuru yöntemi",
    kisaca: "Kimliğini doğrulayan bir başvuruyu e-posta, KEP ya da posta ile ilet; 30 gün içinde ücretsiz yanıt veririz.",
    bloklar: [
      { t: "p", m: "Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ uyarınca başvurunda; ad-soyad, imza (yazılı başvurularda), T.C. kimlik numarası, tebligata esas adres, e-posta ve talep konusu bulunmalıdır." },
      { t: "tablo", basliklar: ["Kanal", "Adres"], satirlar: [
        ["Kayıtlı e-posta (KEP)", TR_SIRKET.kep],
        ["Sistemimizde kayıtlı e-posta adresinden", ILETISIM.kvkk],
        ["Yazılı (ıslak imzalı) başvuru", TR_SIRKET.adres],
      ] },
      { t: "p", m: "Başvurun, talebin niteliğine göre en kısa sürede ve en geç 30 gün içinde ücretsiz sonuçlandırılır. İşlemin ayrıca bir maliyet gerektirmesi hâlinde Kurul'ca belirlenen tarifedeki ücret alınabilir. Başvurunun reddedilmesi, cevabın yetersiz bulunması veya süresinde cevap verilmemesi hâlinde, cevabı öğrendiğin tarihten itibaren 30 ve her hâlde başvuru tarihinden itibaren 60 gün içinde Kişisel Verileri Koruma Kurulu'na şikâyette bulunabilirsin." },
    ],
  },
];
