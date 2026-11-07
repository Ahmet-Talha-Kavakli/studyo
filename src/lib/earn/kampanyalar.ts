/**
 * Vayra Earn — kampanya kataloğu, seviyeler, kurallar ve liderlik tablosu.
 *
 * Model (Higgsfield Earn + Whop Content Rewards deseni):
 *  - goruntulenme: Vayra ile üretilen içeriği paylaş, 1.000 nitelikli görüntülenme
 *    başına ödeme. Gönderi başına alt (minimum) ve üst (maksimum) sınır, kampanya bütçesi.
 *    Onay anında sabit ödeme + 24. saat ve 7. gün kilometre taşı bonusları.
 *  - gorev: kriterleri karşılayan her teslim için sabit ödül, kota sınırlı.
 *  - yarisma: ödül havuzu sıralamaya göre dağıtılır.
 * Tüm tutarlar Türk lirası. Deterministik: SSR ve istemci aynı listeyi üretir.
 */

import type { ModelTur } from "@/lib/catalog";
import { havuzSec } from "@/lib/medyaHavuzu";

export type Platform = "instagram" | "tiktok" | "youtube" | "x";
export const PLATFORMLAR: { id: Platform; ad: string; logo: string; ters?: boolean }[] = [
  { id: "instagram", ad: "Instagram", logo: "/marka/instagram.svg" },
  { id: "tiktok", ad: "TikTok", logo: "/marka/tiktok.svg", ters: true },
  { id: "youtube", ad: "YouTube", logo: "/marka/youtube-data.svg" },
  { id: "x", ad: "X", logo: "/marka/x.svg", ters: true },
];
export const platformBul = (id: Platform) => PLATFORMLAR.find((p) => p.id === id)!;

export type KampanyaTur = "goruntulenme" | "gorev" | "yarisma";
export const TUR_AD: Record<KampanyaTur, string> = { goruntulenme: "Görüntülenme", gorev: "Görev", yarisma: "Yarışma" };

export type Kampanya = {
  id: string;
  tur: KampanyaTur;
  ad: string;
  ozet: string;
  kapak: string;
  /** Kart üstüne gelince oynayan kısa önizleme (Vayra üretimi). */
  video?: string;
  kategori: string;
  platformlar: Platform[];
  /** Gönderide kullanılabilecek Vayra üretim türleri (kitaplıktan seçilir). */
  ciktiTurleri: ModelTur[];
  bitis: number;            // ms (Date.now ofseti — kataloğu okurken hesaplanır)
  /** Katılımcı sayısı. Uydurma sayı yazılmaz; sunucudaki başvuru sayısı yoksa 0. */
  katilimci: number;
  /** goruntulenme */ oran?: number; minOdeme?: number; maxOdeme?: number; sabitOdeme?: number;
  /** goruntulenme/gorev */ butce?: number; odenen?: number;
  /** gorev */ odul?: number; kota?: number; kotaKalan?: number;
  /** yarisma */ havuz?: number; dereceler?: number[];
  brief: string;
  gereksinimler: string[];
  /** Katılınca açılan üretim kiti: hazır istemler ve Vayra'da üret bağlantısı. */
  kit: { istem: string; studyo: string; gorsel?: string }[];
  /** Zorunlu etiketler. */
  etiketler: string[];
  oneCikan?: boolean;
};

const GUN = 86_400_000;
const G = "/gercek";

