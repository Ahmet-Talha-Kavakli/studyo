/**
 * Keşfet ana sayfası içerik verisi.
 * Bölüm bileşenleri yalnız sunumdan sorumlu; metin, medya ve bağlantılar burada.
 * Medya yolları public/gercek altındaki gerçek üretimlerdir.
 */
import type { LucideIcon } from "lucide-react";
import {
  Image as ImageIcon, Film, AudioLines, Music, Box, Workflow, Wand2, Maximize2, Crop,
  Pencil, Palette, Clapperboard, Scissors, Presentation, Mic, Combine, UserRound,
  Layers,
} from "lucide-react";
import { havuzSec } from "@/lib/medyaHavuzu";

const G = "/gercek";

/* ── Hero: dönen yetenek listesi — her satır arka plan medyasını değiştirir ── */
export const HERO_YETENEKLER: { metin: string; video: string; href: string }[] = [
  { metin: "Sinematik video çek", video: `${G}/hero-video/hero-video.mp4`, href: "/panel/video" },
  { metin: "Ürün reklamı hazırla", video: `${G}/paz-video/gal-pazarlama-5.mp4`, href: "/panel/pazarlama" },
  { metin: "Kamerayı yönet", video: `${G}/video-hareket/drone-orbit.mp4`, href: "/panel/sinema" },
  { metin: "Müzik besteler", video: `${G}/hero-video/hero-muzik.mp4`, href: "/panel/muzik" },
  { metin: "3D model oluştur", video: `${G}/hero-video/hero-3d.mp4`, href: "/panel/3d" },
  { metin: "Kampanyanı ölçekle", video: `${G}/paz-video/gal-pazarlama-0.mp4`, href: "/panel/pazarlama" },
];

/* ── Hero üretim kutusu ── */
export type UretimTuru = { id: string; ad: string; href: string; ikon: LucideIcon; ipucu: string };
export const URETIM_TURLERI: UretimTuru[] = [
  { id: "gorsel", ad: "Görsel", href: "/panel/gorsel", ikon: ImageIcon, ipucu: "Bir sahne, ürün ya da portre tarif et…" },
  { id: "video", ad: "Video", href: "/panel/video", ikon: Film, ipucu: "Kamera hareketiyle birlikte bir sahne tarif et…" },
  { id: "ses", ad: "Ses", href: "/panel/ses", ikon: AudioLines, ipucu: "Seslendirilecek metni yaz…" },
  { id: "muzik", ad: "Müzik", href: "/panel/muzik", ikon: Music, ipucu: "Tarz, tempo ve ruh hâlini anlat…" },
  { id: "3d", ad: "3D", href: "/panel/3d", ikon: Box, ipucu: "Bir karakter ya da obje tarif et…" },
];
// Prompt'u ?prompt= ile okuyabilen stüdyolar.
export const PROMPT_ALAN = new Set(["gorsel", "video"]);

// Kutu boşken placeholder'da sırayla "yazılan" örnekler.
export const YAZI_ORNEKLERI = [
  "Yağmurlu bir gecede Galata Kulesi, ıslak taşlarda neon yansımalar",
  "Kapadokya'da gün doğumu, balonlar yavaşça yükseliyor, drone çekimi",
  "Mermer zeminde lüks saat, dramatik yan ışık, ürün çekimi",
  "Anadolu ezgileriyle elektronik bir sahne müziği, 120 BPM",
];

/* ── Model sağlayıcı şeridi (hero altı) ── */
// Renkli logolar: public/marka/renkli — LobeHub icons-static-svg@1.95.1 (MIT).
// Tek renkli markalar (OpenAI, xAI, BFL, ElevenLabs) koyu zemin için beyaza çevrildi.
const L = "/marka/renkli";
export const SAGLAYICILAR: { ad: string; logo: string }[] = [
  { ad: "Google DeepMind", logo: `${L}/gemini-color.svg` },
  { ad: "OpenAI", logo: `${L}/openai.svg` },
  { ad: "ByteDance", logo: `${L}/bytedance-color.svg` },
  { ad: "Kling AI", logo: `${L}/kling-color.svg` },
  { ad: "MiniMax", logo: `${L}/minimax-color.svg` },
  { ad: "Alibaba", logo: `${L}/alibaba-color.svg` },
  { ad: "xAI", logo: `${L}/xai.svg` },
  { ad: "ElevenLabs", logo: `${L}/elevenlabs.svg` },
  { ad: "Black Forest Labs", logo: `${L}/bfl.svg` },
  { ad: "Meshy", logo: `${L}/meshy-color.svg` },
];

