/* Şablon: Aksoy Demirel Hukuk Bürosu — Levent'te avukatlık ortaklığı. Çalışma alanları, avukatlar, "makaleler" tablosundan
 * kategori süzgeçli yayınlar ve okuma sayfası, ön görüşme talebi ("basvurular" tablosu: ziyaretçi ekler, okuyamaz; karşı taraf
 * adıyla çıkar çatışması ön kontrolü için), KVKK aydınlatma metni. Reklam yasağına uygun, bilgilendirme amaçlı dil. */
import type { SablonTablo } from "./kurulum";
import { ORTAK_JS } from "./ortak";

const ALANLAR = [
  { id: "sirketler", ad: "Şirketler ve ticaret hukuku", kisa: "Kuruluş, ortaklık sözleşmeleri, pay devri, birleşme ve devralmalar.", uzun: "Şirketin kuruluşundan yönetim kurulu kararlarına, pay devrinden ortaklar arası uyuşmazlıklara kadar ticari hayatın gündelik ve kritik işlerinde yanınızdayız. Birleşme ve devralma süreçlerinde hukuki inceleme (due diligence) raporunu, sözleşme müzakeresini ve kapanış belgelerini tek ekiple yürütüyoruz.", konular: ["Anonim ve limited şirket kuruluşu", "Pay devri ve ortaklık sözleşmeleri", "Birleşme, devralma ve bölünme", "Genel kurul ve yönetim kurulu süreçleri", "Ticari sözleşmelerin hazırlanması"], sorumlu: "kemal" },
  { id: "is", ad: "İş hukuku", kisa: "İş sözleşmeleri, fesih süreçleri, arabuluculuk ve işe iade davaları.", uzun: "İşverenlere iş sözleşmesi, yönetmelik ve fesih süreçlerinde önleyici danışmanlık veriyor; çalışanları kıdem, ihbar ve fazla mesai alacaklarında temsil ediyoruz. Zorunlu arabuluculuk aşamasından itibaren dosyayı aynı avukat takip eder.", konular: ["İş sözleşmeleri ve işyeri yönetmelikleri", "Fesih bildirimi ve savunma süreçleri", "Kıdem, ihbar ve fazla mesai alacakları", "İşe iade davaları", "Zorunlu arabuluculuk görüşmeleri"], sorumlu: "can" },
  { id: "gayrimenkul", ad: "Gayrimenkul ve inşaat hukuku", kisa: "Kat karşılığı inşaat, tapu iptali, kira ve kentsel dönüşüm.", uzun: "Arsa payı karşılığı inşaat sözleşmelerinden kira tespit davalarına, kentsel dönüşümde malik toplantılarından tapu iptal ve tescil davalarına kadar taşınmazla ilgili bütün süreçleri ele alıyoruz. Alım öncesinde tapu ve imar kaydı incelemesi yapıyoruz.", konular: ["Kat karşılığı inşaat sözleşmeleri", "Kira tespit ve tahliye davaları", "Tapu iptal ve tescil davaları", "Kentsel dönüşüm süreçleri", "Alım öncesi tapu ve imar incelemesi"], sorumlu: "murat" },
  { id: "uyusmazlik", ad: "Ticari uyuşmazlıklar ve tahkim", kisa: "Ticaret mahkemelerinde dava takibi, ulusal ve uluslararası tahkim.", uzun: "Ticari alacak, haksız rekabet ve sözleşmeye aykırılık davalarını ticaret mahkemelerinde takip ediyoruz. İSTAC ve ICC kuralları altındaki tahkim yargılamalarında Türkçe ve İngilizce temsil sağlıyoruz. Dava açmadan önce uzlaşma ihtimalini birlikte değerlendiriyoruz.", konular: ["Ticari alacak davaları", "Haksız rekabet ve marka uyuşmazlıkları", "İSTAC ve ICC tahkim yargılamaları", "İhtiyati tedbir ve haciz talepleri", "Ticari arabuluculuk"], sorumlu: "selin" },
  { id: "aile", ad: "Aile hukuku", kisa: "Anlaşmalı ve çekişmeli boşanma, velayet, nafaka, mal rejimi.", uzun: "Aile hukuku dosyalarında önceliğimiz gizlilik ve çocukların üstün yararıdır. Anlaşmalı boşanma protokolünü titizlikle hazırlıyor, çekişmeli davalarda velayet, nafaka ve mal rejimi tasfiyesini birlikte planlıyoruz.", konular: ["Anlaşmalı boşanma protokolü", "Çekişmeli boşanma davaları", "Velayet ve kişisel ilişki düzenlemesi", "Nafaka davaları", "Edinilmiş mallara katılma alacağı"], sorumlu: "nesrin" },
  { id: "miras", ad: "Miras hukuku", kisa: "Vasiyetname, mirasçılık belgesi, tenkis ve ortaklığın giderilmesi.", uzun: "Mirasın paylaşımında aile içi anlaşmayı önceleyen bir yol izliyoruz. Vasiyetname ve miras sözleşmesi hazırlığından mirasçılık belgesine, tenkis ve ortaklığın giderilmesi davalarına kadar süreci yürütüyoruz.", konular: ["Vasiyetname ve miras sözleşmesi", "Mirasçılık belgesi (veraset ilamı)", "Mirasın reddi", "Tenkis ve muris muvazaası davaları", "Ortaklığın giderilmesi (izale-i şuyu)"], sorumlu: "nesrin" },
  { id: "kvkk", ad: "Kişisel veriler ve bilişim hukuku", kisa: "KVKK uyum projeleri, veri ihlali yönetimi, yazılım sözleşmeleri.", uzun: "Şirketlerin KVKK uyum sürecini veri envanterinden aydınlatma metinlerine, VERBİS kaydından veri ihlali bildirimine kadar uçtan uca kuruyoruz. Yazılım lisansı, SaaS ve e-ticaret sözleşmelerini hazırlıyoruz.", konular: ["KVKK uyum projeleri ve veri envanteri", "VERBİS kaydı ve aydınlatma metinleri", "Veri ihlali bildirimi ve Kurul süreçleri", "Yazılım lisansı ve SaaS sözleşmeleri", "E-ticaret mevzuatına uyum"], sorumlu: "baris" },
  { id: "icra", ad: "İcra ve iflas hukuku", kisa: "Alacak takibi, itirazın iptali, konkordato ve iflas süreçleri.", uzun: "Ticari alacakların ilamsız ve ilamlı takibini, itirazın iptali ve menfi tespit davalarını yürütüyoruz. Mali zorluk yaşayan şirketlere konkordato ve yeniden yapılandırma süreçlerinde danışmanlık veriyoruz.", konular: ["İlamlı ve ilamsız icra takibi", "İtirazın iptali ve menfi tespit davaları", "Konkordato süreçleri", "İflas ve iflasın ertelenmesi", "Alacaklılar adına masa işlemleri"], sorumlu: "zeynep" },
];

const AVUKATLAR = [
  { id: "kemal", ad: "Av. Kemal Aksoy", unvan: "Kurucu ortak", foto: "/gercek/muzik/vs-depo.webp", alanlar: ["sirketler", "uyusmazlik"], dil: "Türkçe, İngilizce", baro: "İstanbul Barosu, 1998", egitim: "Ankara Üniversitesi Hukuk Fakültesi; Londra Üniversitesi (King's College) ticaret hukuku yüksek lisansı", hakkinda: "Yirmi beş yılı aşkın meslek hayatında şirket birleşmeleri, ortaklık uyuşmazlıkları ve ticari sözleşmeler üzerine çalıştı. Büronun şirketler hukuku ekibini yönetiyor." },
  { id: "selin", ad: "Av. Selin Demirel", unvan: "Kurucu ortak", foto: "/gercek/muzik/vs-kuyu.webp", alanlar: ["uyusmazlik", "sirketler"], dil: "Türkçe, İngilizce, Almanca", baro: "İstanbul Barosu, 2001", egitim: "Galatasaray Üniversitesi Hukuk Fakültesi; Heidelberg Üniversitesi LL.M.", hakkinda: "Ticari uyuşmazlıklar ve tahkim alanında çalışıyor; İSTAC listesinde hakem. Almanca konuşan müvekkillerin dosyalarını doğrudan yürütüyor." },
  { id: "murat", ad: "Av. Murat Keskin", unvan: "Ortak", foto: "/gercek/paz/av-ryu.webp", alanlar: ["gayrimenkul", "icra"], dil: "Türkçe, İngilizce", baro: "İstanbul Barosu, 2006", egitim: "İstanbul Üniversitesi Hukuk Fakültesi", hakkinda: "Gayrimenkul ve inşaat hukuku ekibinin başında. Kentsel dönüşüm projelerinde malik toplulukları ve yüklenici firmalar adına çalışmalar yürüttü." },
  { id: "can", ad: "Av. Can Erdem", unvan: "Ortak", foto: "/gercek/paz/av-malik.webp", alanlar: ["is"], dil: "Türkçe, İngilizce", baro: "İstanbul Barosu, 2011", egitim: "Marmara Üniversitesi Hukuk Fakültesi; İş ve sosyal güvenlik hukuku yüksek lisansı", hakkinda: "İş hukuku alanında işveren danışmanlığı ve dava takibi yapıyor. Arabuluculuk görüşmelerinde tarafların uzlaşmasını önceleyen bir yaklaşımla çalışıyor." },
  { id: "nesrin", ad: "Av. Nesrin Öztürk", unvan: "Kıdemli avukat", foto: "/gercek/paz/av-jia.webp", alanlar: ["aile", "miras"], dil: "Türkçe, İngilizce", baro: "İstanbul Barosu, 2009", egitim: "Dokuz Eylül Üniversitesi Hukuk Fakültesi; aile arabuluculuğu sertifika programı", hakkinda: "Aile ve miras hukuku dosyalarını gizlilik ve özenle yürütüyor. Velayet davalarında pedagog ve uzman görüşleriyle birlikte çalışıyor." },
  { id: "baris", ad: "Av. Barış Tekin", unvan: "Kıdemli avukat", foto: "/gercek/paz/av-tae.webp", alanlar: ["kvkk", "sirketler"], dil: "Türkçe, İngilizce", baro: "İstanbul Barosu, 2014", egitim: "Bilkent Üniversitesi Hukuk Fakültesi; bilişim hukuku yüksek lisansı", hakkinda: "Kişisel verilerin korunması ve teknoloji sözleşmeleri üzerine çalışıyor. Girişimlere ve yazılım şirketlerine uyum danışmanlığı veriyor." },
  { id: "zeynep", ad: "Av. Zeynep Aral", unvan: "Avukat", foto: "/gercek/paz/av-naomi.webp", alanlar: ["icra", "gayrimenkul"], dil: "Türkçe, Fransızca", baro: "İstanbul Barosu, 2019", egitim: "Galatasaray Üniversitesi Hukuk Fakültesi", hakkinda: "İcra ve iflas hukuku ile kira uyuşmazlıklarında dava ve takip süreçlerini yürütüyor; konkordato dosyalarında ekibin bir parçası." },
];

