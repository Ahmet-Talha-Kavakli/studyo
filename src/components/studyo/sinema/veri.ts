/* Sinema stüdyosunun verisi: film kurulumu (tür, dönem, tempo, oyunculuk), kamera (gövde, lens,
   odak, diyafram, kadraj, hız), renk paleti, ışık ve istem derleyici. Arayüzden ayrı tutulur.
   Her listenin ilk öğesi "Oto"dur: modele bir şey dayatılmaz, sahneye göre karar verilir. */

import { HAREKETLER, hareketAdi, type Hareket } from "../video/veri";

const S = "/gercek/sinema";

/** Kurulumdaki bir seçenek: görsel, kısa açıklama ve modele giden İngilizce tarif. */
export type Secenek = { id: string; ad: string; not: string; en: string; gorsel?: string };
const OTO = (not = "Sahneye göre karar verilir"): Secenek => ({ id: "oto", ad: "Oto", not, en: "" });

/* ── Film kurulumu ───────────────────────────────────────────────────── */

export const TURLER: Secenek[] = [
  { id: "oto", ad: "Genel", not: "Türe bağlı değil", en: "", gorsel: `${S}/tur-Genel.webp` },
  { id: "aksiyon", ad: "Aksiyon", not: "Hız, enerji, hızlı kesmeler", en: "action film conventions, kinetic energy, high stakes", gorsel: `${S}/tur-Aksiyon.webp` },
  { id: "epik", ad: "Epik", not: "Ölçek, ihtişam, geniş planlar", en: "epic film conventions, grand scale, sweeping vistas", gorsel: `${S}/tur-Epik.webp` },
  { id: "dram", ad: "Dram", not: "Duygu, yakınlık, uzun planlar", en: "intimate drama conventions, emotional performances, lingering shots", gorsel: `${S}/tur-Dram.webp` },
  { id: "komedi", ad: "Komedi", not: "Sıcak, canlı, zamanlama", en: "comedy conventions, warm vibrant tone, comic timing", gorsel: `${S}/tur-Komedi.webp` },
  { id: "korku", ad: "Korku", not: "Karanlık, gerilim, sessizlik", en: "horror conventions, unsettling darkness, dread and tension", gorsel: `${S}/tur-Korku.webp` },
  { id: "noir", ad: "Kara film", not: "Gölge, gizem, sert ışık", en: "film noir conventions, mystery, hard shadows", gorsel: `${S}/tur-Noir.webp` },
];

/** Dönem: cetvelde soldan sağa geçmişe doğru. `renk` önizlemenin dönem tonu. */
export const DONEMLER: { id: string; ad: string; en: string; renk: [string, string, string]; filtre: string }[] = [
  { id: "oto", ad: "Oto", en: "", renk: ["#7dd3fc", "#f0abfc", "#fcd34d"], filtre: "none" },
  { id: "2020", ad: "2020'ler", en: "set in the 2020s, contemporary wardrobe and props", renk: ["#94a3b8", "#e2e8f0", "#38bdf8"], filtre: "none" },
  { id: "2000", ad: "2000'ler", en: "set in the 2000s, early digital era wardrobe and props", renk: ["#a3e635", "#22d3ee", "#c4b5fd"], filtre: "saturate(1.18) contrast(1.06) hue-rotate(-8deg)" },
  { id: "90", ad: "1990'lar", en: "set in the 1990s, period wardrobe and props, slightly faded color", renk: ["#2dd4bf", "#f472b6", "#fde68a"], filtre: "sepia(0.3) saturate(0.75) contrast(0.86) brightness(1.08)" },
  { id: "80", ad: "1980'ler", en: "set in the 1980s, period wardrobe and props, neon and analog textures", renk: ["#ec4899", "#8b5cf6", "#22d3ee"], filtre: "saturate(1.45) hue-rotate(-22deg) contrast(1.12)" },
  { id: "70", ad: "1970'ler", en: "set in the 1970s, period wardrobe and props, warm film look", renk: ["#d97706", "#a16207", "#f59e0b"], filtre: "sepia(0.6) saturate(1.25) contrast(0.94) brightness(1.03)" },
  { id: "60", ad: "1960'lar", en: "set in the 1960s, period wardrobe and props, period film look", renk: ["#fbbf24", "#78716c", "#fca5a5"], filtre: "grayscale(0.75) sepia(0.3) contrast(1.22) brightness(0.95)" },
];

