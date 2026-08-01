/* ============================================================
   VAYRA — Deterministik Demo (Seed) Üretimler
   ------------------------------------------------------------
   Kitaplık/Keşfet ekranları ilk açılışta (boş localStorage)
   Higgsfield gibi DOLU görünsün diye hazır 24 gerçekçi üretim.

   ÖNEMLİ — SSR / hydration güvenliği:
   - Date.now() ve Math.random() KULLANILMAZ. Zaman damgaları sabit
     bir tabandan deterministik olarak türetilir.
   - id'ler sabit string'lerdir ("seed_1".."seed_24"),
     performance.now() KULLANILMAZ.
   - gorselUrl, onizlemeArka(...) çıktısıdır (CSS background string),
     ham path değildir — UretimKarti style={{ background }} ile kullanır.

   Bu deterministiklik sayesinde initial state olarak güvenle
   kullanılabilir; sunucu ve istemci aynı çıktıyı üretir.
   ============================================================ */

import type { Uretim } from "@/store/useProjeler";
import type { ModelTur } from "@/lib/catalog";
import { onizlemeArka } from "@/lib/utils";
import { origArka } from "./gercekVeri";

/**
 * Sabit zaman tabanı — 12 Tem 2026 civarı bir an (UTC).
 * En yeni üretim en üstte görünsün diye timestamp'ler AZALAN sırada.
 */
const TABAN = 1_752_000_000_000;
const SAAT = 3_600_000; // 1 saat (ms)

/** Ham seed satırı — id/olusturma/gorselUrl otomatik türetilir. */
interface SeedSatir {
  baslik: string;
  tur: ModelTur;
  model: string;
  prompt: string;
  kredi: number;
  arac: string;
  /** onizlemeArka için kullanılacak stok kategorisi. */
  kategori: string;
  favori?: boolean;
  yayinda?: boolean;
}

/**
 * Sıralı ham demo verisi (en yeni en başta olacak şekilde).
 * ~10 görsel, ~8 video, ~3 ses, ~3 3D karışımı.
 */
