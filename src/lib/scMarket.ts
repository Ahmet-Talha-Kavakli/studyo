import { onizlemeArka } from "@/lib/utils";
import { scArka } from "./gercekVeri";

/* ══════════════════════════════════════════════════════════════════
   Supercomputer Marketplace — Çalışanlar + Beceriler ORTAK veri katmanı.
   Higgsfield birebir (F.md 101-114, G.md 115-129, I.md 155-158).
   Liste ve detay sayfaları AYNI kaynaktan besleniyor → slug ile eşleşir.
   Tümü SSR güvenli: Date.now/Math.random YOK, deterministik tohum.
   ══════════════════════════════════════════════════════════════════ */

/* ── slug üreteci (Türkçe karakter → ascii, deterministik) ───────── */
export function slugla(ad: string): string {
  return ad
    .toLocaleLowerCase("tr")
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
    .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ── deterministik gradyan (çalışan tema rengi) ─────────────────── */
export function calisanRengi(tohum: string): string {
  let h = 0;
  for (let i = 0; i < tohum.length; i++) h = (h * 31 + tohum.charCodeAt(i)) >>> 0;
  const renk = h % 360;
  return `hsl(${renk} 70% 55%), hsl(${(renk + 40) % 360} 65% 42%) 70%, hsl(${(renk + 60) % 360} 60% 28%)`;
}

const BECERI_PALETI = [
  "#34d399, #059669 70%",
  "#22d3ee, #0891b2 70%",
  "#a78bfa, #7c3aed 70%",
  "#f472b6, #db2777 70%",
  "#fbbf24, #d97706 70%",
  "#60a5fa, #2563eb 70%",
];
export function beceriRengi(tohum: string): string {
  let h = 0;
  for (let i = 0; i < tohum.length; i++) h = (h * 31 + tohum.charCodeAt(i)) >>> 0;
  return BECERI_PALETI[h % BECERI_PALETI.length];
}

/** Deterministik kurulum sayısı ("X kurulum") — SSR güvenli. */
export function kurulumSayisi(tohum: string): string {
  let h = 0;
  for (let i = 0; i < tohum.length; i++) h = (h * 37 + tohum.charCodeAt(i)) >>> 0;
  const n = 120 + (h % 8800);
  return n >= 1000 ? `${(n / 1000).toFixed(1)}b` : String(n);
}

/* ══════════════════════════════════════════════════════════════════
   AI ÇALIŞANLARI (Employees) — 32 adet.
   kapak: "foto" → gerçek stok görsel kapak (onizlemeArka), "gradyan" → tema rengi.
   dogrulanmis: SADECE resmi/verified employee'de ✓ (installed ≠ verified).
   ══════════════════════════════════════════════════════════════════ */

export type CalisanKapak = "foto" | "gradyan";

export interface Calisan {
  slug: string;
  ad: string;
  ozet: string;
  kategori: string;
  tohum: string;
  kapak: CalisanKapak;
  dogrulanmis: boolean;   // resmi/verified
  varsayilanKurulu: boolean;
  yayinci: string;
  /** "NELER YAPABİLİRSİN" stil şeridi — 4-6 örnek */
  stiller: { ad: string; aciklama: string; tohum: string }[];
  /** Composer placeholder örnek istemi */
  ornekIstem: string;
}

/* Referansta her gradyan kart 8 renk ailesinden birini kullanıyor.
   Tohumdan deterministik seçilir → SSR güvenli, her yenilemede aynı. */
export const CALISAN_RENKLERI = [
  ["#4A8B2A", "#7BC142"], // yeşil
  ["#8B3FA8", "#C77DE0"], // mor
  ["#0E8B8B", "#3ED6D6"], // turkuaz
  ["#B03A4A", "#E88090"], // mercan
  ["#B8860B", "#E8B33C"], // altın
  ["#C05A20", "#E8934A"], // turuncu
  ["#A83A6A", "#E070A0"], // magenta
  ["#4A5AC8", "#8090E8"], // mavi
] as const;

/** Çalışan kartı için mesh gradyan — referanstaki radyal katmanlı görünüm. */
export function calisanGradyan(tohum: string): string {
  let h = 0;
  for (let i = 0; i < tohum.length; i++) h = (h * 31 + tohum.charCodeAt(i)) >>> 0;
  const [a, b] = CALISAN_RENKLERI[h % CALISAN_RENKLERI.length];
  const x = 20 + (h % 60), y = 15 + ((h >> 3) % 55);
  return `radial-gradient(120% 110% at ${x}% ${y}%, ${b} 0%, ${a} 45%, ${a}dd 70%, #10120f 100%)`;
}

// stil şeridi paletleri (tekrar kullanılır)
const STIL_HAVUZU = [
  { ad: "Claymation", aciklama: "El yapımı his veren stop-motion kil animasyonu", tohum: "st-clay" },
  { ad: "Retro Kolaj", aciklama: "Vintage kesik-kağıt dokular ve grenli baskı", tohum: "st-retro" },
  { ad: "Sarı Patlama", aciklama: "Canlı sarı zeminde cesur grafik patlamalar", tohum: "st-sari" },
  { ad: "Puanlı Pop", aciklama: "Oyuncu puantiye ve pop-art renk blokları", tohum: "st-polka" },
  { ad: "Marker Karalama", aciklama: "El çizimi marker doodle ve serbest karalama", tohum: "st-marker" },
  { ad: "Sıcak Işıltı", aciklama: "Sıcak ve soğuk ışığın birbirine oynadığı sahne", tohum: "st-glow" },
];

function stilSec(offset: number): Calisan["stiller"] {
  return [0, 1, 2, 3].map((i) => {
    const s = STIL_HAVUZU[(offset + i) % STIL_HAVUZU.length];
    return { ...s, tohum: `${s.tohum}-${offset}-${i}` };
  });
}

const _CALISANLAR: Omit<Calisan, "slug">[] = [
  { ad: "Shorts Üretici", ozet: "Fikirlerini kısa-form videolara dönüştürür", kategori: "İçerik Üretimi", tohum: "ac-shorts", kapak: "foto", dogrulanmis: true, varsayilanKurulu: true, yayinci: "Vayra", stiller: stilSec(0), ornekIstem: "Videomu viral bir reel'e dönüştür — stili sen seç" },
  { ad: "Personal Clipper", ozet: "Uzun videoyu viral kısa kliplere böler", kategori: "İçerik Üretimi", tohum: "ac-clip", kapak: "foto", dogrulanmis: true, varsayilanKurulu: true, yayinci: "Vayra", stiller: stilSec(1), ornekIstem: "YouTube linkimden 5 viral dikey klip çıkar" },
  { ad: "Pazarlama Uzmanı", ozet: "Kampanya, reklam metni ve funnel kurar", kategori: "Yaratıcı & Pazarlama", tohum: "ac-pazar", kapak: "gradyan", dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", stiller: stilSec(2), ornekIstem: "Yeni ürünüm için uçtan uca pazarlama kampanyası kur" },
  { ad: "UGC Yaratıcı", ozet: "Konuşan kafa UGC reklamları üretir", kategori: "İçerik Üretimi", tohum: "ac-ugc", kapak: "foto", dogrulanmis: true, varsayilanKurulu: true, yayinci: "Vayra", stiller: stilSec(3), ornekIstem: "Ürünüm için 3 farklı UGC reklamı üret" },
  { ad: "Araştırmacı", ozet: "Derin web araştırması ve rapor yazar", kategori: "Veri & Analitik", tohum: "ac-arastirma", kapak: "gradyan", dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", stiller: stilSec(4), ornekIstem: "Rakiplerimi araştır ve bir konumlandırma raporu yaz" },
  { ad: "Oyun Geliştirici", ozet: "Tarayıcı oyunları tasarlar ve yayınlar", kategori: "İçerik Üretimi", tohum: "ac-oyun", kapak: "gradyan", dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", stiller: stilSec(5), ornekIstem: "Basit bir platform oyunu tasarla ve yayınla" },
  { ad: "Kişisel Yönetici", ozet: "Görevleri, takvimi ve akışını yönetir", kategori: "İletişim", tohum: "ac-yonetici", kapak: "foto", dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", stiller: stilSec(0), ornekIstem: "Bu haftanın önceliklerini çıkar ve takvimimi düzenle" },
  { ad: "Kampanya Başlatma", ozet: "Uçtan uca lansman kampanyası yürütür", kategori: "Yaratıcı & Pazarlama", tohum: "ac-kampanya", kapak: "gradyan", dogrulanmis: true, varsayilanKurulu: false, yayinci: "Vayra", stiller: stilSec(1), ornekIstem: "Hazır görselimi tam bir lansman kampanyasına dönüştür" },
  { ad: "Katalog Fotoğrafçısı", ozet: "Stüdyo kalitesinde ürün çekimi üretir", kategori: "İçerik Üretimi", tohum: "ac-katalog", kapak: "foto", dogrulanmis: true, varsayilanKurulu: true, yayinci: "Vayra", stiller: stilSec(2), ornekIstem: "Ürünüm için beyaz zeminde stüdyo çekimi üret" },
  { ad: "Reklam Kurucu", ozet: "Yüksek dönüşümlü reklam varyantları kurar", kategori: "Yaratıcı & Pazarlama", tohum: "ac-reklam", kapak: "gradyan", dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", stiller: stilSec(3), ornekIstem: "Meta reklamım için 10 varyant başlık ve görsel üret" },
  { ad: "Sinema Yönetmeni", ozet: "Prompt'tan sinematik sahneler yönetir", kategori: "İçerik Üretimi", tohum: "ac-sinema", kapak: "foto", dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", stiller: stilSec(4), ornekIstem: "Markam için sinematik bir açılış sahnesi yönet" },
  { ad: "Karikatür Üretici", ozet: "Marka karakterleri ve çizgi film üretir", kategori: "İçerik Üretimi", tohum: "ac-karikatur", kapak: "gradyan", dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", stiller: stilSec(5), ornekIstem: "Markam için sevimli bir maskot karakteri çiz" },
  { ad: "Script Yazarı", ozet: "Üretime hazır video senaryoları yazar", kategori: "İçerik Üretimi", tohum: "ac-script", kapak: "gradyan", dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", stiller: stilSec(0), ornekIstem: "60 saniyelik bir explainer video senaryosu yaz" },
  { ad: "Marka Yöneticisi", ozet: "Marka sesini ve içerik takvimini yönetir", kategori: "Yaratıcı & Pazarlama", tohum: "ac-marka", kapak: "foto", dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", stiller: stilSec(1), ornekIstem: "Markam için tutarlı bir ses ve ton kılavuzu oluştur" },
  { ad: "İçerik Üreticisi", ozet: "Tüm kanallar için içerik akışı üretir", kategori: "İçerik Üretimi", tohum: "ac-icerik", kapak: "gradyan", dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", stiller: stilSec(2), ornekIstem: "Instagram için bu haftanın 5 gönderisini hazırla" },
  { ad: "TikTok Kurgucu", ozet: "TikTok tutundurma odaklı kurgu yapar", kategori: "İçerik Üretimi", tohum: "ac-tiktok", kapak: "gradyan", dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", stiller: stilSec(3), ornekIstem: "Videomu yüksek tutundurmalı bir TikTok kurgusuna çevir" },
  { ad: "TV Reklam Yönetmeni", ozet: "15 saniyelik reklam filmleri yönetir", kategori: "Yaratıcı & Pazarlama", tohum: "ac-tvreklam", kapak: "foto", dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", stiller: stilSec(4), ornekIstem: "Ürünüm için 15 saniyelik bir TV reklamı yönet" },
  { ad: "Araştırma Analisti", ozet: "Pazar verisini içgörüye dönüştürür", kategori: "Veri & Analitik", tohum: "ac-analist", kapak: "gradyan", dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", stiller: stilSec(5), ornekIstem: "Sektörümdeki son trendleri analiz et ve özetle" },
  { ad: "Tişört Tasarımcısı", ozet: "Baskıya hazır tişört grafikleri üretir", kategori: "İçerik Üretimi", tohum: "ac-tisort", kapak: "gradyan", dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", stiller: stilSec(0), ornekIstem: "Markam için baskıya hazır 5 tişört tasarımı üret" },
  { ad: "Tasarım Direktörü", ozet: "Yaratıcı yön ve marka kimliği kurar", kategori: "Yaratıcı & Pazarlama", tohum: "ac-tasarim", kapak: "foto", dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", stiller: stilSec(1), ornekIstem: "Yeni markam için komple görsel kimlik yönü öner" },
  { ad: "Oyun Varlık Geliştirici", ozet: "Oyun için sprite ve varlık üretir", kategori: "İçerik Üretimi", tohum: "ac-varlik", kapak: "gradyan", dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", stiller: stilSec(2), ornekIstem: "2D platform oyunu için karakter sprite seti üret" },
  { ad: "Yaratıcı Direktör", ozet: "Kampanya konseptleri ve brief üretir", kategori: "Yaratıcı & Pazarlama", tohum: "ac-yaratici", kapak: "gradyan", dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", stiller: stilSec(3), ornekIstem: "Yaz kampanyam için büyük bir yaratıcı konsept öner" },
  { ad: "Jarvis", ozet: "Video ve trend stratejisti — fırsat bulur", kategori: "Veri & Analitik", tohum: "ac-jarvis", kapak: "foto", dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", stiller: stilSec(4), ornekIstem: "Nişimde bu ay patlayacak trend fikirleri bul" },
  { ad: "ASMR Video Üretici", ozet: "Rahatlatıcı ASMR videoları üretir", kategori: "İçerik Üretimi", tohum: "ac-asmr", kapak: "gradyan", dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", stiller: stilSec(5), ornekIstem: "Ürünüm için tatmin edici bir ASMR videosu üret" },
  { ad: "Sosyal Medya Stratejisti", ozet: "Kanal stratejisi ve takvim kurar", kategori: "Yaratıcı & Pazarlama", tohum: "ac-sosyal", kapak: "gradyan", dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", stiller: stilSec(0), ornekIstem: "Markam için 30 günlük sosyal medya stratejisi kur" },
  { ad: "Web Stratejisti", ozet: "Dönüşüm odaklı site yapısı tasarlar", kategori: "Yaratıcı & Pazarlama", tohum: "ac-web", kapak: "gradyan", dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", stiller: stilSec(1), ornekIstem: "Yeni ürünüm için dönüşüm odaklı landing yapısı çiz" },
  { ad: "Medya Yapımcısı", ozet: "Uçtan uca video prodüksiyonu yönetir", kategori: "İçerik Üretimi", tohum: "ac-medya", kapak: "foto", dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", stiller: stilSec(2), ornekIstem: "Markam için tam bir tanıtım filmi prodüksiyonu yönet" },
  { ad: "Görsel Üretici", ozet: "Editoryal kalitede görsel üretir", kategori: "İçerik Üretimi", tohum: "ac-gorsel", kapak: "foto", dogrulanmis: true, varsayilanKurulu: false, yayinci: "Vayra", stiller: stilSec(3), ornekIstem: "Kampanyam için editoryal kalitede 4 görsel üret" },
  { ad: "Meme Shorts Üretici", ozet: "Viral mizah kısa videoları üretir", kategori: "İçerik Üretimi", tohum: "ac-meme", kapak: "gradyan", dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", stiller: stilSec(4), ornekIstem: "Markam için trend olan bir meme short'u üret" },
  { ad: "Site Eleştirmeni", ozet: "Web sitesini denetler, iyileştirme önerir", kategori: "Veri & Analitik", tohum: "ac-elestirmen", kapak: "gradyan", dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", stiller: stilSec(5), ornekIstem: "Ana sayfamı denetle ve dönüşüm iyileştirmeleri öner" },
  { ad: "Ürün Fotoğrafçısı", ozet: "AI ile stüdyo ürün çekimleri yapar", kategori: "İçerik Üretimi", tohum: "ac-urunfoto", kapak: "foto", dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", stiller: stilSec(0), ornekIstem: "Ürünümü lüks bir yaşam alanı sahnesine yerleştir" },
  { ad: "Şef Danışman", ozet: "Dikkatini korur, günlük öncelik verir", kategori: "İletişim", tohum: "ac-sef", kapak: "gradyan", dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", stiller: stilSec(1), ornekIstem: "Bugünün en önemli 3 işini belirle ve planla" },
  { ad: "AI Stüdyo Yöneticisi", ozet: "Yaratıcı üretim akışını uçtan uca yönetir", kategori: "Yaratıcı & Pazarlama", tohum: "ac-studyo", kapak: "foto", dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", stiller: stilSec(2), ornekIstem: "Bu haftaki tüm içerik üretimini planla ve dağıt" },
];
export const CALISANLAR: Calisan[] = _CALISANLAR.map((c) => ({ ...c, slug: slugla(c.ad) }));

export function calisanBul(slug: string): Calisan | undefined {
  return CALISANLAR.find((c) => c.slug === slug);
}

/* ══════════════════════════════════════════════════════════════════
   BECERİLER (Skills) — referans 5 kategoriye indirgenmiş.
   Higgsfield imza skill isimleri (Soul Id, Gpt Image 2 Director...) dahil.
   dogrulanmis: çoğu resmi skill'de ✓.
   ══════════════════════════════════════════════════════════════════ */

export const BECERI_KATEGORILERI = [
  "Tümü", "İletişim", "İçerik Üretimi", "Yaratıcı & Pazarlama", "Veri & Analitik", "Belgeler",
];

export interface Beceri {
  slug: string;
  ad: string;
  kat: string;
  ozet: string;
  tohum: string;
  guclu: string;        // "powered by" etiketi
  dogrulanmis: boolean;
  varsayilanKurulu: boolean;
  yayinci: string;
  /** "NELER YAPABİLİRSİN" örnek grid */
  ornekler: { ad: string; aciklama: string; tohum: string }[];
  ornekIstem: string;
  /** Composer'da çağrılan slash komutu — referansta ad ile AYNI DEĞİL
      (ör. "Cinematic Director" → /cinematic-flow). slug'dan türetilir. */
  komut?: string;
  /** Referansta hover'da beliren kurulum sayısı. */
  kurulum?: number;
}

/* Referansta beceri kartları doygun iki tonlu radyal gradyan.
   Tohumdan deterministik seçilir → SSR güvenli. */
const BECERI_GRADYAN = [
  ["#4A7C1F", "#9BD143"], // zeytin-lime
  ["#7A8B1A", "#CFE04A"], // sarı-yeşil
  ["#0E7C8B", "#3EC8D6"], // camgöbeği
  ["#B02A6A", "#F075A8"], // pembe
  ["#6B2A9E", "#B072E0"], // mor
  ["#B85A15", "#F0A050"], // turuncu
  ["#9E8A10", "#E8D054"], // hardal
  ["#2A7C3A", "#68CF7E"], // yeşil
  ["#6A5AC0", "#A99AE8"], // lila
  ["#0E7C6A", "#40D0B0"], // turkuaz
] as const;

export function beceriGradyan(tohum: string): string {
  let h = 0;
  for (let i = 0; i < tohum.length; i++) h = (h * 31 + tohum.charCodeAt(i)) >>> 0;
  const [a, b] = BECERI_GRADYAN[h % BECERI_GRADYAN.length];
  const x = 25 + (h % 50), y = 20 + ((h >> 3) % 45);
  return `radial-gradient(125% 115% at ${x}% ${y}%, ${b} 0%, ${a} 52%, ${a}cc 78%, #0f1210 100%)`;
}

const ORNEK_HAVUZU = [
  { ad: "Kaykay Havası", aciklama: "Retro dokulu, hareket çizgili flat-vektör kaykay", tohum: "or-skate" },
  { ad: "Satranç Stratejisi", aciklama: "Tek kırmızı vurgulu siyah-beyaz eskiz satranç", tohum: "or-chess" },
  { ad: "Kazanan Hamle", aciklama: "Mor-kırmızı ışıklı sinematik satranç yakın plan", tohum: "or-win" },
  { ad: "Galaksi Uçuşu", aciklama: "Tozlu bir galakside parlak çekirdeğe CGI uçuş", tohum: "or-galaxy" },
  { ad: "Neon Şehir", aciklama: "Yağmurlu neon sokakta sinematik gece sahnesi", tohum: "or-neon" },
  { ad: "Kağıt Diorama", aciklama: "El yapımı kraft-kağıt katmanlı minik dünya", tohum: "or-paper" },
];
function ornekSec(offset: number): Beceri["ornekler"] {
  return [0, 1, 2, 3].map((i) => {
    const o = ORNEK_HAVUZU[(offset + i) % ORNEK_HAVUZU.length];
    return { ...o, tohum: `${o.tohum}-${offset}-${i}` };
  });
}

const G_CLAUDE = "Claude Fable 5 & Gemini Omni Flash";
const G_GEMINI = "Gemini Omni Flash";
const G_FABLE = "Fable 5";
const G_GPT = "GPT Image 2";

export const BECERILER: Beceri[] = [
  // İçerik Üretimi
  { ad: "Vayra Explainer", kat: "İçerik Üretimi", ozet: "Anlatımlı, yüzsüz animasyonlu açıklayıcı video", tohum: "bc-explainer", guclu: G_CLAUDE, dogrulanmis: true, varsayilanKurulu: true, yayinci: "Vayra", ornekler: ornekSec(0), ornekIstem: "AI video üretiminin nasıl çalıştığını anlatan kısa video yap" },
  { ad: "Video Üretici", kat: "İçerik Üretimi", ozet: "Prompt'tan sinematik video üretimi", tohum: "bc-video", guclu: G_FABLE, dogrulanmis: true, varsayilanKurulu: true, yayinci: "Vayra", ornekler: ornekSec(1), ornekIstem: "Ürünüm için 5 saniyelik sinematik bir tanıtım klibi üret" },
  { ad: "Görsel Üretici", kat: "İçerik Üretimi", ozet: "Editoryal kalitede görsel üretimi", tohum: "bc-image", guclu: G_GPT, dogrulanmis: true, varsayilanKurulu: true, yayinci: "Vayra", ornekler: ornekSec(2), ornekIstem: "Kampanyam için editoryal kalitede bir kapak görseli üret" },
  { ad: "Montaj", kat: "İçerik Üretimi", ozet: "Ham klipleri ritimli bir montaja dizer", tohum: "bc-montage", guclu: G_FABLE, dogrulanmis: true, varsayilanKurulu: false, yayinci: "Vayra", ornekler: ornekSec(3), ornekIstem: "Kliplerimden müzikli hızlı bir montaj kur" },
  { ad: "Cinematic Director", kat: "İçerik Üretimi", ozet: "Sahne sahne sinematik yönetim", tohum: "bc-cinema", guclu: G_FABLE, dogrulanmis: true, varsayilanKurulu: false, yayinci: "Vayra", ornekler: ornekSec(4), ornekIstem: "Markam için sinematik bir açılış sahnesi kur" },
  { ad: "Shorts Kurgucu", kat: "İçerik Üretimi", ozet: "Uzun videodan viral dikey klipler çıkar", tohum: "bc-shorts", guclu: G_GEMINI, dogrulanmis: true, varsayilanKurulu: false, yayinci: "Vayra", ornekler: ornekSec(5), ornekIstem: "Uzun videomdan 5 viral dikey klip çıkar" },
  { ad: "UGC Creator", kat: "İçerik Üretimi", ozet: "Konuşan kafa UGC reklamları üretir", tohum: "bc-ugc", guclu: G_FABLE, dogrulanmis: true, varsayilanKurulu: false, yayinci: "Vayra", ornekler: ornekSec(0), ornekIstem: "Ürünüm için 3 farklı UGC reklamı üret" },
  { ad: "Script Writer", kat: "İçerik Üretimi", ozet: "Üretime hazır video senaryoları yazar", tohum: "bc-script", guclu: G_CLAUDE, dogrulanmis: true, varsayilanKurulu: false, yayinci: "Vayra", ornekler: ornekSec(1), ornekIstem: "60 saniyelik bir explainer senaryosu yaz" },
  { ad: "Cartoon Animator", kat: "İçerik Üretimi", ozet: "Karakterleri canlı çizgi filme dönüştürür", tohum: "bc-cartoon", guclu: G_FABLE, dogrulanmis: true, varsayilanKurulu: false, yayinci: "Vayra", ornekler: ornekSec(2), ornekIstem: "Maskotumu sevimli bir çizgi film sahnesinde canlandır" },
  { ad: "Soul Id", kat: "İçerik Üretimi", ozet: "Tutarlı karakter kimliği üretir ve korur", tohum: "bc-soul", guclu: G_GPT, dogrulanmis: true, varsayilanKurulu: false, yayinci: "Vayra", ornekler: ornekSec(3), ornekIstem: "AI karakterim için tutarlı bir yüz kimliği oluştur" },
  { ad: "Storyboard Ressamı", kat: "İçerik Üretimi", ozet: "Senaryodan kare kare görsel taslak", tohum: "bc-storyboard", guclu: G_GPT, dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", ornekler: ornekSec(4), ornekIstem: "Senaryomdan 6 panelli bir storyboard çiz" },
  { ad: "Thumbnail Sihirbazı", kat: "İçerik Üretimi", ozet: "Tıklanabilir YouTube kapak görseli üret", tohum: "bc-thumb", guclu: G_GPT, dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", ornekler: ornekSec(5), ornekIstem: "Videom için yüksek tıklanma alan bir thumbnail üret" },
  { ad: "Infographic Animator", kat: "İçerik Üretimi", ozet: "Veriyi hareketli infografiğe dönüştürür", tohum: "bc-infographic", guclu: G_FABLE, dogrulanmis: true, varsayilanKurulu: false, yayinci: "Vayra", ornekler: ornekSec(0), ornekIstem: "Rakamlarımı hareketli bir infografiğe dönüştür" },
  { ad: "Typography Animator", kat: "İçerik Üretimi", ozet: "Kinetik tipografi ve metin animasyonu", tohum: "bc-typo", guclu: G_FABLE, dogrulanmis: true, varsayilanKurulu: false, yayinci: "Vayra", ornekler: ornekSec(1), ornekIstem: "Sloganım için kinetik bir tipografi animasyonu üret" },

  // Yaratıcı & Pazarlama
  { ad: "TV Ad Director", kat: "Yaratıcı & Pazarlama", ozet: "15 saniyelik 16:9 yüksek kalite reklam", tohum: "bc-tvad", guclu: G_FABLE, dogrulanmis: true, varsayilanKurulu: false, yayinci: "Vayra", ornekler: ornekSec(2), ornekIstem: "Ürünüm için 15 saniyelik bir TV reklamı yönet" },
  { ad: "Ad Creative", kat: "Yaratıcı & Pazarlama", ozet: "Yüksek dönüşümlü reklam varyantları", tohum: "bc-adcreative", guclu: G_CLAUDE, dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", ornekler: ornekSec(3), ornekIstem: "Meta reklamım için 10 varyant başlık ve görsel üret" },
  { ad: "AI Influencer", kat: "Yaratıcı & Pazarlama", ozet: "AI influencer oluştur ve yönet", tohum: "bc-influencer", guclu: G_GPT, dogrulanmis: true, varsayilanKurulu: false, yayinci: "Vayra", ornekler: ornekSec(4), ornekIstem: "Markam için tutarlı bir AI influencer karakteri yarat" },
  { ad: "Brand Analyzer", kat: "Yaratıcı & Pazarlama", ozet: "Marka varlıklarını çıkarır ve analiz eder", tohum: "bc-brand", guclu: G_CLAUDE, dogrulanmis: true, varsayilanKurulu: false, yayinci: "Vayra", ornekler: ornekSec(5), ornekIstem: "Sitemden logo, renk ve fontları çıkar ve marka setini kur" },
  { ad: "Website Builder", kat: "Yaratıcı & Pazarlama", ozet: "Prompt'tan çalışan bir site kurar", tohum: "bc-website", guclu: G_CLAUDE, dogrulanmis: true, varsayilanKurulu: false, yayinci: "Vayra", ornekler: ornekSec(0), ornekIstem: "Yeni ürünüm için tek sayfalık bir landing sitesi kur" },
  { ad: "Landing Page Flow", kat: "Yaratıcı & Pazarlama", ozet: "Dönüşüm odaklı açılış sayfası akışı", tohum: "bc-landing", guclu: G_CLAUDE, dogrulanmis: true, varsayilanKurulu: false, yayinci: "Vayra", ornekler: ornekSec(1), ornekIstem: "Kampanyam için dönüşüm odaklı bir landing yazısı üret" },
  { ad: "Marketing Ideas", kat: "Yaratıcı & Pazarlama", ozet: "Brief'ten 20 kampanya fikri üretir", tohum: "bc-mktideas", guclu: G_CLAUDE, dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", ornekler: ornekSec(2), ornekIstem: "Yaz lansmanım için 20 kampanya fikri üret" },
  { ad: "Marketing Psychology", kat: "Yaratıcı & Pazarlama", ozet: "İkna ilkeleriyle metin ve akış kurar", tohum: "bc-mktpsych", guclu: G_CLAUDE, dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", ornekler: ornekSec(3), ornekIstem: "Landing metnimi ikna ilkeleriyle güçlendir" },
  { ad: "Organic Marketing", kat: "Yaratıcı & Pazarlama", ozet: "Rakip analizi, trend keşfi, içerik brief", tohum: "bc-organic", guclu: G_CLAUDE, dogrulanmis: true, varsayilanKurulu: false, yayinci: "Vayra", ornekler: ornekSec(4), ornekIstem: "Nişimde organik büyüme için bir içerik planı çıkar" },
  { ad: "Paid Ads", kat: "Yaratıcı & Pazarlama", ozet: "Ücretli reklam kampanyası kurar", tohum: "bc-paidads", guclu: G_CLAUDE, dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", ornekler: ornekSec(5), ornekIstem: "Google Ads kampanyam için anahtar kelime ve metin öner" },
  { ad: "Product Photographer", kat: "Yaratıcı & Pazarlama", ozet: "AI ile stüdyo ürün çekimleri", tohum: "bc-prodphoto", guclu: G_GPT, dogrulanmis: true, varsayilanKurulu: false, yayinci: "Vayra", ornekler: ornekSec(0), ornekIstem: "Ürünümü lüks bir yaşam alanı sahnesine yerleştir" },
  { ad: "Trend Picker", kat: "Yaratıcı & Pazarlama", ozet: "Viral analiz ve creator araştırması", tohum: "bc-trend", guclu: G_CLAUDE, dogrulanmis: true, varsayilanKurulu: false, yayinci: "Vayra", ornekler: ornekSec(1), ornekIstem: "Bu hafta nişimde patlayacak trendleri bul" },
  { ad: "Gpt Image 2 Director", kat: "Yaratıcı & Pazarlama", ozet: "GPT Image 2 için yönetmen düzeyi prompt", tohum: "bc-gptdir", guclu: G_GPT, dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", ornekler: ornekSec(2), ornekIstem: "Bu sahneyi GPT Image 2 için yönetmen kalitesinde tarif et" },

  // İletişim
  { ad: "Sohbet Asistanı", kat: "İletişim", ozet: "Müşteri sorularını marka sesiyle yanıtlar", tohum: "bc-chat", guclu: G_CLAUDE, dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", ornekler: ornekSec(3), ornekIstem: "Müşteri destek sorularına marka sesimle yanıt taslakları üret" },
  { ad: "Çeviri Uzmanı", kat: "İletişim", ozet: "40+ dilde bağlam-duyarlı çeviri", tohum: "bc-translate", guclu: G_CLAUDE, dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", ornekler: ornekSec(4), ornekIstem: "Landing metnimi İngilizce ve Almancaya çevir" },
  { ad: "Social Content", kat: "İletişim", ozet: "Tüm kanallar için sosyal içerik üretir", tohum: "bc-social", guclu: G_CLAUDE, dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", ornekler: ornekSec(5), ornekIstem: "Bu hafta için 7 sosyal medya gönderisi ve caption üret" },
  { ad: "Toplantı Özetleyici", kat: "İletişim", ozet: "Transkriptten özet ve aksiyonlar", tohum: "bc-meeting", guclu: G_CLAUDE, dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", ornekler: ornekSec(0), ornekIstem: "Toplantı kaydımdan özet ve aksiyon maddeleri çıkar" },

  // Veri & Analitik
  { ad: "Product Analyzer", kat: "Veri & Analitik", ozet: "Ürünü analiz eder, konumlandırma önerir", tohum: "bc-prodanalyze", guclu: G_CLAUDE, dogrulanmis: true, varsayilanKurulu: false, yayinci: "Vayra", ornekler: ornekSec(1), ornekIstem: "Ürünümü analiz et ve güçlü satış açılarını çıkar" },
  { ad: "Veri Analisti", kat: "Veri & Analitik", ozet: "CSV yükle, içgörü ve grafik çıkar", tohum: "bc-data", guclu: G_CLAUDE, dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", ornekler: ornekSec(2), ornekIstem: "Satış CSV'imi analiz et ve önemli içgörüleri grafikle" },
  { ad: "A/B Test Kurulumu", kat: "Veri & Analitik", ozet: "Deney tasarla, varyant ve hipotez üret", tohum: "bc-abtest", guclu: G_CLAUDE, dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", ornekler: ornekSec(3), ornekIstem: "Landing başlığım için bir A/B test hipotezi ve varyantları kur" },
  { ad: "SQL Yazarı", kat: "Veri & Analitik", ozet: "Doğal dilden optimize SQL sorgusu", tohum: "bc-sql", guclu: G_CLAUDE, dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", ornekler: ornekSec(4), ornekIstem: "Aylık aktif kullanıcıları getiren bir SQL sorgusu yaz" },
  { ad: "Pano Kurucu", kat: "Veri & Analitik", ozet: "KPI panosu tasarla ve doldur", tohum: "bc-dashboard", guclu: G_CLAUDE, dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", ornekler: ornekSec(5), ornekIstem: "Gelir metriklerim için bir KPI panosu tasarla" },

  // Belgeler
  { ad: "Pdf", kat: "Belgeler", ozet: "Uzun belgeyi maddelere indirger", tohum: "bc-pdf", guclu: G_CLAUDE, dogrulanmis: true, varsayilanKurulu: false, yayinci: "Vayra", ornekler: ornekSec(0), ornekIstem: "Bu PDF'i 10 maddede özetle" },
  { ad: "Content Strategy", kat: "Belgeler", ozet: "Uçtan uca içerik stratejisi belgesi", tohum: "bc-contentstrat", guclu: G_CLAUDE, dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", ornekler: ornekSec(1), ornekIstem: "Markam için çeyreklik bir içerik stratejisi belgesi yaz" },
  { ad: "Makale Düzenle", kat: "Belgeler", ozet: "Metni akıcılaştır, tutarlılık sağla", tohum: "bc-edit", guclu: G_CLAUDE, dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", ornekler: ornekSec(2), ornekIstem: "Bu blog yazısını akıcılaştır ve tutarlı hale getir" },
  { ad: "Sunum Üretici", kat: "Belgeler", ozet: "Konudan slayt destesi oluşturur", tohum: "bc-slides", guclu: G_CLAUDE, dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", ornekler: ornekSec(3), ornekIstem: "Ürün lansmanım için 10 slaytlık bir deste hazırla" },
  { ad: "Rapor Yazarı", kat: "Belgeler", ozet: "Verilerden biçimli rapor üretir", tohum: "bc-report", guclu: G_CLAUDE, dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", ornekler: ornekSec(4), ornekIstem: "Çeyrek verilerimden biçimli bir performans raporu yaz" },
  { ad: "Sözleşme Denetçisi", kat: "Belgeler", ozet: "Riskli maddeleri işaretler ve önerir", tohum: "bc-contract", guclu: G_CLAUDE, dogrulanmis: false, varsayilanKurulu: false, yayinci: "topluluk", ornekler: ornekSec(5), ornekIstem: "Bu sözleşmedeki riskli maddeleri işaretle ve öner" },
].map((b) => {
  const slug = slugla(b.ad);
  // Kurulum sayısı deterministik (SSR güvenli) — referansta hover'da görünür.
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  const ozel = (b as { komut?: string }).komut;
  return { ...b, slug, komut: ozel ?? slug, kurulum: 120 + (h % 9800) };
});

export function beceriBul(slug: string): Beceri | undefined {
  return BECERILER.find((b) => b.slug === slug);
}

/** Kapak/stil kutusu arka planı — foto veya gradyan. */
export function calisanKapakArka(c: Calisan): string {
  return c.kapak === "foto"
    ? scArka(c.tohum, "portre")
    : `radial-gradient(circle at 50% 35%, ${calisanRengi(c.tohum)})`;
}