/** Kampanya listesi. `bitis` çağrı anına göre hesaplanır (gün ofseti). */
export function kampanyalar(simdi = Date.now()): Kampanya[] {
  // Bitişler gün başına sabitlenir: gün içinde "kalan gün" değişmez.
  const taban = new Date(simdi).setHours(23, 59, 0, 0);
  const b = (gun: number) => taban + gun * GUN;
  return [
    {
      id: "kling-4-lansman", ciktiTurleri: ["video"], tur: "goruntulenme", ad: "Kling 4.0 ile 30 saniyelik sinematik sahne", oneCikan: true,
      ozet: "Kling 4.0'ın 30 saniyelik doğal video gücünü gösteren bir sahne üret ve paylaş.",
      kapak: havuzSec("kampanya-video", ["arac", "hareket"]).poster, video: havuzSec("kampanya-video", ["arac", "hareket"]).video, kategori: "Video", platformlar: ["instagram", "tiktok", "youtube"],
      bitis: b(12), katilimci: 0, oran: 60, minOdeme: 150, maxOdeme: 15000, sabitOdeme: 100, butce: 750000, odenen: 0,
      brief: "Kling 4.0 artık tek seferde 30 saniyelik, kesintisiz video üretebiliyor. Bu kampanyada amaç; tek bir çekimde akan, sinematik bir sahneyi izleyiciye göstermek. Kamera hareketi, ışık ve atmosfer ön planda olsun.",
      gereksinimler: ["Video tamamen Vayra'da Kling 4.0 ile üretilmiş olmalı", "En az 15 saniye, dikey (9:16) format", "Açıklamada #VayraKling ve @vayra.ai etiketi", "Paylaşım en az 7 gün yayında kalmalı"],
      kit: [
        { istem: "Yağmurlu gecede neon ışıklı bir caddede şemsiyeli yayalar, ıslak asfaltta yansımalar, sürekli takip çekimi, 30 saniye", studyo: "/panel/video", gorsel: `${G}/kesfet/neon-sehir.webp` },
        { istem: "Kapadokya'da gün doğumu, balonlar yükseliyor, yavaş drone yükselişi, sinematik", studyo: "/panel/video", gorsel: `${G}/orig/seed-kapadokya-veo31.webp` },
      ],
      etiketler: ["#VayraKling", "@vayra.ai"],
    },
    {
      id: "urun-reklami", ciktiTurleri: ["video", "gorsel"], tur: "goruntulenme", ad: "Yerel markalar için ürün reklamı",
      ozet: "Pazarlama Stüdyosu ile gerçek bir ürünü 15 saniyelik reklama dönüştür.",
      kapak: `${G}/panel/gal-pazarlama-2.webp`, video: `${G}/paz-video/gal-pazarlama-2.mp4`, kategori: "Reklam", platformlar: ["instagram", "tiktok"],
      bitis: b(20), katilimci: 0, oran: 45, minOdeme: 100, maxOdeme: 10000, sabitOdeme: 75, butce: 400000, odenen: 0,
      brief: "Türk e-ticaret satıcılarına Vayra'nın bir ürün fotoğrafından dakikalar içinde reklam çıkarabildiğini göster. Önce/sonra kurgusu iyi çalışır: sıradan ürün fotoğrafından sinematik reklama.",
      gereksinimler: ["Pazarlama Stüdyosu ile üretilmiş olmalı", "Önce/sonra karşılaştırması içermeli", "#VayraReklam etiketi", "Marka adı ya da logosu izin alınmadan kullanılmamalı"],
      kit: [{ istem: "Mermer zeminde parfüm şişesi, dramatik yan ışık, yavaş dönüş, ürün reklamı", studyo: "/panel/video", gorsel: `${G}/galeri/urun3.webp` }],
      etiketler: ["#VayraReklam", "@vayra.ai"],
    },
    {
      id: "ai-influencer", ciktiTurleri: ["video", "gorsel"], tur: "goruntulenme", ad: "AI Influencer'ını hayata geçir",
      ozet: "Tutarlı bir karakter oluştur, trend bir formatla Reels/TikTok'ta paylaş.",
      kapak: `${G}/gorsel/gorsel-karakter-Sofia.webp`, kategori: "Karakter", platformlar: ["instagram", "tiktok"],
      bitis: b(9), katilimci: 0, oran: 35, minOdeme: 75, maxOdeme: 8000, sabitOdeme: 50, butce: 500000, odenen: 0,
      brief: "Kendi AI karakterini oluştur ve onu gerçek bir içerik üreticisi gibi konuştur: günlük vlog, ürün yorumu ya da trend akımı. Karakter her karede aynı yüz ve stilde olmalı.",
      gereksinimler: ["AI Influencer stüdyosuyla üretilmiş tutarlı karakter", "Videoda konuşma (Konuştur) ya da dudak senkronu", "#VayraInfluencer etiketi"],
      kit: [{ istem: "Gülümseyen genç kadın, kafe ortamı, doğal gün ışığı, selfie açısı, kameraya konuşuyor", studyo: "/panel/gorsel", gorsel: `${G}/gorsel/gorsel-karakter-Aria.webp` }],
      etiketler: ["#VayraInfluencer", "@vayra.ai"],
    },
    {
      id: "egitim-ilk-video", ciktiTurleri: ["video"], tur: "gorev", ad: "Eğitim: İlk videonu 60 saniyede üret",
      ozet: "Yeni başlayanlar için Vayra'da ilk video üretimini anlatan kısa bir rehber çek.",
      kapak: `${G}/explainer-video/ex-claymotion.webp`, video: `${G}/explainer-video/ex-claymotion.mp4`, kategori: "Eğitim", platformlar: ["youtube", "tiktok", "instagram"],
      bitis: b(14), katilimci: 0, odul: 750, kota: 120, kotaKalan: 120, butce: 90000, odenen: 0,
      brief: "Ekran kaydıyla adım adım: istemi yaz, modeli seç, üret, paylaş. Sade ve anlaşılır bir dil kullan.",
      gereksinimler: ["Ekran kaydı + seslendirme ya da altyazı", "60–180 saniye", "Açıklamada davet bağlantın", "Türkçe"],
      kit: [{ istem: "Vayra ile ilk videonu üret: istem yazma, model seçimi ve paylaşım", studyo: "/panel/video" }],
      etiketler: ["#VayraEğitim"],
    },
    {
      id: "3d-urun", ciktiTurleri: ["3d", "video"], tur: "gorev", ad: "3D Vitrin: Bir ürünü 3D'ye dönüştür",
      ozet: "Tek fotoğraftan 3D model üret, 360° dönüş videosunu paylaş.",
      kapak: `${G}/arac/3d-ilham-render.webp`, kategori: "3D", platformlar: ["instagram", "youtube", "x"],
      bitis: b(18), katilimci: 0, odul: 1200, kota: 40, kotaKalan: 40, butce: 48000, odenen: 0,
      brief: "Görselden 3D aracıyla gerçek bir ürünün modelini çıkar; süreç ve sonuç tek videoda olsun.",
      gereksinimler: ["Görselden 3D ile üretilmiş model", "Önce fotoğraf, sonra 360° model", "#Vayra3D etiketi"],
      kit: [{ istem: "Ahşap masa lambası, stüdyo ışığı, beyaz zemin, ürün fotoğrafı", studyo: "/panel/gorsel", gorsel: `${G}/arac/3d-ilham-render.webp` }],
      etiketler: ["#Vayra3D"],
    },
    {
      id: "muzik-klip", ciktiTurleri: ["video", "muzik"], tur: "gorev", ad: "Müzik + görsel: 30 saniyelik klip",
      ozet: "Vayra müzik ve video üretimini birleştiren kısa bir klip hazırla.",
      kapak: `${G}/muzik/ms-anadolu.webp`, kategori: "Müzik", platformlar: ["tiktok", "instagram", "youtube"],
      bitis: b(6), katilimci: 0, odul: 900, kota: 60, kotaKalan: 60, butce: 54000, odenen: 0,
      brief: "Önce Vayra Muse ile bir parça üret, sonra ritmine uygun görsellerle bir klip kurgula.",
      gereksinimler: ["Müzik ve görüntü Vayra'da üretilmiş olmalı", "20–45 saniye", "#VayraMüzik etiketi"],
      kit: [{ istem: "Anadolu ezgileriyle elektronik bir sahne müziği, 120 BPM", studyo: "/panel/muzik" }],
      etiketler: ["#VayraMüzik"],
    },
    {
      id: "yarisma-bilimkurgu", ciktiTurleri: ["video"], tur: "yarisma", ad: "Bilim kurgu kısa film yarışması",
      ozet: "En iyi 60 saniyelik bilim kurgu kısa filmi ödül havuzunu paylaşıyor.",
      kapak: `${G}/orig/banner-neonmancer.webp`, kategori: "Film", platformlar: ["youtube", "x", "instagram"],
      bitis: b(16), katilimci: 0, havuz: 150000, dereceler: [60000, 35000, 20000, 10000, 5000],
      brief: "Tema: \"Son sinyal\". Tamamen Vayra ile üretilmiş, 45–90 saniyelik bir kısa film. Jüri; hikâye, görsel tutarlılık ve ses tasarımına bakar.",
      gereksinimler: ["Tüm görüntüler Vayra'da üretilmiş olmalı", "45–90 saniye, yatay (16:9)", "Kapanışta \"Vayra ile üretildi\" ibaresi", "Kişi başı 1 başvuru"],
      kit: [{ istem: "Terk edilmiş bir uzay istasyonunda son sinyal, soğuk mavi ışık, sinematik", studyo: "/panel/sinema", gorsel: `${G}/proje-kesfet/kesfet-05.webp` }],
      etiketler: ["#VayraFilm"],
    },
    {
      id: "yarisma-yaz", ciktiTurleri: ["gorsel"], tur: "yarisma", ad: "İstanbul'un renkleri fotoğraf yarışması",
      ozet: "İstanbul'u farklı bir gözle anlatan en iyi 5 görsel seriye ödül.",
      kapak: `${G}/galeri/sinematik4.webp`, kategori: "Görsel", platformlar: ["instagram", "x"],
      bitis: b(-3), katilimci: 0, havuz: 80000, dereceler: [35000, 20000, 12500, 7500, 5000],
      brief: "5 görsellik bir seri: aynı stil, aynı renk paleti. Yarışma sona erdi.",
      gereksinimler: ["5 görsellik seri", "Aynı stil ve renk paleti", "#Vayraİstanbul etiketi"],
      kit: [],
      etiketler: ["#Vayraİstanbul"],
    },
  ];
}