export const TEMPOLAR: (Secenek & { renk?: [string, string, string] })[] = [
  { id: "oto", ad: "Oto", not: "Kurgu hızını sahne belirler", en: "", renk: ["#f472b6", "#be123c", "#fda4af"] },
  { id: "tek", ad: "Tek plan", not: "Kesmesiz, akan kamera", en: "a single continuous take with no cuts", gorsel: `${S}/sh-open.webp` },
  { id: "sakin", ad: "Sakin", not: "Uzun, nefes alan planlar", en: "calm montage pacing, long lingering shots", gorsel: `${S}/sh-dune.webp` },
  { id: "dinamik", ad: "Dinamik", not: "Ritmik kesmeler", en: "dynamic montage pacing, rhythmic cuts", gorsel: `${S}/kh-Kamera Takip.webp` },
  { id: "kaotik", ad: "Kaotik", not: "Hızlı, sert kesmeler", en: "chaotic montage pacing, rapid hard cuts", gorsel: `${S}/top-4k.webp` },
];

export const DUYGULAR: { id: string; ad: string; en: string; renk: string; gorsel: string }[] = [
  { id: "umut", ad: "Umut", en: "hopeful", renk: "#7dd3fc", gorsel: `${S}/stil-dogal-temiz.webp` },
  { id: "nese", ad: "Neşe", en: "joyful", renk: "#fcd34d", gorsel: `${S}/ps-happy.webp` },
  { id: "guven", ad: "Güven", en: "trusting, calm", renk: "#86efac", gorsel: `${S}/stil-pencere-isigi.webp` },
  { id: "saskinlik", ad: "Şaşkınlık", en: "surprised", renk: "#f0abfc", gorsel: `${S}/ps-eyes.webp` },
  { id: "korku", ad: "Korku", en: "afraid", renk: "#a5b4fc", gorsel: `${S}/ps-cry.webp` },
  { id: "huzun", ad: "Hüzün", en: "sad, melancholic", renk: "#93c5fd", gorsel: `${S}/ps-blacktears.webp` },
  { id: "ofke", ad: "Öfke", en: "angry", renk: "#fca5a5", gorsel: `${S}/ps-angry.webp` },
  { id: "tiksinti", ad: "İğrenme", en: "disgusted", renk: "#bef264", gorsel: `${S}/ps-zombie.webp` },
];
export const YOGUNLUK = ["Hafif", "Belirgin", "Yoğun"];

/* ── Kamera ──────────────────────────────────────────────────────────── */

export const GOVDELER: Secenek[] = [
  OTO(),
  { id: "dijital", ad: "Dijital sinema", not: "Temiz, keskin, nötr", en: "shot on a modern digital cinema camera, clean sensor, crisp natural detail", gorsel: `${S}/kamera-temiz-dijital.webp` },
  { id: "alexa", ad: "ARRI Alexa 35", not: "Filmimsi renk, geniş pozlama", en: "shot on ARRI Alexa 35, film-like color science, wide dynamic range, soft highlight roll-off", gorsel: `${S}/cark-kamera-arri-alexa.webp` },
  { id: "red", ad: "RED V-Raptor", not: "8K netlik, güçlü kontrast", en: "shot on RED V-Raptor 8K, razor-sharp detail, punchy contrast", gorsel: `${S}/cark-kamera-red.webp` },
  { id: "film35", ad: "35 mm film", not: "Kodak tonları, organik gren", en: "shot on 35mm film, Kodak Vision3 500T stock, organic film grain, gentle halation", gorsel: `${S}/kamera-i-nce-film.webp` },
  { id: "film16", ad: "16 mm film", not: "Belirgin gren, yumuşak doku", en: "shot on 16mm film, visible grain, soft texture, slightly lifted blacks", gorsel: `${S}/kamera-16mm-grenli.webp` },
  { id: "bolex", ad: "8 mm film", not: "Ev filmi, ışık sızıntısı", en: "vintage Super 8 home movie look, heavy grain, light leaks, gate weave", gorsel: `${S}/cark-kamera-bolex-16mm.webp` },
];

export const LENSLER: Secenek[] = [
  OTO(),
  { id: "keskin", ad: "Temiz keskin", not: "Kenardan kenara net", en: "modern cinema prime lens, clinically sharp, minimal distortion", gorsel: `${S}/kamera-klinik-keskin.webp` },
  { id: "anamorfik", ad: "Anamorfik", not: "Oval bokeh, yatay parlama", en: "anamorphic lens, oval bokeh, horizontal blue lens flares, widescreen feel", gorsel: `${S}/cark-lens-anamorfik.webp` },
  { id: "vanamorfik", ad: "Vintage anamorfik", not: "Eski cam, sıcak çizgi parlama", en: "vintage anamorphic lens, warm streak flares, soft edges, gentle distortion", gorsel: `${S}/kamera-anamorfik.webp` },
  { id: "vintage", ad: "Sıcak vintage", not: "Sıcak parlama, yumuşak kontrast", en: "warm vintage cinema lens, soft contrast, gentle vignette", gorsel: `${S}/kamera-vintage-parlama.webp` },
  { id: "halation", ad: "Halation vintage", not: "Işık taşması, rüya hissi", en: "vintage lens with strong halation and bloom around highlights, dreamy glow", gorsel: `${S}/cark-lens-vintage-sis.webp` },
  { id: "portre", ad: "Yumuşak portre", not: "Pürüzsüz ten, hafif ışıma", en: "soft portrait lens with subtle bloom and creamy skin rendering", gorsel: `${S}/kamera-yumusak-portre.webp` },
  { id: "makro", ad: "Makro", not: "Çok yakın, mikro detay", en: "macro lens, extreme close-up, micro detail, razor-thin focus plane", gorsel: `${S}/kamera-asiri-makro.webp` },
  { id: "balikgozu", ad: "Balıkgözü", not: "Güçlü bombe, geniş görüş", en: "fisheye lens, strong barrel distortion, ultra-wide field of view", gorsel: `${S}/cark-lens-balikgozu.webp` },
];

