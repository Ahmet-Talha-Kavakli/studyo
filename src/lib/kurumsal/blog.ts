/* Blog yazıları — liste + /blog/[slug] detay + generateStaticParams.
   Gövde basit paragraf/başlık dizisi olarak tutulur (markdown bağımlılığı yok). */

export type BlogBlok =
  | { tip: "p"; metin: string }
  | { tip: "h2"; metin: string }
  | { tip: "liste"; ogeler: string[] }
  | { tip: "alinti"; metin: string };

export interface BlogYazi {
  slug: string;
  baslik: string;
  ozet: string;
  kategori: "Ürün" | "Yaratıcılık" | "Şirket" | "Teknik";
  sure: string; // "5 dk okuma"
  tarih: string; // ISO
  tarihMetin: string;
  yazar: string;
  yazarUnvan: string;
  yazarMono: string;
  oneCikan?: boolean;
  govde: BlogBlok[];
}

export const KATEGORILER = ["Tümü", "Ürün", "Yaratıcılık", "Şirket", "Teknik"] as const;

export const BLOG_YAZILARI: BlogYazi[] = [
  {
    slug: "vayra-3d-studyo-tanitim",
    baslik: "3D Stüdyo geliyor: metinden gerçek 3D modele",
    ozet: "Bir cümleyle üretime hazır 3D model, otomatik iskelet ve baskıya hazır çıktı. 3D Stüdyo'nun perde arkasını ve nasıl çalıştığını anlatıyoruz.",
    kategori: "Ürün",
    sure: "6 dk okuma",
    tarih: "2026-07-20",
    tarihMetin: "20 Temmuz 2026",
    yazar: "Clara Lindqvist",
    yazarUnvan: "Ürün Lideri",
    yazarMono: "CL",
    oneCikan: true,
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