const KATEGORILER = ["Şirketler", "İş hukuku", "Gayrimenkul", "Aile ve miras", "Kişisel veriler", "İcra"];

const MAKALELER = [
  { id: "kira-artis-2026", baslik: "Konut kiralarında artış nasıl hesaplanır?", kategori: "Gayrimenkul", tarih: "2026-10-21", yazar: "murat", okumaDk: 5, ozet: "Yenilenen kira dönemlerinde artış sınırı, beş yıllık süre sonunda kira tespiti ve sözleşmeye yazılan artış maddelerinin geçerliliği.", icerik: "Konut kiralarında artış oranı, Türk Borçlar Kanunu'nun 344. maddesine göre bir önceki kira yılında tüketici fiyat endeksindeki on iki aylık ortalama değişimi geçemez. Sözleşmeye bu sınırın üzerinde bir artış yazılmışsa, aşan kısım kiracıyı bağlamaz.\n\n## Beş yıl dolunca ne olur?\n\nBeş yıldan uzun süren kiralarda ve beş yıldan sonra yenilenen sözleşmelerde yeni kira bedeli; endeks değişimi, kiralananın durumu ve emsal kira bedelleri dikkate alınarak hâkim tarafından hakkaniyete uygun biçimde belirlenir. Bu nedenle beş yıllık sürenin dolduğu tarih, hem kiracı hem kiraya veren için önemlidir.\n\n## Arabuluculuk zorunlu mu?\n\nKira bedelinin tespiti ve uyarlanmasına ilişkin uyuşmazlıklarda dava açmadan önce arabulucuya başvurmak zorunludur. Arabuluculuk görüşmesinde anlaşma sağlanırsa, anlaşma belgesi ilam niteliğinde belge sayılır.\n\n## Pratik öneri\n\nKira artışını yazılı olarak ve hangi endekse dayandığını belirterek bildirin. Ödemeleri banka üzerinden, açıklamasına ilgili ayı yazarak yapın. Uyuşmazlık çıkarsa elinizdeki yazışmalar en güçlü delil olacaktır." },
  { id: "kvkk-ihlal", baslik: "Veri ihlali yaşandığında ilk 72 saat", kategori: "Kişisel veriler", tarih: "2026-10-08", yazar: "baris", okumaDk: 6, ozet: "Kişisel veri ihlalini Kurul'a bildirme süresi, ilgili kişilere bildirim ve ihlal sonrası alınması gereken teknik ve idari tedbirler.", icerik: "Kişisel Verileri Koruma Kurulu'nun kararına göre veri sorumlusu, ihlali öğrendiği andan itibaren en geç 72 saat içinde Kurul'a bildirimde bulunmalıdır. Bu süre, ihlalin bütün ayrıntılarının netleşmesini beklemeden işlemeye başlar.\n\n## İlk adımlar\n\nİhlalin kaynağını tespit edin, sızıntıyı durdurun ve kayıtları koruyun. Hangi veri kategorilerinin, kaç kişiyi etkilediğini çıkarın. Bilgi eksikse bildirim yapılır, eksik bilgiler sonradan tamamlanır.\n\n## İlgili kişilere bildirim\n\nEtkilenen kişilere de makul en kısa sürede, açık ve sade bir dille bildirim yapılmalıdır. Bildirimde ihlalin ne zaman gerçekleştiği, hangi verilerin etkilendiği ve kişilerin alabileceği önlemler yer almalıdır.\n\n## Sonrası\n\nİhlal müdahale planınızı yazılı hâle getirin, sorumluları belirleyin ve yılda en az bir kez tatbikat yapın. Hazırlıklı olmak, hem idari para cezası riskini hem de itibar kaybını azaltır." },
  { id: "kidem-tazminati", baslik: "Kıdem tazminatı hangi hâllerde ödenir?", kategori: "İş hukuku", tarih: "2026-09-24", yazar: "can", okumaDk: 4, ozet: "En az bir yıllık çalışma şartı, istifada kıdem tazminatı alınabilen hâller ve hesaplamada esas alınan giydirilmiş ücret.", icerik: "Kıdem tazminatına hak kazanmak için aynı işverene bağlı olarak en az bir yıl çalışmış olmak ve iş sözleşmesinin kanunda sayılan hâllerden biriyle sona ermesi gerekir.\n\n## İstifa eden çalışan alabilir mi?\n\nKural olarak istifa eden çalışan kıdem tazminatı alamaz. Ancak askerlik, emeklilik için gerekli yaş dışındaki şartların tamamlanması, kadın çalışanın evlilikten itibaren bir yıl içinde ayrılması ve haklı nedenle fesih hâllerinde istifa olsa da tazminat hakkı doğar.\n\n## Nasıl hesaplanır?\n\nHer tam yıl için otuz günlük brüt ücret esas alınır. Hesaplamada yalnız çıplak ücret değil, düzenli ödenen yol, yemek ve benzeri yardımlar da eklenerek giydirilmiş ücret bulunur. Tazminat tavanı her altı ayda bir güncellenir.\n\n## Zamanaşımı\n\nKıdem tazminatı alacağı için zamanaşımı süresi, iş sözleşmesinin sona erdiği tarihten itibaren beş yıldır. Dava açmadan önce arabulucuya başvurmak zorunludur." },
  { id: "pay-devri", baslik: "Limited şirkette pay devrinin şartları", kategori: "Şirketler", tarih: "2026-09-10", yazar: "kemal", okumaDk: 5, ozet: "Noter onaylı devir sözleşmesi, genel kurul onayı, pay defterine kayıt ve ticaret siciline tescil: adım adım limited şirket pay devri.", icerik: "Limited şirket paylarının devri, anonim şirketlerden farklı olarak sıkı şekil şartlarına bağlıdır. Devir sözleşmesinin yazılı yapılması ve imzaların noterce onaylanması gerekir.\n\n## Genel kurul onayı\n\nŞirket sözleşmesinde aksi öngörülmedikçe pay devri, ortaklar genel kurulunun onayıyla geçerlilik kazanır. Genel kurul, onay vermeyi sebep göstermeksizin reddedebilir.\n\n## Tescil\n\nOnaydan sonra devir pay defterine işlenir ve ticaret siciline tescil edilir. Tescil yapılmadan devir üçüncü kişilere karşı ileri sürülemez.\n\n## Vergi ve borç sorumluluğu\n\nDevreden ortağın kamu borçlarından sorumluluğu, devir tarihinden önceki dönem için devam edebilir. Devirden önce şirketin vergi ve SGK borç durumunu belgeleyen yazıları almanızı öneriyoruz." },
  { id: "anlasmali-bosanma", baslik: "Anlaşmalı boşanma protokolünde nelere dikkat edilmeli?", kategori: "Aile ve miras", tarih: "2026-08-27", yazar: "nesrin", okumaDk: 6, ozet: "Velayet, kişisel ilişki, nafaka ve mal paylaşımı maddelerinin açık yazılması; protokolün mahkemede onaylanması süreci.", icerik: "Anlaşmalı boşanma için evliliğin en az bir yıl sürmüş olması ve eşlerin birlikte başvurması ya da birinin davasını diğerinin kabul etmesi gerekir. Hâkim, tarafları bizzat dinler ve protokolü uygun bulursa onaylar.\n\n## Velayet ve kişisel ilişki\n\nOrtak çocukların velayetinin kime verileceği, diğer ebeveynle görüşme günleri, bayram ve tatil dönemleri protokolde açıkça yazılmalıdır. Belirsiz ifadeler ileride yeni davalara yol açar.\n\n## Nafaka ve mal paylaşımı\n\nİştirak ve yoksulluk nafakasının miktarı, artış yöntemi ve ödeme günü belirtilmelidir. Taşınmaz, araç ve birikimlerin nasıl paylaşılacağı ve tapu devirlerinin ne zaman yapılacağı yazılmazsa, mal rejimi tasfiyesi için ayrıca dava açılması gerekebilir.\n\n## Süre\n\nProtokol eksiksiz hazırlandığında anlaşmalı boşanma davası çoğunlukla tek duruşmada sonuçlanır." },
  { id: "itirazin-iptali", baslik: "İcra takibine itiraz edildiğinde alacaklı ne yapmalı?", kategori: "İcra", tarih: "2026-08-12", yazar: "zeynep", okumaDk: 4, ozet: "İlamsız takipte borçlunun itirazı, itirazın kaldırılması ile itirazın iptali davası arasındaki fark ve icra inkâr tazminatı.", icerik: "İlamsız icra takibinde borçlu, ödeme emrini tebliğ aldıktan sonra yedi gün içinde itiraz ederse takip durur. Alacaklının takibe devam edebilmesi için itirazı ortadan kaldırması gerekir.\n\n## İki yol\n\nAlacak imzası ikrar edilmiş bir belgeye dayanıyorsa, icra mahkemesinden itirazın kaldırılması istenebilir. Belgesi bu nitelikte değilse, genel mahkemede itirazın iptali davası açılır. Bu davanın, itirazın tebliğinden itibaren bir yıl içinde açılması gerekir.\n\n## İcra inkâr tazminatı\n\nBorçlunun itirazı haksız bulunursa, alacağın yüzde yirmisinden az olmamak üzere icra inkâr tazminatına hükmedilebilir. Bunun için alacağın likit, yani belirlenebilir olması aranır.\n\n## Ticari alacaklarda arabuluculuk\n\nTicari bir alacak için itirazın iptali davası açılmadan önce arabulucuya başvurmak zorunludur." },
].map((m) => ({ yayinda: true, ...m }));

const TABLOLAR: Record<string, SablonTablo> = {
  makaleler: {
    aciklama: "Yayınlar sayfasındaki makaleler. İçerikte paragraflar boş satırla ayrılır; '## ' ile başlayan satır ara başlık olur. yayinda kapalıysa gösterilmez.",
    kurallar: { okuma: "herkes", ekleme: "kapali", duzenleme: "kapali" },
    sema: [
      { ad: "baslik", tur: "metin", zorunlu: true },
      { ad: "kategori", tur: "secim", zorunlu: true, secenekler: KATEGORILER },
      { ad: "tarih", tur: "metin", zorunlu: true, aciklama: "YYYY-AA-GG" },
      { ad: "yazar", tur: "secim", secenekler: AVUKATLAR.map((a) => a.id), aciklama: "Avukat kimliği" },
      { ad: "okumaDk", tur: "sayi", aciklama: "Tahmini okuma süresi (dakika)" },
      { ad: "ozet", tur: "uzunMetin" },
      { ad: "icerik", tur: "uzunMetin" },
      { ad: "yayinda", tur: "mantiksal", varsayilan: true },
    ],
    kayitlar: MAKALELER,
  },
  basvurular: {
    aciklama: "Ön görüşme talepleri. Ziyaretçi ekleyebilir ama okuyamaz. Karşı taraf adı çıkar çatışması ön kontrolü içindir.",
    kurallar: { okuma: "kapali", ekleme: "herkes", duzenleme: "kapali" },
    sema: [
      { ad: "referans", tur: "metin", zorunlu: true },
      { ad: "ad", tur: "metin", zorunlu: true },
      { ad: "telefon", tur: "metin", zorunlu: true },
      { ad: "eposta", tur: "eposta", zorunlu: true },
      { ad: "kisiTuru", tur: "secim", secenekler: ["Bireysel", "Şirket"], zorunlu: true },
      { ad: "sirket", tur: "metin" },
      { ad: "alan", tur: "secim", zorunlu: true, secenekler: [...ALANLAR.map((a) => a.ad), "Emin değilim"] },
      { ad: "gorusme", tur: "secim", secenekler: ["Ofiste yüz yüze", "Görüntülü görüşme", "Telefon"], zorunlu: true },
      { ad: "karsiTaraf", tur: "metin", aciklama: "Çıkar çatışması kontrolü için" },
      { ad: "sureliIs", tur: "mantiksal", aciklama: "Tebligat ya da süreli bir iş var mı?" },
      { ad: "ozet", tur: "uzunMetin", zorunlu: true },
      { ad: "kvkk", tur: "mantiksal", zorunlu: true },
      { ad: "durum", tur: "secim", secenekler: ["Yeni", "Çatışma kontrolünde", "Görüşme planlandı", "Kapandı"], varsayilan: "Yeni" },
    ],
    kayitlar: [],
  },
};

