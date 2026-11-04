/* Açık pozisyonlar — kariyer liste + /kariyer/[slug] detay + generateStaticParams. */

export interface Pozisyon {
  slug: string;
  ad: string;
  ekip: string;
  yer: string;
  tur: string; // Tam zamanlı / Yarı zamanlı / Sözleşmeli
  ozet: string;
  gorevler: string[];
  nitelikler: string[];
  arti: string[]; // tercih sebebi
  /** Brüt yıllık maaş aralığı (AB Ücret Şeffaflığı Direktifi). */
  maas: string;
  /** İlan tarihi (ISO). */
  tarih: string;
}

export const POZISYONLAR: Pozisyon[] = [
  {
    slug: "kidemli-frontend-muhendisi",
    maas: "€78.000 – €98.000",
    tarih: "2026-09-28",
    ad: "Kıdemli Frontend Mühendisi",
    ekip: "Mühendislik",
    yer: "Uzaktan · Avrupa",
    tur: "Tam zamanlı",
    ozet: "Vayra stüdyolarının canlı, akıcı arayüzlerini kuran çekirdek ekibe katıl. React, Next.js ve gerçek zamanlı üretim akışlarıyla milyonlarca yaratıcıya dokun.",
    gorevler: [
      "Stüdyo composer'larını ve canlı üretim akışlarını tasarlayıp geliştirmek",
      "Performans bütçelerini korumak; 60fps akıcılık ve hızlı ilk yükleme",
      "Tasarım ekibiyle birlikte tutarlı bir bileşen kütüphanesi büyütmek",
      "Erişilebilirlik (WCAG AA) ve responsive davranışı standartlaştırmak",
    ],
    nitelikler: [
      "5+ yıl modern frontend deneyimi (React/Next.js)",
      "TypeScript'e güçlü hâkimiyet",
      "Karmaşık, durum-yoğun arayüzlerde deneyim",
      "Performans profilleme ve optimizasyon pratiği",
    ],
    arti: ["Canvas/WebGL deneyimi", "AI ürünlerinde çalışmış olmak", "Açık kaynak katkısı"],
  },
  {
    slug: "yapay-zeka-arastirmacisi",
    maas: "€105.000 – €140.000",
    tarih: "2026-09-15",
    ad: "Yapay Zekâ Araştırmacısı (Üretken Modeller)",
    ekip: "Yapay Zekâ",
    yer: "Uzaktan · Global",
    tur: "Tam zamanlı",
    ozet: "Video, görsel ve ses üretiminin kalitesini ileriye taşı. Model entegrasyonu, ince ayar ve değerlendirme hattını sen kur.",
    gorevler: [
      "Üretken model hattını (görsel/video/ses) değerlendirmek ve iyileştirmek",
      "Kalite ve maliyet dengesini optimize eden yönlendirme stratejileri kurmak",
      "Otomatik değerlendirme (eval) altyapısı geliştirmek",
      "Yeni modelleri hızla prototipleyip ürüne taşımak",
    ],
    nitelikler: [
      "Üretken modeller (difüzyon/transformer) üzerine derin bilgi",
      "Python + PyTorch deneyimi",
      "Model değerlendirme metodolojilerine hâkimiyet",
      "Araştırmayı ürüne çevirebilme becerisi",
    ],
    arti: ["Yayınlanmış araştırma", "Video/ses üretimi deneyimi", "MLOps"],
  },
  {
    slug: "urun-tasarimcisi",
    maas: "€68.000 – €88.000",
    tarih: "2026-10-02",
    ad: "Ürün Tasarımcısı",
    ekip: "Tasarım",
    yer: "Uzaktan · Avrupa/Amerika",
    tur: "Tam zamanlı",
    ozet: "Karmaşık üretim akışlarını sade, keyifli deneyimlere çevir. Vayra'nın görsel dilini ve etkileşim standartlarını sen şekillendir.",
    gorevler: [
      "Uçtan uca akışları tasarlamak (araştırma → prototip → teslim)",
      "Tasarım sistemini büyütmek ve tutarlılığı korumak",
      "Mühendislikle sıkı iş birliğiyle yüksek kaliteli teslim",
      "Kullanıcı görüşmeleri ve kullanılabilirlik testleri yürütmek",
    ],
    nitelikler: [
      "4+ yıl ürün tasarımı deneyimi",
      "Güçlü bir portföy (SaaS/araç ürünleri)",
      "Figma'da ileri seviye",
      "Etkileşim ve mikro-animasyon duyarlılığı",
    ],
    arti: ["Motion tasarımı", "Yaratıcı araçlar deneyimi", "Az miktarda kod yazabilme"],
  },
  {
    slug: "buyume-pazarlama-uzmani",
    maas: "$95.000 – $120.000",
    tarih: "2026-09-20",
    ad: "Büyüme & Pazarlama Uzmanı",
    ekip: "Büyüme",
    yer: "Uzaktan · Amerika",
    tur: "Tam zamanlı",
    ozet: "Vayra'yı doğru yaratıcılarla buluştur. İçerik, topluluk ve performans pazarlamasını veriyle yönet.",
    gorevler: [
      "Edinim kanallarını kurmak ve ölçeklemek",
      "İçerik ve topluluk stratejisi yürütmek",
      "Dönüşüm hunisini analiz edip iyileştirmek",
      "Yaratıcı iş birlikleri ve kampanyalar tasarlamak",
    ],
    nitelikler: [
      "3+ yıl büyüme/pazarlama deneyimi",
      "Veri odaklı karar alma",
      "İçerik üretimine yatkınlık",
      "SaaS ya da yaratıcı ürün deneyimi",
    ],
    arti: ["Video içerik üretimi", "SEO", "Topluluk yönetimi"],
  },
  {
    slug: "musteri-basari-uzmani",
    maas: "€52.000 – €64.000",
    tarih: "2026-10-06",
    ad: "Müşteri Başarı Uzmanı",
    ekip: "Operasyon",
    yer: "Amsterdam · Hibrit",
    tur: "Tam zamanlı",
    ozet: "Kurumsal müşterilerin Vayra'dan en yüksek değeri almasını sağla. İlk günden başarıya kadar yanlarında ol.",
    gorevler: [
      "Kurumsal müşteri onboarding ve eğitim süreçlerini yürütmek",
      "Müşteri geri bildirimini ürün ekibine taşımak",
      "Kullanım ve memnuniyeti izleyip proaktif destek vermek",
      "Yenileme ve büyüme fırsatlarını yönetmek",
    ],
    nitelikler: [
      "2+ yıl müşteri başarı/destek deneyimi",
      "Mükemmel İngilizce iletişim (yazılı + sözlü)",
      "SaaS ürünlerine hâkimiyet",
      "Çözüm odaklı, empatik yaklaşım",
    ],
    arti: ["Yaratıcı araç deneyimi", "Teknik altyapı bilgisi"],
  },
  {
    slug: "kurumsal-satis-yoneticisi-istanbul",
    maas: "₺2.400.000 – ₺3.100.000 + prim",
    tarih: "2026-10-09",
    ad: "Kurumsal Satış Yöneticisi",
    ekip: "Satış",
    yer: "İstanbul · Hibrit",
    tur: "Tam zamanlı",
    ozet: "Türkiye'deki ajans, e-ticaret ve medya şirketlerine Vayra Kurumsal'ı anlatacak, satış sürecini baştan sona yürütecek ilk kurumsal satış rolü.",
    gorevler: ["Ajans ve markalarla keşif görüşmeleri yapmak, demo sunmak", "Teklif, sözleşme ve satın alma süreçlerini yönetmek", "Ürün ekibine sahadan geri bildirim taşımak", "Türkiye satış oyun kitabını kurmak"],
    nitelikler: ["B2B SaaS'ta 4+ yıl kurumsal satış deneyimi", "Ajans ya da yaratıcı sektörde ağ", "Akıcı Türkçe ve iyi derecede İngilizce"],
    arti: ["Yapay zekâ ürünleri satmış olmak", "Kamu ve büyük holding satın alma süreçlerini bilmek"],
  },
  {
    slug: "kreator-topluluk-yoneticisi",
    maas: "₺1.500.000 – ₺1.950.000",
    tarih: "2026-10-04",
    ad: "Kreatör Topluluk Yöneticisi",
    ekip: "Topluluk",
    yer: "İstanbul · Hibrit",
    tur: "Tam zamanlı",
    ozet: "Vayra Earn kreatörlerini büyütecek, kampanyaları markalarla birlikte tasarlayacak ve Türkiye'deki yaratıcı topluluğun sesi olacaksın.",
    gorevler: ["Kreatör kampanyalarını kurgulamak ve yönetmek", "Topluluk etkinlikleri ve atölyeler düzenlemek", "Kreatör başarı hikâyelerini içeriğe dönüştürmek"],
    nitelikler: ["Sosyal medya ve kreatör ekonomisini yakından tanımak", "Proje yönetimi becerisi", "Güçlü Türkçe yazım"],
    arti: ["Kendi içerik kanalını yönetmiş olmak", "Video kurgu deneyimi"],
  },
  {
    slug: "backend-muhendisi-uretim-altyapisi",
    maas: "€82.000 – €104.000",
    tarih: "2026-09-24",
    ad: "Backend Mühendisi · Üretim Altyapısı",
    ekip: "Mühendislik",
    yer: "Uzaktan · Avrupa/Türkiye",
    tur: "Tam zamanlı",
    ozet: "Günde milyonlarca üretim isteğini model sağlayıcılarına yönlendiren kuyruk, faturalama ve gözlemlenebilirlik altyapısını büyüteceksin.",
    gorevler: ["Çok sağlayıcılı yönlendirme ve yeniden deneme mantığını geliştirmek", "Kredi ve faturalama sisteminin doğruluğunu korumak", "Gecikme ve maliyet metriklerini izlemek, iyileştirmek"],
    nitelikler: ["Dağıtık sistemlerde 4+ yıl deneyim", "TypeScript ya da Go", "Postgres ve kuyruk sistemleri"],
    arti: ["GPU iş yükleri", "Ödeme sistemleri deneyimi"],
  },
  {
    slug: "guven-guvenlik-uzmani",
    maas: "€62.000 – €78.000",
    tarih: "2026-09-30",
    ad: "Güven ve Güvenlik Uzmanı",
    ekip: "Güven & Güvenlik",
    yer: "Uzaktan · Avrupa",
    tur: "Tam zamanlı",
    ozet: "İçerik politikalarımızı uygulayacak, kötüye kullanım örüntülerini tespit edecek ve moderasyon sistemlerimizi geliştireceksin.",
    gorevler: ["Politika ihlali bildirimlerini incelemek ve itirazları değerlendirmek", "Otomatik denetim kurallarını iyileştirmek", "Kolluk ve çocuk koruma kuruluşlarıyla süreçleri yürütmek"],
    nitelikler: ["Güven ve güvenlik ya da moderasyon alanında 3+ yıl", "Sentetik medya risklerine hâkimiyet", "Hassas içerikle çalışabilme dayanıklılığı"],
    arti: ["Türkçe ve başka bir Avrupa dili", "Veri analizi (SQL)"],
  },
  {
    slug: "destek-uzmani-turkce",
    maas: "₺1.100.000 – ₺1.400.000",
    tarih: "2026-10-08",
    ad: "Destek Uzmanı (Türkçe)",
    ekip: "Operasyon",
    yer: "İstanbul · Uzaktan",
    tur: "Tam zamanlı",
    ozet: "Türkiye'deki kullanıcılarımızın ilk temas noktası olacak; faturalama, üretim ve hesap sorularını hızla ve sıcak bir dille çözeceksin.",
    gorevler: ["E-posta ve iletişim formu taleplerini yanıtlamak", "Sık sorunları belgelemek, yardım içeriği yazmak", "Hataları mühendislik ekibine tekrar üretilebilir şekilde iletmek"],
    nitelikler: ["Müşteri desteğinde 2+ yıl", "Mükemmel Türkçe yazım, iyi İngilizce", "Teknik ürünleri öğrenme isteği"],
    arti: ["Yaratıcı yazılımları kullanmış olmak"],
  },
  {
    slug: "hukuk-musaviri-veri-koruma",
    maas: "₺2.200.000 – ₺2.800.000",
    tarih: "2026-09-18",
    ad: "Hukuk Müşaviri · Veri Koruma",
    ekip: "Hukuk",
    yer: "İstanbul · Hibrit",
    tur: "Tam zamanlı",
    ozet: "KVKK ve GDPR uyumumuzu, kurumsal sözleşmelerimizi ve kreatör programımızın hukuki altyapısını yöneteceksin.",
    gorevler: ["Veri işleme sözleşmelerini ve yurt dışı aktarım süreçlerini yürütmek", "Kurumsal müşteri sözleşmelerini müzakere etmek", "Tüketici ve e-ticaret mevzuatı uyumunu sağlamak"],
    nitelikler: ["Avukatlık ruhsatı ve 5+ yıl deneyim", "KVKK ve tüketici mevzuatında uzmanlık", "İyi derecede İngilizce"],
    arti: ["Teknoloji şirketinde şirket içi deneyim", "GDPR / IAPP sertifikası"],
  },
];

export const pozisyonBul = (slug: string) => POZISYONLAR.find((p) => p.slug === slug);
