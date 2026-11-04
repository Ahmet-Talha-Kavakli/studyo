/* Basın odası — bültenler, medya kiti, marka renkleri ve künye. */

export interface BasinVarlik {
  ad: string;
  aciklama: string;
  format: string;
  onizleme: string;
  yol: string; // public altındaki indirilebilir dosya
  koyu?: boolean; // açık zeminde gösterilsin mi
}

export const MARKA_VARLIKLAR: BasinVarlik[] = [
  { ad: "İşaret · koyu zemin", aciklama: "Işıklı sürüm, kapak ve video için", format: "WEBP · 1440 px", onizleme: "/brand/vayra-logo-yeni.webp", yol: "/brand/vayra-logo-yeni.webp" },
  { ad: "İşaret", aciklama: "Yalnız işaret, renkli", format: "PNG · şeffaf", onizleme: "/brand/vayra-mark.png", yol: "/brand/vayra-mark.png" },
  { ad: "İşaret · beyaz", aciklama: "Tek renk, fotoğraf üstü için", format: "PNG · şeffaf", onizleme: "/brand/vayra-mark-beyaz.png", yol: "/brand/vayra-mark-beyaz.png" },
  { ad: "Logo animasyonu", aciklama: "Video açılışları için", format: "MP4 · 1080p", onizleme: "/brand/vayra-logo-poster.webp", yol: "/brand/vayra-logo-anim.mp4" },
];

export const URUN_GORSELLERI: { ad: string; yol: string }[] = [
  { ad: "Ana sayfa", yol: "/basin/urun-ana-sayfa.png" },
  { ad: "Video stüdyosu", yol: "/basin/urun-video-studyosu.png" },
  { ad: "Görsel stüdyosu", yol: "/basin/urun-gorsel-studyosu.png" },
  { ad: "Müzik stüdyosu", yol: "/basin/urun-muzik-studyosu.png" },
];

export interface MarkaRenk { ad: string; hex: string; not: string; acik?: boolean }

export const MARKA_RENKLER: MarkaRenk[] = [
  { ad: "Elektrik", hex: "#6D6BFF", not: "Birincil vurgu" },
  { ad: "Gece", hex: "#0A0A0B", not: "Zemin" },
  { ad: "Yüzey", hex: "#111113", not: "Kartlar ve paneller" },
  { ad: "Kâğıt", hex: "#FAFAFA", not: "Metin", acik: true },
  { ad: "Görsel", hex: "#5CB8FF", not: "Tür rengi" },
  { ad: "Video", hex: "#A78BFA", not: "Tür rengi" },
  { ad: "Ses", hex: "#F472B6", not: "Tür rengi" },
  { ad: "Müzik", hex: "#FBBF24", not: "Tür rengi" },
  { ad: "3D", hex: "#34D399", not: "Tür rengi" },
];

export type BultenKategori = "Şirket" | "Ürün" | "Ortaklık";

export interface BasinBulten {
  slug: string;
  baslik: string;
  tarih: string;
  kategori: BultenKategori;
  ozet: string;
  govde: string[];
  alinti?: { metin: string; kisi: string };
}

