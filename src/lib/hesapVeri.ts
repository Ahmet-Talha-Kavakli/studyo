/**
 * Hesap / Fiyatlandırma verisi — Higgsfield /me/settings & upgrade modalı birebir Türkçe.
 * Fiyat planları, kredi paketleri, unlimited modeller, kullanım geçmişi (deterministik).
 * SSR güvenli.
 */

/* ── Abonelik planları (Upgrade Plan sekmesi) ── */
export interface Plan {
  ad: string;
  rozet?: string;         // "20% İNDİRİM" gibi
  enIyiDeger?: boolean;
  ozet: string;
  kredi: string;          // "1.000 kredi/ay"
  krediNot: string;
  ayFiyat: number;        // aylık (yıllık faturalı)
  eskiFiyat: number;
  fiyatSonek: string;     // "/ay, yıllık faturalı"
  cta: string;
  ctaRenk: "cyan" | "pembe" | "mavi";
  ozellikler: { ad: string; var: boolean; deger?: string }[];
  tema: "yesil" | "bordo" | "koyu";
}

export const PLANLAR: Plan[] = [
  {
    ad: "PLUS", rozet: "%20 İNDİRİM", ozet: "Tutarlı ve kolay AI içerik üretimi için",
    kredi: "1.000 kredi/ay", krediNot: "500 Nano Banana Pro üretimi, yaklaşık 44 Seedance 2.0 video",
    ayFiyat: 39, eskiFiyat: 49, fiyatSonek: "/ay, yıllık faturalı", cta: "Taahhüdü Değiştir", ctaRenk: "cyan", tema: "yesil",
    ozellikler: [
      { ad: "Paralel üretim: 6 Video, 8 Görsel", var: true },
      { ad: "Usta erişimi", var: true },
      { ad: "Tüm Seedance modelleri", var: true },
      { ad: "Tüm modeller & özellikler", var: true },
      { ad: "Gelişmiş AI özelliklerine erken erişim", var: true },
      { ad: "Sınırsız pazar yerine erişim", var: true },
      { ad: "En düşük kredi maliyeti", var: false },
    ],
  },
  {
    ad: "ULTRA", rozet: "%23 İNDİRİM", enIyiDeger: true, ozet: "AI projeleri kuran yaratıcılar için",
    kredi: "3.000 kredi/ay", krediNot: "1500 Nano Banana Pro üretimi, yaklaşık 133 Seedance 2.0 video",
    ayFiyat: 99, eskiFiyat: 129, fiyatSonek: "/ay, yıllık faturalı · Aylığa göre ₺360 tasarruf", cta: "Planı Yükselt", ctaRenk: "pembe", tema: "bordo",
    ozellikler: [
      { ad: "Paralel üretim: 8 Video, 8 Görsel", var: true },
      { ad: "Usta erişimi", var: true },
      { ad: "Tüm Seedance modelleri", var: true },
      { ad: "Tüm modeller & özellikler", var: true },
      { ad: "Gelişmiş AI özelliklerine erken erişim", var: true },
      { ad: "Sınırsız pazar yerine erişim", var: true },
      { ad: "En düşük kredi maliyeti", var: true },
    ],
  },
  {
    ad: "EKİPLER İÇİN", rozet: "%30 İNDİRİM", enIyiDeger: true, ozet: "Ekipler, işletmeler ve kurumlar için",
    kredi: "Paylaşımlı çalışma alanı & kredi", krediNot: "Çalışma alanı başına 2 koltuktan · havuzlanmış sınırsız kredi",
    ayFiyat: 65, eskiFiyat: 93, fiyatSonek: "/koltuk/ay, yıllık faturalı", cta: "Planları Keşfet", ctaRenk: "mavi", tema: "koyu",
    ozellikler: [
      { ad: "Tüm modeller & özellikler", var: true },
      { ad: "Seedance 2.0 erişimi", var: true },
      { ad: "Usta erişimi", var: true },
      { ad: "Gelişmiş özelliklere erken erişim", var: true },
      { ad: "En düşük kredi maliyeti", var: true, deger: "%70 DAHA UCUZ" },
      { ad: "Paylaşılabilir öğeler ve Ruh ID", var: true },
      { ad: "Sınırsız üye", var: true },
      { ad: "Öncelikli kuyruk & SLA", var: true },
    ],
  },
];

/* ── Kredi paketleri (Top-up Credits sekmesi) ── */
export interface KrediPaketi {
  kredi: number;
  birim: number;          // $1 = X kredi
  indirim: number;        // %
  rozet?: string;         // "En İyi Değer" / "En Popüler"
  populer?: boolean;
  eskiFiyat: number;
  fiyat: number;
  nbp: number;            // Nano Banana Pro üretim
  seedance: number;
}