const MENU = [["index.html", "Büro"], ["calisma-alanlari.html", "Çalışma alanları"], ["ekip.html", "Avukatlar"], ["yayinlar.html", "Yayınlar"], ["iletisim.html", "İletişim"]];

const ust = (aktif: string) => `<a class="atla" href="#icerik">İçeriğe geç</a>
<header class="ust">
  <a class="logo" href="index.html" aria-label="Aksoy Demirel Hukuk Bürosu ana sayfa"><span class="logo-ad">Aksoy <i>&amp;</i> Demirel</span><span class="logo-alt">Hukuk Bürosu</span></a>
  <nav class="menu" data-menu aria-label="Ana menü">
${MENU.map(([h, a]) => `    <a href="${h}"${h === aktif || (aktif === "yazi.html" && h === "yayinlar.html") ? ' aria-current="page"' : ""}>${a}</a>`).join("\n")}
    <a class="menu-gorusme" href="gorusme.html">Ön görüşme talebi</a>
  </nav>
  <a class="dugme cizgili ust-dugme" href="gorusme.html">Ön görüşme</a>
  <button class="menu-dugme" type="button" data-menu-ac aria-expanded="false" aria-label="Menüyü aç"><span></span><span></span></button>
</header>`;

const alt = `<footer class="alt">
  <div class="alt-ic">
    <div class="alt-marka"><span class="logo-ad">Aksoy <i>&amp;</i> Demirel</span><p>Aksoy Demirel Avukatlık Ortaklığı, İstanbul Barosu'na 1287 sicil numarasıyla kayıtlıdır.</p></div>
    <div><h4>Ofis</h4><p>Esentepe Mah. Büyükdere Cad. No: 127, Kat 14<br />Şişli / İstanbul</p><p>Levent metro durağına 4 dakika</p></div>
    <div><h4>Çalışma saatleri</h4><p>Pazartesi ile cuma 09.00 ile 18.30</p><p>Süreli işlerde hafta sonu nöbetçi avukat</p></div>
    <div><h4>İletişim</h4><p><a href="tel:+902122840500">0212 284 05 00</a></p><p><a href="mailto:buro@aksoydemirel.av.tr">buro@aksoydemirel.av.tr</a></p><p><a href="kvkk.html">KVKK aydınlatma metni</a></p></div>
  </div>
  <p class="alt-not">Bu site, Türkiye Barolar Birliği Meslek Kuralları ve Avukatlık Kanunu'nun reklam yasağına uygun olarak yalnız bilgilendirme amacıyla hazırlanmıştır. Sitedeki yazılar hukuki görüş yerine geçmez.</p>
</footer>`;