export const BASIN_BULTENLERI: BasinBulten[] = [
  {
    slug: "vayra-earn-lansman", kategori: "Ürün", tarih: "1 Ekim 2026",
    baslik: "Vayra, kreatörlerin ürettikleri içerikle para kazanabildiği Vayra Earn'ü başlattı",
    ozet: "Kreatörler, Vayra ile ürettikleri içerikleri paylaşarak görüntülenme başına, görev ve yarışmalarla kazanç elde edebilecek.",
    govde: [
      "AMSTERDAM / İSTANBUL — Yaratıcı yapay zekâ platformu Vayra, kreatörlerin platformda ürettikleri içerikleri sosyal medyada paylaşarak kazanç elde edebildiği Vayra Earn'ü kullanıma açtı.",
      "Vayra Earn ile kreatörler; markaların açtığı kampanyalara katılarak her 1.000 görüntülenme için ödeme alabiliyor, sabit ödüllü görevleri tamamlayabiliyor ve ödül havuzlu yarışmalara katılabiliyor. Gönderiler, platform bağlantıları üzerinden doğrulanıyor; kazançlar Türk lirası olarak IBAN ya da Papara hesabına aktarılıyor.",
      "Program; davet ve ortaklık komisyonları ile kreatörlerin kendi stil presetlerini toplulukla paylaşarak kazanç elde edebildiği Marketplace'i de kapsıyor.",
    ],
    alinti: { metin: "Yaratıcıların Vayra'da ürettikleri işler milyonlarca kişiye ulaşıyor. Earn ile bu emeğin karşılığını doğrudan kreatörlere ödüyoruz.", kisi: "Tomás Rivera, Topluluk Lideri" },
  },
  {
    slug: "3d-studyo-duyuru", kategori: "Ürün", tarih: "20 Temmuz 2026",
    baslik: "Vayra 3D Stüdyo'yu duyurdu",
    ozet: "Metinden ve görselden gerçek 3D model üretimi platforma geliyor.",
    govde: [
      "Vayra, metin ya da tek bir görselden dakikalar içinde düzenlenebilir 3D model üreten 3D Stüdyo'yu duyurdu.",
      "3D Stüdyo; otomatik iskelet, hazır animasyonlar, 4K dokular ve oyun motorlarına uygun dışa aktarım seçenekleri sunuyor. Ürün ekipleri, oyun stüdyoları ve e-ticaret markaları için tasarlandı.",
    ],
    alinti: { metin: "3D üretim uzun süre uzmanlara kalmış bir alandı. Artık bir fikri birkaç dakikada sahneye koymak mümkün.", kisi: "Clara Lindqvist, Ürün Lideri" },
  },
  {
    slug: "10000-yaratici", kategori: "Şirket", tarih: "3 Haziran 2026",
    baslik: "Vayra 120'den fazla ülkede 10.000 aktif yaratıcıya ulaştı",
    ozet: "Platform bir yılda üç kıtaya yayıldı.",
    govde: [
      "Vayra, ilk sürümünden bu yana 120'den fazla ülkede 10.000 aktif yaratıcıya ve 8 milyondan fazla üretilen içeriğe ulaştı.",
      "Kullanıcıların yarısından fazlası video ve görsel üretimini birlikte kullanıyor; ajanslar ve markalar ise ekip çalışma alanlarıyla platformun en hızlı büyüyen kullanıcı grubu.",
    ],
  },
  {
    slug: "seri-a-turu", kategori: "Şirket", tarih: "12 Mayıs 2026",
    baslik: "Vayra Seri A yatırım turunu tamamladı",
    ozet: "Global büyüme ve model araştırması için yeni yatırım turu tamamlandı.",
    govde: [
      "Vayra, global büyümesini hızlandırmak ve model araştırmasına yatırım yapmak için Seri A yatırım turunu tamamladı.",
      "Yeni yatırım; çok bölgeli üretim altyapısının genişletilmesi, kurumsal ürünler ve Türkiye operasyonunun büyütülmesi için kullanılacak.",
    ],
    alinti: { metin: "Yaratıcılığın önündeki teknik engelleri kaldırma hedefimiz için güçlü bir ortaklık kurduk.", kisi: "Daniel Okonkwo, Kurucu ve CEO" },
  },
  {
    slug: "singapur-ofisi", kategori: "Şirket", tarih: "9 Nisan 2026",
    baslik: "Vayra'nın Asya-Pasifik ofisi Singapur'da açıldı",
    ozet: "Bölgesel üretim altyapısıyla Asya-Pasifik'te gecikme yarıya indi.",
    govde: [
      "Vayra, Asya-Pasifik bölgesindeki büyümesini desteklemek için Singapur'da ofis açtı.",
      "Bölgede devreye alınan üretim altyapısıyla Asya-Pasifik'teki kullanıcılar için ortalama üretim gecikmesi yarıya indi.",
    ],
  },
  {
    slug: "ses-studyosu-lansmani", kategori: "Ürün", tarih: "18 Mart 2026",
    baslik: "Vayra Profesyonel Ses Stüdyosu yayında",
    ozet: "Seslendirme, ses klonlama ve müzik üretimi tek panelde.",
    govde: [
      "Vayra, 40'tan fazla dilde seslendirme, rıza doğrulamalı ses klonlama ve müzik üretimini bir araya getiren Ses Stüdyosu'nu kullanıma açtı.",
      "Ses Stüdyosu, video projelerine doğrudan eklenebilen sesler ve sözlü şarkılar üretiyor.",
    ],
  },
];

export const bultenBul = (slug: string) => BASIN_BULTENLERI.find((b) => b.slug === slug);

/** Kopyalanabilir şirket tanımı. */
export const BOILERPLATE = "Vayra, video, görsel, ses, müzik ve 3D üretimini tek yerde toplayan yaratıcı yapay zekâ platformudur. 2024'te kurulan şirket; dünyanın önde gelen yapay zekâ modellerini sinema, pazarlama ve 3D gibi uçtan uca stüdyolarla birleştirerek bireysel yaratıcılardan ajanslara ve markalara kadar 120'den fazla ülkede 10.000'den fazla kullanıcıya hizmet veriyor. Merkezi Amsterdam'da bulunan Vayra'nın İstanbul, Londra, New York ve Singapur'da ofisleri bulunuyor.";

/* Şirket künyesi — hızlı gerçekler (basın için). */
export const KUNYE = [
  { etiket: "Kuruluş", deger: "2024" },
  { etiket: "Merkez", deger: "Amsterdam, Hollanda" },
  { etiket: "Ofisler", deger: "Amsterdam · İstanbul · Londra · New York · Singapur" },
  { etiket: "Kategori", deger: "Yaratıcı yapay zekâ platformu" },
  { etiket: "Kullanıcı", deger: "10.000+ yaratıcı, 120+ ülke" },
  { etiket: "Ekip", deger: "30+ kişi, 18 ülke" },
];