/** Odak uzaklığı: yatay görüş açısı (derece) ve kullanımı. mm 0 = oto. */
export const ODAKLAR: { mm: number; aci: number; ad: string; not: string; en: string }[] = [
  { mm: 0, aci: 60, ad: "Oto", not: "Sahneye göre", en: "" },
  { mm: 14, aci: 104, ad: "14 mm", not: "Ultra geniş · mekân", en: "14mm ultra-wide focal length, expansive space, dramatic perspective" },
  { mm: 24, aci: 74, ad: "24 mm", not: "Geniş · kuruluş planı", en: "24mm wide focal length, establishing perspective" },
  { mm: 35, aci: 54, ad: "35 mm", not: "Doğal · hikâye anlatımı", en: "35mm focal length, natural storytelling perspective" },
  { mm: 50, aci: 40, ad: "50 mm", not: "Göz gibi · orta plan", en: "50mm focal length, human-eye perspective" },
  { mm: 85, aci: 24, ad: "85 mm", not: "Portre · sıkıştırılmış", en: "85mm portrait focal length, flattering compression, isolated subject" },
  { mm: 135, aci: 15, ad: "135 mm", not: "Tele · uzaktan gözlem", en: "135mm telephoto focal length, strong compression, voyeuristic distance" },
];

export const DIYAFRAMLAR: Secenek[] = [
  OTO(),
  { id: "1.4", ad: "f/1.4 Tam açık", not: "Çok sığ alan, kremsi bokeh", en: "aperture f/1.4 wide open, very shallow depth of field, creamy bokeh", gorsel: `${S}/kamera-f-1-4-sig.webp` },
  { id: "2.8", ad: "f/2.8 Portre", not: "Arka plan yumuşak", en: "aperture f/2.8, shallow depth of field, soft background", gorsel: `${S}/kamera-f-2-8-portre.webp` },
  { id: "4", ad: "f/4 Orta", not: "Dengeli, çevre okunur", en: "aperture f/4, moderate depth of field", gorsel: `${S}/kamera-f-5-6-dengeli.webp` },
  { id: "11", ad: "f/11 Derin odak", not: "Her şey net", en: "aperture f/11, deep focus, everything sharp from foreground to background", gorsel: `${S}/kamera-f-11-derin-odak.webp` },
];

/** Plan boyu: `kadraj` önizleme şemasında figürün kadrajı ne kadar doldurduğu (1 = boy boy). */
export const PLANLAR: { id: string; ad: string; kisa: string; not: string; en: string; kadraj: number; gorsel: string }[] = [
  { id: "oto", ad: "Oto", kisa: "", not: "Plan boyunu sahne seçer", en: "", kadraj: 0, gorsel: `${S}/stil-oto.webp` },
  { id: "cokgenis", ad: "Çok geniş", kisa: "ÇGP", not: "Mekân her şey, insan küçük", en: "extreme wide shot, tiny figure in a vast environment", kadraj: 0.22, gorsel: `${S}/sh-hero.webp` },
  { id: "genis", ad: "Geniş", kisa: "GP", not: "Boy boy figür ve çevresi", en: "wide shot, full figure with surroundings", kadraj: 0.55, gorsel: `${S}/stil-kontre-jur.webp` },
  { id: "orta", ad: "Orta", kisa: "OP", not: "Belden yukarı", en: "medium shot, framed from the waist up", kadraj: 1.25, gorsel: `${S}/stil-yumusak-capraz.webp` },
  { id: "yakin", ad: "Yakın", kisa: "YP", not: "Omuz ve yüz", en: "close-up shot on the face and shoulders", kadraj: 2.3, gorsel: `${S}/stil-tek-cekim.webp` },
  { id: "cokyakin", ad: "Çok yakın", kisa: "ÇYP", not: "Yalnız gözler, detay", en: "extreme close-up on the eyes", kadraj: 4.2, gorsel: `${S}/ps-eyes.webp` },
];
export const ACILAR: { id: string; ad: string; not: string; en: string; gorsel: string }[] = [
  { id: "oto", ad: "Oto", not: "Açıyı sahne seçer", en: "", gorsel: `${S}/stil-sabit-tripod.webp` },
  { id: "goz", ad: "Göz hizası", not: "Nötr, doğal", en: "eye-level camera angle", gorsel: `${S}/stil-oto.webp` },
  { id: "alcak", ad: "Alttan", not: "Güçlü, heybetli", en: "low-angle shot looking up, heroic", gorsel: `${S}/stil-gumus-kromat.webp` },
  { id: "ust", ad: "Üstten", not: "Küçük, kırılgan", en: "high-angle shot looking down", gorsel: `${S}/stil-tepeden-dusen.webp` },
  { id: "kus", ad: "Kuşbakışı", not: "Tam tepeden", en: "top-down bird's-eye view", gorsel: `${S}/ps-overhead.webp` },
  { id: "zemin", ad: "Zemin seviyesi", not: "Yerden, dramatik", en: "ground-level camera, low to the floor", gorsel: `${S}/ps-tiltup.webp` },
  { id: "omuz", ad: "Omuz üstü", not: "Konuşma, karşılık", en: "over-the-shoulder shot", gorsel: `${S}/stil-sert-nokta.webp` },
  { id: "pov", ad: "Öznel (POV)", not: "Karakterin gözünden", en: "first-person POV shot", gorsel: `${S}/ps-mirror.webp` },
  { id: "hollanda", ad: "Yatık", not: "Gerilim, tedirginlik", en: "dutch angle, tilted horizon", gorsel: `${S}/ps-dutch.webp` },
];