const SATIRLAR: SeedSatir[] = [
  // ---- VİDEO (8) ----
  {
    baslik: "Neon Tokyo Sokakları — Gece Sürüşü",
    tur: "video",
    model: "Sora 2",
    prompt:
      "Yağmurdan ıslak Tokyo arka sokaklarında gece boyu ilerleyen kamera, neon tabelaların yansımaları, sinematik anamorfik lens, fizik tutarlı su birikintileri.",
    kredi: 60,
    arac: "Video Stüdyo",
    kategori: "sinematik",
    yayinda: true,
    favori: true,
  },
  {
    baslik: "Kapadokya Şafağında Balonlar",
    tur: "video",
    model: "Veo 3.1",
    prompt:
      "Kapadokya vadisinde şafak vakti yükselen onlarca sıcak hava balonu, altın saat aydınlatması, atmosferik sis, yavaş yukarı doğru kamera hareketi, 1080p.",
    kredi: 55,
    arac: "Video Stüdyo",
    kategori: "sinematik",
    yayinda: true,
  },
  {
    baslik: "Siberpunk Kahraman — Storyboard",
    tur: "video",
    model: "Kling 3.0",
    prompt:
      "Karakter odaklı 6 kesimlik siberpunk hikâye: yağmurlu çatı kovalamacası, holografik reklamlar, 4K, tutarlı karakter yüzü.",
    kredi: 48,
    arac: "Video Stüdyo",
    kategori: "sinematik",
  },
  {
    baslik: "Ürün Lansmanı — Parfüm Reklamı",
    tur: "video",
    model: "Seedance 2.0",
    prompt:
      "Lüks parfüm şişesinin etrafında dönen ışık, senkron müzik ve seslendirme, çok çekimli montaj, cam üzerinde damlacıklar, mermer zemin.",
    kredi: 42,
    arac: "Video Stüdyo",
    kategori: "sinematik",
    yayinda: true,
  },
  {
    baslik: "Anime Stil — Kiraz Çiçekleri",
    tur: "video",
    model: "WAN 2.7",
    prompt:
      "Video referanslı stil transferi ile canlı çekimi anime estetiğine çevir, kiraz çiçekleri savrulan bir tapınak avlusu, pastel tonlar.",
    kredi: 38,
    arac: "Video Stüdyo",
    kategori: "sinematik",
  },
  {
    baslik: "Hızlı Reels — Kahve Dükkânı",
    tur: "video",
    model: "MiniMax Hailuo 2.3",
    prompt:
      "Butik kahve dükkânında latte sanatı çeken barista, sıcak ışık, kısa-form dikey reels, hızlı kesimler, stilize renk gradasyonu.",
    kredi: 20,
    arac: "Video Stüdyo",
    kategori: "sinematik",
    yayinda: true,
  },
  {
    baslik: "Uzay İstasyonu — Yörünge Manzarası",
    tur: "video",
    model: "Sora 2",
    prompt:
      "Alçak yörüngedeki bir uzay istasyonundan Dünya manzarası, dönen güneş panelleri, gerçekçi ışık, uzun süreli yavaş kamera kaydırma.",
    kredi: 60,
    arac: "Video Stüdyo",
    kategori: "sinematik",
    favori: true,
  },
  {
    baslik: "Dağ Bisikleti — Orman Patikası",
    tur: "video",
    model: "Veo 3.1",
    prompt:
      "Sisli çam ormanında hızla inen dağ bisikletçisi, ilk şahıs takip kamerası, ıslak toprak, güneş ışınları ağaç aralarından, dış mekan.",
    kredi: 55,
    arac: "Video Stüdyo",
    kategori: "sinematik",
    yayinda: true,
  },

  // ---- GÖRSEL (10) — portre / manzara / urun dağılımlı ----
  {
    baslik: "Editorial Moda — Kırmızı Palto",
    tur: "gorsel",
    model: "Ruh 2.0",
    prompt:
      "Yüksek moda editorial portre, kırmızı yün palto giyen model, minimal stüdyo, keskin gölge, dergi kapağı estetiği, kültür-yerli kimlik.",
    kredi: 4,
    arac: "Görsel Stüdyo",
    kategori: "portre",
    favori: true,
    yayinda: true,
  },
  {
    baslik: "Sinematik Portre — Altın Işık",
    tur: "gorsel",
    model: "Ruh Sinema",
    prompt:
      "Altın saat pencere ışığında oturan kadın portresi, zengin doku, sığ alan derinliği, sıcak sinematik mood, film grain.",
    kredi: 6,
    arac: "Görsel Stüdyo",
    kategori: "portre",
    yayinda: true,
  },
  {
    baslik: "İzlanda Şelalesi — Geniş Manzara",
    tur: "gorsel",
    model: "Seedream 5.0 Pro",
    prompt:
      "İzlanda'da devasa bir şelale, bazalt kayalar, dramatik bulutlar, uzun pozlama ipeksi su, geniş açı manzara, yüksek dinamik aralık.",
    kredi: 7,
    arac: "Görsel Stüdyo",
    kategori: "manzara",
    yayinda: true,
  },
  {
    baslik: "Ürün Çekimi — Deri Cüzdan",
    tur: "gorsel",
    model: "Nano Banana Pro",
    prompt:
      "El yapımı kahverengi deri cüzdanın stüdyo ürün çekimi, yumuşak gölge, mermer yüzey, marka adı okunaklı yazı ile, e-ticaret kalitesi.",
    kredi: 5,
    arac: "Görsel Stüdyo",
    kategori: "urun",
  },
  {
    baslik: "Fütüristik Spor Ayakkabı",
    tur: "gorsel",
    model: "Flux 2",
    prompt:
      "Havada süzülen fütüristik spor ayakkabı, neon aksanlar, temiz stüdyo arka planı, keskin detay ve tutarlı geometri, reklam görseli.",
    kredi: 5,
    arac: "Görsel Stüdyo",
    kategori: "urun",
    favori: true,
  },
  {
    baslik: "Vesikalık — Kurumsal Portre",
    tur: "gorsel",
    model: "GPT Image 2",
    prompt:
      "Takım elbiseli profesyonelin stüdyo kalitesinde vesikalık portresi, nötr gri arka plan, yumuşak anahtar ışık, LinkedIn için uygun.",
    kredi: 6,
    arac: "Görsel Stüdyo",
    kategori: "portre",
  },
  {
    baslik: "Toskana Bağları — Gün Batımı",
    tur: "gorsel",
    model: "Ruh Sinema",
    prompt:
      "Toskana kırsalında gün batımında uzanan üzüm bağları, servi ağaçları, sıcak turuncu gökyüzü, huzurlu manzara, film estetiği.",
    kredi: 6,
    arac: "Görsel Stüdyo",
    kategori: "manzara",
    yayinda: true,
  },
  {
    baslik: "Kozmetik Serumu — Cam Şişe",
    tur: "gorsel",
    model: "Seedream 5.0 Pro",
    prompt:
      "Şeffaf cam cilt bakım serumu şişesi, su damlacıkları, yaprak yansımaları, açık pastel arka plan, premium kozmetik ürün çekimi.",
    kredi: 7,
    arac: "Görsel Stüdyo",
    kategori: "urun",
  },
  {
    baslik: "Sokak Portresi — Yağmur Sonrası",
    tur: "gorsel",
    model: "Ruh 2.0",
    prompt:
      "Yağmur sonrası şehir sokağında genç adam portresi, bokeh ışıklar, ıslak yansımalar, doğal cilt dokusu, editorial sokak modası.",
    kredi: 4,
    arac: "Görsel Stüdyo",
    kategori: "portre",
    favori: true,
  },
  {
    baslik: "Alp Dağları — Sisli Zirve",
    tur: "gorsel",
    model: "Flux 2",
    prompt:
      "Karlı Alp zirveleri arasında yükselen sabah sisi, keskin kaya detayı, soğuk mavi tonlar, geniş panoramik dağ manzarası.",
    kredi: 5,
    arac: "Görsel Stüdyo",
    kategori: "manzara",
  },

  // ---- SES (3) — soyut kategorisi ----
  {
    baslik: "Belgesel Anlatımı — Türkçe Seslendirme",
    tur: "ses",
    model: "ElevenLabs TTS",
    prompt:
      "Doğa belgeseli için sıcak, güven veren erkek anlatıcı sesi, net diksiyon, duygu tonlaması, Türkçe.",
    kredi: 3,
    arac: "Ses Stüdyosu",
    kategori: "soyut",
    yayinda: true,
  },
  {
    baslik: "Lo-fi Chill — Çalışma Müziği",
    tur: "ses",
    model: "Vali Müzik",
    prompt:
      "Rahatlatıcı lo-fi hip-hop enstrümantal, yumuşak piyano, vinil çıtırtısı, 90 BPM, telifsiz çalışma müziği loop.",
    kredi: 8,
    arac: "Ses Stüdyosu",
    kategori: "soyut",
    favori: true,
  },
  {
    baslik: "SFX — Kapı Gıcırtısı & Adımlar",
    tur: "ses",
    model: "Vali SFX",
    prompt:
      "Ahşap kapı gıcırtısı ve tahta zeminde yaklaşan ayak sesleri, gerilim sahnesi için foley ses efekti paketi.",
    kredi: 2,
    arac: "Ses Stüdyosu",
    kategori: "soyut",
  },

  // ---- 3D (3) — 3d kategorisi ----
  {
    baslik: "Sci-fi Kask — Üretime Hazır Model",
    tur: "3d",
    model: "Meshy Metin→3D",
    prompt:
      "Fütüristik astronot kaskı, PBR dokulu, temiz quad topoloji, GLB çıktı, oyun/AR için üretime hazır 3D varlık.",
    kredi: 25,
    arac: "3D Stüdyo",
    kategori: "3d",
    favori: true,
    yayinda: true,
  },
  {
    baslik: "Antika Vazo — Görselden 3D",
    tur: "3d",
    model: "Meshy Görsel→3D",
    prompt:
      "Tek referans fotoğraftan çıkarılan seramik antika vazo mesh'i, otomatik topoloji, gerçekçi doku haritası.",
    kredi: 30,
    arac: "3D Stüdyo",
    kategori: "3d",
    yayinda: true,
  },
  {
    baslik: "Robot Karakter — Rig & Yürüyüş",
    tur: "3d",
    model: "Meshy Rig & Animasyon",
    prompt:
      "Sevimli robot karakterin otomatik rig'lenmesi ve yürüme animasyonu, hazır iskelet, gerçek zamanlı önizleme için optimize.",
    kredi: 20,
    arac: "3D Stüdyo",
    kategori: "3d",
  },
];

