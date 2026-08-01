/* ══════════════════════════════════════════════════════════════════
   BAĞLAYICILAR — referanslar/baglayicilar (55 ekran) birebir.
   7 kategori · 33 servis. Açıklamalar ve yetenek listeleri referanstan.
   ══════════════════════════════════════════════════════════════════ */

export type BaglayiciDurum = "hazir" | "bekliyor" | "bolgeDisi";

export interface Baglayici {
  id: string;
  ad: string;
  /** Kart üzerindeki tek satır (taşarsa kesilir). */
  kisa: string;
  /** Detay modalındaki tam açıklama. */
  tam: string;
  /** Modaldaki "Yetenekler" madde listesi. */
  yetenekler: string[];
  /** Karüseldeki tek satırlık yetenek özeti. */
  ozet: string;
  /** Marka rengi — logo karesi zemini. */
  renk: string;
  /** Tek-renk marka logosu (public/marka/<id>.svg) — mask ile kare kontrastına boyanır. */
  logo?: string;
  /** Çok-renkli resmi logo (public/marka/<id>_alt.svg) — olduğu gibi gösterilir. */
  logoRenkli?: string;
  durum?: BaglayiciDurum;
}

export interface BaglayiciBolum {
  ad: string;
  baglayicilar: Baglayici[];
}