/** Hız eğrisi: 5 düğüm (0..1, yüksek = hızlı). */
export const HIZ_EGRILERI: { id: string; ad: string; not: string; en: string; egri: number[]; gorsel: string }[] = [
  { id: "oto", ad: "Oto", not: "Gerçek zamanlı", en: "", egri: [0.5, 0.5, 0.5, 0.5, 0.5], gorsel: `${S}/ps-static.webp` },
  { id: "agir", ad: "Ağır çekim", not: "Baştan sona yavaş", en: "in dramatic slow motion", egri: [0.22, 0.22, 0.22, 0.22, 0.22], gorsel: `${S}/ps-pool.webp` },
  { id: "hizlan", ad: "Hızlanma", not: "Yavaş başlar, hızlanır", en: "speed ramp from slow motion to fast", egri: [0.15, 0.3, 0.5, 0.72, 0.92], gorsel: `${S}/ps-sprint.webp` },
  { id: "flasgiris", ad: "Flaş giriş", not: "Hızlı girer, yavaşlar", en: "fast entry then decelerating into slow motion", egri: [0.95, 0.55, 0.3, 0.25, 0.25], gorsel: `${S}/ps-car.webp` },
  { id: "flascikis", ad: "Flaş çıkış", not: "Yavaş başlar, hızla çıkar", en: "slow motion then a sudden fast exit", egri: [0.25, 0.25, 0.3, 0.55, 0.95], gorsel: `${S}/ps-skate.webp` },
  { id: "mermi", ad: "Mermi zamanı", not: "Ortada zaman durur", en: "bullet time: action freezes mid-moment then resumes", egri: [0.65, 0.4, 0.06, 0.4, 0.65], gorsel: `${S}/ps-bullet.webp` },
  { id: "darbe", ad: "Darbe anı", not: "Çarpışmada yavaşlar", en: "real speed, slowing down hard at the moment of impact, then back to speed", egri: [0.7, 0.75, 0.12, 0.55, 0.7], gorsel: `${S}/ps-facepunch.webp` },
];

/* ── Renk paleti ─────────────────────────────────────────────────────── */