/* ── Ürün vitrini: tür sekmeleri + her türün araç listesi ── */
export type VitrinSekme = {
  id: string; ad: string; ikon: LucideIcon; ozet: string;
  medya: { tur: "video" | "gorsel"; src: string };
  araclar: { ad: string; aciklama: string; href: string; ikon: LucideIcon }[];
};
export const VITRIN: VitrinSekme[] = [
  {
    id: "gorsel", ad: "Görsel", ikon: ImageIcon,
    ozet: "Üret, düzenle, büyüt, yeniden çerçevele. Karakterin ve markan her karede tutarlı kalsın.",
    medya: { tur: "gorsel", src: `${G}/canvas/cv-hero-portre.webp` },
    araclar: [
      { ad: "Görsel üret", aciklama: "Metinden 4K görsel", href: "/panel/gorsel", ikon: ImageIcon },
      { ad: "Düzenle", aciklama: "Bir bölgeyi seç, değiştir", href: "/panel/inpaint", ikon: Wand2 },
      { ad: "Büyüt", aciklama: "Çözünürlüğü ve detayı artır", href: "/panel/upscale", ikon: Maximize2 },
      { ad: "Yeniden çerçevele", aciklama: "Her formata uyarla", href: "/panel/reframe", ikon: Crop },
      { ad: "Çizimden görsel", aciklama: "Eskizini gerçeğe çevir", href: "/panel/draw", ikon: Pencil },
      { ad: "Moodboard", aciklama: "Stilini referanslarla kur", href: "/panel/moodboard", ikon: Palette },
    ],
  },
  {
    id: "video", ad: "Video", ikon: Film,
    ozet: "Tek cümleden sahneye. Kamera hareketi, ışık ve kurgu senin kontrolünde.",
    medya: { tur: "video", src: `${G}/video-hareket/crane-up.mp4` },
    araclar: [
      { ad: "Video üret", aciklama: "Metinden ya da görselden", href: "/panel/video", ikon: Film },
      { ad: "Sinema Stüdyosu", aciklama: "Çok çekimli prodüksiyon", href: "/panel/sinema", ikon: Clapperboard },
      { ad: "Uzun video", aciklama: "1 dakikadan 1 saate", href: "/panel/uzun-video", ikon: Layers },
      { ad: "Montaj", aciklama: "Yapay zekâ destekli kurgu", href: "/panel/montaj", ikon: Combine },
      { ad: "Shorts", aciklama: "Dikey kısa video akışı", href: "/panel/shorts", ikon: Scissors },
      { ad: "Explainer", aciklama: "Anlatım ve eğitim videosu", href: "/panel/explainer", ikon: Presentation },
    ],
  },
  {
    id: "ses", ad: "Ses", ikon: AudioLines,
    ozet: "Doğal Türkçe seslendirme, karakter sesleri ve dudak senkronu.",
    medya: { tur: "gorsel", src: `${G}/arac/ses-ilham-dalga.webp` },
    araclar: [
      { ad: "Metinden ses", aciklama: "Doğal, duygulu seslendirme", href: "/panel/ses", ikon: AudioLines },
      { ad: "Konuştur", aciklama: "Görseli konuşan videoya çevir", href: "/panel/speak", ikon: Mic },
      { ad: "AI Influencer", aciklama: "Sesli, tutarlı karakter", href: "/panel/influencer", ikon: UserRound },
    ],
  },
  {
    id: "muzik", ad: "Müzik", ikon: Music,
    ozet: "Vokalli ya da enstrümantal; reklam, film ve sosyal medya için telifsiz müzik.",
    medya: { tur: "video", src: `${G}/hero-video/hero-muzik.mp4` },
    araclar: [
      { ad: "Müzik üret", aciklama: "Tarz ve ruh hâlinden şarkı", href: "/panel/muzik", ikon: Music },
      { ad: "Sahne müziği", aciklama: "Videona uygun fon müziği", href: "/panel/muzik", ikon: Film },
    ],
  },
  {
    id: "3d", ad: "3D", ikon: Box,
    ozet: "Karakter, obje ve sahneler. PBR dokularla indir, oyununda ya da sahnende kullan.",
    medya: { tur: "video", src: `${G}/hero-video/hero-3d.mp4` },
    araclar: [
      { ad: "Metinden 3D", aciklama: "Tarif et, modelini al", href: "/panel/3d", ikon: Box },
      { ad: "Görselden 3D", aciklama: "Tek fotoğraftan model", href: "/panel/3d", ikon: ImageIcon },
    ],
  },
  {
    id: "canvas", ad: "Canvas", ikon: Workflow,
    ozet: "Tüm araçları düğümlerle zincirle. Fikir, versiyon ve ekip tek bir sonsuz kanvasta.",
    medya: { tur: "gorsel", src: `${G}/canvas/cv-hero-video.webp` },
    araclar: [
      { ad: "Canvas", aciklama: "Düğüm tabanlı iş akışı", href: "/panel/canvas", ikon: Workflow },
      { ad: "Projeler", aciklama: "Ekip ve varlık yönetimi", href: "/panel/projeler", ikon: Layers },
    ],
  },
];

