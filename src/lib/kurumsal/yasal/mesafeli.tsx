import Link from "next/link";
import type { YasalBolum } from "@/components/sirket/YasalBelge";
import { ILETISIM, TR_SIRKET } from "@/lib/kurumsal/site";

export const MESAFELI_META = { yururluk: "1 Ekim 2026", surum: "2.0" };

export const MESAFELI_GECMIS = [
  { tarih: "1 Ekim 2026", not: "Ön bilgilendirme formu ile sözleşme tek belgede birleştirildi; ek hizmetler (sınırsız erişim, öncelikli hız) eklendi." },
  { tarih: "1 Temmuz 2026", not: "İlk yayın." },
];

/** 6502 sayılı Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca; Türkiye'de yerleşik tüketiciler için. */
export const MESAFELI: YasalBolum[] = [
  {
    id: "on-bilgi", baslik: "Ön bilgilendirme",
    kisaca: "Satın alma onayından önce okuman gereken temel bilgiler: satıcı, hizmet, fiyat, ödeme ve cayma hakkı.",
    bloklar: [
      { t: "p", m: "Bu belge, Mesafeli Sözleşmeler Yönetmeliği md. 5 kapsamındaki ön bilgilendirme formu ile md. 18 kapsamındaki mesafeli satış sözleşmesini birlikte içerir. Ödeme ekranında, siparişe özgü bilgilerle (plan, dönem, tutar, vergiler) doldurulmuş bir kopyası onayına sunulur ve satın alma sonrası e-posta adresine kalıcı veri saklayıcısıyla gönderilir." },
    ],
  },
  {
    id: "taraflar", baslik: "Taraflar",
    kisaca: `Satıcı ${TR_SIRKET.kisaAd}; alıcı, hesabını oluşturan tüketicidir.`,
    bloklar: [
      { t: "tablo", basliklar: ["", "Satıcı"], satirlar: [
        ["Unvan", TR_SIRKET.yasalAd],
        ["Adres", TR_SIRKET.adres],
        ["MERSİS no", TR_SIRKET.mersis],
        ["Vergi dairesi / no", `${TR_SIRKET.vergiDairesi} / ${TR_SIRKET.vergiNo}`],
        ["Telefon", TR_SIRKET.telefon],
        ["E-posta / KEP", `${ILETISIM.destek} · ${TR_SIRKET.kep}`],
      ] },
      { t: "p", m: "Alıcı: Vayra hesabında kayıtlı ad-soyad, e-posta ve fatura bilgileriyle tanımlanan tüketici." },
    ],
  },
  {
    id: "konu", baslik: "Sözleşmenin konusu",
    kisaca: "Vayra yapay zekâ üretim hizmetine abonelik, kredi paketi veya ek hizmet satın alınması.",
    bloklar: [
      { t: "liste", m: [
        <><b>Abonelik planları:</b> Başlangıç, Artı, Ultra — her dönem tanımlı kredi, model erişimi ve özellikler. Plan içerikleri <Link href="/fiyatlandirma">Fiyatlandırma</Link> sayfasında yer alır.</>,
        <><b>Kredi paketleri:</b> süresi dolmayan, tek seferlik ek krediler.</>,
        <><b>Ek hizmetler:</b> seçili modellere süreli sınırsız erişim, öncelikli hız ve ek eşzamanlı üretim.</>,
      ] },
    ],
  },
  {
    id: "fiyat", baslik: "Fiyat ve ödeme",
    kisaca: "Fiyatlar Türk lirası; vergiler ödeme ekranında ayrıca gösterilir. Ödeme kart ile, lisanslı ödeme kuruluşu üzerinden.",
    bloklar: [
      { t: "liste", m: [
        "Hizmetin vergiler dâhil toplam fiyatı, ödeme ekranında ve sipariş onay e-postasında gösterilir.",
        "Ödeme; kredi kartı, banka kartı veya ödeme ekranında sunulan diğer yöntemlerle, 6493 sayılı Kanun kapsamında lisanslı ödeme kuruluşları aracılığıyla alınır.",
        "Abonelikler seçilen dönem (aylık/yıllık) sonunda, alıcı iptal etmedikçe aynı koşullarla otomatik yenilenir. Yenilemeden önce e-posta ile hatırlatma yapılır.",
        "Fatura, ödeme tarihinden itibaren e-Arşiv fatura olarak e-posta adresine gönderilir.",
      ] },
    ],
  },
  {
    id: "ifa", baslik: "İfa ve teslim",
    kisaca: "Hizmet ödeme onaylandığı anda hesabında kullanıma açılır.",
    bloklar: [{ t: "p", m: "Satın alınan plan, kredi veya ek hizmet; ödemenin onaylanmasının ardından anında alıcının Vayra hesabında tanımlanır. Fiziksel teslimat yapılmaz. Teknik bir aksaklık nedeniyle tanımlama 24 saat içinde gerçekleşmezse alıcı sözleşmeden dönebilir ve ödediği tutarın tamamı 14 gün içinde iade edilir." }],
  },
  {
    id: "cayma", baslik: "Cayma hakkı",
    kisaca: "Anında ifa edilen dijital hizmetlerde, açık onayınla birlikte cayma hakkı sona erer; gönüllü iade koşullarımız geçerlidir.",
    bloklar: [
      { t: "p", m: "Mesafeli Sözleşmeler Yönetmeliği md. 15/1-ğ uyarınca elektronik ortamda anında ifa edilen hizmetlerde cayma hakkı kullanılamaz. Alıcı, ödeme ekranında hizmetin derhâl ifasına başlanmasını onayladığını ve bu nedenle cayma hakkını kaybedeceğini kabul eder." },
      { t: "p", m: <>Bununla birlikte Satıcı, <Link href="/iade">İade ve İptal Politikası</Link>&apos;nda belirtilen gönüllü iade haklarını tanır (ilk 7 günde yüzde 10&apos;dan az kullanımda tam iade, kullanılmamış kredi paketlerinde 14 gün içinde iade).</> },
    ],
  },
  {
    id: "yukumlulukler", baslik: "Tarafların yükümlülükleri",
    kisaca: "Vayra hizmeti tanımlandığı gibi sunar; sen de Kullanım Şartlarına uyarsın.",
    bloklar: [
      { t: "liste", m: [
        <>Satıcı, hizmeti <Link href="/sartlar">Kullanım Şartları</Link>&apos;nda ve plan açıklamalarında belirtilen niteliklerde sunmakla yükümlüdür.</>,
        <>Alıcı, hizmeti <Link href="/kullanim-politikasi">Kabul Edilebilir Kullanım Politikası</Link>&apos;na uygun kullanmakla ve hesap bilgilerini doğru tutmakla yükümlüdür.</>,
        "Satıcı, hizmetin ifasının imkânsızlaştığı hâllerde durumu öğrendiği tarihten itibaren 3 gün içinde alıcıya bildirir ve tahsil edilen tutarı 14 gün içinde iade eder.",
      ] },
    ],
  },
  {
    id: "uyusmazlik", baslik: "Uyuşmazlıkların çözümü",
    kisaca: "Tüketici hakem heyetleri ve tüketici mahkemeleri yetkilidir.",
    bloklar: [{ t: "p", m: "Bu sözleşmeden doğan uyuşmazlıklarda, Ticaret Bakanlığınca ilan edilen parasal sınırlar dâhilinde alıcının yerleşim yerindeki veya işlemin yapıldığı yerdeki Tüketici Hakem Heyetleri, bu sınırların üzerindeki uyuşmazlıklarda Tüketici Mahkemeleri yetkilidir." }],
  },
  {
    id: "yururluk", baslik: "Yürürlük",
    kisaca: "Ödeme ekranındaki onay kutusunu işaretleyip ödemeyi tamamladığında sözleşme kurulmuş olur.",
    bloklar: [{ t: "p", m: "Alıcı, ödeme ekranında bu sözleşmeyi ve ön bilgilendirme formunu okuyup onayladığında ve ödeme gerçekleştiğinde sözleşme kurulur. Satıcı, sözleşmenin bir örneğini alıcının e-posta adresine gönderir ve sözleşme kayıtlarını 3 yıl süreyle saklar." }],
  },
];
