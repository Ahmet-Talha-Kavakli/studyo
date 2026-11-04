import type { YasalBolum } from "@/components/sirket/YasalBelge";
import { ILETISIM } from "@/lib/kurumsal/site";

export const KULLANIM_META = { yururluk: "1 Ekim 2026", surum: "2.0" };

export const KULLANIM_GECMIS = [
  { tarih: "1 Ekim 2026", not: "Sentetik medya, seçim dönemi içerikleri ve kreatör programı kötüye kullanımı başlıkları genişletildi." },
  { tarih: "15 Ocak 2026", not: "İlk yayın." },
];

export const KULLANIM: YasalBolum[] = [
  {
    id: "amac", baslik: "Bu politika neden var",
    kisaca: "Vayra güçlü araçlar sunar; herkesin güvenle üretebilmesi için bazı sınırlar koyuyoruz.",
    bloklar: [
      { t: "p", m: "Bu politika, Vayra'nın tüm modelleri, stüdyoları, API'si ve topluluk alanları için geçerlidir. Sınırlar hem doğrudan ürettiğin içerik hem de o içeriği nasıl kullandığın için geçerlidir. Bir istemin reddedilmesi, otomatik güvenlik sistemlerimizin bu ilkeleri uyguladığını gösterir." },
    ],
  },
  {
    id: "kesin-yasak", baslik: "Kesinlikle yasak içerikler",
    kisaca: "Bu içerikler hiçbir koşulda üretilemez; tespitinde hesap kalıcı kapatılır ve gerekirse yetkililere bildirilir.",
    bloklar: [
      { t: "liste", m: [
        <><b>Çocuk istismarı:</b> reşit olmayanları cinselleştiren her türlü içerik. Bu tür girişimler ilgili kolluk birimlerine ve uluslararası çocuk koruma kuruluşlarına bildirilir.</>,
        <><b>Rızasız mahrem içerik:</b> gerçek bir kişinin rızası olmadan çıplak, cinsel ya da mahrem görüntüsünü veya sesini üretmek.</>,
        <><b>Şiddet ve terör:</b> terör örgütlerini öven, şiddete çağıran ya da şiddet eylemlerinin planlanmasına yardım eden içerik.</>,
        <><b>Kitle imha silahları:</b> biyolojik, kimyasal, nükleer ya da radyolojik silah üretimine yardım eden içerik.</>,
      ] },
    ],
  },
  {
    id: "kisiler", baslik: "Gerçek kişiler ve sentetik medya",
    kisaca: "Gerçek birini, onu küçük düşürecek ya da aldatacak şekilde gösteremezsin. Ses klonlama yalnız kendi sesin ya da izinli sesler için.",
    bloklar: [
      { t: "liste", m: [
        "Gerçek bir kişiyi, yapmadığı bir şeyi yapıyor ya da söylemediği bir şeyi söylüyor gibi aldatıcı biçimde göstermek yasaktır. Hiciv ve parodi, izleyiciyi yanıltmadığı sürece serbesttir.",
        "Ses klonlama ve dudak senkronu yalnız kendi sesin, açık yazılı izni olan kişilerin sesi ya da Vayra'nın lisanslı ses kütüphanesi için kullanılabilir.",
        "Kamuya mal olmuş kişilerin ve siyasetçilerin görüntüsünü ya da sesini, bir seçimi veya kamuoyunu yanıltmaya yönelik kullanmak yasaktır.",
        "Bir kişiyi taciz etmek, tehdit etmek, aşağılamak ya da kişisel verilerini ifşa etmek için içerik üretmek yasaktır.",
      ] },
    ],
  },
  {
    id: "haklar", baslik: "Başkalarının hakları",
    kisaca: "Telif, marka ve kişilik haklarına saygı göster.",
    bloklar: [
      { t: "liste", m: [
        "Başkasına ait eserleri, karakterleri veya markaları izinsiz ticari amaçla çoğaltmak ve markaları yanıltıcı biçimde kullanmak yasaktır.",
        "Bir sanatçının üslubundan ilham almak serbesttir; ancak eserlerini birebir taklit edip onun adına sunmak yasaktır.",
        "Reklam ve ürün içeriklerinde, iş birliği olmayan bir markayı destekçin gibi göstermek yasaktır.",
      ] },
    ],
  },
  {
    id: "yaniltma", baslik: "Yanıltma, dolandırıcılık ve spam",
    kisaca: "Sahte belge, dolandırıcılık içeriği ve toplu spam üretemezsin.",
    bloklar: [
      { t: "liste", m: [
        "Sahte kimlik, belge, fatura, makbuz veya resmi evrak üretmek.",
        "Kimlik avı (phishing), dolandırıcılık veya yatırım tuzağı içerikleri üretmek.",
        "Yapay zekâ ile üretildiğini gizleyerek gerçek bir haber ya da olay görüntüsü gibi sunmak.",
        "Otomatik ve toplu biçimde spam içerik üretip yaymak.",
      ] },
    ],
  },
  {
    id: "platform", baslik: "Platformun kötüye kullanımı",
    kisaca: "Güvenlik sistemlerini aşmaya, sistemi yormaya ya da kredi sistemini kandırmaya çalışmak yasaktır.",
    bloklar: [
      { t: "liste", m: [
        "Güvenlik filtrelerini aşmak için istem manipülasyonu (jailbreak) denemek.",
        "Hizmete tersine mühendislik uygulamak, verileri otomatik olarak toplamak (scraping) ya da hız sınırlarını aşmaya çalışmak.",
        "Ücretsiz kredileri çoğaltmak için birden fazla hesap açmak, davet sistemini sahte hesaplarla kullanmak.",
        "Vayra Earn'de bot, satın alınmış etkileşim, başkasına ait hesap veya içerikle kazanç elde etmeye çalışmak.",
      ] },
    ],
  },
  {
    id: "seffaflik", baslik: "Şeffaflık",
    kisaca: "Yapay zekâ ile üretildiği önemli olan yerlerde bunu belirt.",
    bloklar: [
      { t: "p", m: "Reklam, haber, siyasi içerik ve gerçek kişileri gösteren içeriklerde, yapay zekâ ile üretildiğini izleyiciye açıkça belirtmeni bekleriz. Vayra'nın eklediği filigranları ve C2PA içerik kimlik bilgilerini kaldırmaya çalışmak yasaktır." },
    ],
  },
  {
    id: "yaptirim", baslik: "Uygulama ve itiraz",
    kisaca: "İhlalin ağırlığına göre uyarı, içerik kaldırma, kısıtlama ya da hesap kapatma uygularız. Kararlara itiraz edebilirsin.",
    bloklar: [
      { t: "tablo", basliklar: ["İhlal", "Olası işlem"], satirlar: [
        ["İlk ve hafif ihlal", "Uyarı, istemin ya da içeriğin kaldırılması"],
        ["Tekrarlayan ihlal", "Belirli özelliklerin geçici kısıtlanması"],
        ["Ciddi ihlal", "Hesabın askıya alınması"],
        ["Kesinlikle yasak içerik", "Hesabın kalıcı kapatılması, gerekirse yetkililere bildirim"],
      ] },
      { t: "p", m: <>Bir karara itiraz etmek ya da politikayı ihlal eden bir içeriği bildirmek için <a href={`mailto:${ILETISIM.guvenlik}`}>{ILETISIM.guvenlik}</a> adresine yaz. İtirazlar, ilk kararı vermeyen bir ekip üyesince incelenir.</> },
    ],
  },
];