/** Film karelerinden renk paletleri; şerit renkleri görselden tarayıcıda çıkarılır. */
export const PALETLER: Secenek[] = [
  { id: "oto", ad: "Oto", not: "Renk düzenini sahne belirler", en: "" },
  { id: "kizil-safak", ad: "Kızıl Şafak", not: "Turuncu gökyüzü, mor gölge", en: "color grade: burnt orange sky, deep violet shadows, warm highlights", gorsel: `${S}/sh-hero.webp` },
  { id: "neon-yagmur", ad: "Gece Yarısı Neon Yağmuru", not: "Macenta, camgöbeği, ıslak asfalt", en: "color grade: magenta and cyan neon, wet asphalt reflections, crushed blacks", gorsel: `${S}/sh-street.webp` },
  { id: "kum-firtina", ad: "Kum ve Bakır", not: "Bakır, kum, sıcak toz", en: "color grade: copper and sand tones, warm dusty haze", gorsel: `${S}/sh-dune.webp` },
  { id: "sisli-vadi", ad: "Sisli Vadi Sabahı", not: "Pastel şafak, gümüş sis", en: "color grade: soft pastel dawn, silver mist, gentle contrast", gorsel: `${S}/sh-open.webp` },
  { id: "dijital-sehir", ad: "Kod Şehrinde Hayalet", not: "Elektrik mavisi, soğuk metal", en: "color grade: electric blue and cold steel, futuristic city glow", gorsel: `${S}/sh-city.webp` },
  { id: "gerilim", ad: "Sorgu Odası", not: "Yeşilimsi gölge, tek sıcak lamba", en: "color grade: sickly green shadows, single warm practical lamp", gorsel: `${S}/sh-tension.webp` },
  { id: "kurt", ad: "Fırtınalı Tepe", not: "Çelik mavisi, kar beyazı", en: "color grade: steel blue, snow white, cold desaturated", gorsel: `${S}/cs-hero-kokboru.webp` },
  { id: "orman", ad: "Zümrüt Pusu", not: "Koyu yeşil, altın ışık hüzmesi", en: "color grade: deep emerald greens, golden light shafts", gorsel: `${S}/cs-hero-avci.webp` },
  { id: "makine", ad: "Sessiz Makine", not: "Turkuaz parıltı, koyu lacivert", en: "color grade: turquoise glow over deep navy, sci-fi atmosphere", gorsel: `${S}/cs-hero-sessiz.webp` },
  { id: "patlama", ad: "Otoban Hesaplaşması", not: "Ateş turuncusu, duman grisi", en: "color grade: fire orange against smoke grey, high contrast blockbuster", gorsel: `${S}/top-4k.webp` },
  { id: "gotik", ad: "Gotik Sahil", not: "Kurşuni deniz, soluk ten", en: "color grade: leaden sea greys, pale skin, moody low saturation", gorsel: `${S}/top-gothic.webp` },
  { id: "kadife", ad: "Pembe Kadife", not: "Sıcak pembe, gece ışıkları", en: "color grade: warm pink and red city lights, romantic night", gorsel: `${S}/top-nala.webp` },
  { id: "bozkir", ad: "Ufka İki Gün", not: "Altın bozkır, kızıl güneş", en: "color grade: golden steppe, crimson sunset, epic warmth", gorsel: `${S}/top-kokboru.webp` },
  { id: "anime", ad: "Neon Anime", not: "Mor, mavi, canlı ışık", en: "color grade: vivid purple and blue anime city lights", gorsel: `${S}/top-anime.webp` },
  { id: "kara-film", ad: "Statik Öğle", not: "Siyah beyaz, yüksek kontrast", en: "black and white, high contrast monochrome grade", gorsel: `${S}/tur-Noir.webp` },
  { id: "sicak-ev", ad: "Yağmurdan Sonra Sabah", not: "Bal tonu, yumuşak gölge", en: "color grade: honey warm interior tones, soft shadows", gorsel: `${S}/tur-Dram.webp` },
];

/* ── Işık ────────────────────────────────────────────────────────────── */

export const ISIKLAR: Secenek[] = [
  { id: "oto", ad: "Oto", not: "Işığı sahne belirler", en: "" },
  { id: "siluet", ad: "Siluet", not: "Arka ışık, karanlık figür", en: "silhouette lighting, subject backlit against a bright sky", gorsel: `${S}/sh-hero.webp` },
  { id: "pratik", ad: "Pratik ışıklar", not: "Sahnedeki lamba, tabela, ekran", en: "motivated practical lighting from lamps, signs and screens in the scene", gorsel: `${S}/kh-Kamera Takip.webp` },
  { id: "pencere", ad: "Pencere", not: "Doğal, yumuşak gün ışığı", en: "soft natural window light", gorsel: `${S}/stil-pencere-isigi.webp` },
  { id: "tepe", ad: "Tepeden düşen", not: "Sert, dramatik düşüş", en: "hard overhead light falling from above, deep eye shadows", gorsel: `${S}/cark-isik-tepe-dusus.webp` },
  { id: "kontre", ad: "Kontre", not: "Arkadan ışık, parlak kenar", en: "contre-jour backlight with glowing rim light", gorsel: `${S}/cark-isik-contre-jour.webp` },
  { id: "capraz", ad: "Yumuşak çapraz", not: "Rembrandt, sıcak gölge", en: "soft cross key light, Rembrandt shadows", gorsel: `${S}/cark-isik-yumusak-capraz.webp` },
  { id: "altin", ad: "Altın saat", not: "Alçak, sıcak güneş", en: "golden hour sunlight, low warm sun, long shadows", gorsel: `${S}/cark-isik-altin-saat.webp` },
  { id: "neon", ad: "Neon", not: "Renkli gece ışıkları", en: "colorful neon lighting, night atmosphere", gorsel: `${S}/cark-isik-neon.webp` },
  { id: "sert", ad: "Sert nokta", not: "Keskin gölge, noir", en: "hard spot light, crisp shadows, high contrast", gorsel: `${S}/stil-sert-nokta.webp` },
];