/* ── Model şeridi ── */
export type ModelKart = { ad: string; saglayici: string; logo: string; tur: "Video" | "Görsel" | "Ses" | "3D"; yeni?: boolean };
export const MODELLER: ModelKart[] = [
  { ad: "Kling 4.0", saglayici: "Kling AI", logo: `${L}/kling-color.svg`, tur: "Video", yeni: true },
  { ad: "Veo 3.1", saglayici: "Google DeepMind", logo: `${L}/deepmind-color.svg`, tur: "Video" },
  { ad: "Seedance 2.0", saglayici: "ByteDance", logo: `${L}/bytedance-color.svg`, tur: "Video" },
  { ad: "Wan 3.0", saglayici: "Alibaba", logo: `${L}/qwen-color.svg`, tur: "Video", yeni: true },
  { ad: "Hailuo 02", saglayici: "MiniMax", logo: `${L}/hailuo-color.svg`, tur: "Video" },
  { ad: "Grok Imagine", saglayici: "xAI", logo: `${L}/grok.svg`, tur: "Video" },
  { ad: "Nano Banana Pro", saglayici: "Google", logo: `${L}/nanobanana-color.svg`, tur: "Görsel" },
  { ad: "GPT Image 2", saglayici: "OpenAI", logo: `${L}/openai.svg`, tur: "Görsel" },
  { ad: "Seedream 5.0", saglayici: "ByteDance", logo: `${L}/doubao-color.svg`, tur: "Görsel" },
  { ad: "Flux Kontext", saglayici: "Black Forest Labs", logo: `${L}/flux.svg`, tur: "Görsel" },
  { ad: "Eleven v3", saglayici: "ElevenLabs", logo: `${L}/elevenlabs.svg`, tur: "Ses" },
  { ad: "Meshy 6", saglayici: "Meshy", logo: `${L}/meshy-color.svg`, tur: "3D" },
];

