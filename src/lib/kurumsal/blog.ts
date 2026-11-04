/* Blog yazıları — liste + /blog/[slug] detay + generateStaticParams.
   Gövde basit paragraf/başlık dizisi olarak tutulur (markdown bağımlılığı yok). */

export type BlogBlok =
  | { tip: "p"; metin: string }
  | { tip: "h2"; metin: string }
  | { tip: "h3"; metin: string }
  | { tip: "liste"; ogeler: string[]; sirali?: boolean }
  | { tip: "alinti"; metin: string; kaynak?: string }
  | { tip: "gorsel"; src: string; aciklama?: string }
  | { tip: "not"; metin: string; baslik?: string; tur?: "bilgi" | "ipucu" | "uyari" }
  | { tip: "kod"; dil: string; kod: string };

export interface BlogYazi {
  slug: string;
  baslik: string;
  ozet: string;
  kategori: "Ürün" | "Yaratıcılık" | "Şirket" | "Teknik";
  /** Elle verilmiş okuma süresi — yoksa içerikten hesaplanır (okumaSuresi). */
  sure?: string;
  tarih: string; // ISO
  tarihMetin: string;
  /** Son güncelleme (ISO) — varsa yazıda gösterilir. */
  guncelleme?: string;
  yazar: string;
  yazarUnvan: string;
  yazarMono: string;
  oneCikan?: boolean;
  etiketler?: string[];
  /** Kapak görseli (Vayra'da üretilmiş). */
  kapak: string;
  govde: BlogBlok[];
}

/** Dakikada ~200 kelime; kod blokları yarı hızda sayılır. */
export function okumaSuresi(y: BlogYazi): string {
  let kelime = y.baslik.split(/\s+/).length + y.ozet.split(/\s+/).length;
  for (const b of y.govde) {
    if ("metin" in b) kelime += b.metin.split(/\s+/).length;
    if (b.tip === "liste") kelime += b.ogeler.join(" ").split(/\s+/).length;
    if (b.tip === "kod") kelime += Math.round(b.kod.split(/\s+/).length / 2);
    if (b.tip === "gorsel") kelime += 12;
  }
  return `${Math.max(1, Math.round(kelime / 200))} dk okuma`;
}

export const yazarSlug = (ad: string) =>
  ad.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const tarihMetni = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

export const KATEGORILER = ["Tümü", "Ürün", "Yaratıcılık", "Şirket", "Teknik"] as const;