/** Özel ışık kaynağı: yön (küre üzerinde açı), renk, parlaklık ve yumuşaklık. */
export type IsikKaynak = { renk: string; parlaklik: number; yumusak: number; yatay: number; dikey: number };
export const YON_KISAYOL: { ad: string; yatay: number; dikey: number }[] = [
  { ad: "Üst", yatay: 0, dikey: 80 }, { ad: "Ön", yatay: 0, dikey: 10 }, { ad: "Sağ", yatay: 90, dikey: 10 },
  { ad: "Sol", yatay: -90, dikey: 10 }, { ad: "Arka", yatay: 180, dikey: 15 }, { ad: "Alt", yatay: 0, dikey: -70 },
];
export function yonAdi(y: number, d: number): string {
  if (d > 55) return "from directly above";
  if (d < -45) return "from below";
  const a = ((y % 360) + 540) % 360 - 180;
  const yatay = Math.abs(a) < 30 ? "from the front" : Math.abs(a) > 140 ? "from behind" : a > 0 ? "from the right" : "from the left";
  return d > 25 ? `${yatay}, high` : yatay;
}
export function isikTarifi(l: IsikKaynak[]): string {
  return l.map((x, i) => `${i === 0 ? "key light" : i === 1 ? "fill light" : "accent light"} ${yonAdi(x.yatay, x.dikey)}, color ${x.renk}, ${x.parlaklik}% intensity, ${x.yumusak > 60 ? "soft diffused" : x.yumusak < 30 ? "hard" : "medium-soft"}`).join("; ");
}

/* ── Kurulum ─────────────────────────────────────────────────────────── */

export type Kurulum = {
  tur: string; donem: string; tempo: string; duygu: string; yogunluk: number;
  govde: string; lens: string; odak: number; diyafram: string; plan: string; aci: string; hiz: string;
  palet: string; paletOzel?: string[];
  isik: string; isikOzel?: IsikKaynak[];
};
export const VARSAYILAN_KURULUM: Kurulum = {
  tur: "oto", donem: "oto", tempo: "oto", duygu: "", yogunluk: 2,
  govde: "oto", lens: "oto", odak: 0, diyafram: "oto", plan: "oto", aci: "oto", hiz: "oto",
  palet: "oto", isik: "oto",
};
/** Kayıtlı (kısmi/eski) kurulumu tam kuruluma tamamlar; bilinmeyen değerler otoya döner. */
export function kurulumTamamla(k?: Partial<Kurulum> | Record<string, unknown> | null): Kurulum {
  const y = { ...VARSAYILAN_KURULUM, ...((k ?? {}) as Partial<Kurulum>) };
  const var_ = (l: { id: string }[], id: string) => (l.some((x) => x.id === id) ? id : "oto");
  return {
    ...y, tur: var_(TURLER, y.tur), donem: var_(DONEMLER, y.donem), tempo: var_(TEMPOLAR, y.tempo), govde: var_(GOVDELER, y.govde), lens: var_(LENSLER, y.lens),
    diyafram: var_(DIYAFRAMLAR, y.diyafram), plan: var_(PLANLAR, y.plan), aci: var_(ACILAR, y.aci), hiz: var_(HIZ_EGRILERI, y.hiz),
    palet: y.palet === "ozel" && y.paletOzel?.length ? "ozel" : var_(PALETLER, y.palet), isik: y.isik === "ozel" && y.isikOzel?.length ? "ozel" : var_(ISIKLAR, y.isik),
    odak: ODAKLAR.some((o) => o.mm === y.odak) ? y.odak : 0,
  };
}

export const bul = <T extends { id: string }>(l: T[], id: string): T => l.find((x) => x.id === id) ?? l[0];
export const odakBul = (mm: number) => ODAKLAR.find((o) => o.mm === mm) ?? ODAKLAR[0];

/** Film kurulumu kartının değeri. */
export function filmOzet(k: Kurulum): string {
  const p = [k.tur !== "oto" ? bul(TURLER, k.tur).ad : "", k.donem !== "oto" ? bul(DONEMLER, k.donem).ad : "", k.tempo !== "oto" ? bul(TEMPOLAR, k.tempo).ad : "", DUYGULAR.find((d) => d.id === k.duygu)?.ad ?? ""].filter(Boolean);
  return p.length ? p.join(" · ") : "Oto";
}
/** Kamera kartının değeri. */
export function kameraOzet(k: Kurulum): string {
  const p = [
    k.govde !== "oto" ? bul(GOVDELER, k.govde).ad.replace(/^ARRI /, "").replace(/ V-Raptor$/, "") : "",
    k.lens !== "oto" ? bul(LENSLER, k.lens).ad : "", k.odak ? `${k.odak} mm` : "", k.diyafram !== "oto" ? bul(DIYAFRAMLAR, k.diyafram).ad.split(" ")[0] : "",
    k.plan !== "oto" ? bul(PLANLAR, k.plan).ad + " plan" : "", k.aci !== "oto" ? bul(ACILAR, k.aci).ad : "", k.hiz !== "oto" ? bul(HIZ_EGRILERI, k.hiz).ad : "",
  ].filter(Boolean);
  return p.length ? p.join(" · ") : "Oto";
}
export const paletAdi = (k: Kurulum) => (k.palet === "ozel" ? "Özel palet" : bul(PALETLER, k.palet).ad);
export const isikAdi = (k: Kurulum) => (k.isik === "ozel" ? `Özel · ${k.isikOzel?.length ?? 1} ışık` : bul(ISIKLAR, k.isik).ad);