export const KREDI_PAKETLERI: KrediPaketi[] = [
  { kredi: 5000, birim: 21, indirim: 45, rozet: "En İyi Değer", eskiFiyat: 425, fiyat: 235, nbp: 2500, seedance: 222 },
  { kredi: 4000, birim: 21, indirim: 44, rozet: "En Popüler", populer: true, eskiFiyat: 340, fiyat: 190, nbp: 2000, seedance: 177 },
  { kredi: 2000, birim: 21, indirim: 44, eskiFiyat: 470, fiyat: 95, nbp: 1000, seedance: 88 },
  { kredi: 1000, birim: 20, indirim: 42, eskiFiyat: 85, fiyat: 49, nbp: 500, seedance: 44 },
  { kredi: 500, birim: 19, indirim: 39, eskiFiyat: 42.5, fiyat: 26, nbp: 250, seedance: 22 },
  { kredi: 200, birim: 17, indirim: 27, eskiFiyat: 47, fiyat: 12, nbp: 100, seedance: 8 },
  { kredi: 100, birim: 16, indirim: 26, eskiFiyat: 8.5, fiyat: 6.25, nbp: 50, seedance: 4 },
];

/* ── Unlimited modeller (Unlimited Models sekmesi) ── */
export interface UnlimitedModel {
  ad: string;
  tur: "gorsel" | "video";
  cozunurlukler: string[];         // ["1080p", "4K"] veya ["1K","2K","4K"]
  concurrent: string;
  sure?: string;                    // "15sn'ye kadar"
  not: string;
  fiyatlar: Record<string, [number, number, number]>; // cozunurluk → [1gün, 7gün, 14gün]
  tohum: string;                    // kapak görseli
}

export const UNLIMITED_MODELLER: UnlimitedModel[] = [
  { ad: "GPT Image 2.0", tur: "gorsel", cozunurlukler: ["1K", "2K", "4K"], concurrent: "2 eşzamanlı", not: "4K planı 1K & 2K içerir. En fazla 2 paralel üretim.", tohum: "unl-gpt", fiyatlar: { "1K": [15, 75, 150], "2K": [20, 100, 200], "4K": [30, 150, 300] } },
  { ad: "Seedance 2.0", tur: "video", cozunurlukler: ["720p", "1080p"], concurrent: "1 eşzamanlı", sure: "15sn'ye kadar", not: "Yalnızca standart üretim modları. MCP, Usta, Canvas & CLI hariç.", tohum: "unl-seedance", fiyatlar: { "720p": [73, 294, 588], "1080p": [149, 630, 1270] } },
  { ad: "Kling 3.0", tur: "video", cozunurlukler: ["1080p", "4K"], concurrent: "1 eşzamanlı", sure: "15sn'ye kadar", not: "4K planı 1080p & 720p içerir. En fazla 1 paralel üretim.", tohum: "unl-kling", fiyatlar: { "1080p": [35, 175, 350], "4K": [60, 360, 720] } },
  { ad: "Nano Banana Pro", tur: "gorsel", cozunurlukler: ["2K", "4K"], concurrent: "2 eşzamanlı", not: "4K planı 2K içerir.", tohum: "unl-nbp", fiyatlar: { "2K": [5, 25, 50], "4K": [7, 35, 70] } },
];

export const UNLIMITED_HEPSI = {
  ad: "TÜM UNLIMITED MODELLER", concurrent: "2 görsel & 1 video eşzamanlı",
  aciklama: "Nano Banana Pro 4K, Seedance 2.0 1080p, Seedance 2.0 Fast & Mini 720p, Kling 3.0 4K, GPT Image 2 4K dahil",
  fiyatlar: [179, 780, 1570] as [number, number, number],
};

export const UNLIMITED_SURELER = [
  { ad: "1 Günlük Unlimited", ozet: "Dene, taahhüt yok", idx: 0 },
  { ad: "7 Günlük Unlimited", ozet: "Bir proje veya kampanya için ideal", idx: 1 },
  { ad: "14 Günlük Unlimited", ozet: "Sürekli, yüksek hacimli işler için en iyisi", idx: 2 },
];

/* ── Kullanım geçmişi (deterministik, SSR güvenli) ── */
export interface KullanimSatir { kredi: number; mod: string; durum: string; tarih: string; saat: string; }
export function kullanimUret(): KullanimSatir[] {
  const modlar = ["Akıllı mod", "Akıllı mod", "Akıllı mod", "Nano Banana Pro", "Akıllı mod", "Seedance 2.0"];
  return Array.from({ length: 25 }, (_, i) => {
    const h = (i * 2654435761) % 1000;
    const kredi = i % 8 === 3 ? 2 : i % 12 === 5 ? 3.31 : +(0.2 + (h % 60) / 100).toFixed(2);
    const dk = 53 - Math.floor(i * 1.7);
    return { kredi, mod: modlar[i % modlar.length], durum: "Harcandı", tarih: "19 Tem 2026", saat: `01:${String(Math.max(1, dk)).padStart(2, "0")}` };
  });
}

/* ── Abonelikteki aktif unlimited modeller (Abonelik sekmesi tablosu) ── */
export const AKTIF_UNLIMITED = [
  { ad: "FLUX.2 Pro", tip: "365 Unlimited", durum: "Aktif" },
  { ad: "GPT Image", tip: "365 Unlimited", durum: "Aktif" },
  { ad: "Seedream 4.5", tip: "365 Unlimited", durum: "Aktif" },
  { ad: "Kling O1", tip: "365 Unlimited", durum: "Aktif" },
  { ad: "Nano Banana", tip: "365 Unlimited", durum: "Aktif" },
  { ad: "Seedream V5 Lite", tip: "365 Unlimited", durum: "Aktif" },
];