export const kampanyaBul = (id: string, simdi?: number) => kampanyalar(simdi).find((k) => k.id === id);
export const bittiMi = (k: Kampanya, simdi = Date.now()) => k.bitis <= simdi;

/* ── Seviyeler ── */
export type Seviye = { id: string; ad: string; minKazanc: number; bonus: number; ayricaliklar: string[] };
export const SEVIYELER: Seviye[] = [
  { id: "baslangic", ad: "Başlangıç", minKazanc: 0, bonus: 0, ayricaliklar: ["Tüm kampanyalara katılım", "Aylık 1 ücretsiz çekim"] },
  { id: "yukselen", ad: "Yükselen", minKazanc: 1000, bonus: 0.05, ayricaliklar: ["Tüm kazançlara yüzde 5 ek", "Aylık 2 ücretsiz çekim", "Erken kampanya erişimi"] },
  { id: "profesyonel", ad: "Profesyonel", minKazanc: 5000, bonus: 0.1, ayricaliklar: ["Tüm kazançlara yüzde 10 ek", "Sınırsız ücretsiz çekim", "24 saatte inceleme", "Aylık 500 kredi"] },
  { id: "elit", ad: "Elit", minKazanc: 25000, bonus: 0.2, ayricaliklar: ["Tüm kazançlara yüzde 20 ek", "Özel kampanyalar", "Atanmış iletişim kişisi", "Ultra plan ücretsiz"] },
];
export function seviyeBul(toplam: number) {
  let s = SEVIYELER[0];
  for (const x of SEVIYELER) if (toplam >= x.minKazanc) s = x;
  const i = SEVIYELER.indexOf(s);
  return { seviye: s, sonraki: SEVIYELER[i + 1] ?? null };
}