/** Kurulumu modele giden tek cümleye çevirir (oto parçalar atlanır). */
export function kurulumTarifi(k: Kurulum, o: { video?: boolean } = {}): string {
  const duygu = DUYGULAR.find((d) => d.id === k.duygu);
  return [
    bul(PLANLAR, k.plan).en, bul(ACILAR, k.aci).en,
    bul(TURLER, k.tur).en, bul(DONEMLER, k.donem).en,
    bul(GOVDELER, k.govde).en, bul(LENSLER, k.lens).en, odakBul(k.odak).en, bul(DIYAFRAMLAR, k.diyafram).en,
    k.isik === "ozel" && k.isikOzel?.length ? `lighting: ${isikTarifi(k.isikOzel)}` : bul(ISIKLAR, k.isik).en,
    k.palet === "ozel" && k.paletOzel?.length ? `color palette limited to ${k.paletOzel.join(", ")}` : bul(PALETLER, k.palet).en,
    duygu ? `performance: ${["subtly", "clearly", "intensely"][k.yogunluk - 1] ?? "clearly"} ${duygu.en}` : "",
    o.video ? bul(TEMPOLAR, k.tempo).en : "",
    o.video ? bul(HIZ_EGRILERI, k.hiz).en : "",
  ].filter(Boolean).join(", ");
}
/** Görüntüleyici bilgi tablosu için satırlar (yalnız seçili olanlar; hepsi otoysa boş). */
export function kurulumSatirlari(k: Kurulum): [string, string][] {
  const d = DUYGULAR.find((x) => x.id === k.duygu);
  const l: [string, string, boolean][] = [
    ["Tür", bul(TURLER, k.tur).ad, k.tur !== "oto"], ["Dönem", bul(DONEMLER, k.donem).ad, k.donem !== "oto"], ["Tempo", bul(TEMPOLAR, k.tempo).ad, k.tempo !== "oto"],
    ["Oyunculuk", d ? `${d.ad} · ${YOGUNLUK[k.yogunluk - 1]}` : "", !!d],
    ["Kamera", bul(GOVDELER, k.govde).ad, k.govde !== "oto"], ["Lens", bul(LENSLER, k.lens).ad, k.lens !== "oto"], ["Odak", odakBul(k.odak).ad, !!k.odak],
    ["Diyafram", bul(DIYAFRAMLAR, k.diyafram).ad, k.diyafram !== "oto"], ["Plan", bul(PLANLAR, k.plan).ad, k.plan !== "oto"], ["Açı", bul(ACILAR, k.aci).ad, k.aci !== "oto"],
    ["Hız", bul(HIZ_EGRILERI, k.hiz).ad, k.hiz !== "oto"], ["Renk", paletAdi(k), k.palet !== "oto"], ["Işık", isikAdi(k), k.isik !== "oto"],
  ];
  return l.filter((x) => x[2]).map(([a, b]) => [a, b]);
}

/* ── Hareketler: istemde # etiketi ───────────────────────────────────── */

/** "DOLLY IN" → "#DollyIn". Sıra önemlidir: istemdeki sırayla uygulanır. */
export const hareketEtiketi = (h: Hareket) => `#${hareketAdi(h.ad).replace(/[^\p{L}\p{N}]/gu, "")}`;
const ETIKET_HARITA = new Map(HAREKETLER.map((h) => [hareketEtiketi(h).toLocaleLowerCase("tr"), h]));
/** İstemdeki # etiketlerini sırayla hareketlere çözer; tanınmayanlar metinde kalır. */
export function istemHareketleri(istem: string): { hareketler: Hareket[]; temiz: string } {
  const hareketler: Hareket[] = [];
  const temiz = istem.replace(/#[\p{L}\p{N}]+/gu, (m) => {
    const h = ETIKET_HARITA.get(m.toLocaleLowerCase("tr"));
    if (!h) return m;
    if (!hareketler.includes(h)) hareketler.push(h);
    return "";
  }).replace(/\s{2,}/g, " ").trim();
  return { hareketler, temiz };
}

/* ── Anahtar kare modelleri ve örnekler ──────────────────────────────── */

