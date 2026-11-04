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
   - gorselUrl, public/gercek altındaki, istemle eşleşen gerçek bir karedir.
     ham path değildir — UretimKarti style={{ background }} ile kullanır.

   Bu deterministiklik sayesinde initial state olarak güvenle
   kullanılabilir; sunucu ve istemci aynı çıktıyı üretir.
   ============================================================ */

import type { Uretim } from "@/store/useProjeler";
import type { ModelTur } from "@/lib/catalog";

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
  kategori?: string;
  /** Örneğin gerçek görseli (public/gercek) — istemle birebir eşleşir. */
  gorsel: string;
  oran: string;
  sure?: string;
  favori?: boolean;
  yayinda?: boolean;
}

/**
 * Sıralı ham demo verisi (en yeni en başta olacak şekilde).
 * ~10 görsel, ~8 video, ~3 ses, ~3 3D karışımı.
 */
const SATIRLAR: SeedSatir[] = [
  { baslik: "Yağmurlu Tokyo Sokakları", tur: "video", model: "Sora 2", prompt: "Yağmurdan ıslak Tokyo sokağında şemsiyeli kalabalık, neon tabelaların yansımaları, sinematik anamorfik lens, yavaş takip kamerası.", kredi: 60, arac: "Video Stüdyo", gorsel: "/gercek/kesfet/yagmurlu-tokyo-sokagikling-3-0-turbo.webp", oran: "9:16", sure: "0:08", favori: true, yayinda: true },
  { baslik: "Sisli Vadi — Şafak", tur: "video", model: "Veo 3.1", prompt: "Şafakta sisle dolan dağ vadisi, katman katman sırtlar, yavaş yukarı kamera hareketi, atmosferik ışık, 1080p.", kredi: 55, arac: "Video Stüdyo", gorsel: "/gercek/kesfet/sisli-vadi-safagiseedance-2-0.webp", oran: "9:16", sure: "0:08", yayinda: true },
  { baslik: "Neon Ninja — Kovalamaca", tur: "video", model: "Kling 3.0", prompt: "Yağmurlu neon sokakta ışın kılıçlı ninja, holografik tabelalar, ağır çekim, siberpunk atmosfer, tutarlı karakter.", kredi: 48, arac: "Video Stüdyo", gorsel: "/gercek/kesfet/neon-ninjaatlas-creative.webp", oran: "1:1", sure: "0:05" },
  { baslik: "Saat Reklamı — Ürün Lansmanı", tur: "video", model: "Seedance 2.0", prompt: "Lüks kol saatinin etrafında dönen ışık, koyu zemin, makro kadran detayı, çok çekimli reklam montajı.", kredi: 42, arac: "Video Stüdyo", gorsel: "/gercek/kesfet/urun-reklami-saatadcraft.webp", oran: "16:9", sure: "0:10", yayinda: true },
  { baslik: "Samuray Düellosu", tur: "video", model: "WAN 2.7", prompt: "Kiraz çiçekleri savrulan avluda iki samurayın düellosu, gün batımı ışığı, toz ve yapraklar, sinematik ağır çekim.", kredi: 38, arac: "Video Stüdyo", gorsel: "/gercek/kesfet/samuray-duellosukling-3-0.webp", oran: "9:16", sure: "0:05" },
  { baslik: "Kahve Dükkânı — Reels", tur: "video", model: "MiniMax Hailuo 2.3", prompt: "Ahşap masada latte, pencereden sıcak ışık, yavaş dolly hareketi, kısa dikey reels için stilize renk.", kredi: 20, arac: "Video Stüdyo", gorsel: "/gercek/galeri/urun5.webp", oran: "1:1", sure: "0:06", yayinda: true },
  { baslik: "Uzay İstasyonu — Yörünge", tur: "video", model: "Sora 2", prompt: "Alçak yörüngedeki uzay istasyonu, arkada Dünya, dönen güneş panelleri, gerçekçi ışık, uzun yavaş kamera kaydırma.", kredi: 60, arac: "Video Stüdyo", gorsel: "/gercek/kesfet/uzay-istasyonu-yorungesiveo-3-1.webp", oran: "9:16", sure: "0:10", favori: true },
  { baslik: "Orman Şelalesi — FPV", tur: "video", model: "Veo 3.1", prompt: "Yosunlu orman içinde şelaleye doğru alçak FPV drone uçuşu, su sisi, sabah ışığı, akıcı hareket.", kredi: 55, arac: "Video Stüdyo", gorsel: "/gercek/kesfet/fpv-drone.webp", oran: "3:4", sure: "0:08", yayinda: true },
  { baslik: "Editorial Moda — Siyah Couture", tur: "gorsel", model: "Ruh 2.0", prompt: "Yüksek moda editorial: siyah tüylü couture elbise, koyu stüdyo, keskin kenar ışığı, dergi kapağı estetiği.", kredi: 4, arac: "Görsel Stüdyo", gorsel: "/gercek/kesfet/editorial-moda1.webp", oran: "16:9", favori: true, yayinda: true },
  { baslik: "Altın Saat Portresi", tur: "gorsel", model: "Ruh Sinema", prompt: "Altın saatte çayırda kızıl saçlı kadın portresi, sığ alan derinliği, sıcak sinematik ton, film grain.", kredi: 6, arac: "Görsel Stüdyo", gorsel: "/gercek/kesfet/altin-saat-portresinano-banana-pro.webp", oran: "9:16", yayinda: true },
  { baslik: "Tropik Şelale", tur: "gorsel", model: "Seedream 5.0 Pro", prompt: "Yağmur ormanında turkuaz gölete dökülen şelale, uzun pozlama ipeksi su, yemyeşil bitki örtüsü, geniş açı.", kredi: 7, arac: "Görsel Stüdyo", gorsel: "/gercek/galeri/manzara9.webp", oran: "1:1", yayinda: true },
  { baslik: "Ürün Çekimi — Kol Saati", tur: "gorsel", model: "Nano Banana Pro", prompt: "Deri kayışlı lacivert kadranlı kol saati, ahşap yüzey, yumuşak gölge, e-ticaret kalitesinde ürün çekimi.", kredi: 5, arac: "Görsel Stüdyo", gorsel: "/gercek/galeri/urun11.webp", oran: "1:1" },
  { baslik: "Fütüristik Spor Ayakkabı", tur: "gorsel", model: "Flux 2", prompt: "Renkli fütüristik spor ayakkabı çifti, pastel stüdyo zemini, keskin detay ve tutarlı geometri, reklam görseli.", kredi: 5, arac: "Görsel Stüdyo", gorsel: "/gercek/galeri/urun4.webp", oran: "1:1", favori: true },
  { baslik: "Karakter Portresi — Yakın Plan", tur: "gorsel", model: "GPT Image 2", prompt: "Sakallı adamın sinematik yakın plan portresi, koyu zemin, yumuşak anahtar ışık, keskin göz detayı.", kredi: 5, arac: "Görsel Stüdyo", gorsel: "/gercek/galeri/portre10.webp", oran: "1:1" },
  { baslik: "Yeşil Tepeler — Kırsal Manzara", tur: "gorsel", model: "Seedream 5.0 Pro", prompt: "Yeşil tepeler arasında kıvrılan yol ve tek bir çiftlik evi, sabah ışığı, geniş açı, yumuşak gölgeler.", kredi: 7, arac: "Görsel Stüdyo", gorsel: "/gercek/galeri/manzara3.webp", oran: "1:1" },
  { baslik: "Kozmetik Serum — Cam Şişe", tur: "gorsel", model: "Nano Banana Pro", prompt: "Beyaz zeminde damlalıklı cam serum şişesi, minimal kompozisyon, yumuşak ışık, temiz ürün görseli.", kredi: 5, arac: "Görsel Stüdyo", gorsel: "/gercek/kesfet/urun-reklami4.webp", oran: "16:9" },
  { baslik: "Neon Sokak Portresi", tur: "gorsel", model: "Ruh 2.0", prompt: "Neon ışıklı sokakta yüzüne renkli çizgiler yansıyan genç adam, gece, sinematik yakın plan.", kredi: 4, arac: "Görsel Stüdyo", gorsel: "/gercek/galeri/portre3.webp", oran: "1:1" },
  { baslik: "Dağ Gölü — Şafak", tur: "gorsel", model: "Seedream 5.0 Pro", prompt: "Karlı dağların aynalandığı sakin göl, şafak sisi, simetrik kompozisyon, serin tonlar.", kredi: 7, arac: "Görsel Stüdyo", gorsel: "/gercek/galeri/manzara1.webp", oran: "1:1" },
  { baslik: "Belgesel Anlatımı — Türkçe", tur: "ses", model: "ElevenLabs v3", prompt: "Sakin ve güven veren erkek sesiyle belgesel anlatımı: \"Bu topraklarda her taşın bir hikâyesi var.\"", kredi: 8, arac: "Ses Stüdyo", gorsel: "/gercek/kesfet/sinematik-anlatinarration.webp", oran: "1:1", sure: "0:42" },
  { baslik: "Lo-fi Chill — Çalışma Müziği", tur: "muzik", model: "Vayra Muse", prompt: "Yumuşak piyano ve vinil cızırtısıyla lo-fi hip hop, 78 BPM, odaklanmak için sakin ritim.", kredi: 10, arac: "Müzik Stüdyo", gorsel: "/gercek/kesfet/vayra-muse-litevayra.webp", oran: "1:1", sure: "2:14", favori: true },
  { baslik: "SFX — Kapı Gıcırtısı ve Adımlar", tur: "ses", model: "Vali SFX", prompt: "Eski ahşap kapının gıcırdayarak açılması ve ardından taş zeminde yaklaşan adımlar.", kredi: 3, arac: "Ses Stüdyo", gorsel: "/gercek/kesfet/vali-sfxvali.webp", oran: "1:1", sure: "0:06" },
  { baslik: "Sci-fi Robot — Üretime Hazır Model", tur: "3d", model: "Meshy 6", prompt: "Mavi ışıklı zırhlı sci-fi robot, PBR dokular, oyun motoruna hazır düşük poligon topoloji.", kredi: 30, arac: "3D Stüdyo", gorsel: "/gercek/kesfet/sci-fi-robot-karakter3dworks.webp", oran: "1:1" },
  { baslik: "Robot Bahçıvan — Stilize Karakter", tur: "3d", model: "Meshy 6", prompt: "Çiçek bahçesinde sulama yapan sevimli robot, stilize oranlar, sıcak renkler, görselden 3D.", kredi: 25, arac: "3D Stüdyo", gorsel: "/gercek/kesfet/robot-bahcivankling-3-0.webp", oran: "9:16" },
  { baslik: "Zırhlı Robot — Rig ve Yürüyüş", tur: "3d", model: "Meshy 6", prompt: "Gümüş zırhlı insansı robot, iskelet rig ve döngüsel yürüyüş animasyonu, 4K dokular.", kredi: 35, arac: "3D Stüdyo", gorsel: "/gercek/kesfet/3d-robot2.webp", oran: "16:9" },
];

/**
 * Ham satırlardan tam Uretim nesnelerini deterministik olarak türetir.
 * - id: "seed_{n}" (sabit, performance.now yok)
 * - olusturma: TABAN - index*SAAT → en yeni (index 0) en büyük timestamp,
 *   böylece [en yeni ... en eski] sıralaması korunur.
 * - gorselUrl: satırın kendi görseli; oran görselin gerçek boyutundan.
 */

export const SEED_URETIMLER: Uretim[] = SATIRLAR.map((s, i) => ({
  id: `seed_${i + 1}`,
  baslik: s.baslik,
  tur: s.tur,
  model: s.model,
  prompt: s.prompt,
  durum: "tamam",
  ilerleme: 100,
  gorselUrl: s.gorsel,
  olusturma: TABAN - i * SAAT,
  kredi: s.kredi,
  favori: s.favori,
  yayinda: s.yayinda,
  arac: s.arac,
  meta: { oran: s.oran, cozunurluk: s.tur === "gorsel" ? "2K" : "1080p", ...(s.sure ? { sure: s.sure } : {}) },
  saglayici: "simulasyon",
  gercek: false,
}));