export const BLOG_YAZILARI: BlogYazi[] = [
  {
    slug: "presetler-yenilendi",
    kapak: "/gercek/preset-video/earth-zoom.webp",
    baslik: "Presetler yenilendi: tek fotoğraftan viral video, artık daha hızlı",
    ozet: "Önizlemeli kartlar, iki preseti karıştırma, aynı anda dört video ve kendi presetini oluşturma. Presetler sayfasını baştan kurduk.",
    kategori: "Ürün",
    tarih: "2026-10-20",
    tarihMetin: "20 Ekim 2026",
    yazar: "Clara Lindqvist",
    yazarUnvan: "Ürün Lideri",
    yazarMono: "CL",
    oneCikan: true,
    etiketler: ["Presetler", "Video", "Yeni özellik"],
    govde: [
      { tip: "p", metin: "Presetler, istem yazmadan video üretmenin en hızlı yolu: bir hareketi seçiyorsun, fotoğrafını ekliyorsun, sekiz saniyelik video hazır. Kullanıcılarımızın en çok vakit geçirdiği sayfalardan biri olduğu için onu sıfırdan yeniden tasarladık." },
      { tip: "h2", metin: "Seçmeden önce gör" },
      { tip: "p", metin: "Her kart artık presetin gerçek bir çıktısını gösteriyor; imleci üzerine getirdiğinde video oynuyor. Öne çıkanlar şeridi haftanın presetlerini, kategoriler ise kamera hareketinden dönüşüme kadar türleri bir arada tutuyor." },
      { tip: "gorsel", src: "/gercek/preset-video/action-figure.webp", aciklama: "Action Figure: fotoğraftaki kişi oynanabilir bir aksiyon figürüne dönüşüyor." },
      { tip: "h2", metin: "Fotoğrafını üç yoldan ekle" },
      { tip: "liste", ogeler: [
        "Bilgisayarından yükle ya da pencereye sürükleyip bırak.",
        "Panodaki görseli Ctrl+V ile doğrudan yapıştır.",
        "Kitaplığındaki bir görsel üretimini tek tıkla seç.",
      ] },
      { tip: "not", tur: "ipucu", baslik: "En iyi sonuç için", metin: "Tek kişilik, yüzü net ve iyi ışıklı bir fotoğraf seç. Kalabalık ya da bulanık fotoğraflarda kimlik tutarlılığı düşer." },
      { tip: "h2", metin: "İki preseti karıştır" },
      { tip: "p", metin: "Karıştır seçeneğiyle ana presetin hareketini korurken ikinci presetin atmosferini ekleyebiliyorsun. Örneğin Earth Zoom'un dalışını Moonwalk'un hafifliğiyle birleştirmek mümkün. Karışımın bedeli, ana presete ikinci presetin yarısının eklenmesiyle hesaplanıyor." },
      { tip: "h2", metin: "Kendi presetini oluştur" },
      { tip: "p", metin: "Sevdiğin bir hareketi tarif edip kaydedebilirsin; Presetlerim sekmesinde durur ve her fotoğrafa tek tıkla uygulanır. Hazır kamera kalıpları tarifini hızlıca kurmana yardım eder." },
      { tip: "alinti", metin: "Amacımız preset seçmeyi, sonucu görmeden karar verilen bir tahmin olmaktan çıkarmaktı.", kaynak: "Clara Lindqvist" },
    ],
  },
  {
    slug: "claude-u-vayraya-bagla-mcp",
    kapak: "/gercek/paz/urun-kahve.webp",
    baslik: "Claude'u Vayra'ya bağla: MCP sunucumuz ve CLI yayında",
    ozet: "Claude Code, Claude Desktop, Cursor ve VS Code'dan sohbetten çıkmadan görsel, video, ses ve 3D üret. Kurulum iki dakika.",
    kategori: "Teknik",
    tarih: "2026-10-14",
    tarihMetin: "14 Ekim 2026",
    yazar: "Mei-Lin Chen",
    yazarUnvan: "Kurucu & CTO",
    yazarMono: "MC",
    etiketler: ["MCP", "Claude", "Geliştirici", "CLI"],
    govde: [
      { tip: "p", metin: "Model Context Protocol, yapay zekâ ajanlarının dış araçları güvenli biçimde kullanmasını sağlayan açık bir standart. Vayra'nın MCP sunucusu, ajanına yedi araç açıyor: modelleri listeleme, model ayrıntısı, üretim, üretimi getirme, listeleme, iptal ve hesap bakiyesi." },
      { tip: "h2", metin: "İki dakikada kurulum" },
      { tip: "p", metin: "Panelde bir API anahtarı seç, istemcini seç ve yapılandırmayı kopyala. Claude Code kullanıyorsan tek bir komut yeterli:" },
      { tip: "kod", dil: "bash", kod: "claude mcp add --transport http vayra https://vayra.ai/api/mcp \\\n  --header \"Authorization: Bearer vy_live_…\" --scope user" },
      { tip: "p", metin: "Cursor ve VS Code için tek tıkla kurulum bağlantıları da var. Panel, kurulumdan sonra el sıkışma, araç listesi ve kimlik doğrulamasını sırayla deneyip sorun varsa hangi adımda olduğunu gösteriyor." },
      { tip: "h2", metin: "Aynı kredi, aynı sınırlar" },
      { tip: "p", metin: "Ajanın yaptığı her çağrı REST API ile aynı yoldan geçiyor: içerik denetimi, kredi kontrolü, hız sınırı, aylık harcama tavanı ve webhook'lar birebir aynı çalışıyor. Ajana yalnız okuma ya da yalnız üretim yetkili bir anahtar verebilirsin." },
      { tip: "not", tur: "bilgi", metin: "Test anahtarları (vy_test_) kredi harcamaz ve örnek çıktı döndürür; kurulumu denemek için idealdir." },
      { tip: "h2", metin: "MCP desteklemeyen ortamlar için CLI" },
      { tip: "p", metin: "Betikler ve CI için bağımlılıksız, tek dosyalık bir komut satırı aracı yayınladık. Üretir, bitmesini bekler ve çıktıyı klasöre indirir:" },
      { tip: "kod", dil: "bash", kod: "node vayra.mjs login vy_live_…\nnode vayra.mjs generate nano-banana-pro \"sisli bir orman, sinematik\" -p aspect_ratio=16:9 --out ./ciktilar" },
      { tip: "p", metin: "Claude için bir de beceri dosyası hazırladık: Claude'a Vayra'yı ne zaman kullanacağını, pahalı modellerden önce bedeli söylemesini ve hata kodlarına göre nasıl davranacağını öğretiyor." },
    ],
  },
  {
    slug: "iki-adimli-dogrulama-ve-guvenlik",
    kapak: "/gercek/kesfet/neon-sehir-turucinemadreams.webp",
    baslik: "Hesabını iki adımlı doğrulamayla koru",
    ozet: "Doğrulama uygulaması, yedek kodlar, oturum yönetimi ve güvenlik geçmişi. Ayarlar'daki yeni Güvenlik bölümünü tanıtıyoruz.",
    kategori: "Ürün",
    tarih: "2026-10-08",
    tarihMetin: "8 Ekim 2026",
    yazar: "Yuki Tanaka",
    yazarUnvan: "Mühendislik Direktörü",
    yazarMono: "YT",
    etiketler: ["Güvenlik", "Hesap", "Ayarlar"],
    govde: [
      { tip: "p", metin: "Üretimlerin, kredilerin ve API anahtarların hesabında duruyor. Bu yüzden hesap güvenliğini tek bir şifreye bırakmak istemedik." },
      { tip: "h2", metin: "İki adımlı doğrulama" },
      { tip: "p", metin: "Güvenlik bölümünden Kur'a bastığında bir QR kod çıkar. Google Authenticator, 1Password, Authy ya da Microsoft Authenticator ile tarayıp uygulamadaki altı haneli kodu girdiğinde doğrulama açılır. Kodlar zaman tabanlıdır (TOTP) ve 30 saniyede bir yenilenir." },
      { tip: "liste", sirali: true, ogeler: [
        "Ayarlar › Güvenlik › İki adımlı doğrulama › Kur",
        "QR kodu doğrulama uygulamanla tara",
        "Uygulamadaki 6 haneli kodu gir",
        "Yedek kodlarını indir ve güvenli bir yere kaydet",
      ] },
      { tip: "not", tur: "uyari", baslik: "Yedek kodlar", metin: "Telefonunu kaybedersen hesabına yalnız yedek kodlarla girebilirsin. Her kod bir kez çalışır; azaldığında Güvenlik'ten yenilerini oluştur." },
      { tip: "h2", metin: "Oturumlar ve güvenlik geçmişi" },
      { tip: "p", metin: "Hangi tarayıcıda ve cihazda oturumun açık olduğunu, son ne zaman etkin olduğunu görebilir; tanımadığın oturumları tek tıkla kapatabilirsin. Şifre değişikliği, hatalı giriş denemesi ve yedek kod kullanımı gibi olaylar da güvenlik geçmişinde listelenir." },
      { tip: "p", metin: "Şifreler cihazında PBKDF2 ile 120.000 turda özetlenir; şifrenin kendisi hiçbir yerde saklanmaz. Art arda beş hatalı denemeden sonra giriş kısa süre kilitlenir." },
    ],
  },
  {
    slug: "tek-fotograftan-viral-video-5-fikir",
    kapak: "/gercek/preset-video/selfie-twin.webp",
    baslik: "Tek fotoğraftan viral video: 5 preset fikri",
    ozet: "Sosyal medyada en çok etkileşim alan beş preseti ve her birinden en iyi sonucu almanın yollarını derledik.",
    kategori: "Yaratıcılık",
    tarih: "2026-09-25",
    tarihMetin: "25 Eylül 2026",
    yazar: "Sofia Marchetti",
    yazarUnvan: "Tasarım Lideri",
    yazarMono: "SM",
    etiketler: ["Presetler", "Sosyal medya", "Rehber"],
    govde: [
      { tip: "p", metin: "Dikey videoda ilk saniye her şeydir. Aşağıdaki presetler, ilk karede merak uyandıran hareketleriyle öne çıkıyor." },
      { tip: "h3", metin: "1. Earth Zoom" },
      { tip: "p", metin: "Uzaydan başlayıp dramatik bir dalışla sana inen kamera. Açık havada, arka planı okunaklı fotoğraflarla en iyi sonucu verir." },
      { tip: "h3", metin: "2. Selfie Twin" },
      { tip: "p", metin: "Kopyan kadraja girip seninle poz verir. Yüzün net göründüğü, omuzdan yukarı bir selfie kullan." },
      { tip: "gorsel", src: "/gercek/preset-video/selfie-twin.webp", aciklama: "Selfie Twin, en çok paylaşılan presetlerimizden." },
      { tip: "h3", metin: "3. Sticker Peel" },
      { tip: "p", metin: "Fotoğrafın gerçek bir el tarafından çıkartma gibi soyulur. Ürün ve logo görsellerinde de etkileyicidir." },
      { tip: "h3", metin: "4. Action Figure" },
      { tip: "p", metin: "Minik bir figüre dönüşüp dev bir elde poz verirsin. Tam boy fotoğraflar daha iyi sonuç verir." },
      { tip: "h3", metin: "5. Moonwalk" },
      { tip: "p", metin: "Ay yüzeyinde ağır çekim adımlar. Sade arka planlı fotoğraflarda öznenin hatları daha temiz korunur." },
      { tip: "not", tur: "ipucu", metin: "İki preseti karıştırarak (ör. Earth Zoom + Moonwalk) kendine özgü bir açılış yaratabilirsin." },
    ],
  },
  {
    slug: "kitaplik-bastan",
    kapak: "/gercek/kesfet/editorial-moda1.webp",
    baslik: "Kitaplık baştan: projeler, akıllı filtreler ve toplu indirme",
    ozet: "Binlerce üretimin arasında aradığını saniyeler içinde bul. Yeni Kitaplık'taki filtreleri, seçimi ve dışa aktarmayı anlatıyoruz.",
    kategori: "Ürün",
    tarih: "2026-09-16",
    tarihMetin: "16 Eylül 2026",
    yazar: "Clara Lindqvist",
    yazarUnvan: "Ürün Lideri",
    yazarMono: "CL",
    etiketler: ["Kitaplık", "Verimlilik"],
    govde: [
      { tip: "p", metin: "Üretim sayısı arttıkça düzen ihtiyacı da artıyor. Kitaplık'ı, yüzlerce varlığı hızla gezip seçebileceğin bir çalışma alanına dönüştürdük." },
      { tip: "h2", metin: "Filtreler" },
      { tip: "liste", ogeler: [
        "Tür: görsel, video, ses, müzik ve 3D — her birinin sayısıyla.",
        "Model: logolarıyla birlikte, en çok kullandıkların önde.",
        "En-boy oranı: dikeyden yataya, oranı tarif eden küçük şekillerle.",
        "Tarih ve durum: süren işler ayrı tutulur, bitince yerine düşer.",
      ] },
      { tip: "h2", metin: "Seç, taşı, indir" },
      { tip: "p", metin: "Ctrl ile çoklu seçim yapabilir, alanı sürükleyerek toplu seçebilirsin. Seçilenleri projeye taşıyabilir, yayınlayabilir ya da tek bir ZIP olarak indirebilirsin." },
      { tip: "not", tur: "bilgi", metin: "Silinen üretimler 30 gün boyunca çöp kutusunda bekler; bu süre içinde geri alabilirsin." },
    ],
  },
  {
    slug: "api-v1-webhook-idempotency",
    kapak: "/gercek/paz/urun-finovela.webp",
    baslik: "Vayra API v1: webhook'lar, idempotency ve hız limitleri",
    ozet: "Üretimi kendi ürününe eklerken güvenilir bir entegrasyon için bilmen gereken üç kavram.",
    kategori: "Teknik",
    tarih: "2026-09-10",
    tarihMetin: "10 Eylül 2026",
    yazar: "Yuki Tanaka",
    yazarUnvan: "Mühendislik Direktörü",
    yazarMono: "YT",
    etiketler: ["API", "Geliştirici", "Webhook"],
    govde: [
      { tip: "p", metin: "Üretimler saniyeler ile dakikalar arasında sürebilir. Bu yüzden API'yi, isteği bekletmek yerine olaylarla haber veren bir yapıda kurduk." },
      { tip: "h2", metin: "Webhook'lar" },
      { tip: "p", metin: "Bir uç nokta tanımladığında üretim başladığında, bittiğinde, başarısız olduğunda ve kredi azaldığında olay gönderiyoruz. Her istek Vayra-Signature başlığıyla imzalanır; ulaşamazsak 2 ve 8 saniye sonra yeniden deneriz." },
      { tip: "kod", dil: "bash", kod: "curl https://vayra.ai/api/v1/generations \\\n  -H \"Authorization: Bearer vy_live_…\" \\\n  -H \"Idempotency-Key: siparis-4821\" \\\n  -d '{\"model\":\"nano-banana-pro\",\"input\":{\"prompt\":\"ürün fotoğrafı\"},\"webhook_url\":\"https://ornek.com/vayra\"}'" },
      { tip: "h2", metin: "Idempotency" },
      { tip: "p", metin: "Ağ hatası sonrası aynı isteği tekrar gönderdiğinde iki kez ücretlendirilmemek için Idempotency-Key başlığını kullan. Aynı anahtar ve aynı gövdeyle gelen istek, ilk üretimi döndürür; gövde farklıysa çakışma hatası alırsın." },
      { tip: "h2", metin: "Hız ve harcama sınırları" },
      { tip: "p", metin: "Her anahtarın dakikalık istek sınırı ve isteğe bağlı aylık harcama tavanı vardır. Sınır aşıldığında yanıt, ne kadar beklemen gerektiğini Retry-After başlığında söyler." },
    ],
  },
  {
    slug: "vayra-earn-kreatorlere-odeme",
    kapak: "/gercek/orig/seed-kapadokya-veo31.webp",
    baslik: "Vayra Earn: ürettiğin içerik görüntülendikçe kazandırsın",
    ozet: "Kreatör programımızın nasıl çalıştığını, görüntülenmeleri nasıl doğruladığımızı ve ödemeleri neden üç aşamada yaptığımızı anlatıyoruz.",
    kategori: "Şirket",
    sure: "7 dk okuma",
    tarih: "2026-10-01",
    tarihMetin: "1 Ekim 2026",
    yazar: "Tomás Rivera",
    yazarUnvan: "Topluluk Lideri",
    yazarMono: "TR",
    govde: [
      { tip: "p", metin: "Vayra'da her gün binlerce video ve görsel üretiliyor; bunların önemli bir kısmı Instagram, TikTok ve YouTube'da milyonlarca kişiye ulaşıyor. Vayra Earn ile bu emeğin karşılığını doğrudan kreatörlere ödüyoruz." },
      { tip: "h2", metin: "Üç kazanç yolu" },
      { tip: "liste", ogeler: [
        "Görüntülenme kampanyaları: her 1.000 nitelikli görüntülenme için ödeme, onayda sabit ödeme ve 24. saat / 7. gün bonusları.",
        "Görevler: kriterleri karşılayan her teslim için sabit ödül.",
        "Yarışmalar: jürinin sıraladığı en iyi işlere ödül havuzu.",
      ] },
      { tip: "h2", metin: "Görüntülenmeleri nasıl doğruluyoruz?" },
      { tip: "p", metin: "Kreatörler hesaplarını, profil açıklamalarına ekledikleri tek kullanımlık bir kodla doğruluyor. Gönderilen her bağlantının gerçekten var olduğunu ve doğrulanmış hesaba ait olduğunu platformların resmi arayüzleri üzerinden kontrol ediyoruz." },
      { tip: "h2", metin: "Neden inceleme, kazanma ve bekleme?" },
      { tip: "p", metin: "72 saatlik inceleme, gereksinimlere uymayan gönderileri ayıklamamızı sağlıyor. 7 günlük kazanma süresi görüntülenmelerin büyük bölümünü kapsıyor. 3 günlük bekleme ise sahte etkileşime ve silinen gönderilere karşı bir güvenlik payı." },
      { tip: "alinti", metin: "Amacımız kazancı şeffaf yapmak: her gönderinin hangi aşamada olduğunu ve neden o tutarı kazandığını görebilmelisin." },
      { tip: "p", metin: "Kazançlar Türk lirası olarak IBAN ya da Papara hesabına aktarılıyor; en düşük çekim tutarı 250 TL." },
    ],
  },
  {
    slug: "turkce-istem-yazma-rehberi",
    kapak: "/gercek/galeri/portre4.webp",
    baslik: "Türkçe istem yazma rehberi: modelin seni anlaması için 7 kural",
    ozet: "Konu, ışık, kamera, stil: iyi bir istemin parçalarını Türkçe örneklerle anlatıyoruz.",
    kategori: "Yaratıcılık",
    sure: "8 dk okuma",
    tarih: "2026-09-04",
    tarihMetin: "4 Eylül 2026",
    yazar: "Sofia Marchetti",
    yazarUnvan: "Tasarım Lideri",
    yazarMono: "SM",
    govde: [
      { tip: "p", metin: "Vayra'daki modellerin çoğu Türkçe istemi doğrudan anlıyor. Yine de istemin yapısı, sonucun kalitesini belirleyen en büyük etken." },
      { tip: "h2", metin: "İyi bir istemin parçaları" },
      { tip: "liste", ogeler: [
        "Konu: kim ya da ne? \"Kırmızı paltolu genç kadın\"",
        "Ortam: nerede? \"Yağmurlu Karaköy sokağı\"",
        "Işık: \"altın saat\", \"neon yansımalar\", \"yumuşak yan ışık\"",
        "Kamera: \"yakın plan\", \"85 mm\", \"yavaş takip çekimi\"",
        "Stil: \"sinematik\", \"editoryal moda\", \"kil animasyon\"",
      ] },
      { tip: "h2", metin: "Az ama net" },
      { tip: "p", metin: "Uzun istemler her zaman daha iyi değildir. Birbirine zıt ifadeler modeli kararsız bırakır. Önce kısa bir istemle başla, sonra tek bir değişkeni değiştirerek ilerle." },
      { tip: "h2", metin: "Video istemlerinde hareket" },
      { tip: "p", metin: "Videoda hareketi ayrıca tarif et: kim hareket ediyor, kamera ne yapıyor? \"Kamera yavaşça yaklaşır, kadın başını çevirir\" gibi tek bir net eylem, karmaşık bir sahneden daha iyi sonuç verir." },
      { tip: "alinti", metin: "En iyi istem, aklındaki kareyi bir görüntü yönetmenine anlatır gibi yazılandır." },
    ],
  },
  {
    slug: "kling-4-ile-30-saniyelik-sahne",
    kapak: "/gercek/kesfet/neon-sehir.webp",
    baslik: "Kling 4.0 ile kesintisiz 30 saniyelik sahne nasıl kurulur?",
    ozet: "Uzun tek çekimlerde tutarlılığı korumak için referans görsel, anahtar kare ve kamera talimatlarını birlikte kullanmak.",
    kategori: "Ürün",
    sure: "6 dk okuma",
    tarih: "2026-08-21",
    tarihMetin: "21 Ağustos 2026",
    yazar: "Arjun Mehta",
    yazarUnvan: "Yapay Zekâ Lideri",
    yazarMono: "AM",
    govde: [
      { tip: "p", metin: "Kling 4.0, tek seferde 30 saniyeye kadar kesintisiz video üretebiliyor. Bu süre, karakterin ve mekânın baştan sona tutarlı kalmasını her zamankinden önemli hâle getiriyor." },
      { tip: "h2", metin: "Referansla başla" },
      { tip: "p", metin: "Önce Görsel Stüdyo'da sahnenin ana karesini üret. Bu kareyi videoya başlangıç görseli olarak vermek, ışığın ve renk paletinin dağılmasını önler." },
      { tip: "h2", metin: "Anahtar karelerle yön ver" },
      { tip: "liste", ogeler: [
        "Başlangıç ve bitiş karelerini belirle",
        "Ortadaki kritik anlar için en fazla 2-3 anahtar kare ekle",
        "Kamera hareketini tek bir talimatla tarif et",
      ] },
      { tip: "p", metin: "Sonuçta beğenmediğin bir bölüm olursa, tüm videoyu yeniden üretmek yerine o bölümü Uzun Video'da yeniden kurgulayabilirsin." },
    ],
  },
  {
    slug: "kredi-fiyatlandirmasi-nasil-calisir",
    kapak: "/gercek/sinirsiz/unl-hero-dragon.webp",
    baslik: "Kredi fiyatlandırması nasıl çalışır?",
    ozet: "Neden abonelik yerine kredi, modellerin kredi maliyeti nasıl belirleniyor ve sınırsız erişim ne zaman daha avantajlı?",
    kategori: "Teknik",
    sure: "5 dk okuma",
    tarih: "2026-08-02",
    tarihMetin: "2 Ağustos 2026",
    yazar: "Nadia Haddad",
    yazarUnvan: "Gelir Lideri",
    yazarMono: "NH",
    govde: [
      { tip: "p", metin: "Vayra'da 40'tan fazla model var ve her birinin işlem maliyeti farklı. Kredi sistemi, tüm modelleri tek bir birimle ve önceden görülebilir fiyatla kullanmanı sağlıyor." },
      { tip: "h2", metin: "Bir üretimin kredisi nasıl hesaplanır?" },
      { tip: "p", metin: "Modelin sağlayıcı maliyeti, çözünürlük ve süre gibi parametreler birlikte değerlendirilir. Kredi bedeli üretimden önce arayüzde gösterilir; teknik bir hata olursa kredi otomatik iade edilir." },
      { tip: "h2", metin: "Plan mı, paket mi, sınırsız mı?" },
      { tip: "liste", ogeler: [
        "Düzenli üretiyorsan plan: kredi başına en düşük fiyat",
        "Arada bir yoğun dönem yaşıyorsan kredi paketi: süresi dolmaz",
        "Tek bir modeli günlerce yoğun kullanacaksan sınırsız erişim",
      ] },
    ],
  },
  {
    slug: "vayra-3d-studyo-tanitim",
    kapak: "/gercek/arac/3d-ilham-render.webp",
    baslik: "3D Stüdyo geliyor: metinden gerçek 3D modele",
    ozet: "Bir cümleyle üretime hazır 3D model, otomatik iskelet ve baskıya hazır çıktı. 3D Stüdyo'nun perde arkasını ve nasıl çalıştığını anlatıyoruz.",
    kategori: "Ürün",
    sure: "6 dk okuma",
    tarih: "2026-07-20",
    tarihMetin: "20 Temmuz 2026",
    yazar: "Clara Lindqvist",
    yazarUnvan: "Ürün Lideri",
    yazarMono: "CL",
    
    govde: [
      { tip: "p", metin: "Yaratıcıların en çok istediği şeylerden biri, fikir aşamasından üretilebilir 3D varlığa geçen mesafeyi kısaltmaktı. 3D Stüdyo tam olarak bunu yapıyor: bir cümle yazıyorsun, saniyeler içinde topolojisi düzgün, dokulu bir model çıkıyor." },
      { tip: "h2", metin: "Neden 3D, neden şimdi?" },
      { tip: "p", metin: "Video ve görsel üretiminde stüdyo kalitesine ulaştıktan sonra bir sonraki doğal adım üç boyuttu. Oyun, ürün tasarımı ve AR/VR için 3D'ye erişimi demokratikleştirmek istedik." },
      { tip: "liste", ogeler: [
        "Metinden 3D — bir cümleyle üretime hazır model",
        "Görselden 3D — referans görselini 3D'ye çevir",
        "Otomatik iskelet + animasyon — karakterini hareketlendir",
        "Baskıya hazır çıktı — GLB/GLTF dışa aktarım",
      ] },
      { tip: "alinti", metin: "Amacımız 3D'yi bir uzmanlık alanı olmaktan çıkarıp herkesin kullanabileceği bir araca dönüştürmek." },
      { tip: "p", metin: "Şu an son rötuşları yapıyoruz; çok yakında tüm kullanıcılara açılacak." },
    ],
  },
  {
    slug: "yaraticilar-icin-uretim-akisi",
    kapak: "/gercek/proje-kesfet/kesfet-05.webp",
    baslik: "Tek panelde yaratıcı üretim akışı nasıl kurulur?",
    ozet: "Fikirden yayına: video, görsel ve sesi tek bir akışta birleştirerek saatlerce süren işleri dakikalara indiren pratik bir rehber.",
    kategori: "Yaratıcılık",
    sure: "5 dk okuma",
    tarih: "2026-07-12",
    tarihMetin: "12 Temmuz 2026",
    yazar: "Tomás Rivera",
    yazarUnvan: "Topluluk Lideri",
    yazarMono: "TR",
    govde: [
      { tip: "p", metin: "Çoğu yaratıcı, tek bir içerik için beş farklı araç arasında gidip geliyor. Vayra'da amaç bu dağınıklığı bitirmek: tek panelde başla, tek panelde bitir." },
      { tip: "h2", metin: "Akışı üç adımda kur" },
      { tip: "liste", ogeler: [
        "Konsepti Görsel Stüdyo'da netleştir",
        "Sinema Stüdyosu ile sahneleri hareketlendir",
        "Ses Stüdyosu'nda seslendirme ve müzikle tamamla",
      ] },
      { tip: "p", metin: "Her adımın çıktısı bir sonrakine köprüyle taşınır; yeniden yükleme, format dönüştürme derdi yok." },
    ],
  },
  {
    slug: "sorumlu-ai-uretimi",
    kapak: "/gercek/galeri/soyut4.webp",
    baslik: "Sorumlu AI üretimi: telif, güvenlik ve şeffaflık",
    ozet: "Üretken yapay zekâyı güvenli ve etik kullanmak için Vayra'da uyguladığımız ilkeler ve teknik önlemler.",
    kategori: "Şirket",
    sure: "4 dk okuma",
    tarih: "2026-06-28",
    tarihMetin: "28 Haziran 2026",
    yazar: "Arjun Mehta",
    yazarUnvan: "Yapay Zekâ Lideri",
    yazarMono: "AM",
    govde: [
      { tip: "p", metin: "Güçlü araçlar sorumluluk getirir. Üretken AI'yı yaratıcıların yararına, güvenli ve şeffaf biçimde sunmak için birkaç temel ilkeye bağlıyız." },
      { tip: "liste", ogeler: [
        "Telif dostu üretim ve net kullanım hakları",
        "Kötüye kullanımı önleyen moderasyon katmanı",
        "Açık fiyatlandırma, gizli madde yok",
        "Kullanıcı verisinin izinsiz eğitime kullanılmaması",
      ] },
      { tip: "p", metin: "Bu ilkeler ürünün her katmanına gömülü; pazarlama sözü değil, mühendislik kararı." },
    ],
  },
  {
    slug: "model-yonlendirme-mimarisi",
    kapak: "/gercek/orig/banner-neonmancer.webp",
    baslik: "Onlarca AI modelini tek panelde yönlendirmek",
    ozet: "40+ modeli kalite ve maliyet dengesiyle tek arayüzde sunmanın teknik mimarisi: yönlendirme, önbellek ve geri çekilme stratejileri.",
    kategori: "Teknik",
    sure: "7 dk okuma",
    tarih: "2026-06-15",
    tarihMetin: "15 Haziran 2026",
    yazar: "Mei-Lin Chen",
    yazarUnvan: "Kurucu & CTO",
    yazarMono: "MC",
    govde: [
      { tip: "p", metin: "Kullanıcı 'üret' dediğinde arkada onlarca modelden en uygununu seçen bir yönlendirme katmanı çalışır. Amaç: en iyi sonucu, en düşük maliyetle, en hızlı şekilde." },
      { tip: "h2", metin: "Üç temel bileşen" },
      { tip: "liste", ogeler: [
        "Yönlendirici — istek türüne göre model seçimi",
        "Önbellek — tekrar eden üretimlerde anında sonuç",
        "Geri çekilme — bir model düşerse otomatik alternatif",
      ] },
      { tip: "p", metin: "Bu mimari sayesinde yeni bir modeli ürüne eklemek günler değil saatler sürüyor." },
    ],
  },
];

export const blogBul = (slug: string) => BLOG_YAZILARI.find((y) => y.slug === slug);
export const oneCikanYazi = () => BLOG_YAZILARI.find((y) => y.oneCikan) ?? BLOG_YAZILARI[0];
/** Tarihe göre sıralı (en yeni önce). */
export const siraliYazilar = () => [...BLOG_YAZILARI].sort((a, b) => b.tarih.localeCompare(a.tarih));
export const tumEtiketler = () => Array.from(new Set(BLOG_YAZILARI.flatMap((y) => y.etiketler ?? [])));