export const KARE_MODELLERI = ["Vayra Ruh Sinema", "Nano Banana Pro", "Nano Banana 2.1", "Seedream 5.0 Pro", "GPT Image 2", "FLUX.2 Pro", "Kling O3"];
export const KARE_ORANLAR = ["21:9", "16:9", "4:3", "1:1", "4:5", "9:16"];

/** Ana sayfa karuseli ve topluluk vitrini: istem ve kurulumuyla tekrarlanabilir örnekler. */
export const VITRIN: { baslik: string; yazar: string; gorsel: string; istem: string; k: Partial<Kurulum> }[] = [
  { baslik: "Kök Börü", yazar: "steppe", gorsel: `${S}/top-kokboru.webp`, istem: "Gün batımında bozkırda atıyla ilerleyen bir savaşçı, rüzgârda dalgalanan otlar", k: { tur: "epik", govde: "alexa", lens: "anamorfik", odak: 24, palet: "bozkir", isik: "altin" } },
  { baslik: "Gece Yarısı Dedektifi", yazar: "noirframe", gorsel: `${S}/sh-street.webp`, istem: "Neon tabelaların ıslak asfalta yansıdığı sokakta bekleyen trençkotlu dedektif", k: { tur: "noir", govde: "red", lens: "anamorfik", odak: 35, diyafram: "1.4", palet: "neon-yagmur", isik: "pratik" } },
  { baslik: "Avcının Masalı", yazar: "Vayra Studio", gorsel: `${S}/cs-hero-avci.webp`, istem: "Sisli ormanda ışık hüzmeleri arasında yayını geren genç bir avcı", k: { tur: "epik", govde: "film35", lens: "vintage", odak: 50, palet: "orman", isik: "kontre" } },
  { baslik: "Otoban Hesaplaşması", yazar: "cinegrid", gorsel: `${S}/top-4k.webp`, istem: "Arkasında patlayan bir tankerle kameraya doğru koşan kadın asker", k: { tur: "aksiyon", govde: "alexa", lens: "anamorfik", odak: 24, palet: "patlama", isik: "kontre", tempo: "kaotik" } },
  { baslik: "Sessiz Makine", yazar: "Vayra Studio", gorsel: `${S}/cs-hero-sessiz.webp`, istem: "Karanlık bir salonun ortasında yavaşça uyanan dev bir makine, turkuaz ışıklar", k: { tur: "epik", govde: "dijital", lens: "keskin", odak: 14, palet: "makine", isik: "pratik" } },
  { baslik: "Gotik Sahil", yazar: "noirframe", gorsel: `${S}/top-gothic.webp`, istem: "Fırtınalı bir kayalıkta denize bakan siyah pelerinli kadın", k: { tur: "dram", govde: "film16", lens: "halation", odak: 85, palet: "gotik", isik: "siluet" } },
];

/** Topluluk sayfasının ek kareleri (vitrinle birlikte gösterilir). */
export const TOPLULUK: { baslik: string; yazar: string; gorsel: string; istem: string; k: Partial<Kurulum> }[] = [
  ...VITRIN,
  { baslik: "Kum Tepeleri", yazar: "dunescape", gorsel: `${S}/sh-dune.webp`, istem: "Kum tepelerinin arasında tek başına ilerleyen kervan, sıcak hava dalgalanıyor", k: { tur: "epik", odak: 135, palet: "kum-firtina", isik: "altin" } },
  { baslik: "Sorgu Odası", yazar: "noirframe", gorsel: `${S}/sh-tension.webp`, istem: "Tek lambanın altında masaya eğilmiş yorgun bir adam, dumanın içinden süzülen ışık", k: { tur: "noir", govde: "film35", lens: "vintage", palet: "gerilim", isik: "tepe" } },
  { baslik: "Sisli Vadi", yazar: "Vayra Studio", gorsel: `${S}/sh-open.webp`, istem: "Şafakta sisle dolu vadide kıvrılan nehir, drone yükseliyor", k: { govde: "dijital", odak: 14, palet: "sisli-vadi", tempo: "tek" } },
  { baslik: "Kod Şehri", yazar: "loopvisuals", gorsel: `${S}/sh-city.webp`, istem: "Gece yukarıdan görülen fütüristik şehir, uçan araçların ışık izleri", k: { tur: "aksiyon", govde: "red", odak: 24, palet: "dijital-sehir", isik: "neon" } },
  { baslik: "Fırtınalı Tepe", yazar: "steppe", gorsel: `${S}/cs-hero-kokboru.webp`, istem: "Fırtınalı karlı tepede uluyan beyaz kurt, kar savruluyor", k: { tur: "epik", lens: "anamorfik", odak: 85, palet: "kurt", isik: "kontre" } },
  { baslik: "Neon Anime", yazar: "nalastudio", gorsel: `${S}/top-anime.webp`, istem: "Neon ışıklı çatıda şehre bakan anime karakteri, rüzgârda saçları", k: { palet: "anime", isik: "neon" } },
];