/* ── Ödeme kuralları ── */
export const KURALLAR = {
  incelemeSaat: 72,
  kazanmaGun: 7,
  beklemeGun: 3,
  minCekim: 250,
  cekimUcreti: 5,          // TL; seviye ayrıcalığıyla ücretsiz
  bonus24: 0.15,           // 24. saat kilometre taşı: o ana kadarki kazancın %15'i
  bonus7: 0.1,             // 7. gün kilometre taşı
  itirazHakki: 1,
};

/* ── Davet & ortaklık ── */
export const KOMISYON_KADEMELERI = [
  { ad: "Bronz", minAylik: 0, oran: 0.2 },
  { ad: "Gümüş", minAylik: 5000, oran: 0.25 },
  { ad: "Altın", minAylik: 20000, oran: 0.3 },
];
export const KOMISYON_SURE_AY = 12;
export const DAVET_KAYIT_ODULU = 25;     // davet edilen ilk üretimini yaptığında
export const DAVET_INDIRIM = 0.15;       // kupon kodunun abone olana indirimi


export const tl = (n: number, kurus = false) =>
  `₺${new Intl.NumberFormat("tr-TR", { minimumFractionDigits: kurus ? 2 : 0, maximumFractionDigits: kurus ? 2 : 0 }).format(n)}`;
export const sayi = (n: number) => new Intl.NumberFormat("tr-TR").format(n);
export const kisaSayi = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} Mn`
    : n >= 1000 ? `${(n / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} B` : String(n);
export function kalanGun(bitis: number, simdi = Date.now()) {
  const g = Math.ceil((bitis - simdi) / GUN);
  return g <= 0 ? "Sona erdi" : g === 1 ? "Son gün" : `${g} gün kaldı`;
}

/* ── Marketplace ── */
/** Preset sahibine kullanılan her kredi için ödenen tutar (TL). */
export const PRESET_KREDI_TL = 0.5;
export const PRESET_KATEGORILERI = ["Portre", "Sahne", "Ürün", "Moda", "Anime", "Mimari"];
