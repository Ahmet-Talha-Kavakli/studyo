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
}

export const POZISYONLAR: Pozisyon[] = [
  {
    slug: "kidemli-frontend-muhendisi",
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
];

export const pozisyonBul = (slug: string) => POZISYONLAR.find((p) => p.slug === slug);