const sayfa = (dosya: string, baslik: string, aciklama: string, govde: string) => `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${baslik}</title>
  <meta name="description" content="${aciklama}" />
  <meta name="theme-color" content="#f5f1ea" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Manrope:wght@400;500;600;700&display=swap" />
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

const avukat = (id: string) => AVUKATLAR.find((a) => a.id === id)!;
const ok = '<svg class="ok" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

const STIL = String.raw`/* Aksoy Demirel Hukuk Bürosu — fildişi kâğıt, mürekkep, bordo ve pirinç; Cormorant Garamond ve Manrope. */
:root {
  --kagit: #f5f1ea; --kagit-koyu: #ece5d9; --kart: #fbf8f3; --murekkep: #1d1b18; --soluk: #5d574e; --silik: #8a8378;
  --bordo: #6e1f24; --bordo-koyu: #561418; --pirinc: #a8874f; --cizgi: rgba(29, 27, 24, .14); --cizgi-ince: rgba(29, 27, 24, .08);
  --serif: "Cormorant Garamond", "Times New Roman", serif; --sans: "Manrope", system-ui, sans-serif;
}
[hidden] { display: none !important; }
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; background: var(--kagit); color: var(--murekkep); font: 16px/1.65 var(--sans); -webkit-font-smoothing: antialiased; }
img { display: block; max-width: 100%; }
a { color: inherit; }
h1, h2, h3 { font-family: var(--serif); font-weight: 600; letter-spacing: -.01em; line-height: 1.05; margin: 0; }
:focus-visible { outline: 2px solid var(--bordo); outline-offset: 3px; }
.atla { position: absolute; left: -999px; top: 8px; background: var(--bordo); color: #fff; padding: 8px 14px; z-index: 50; }
.atla:focus { left: 12px; }
.kap { max-width: 1280px; margin: 0 auto; padding: 0 clamp(18px, 5vw, 56px); }

/* Üst */
.ust { position: sticky; top: 0; z-index: 30; display: flex; align-items: center; gap: 28px; padding: 16px clamp(18px, 5vw, 56px); background: color-mix(in srgb, var(--kagit) 92%, transparent); backdrop-filter: blur(10px); border-bottom: 1px solid var(--cizgi); }
.logo { display: grid; text-decoration: none; line-height: 1; }
.logo-ad { font-family: var(--serif); font-size: 27px; font-weight: 600; letter-spacing: -.01em; }
.logo-ad i { color: var(--bordo); font-weight: 500; }
.logo-alt { font-size: 11.5px; letter-spacing: .14em; color: var(--soluk); margin-top: 5px; font-weight: 600; }
.menu { display: flex; gap: 4px; margin-left: auto; }
.menu a { text-decoration: none; padding: 8px 12px; font-size: 14.5px; font-weight: 500; color: var(--soluk); border-bottom: 1px solid transparent; }
.menu a:hover { color: var(--murekkep); }
.menu a[aria-current] { color: var(--murekkep); border-bottom-color: var(--bordo); }
.menu .menu-gorusme { display: none; }
.menu-dugme { display: none; width: 46px; height: 46px; border: 1px solid var(--cizgi); background: transparent; cursor: pointer; flex-direction: column; justify-content: center; align-items: center; gap: 7px; }
.menu-dugme span { width: 20px; height: 1.5px; background: var(--murekkep); }
.dugme { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 50px; padding: 13px 26px; border: 1px solid var(--bordo); background: var(--bordo); color: #fff; font: 600 14.5px/1 var(--sans); letter-spacing: .01em; text-decoration: none; cursor: pointer; transition: background .2s, color .2s; }
.dugme:hover { background: var(--bordo-koyu); }
.dugme.cizgili { background: transparent; color: var(--bordo); }
.dugme.cizgili:hover { background: var(--bordo); color: #fff; }
.dugme[disabled] { opacity: .6; cursor: wait; }
.ust-dugme { min-height: 44px; padding: 10px 20px; }
.ok { width: 20px; height: 20px; flex: none; transition: transform .25s; }

/* Kahraman */
.kahraman { display: grid; grid-template-columns: 1.15fr .85fr; gap: clamp(28px, 5vw, 80px); align-items: end; padding-block: clamp(40px, 7vw, 96px) clamp(36px, 5vw, 64px); }
.ust-yazi { display: flex; align-items: center; gap: 14px; color: var(--bordo); font-size: 14px; font-weight: 600; margin: 0 0 26px; }
.ust-yazi::before { content: ""; width: 36px; height: 1px; background: var(--bordo); }
.kahraman h1 { font-size: clamp(46px, 6.6vw, 96px); font-weight: 500; line-height: .98; }
.kahraman h1 em { color: var(--bordo); font-style: italic; }
.kahraman .giris { font-size: 18.5px; color: var(--soluk); max-width: 560px; margin: 30px 0 34px; }
.eylemler { display: flex; flex-wrap: wrap; gap: 14px; align-items: center; }
.metin-bag { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14.5px; text-decoration: none; border-bottom: 1px solid var(--cizgi); padding: 12px 0; }
.metin-bag:hover { border-color: var(--murekkep); }
.metin-bag:hover .ok { transform: translateX(4px); }
.kahraman figure { margin: 0; }
.kahraman figure img { width: 100%; aspect-ratio: 4 / 5; object-fit: cover; object-position: 62% center; filter: saturate(.85); }
.kahraman figcaption { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; color: var(--silik); padding-top: 12px; border-top: 1px solid var(--cizgi); margin-top: 14px; }
.serit { display: grid; grid-template-columns: repeat(4, 1fr); border-block: 1px solid var(--cizgi); }
.serit div { padding: 26px 22px; border-right: 1px solid var(--cizgi); }
.serit div:last-child { border-right: 0; }
.serit b { display: block; font-family: var(--serif); font-size: clamp(34px, 3.6vw, 48px); font-weight: 500; line-height: 1; color: var(--bordo); }
.serit span { display: block; margin-top: 8px; font-size: 14px; color: var(--soluk); }

/* Bölümler */
.bolum { padding-block: clamp(56px, 8vw, 112px); }
.bolum-bas { display: grid; grid-template-columns: .9fr 1.1fr; gap: clamp(20px, 5vw, 80px); align-items: end; margin-bottom: clamp(30px, 4vw, 52px); }
.bolum-bas h2 { font-size: clamp(38px, 4.6vw, 64px); font-weight: 500; }
.bolum-bas h2 em { color: var(--bordo); }
.bolum-bas p { margin: 0; color: var(--soluk); font-size: 17px; max-width: 560px; }
.numara { font-family: var(--serif); font-style: italic; color: var(--pirinc); font-size: 20px; }
.alan-liste { border-top: 1px solid var(--murekkep); }
.alan-satir { display: grid; grid-template-columns: 70px 1fr 1.1fr 40px; gap: 24px; align-items: center; padding: 26px 8px; border-bottom: 1px solid var(--cizgi); text-decoration: none; transition: background .25s, padding .25s; }
.alan-satir h3 { font-size: clamp(25px, 2.4vw, 34px); font-weight: 500; }
.alan-satir p { margin: 0; color: var(--soluk); font-size: 15px; }
.alan-satir .ok { color: var(--bordo); justify-self: end; }
.alan-satir:hover { background: var(--kart); padding-inline: 20px; }
.alan-satir:hover .ok { transform: translateX(6px); }

.ilkeler { background: var(--bordo); color: #f1e3dc; }
.ilkeler .bolum-bas h2 { color: #fff; }
.ilkeler .bolum-bas p { color: #e3c9c1; }
.ilke-izgara { display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1px solid rgba(255, 255, 255, .25); }
.ilke-izgara div { padding: 30px 30px 6px 0; border-right: 1px solid rgba(255, 255, 255, .18); }
.ilke-izgara div + div { padding-left: 30px; }
.ilke-izgara div:last-child { border-right: 0; }
.ilke-izgara .numara { color: #e0bf8a; }
.ilke-izgara h3 { color: #fff; font-size: 28px; font-weight: 500; margin: 10px 0 10px; }
.ilke-izgara p { margin: 0 0 24px; font-size: 15.5px; }

.ekip-izgara { display: grid; grid-template-columns: repeat(4, 1fr); gap: 22px; }
.avukat { text-decoration: none; display: block; }
.avukat .foto { overflow: hidden; background: var(--kagit-koyu); aspect-ratio: 4 / 5; }
.avukat img { width: 100%; height: 100%; object-fit: cover; object-position: top; filter: grayscale(.35) contrast(1.02); transition: transform .5s, filter .4s; }
.avukat:hover img { transform: scale(1.03); filter: none; }
.avukat h3 { font-size: 25px; font-weight: 600; margin-top: 16px; }
.avukat p { margin: 4px 0 0; color: var(--soluk); font-size: 14px; }

.makale-izgara { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; border-top: 1px solid var(--murekkep); }
.makale-kart { display: flex; flex-direction: column; gap: 14px; padding: 28px 28px 32px 0; border-right: 1px solid var(--cizgi); text-decoration: none; min-height: 290px; }
.makale-kart + .makale-kart { padding-left: 28px; }
.makale-kart:last-child { border-right: 0; }
.ust-bilgi { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 13px; color: var(--silik); }
.ust-bilgi .kat { color: var(--bordo); font-weight: 600; }
.makale-kart h3 { font-size: 29px; font-weight: 500; line-height: 1.1; }
.makale-kart p { margin: 0; color: var(--soluk); font-size: 15px; flex: 1; }
.makale-kart .metin-bag { align-self: flex-start; border: 0; padding: 0; }
.makale-kart:hover h3 { color: var(--bordo); }
.makale-kart:hover .ok { transform: translateX(4px); }
.iskelet { min-height: 290px; padding: 28px 0; border-right: 1px solid var(--cizgi); }
.iskelet i { display: block; height: 14px; margin: 0 28px 14px 0; background: linear-gradient(90deg, var(--kagit-koyu), var(--kart), var(--kagit-koyu)); background-size: 200% 100%; animation: parla 1.4s infinite; }
.iskelet i:nth-child(2) { height: 34px; }
@keyframes parla { to { background-position: -200% 0; } }

.cagri { display: grid; grid-template-columns: 1.2fr .8fr; gap: clamp(24px, 5vw, 72px); align-items: center; padding: clamp(36px, 5vw, 64px); background: var(--kart); border: 1px solid var(--cizgi); }
.cagri h2 { font-size: clamp(34px, 4vw, 54px); font-weight: 500; }
.cagri p { color: var(--soluk); margin: 16px 0 0; }
.cagri .yan { display: grid; gap: 14px; }
.cagri .tel { font-family: var(--serif); font-size: 34px; text-decoration: none; color: var(--bordo); }

/* Ara sayfa başlığı */
.sayfa-bas { padding-block: clamp(44px, 6vw, 88px) clamp(28px, 4vw, 48px); border-bottom: 1px solid var(--cizgi); }
.sayfa-bas h1 { font-size: clamp(46px, 6vw, 84px); font-weight: 500; }
.sayfa-bas h1 em { color: var(--bordo); }
.sayfa-bas p { color: var(--soluk); font-size: 18px; max-width: 680px; margin: 22px 0 0; }

/* Çalışma alanları sayfası */
.alanlar-duzen { display: grid; grid-template-columns: 260px 1fr; gap: clamp(28px, 5vw, 72px); padding-block: clamp(36px, 5vw, 64px); }
.alan-dizin { position: sticky; top: 104px; align-self: start; display: grid; gap: 2px; }
.alan-dizin a { display: flex; gap: 12px; padding: 9px 0; text-decoration: none; font-size: 14.5px; color: var(--soluk); border-bottom: 1px solid var(--cizgi-ince); }
.alan-dizin a span { font-family: var(--serif); font-style: italic; color: var(--pirinc); width: 22px; }
.alan-dizin a:hover, .alan-dizin a.aktif { color: var(--murekkep); }
.alan-detay { padding: 0 0 clamp(36px, 5vw, 56px); margin-bottom: clamp(36px, 5vw, 56px); border-bottom: 1px solid var(--cizgi); scroll-margin-top: 110px; }
.alan-detay:last-child { border-bottom: 0; }
.alan-detay h2 { font-size: clamp(34px, 4vw, 52px); font-weight: 500; margin: 6px 0 18px; }
.alan-detay > p { font-size: 17px; color: var(--soluk); max-width: 760px; margin: 0; }
.alan-ic { display: grid; grid-template-columns: 1.3fr 1fr; gap: 28px; margin-top: 28px; }
.alan-ic h4 { margin: 0 0 10px; font-size: 13px; font-weight: 700; letter-spacing: .04em; color: var(--murekkep); }
.alan-ic ul { margin: 0; padding: 0; list-style: none; }
.alan-ic li { padding: 10px 0 10px 26px; border-bottom: 1px solid var(--cizgi-ince); position: relative; font-size: 15.5px; }
.alan-ic li::before { content: ""; position: absolute; left: 2px; top: 20px; width: 12px; height: 1px; background: var(--bordo); }
.sorumlu { display: flex; gap: 16px; align-items: center; padding: 18px; background: var(--kart); border: 1px solid var(--cizgi-ince); text-decoration: none; }
.sorumlu img { width: 72px; height: 88px; object-fit: cover; object-position: top; }
.sorumlu b { font-family: var(--serif); font-size: 22px; font-weight: 600; display: block; line-height: 1.1; }
.sorumlu span { font-size: 13.5px; color: var(--soluk); }
.alan-ic .dugme { margin-top: 14px; width: 100%; }

/* Avukatlar sayfası */
.profil { display: grid; grid-template-columns: 340px 1fr; gap: clamp(24px, 5vw, 72px); padding-block: clamp(36px, 5vw, 60px); border-bottom: 1px solid var(--cizgi); scroll-margin-top: 96px; }
.profil .foto { aspect-ratio: 4 / 5; overflow: hidden; background: var(--kagit-koyu); }
.profil .foto img { width: 100%; height: 100%; object-fit: cover; object-position: top; }
.profil h2 { font-size: clamp(36px, 4vw, 54px); font-weight: 500; }
.profil .unvan { color: var(--bordo); font-weight: 600; margin: 6px 0 20px; }
.profil > div > p { color: var(--soluk); font-size: 17px; max-width: 680px; }
.profil dl { display: grid; grid-template-columns: 150px 1fr; margin: 26px 0; border-top: 1px solid var(--cizgi); max-width: 680px; }
.profil dt, .profil dd { margin: 0; padding: 12px 0; border-bottom: 1px solid var(--cizgi-ince); font-size: 15px; }
.profil dt { color: var(--silik); }
.profil dd a { text-decoration: none; border-bottom: 1px solid var(--cizgi); }
.profil dd a:hover { border-color: var(--bordo); color: var(--bordo); }

/* Yayınlar */
.suzgec { display: flex; flex-wrap: wrap; gap: 8px; margin: 30px 0 0; }
.suzgec button { min-height: 44px; padding: 10px 18px; border: 1px solid var(--cizgi); background: transparent; font: 500 14px var(--sans); color: var(--soluk); cursor: pointer; }
.suzgec button:hover { color: var(--murekkep); border-color: var(--murekkep); }
.suzgec button[aria-pressed="true"] { background: var(--murekkep); border-color: var(--murekkep); color: var(--kagit); }
.yayin-liste { padding-block: 12px clamp(48px, 6vw, 88px); }
.yayin { display: grid; grid-template-columns: 170px 1fr 220px; gap: 28px; padding: 32px 0; border-bottom: 1px solid var(--cizgi); text-decoration: none; align-items: start; }
.yayin time { font-size: 14px; color: var(--silik); padding-top: 8px; }
.yayin h2 { font-size: clamp(28px, 3vw, 38px); font-weight: 500; }
.yayin p { margin: 10px 0 0; color: var(--soluk); max-width: 640px; }
.yayin .yazar { display: flex; gap: 12px; align-items: center; font-size: 14px; color: var(--soluk); padding-top: 6px; }
.yayin .yazar img { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; object-position: top; }
.yayin:hover h2 { color: var(--bordo); }
.bos { padding: 48px 0; color: var(--soluk); font-size: 17px; }

/* Yazı */
.ilerleme { position: fixed; left: 0; top: 0; height: 3px; width: 0; background: var(--bordo); z-index: 40; }
.yazi { max-width: 760px; margin: 0 auto; padding: clamp(40px, 6vw, 80px) clamp(18px, 5vw, 32px) 40px; }
.yazi .geri { display: inline-flex; gap: 8px; align-items: center; font-size: 14px; color: var(--soluk); text-decoration: none; margin-bottom: 30px; min-height: 44px; }
.yazi .geri .ok { transform: rotate(180deg); }
.yazi h1 { font-size: clamp(40px, 5.4vw, 66px); font-weight: 500; margin: 18px 0 22px; }
.yazi .ozet { font-family: var(--serif); font-size: clamp(22px, 2.4vw, 27px); line-height: 1.35; font-style: italic; color: var(--soluk); margin: 0 0 30px; }
.yazi-yazar { display: flex; gap: 14px; align-items: center; padding: 18px 0; border-block: 1px solid var(--cizgi); margin-bottom: 34px; text-decoration: none; }
.yazi-yazar img { width: 54px; height: 54px; border-radius: 50%; object-fit: cover; object-position: top; }
.yazi-yazar b { display: block; font-size: 15px; }
.yazi-yazar span { font-size: 13.5px; color: var(--silik); }
.govde p { font-size: 18px; line-height: 1.8; margin: 0 0 22px; }
.govde h2 { font-size: 32px; font-weight: 600; margin: 40px 0 14px; }
.govde > p:first-child::first-letter { float: left; font-family: var(--serif); font-size: 84px; line-height: .8; padding: 8px 12px 0 0; color: var(--bordo); }
.uyari { margin-top: 36px; padding: 20px 22px; background: var(--kart); border-left: 2px solid var(--pirinc); color: var(--soluk); font-size: 15px; }
.ilgili { border-top: 1px solid var(--cizgi); }

/* Görüşme formu */
.gorusme { display: grid; grid-template-columns: 1fr 360px; gap: clamp(24px, 5vw, 72px); padding-block: clamp(36px, 5vw, 64px) clamp(56px, 7vw, 96px); align-items: start; }
.gorusme > * { min-width: 0; }
.form-blok { border-top: 1px solid var(--murekkep); padding: 26px 0 30px; }
.form-blok h2 { font-size: 30px; font-weight: 500; margin-bottom: 20px; display: flex; gap: 14px; align-items: baseline; }
.ikili { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.alan { display: grid; gap: 8px; font-size: 14px; font-weight: 600; margin-bottom: 18px; }
.alan small { font-weight: 400; color: var(--silik); font-size: 13px; }
.alan input, .alan select, .alan textarea { width: 100%; min-height: 52px; padding: 13px 15px; border: 1px solid var(--cizgi); border-radius: 0; background: var(--kart); color: var(--murekkep); font: 500 16px var(--sans); }
.alan textarea { resize: vertical; min-height: 140px; line-height: 1.6; }
.alan input:focus, .alan select:focus, .alan textarea:focus { outline: none; border-color: var(--bordo); background: #fff; }
.secenekler { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 18px; }
.secenekler.iki { grid-template-columns: 1fr 1fr; }
.secenek { position: relative; }
.secenek input { position: absolute; opacity: 0; inset: 0; cursor: pointer; }
.secenek span { display: flex; flex-direction: column; justify-content: center; gap: 3px; min-height: 64px; padding: 12px 16px; border: 1px solid var(--cizgi); background: var(--kart); font-weight: 600; font-size: 15px; }
.secenek span small { font-weight: 400; color: var(--silik); font-size: 13px; }
.secenek input:checked + span { border-color: var(--bordo); box-shadow: inset 0 0 0 1px var(--bordo); color: var(--bordo); }
.secenek input:focus-visible + span { outline: 2px solid var(--bordo); outline-offset: 2px; }
.onay { display: flex; gap: 12px; align-items: flex-start; font-size: 14.5px; color: var(--soluk); margin: 6px 0 14px; cursor: pointer; }
.onay input { width: 22px; height: 22px; margin: 1px 0 0; accent-color: var(--bordo); flex: none; }
.sayac { text-align: right; font-weight: 400; color: var(--silik); font-size: 12.5px; }
.yan-kutu { position: sticky; top: 104px; background: var(--murekkep); color: #d9d2c6; padding: 30px; }
.yan-kutu h3 { color: #fff; font-size: 28px; font-weight: 500; margin-bottom: 18px; }
.yan-kutu ol { margin: 0 0 22px; padding: 0; list-style: none; counter-reset: a; }
.yan-kutu li { counter-increment: a; display: grid; grid-template-columns: 30px 1fr; gap: 6px; padding: 12px 0; border-bottom: 1px solid rgba(255, 255, 255, .12); font-size: 14.5px; }
.yan-kutu li::before { content: counter(a); font-family: var(--serif); font-style: italic; color: #d6b27a; font-size: 20px; line-height: 1.1; }
.yan-kutu p { font-size: 13.5px; margin: 0 0 10px; }
.yan-kutu a { color: #fff; white-space: nowrap; }
.gonder { width: 100%; margin-top: 8px; }
.mesaj { padding: 16px 18px; margin: 14px 0 0; font-size: 15px; border-left: 2px solid; }
.mesaj b { display: block; }
.mesaj.hata { background: #f7e4e1; color: #7a1d1d; }
.mesaj.bilgi { background: #f4ecd9; color: #5f4710; }
.basari { max-width: 760px; margin: 0 auto; padding: clamp(48px, 7vw, 96px) clamp(18px, 5vw, 32px); text-align: center; }
.basari .muhur { width: 84px; height: 84px; margin: 0 auto 26px; border: 1px solid var(--bordo); border-radius: 50%; display: grid; place-items: center; color: var(--bordo); }
.basari .muhur svg { width: 34px; }
.basari h1 { font-size: clamp(40px, 5vw, 60px); font-weight: 500; }
.basari p { color: var(--soluk); font-size: 17px; }
.basari dl { display: grid; grid-template-columns: auto 1fr; text-align: left; margin: 30px 0; border-top: 1px solid var(--cizgi); }
.basari dt, .basari dd { margin: 0; padding: 12px 0; border-bottom: 1px solid var(--cizgi-ince); }
.basari dt { color: var(--silik); padding-right: 24px; }
.basari dd { font-weight: 600; }
.basari .ref { font-family: var(--serif); font-size: 30px; color: var(--bordo); }

/* İletişim */
.iletisim { display: grid; grid-template-columns: 1fr 1.2fr; gap: clamp(24px, 5vw, 64px); padding-block: clamp(36px, 5vw, 64px) clamp(56px, 7vw, 96px); }
.iletisim dl { margin: 0; border-top: 1px solid var(--murekkep); }
.iletisim dt { font-size: 13px; color: var(--silik); padding-top: 18px; }
.iletisim dd { margin: 4px 0 0; padding-bottom: 18px; border-bottom: 1px solid var(--cizgi); font-family: var(--serif); font-size: 26px; line-height: 1.25; }
.iletisim dd a { text-decoration: none; }
.iletisim dd a:hover { color: var(--bordo); }
.harita { display: grid; gap: 14px; }
.harita iframe { width: 100%; min-height: 420px; height: 100%; border: 1px solid var(--cizgi); filter: grayscale(.8) sepia(.15); background: var(--kagit-koyu); }
.harita img { width: 100%; aspect-ratio: 16 / 7; object-fit: cover; }

.metin { max-width: 820px; padding-block: clamp(36px, 5vw, 64px); }
.metin h2 { font-size: 30px; font-weight: 600; margin: 34px 0 10px; }
.metin p, .metin li { color: var(--soluk); }
.metin table { width: 100%; border-collapse: collapse; font-size: 15px; }
.metin th, .metin td { text-align: left; padding: 11px 10px 11px 0; border-bottom: 1px solid var(--cizgi); vertical-align: top; }
.tablo-kap { overflow-x: auto; }

/* Alt */
.alt { background: var(--murekkep); color: #b9b1a4; padding: clamp(48px, 6vw, 72px) clamp(18px, 5vw, 56px) 28px; }
.alt-ic { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 32px; }
.alt .logo-ad { color: #fff; font-size: 30px; }
.alt .logo-ad i { color: #d6b27a; }
.alt h4 { color: #fff; margin: 0 0 10px; font-size: 13px; font-weight: 700; letter-spacing: .04em; }
.alt p { margin: 6px 0; font-size: 14.5px; }
.alt a { color: #ece4d6; text-decoration: none; }
.alt a:hover { color: #fff; text-decoration: underline; }
.alt-not { max-width: 1280px; margin: 40px auto 0; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, .12); font-size: 13px; color: #8f887c; }
.bildirim { position: fixed; left: 50%; bottom: 22px; transform: translate(-50%, 180%); background: var(--murekkep); color: #fff; padding: 14px 22px; font-weight: 600; font-size: 14.5px; z-index: 60; transition: transform .35s; max-width: calc(100vw - 32px); }
.bildirim.acik { transform: translate(-50%, 0); }

@media (max-width: 1080px) {
  .ekip-izgara { grid-template-columns: repeat(2, 1fr); }
  .alan-satir { grid-template-columns: 56px 1fr 40px; }
  .alan-satir p { grid-column: 2; grid-row: 2; }
  .alan-satir .ok { grid-row: 1 / span 2; grid-column: 3; }
  .alt-ic { grid-template-columns: 1fr 1fr; }
  .yayin { grid-template-columns: 130px 1fr; }
  .yayin .yazar { grid-column: 2; }
}
@media (max-width: 900px) {
  .menu { display: none; position: absolute; left: 0; right: 0; top: 100%; flex-direction: column; gap: 0; background: var(--kagit); border-bottom: 1px solid var(--cizgi); padding: 8px clamp(18px, 5vw, 56px) 18px; }
  .menu.acik { display: flex; }
  .menu a { padding: 15px 0; font-size: 20px; font-family: var(--serif); color: var(--murekkep); border-bottom: 1px solid var(--cizgi-ince); }
  .menu a[aria-current] { color: var(--bordo); border-bottom-color: var(--cizgi-ince); }
  .menu .menu-gorusme { display: block; color: var(--bordo); }
  .menu-dugme { display: inline-flex; margin-left: auto; }
  .ust-dugme { display: none; }
  .kahraman, .bolum-bas, .cagri, .alan-ic, .gorusme, .iletisim, .profil { grid-template-columns: 1fr; }
  .kahraman figure img { aspect-ratio: 16 / 11; }
  .serit { grid-template-columns: 1fr 1fr; }
  .serit div:nth-child(2) { border-right: 0; }
  .serit div:nth-child(-n+2) { border-bottom: 1px solid var(--cizgi); }
  .ilke-izgara { grid-template-columns: 1fr; }
  .ilke-izgara div, .ilke-izgara div + div { padding: 24px 0 2px; border-right: 0; border-bottom: 1px solid rgba(255, 255, 255, .18); }
  .makale-izgara { grid-template-columns: 1fr; }
  .makale-kart, .makale-kart + .makale-kart { padding: 26px 0; border-right: 0; border-bottom: 1px solid var(--cizgi); min-height: 0; }
  .iskelet { border-right: 0; min-height: 180px; }
  .alanlar-duzen { grid-template-columns: 1fr; }
  .alan-dizin { position: static; display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: none; }
  .alan-dizin a { flex: none; border: 1px solid var(--cizgi); padding: 10px 14px; min-height: 44px; align-items: center; }
  .profil .foto { max-width: 360px; }
  .yan-kutu { position: static; }
}
@media (max-width: 560px) {
  .logo-ad { font-size: 23px; }
  .logo-alt { font-size: 10.5px; }
  .serit div { padding: 20px 14px; }
  .alan-satir { grid-template-columns: 36px 1fr 24px; gap: 4px 14px; padding: 22px 0; }
  .alan-satir:hover { padding-inline: 0; }
  .ekip-izgara { gap: 14px; }
  .avukat h3 { font-size: 21px; }
  .avukat p { font-size: 13px; }
  .ikili, .secenekler, .secenekler.iki { grid-template-columns: 1fr; }
  .secenek span { min-height: 54px; }
  .yayin { grid-template-columns: 1fr; gap: 10px; padding: 26px 0; }
  .yayin time { padding: 0; }
  .yayin .yazar { grid-column: 1; }
  .profil dl { grid-template-columns: 1fr; }
  .profil dt { padding-bottom: 0; border-bottom: 0; }
  .alt-ic { grid-template-columns: 1fr; }
  .govde p { font-size: 17px; }
  .cagri .tel { font-size: 28px; }
  .harita iframe { min-height: 300px; }
}
@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; scroll-behavior: auto !important; } }
`;

const UYGULAMA = ORTAK_JS + String.raw`
/* ── Aksoy Demirel Hukuk Bürosu ──
 * Yayınlar "makaleler" tablosundan okunur (tablo yoksa ya da canlı önizlemedeyse aşağıdaki gömülü kopya kullanılır).
 * Ön görüşme talebi "basvurular" tablosuna yazılır: ziyaretçi ekleyebilir, okuyamaz. */
var AVUKATLAR = ${JSON.stringify(AVUKATLAR.map(({ id, ad, unvan, foto }) => ({ id, ad, unvan, foto })))};
var ALANLAR = ${JSON.stringify(ALANLAR.map(({ id, ad }) => ({ id, ad })))};
var YEDEK_MAKALELER = ${JSON.stringify(MAKALELER)};
var SAYFA = document.body.dataset.sayfa;
var OK = '<svg class="ok" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
function avukat(id) { return AVUKATLAR.find(function (a) { return a.id === id; }) || null; }

var makaleSoz = null;
function makaleler() {
  if (!makaleSoz) makaleSoz = (veriVar() ? vayra.veri.liste("makaleler", { sirala: "tarih", yon: "azalan", sinir: 200 }) : Promise.resolve(YEDEK_MAKALELER.slice()))
    .catch(function () { return YEDEK_MAKALELER.slice(); })
    .then(function (l) { return l.filter(function (m) { return m.yayinda !== false; }).sort(function (a, b) { return String(b.tarih).localeCompare(String(a.tarih)); }); });
  return makaleSoz;
}
function tarihUzun(t) { return /^\d{4}-\d{2}-\d{2}$/.test(t || "") ? tarihYaz(t, { year: "numeric" }) : ""; }
function kart(m) {
  var y = avukat(m.yazar);
  return '<a class="makale-kart" href="yazi.html?id=' + encodeURIComponent(m.id) + '"><div class="ust-bilgi"><span class="kat">' + kacir(m.kategori) + "</span><time>" + tarihUzun(m.tarih) + "</time></div><h3>" + kacir(m.baslik) + "</h3><p>" + kacir(m.ozet) + '</p><span class="metin-bag">' + (y ? kacir(y.ad) : "Devamını oku") + " " + OK + "</span></a>";
}

/* Ana sayfa: son üç yayın */
if ($("#sonYayinlar")) {
  makaleler().then(function (l) {
    $("#sonYayinlar").innerHTML = l.length ? l.slice(0, 3).map(kart).join("") : '<p class="bos">Henüz yayın yok.</p>';
  });
}

/* Çalışma alanları: kenar dizininde görünür bölümü işaretle */
if (SAYFA === "calisma-alanlari" && "IntersectionObserver" in window) {
  var dizin = $$(".alan-dizin a");
  var gozcu = new IntersectionObserver(function (g) {
    g.forEach(function (x) { if (x.isIntersecting) dizin.forEach(function (a) { a.classList.toggle("aktif", a.getAttribute("href") === "#" + x.target.id); }); });
  }, { rootMargin: "-30% 0px -60% 0px" });
  $$(".alan-detay").forEach(function (b) { gozcu.observe(b); });
}

/* Yayınlar: kategori süzgeci (adreste ?kategori=) */
if (SAYFA === "yayinlar") {
  var liste = $("#yayinListe"), q = new URLSearchParams(location.search), secili = q.get("kategori") || "Hepsi";
  function ciz(l) {
    $$(".suzgec button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.kategori === secili)); });
    var g = l.filter(function (m) { return secili === "Hepsi" || m.kategori === secili; });
    $("#yayinSayi").textContent = g.length + " yazı";
    liste.innerHTML = g.length ? g.map(function (m) {
      var y = avukat(m.yazar);
      return '<a class="yayin" href="yazi.html?id=' + encodeURIComponent(m.id) + '"><time>' + tarihUzun(m.tarih) + "</time><div><div class=\"ust-bilgi\"><span class=\"kat\">" + kacir(m.kategori) + "</span><span>" + (Number(m.okumaDk) || 4) + " dakikalık okuma</span></div><h2>" + kacir(m.baslik) + "</h2><p>" + kacir(m.ozet) + "</p></div>" + (y ? '<span class="yazar"><img src="' + y.foto + '" alt="" loading="lazy" />' + kacir(y.ad) + "</span>" : "<span></span>") + "</a>";
    }).join("") : '<p class="bos">Bu kategoride henüz yazı yok. <a href="yayinlar.html">Bütün yazılara dön</a>.</p>';
  }
  makaleler().then(function (l) {
    ciz(l);
    $(".suzgec").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      secili = b.dataset.kategori; ciz(l);
      history.replaceState(null, "", secili === "Hepsi" ? "yayinlar.html" : "yayinlar.html?kategori=" + encodeURIComponent(secili));
    });
  });
}

/* Yazı sayfası */
if (SAYFA === "yazi") {
  var yid = new URLSearchParams(location.search).get("id");
  makaleler().then(function (l) {
    var m = l.find(function (x) { return x.id === yid; }) || l[0];
    var yer = $("#yazi");
    if (!m) { yer.innerHTML = '<p class="bos">Yazı bulunamadı. <a href="yayinlar.html">Yayınlara dön</a>.</p>'; return; }
    document.title = m.baslik + " · Aksoy Demirel Hukuk Bürosu";
    var y = avukat(m.yazar);
    var govde = String(m.icerik || "").split(/\n\s*\n/).map(function (p) {
      p = p.trim(); if (!p) return "";
      return p.indexOf("## ") === 0 ? "<h2>" + kacir(p.slice(3)) + "</h2>" : "<p>" + kacir(p) + "</p>";
    }).join("");
    yer.innerHTML = '<a class="geri" href="yayinlar.html">' + OK + ' Bütün yayınlar</a><div class="ust-bilgi"><span class="kat">' + kacir(m.kategori) + "</span><time>" + tarihUzun(m.tarih) + "</time><span>" + (Number(m.okumaDk) || 4) + " dakikalık okuma</span></div><h1>" + kacir(m.baslik) + '</h1><p class="ozet">' + kacir(m.ozet) + "</p>"
      + (y ? '<a class="yazi-yazar" href="ekip.html#' + y.id + '"><img src="' + y.foto + '" alt="" /><div><b>' + kacir(y.ad) + "</b><span>" + kacir(y.unvan) + "</span></div></a>" : "")
      + '<div class="govde">' + govde + '</div><p class="uyari">Bu yazı genel bilgilendirme amaçlıdır, somut bir olaya ilişkin hukuki görüş değildir. Mevzuat ve içtihat değişebilir; durumunuz için bir avukata danışın.</p>';
    var ilgili = l.filter(function (x) { return x.id !== m.id; }).sort(function (a, b) { return (b.kategori === m.kategori) - (a.kategori === m.kategori); }).slice(0, 3);
    $("#ilgili").innerHTML = ilgili.map(kart).join("");
  });
  var cubuk = $(".ilerleme");
  window.addEventListener("scroll", function () {
    var h = document.documentElement, toplam = h.scrollHeight - innerHeight;
    cubuk.style.width = (toplam > 0 ? Math.min(100, (h.scrollTop / toplam) * 100) : 0) + "vw";
  }, { passive: true });
}

/* Ön görüşme talebi */
if (SAYFA === "gorusme") {
  var form = $("#gorusmeFormu"), mesaj = $("#mesaj"), q2 = new URLSearchParams(location.search);
  var alanSec = form.elements.alan;
  alanSec.innerHTML = '<option value="">Konu seçin</option>' + ALANLAR.map(function (a) { return '<option value="' + kacir(a.ad) + '">' + kacir(a.ad) + "</option>"; }).join("") + '<option value="Emin değilim">Emin değilim</option>';
  var gelen = ALANLAR.find(function (a) { return a.id === q2.get("alan"); });
  if (gelen) alanSec.value = gelen.ad;
  function sirketGoster() { var s = form.elements.kisiTuru.value === "Şirket"; $("#sirketAlan").hidden = !s; form.elements.sirket.required = s; }
  $$("input[name=kisiTuru]").forEach(function (r) { r.addEventListener("change", sirketGoster); });
  sirketGoster();
  var ozetAlan = form.elements.ozet;
  ozetAlan.addEventListener("input", function () { $("#ozetSayac").textContent = ozetAlan.value.length + " / 1500"; });
  function goster(tur, baslik, metin) { mesaj.hidden = false; mesaj.className = "mesaj " + tur; mesaj.innerHTML = "<b>" + kacir(baslik) + "</b>" + kacir(metin || ""); mesaj.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
  function referans() { var h = "ABCDEFGHJKLMNPRSTUVYZ23456789", s = ""; for (var i = 0; i < 5; i++) s += h.charAt(Math.floor(Math.random() * h.length)); return "AD-" + istanbul().tarih.slice(2, 4) + "-" + s; }
  form.addEventListener("submit", function (e) {
    e.preventDefault(); mesaj.hidden = true;
    if (!form.reportValidity()) return;
    var f = new FormData(form);
    var tel = String(f.get("telefon")).replace(/\s/g, "");
    if (!/^(\+90|0)?5\d{9}$|^(\+90|0)?[2-4]\d{9}$/.test(tel)) return goster("hata", "Telefon numarası geçersiz.", " 0532 123 45 67 ya da 0212 284 05 00 biçiminde yazın.");
    if (String(f.get("ozet")).trim().length < 30) return goster("hata", "Konuyu biraz daha açın.", " Kısa bir özet, doğru avukatı yönlendirmemize yardımcı olur.");
    var k = { referans: referans(), ad: String(f.get("ad")).trim(), telefon: String(f.get("telefon")).trim(), eposta: String(f.get("eposta")).trim(), kisiTuru: f.get("kisiTuru"), sirket: String(f.get("sirket") || "").trim() || null, alan: f.get("alan"), gorusme: f.get("gorusme"), karsiTaraf: String(f.get("karsiTaraf") || "").trim() || null, sureliIs: f.get("sureliIs") === "on", ozet: String(f.get("ozet")).trim(), kvkk: true };
    if (!veriVar()) return goster("bilgi", "Bu canlı önizlemede talep kaydedilmez.", " Şablonu kullanınca talepler veritabanındaki basvurular tablosuna düşer.");
    var d = $("#gonder"); d.disabled = true; d.textContent = "Gönderiliyor…";
    vayra.veri.ekle("basvurular", k).then(function () {
      olay("on_gorusme_talebi", { alan: k.alan, gorusme: k.gorusme });
      $("#icerik").innerHTML = '<section class="basari" role="status"><div class="muhur"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><h1>Talebiniz bize ulaştı</h1><p>Önce çıkar çatışması kontrolü yapıyoruz; ardından konuyla ilgilenecek avukat en geç bir iş günü içinde sizi arayacak.' + (k.sureliIs ? " Süreli bir işiniz olduğunu belirttiğiniz için talebiniz öncelikli incelenecek." : "") + '</p><dl><dt>Referans</dt><dd class="ref">' + kacir(k.referans) + "</dd><dt>Konu</dt><dd>" + kacir(k.alan) + "</dd><dt>Görüşme</dt><dd>" + kacir(k.gorusme) + "</dd><dt>Telefon</dt><dd>" + kacir(k.telefon) + '</dd></dl><div class="eylemler" style="justify-content:center"><a class="dugme" href="yayinlar.html">Yayınlarımıza göz atın</a><a class="dugme cizgili" href="index.html">Ana sayfa</a></div></section>';
      window.scrollTo(0, 0);
    }).catch(function (err) {
      goster("hata", "Talep gönderilemedi.", " " + (err && err.message ? err.message + ". " : "") + "Lütfen yeniden deneyin ya da 0212 284 05 00 numarasını arayın.");
    }).finally(function () { d.disabled = false; d.textContent = "Talebi gönder"; });
  });
}
`;

const alanSatiri = (a: (typeof ALANLAR)[number], i: number) => `    <a class="alan-satir" href="calisma-alanlari.html#${a.id}"><span class="numara">${String(i + 1).padStart(2, "0")}</span><h3>${a.ad}</h3><p>${a.kisa}</p>${ok}</a>`;
const avukatKarti = (a: (typeof AVUKATLAR)[number]) => `    <a class="avukat" href="ekip.html#${a.id}"><div class="foto"><img src="${a.foto}" alt="${a.ad}" loading="lazy" /></div><h3>${a.ad}</h3><p>${a.unvan}</p></a>`;

export const HUKUK_BUROSU = {
  id: "hukuk-burosu",
  ad: "Aksoy Demirel · Hukuk Bürosu",
  tur: "site" as const,
  aciklama: "Avukatlık ortaklığı sitesi: çalışma alanları, avukat profilleri, tablodan süzgeçli yayınlar ve okuma sayfası, çıkar çatışması kontrollü ön görüşme talebi ve KVKK metni",
  kapak: "/gercek/build/sablon/hukuk-burosu.webp",
  tablolar: TABLOLAR,
  dosyalar: {
    "index.html": sayfa("index.html", "Aksoy Demirel Hukuk Bürosu · Levent, İstanbul", "Şirketler, iş, gayrimenkul, aile ve miras hukuku alanlarında çalışan İstanbul merkezli avukatlık ortaklığı.", `<section class="kap kahraman">
  <div>
    <p class="ust-yazi">2004'ten beri Levent'te avukatlık ortaklığı</p>
    <h1>Hukuki meseleniz için <em>açık</em> ve yazılı bir yol haritası.</h1>
    <p class="giris">Şirketlere ve kişilere, ticaret hukukundan aile hukukuna uzanan sekiz alanda danışmanlık ve dava takibi sunuyoruz. Her dosyada bir ortak sorumludur; seçenekleri, süreleri ve ücreti işe başlamadan yazılı olarak paylaşırız.</p>
    <div class="eylemler"><a class="dugme" href="gorusme.html">Ön görüşme talep edin</a><a class="metin-bag" href="calisma-alanlari.html">Çalışma alanlarımız ${ok}</a></div>
  </div>
  <figure>
    <img src="/gercek/galeri/sinematik10.webp" alt="Pencereden ışık alan, kitaplarla çevrili okuma odası" />
    <figcaption><span>Büro kütüphanesi, Kat 14</span><span>Büyükdere Caddesi</span></figcaption>
  </figure>
</section>
<section class="kap">
  <div class="serit">
    <div><b>2004</b><span>İstanbul Barosu'na kayıtlı ortaklık</span></div>
    <div><b>7</b><span>Avukat, dört ortak</span></div>
    <div><b>3</b><span>Çalışma dili: Türkçe, İngilizce, Almanca</span></div>
    <div><b>1 gün</b><span>İçinde ön görüşme dönüşü</span></div>
  </div>
</section>
<section class="kap bolum">
  <div class="bolum-bas"><h2>Çalışma <em>alanları</em></h2><p>Danışmanlıktan dava takibine, her alanda deneyimli bir ortağın yönettiği küçük ekiplerle çalışıyoruz. Dosyanızı ilk günden sonuna kadar aynı avukat takip eder.</p></div>
  <div class="alan-liste">
${ALANLAR.map(alanSatiri).join("\n")}
  </div>
</section>
<section class="ilkeler bolum">
  <div class="kap">
    <div class="bolum-bas"><h2>Nasıl çalışırız</h2><p>Hukuki süreçler belirsizlikle başlar. Biz belirsizliği yazılı bir planla azaltmayı ilke ediniyoruz.</p></div>
    <div class="ilke-izgara">
      <div><span class="numara">i.</span><h3>Önce dinleriz</h3><p>İlk görüşmede olayı, belgelerinizi ve beklentinizi dinler; çıkar çatışması kontrolünü tamamlamadan size görüş bildirmeyiz.</p></div>
      <div><span class="numara">ii.</span><h3>Yazılı plan ve ücret</h3><p>Seçenekleri, tahmini süreyi ve masrafları içeren yazılı bir değerlendirme ve avukatlık ücret sözleşmesi hazırlarız.</p></div>
      <div><span class="numara">iii.</span><h3>Düzenli bilgilendirme</h3><p>Her duruşmadan ve önemli gelişmeden sonra yazılı özet gönderir, süreli işleri ortak takvimde izleriz.</p></div>
    </div>
  </div>
</section>
<section class="kap bolum">
  <div class="bolum-bas"><h2>Ortaklarımız</h2><p>Büromuzun dört ortağı, kendi alanlarında yirmi yılı aşan deneyimleriyle dosyaların sorumluluğunu üstlenir.</p></div>
  <div class="ekip-izgara">
${AVUKATLAR.slice(0, 4).map(avukatKarti).join("\n")}
  </div>
  <p style="margin:30px 0 0"><a class="metin-bag" href="ekip.html">Bütün avukatlarımız ${ok}</a></p>
</section>
<section class="kap bolum" style="padding-top:0">
  <div class="bolum-bas"><h2>Son <em>yayınlar</em></h2><p>Mevzuattaki değişiklikleri ve sık sorulan soruları sade bir dille yazıyoruz.</p></div>
  <div class="makale-izgara" id="sonYayinlar" aria-live="polite"><div class="iskelet"><i></i><i></i><i></i></div><div class="iskelet"><i></i><i></i><i></i></div><div class="iskelet"><i></i><i></i><i></i></div></div>
  <p style="margin:30px 0 0"><a class="metin-bag" href="yayinlar.html">Bütün yayınlar ${ok}</a></p>
</section>
<section class="kap bolum" style="padding-top:0">
  <div class="cagri">
    <div><h2>Bir konuyu konuşmak ister misiniz?</h2><p>Formu doldurun ya da arayın. Talebinizi aldıktan sonra konuyla ilgilenecek avukat bir iş günü içinde size dönüş yapar. Ön görüşme tek başına avukat ile müvekkil ilişkisi kurmaz.</p></div>
    <div class="yan"><a class="tel" href="tel:+902122840500">0212 284 05 00</a><a class="dugme" href="gorusme.html">Ön görüşme talebi</a></div>
  </div>
</section>`),
    "calisma-alanlari.html": sayfa("calisma-alanlari.html", "Çalışma alanları · Aksoy Demirel Hukuk Bürosu", "Şirketler ve ticaret, iş, gayrimenkul, ticari uyuşmazlıklar ve tahkim, aile, miras, kişisel veriler ve icra hukuku.", `<section class="kap sayfa-bas">
  <h1>Çalışma <em>alanları</em></h1>
  <p>Sekiz alanda danışmanlık ve dava takibi yapıyoruz. Her alanın başında bir sorumlu avukat bulunur; gerektiğinde dosyalar alanlar arası ekiplerle yürütülür.</p>
</section>
<section class="kap alanlar-duzen">
  <nav class="alan-dizin" aria-label="Alanlar">
${ALANLAR.map((a, i) => `    <a href="#${a.id}"><span>${i + 1}</span>${a.ad}</a>`).join("\n")}
  </nav>
  <div>
${ALANLAR.map((a, i) => { const s = avukat(a.sorumlu); return `    <article class="alan-detay" id="${a.id}">
      <span class="numara">${String(i + 1).padStart(2, "0")}</span>
      <h2>${a.ad}</h2>
      <p>${a.uzun}</p>
      <div class="alan-ic">
        <div><h4>Başlıca konular</h4><ul>${a.konular.map((k) => `<li>${k}</li>`).join("")}</ul></div>
        <div><h4>Sorumlu avukat</h4><a class="sorumlu" href="ekip.html#${s.id}"><img src="${s.foto}" alt="" loading="lazy" /><div><b>${s.ad}</b><span>${s.unvan}</span></div></a><a class="dugme cizgili" href="gorusme.html?alan=${a.id}">Bu konuda ön görüşme</a></div>
      </div>
    </article>`; }).join("\n")}
  </div>
</section>`),
    "ekip.html": sayfa("ekip.html", "Avukatlar · Aksoy Demirel Hukuk Bürosu", "Aksoy Demirel Hukuk Bürosu ortakları ve avukatları: eğitim, baro kaydı, çalışma alanları ve dilleri.", `<section class="kap sayfa-bas">
  <h1>Avukat<em>larımız</em></h1>
  <p>Dört ortak ve üç avukattan oluşan ekibimiz, her dosyayı bir ortağın sorumluluğunda yürütür. Aşağıda her avukatın eğitimini, baro kaydını ve çalıştığı alanları bulabilirsiniz.</p>
</section>
<div class="kap">
${AVUKATLAR.map((a) => `  <article class="profil" id="${a.id}">
    <div class="foto"><img src="${a.foto}" alt="${a.ad}" loading="lazy" /></div>
    <div>
      <h2>${a.ad}</h2>
      <p class="unvan">${a.unvan}</p>
      <p>${a.hakkinda}</p>
      <dl>
        <dt>Çalışma alanları</dt><dd>${a.alanlar.map((x) => `<a href="calisma-alanlari.html#${x}">${ALANLAR.find((y) => y.id === x)!.ad}</a>`).join(", ")}</dd>
        <dt>Eğitim</dt><dd>${a.egitim}</dd>
        <dt>Baro kaydı</dt><dd>${a.baro}</dd>
        <dt>Diller</dt><dd>${a.dil}</dd>
      </dl>
      <a class="metin-bag" href="gorusme.html?alan=${a.alanlar[0]}">Ön görüşme talebi ${ok}</a>
    </div>
  </article>`).join("\n")}
</div>`),
    "yayinlar.html": sayfa("yayinlar.html", "Yayınlar · Aksoy Demirel Hukuk Bürosu", "Kira, iş, şirketler, aile, miras, kişisel veriler ve icra hukukuna dair bilgilendirici yazılar.", `<section class="kap sayfa-bas">
  <h1>Yayın<em>lar</em></h1>
  <p>Mevzuattaki değişiklikleri ve bize en sık sorulan soruları avukatlarımız sade bir dille yazıyor. Yazılar genel bilgilendirme amaçlıdır.</p>
  <div class="suzgec" role="group" aria-label="Kategori süzgeci">
    <button type="button" data-kategori="Hepsi" aria-pressed="true">Hepsi</button>
${KATEGORILER.map((k) => `    <button type="button" data-kategori="${k}" aria-pressed="false">${k}</button>`).join("\n")}
  </div>
</section>
<section class="kap">
  <p class="ust-bilgi" style="margin:22px 0 0" id="yayinSayi" aria-live="polite"></p>
  <div class="yayin-liste" id="yayinListe"><div class="iskelet" style="border:0"><i></i><i></i><i></i></div></div>
</section>`),
    "yazi.html": sayfa("yazi.html", "Yayın · Aksoy Demirel Hukuk Bürosu", "Aksoy Demirel Hukuk Bürosu yayını.", `<div class="ilerleme" aria-hidden="true"></div>
<article class="yazi" id="yazi" aria-live="polite"><div class="iskelet" style="border:0"><i></i><i></i><i></i></div></article>
<section class="kap bolum" style="padding-top:20px">
  <div class="bolum-bas"><h2>Diğer <em>yayınlar</em></h2></div>
  <div class="makale-izgara ilgili" id="ilgili"></div>
</section>`),
    "gorusme.html": sayfa("gorusme.html", "Ön görüşme talebi · Aksoy Demirel Hukuk Bürosu", "Konunuzu kısaca anlatın; ilgili avukat bir iş günü içinde size dönüş yapsın.", `<section class="kap sayfa-bas">
  <h1>Ön görüşme <em>talebi</em></h1>
  <p>Konunuzu kısaca anlatın. Çıkar çatışması kontrolünden sonra ilgili avukat bir iş günü içinde sizi arar ve görüşme zamanını birlikte belirleriz.</p>
</section>
<section class="kap gorusme">
  <form id="gorusmeFormu" novalidate>
    <div class="form-blok">
      <h2><span class="numara">i.</span>Siz</h2>
      <div class="secenekler iki" role="radiogroup" aria-label="Kimin adına">
        <label class="secenek"><input type="radio" name="kisiTuru" value="Bireysel" checked /><span>Kendi adıma<small>Bireysel konu</small></span></label>
        <label class="secenek"><input type="radio" name="kisiTuru" value="Şirket" /><span>Şirketim adına<small>Ticari konu</small></span></label>
      </div>
      <label class="alan" id="sirketAlan" hidden>Şirket unvanı<input name="sirket" autocomplete="organization" /></label>
      <div class="ikili">
        <label class="alan">Ad soyad<input name="ad" required minlength="3" autocomplete="name" /></label>
        <label class="alan">Telefon<input name="telefon" type="tel" required inputmode="tel" autocomplete="tel" placeholder="05xx xxx xx xx" /></label>
      </div>
      <label class="alan">E-posta<input name="eposta" type="email" required autocomplete="email" inputmode="email" /></label>
    </div>
    <div class="form-blok">
      <h2><span class="numara">ii.</span>Konu</h2>
      <label class="alan">Hukuki alan<select name="alan" required></select></label>
      <label class="alan">Karşı tarafın adı ya da unvanı <small>Çıkar çatışması kontrolü için gereklidir; bilinmiyorsa boş bırakabilirsiniz.</small><input name="karsiTaraf" /></label>
      <label class="alan">Kısa özet <small>Olayı, tarihleri ve beklentinizi birkaç cümleyle yazın. Belge göndermeyin; görüşmede isteyeceğiz.</small><textarea name="ozet" required minlength="30" maxlength="1500" rows="6"></textarea><span class="sayac" id="ozetSayac">0 / 1500</span></label>
      <label class="onay"><input type="checkbox" name="sureliIs" /> <span>Elimde süresi işleyen bir tebligat, ihtarname ya da ödeme emri var.</span></label>
    </div>
    <div class="form-blok">
      <h2><span class="numara">iii.</span>Görüşme</h2>
      <div class="secenekler" role="radiogroup" aria-label="Görüşme şekli">
        <label class="secenek"><input type="radio" name="gorusme" value="Ofiste yüz yüze" checked /><span>Ofiste<small>Levent</small></span></label>
        <label class="secenek"><input type="radio" name="gorusme" value="Görüntülü görüşme" /><span>Görüntülü<small>Bağlantı gönderilir</small></span></label>
        <label class="secenek"><input type="radio" name="gorusme" value="Telefon" /><span>Telefon<small>Kısa ön görüşme</small></span></label>
      </div>
      <label class="onay"><input type="checkbox" name="kvkk" required /> <span><a href="kvkk.html" target="_blank" rel="noopener">Aydınlatma metnini</a> okudum; talebimin değerlendirilmesi için bilgilerimin işlenmesini kabul ediyorum.</span></label>
      <button class="dugme gonder" id="gonder" type="submit">Talebi gönder</button>
      <div id="mesaj" class="mesaj" role="alert" hidden></div>
    </div>
  </form>
  <aside class="yan-kutu" aria-labelledby="surecBaslik">
    <h3 id="surecBaslik">Bundan sonra ne olur?</h3>
    <ol>
      <li><span>Karşı taraf adıyla çıkar çatışması kontrolü yapılır.</span></li>
      <li><span>İlgili avukat bir iş günü içinde sizi arar.</span></li>
      <li><span>Görüşmeden sonra yazılı değerlendirme ve ücret teklifi gönderilir.</span></li>
    </ol>
    <p>Formdaki bilgiler yalnız talebinizin değerlendirilmesi için kullanılır ve sır saklama yükümlülüğümüz kapsamındadır.</p>
    <p>Acil bir süreniz varsa doğrudan arayın: <a href="tel:+902122840500">0212 284 05 00</a></p>
  </aside>
</section>`),
    "iletisim.html": sayfa("iletisim.html", "İletişim · Aksoy Demirel Hukuk Bürosu", "Aksoy Demirel Hukuk Bürosu Levent ofisi: adres, telefon, e-posta ve yol tarifi.", `<section class="kap sayfa-bas">
  <h1>İleti<em>şim</em></h1>
  <p>Ofisimiz Büyükdere Caddesi üzerinde, Levent metro durağına dört dakika yürüme mesafesinde. Ziyaretlerinizi randevuyla kabul ediyoruz.</p>
</section>
<section class="kap iletisim">
  <dl>
    <dt>Adres</dt><dd>Esentepe Mah. Büyükdere Cad. No: 127, Kat 14, Şişli / İstanbul</dd>
    <dt>Telefon</dt><dd><a href="tel:+902122840500">0212 284 05 00</a></dd>
    <dt>E-posta</dt><dd><a href="mailto:buro@aksoydemirel.av.tr">buro@aksoydemirel.av.tr</a></dd>
    <dt>Çalışma saatleri</dt><dd>Pazartesi ile cuma, 09.00 ile 18.30</dd>
    <dt>Otopark</dt><dd>Binanın misafir otoparkında iki saat ücretsiz</dd>
  </dl>
  <div class="harita">
    <iframe title="Aksoy Demirel Hukuk Bürosu harita konumu" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=29.000%2C41.070%2C29.024%2C41.086&amp;layer=mapnik&amp;marker=41.0781%2C29.0119"></iframe>
    <a class="dugme" href="gorusme.html">Ön görüşme talebi</a>
  </div>
</section>`),
    "kvkk.html": sayfa("kvkk.html", "KVKK aydınlatma metni · Aksoy Demirel Hukuk Bürosu", "Aksoy Demirel Avukatlık Ortaklığı kişisel verilerin işlenmesine ilişkin aydınlatma metni.", `<section class="kap metin">
  <h1 style="font-size:clamp(38px,5vw,60px);font-weight:500">Kişisel verilerin işlenmesine ilişkin aydınlatma metni</h1>
  <p>Aksoy Demirel Avukatlık Ortaklığı olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu'nun 10. maddesi uyarınca, web sitemizdeki ön görüşme formu ve avukatlık hizmeti süreci kapsamında işlediğimiz kişisel verileriniz hakkında sizi bilgilendirmek isteriz.</p>
  <h2>Veri sorumlusu</h2>
  <p>Aksoy Demirel Avukatlık Ortaklığı, Esentepe Mah. Büyükdere Cad. No: 127, Kat 14, Şişli / İstanbul. İletişim: kvkk@aksoydemirel.av.tr</p>
  <h2>İşlenen kişisel veriler</h2>
  <div class="tablo-kap"><table><thead><tr><th>Kategori</th><th>Kapsam</th></tr></thead><tbody>
    <tr><td>Kimlik</td><td>Ad, soyad; şirket adına başvuruda unvan</td></tr>
    <tr><td>İletişim</td><td>Telefon, e-posta adresi</td></tr>
    <tr><td>Hukuki işlem</td><td>Formda paylaştığınız olay özeti, karşı taraf bilgisi, süreli iş bilgisi</td></tr>
  </tbody></table></div>
  <h2>İşleme amaçları ve hukuki sebepler</h2>
  <p>Verileriniz; ön görüşme talebinizin değerlendirilmesi, çıkar çatışması kontrolünün yapılması, sizinle iletişime geçilmesi ve avukatlık sözleşmesinin kurulması amaçlarıyla, Kanun'un 5/2-c (sözleşmenin kurulması) ve 5/2-ç (hukuki yükümlülük, Avukatlık Kanunu kapsamındaki sır saklama ve kayıt yükümlülükleri) maddelerine dayanılarak işlenir.</p>
  <h2>Aktarım</h2>
  <p>Verileriniz, hukuki yükümlülük hâlinde yetkili kamu kurumları ve yargı mercileriyle, hizmet aldığımız barındırma ve e-posta sağlayıcılarıyla yalnız ilgili amaçla sınırlı olarak paylaşılır. Pazarlama amacıyla üçüncü kişilere aktarılmaz.</p>
  <h2>Saklama süresi</h2>
  <p>Avukat ile müvekkil ilişkisi kurulmayan ön görüşme talepleri iki yıl sonra silinir. Dosya oluşturulan taleplerde veriler, mesleki mevzuatta öngörülen süre boyunca saklanır.</p>
  <h2>Haklarınız</h2>
  <p>Kanun'un 11. maddesi uyarınca verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltilmesini ya da silinmesini isteme ve itiraz etme haklarına sahipsiniz. Başvurularınızı kvkk@aksoydemirel.av.tr adresine iletebilirsiniz; en geç 30 gün içinde ücretsiz yanıtlanır.</p>
  <p><a class="dugme" href="gorusme.html">Ön görüşme formuna dön</a></p>
</section>`),
    "ikon.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#6e1f24"/><text x="32" y="44" text-anchor="middle" font-family="Georgia, serif" font-size="34" fill="#f5f1ea">A</text><text x="46" y="46" text-anchor="middle" font-family="Georgia, serif" font-size="16" fill="#d6b27a">D</text></svg>',
    "stil.css": STIL,
    "app.js": UYGULAMA,
  },
};