export const BAGLAYICI_BOLUMLERI: BaglayiciBolum[] = [
  {
    ad: "İLETİŞİM",
    baglayicilar: [
      {
        id: "telegram", ad: "Telegram", renk: "#2AABEE", logo: "/marka/telegram.svg",
        kisa: "Telegram, bulut tabanlı ve şifreli bir mesajlaşma platformudur.",
        tam: "Telegram, hız ve güvenlik odaklı, bulut tabanlı şifreli mesajlaşma platformudur.",
        ozet: "Bot üzerinden mesaj gönder ve al",
        yetenekler: [
          "Bot aracılığıyla mesaj gönder", "Kanal ve gruplara içerik yayınla",
          "Gelen mesajları webhook ile işle", "Medya ve dosya paylaş",
          "Bot komutlarını yönet",
        ],
      },
      {
        id: "whatsapp", ad: "WhatsApp Business", renk: "#25D366", logo: "/marka/whatsapp.svg",
        kisa: "WhatsApp Business, işletmelerin müşterileriyle ölçekli iletişim kurmasını sağlar.",
        tam: "WhatsApp Business, işletmelerin müşterileriyle ölçekli iletişim kurması için mesajlaşma, şablon ve medya paylaşımı araçları sunar.",
        ozet: "Müşterilere şablonlu mesaj gönder",
        yetenekler: [
          "Müşterilere metin mesajı gönder", "Değişkenli şablon mesajları gönder",
          "Mesaj şablonlarını listele ve yönet", "Görsel, belge ve video içeren medya mesajları gönder",
          "Telefon numaralarını ve işletme profillerini yönet", "Gelen mesajları webhook ile al ve işle",
        ],
      },
      {
        id: "slack", ad: "Slack", renk: "#4A154B", logoRenkli: "/marka/slack_alt.svg",
        kisa: "Slack, iş için yapay zekâ destekli platformdur.",
        tam: "Slack, tüm konuşmalarını, uygulamalarını ve müşterilerini tek yerde toplayan yapay zekâ destekli iş platformudur.",
        ozet: "Kanallara ve doğrudan mesaj gönder",
        yetenekler: [
          "Kanallara ve doğrudan mesaj gönder", "Çalışma alanı genelinde mesaj ara",
          "Kanal oluştur, arşivle ve yönet", "Dosya yükle ve içerik paylaş",
          "Kullanıcıları, kanalları ve çalışma alanı bilgisini listele",
          "Mesajlara tepki ver ve konuları yönet", "Kanal konusu ve amacını belirle",
        ],
      },
      {
        id: "discord", ad: "Discord Bot", renk: "#5865F2", logo: "/marka/discord.svg",
        kisa: "Discord, topluluklar ve ekipler için bir iletişim platformudur.",
        tam: "Discord; topluluklar, oyun ve ekipler için metin, ses ve video kanalları sunan bir iletişim platformudur.",
        ozet: "Kanallara ve kullanıcılara mesaj gönder",
        yetenekler: [
          "Kanallara ve kullanıcılara mesaj gönder", "Sunucu kanallarını ve kategorilerini yönet",
          "Sunucu üyelerini, rolleri ve izinleri yönet", "Mesajlara tepki ver ve konuları yönet",
          "Webhook oluştur ve yönet", "Sunucuları, kanalları ve üyeleri listele",
        ],
      },
      {
        id: "twilio", ad: "Twilio", renk: "#F22F46", logoRenkli: "/marka/twilio_alt.svg",
        kisa: "Twilio, bulut tabanlı bir iletişim platformudur.",
        tam: "Twilio; API üzerinden SMS, sesli arama ve mesajlaşma uygulamaları kurmak için bulut tabanlı bir iletişim platformudur.",
        ozet: "SMS ve sesli arama gönder",
        yetenekler: [
          "SMS mesajları gönder ve al", "Telefon aramaları yap ve yönet",
          "Medyalı MMS mesajları gönder", "Telefon numarası bilgisi sorgula",
          "Mesajlaşma servislerini yönet", "Arama ve mesaj kayıtlarını listele",
        ],
      },
    ],
  },
  {
    ad: "SOSYAL MEDYA VE YAYIN",
    baglayicilar: [
      {
        id: "linkedin", ad: "LinkedIn", renk: "#0A66C2", logoRenkli: "/marka/linkedin_alt.svg",
        kisa: "Bağlı LinkedIn profiline metin, görsel ve video gönderileri yayınla.",
        tam: "Bağlı LinkedIn profiline metin, görsel, çoklu görsel ve video gönderileri yayınla.",
        ozet: "Profile gönderi yayınla",
        yetenekler: [
          "Metin, görsel, çoklu görsel ve video gönderileri yayınla.",
          "Onaylı URL'lerden medya yükle.",
          "Bağlı LinkedIn profiline gönderi paylaş.",
        ],
      },
      {
        id: "tiktok", ad: "TikTok", renk: "#000000", logo: "/marka/tiktok.svg",
        kisa: "Video ve fotoğraf yayınla, üretici limitlerini incele.",
        tam: "Video ve fotoğraf yayınla, üretici limitlerini incele ve organik video analizlerini oku.",
        ozet: "Video ve fotoğraf yayınla",
        yetenekler: [
          "TikTok'a video ve fotoğraf yayınla.",
          "Paylaşımdan önce üretici limitlerini ve gizlilik seçeneklerini incele.",
          "TikTok uyumlu önizleme, bildirim ve onay adımlarını kullan.",
          "Bağlı hesabın organik video analizlerini oku.",
        ],
      },
      {
        id: "x", ad: "X", renk: "#000000", logo: "/marka/x.svg",
        kisa: "Zaman akışını ve bahsetmeleri oku, medyalı gönderi yayınla.",
        tam: "Zaman akışını ve bahsetmeleri oku, medyalı gönderiler yayınla ve X üzerindeki gönderilerini yönet.",
        ozet: "Gönderi yayınla ve akışı oku",
        yetenekler: [
          "Zaman akışlarını, bahsetmeleri, beğenilen gönderileri ve profilleri oku.",
          "Metin, görsel veya video içeren gönderiler yayınla.",
          "Bağlı hesabın yazdığı gönderileri yönet.",
        ],
      },
      {
        id: "instagram", ad: "Instagram", renk: "#E4405F", logo: "/marka/instagram.svg", durum: "bolgeDisi",
        kisa: "Akış gönderileri, reels, hikâye ve karusel yayınla.",
        tam: "Akış gönderileri, reels, hikâye ve karuseller yayınla, ardından medya yorumlarını yönet.",
        ozet: "Reels, hikâye ve karusel yayınla",
        yetenekler: [
          "Akış gönderileri, reels, hikâye ve karuseller yayınla.",
          "Onaylı URL'lerden görsel ve video yükle.",
          "Medyayı listele, durumunu incele ve yorumları yönet.",
        ],
      },
      {
        id: "threads", ad: "Threads", renk: "#000000", logo: "/marka/threads.svg", durum: "bolgeDisi",
        kisa: "Metin, görsel, video ve karusel gönderiler yayınla.",
        tam: "Metin, görsel, video ve karusel gönderiler yayınla, bağlı profilin limitlerini incele.",
        ozet: "Metin ve medya gönderisi yayınla",
        yetenekler: [
          "Metin, görsel, video ve karusel gönderiler yayınla.",
          "Bağlı profili ve yayın kotasını kontrol et.",
          "Gönderi detaylarını ve konteyner durumunu getir.",
        ],
      },
      {
        id: "tiktok-ads", ad: "TikTok Ads", renk: "#FE2C55", durum: "bekliyor",
        kisa: "TikTok Ads Manager'ı bağlayarak video hazırla ve reklam oluştur.",
        tam: "TikTok Business API üzerinden video hazırlamak ve reklam oluşturmak için TikTok Ads Manager'ı bağla.",
        ozet: "Kampanya ve reklam grubu yönet",
        yetenekler: [
          "Bağlı TikTok Ads jetonuna yetkili reklamveren hesaplarını listele.",
          "Bir reklamveren için kampanyaları listele.",
          "Kampanya oluştur (duraklatılmış başlar).",
          "Reklam gruplarını listele ve oluştur.",
        ],
      },
    ],
  },
  {
    ad: "E-POSTA VE TAKVİM",
    baglayicilar: [
      {
        id: "gmail", ad: "Gmail", renk: "#EA4335", logo: "/marka/gmail.svg",
        kisa: "Gmail, Google'ın ücretsiz e-posta hizmetidir.",
        tam: "Gmail; bütünleşik iletişim araçları, düzenleme özellikleri ve güçlü arama sunan, Google'a ait ücretsiz bir e-posta hizmetidir.",
        ozet: "Ek ve HTML biçimli e-posta gönder",
        yetenekler: [
          "Ek ve HTML biçimlendirmeli e-posta gönder", "Gelen kutusu ve etiketlerde e-posta ara ve oku",
          "Taslak oluştur, güncelle ve gönder", "E-postaları yanıtla ve ilet",
          "Etiketleri yönet ve mesajları düzenle", "E-posta etiketi ekle ve kaldır",
        ],
      },
      {
        id: "google-calendar", ad: "Google Takvim", renk: "#4285F4", logo: "/marka/google-calendar.svg",
        kisa: "Google Takvim, bir zaman yönetimi ve planlama hizmetidir.",
        tam: "Google Takvim; etkinlik, toplantı ve hatırlatmaları düzenlemek için bir zaman yönetimi ve planlama hizmetidir.",
        ozet: "Etkinlik oluştur ve takvimi yönet",
        yetenekler: [
          "Takvim etkinliği oluştur, güncelle ve sil", "Tarih aralığı ve sorgu filtreleriyle etkinlikleri listele",
          "Boş ve dolu zaman aralıklarını bul", "Etkinlik katılımcılarını yönet ve davet gönder",
          "Etkinlik hatırlatmalarını ayarla ve yönet", "Birden çok takvime eriş ve yönet",
        ],
      },
      {
        id: "sendgrid", ad: "SendGrid", renk: "#1A82E2",
        kisa: "SendGrid, bulut tabanlı bir e-posta teslim platformudur.",
        tam: "SendGrid; işlemsel ve pazarlama e-postalarını ölçekli göndermek için bulut tabanlı bir e-posta teslim platformudur.",
        ozet: "İşlemsel ve pazarlama e-postası gönder",
        yetenekler: [
          "İşlemsel ve pazarlama e-postaları gönder", "Kişileri ve kişi listelerini yönet",
          "E-posta şablonları oluştur ve yönet", "Teslimat, açılma ve tıklamaları izle",
          "Gönderen kimliklerini ve alan adlarını yönet", "E-postaları ileri bir tarihe planla",
        ],
      },
      {
        id: "outlook", ad: "Microsoft Outlook", renk: "#0078D4", logoRenkli: "/marka/outlook_alt.svg",
        kisa: "Microsoft Outlook, bir e-posta ve takvim hizmetidir.",
        tam: "Microsoft Outlook; e-posta gönderip almak, düzenlemek, kişileri yönetmek ve etkinlik planlamak için bir e-posta ve takvim hizmetidir.",
        ozet: "E-posta gönder ve takvim yönet",
        yetenekler: [
          "Ekli e-posta gönder", "Klasörlerde e-posta oku ve ara",
          "Takvim etkinliği oluştur, güncelle ve sil", "Kişileri ve kişi klasörlerini yönet",
          "E-posta klasörleri oluştur ve yönet", "E-postaları yanıtla ve ilet",
        ],
      },
    ],
  },
  {
    ad: "BELGELER",
    baglayicilar: [
      {
        id: "google-drive", ad: "Google Drive", renk: "#0F9D58", logo: "/marka/google-drive.svg",
        kisa: "Google Drive, bir dosya depolama ve eşitleme hizmetidir.",
        tam: "Google Drive; işini çevrimiçi oluşturup paylaşmanı ve belgelerine her yerden erişmeni sağlayan bir dosya depolama ve eşitleme hizmetidir.",
        ozet: "Dosya yükle, ara ve paylaş",
        yetenekler: [
          "Dosya ve klasörleri yükle, indir ve yönet", "Metin içeriğinden veya şablondan dosya oluştur",
          "Sorgu filtreleriyle dosya ve klasör ara", "Dosya paylaş ve paylaşım izinlerini yönet",
          "Dosya kopyala, taşı ve yeniden adlandır", "Klasör ve alt klasör oluştur ve düzenle",
          "Paylaşılan sürücüleri ara ve yönet",
        ],
      },
      {
        id: "google-docs", ad: "Google Dokümanlar", renk: "#4285F4", logo: "/marka/google-docs.svg",
        kisa: "Google Dokümanlar, bulut tabanlı bir kelime işlemcisidir.",
        tam: "Google Dokümanlar; gerçek zamanlı ortak çalışma sunan bulut tabanlı bir kelime işlemcisidir.",
        ozet: "Belge oluştur ve düzenle",
        yetenekler: [
          "Belge oluştur ve düzenle", "Belge içeriğini oku ve güncelle",
          "Belgeleri paylaş ve izinleri yönet", "Belgelerde metin ara ve değiştir",
        ],
      },
      {
        id: "onedrive", ad: "Microsoft OneDrive", renk: "#0078D4", logoRenkli: "/marka/onedrive_alt.svg",
        kisa: "Microsoft OneDrive, dosyalarını depolamanı ve paylaşmanı sağlar.",
        tam: "Microsoft OneDrive; dosyalarını depolamanı, eşitlemeni ve paylaşmanı sağlayan bir bulut depolama hizmetidir.",
        ozet: "Dosya yükle ve paylaş",
        yetenekler: [
          "Dosya ve klasörleri yükle ve indir", "Dosya ara ve düzenle",
          "Dosya paylaş ve izinleri yönet", "Klasör oluştur ve taşı",
        ],
      },
      {
        id: "notion", ad: "Notion", renk: "#FFFFFF", logo: "/marka/notion.svg",
        kisa: "Notion",
        tam: "Notion; not, veritabanı ve wiki'yi tek çalışma alanında birleştiren bir üretkenlik aracıdır.",
        ozet: "Sayfa ve veritabanı yönet",
        yetenekler: [
          "Sayfa oluştur ve güncelle", "Veritabanlarını sorgula ve filtrele",
          "Blok içeriği ekle ve düzenle", "Çalışma alanında ara",
        ],
      },
      {
        id: "google-sheets", ad: "Google E-Tablolar", renk: "#0F9D58", logo: "/marka/google-sheets.svg",
        kisa: "Google E-Tablolar, çevrimiçi bir hesap tablosu uygulamasıdır.",
        tam: "Google E-Tablolar; gerçek zamanlı ortak çalışmayla veri düzenlemeni sağlayan çevrimiçi bir hesap tablosu uygulamasıdır.",
        ozet: "Satır oku, yaz ve güncelle",
        yetenekler: [
          "Satır ekle, oku ve güncelle", "Sayfa oluştur ve yönet",
          "Hücre aralıklarını biçimlendir", "Formül uygula ve veriyi filtrele",
        ],
      },
      {
        id: "dropbox", ad: "Dropbox", renk: "#0061FF", logo: "/marka/dropbox.svg",
        kisa: "Dropbox, bulut tabanlı bir dosya depolama hizmetidir.",
        tam: "Dropbox; dosyalarını her cihazda eşitleyip paylaşmanı sağlayan bulut tabanlı bir dosya depolama hizmetidir.",
        ozet: "Dosya yükle ve bağlantı paylaş",
        yetenekler: [
          "Dosya yükle ve indir", "Paylaşım bağlantısı oluştur",
          "Klasör oluştur ve düzenle", "Dosya ara ve sürümleri yönet",
        ],
      },
    ],
  },
  {
    ad: "YÖNETİM",
    baglayicilar: [
      {
        id: "hubspot", ad: "HubSpot", renk: "#FF7A59", logo: "/marka/hubspot.svg",
        kisa: "HubSpot'un CRM platformu tüm müşteri verini bir arada tutar.",
        tam: "HubSpot'un CRM platformu; pazarlama, satış ve müşteri hizmetleri verini tek yerde toplar.",
        ozet: "Kişi ve fırsatları yönet",
        yetenekler: [
          "Kişi oluştur ve güncelle", "Fırsatları ve satış hattını yönet",
          "Şirket kayıtlarını sorgula", "E-posta ve etkinlikleri kaydet",
        ],
      },
      {
        id: "linear", ad: "Linear", renk: "#5E6AD2", logo: "/marka/linear.svg",
        kisa: "Linear, modern bir iş takip aracıdır.",
        tam: "Linear; yazılım ekipleri için tasarlanmış modern, hızlı bir iş ve proje takip aracıdır.",
        ozet: "Görev oluştur ve döngü yönet",
        yetenekler: [
          "Görev oluştur, güncelle ve kapat", "Döngü ve projeleri yönet",
          "Görevleri filtrele ve ara", "Yorum ekle ve etiket ata",
        ],
      },
      {
        id: "jira", ad: "Jira", renk: "#0052CC", logo: "/marka/jira.svg",
        kisa: "Jira, bir proje takip ve iş yönetim aracıdır.",
        tam: "Jira; çevik ekipler için proje takip, iş yönetimi ve raporlama aracıdır.",
        ozet: "İş kaydı oluştur ve takip et",
        yetenekler: [
          "İş kaydı oluştur ve güncelle", "Sprint ve panoları yönet",
          "JQL ile arama yap", "Yorum ve ek ekle",
        ],
      },
      {
        id: "todoist", ad: "Todoist", renk: "#E44332", logo: "/marka/todoist.svg",
        kisa: "Todoist, bir görev yönetimi uygulamasıdır.",
        tam: "Todoist; görevlerini düzenlemeni ve önceliklendirmeni sağlayan bir görev yönetimi uygulamasıdır.",
        ozet: "Görev oluştur ve tamamla",
        yetenekler: [
          "Görev oluştur ve tamamla", "Proje ve bölümleri yönet",
          "Son tarih ve öncelik ata", "Etiketlerle filtrele",
        ],
      },
      {
        id: "salesforce", ad: "Salesforce", renk: "#00A1E0", logoRenkli: "/marka/salesforce_alt.svg",
        kisa: "Kayıtları sorgula, oluştur, güncelle ve sil.",
        tam: "Salesforce CRM kayıtlarını sorgula, oluştur, güncelle ve sil.",
        ozet: "CRM kayıtlarını sorgula ve yönet",
        yetenekler: [
          "SOQL ile kayıt sorgula", "Kayıt oluştur ve güncelle",
          "Fırsat ve müşteri adaylarını yönet", "Özel nesnelerle çalış",
        ],
      },
    ],
  },
  {
    ad: "GELİŞTİRME",
    baglayicilar: [
      {
        id: "github", ad: "GitHub", renk: "#FFFFFF", logo: "/marka/github.svg",
        kisa: "GitHub, sürüm kontrolü ve iş birliği platformudur.",
        tam: "GitHub; sürüm kontrolü, kod barındırma ve iş birliği için bir geliştirici platformudur.",
        ozet: "Depo, PR ve issue yönet",
        yetenekler: [
          "Depoları listele ve oluştur", "Issue oluştur ve yönet",
          "Pull request aç ve incele", "Dosya oku ve commit gönder",
          "Actions iş akışlarını tetikle",
        ],
      },
      {
        id: "supabase", ad: "Supabase", renk: "#3ECF8E", logo: "/marka/supabase.svg",
        kisa: "Supabase, açık kaynaklı bir Firebase alternatifidir.",
        tam: "Supabase; Postgres veritabanı, kimlik doğrulama ve depolama sunan açık kaynaklı bir arka uç platformudur.",
        ozet: "Veritabanı sorgula ve yönet",
        yetenekler: [
          "Tabloları sorgula ve güncelle", "Kimlik doğrulama kullanıcılarını yönet",
          "Depolama kovalarına dosya yükle", "Edge fonksiyonlarını çağır",
        ],
      },
    ],
  },
  {
    ad: "VİDEO VE MEDYA",
    baglayicilar: [
      {
        id: "whisper", ad: "OpenAI Whisper", renk: "#10A37F", logoRenkli: "/marka/openai_alt.svg",
        kisa: "Ses dosyalarını metne dönüştür.",
        tam: "Ses dosyalarını yüksek doğrulukla metne dönüştür ve altyazı üret.",
        ozet: "Sesi metne dönüştür",
        yetenekler: [
          "Ses dosyalarını metne dönüştür", "Zaman damgalı altyazı üret",
          "Konuşulan dili algıla", "Çeviri modunda çalıştır",
        ],
      },
      {
        id: "youtube-analytics", ad: "YouTube Analytics", renk: "#FF0000", logo: "/marka/youtube-analytics.svg",
        kisa: "YouTube Analytics API raporlama verisine erişim sağlar.",
        tam: "YouTube Analytics API; video metrikleri, kanal performansı ve izleyici içgörüleri dahil raporlama verisine erişim sağlar.",
        ozet: "Kanal ve video analizlerini oku",
        yetenekler: [
          "Belirli videolar için ayrıntılı analiz getir", "Kanal için özet analiz raporu al",
          "Tarih aralığı filtreleriyle özel analiz sorgula", "Kanal raporlarını türe göre listele",
          "İzleyici demografisi ve etkileşim metriklerine eriş",
        ],
      },
      {
        id: "vimeo", ad: "Vimeo", renk: "#1AB7EA", logo: "/marka/vimeo.svg",
        kisa: "Vimeo, bir video barındırma ve paylaşım platformudur.",
        tam: "Vimeo; profesyoneller için video barındırma, paylaşım ve iş birliği platformudur.",
        ozet: "Video yükle ve yönet",
        yetenekler: [
          "Video yükle ve yayınla", "Video meta verisini güncelle",
          "Albüm ve kanalları yönet", "İzlenme istatistiklerini oku",
        ],
      },
      {
        id: "youtube-data", ad: "YouTube Data", renk: "#FF0000", logo: "/marka/youtube-data.svg",
        kisa: "YouTube Data API, YouTube işlevlerini uygulamana ekler.",
        tam: "YouTube Data API; video yükleme, oynatma listesi yönetimi ve arama işlevlerini uygulamana eklemeni sağlar.",
        ozet: "Video yükle ve oynatma listesi yönet",
        yetenekler: [
          "Video yükle ve meta verisini güncelle", "Oynatma listeleri oluştur ve yönet",
          "Video ve kanal ara", "Yorumları oku ve yanıtla",
        ],
      },
      {
        id: "frameio", ad: "Frame.io", renk: "#5B53FF",
        kisa: "Varlıkları ara, proje oluştur ve yorumları yönet.",
        tam: "Frame.io; video ekipleri için varlık paylaşımı, inceleme ve onay platformudur.",
        ozet: "Varlık ara ve proje yönet",
        yetenekler: [
          "Varlıkları ara ve listele", "Proje ve klasör oluştur",
          "Yorum ve incelemeleri yönet", "Paylaşım bağlantısı üret",
        ],
      },
    ],
  },
];

/** Düz liste — arama ve id ile bulma için. */
export const TUM_BAGLAYICILAR: Baglayici[] = BAGLAYICI_BOLUMLERI.flatMap((b) => b.baglayicilar);

export function baglayiciBul(id: string): Baglayici | undefined {
  return TUM_BAGLAYICILAR.find((b) => b.id === id);
}