/* ── Önce / Sonra ── */
export type OnceSonra = { id: string; ad: string; baslik: string; ozet: string; once: string; sonra: string; onceFiltre?: string; href: string };
// Aynı kare iki kez kullanılır; "önce" hâli CSS filtresiyle bozulur ki iki taraf
// birebir hizalı olsun (farklı kişiler/kadrajlar karşılaştırmayı anlamsızlaştırır).
export const ONCE_SONRA: OnceSonra[] = [
  {
    id: "buyut", ad: "Büyüt", baslik: "Düşük çözünürlükten 4K'ya.",
    ozet: "Bulanık kareleri keskinleştirir, kaybolan detayı yeniden yaratır. Baskıya ve büyük ekrana hazır.",
    once: `${G}/orig/orig-kokboru-oynatici.webp`, sonra: `${G}/orig/orig-kokboru-oynatici.webp`,
    onceFiltre: "blur(3px) saturate(0.75) contrast(0.9)", href: "/panel/upscale",
  },
  {
    id: "netlestir", ad: "Netleştir", baslik: "Her portre, odakta.",
    ozet: "Odak dışı ya da hareketli çekimlerde yüzü ve detayları netleştirir. Cilt dokusu doğal kalır.",
    once: `${G}/gorsel/gorsel-karakter-Aria.webp`, sonra: `${G}/gorsel/gorsel-karakter-Aria.webp`,
    onceFiltre: "blur(2.5px) contrast(0.85) brightness(0.95)", href: "/panel/upscale",
  },
  {
    id: "renklendir", ad: "Renklendir", baslik: "Siyah-beyazdan sinematik renge.",
    ozet: "Eski ya da renksiz kareleri doğal, sinematik bir renk paletiyle yeniden yorumlar.",
    once: `${G}/galeri/sinematik4.webp`, sonra: `${G}/galeri/sinematik4.webp`,
    onceFiltre: "grayscale(1) contrast(0.9)", href: "/panel/gorsel",
  },
];

/* ── Kullanım alanları ── */
export const KULLANIM: { ad: string; ozet: string; video: string; poster?: string; href: string; genis?: boolean }[] = [
  { ad: "Reklam", ozet: "Brief'ten final reklama. Ajans zinciri yok, bekleme yok.", video: `${G}/paz-video/gal-pazarlama-0.mp4`, href: "/panel/pazarlama" },
  { ad: "Ürün çekimi", ozet: "Stüdyo, ekip ve takvim olmadan profesyonel ürün fotoğrafları.", video: `${G}/video-hareket/commercial.mp4`, href: "/panel/gorsel" },
  { ad: "Marka kampanyası", ozet: "Her formatta, her ölçekte markana uygun görsel, video ve ses.", video: `${G}/paz-video/gal-pazarlama-6.mp4`, href: "/panel/pazarlama" },
  { ad: "Film yapımı", ozet: "Karakterler, storyboard'lar ve sahneler. Son kareye kadar sinematik araçlar.", video: havuzSec("film-yapimi", ["gece", "sehir"]).video, poster: havuzSec("film-yapimi", ["gece", "sehir"]).poster, href: "/panel/sinema", genis: true },
];

/* ── Viral presetler ── */
export const PRESETLER: { ad: string; video: string }[] = [
  { ad: "Aksiyon Figürü", video: `${G}/preset-video/action-figure.mp4` },
  { ad: "Dünyaya Zoom", video: `${G}/preset-video/earth-zoom.mp4` },
  { ad: "Çıkartma", video: `${G}/preset-video/sticker-peel.mp4` },
  { ad: "360° Yörünge", video: `${G}/preset-video/orbit-360.mp4` },
  { ad: "Masal Şatosu", video: `${G}/preset-video/fairytale-castle.mp4` },
  { ad: "Eskizden Kumaşa", video: `${G}/preset-video/sketch-to-fabric.mp4` },
  { ad: "Yüksel", video: `${G}/preset-video/elevate.mp4` },
  { ad: "Süzül ve Dön", video: `${G}/preset-video/float-spin.mp4` },
  { ad: "Ay Yürüyüşü", video: `${G}/preset-video/moonwalk.mp4` },
  { ad: "Selfie İkizi", video: `${G}/preset-video/selfie-twin.mp4` },
  { ad: "Karton Maket", video: `${G}/preset-video/cardboard-cutout.mp4` },
];

/* ── Ekip maketlerindeki kişiler (arşivdeki üretilmiş portreler) ── */
export const AVATAR = {
  elif: `${G}/gorsel/gorsel-karakter-Aria.webp`,
  kaan: `${G}/gorsel/gorsel-karakter-Kai.webp`,
  zeynep: `${G}/gorsel/gorsel-karakter-Sofia.webp`,
  mert: `${G}/gorsel/gorsel-karakter-Leo.webp`,
};