/**
 * Ham satırlardan tam Uretim nesnelerini deterministik olarak türetir.
 * - id: "seed_{n}" (sabit, performance.now yok)
 * - olusturma: TABAN - index*SAAT → en yeni (index 0) en büyük timestamp,
 *   böylece [en yeni ... en eski] sıralaması korunur.
 * - gorselUrl: onizlemeArka(baslik+model, kategori) → CSS background string.
 */
/**
 * Higgsfield birebir: galeri satır-hizalı (justified) dizilir ve kartlar KARIŞIK
 * en-boy oranlarında olur. Oran meta'dan okunur (UretimKarti.oranSayi), o yüzden
 * seed'lere de deterministik çeşitli oranlar veriyoruz — hepsi aynı olursa galeri
 * ölü bir ızgaraya döner.
 */
const GORSEL_ORANLAR = ["3:4", "1:1", "4:3", "16:9", "2:3", "4:5", "3:2", "9:16"];
const VIDEO_ORANLAR = ["16:9", "16:9", "9:16", "4:3", "21:9"];
function seedOran(tur: ModelTur, i: number): string {
  if (tur === "video") return VIDEO_ORANLAR[i % VIDEO_ORANLAR.length];
  if (tur === "3d") return "1:1";
  if (tur === "ses") return "4:3";
  return GORSEL_ORANLAR[i % GORSEL_ORANLAR.length];
}

export const SEED_URETIMLER: Uretim[] = SATIRLAR.map((s, i) => ({
  id: `seed_${i + 1}`,
  baslik: s.baslik,
  tur: s.tur,
  model: s.model,
  prompt: s.prompt,
  durum: "tamam",
  ilerleme: 100,
  gorselUrl: onizlemeArka(`${s.baslik}${s.model}`, s.kategori),
  olusturma: TABAN - i * SAAT,
  kredi: s.kredi,
  favori: s.favori,
  yayinda: s.yayinda,
  arac: s.arac,
  meta: { oran: seedOran(s.tur, i), cozunurluk: s.tur === "gorsel" ? "2K" : "1080p" },
  saglayici: "simulasyon",
  gercek: false,
}));
