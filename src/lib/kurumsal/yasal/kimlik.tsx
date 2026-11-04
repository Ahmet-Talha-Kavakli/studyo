import type { YasalBolum } from "@/components/sirket/YasalBelge";
import { ILETISIM } from "@/lib/kurumsal/site";

export const KIMLIK_META = { yururluk: "3 Kasım 2026", surum: "1.0" };

export const KIMLIK_GECMIS = [
  { tarih: "3 Kasım 2026", not: "İlk yayın: karakter ve kimlik oluştururken verilen beyan ve rıza koşulları." },
];

export const KIMLIK: YasalBolum[] = [
  {
    id: "kapsam", baslik: "Bu koşullar neyi kapsar",
    kisaca: "Bir yüzü ya da kişiyi Vayra'ya karakter olarak yüklediğin her durumda bu koşullar geçerlidir.",
    bloklar: [
      { t: "p", m: "Bu koşullar; Karakter, Element, Influencer, Fans, Speak ve kimlik referansı alan diğer tüm araçlarda bir kişinin fotoğrafını, yüzünü ya da benzerliğini yüklediğinde, kaydettiğinde ya da bir karakteri derin eğitimle (LoRA) eğittiğinde geçerlidir. Bu metin; Kullanım Şartları, Kabul Edilebilir Kullanım Politikası ve Gizlilik Politikası ile birlikte okunur. Çelişki olursa kişinin haklarını daha güçlü koruyan hüküm uygulanır." },
    ],
  },
  {
    id: "beyan", baslik: "Onay kutusunu işaretleyerek verdiğin beyanlar",
    kisaca: "Kişi sensin ya da onun açık iznini aldın; kişi reşit; içeriği yanıltmak ya da zarar vermek için kullanmayacaksın.",
    bloklar: [
      { t: "liste", sirali: true, m: [
        <><b>Kimlik ya da izin.</b> Fotoğraflardaki kişi sensin ya da o kişiden, fotoğraflarının yapay zekâ ile yeni görsel ve video üretmek için kullanılmasına dair açık, özgür iradeyle verilmiş ve kanıtlanabilir izni aldın.</>,
        <><b>Yaş.</b> Fotoğraflardaki kişi 18 yaşını doldurmuştur. Reşit olmayan bir kişinin fotoğrafıyla karakter oluşturulamaz.</>,
        <><b>Hak sahipliği.</b> Fotoğrafların telif ve kullanım haklarına sahipsin ya da bu hakların sahibi kullanımına izin vermiştir.</>,
        <><b>Amaç.</b> Karakteri kişiyi yanıltıcı, aşağılayıcı, cinsel, taciz edici ya da kamuoyunu aldatıcı biçimde göstermek için kullanmayacaksın.</>,
        <><b>Doğruluk.</b> Bu beyanlar doğrudur; yanlış çıkması hâlinde doğacak sorumluluk sana aittir.</>,
      ] },
    ],
  },
  {
    id: "riza", baslik: "Başka bir kişinin iznini nasıl almalısın",
    kisaca: "İzin açık, belirli ve geri alınabilir olmalı; yazılı ve tarihli tutman önerilir.",
    bloklar: [
      { t: "liste", m: [
        "İzin; hangi fotoğrafların, hangi amaçla ve ne kadar süreyle kullanılacağını açıkça belirtmelidir.",
        "Sessizlik, önceden işaretlenmiş kutular ya da genel bir sosyal medya paylaşımı izin sayılmaz.",
        "İzni yazılı ve tarihli olarak (e-posta, imzalı metin ya da mesaj kaydı) saklaman, bir itirazda kanıt sunabilmen için önerilir.",
        "Kişi iznini istediği an geri alabilir. Geri aldığında karakteri silmen ve kişiyi gösteren içerikleri yayından kaldırman gerekir.",
        "Reklam, kampanya ya da ticari kullanımda ayrıca kişiyle imzalı bir kullanım sözleşmesi yapman gerekir.",
      ] },
    ],
  },
  {
    id: "yasak", baslik: "Kesinlikle yasak kullanımlar",
    kisaca: "Rızasız mahrem içerik, reşit olmayanlar, aldatıcı sahte içerik ve tacizde kullanmak yasaktır.",
    bloklar: [
      { t: "liste", m: [
        <><b>Rızasız mahrem içerik:</b> bir kişinin çıplak, cinsel ya da mahrem görüntüsünü üretmek.</>,
        <><b>Reşit olmayanlar:</b> 18 yaşından küçük herhangi bir kişinin benzerliğini kullanmak.</>,
        <><b>Aldatıcı sahte içerik:</b> kişiyi yapmadığı bir şeyi yapıyor ya da söylemediği bir şeyi söylüyor gibi, izleyiciyi yanıltacak biçimde göstermek.</>,
        <><b>Siyaset ve seçim:</b> siyasetçilerin ya da kamuya mal olmuş kişilerin benzerliğini kamuoyunu yanıltmak için kullanmak.</>,
        <><b>Taciz ve dolandırıcılık:</b> kişiyi tehdit etmek, küçük düşürmek, kimliğine bürünmek ya da onun adına çıkar sağlamak.</>,
      ] },
      { t: "not", m: "Bu kullanımlar otomatik güvenlik sistemlerimizce engellenir. Tespit edildiğinde karakter silinir, hesap askıya alınır ya da kalıcı kapatılır; gerektiğinde yetkili makamlara bildirilir." },
    ],
  },
  {
    id: "isleme", baslik: "Fotoğrafları nasıl işliyoruz",
    kisaca: "Fotoğraflar yalnız senin üretimlerin için kullanılır; genel modellerimizi eğitmek için kullanılmaz.",
    bloklar: [
      { t: "liste", m: [
        "Yüklediğin fotoğraflar şifreli depolamada saklanır ve yalnız senin başlattığın üretimlerde, seçtiğin modele kimlik referansı olarak gönderilir.",
        "Derin eğitimi seçersen fotoğraflarınla yalnız sana ait bir LoRA dosyası eğitilir. Bu dosya başka kullanıcılarla paylaşılmaz.",
        "Fotoğrafların Vayra'nın ya da iş ortaklarının genel yapay zekâ modellerini eğitmek için kullanılmaz.",
        "Tarayıcıda yapılan hazırlık ölçümü (netlik, ışık, çözünürlük) yalnız piksel değerlerine bakar; yüz tanıma ya da biyometrik eşleştirme yapılmaz.",
        "Üretim için fotoğraflar, hizmet sağlayıcılarımıza (model sağlayıcıları) yalnız o üretim süresince aktarılır. Ayrıntılar Gizlilik Politikası ve KVKK Aydınlatma Metni'ndedir.",
      ] },
    ],
  },
  {
    id: "saklama", baslik: "Saklama ve silme",
    kisaca: "Karakteri sildiğinde fotoğrafları ve LoRA dosyası 30 gün içinde kalıcı olarak silinir.",
    bloklar: [
      { t: "tablo", basliklar: ["Veri", "Ne kadar saklanır", "Nasıl silinir"], satirlar: [
        ["Referans fotoğraflar", "Karakter silinene kadar", "Karakter menüsünden Sil; 30 gün içinde kalıcı silinir"],
        ["Eğitilmiş LoRA dosyası", "Karakter silinene kadar", "Karakterle birlikte silinir"],
        ["Üretilen görsel ve videolar", "Sen silene kadar", "Kitaplıktan Sil; çöp kutusu 30 gün sonra boşalır"],
        ["Beyan ve onay kaydı", "Karakter silindikten sonra 2 yıl", "Yasal yükümlülük için saklanır, sonra imha edilir"],
      ] },
    ],
  },
  {
    id: "itiraz", baslik: "Fotoğrafı izinsiz kullanılan kişiler",
    kisaca: "Benzerliğinin izinsiz kullanıldığını düşünüyorsan bize yaz; inceleyip kaldırırız.",
    bloklar: [
      { t: "p", m: <>Vayra'da benzerliğinin izinsiz kullanıldığını düşünüyorsan <a href={`mailto:${ILETISIM.guvenlik}`} className="underline underline-offset-2">{ILETISIM.guvenlik}</a> adresine, içeriğin bağlantısı ve kimliğini doğrulayan bilgilerle yaz. Başvurunu en geç 72 saat içinde inceler, ilgili karakteri ve içerikleri kaldırır ve sonucu sana bildiririz. KVKK kapsamındaki diğer hakların için <a href={`mailto:${ILETISIM.kvkk}`} className="underline underline-offset-2">{ILETISIM.kvkk}</a> adresine başvurabilirsin.</> },
    ],
  },
  {
    id: "sorumluluk", baslik: "Sorumluluk",
    kisaca: "Beyanların yanlış çıkarsa doğacak taleplerden sen sorumlusun.",
    bloklar: [
      { t: "p", m: "Bu koşulları ihlal etmen ya da beyanlarının gerçeğe aykırı çıkması hâlinde, üçüncü kişilerin Vayra'ya yönelteceği talep, zarar ve masraflardan sorumlu olursun. Vayra, ihlal şüphesinde karakteri ve ilgili içerikleri önceden bildirmeksizin kaldırma ve hesabı askıya alma hakkını saklı tutar." },
    ],
  },
];
