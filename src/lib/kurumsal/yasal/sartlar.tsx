import Link from "next/link";
import type { YasalBolum } from "@/components/sirket/YasalBelge";
import { ILETISIM, SIRKET, TR_SIRKET } from "@/lib/kurumsal/site";

export const SARTLAR_META = { yururluk: "1 Ekim 2026", surum: "4.0" };

export const SARTLAR_GECMIS = [
  { tarih: "1 Ekim 2026", not: "Vayra Earn ek şartları ve kreatör ödemelerine ilişkin hükümler eklendi." },
  { tarih: "1 Temmuz 2026", not: "Türkiye'deki tüketiciler için sözleşme tarafı Vayra Teknoloji A.Ş. olarak güncellendi; uyuşmazlık çözümü bölümü yeniden yazıldı." },
  { tarih: "15 Ocak 2026", not: "Kredi sistemi, sınırsız erişim ve öncelikli hız ek hizmetleri eklendi." },
];

export const SARTLAR: YasalBolum[] = [
  {
    id: "taraflar", baslik: "Taraflar ve kabul",
    kisaca: "Hesap açtığında ya da Vayra'yı kullandığında bu şartları kabul etmiş olursun.",
    bloklar: [
      { t: "p", m: <>Bu Kullanım Şartları (&ldquo;Şartlar&rdquo;), Vayra hizmetlerini kullanan sen (&ldquo;Kullanıcı&rdquo;) ile; Türkiye&apos;de yerleşik kullanıcılar için <b>{TR_SIRKET.yasalAd}</b>, diğer kullanıcılar için <b>{SIRKET.yasalAd}</b> (&ldquo;Vayra&rdquo;) arasındaki sözleşmedir.</> },
      { t: "p", m: <>Şartlar; <Link href="/gizlilik">Gizlilik Politikası</Link>, <Link href="/kullanim-politikasi">Kabul Edilebilir Kullanım Politikası</Link>, <Link href="/iade">İade ve İptal Politikası</Link> ve Türkiye&apos;deki tüketiciler için <Link href="/mesafeli-satis">Mesafeli Satış Sözleşmesi</Link> ile birlikte bir bütündür. Kurumsal müşterilerle imzalanan ayrı sözleşme bu Şartlarla çelişirse o sözleşme uygulanır.</> },
    ],
  },
  {
    id: "hesap", baslik: "Hesap ve uygunluk",
    kisaca: "18 yaşını doldurmuş olmalısın; hesabının güvenliğinden sen sorumlusun.",
    bloklar: [
      { t: "liste", m: [
        "Hizmeti kullanmak için 18 yaşını doldurmuş ve sözleşme yapma ehliyetine sahip olmalısın.",
        "Bir şirket adına kullanıyorsan, o şirketi bu Şartlarla bağlamaya yetkili olduğunu beyan edersin.",
        "Kayıt bilgilerinin doğru ve güncel olmasından, şifrenin ve API anahtarlarının gizliliğinden sen sorumlusun. Yetkisiz bir erişimi fark edersen hemen bize bildir.",
        "Bir kişi yalnız bir ücretsiz hesap açabilir. Ücretsiz kredileri çoğaltmak için birden fazla hesap açmak yasaktır.",
      ] },
    ],
  },
  {
    id: "hizmet", baslik: "Hizmetin tanımı",
    kisaca: "Vayra; görsel, video, ses, müzik ve 3D üretmek için farklı yapay zekâ modellerini tek yerde sunar. Modeller ve özellikler zamanla değişebilir.",
    bloklar: [
      { t: "p", m: "Vayra, kendi geliştirdiği ve üçüncü taraf sağlayıcılardan lisansladığı yapay zekâ modellerine tek bir arayüz, API ve iş akışı araçları üzerinden erişim sağlar. Hizmeti sürekli geliştiririz: model ekleyebilir, kaldırabilir, güncelleyebilir ya da bir özelliği değiştirebiliriz. Ücretli planında yer alan temel bir özelliği kaldırırsak en az 30 gün önce haber veririz." },
      { t: "p", m: "Hizmetin yüzde 99,9 erişilebilirlik hedefiyle çalışmasını amaçlarız; ancak ücretsiz ve bireysel planlarda kesintisiz erişim garanti edilmez. Kurumsal planlardaki hizmet seviyesi taahhüdü (SLA) ayrı sözleşmede yer alır." },
    ],
  },
  {
    id: "krediler", baslik: "Krediler, planlar ve ödeme",
    kisaca: "Üretimler kredi harcar. Abonelikler otomatik yenilenir, istediğin an iptal edebilirsin. Fiyat artışını 30 gün önceden bildiririz.",
    bloklar: [
      { t: "liste", m: [
        <><b>Krediler:</b> Her üretimin kredi bedeli, üretimden önce arayüzde gösterilir. Teknik bir hata nedeniyle tamamlanamayan üretimin kredisi otomatik iade edilir.</>,
        <><b>Plan kredileri:</b> Aylık plan kredileri her fatura döneminde yenilenir; kullanılmayan plan kredileri bir sonraki döneme devretmez. Satın alınan ek kredi paketlerinin süresi dolmaz.</>,
        <><b>Ücretlendirme:</b> Türkiye&apos;deki kullanıcılar için fiyatlar Türk lirasıdır; yasal vergiler faturada ayrıca gösterilir. Ödemeler lisanslı ödeme kuruluşları aracılığıyla alınır.</>,
        <><b>Otomatik yenileme:</b> Abonelikler, iptal edilmedikçe seçtiğin dönem (aylık/yıllık) sonunda aynı süre için otomatik yenilenir. Yenileme tarihi ve tutarı Ayarlar › Abonelik&apos;te görünür.</>,
        <><b>İptal:</b> Aboneliğini istediğin an Ayarlar › Abonelik › Otomatik yenileme&apos;yi kapatarak iptal edebilirsin; erişimin dönem sonuna kadar sürer. İadeler <Link href="/iade">İade ve İptal Politikası</Link>&apos;na tabidir.</>,
        <><b>Fiyat değişikliği:</b> Fiyat artışlarını yürürlükten en az 30 gün önce e-postayla bildiririz; artış bir sonraki yenilemeden itibaren uygulanır ve öncesinde iptal hakkın vardır.</>,
        <><b>Ödenmeyen tutarlar:</b> Ödeme alınamazsa 7 gün boyunca tekrar deneriz; bu sürede ücretli özellikler kısıtlanabilir.</>,
      ] },
    ],
  },
  {
    id: "icerik", baslik: "İçerik sahipliği ve lisans",
    kisaca: "Girdilerin ve çıktıların senindir. Bize yalnız hizmeti sunmak için gereken sınırlı izni verirsin; içeriklerini model eğitiminde kullanmayız.",
    bloklar: [
      { t: "liste", m: [
        <><b>Girdiler:</b> Yüklediğin dosyalar ve yazdığın istemler (&ldquo;Girdi&rdquo;) üzerindeki hakların sende kalır. Girdileri kullanmak için gereken tüm haklara sahip olduğunu beyan edersin.</>,
        <><b>Çıktılar:</b> Hizmetle ürettiğin içerikler (&ldquo;Çıktı&rdquo;) üzerinde, mevzuatın izin verdiği ölçüde ve bu Şartlara uyman kaydıyla Vayra&apos;nın sahip olabileceği tüm hakları sana devrederiz. Ücretli planlarda Çıktıları ticari amaçla kullanabilirsin; ücretsiz planda ticari kullanım hakkı yoktur.</>,
        <><b>Vayra&apos;ya verilen lisans:</b> Hizmeti sunmak, içeriklerini saklamak, göstermek ve güvenlik denetiminden geçirmek için gereken dünya çapında, münhasır olmayan, ücretsiz ve hizmet süresiyle sınırlı bir lisans verirsin. Bu lisans model eğitimini kapsamaz.</>,
        <><b>Keşfet&apos;te paylaşım:</b> Bir Çıktıyı toplulukla paylaşırsan, onu yayından kaldırana kadar Vayra&apos;da gösterilmesine ve diğer kullanıcıların görüntülemesine izin vermiş olursun.</>,
        <><b>Benzer çıktılar:</b> Yapay zekâ modelleri farklı kullanıcılara benzer çıktılar üretebilir. Başka bir kullanıcının bağımsız olarak ürettiği benzer içerik üzerinde hak iddia edemezsin.</>,
      ] },
    ],
  },
  {
    id: "kullanim", baslik: "Kabul edilebilir kullanım",
    kisaca: "Yasa dışı, zarar verici ya da başkasının haklarını çiğneyen içerik üretemezsin. Ayrıntılar Kabul Edilebilir Kullanım Politikası'nda.",
    bloklar: [
      { t: "p", m: <>Hizmeti <Link href="/kullanim-politikasi">Kabul Edilebilir Kullanım Politikası</Link>&apos;na uygun kullanmayı kabul edersin. Özellikle; çocukların cinsel istismarını içeren her türlü içerik, bir kişinin rızası olmadan mahrem ya da aldatıcı görüntüsünü üretmek, başkalarının telif veya marka haklarını ihlal etmek, seçimleri ya da kamuoyunu yanıltmaya yönelik sahte içerik yaymak ve Hizmetin güvenlik önlemlerini aşmaya çalışmak kesinlikle yasaktır.</> },
    ],
  },
  {
    id: "nitelik", baslik: "Yapay zekâ çıktılarının niteliği",
    kisaca: "Yapay zekâ hata yapabilir. Çıktıları yayınlamadan önce kontrol etmek senin sorumluluğunda.",
    bloklar: [
      { t: "p", m: "Çıktılar olasılıksal modellerle üretilir; gerçeği yansıtmayabilir, beklenmedik ya da hatalı olabilir. Çıktıların doğruluğunu, uygunluğunu ve üçüncü kişi haklarını ihlal etmediğini yayınlamadan veya ticari olarak kullanmadan önce değerlendirmek senin sorumluluğundadır. Vayra bazı çıktılara, yapay zekâyla üretildiğini gösteren görünmez filigran ve C2PA içerik kimlik bilgisi ekleyebilir; bunları kaldırmaya çalışmamayı kabul edersin." },
    ],
  },
  {
    id: "ucuncu-taraf", baslik: "Üçüncü taraf modeller ve hizmetler",
    kisaca: "Bazı modeller başka şirketlere ait; onların ek kullanım koşulları da geçerli olabilir.",
    bloklar: [
      { t: "p", m: "Hizmet, üçüncü taraf model sağlayıcılarının teknolojisini içerir. Bu sağlayıcıların kullanım kısıtlamaları, ilgili model sayfasında belirtilir ve o modeli kullandığında senin için de bağlayıcıdır. Entegrasyonlar (ör. Google Drive, Notion) aracılığıyla bağladığın üçüncü taraf hizmetler kendi şartlarına tabidir." },
    ],
  },
  {
    id: "earn", baslik: "Vayra Earn ek şartları",
    kisaca: "Kreatör programında kazanç; kampanya kurallarına, doğrulanmış hesaplara ve gerçek etkileşime bağlıdır.",
    bloklar: [
      { t: "liste", m: [
        "Vayra Earn'e katılmak için 18 yaşını doldurmuş olman ve ödeme öncesinde kimliğini doğrulaman gerekir.",
        "Yalnız kendi adına doğruladığın sosyal medya hesaplarından ve Vayra'da ürettiğin içerikle gönderi yapabilirsin.",
        "Bot, satın alınmış takipçi veya görüntülenme, etkileşim grupları ya da reklamla şişirilmiş görüntülenmeler kazanç hesabına katılmaz; tespit edilmesi hâlinde bekleyen kazançlar iptal edilir ve hesap programdan çıkarılır.",
        "Kazançlar, kampanya sayfasında belirtilen inceleme, kazanma ve bekleme sürelerinin sonunda çekilebilir hâle gelir. Vergisel yükümlülükler kreatöre aittir; mevzuatın öngördüğü stopaj ve bildirimler Vayra tarafından yapılır.",
        <>Ayrıntılı kurallar ve ödeme takvimi <Link href="/earn/yardim">Vayra Earn Yardım</Link> sayfasındadır.</>,
      ] },
    ],
  },
  {
    id: "api", baslik: "API kullanımı",
    kisaca: "API'yi belgelerdeki sınırlar içinde ve anahtarını gizli tutarak kullanırsın.",
    bloklar: [
      { t: "p", m: "API erişimi; dokümantasyonda belirtilen hız sınırlarına, kotalara ve bu Şartlara tabidir. API anahtarlarını üçüncü kişilerle paylaşamaz, istemci tarafı kodda açıkta bırakamazsın. API çıktılarını, Vayra ile rekabet eden bir model veya hizmet geliştirmek için kullanamazsın." },
    ],
  },
  {
    id: "telif", baslik: "Telif hakkı bildirimleri",
    kisaca: "Hakkının ihlal edildiğini düşünüyorsan bize bildir; inceleyip gerekirse içeriği kaldırırız.",
    bloklar: [
      { t: "p", m: <>Vayra&apos;da yayımlanan bir içeriğin telif veya diğer fikrî haklarını ihlal ettiğini düşünüyorsan; hak sahibi olduğunu gösteren bilgi, ihlal edildiği iddia edilen eser ve Vayra&apos;daki içeriğin bağlantısıyla <a href={`mailto:${ILETISIM.hukuk}`}>{ILETISIM.hukuk}</a> adresine bildirimde bulunabilirsin. Haklı bulunan bildirimlerde içerik kaldırılır; tekrarlayan ihlaller hesabın kapatılmasına yol açar.</> },
    ],
  },
  {
    id: "fesih", baslik: "Askıya alma ve fesih",
    kisaca: "Hesabını istediğin an kapatabilirsin. Ciddi ihlallerde hesabını askıya alabilir ya da kapatabiliriz.",
    bloklar: [
      { t: "p", m: "Bu Şartları ciddi şekilde ihlal etmen, Hizmete veya diğer kullanıcılara zarar vermen ya da bir yasal zorunluluk hâlinde hesabını önceden bildirmeksizin askıya alabilir veya kapatabiliriz. Mümkün olduğunda sebebini bildirir ve itiraz imkânı tanırız. Haklı bir sebep olmaksızın hesabını kapatırsak kullanılmamış ücretli kredilerin bedelini iade ederiz." },
    ],
  },
  {
    id: "garanti", baslik: "Garanti reddi ve sorumluluğun sınırı",
    kisaca: "Hizmet olduğu gibi sunulur. Tüketici olarak kanundan doğan hakların saklıdır.",
    bloklar: [
      { t: "p", m: "Mevzuatın izin verdiği azami ölçüde Hizmet \"olduğu gibi\" sunulur; belirli bir amaca uygunluk veya kesintisizlik garantisi verilmez. Vayra'nın bu sözleşmeden doğan toplam sorumluluğu, talebe konu olaydan önceki 12 ayda Vayra'ya ödediğin tutarla sınırlıdır. Kast ve ağır ihmal hâllerinde ve 6502 sayılı Tüketicinin Korunması Hakkında Kanun gibi emredici hükümlerin sağladığı haklar bakımından bu sınırlama uygulanmaz." },
    ],
  },
  {
    id: "degisiklik", baslik: "Şartlardaki değişiklikler",
    kisaca: "Önemli değişiklikleri 30 gün önceden bildiririz; kabul etmezsen hesabını kapatabilirsin.",
    bloklar: [
      { t: "p", m: "Şartları güncelleyebiliriz. Haklarını önemli ölçüde etkileyen değişiklikleri yürürlükten en az 30 gün önce e-postayla bildiririz. Değişikliği kabul etmiyorsan bu süre içinde hesabını kapatabilir ve kullanılmamış abonelik süresi için orantılı iade isteyebilirsin." },
    ],
  },
  {
    id: "hukuk", baslik: "Uygulanacak hukuk ve uyuşmazlıklar",
    kisaca: "Türkiye'deki tüketiciler için Türk hukuku ve tüketici hakem heyetleri/mahkemeleri; diğerleri için Hollanda hukuku geçerlidir.",
    bloklar: [
      { t: "liste", m: [
        <><b>Türkiye&apos;deki tüketiciler:</b> Türk hukuku uygulanır. Uyuşmazlıklarda, Ticaret Bakanlığınca her yıl ilan edilen parasal sınırlar dâhilinde yerleşim yerindeki veya işlemin yapıldığı yerdeki <b>Tüketici Hakem Heyetleri</b>, bu sınırların üzerinde <b>Tüketici Mahkemeleri</b> yetkilidir.</>,
        <><b>Diğer kullanıcılar:</b> Hollanda hukuku uygulanır ve Amsterdam mahkemeleri yetkilidir. AB&apos;deki tüketicilerin yerleşim yeri mahkemelerinde dava açma hakkı saklıdır.</>,
      ] },
      { t: "p", m: <>Sorularını önce <a href={`mailto:${ILETISIM.hukuk}`}>{ILETISIM.hukuk}</a> adresine iletmeni rica ederiz; çoğu konuyu dostane yolla çözebiliriz.</> },
    ],
  },
];