/* ── Ekipler ── */
export const EKIP_OZELLIKLERI = [
  { baslik: "Ticari kullanım hakkı", ozet: "Ürettiğin her içeriği reklamda, üründe ve kampanyada kullan." },
  { baslik: "Verin senin", ozet: "Yüklediğin dosyalar ve üretimlerin model eğitiminde kullanılmaz." },
  { baslik: "Yönetici kontrolü", ozet: "Üyeler, yetkiler, krediler ve model erişimi tek panelde." },
  { baslik: "TL ile faturalandırma", ozet: "Türk lirası fiyatlar, e-fatura ve kurumsal ödeme seçenekleri." },
  { baslik: "Ortak kredi havuzu", ozet: "Koltuk başı ücret yok; ekip tek havuzdan kullanır." },
  { baslik: "Öncelikli destek", ozet: "Kurulumdan günlük kullanıma kadar gerçek bir ekip yanında." },
];

/* ── SSS ── */
export const SSS: { s: string; c: string }[] = [
  { s: "Vayra nedir?", c: "Vayra; görsel, video, ses, müzik ve 3D üretimini tek panelde toplayan bir yapay zekâ yaratım platformudur. Dünyanın önde gelen modellerini tek hesapla, Türkçe arayüzle kullanırsın." },
  { s: "Hangi modelleri kullanabilirim?", c: "Kling, Veo, Seedance, Wan, Nano Banana, GPT Image, Seedream ve daha fazlası. Yeni modeller çıktıkça panele eklenir; ayrı abonelik gerekmez." },
  { s: "Kredi sistemi nasıl çalışır?", c: "Her üretim, seçtiğin model ve kaliteye göre belirli bir kredi harcar. Planına dahil aylık kredini kullanır, gerekirse ek paket alırsın. Maliyeti üretmeden önce görürsün." },
  { s: "Ürettiklerimi ticari olarak kullanabilir miyim?", c: "Ücretli planlarda ürettiğin içerikleri reklam, ürün ve kampanyalarında ticari olarak kullanabilirsin." },
  { s: "Hangi ödeme yöntemlerini kabul ediyorsunuz?", c: "Türk lirası ile kredi ve banka kartı kabul ediyoruz. Kurumsal müşteriler için havale ve e-fatura seçenekleri mevcut." },
  { s: "Ücretsiz deneyebilir miyim?", c: "Evet. Kaydolduğunda deneme kredisi tanımlanır; kart bilgisi girmeden platformu keşfedebilirsin." },
  { s: "Verilerim güvende mi?", c: "Yüklediğin dosyalar ve üretimlerin modellerin eğitiminde kullanılmaz. Verilerin KVKK kapsamında işlenir." },
];

/* ── Footer ── */
export const FOOTER_KOLONLAR: { baslik: string; linkler: [string, string][] }[] = [
  { baslik: "Üret", linkler: [["Görsel", "/panel/gorsel"], ["Video", "/panel/video"], ["Ses", "/panel/ses"], ["Müzik", "/panel/muzik"], ["3D", "/panel/3d"], ["Canvas", "/panel/canvas"]] },
  { baslik: "Stüdyolar", linkler: [["Sinema Stüdyosu", "/panel/sinema"], ["Pazarlama Stüdyosu", "/panel/pazarlama"], ["Uzun Video", "/panel/uzun-video"], ["Montaj", "/panel/montaj"], ["Viral Presetler", "/panel/presetler"]] },
  { baslik: "Platform", linkler: [["Modeller", "/modeller"], ["Fiyatlandırma", "/fiyatlandirma"], ["Kurumsal", "/kurumsal"], ["Güvenlik", "/guvenlik"], ["API & MCP", "/gelistirici"], ["Entegrasyonlar", "/entegrasyonlar"], ["Vayra Earn", "/earn"], ["Sistem durumu", "/durum"], ["Uygulamalar", "/indir"]] },
  { baslik: "Şirket", linkler: [["Hakkımızda", "/hakkinda"], ["Müşteriler", "/referanslar"], ["Kariyer", "/kariyer"], ["Blog", "/blog"], ["Basın", "/basin"], ["İş ortaklığı", "/partner"], ["İletişim", "/iletisim"]] },
  { baslik: "Yasal", linkler: [["Yasal merkez", "/yasal"], ["Gizlilik", "/gizlilik"], ["Kullanım şartları", "/sartlar"], ["KVKK", "/veri-koruma"], ["Çerezler", "/cerezler"], ["İade & iptal", "/iade"], ["SSS", "/sss"]] },
];
