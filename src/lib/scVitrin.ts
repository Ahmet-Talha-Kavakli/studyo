import { slugla } from "@/lib/scMarket";

/* ══════════════════════════════════════════════════════════════════
   SUPERCOMPUTER VİTRİNİ — Uygulamalar + Oyunlar ortak veri katmanı.
   Referans: referanslar/uygulamalar (36 ekran) + referanslar/oyunlar (23 ekran).

   İki farklı kart tipi var (referansta net ayrılıyor):
     • topluluk kartı  → 16:9 kapak + "N görüntülenme · N kredi"
     • Vayra kartı     → kare kapak + tek satır ad + doğrulanmış rozeti (meta YOK)
   Oyun kartı ise: 16:10 kapak + kare ikon + ad + "@yazar · N oynanma".

   Tümü SSR güvenli: Date.now / Math.random YOK.
   ══════════════════════════════════════════════════════════════════ */

/* ─────────────────────────── UYGULAMALAR ─────────────────────────── */

export type SCUygulama = {
  ad: string;
  /** Kapak üstündeki büyük tipografi (referansta her kapakta var). */
  kapakYazi: string;
  kapakAlt?: string;
  goruntulenme: number;
  /** Referansta Space92 kartında kredi satırı YOK — bu yüzden opsiyonel. */
  kredi?: number;
  tohum: string;
};

export type SCUygulamaBolum = {
  ad: string;
  ikon: "alev" | "megafon" | "paylas" | "kamera" | "yuz" | "canta" | "fotograf";
  uygulamalar: SCUygulama[];
};

/** "All apps" sekmesi — topluluk uygulamaları, 8 bölüm × 4 kart. */
export const SC_UYGULAMA_BOLUMLERI: SCUygulamaBolum[] = [
  {
    ad: "Viral Trendler", ikon: "alev",
    uygulamalar: [
      { ad: "Pati Kardeşler", kapakYazi: "PATİ KARDEŞLER", kapakAlt: "Kedi ustalarına meydan oku", goruntulenme: 422, kredi: 364, tohum: "uyg-pati" },
      { ad: "DV Günlük", kapakYazi: "DV GÜNLÜK", kapakAlt: "Ev videosu estetiği", goruntulenme: 17900, kredi: 45400, tohum: "uyg-dv" },
      { ad: "Portal Kurucu — hayali dünyaya çevir", kapakYazi: "KENDİ PORTALINI KUR", kapakAlt: "Hayal gücünü sürükleyici dünyalara çevir", goruntulenme: 331, kredi: 365, tohum: "uyg-portal" },
      { ad: "Viral Radar", kapakYazi: "VİRAL RADAR", goruntulenme: 611, kredi: 1098, tohum: "uyg-radar" },
    ],
  },
  {
    ad: "Reklam ve Pazarlama", ikon: "megafon",
    uygulamalar: [
      { ad: "EmlakForge AI", kapakYazi: "EMLAKFORGE AI", goruntulenme: 3, kredi: 36, tohum: "uyg-emlak" },
      { ad: "Girişim OS — dakikalar içinde girişim", kapakYazi: "GİRİŞİM OS", goruntulenme: 102, kredi: 119, tohum: "uyg-giris" },
      { ad: "Tasarım Ustası", kapakYazi: "Tasarım Ustası", goruntulenme: 158, kredi: 134, tohum: "uyg-tasarim" },
      { ad: "Kanca Stüdyo", kapakYazi: "KANCA STÜDYO", goruntulenme: 16300, kredi: 66200, tohum: "uyg-kanca" },
    ],
  },
  {
    ad: "Kullanıcı İçeriği ve Sosyal", ikon: "paylas",
    uygulamalar: [
      { ad: "BEATCUT — Tutan kesmeler", kapakYazi: "BEATCUT", goruntulenme: 28, kredi: 216, tohum: "uyg-beat" },
      { ad: "Morf Geçiş Stüdyosu", kapakYazi: "MORF GEÇİŞ STÜDYOSU", kapakAlt: "Geçişleri vayra.ai'da üret", goruntulenme: 21, kredi: 270, tohum: "uyg-morf" },
      { ad: "GIFy", kapakYazi: "GIFy", goruntulenme: 27, kredi: 90, tohum: "uyg-gify" },
      { ad: "AnlatıcıForge — kalıcı anlatıcı", kapakYazi: "ANLATICIFORGE", goruntulenme: 18, kredi: 82, tohum: "uyg-anlatici" },
    ],
  },
  {
    ad: "Sinematik", ikon: "kamera",
    uygulamalar: [
      { ad: "SEVDİĞİME…", kapakYazi: "SEVDİĞİME…", kapakAlt: "Sevdiğin biri için bir tane yap.", goruntulenme: 14, kredi: 135, tohum: "uyg-sevdi" },
      { ad: "Flowtoon", kapakYazi: "FLOWTOON", goruntulenme: 74, kredi: 530, tohum: "uyg-flow" },
      { ad: "LOOKPRINT — Sinematik bakış", kapakYazi: "LOOKPRINT", kapakAlt: "Bakışı bul. Kendine mal et.", goruntulenme: 2, kredi: 23, tohum: "uyg-look" },
      { ad: "Prompt DNA — Sinematik evrim", kapakYazi: "PROMPT DNA", kapakAlt: "Bir kareyi filme dönüştür", goruntulenme: 6, kredi: 23, tohum: "uyg-dna" },
    ],
  },
  {
    ad: "Karakterler ve Avatarlar", ikon: "yuz",
    uygulamalar: [
      { ad: "ALTER EGO — Rulet", kapakYazi: "ALTER EGO — RULET", goruntulenme: 10, kredi: 525, tohum: "uyg-alter" },
      { ad: "Karakter Sayfası", kapakYazi: "KARAKTER SAYFASI KURUCU", goruntulenme: 12000, kredi: 8813, tohum: "uyg-karakter" },
      { ad: "Zaman Makinesi Ben", kapakYazi: "ZAMAN MAKİNESİ BEN", goruntulenme: 3, kredi: 2, tohum: "uyg-zaman" },
      { ad: "KARAKTERSHEET", kapakYazi: "KARAKTERSHEET", goruntulenme: 3914, kredi: 3443, tohum: "uyg-ksheet" },
    ],
  },
  {
    ad: "Ürün ve E-ticaret", ikon: "canta",
    uygulamalar: [
      { ad: "Mokio — Mockup Atölyesi", kapakYazi: "Mokio", goruntulenme: 40, kredi: 40, tohum: "uyg-mokio" },
      // Referansta bu kartta kredi satırı YOK — bilinçli olarak boş.
      { ad: "Space92 · Giyim Koleksiyonu", kapakYazi: "Space92", goruntulenme: 209, tohum: "uyg-space" },
      { ad: "İlan Sineması", kapakYazi: "İlan SİNEMASI", kapakAlt: "Her ilandan sinematik ev turu", goruntulenme: 596, kredi: 6869, tohum: "uyg-ilan" },
      { ad: "SellCast AI — İlan üret", kapakYazi: "SellCast AI", goruntulenme: 246, kredi: 464, tohum: "uyg-sell" },
    ],
  },
  {
    ad: "Portre ve Yaşam Tarzı", ikon: "fotograf",
    uygulamalar: [
      { ad: "GerçekTen", kapakYazi: "gerçekten", kapakAlt: "Gerçek cilt dokusu, değişmemiş sen", goruntulenme: 10, kredi: 4, tohum: "uyg-gercek" },
      { ad: "Bir Yerlerde", kapakYazi: "BİR YERLERDE?", goruntulenme: 8299, kredi: 52700, tohum: "uyg-biryer" },
      { ad: "Deneme Kabini", kapakYazi: "DENEME KABİNİ", goruntulenme: 4162, kredi: 1918, tohum: "uyg-kabin" },
      { ad: "YaşLens — 10 yılda hayatın", kapakYazi: "YAŞ LENS", goruntulenme: 116, kredi: 506, tohum: "uyg-yas" },
    ],
  },
  {
    ad: "Diğer", ikon: "alev",
    uygulamalar: [
      { ad: "Oluş — Sıradakini gör", kapakYazi: "OLUŞ", goruntulenme: 3, kredi: 144, tohum: "uyg-olus" },
      { ad: "Kaos Seviyesi — Tırmanış", kapakYazi: "KAOS SEVİYESİ", goruntulenme: 16, kredi: 459, tohum: "uyg-kaos" },
      { ad: "KaderVizyon — AI Falcı", kapakYazi: "KaderVizyon 命影", goruntulenme: 95, kredi: 2000, tohum: "uyg-kader" },
      { ad: "SIKICIDEĞİL", kapakYazi: "SIKICIDEĞİL", goruntulenme: 47, kredi: 828, tohum: "uyg-sikici" },
    ],
  },
];

/** "Vayra uygulamaları" sekmesi — resmi, doğrulanmış; meta satırı YOK. */
export type SCVayraUygulama = { ad: string; tohum: string };
export type SCVayraBolum = {
  ad: string;
  ikon: SCUygulamaBolum["ikon"];
  uygulamalar: SCVayraUygulama[];
};

const vu = (adlar: string[], on: string): SCVayraUygulama[] =>
  adlar.map((ad, i) => ({ ad, tohum: `${on}-${i}` }));

export const SC_VAYRA_BOLUMLERI: SCVayraBolum[] = [
  {
    ad: "Profesyonel", ikon: "megafon",
    uygulamalar: vu(["Virallik Tahmini", "Görsel Genişlet", "Açılar 2.0", "Çekimler", "Geçişler",
      "Renk Derecelendirme", "Sırada Ne Var?", "Kamera Arkası", "Yakınlaştırmalar"], "vay-pro"),
  },
  {
    ad: "İyileştir ve Stille", ikon: "paylas",
    uygulamalar: vu(["Cilt İyileştirici", "AI Stilist", "Yeniden Işıklandır", "Kıyafet Değiştir",
      "Stil Yakala", "Kıyafet Otomatı", "Simli Sticker", "Kıyafet Çekimi"], "vay-stil"),
  },
  {
    ad: "Yüz ve Kimlik", ikon: "yuz",
    uygulamalar: vu(["Yüz Değiştir", "Vesikalık Üretici", "Karakter Değiştir 2.0", "Yeniden Rol",
      "Video Yüz Değiştir", "Ticari Yüzler"], "vay-yuz"),
  },
  {
    ad: "Video Düzenleme", ikon: "kamera",
    uygulamalar: vu(["KlipKes", "Şehir Kesitleri", "Video Arka Planı Değiştir", "Parçalama",
      "Japon Şovu", "Sticker Eşleşme Kesmesi"], "vay-video"),
  },
  {
    ad: "Reklam ve Ürünler", ikon: "canta",
    uygulamalar: vu(["Tıkla Reklam Ol", "Billboard Reklamı", "Mermi Zamanı Sahne", "Kamyon Reklamı",
      "Mermi Zamanı Beyaz", "Dev Ürün", "Ürün Çekimi", "Buzdolabı Reklamı", "Grafiti Reklamı",
      "Volkan Reklamı", "Poster", "Mermi Zamanı Sıçrama", "Makro Ürün Çekimi", "Makro Sahne",
      "Bukalemun", "Sihirli Düğme", "Tekme Reklamı", "ASMR Eklentisi", "ASMR Klasik", "ASMR Sunucu"], "vay-rek"),
  },
  {
    ad: "Oyunlar ve Karakterler", ikon: "yuz",
    uygulamalar: vu(["Oyun Dökümü", "Nano Vuruş", "Nano Soygun", "Simlife", "Peluşlar", "Tuğla Küp",
      "3D Figür", "3D Render", "Eskizden Gerçeğe", "Piksel Oyun"], "vay-oyun"),
  },
  {
    ad: "Araçlar", ikon: "paylas",
    uygulamalar: vu(["AI Meme Üretici", "Arka Plan Kaldırıcı", "Mikro Canavarlar", "Tabela", "Boya Uygulaması"], "vay-arac"),
  },
  {
    ad: "Trend Şablonlar", ikon: "alev",
    uygulamalar: vu(["İdol", "Rap Tanrısı", "Evet Öpücük", "Çizgi Roman", "Rönesans", "J-Dergi",
      "J-Poster", "Hız Treni", "60'lar Kafe", "Yanan Gün Batımı", "Giallo Korku", "Lateks",
      "Zafer Kartı", "Kum Solucanı", "Fırtına Yaratığı", "Eriyen Karalama"], "vay-trend"),
  },
];

/** Kategori açılır menüsü (referansta 9 satır, ilki "Tüm kategoriler"). */
export const SC_UYGULAMA_KATEGORILERI = [
  "Tüm kategoriler",
  ...SC_UYGULAMA_BOLUMLERI.map((b) => b.ad),
];

/* "Uygulama gönder" sihirbazı — 2 adım × 4 seçenek (referans birebir). */
export const SC_UYGULAMA_TIPLERI = [
  { ad: "Özel", ikon: "izgara", ozet: "Boş tuval — her şeyi kendin kur" },
  { ad: "Basit uygulama", ikon: "panel", ozet: "Tek ekran, tek işlev" },
  { ad: "Stüdyo", ikon: "parilti", ozet: "Çok adımlı üretim akışı" },
  { ad: "Hazır uygulama", ikon: "parilti", ozet: "Hazır şablon ızgarası" },
] as const;

export const SC_UYGULAMA_STILLERI = [
  { ad: "Özel", ikon: "izgara", ozet: "Kendi tasarım dilin" },
  { ad: "Vayra", ikon: "marka", ozet: "Vayra tasarım sistemi" },
  { ad: "Y2K", ikon: "parilti", ozet: "2000'ler arayüz estetiği" },
  { ad: "Modern", ikon: "kalem", ozet: "Temiz, aydınlık, minimal" },
] as const;

/* ───────────────────────────── OYUNLAR ───────────────────────────── */

export type SCOyun = { ad: string; yazar: string; oynanma: number; tohum: string };

const oy = (satirlar: [string, string, number][], on: string): SCOyun[] =>
  satirlar.map(([ad, yazar, oynanma], i) => ({ ad, yazar, oynanma, tohum: `${on}-${i}` }));

/** "Şu An Popüler" — 3 büyük kart, kapakta sıra rozeti (1/2/3). */
export const SC_OYUN_POPULER: SCOyun[] = oy([
  ["Blockfield", "prefab_diamond", 167400],
  ["Bharat Koşusu", "archimedesflamingo1533", 281],
  ["Low Poly Ada Hayatta Kalma", "bakingdiamond1393", 154],
], "oy-pop");

/** "Yükselen oyunlar" — 6 kart. */
export const SC_OYUN_YUKSELEN: SCOyun[] = oy([
  ["Sessiz Koğuş", "bakingdiamond1393", 361],
  ["Çılgın Karen 2 — Karen'ın İntikamı", "beaver_ai", 242],
  ["Takeshi & Delphy: İblis Kalesi", "fibonaccinarwhal1310", 927],
  ["DTLA Koşucusu", "soaringbook_gg", 188],
  ["Gedik: Son Kart", "onlyomen", 863],
  ["Aşk Simülatörü", "banksycoffee1432", 26],
], "oy-yuk");

/** "Tüm oyunlar" — referanstaki envanter. */
export const SC_OYUN_TUMU: SCOyun[] = oy([
  ["Delphy & Adely: İblis Kalesi", "jinly2k15", 661],
  ["Smash Ralli", "iamgazimasud", 37],
  ["Brisalia", "singinggrape1399", 1014],
  ["Vyūha: Kinetik Arena", "mooremuffin1359", 1103],
  ["Jonssonların Karavan Rallisi", "fibonaccieagle1209", 214],
  ["İnşa Edilmemişin Yankıları", "chillingorange1384", 105],
  ["Titan Vuruşu Projesi", "creatingsnow_micro", 5450],
  ["VURUŞ PROTOKOLÜ", "bakha", 139600],
  ["Neon Kuşatma", "aliformorelife", 20],
  ["Hustle Hall", "van_gogh_onion", 29800],
  ["Dövüşçü Dünyası 7", "van_gogh_onion", 77500],
  ["ICEWEAR VEZZO — ROP 4", "labeliqai", 2238],
  ["AIR SAUSISS — Kayıp Dachshund", "jinly2k15", 311],
  ["Neon Kırıcı", "innospira", 74],
  ["Karınca Ordusu", "cmvjohnson", 855],
  ["Adaletsiz Ludo", "sparklingtadpole_myth", 392],
  ["UFlasha Kart Savaşı", "alusayt", 905],
  ["WINGSUIT YAKINLIK", "denistos", 1757],
  ["IDappZ Dijital Klon", "fermatcapybara1610", 1207],
  ["MERMİ BALESİ", "levierdashiadotfr", 63900],
  ["IRONSIGHT: Tarayıcı Çok Oyunculu", "cyaxares", 2649],
  ["Baskı Noktası: Penaltı Efsaneleri", "van_gogh_onion", 13200],
  ["Küp Görevi", "bakingdiamond1393", 104],
  ["HOVER//RUSH", "soaring_crab_the_quick", 51400],
  ["Kurbağa Zıplatıcı", "van_gogh_onion", 31800],
  ["Tanrı Simülatörü", "dosya", 51000],
  ["Altın Anahtar Tycoon", "cultural_shrimp_1027", 0],
  ["31'inci Cuma — Oyun", "van_gogh_onion", 4554],
  ["Toki Tale — Konuşma Sahnesi", "sla726", 162],
  ["Deniz Savaşı 2.0", "mixed_usebee1664", 6],
  ["Fallout Sonrası", "michelangelocrystal1653", 2896],
  ["Jest Synth", "otegen", 33500],
  ["Neon Koşucular", "twinkling_grape_supreme", 0],
  ["Sonbahar Kalesinin Kılıcı", "skyscrapertiger1680", 1712],
  ["Hayvan Kart — Çok Oyunculu", "zendevsam", 3019],
  ["Piksel Tesisatçı", "koonsmoon1585", 213],
  ["IZGARA SÜRÜCÜLERİ", "michelangelocrystal1653", 420],
  ["Mîrnişîn", "cyaxares", 1690],
  ["Hayvan Derbisi", "green_guinea_pig_1013", 57],
  ["Phronie Ligi: Manza XL Arena", "fauveyogurt1146", 230],
  ["Krallık Kurucu", "iamgazimasud", 0],
  ["Kedi Bakışı 🐈‍⬛", "buildingzebra1255", 24000],
  ["Rocky & Mixi'nin Dünya Koşusu", "h3iko", 39],
  ["Şövalye Düellosu", "van_gogh_onion", 21200],
  ["Poly Tycoon 1.0", "ai_turundus", 2456],
  ["Kızıl Kuşak: Dojo Düellosu", "jeff_geoff_myke", 2641],
  ["İÇ SAVAŞ: Vahşi Doğa Muharebesi", "anfon", 6667],
  ["PIN SMASH", "j0j0", 5333],
  ["Arcade Adam", "van_gogh_onion", 15600],
  ["YÜKSELİŞ PROJESİ", "vizznary", 2563],
  ["Bıyık Ligi: Yumak Arenası", "installationdiamond_alpha", 359],
  ["Kurabiye Tıklayıcı", "renarder_921", 17400],
  ["Neon Gece Kedisi", "greenwalrus1641", 490],
  ["Doğu Tetrisi", "streaming_toaster_69", 166],
  ["GEDİK: PETME", "onlyomen", 2318],
  ["KIRI (霧) — Touge Korku Yarışı", "generatingtomato1350", 4199],
  ["Boxbrawl — İnşa Et Savaş Arena", "smarthippo1663", 1353],
  ["ÖLÜBAHÇE", "streamingchair1357", 2661],
  ["3D FPS Görev Çağrısı", "fermatpangolin1241", 240],
  ["Roket Topu", "fishytank", 451],
  ["Hesaplaşma Heceleyicisi", "van_gogh_onion", 11300],
  ["BlockHuhn 2026", "fourierchinchilla_nova", 137],
  ["Dünya Kupası Futbol Şampiyonası", "aditseptian", 12600],
  ["Yerleştir", "van_gogh_onion", 11500],
  ["Yedinci Ateş", "cmvjohnson", 160],
  ["Son Teslimat", "yellowmike", 7178],
  ["Naruto Ninja Arena", "brutalist_butter_1095", 2233],
  ["Ruhlar Boss Rush", "modernistsloth1648", 4765],
  ["Parmakkılıç Çılgınlığı — Çok Oyunculu", "j0j0", 3763],
  ["Retro Motokros", "van_gogh_onion", 9396],
  ["NEON DRIFT", "relaxing_banana_super", 10200],
  ["Joker Spin — Slot Simülatörü", "modularseahorse1572", 652],
  ["Piksel Koşucular", "manyer", 11900],
  ["Estropajo Savaşları", "mcnuela", 495],
  ["NANDOVERSE", "aiexpertai", 4030],
  ["Doğranma", "van_gogh_onion", 10200],
  ["DÖVÜŞÇÜLER — Çok Oyunculu", "kelidoscope", 900],
  ["Boya Patlaması", "papouch", 4458],
  ["Kristal Cephe", "tnadi", 271],
  ["HAYALET KOŞU — gökyüzü tapınağı", "beegfreak", 1779],
  ["Bugünün Ötesi: AI Zaman Yolculuğu", "prefabswan1707", 20],
  ["İleri Geri", "van_gogh_onion", 9543],
  ["UrbanFlow — Şehir Parkuru", "discoveringpickle1354", 3731],
  ["Vice City Kanun Kaçakları", "yaztee", 9543],
  ["Backrooms'tan Kaç: CANLI Çevrimiçi", "mondrianpancake10", 2096],
  ["ChompCraft", "jtejas", 11000],
  ["Hareket Savaşı", "michelangelocrystal1653", 642],
  ["Şut Çek", "j0j0", 1740],
  ["Git / Gitme", "leibnizllama1182", 17],
  ["BEAGLE AVI 3D", "unborn", 16],
  ["Wobble Royale", "j0j0", 2302],
  ["Allen Kızları Hız Koşucusu", "thinkingsquid_9000", 1726],
  ["MUDHISH: Sis Gecesi", "cavartia", 2378],
  ["SON IŞIK", "mi5", 9470],
  ["Pretty Brown Run", "dannyblvck", 1211],
  ["KAYKAY PARKI", "papouch", 4156],
  ["Brainrot Savunması", "sustainablezebra1600", 575],
  ["NEON DRIFT II", "thedarkknight", 9312],
  ["Altın Üçgen", "cubistlamp1458", 762],
  ["MOORLIGHT — Üçlünün Muhafızı", "quantumgrape1273", 134],
  ["Kazazede: Enkaz Protokolü", "eyes2screen", 2479],
  ["Parçalanmış Erim", "amaralucenti", 8657],
  ["HAYDUT AJAN", "van_gogh_onion", 6559],
  ["Ofis Koşucusu", "solomon_seelan", 2275],
  ["Kızıl Ufuk", "teleportingplanet1330", 1279],
  ["Yerçekimi Bahçesi", "bakha", 8139],
  ["Mini Futbol 2026", "papouch", 1708],
  ["Smash Ralli Deluxe", "iamgazimasud", 0],
  ["Pota Düellosu", "basketballgod_zend", 1237],
  ["Karartma Protokolü", "byzantinepufferfish1606", 1395],
  ["POLİGON CEPHE", "ikebanaprodpar", 1965],
  ["Masaj Gizemleri", "van_gogh_onion", 6893],
  ["Vahşi Topraklar: Son Köy", "drcelsonolberto", 678],
  ["GÖLGE BİRLİK — Savaş Anime Aksiyon", "picassomilk_chad", 4099],
  ["Özyineleme Çevrimiçi", "mehmetoguzderin", 6618],
  ["Blok Savaşları", "folkmilk1341", 6590],
  ["Son Alev", "manyer", 6571],
  ["NEON KOŞUCU", "fakerainbet", 3063],
  ["Kudüs'ten Kaçış", "punaab", 6044],
  ["Mavi Ay: Glitch Protokolü", "kingseltzer", 907],
  ["Küçük Kahraman — Labirent 3D", "mhauss", 817],
  ["AgentStack", "bossofai", 1132],
  ["Ölü Koşu — Parkur Zombi", "streamingchair1357", 1140],
  ["Clashybara", "brano1957", 1533],
  ["Efsaneler Zindanı", "klee_snow_1002", 5120],
  ["Sokak Kralları V3", "mghouse", 5245],
  ["Kampung Rush: Köy Grand Prix", "flowingbutter1282", 5750],
  ["Kage no Toki — 影の時", "minimalistpepper1377", 4612],
  ["Okuldan Kaçış: Ders Sonrası", "wandering_muffin_1041", 288],
], "oy-tum");

/* Oyun oluşturma şeritleri — referansta 3 sekme × 6 seçenek. */
export const SC_OYUN_TURLERI = ["Nişancı", "Platform", "Novella", "Hiper Kazüel", "Yarış", "Korku"] as const;
export const SC_OYUN_STILLERI = ["Piksel Sanat", "Minimalist", "ASCII", "Voxel", "Anime", "3D"] as const;
export const SC_OYUN_MEKANLARI = ["Ortaçağ", "Cyberpunk", "Retro", "Modern", "Uzay", "Fantastik"] as const;

/* ─────────────────────── ortak yardımcılar ─────────────────────── */

/** 167400 → "167,4B" · 1014 → "1.014" (referanstaki 167.4K / 1,014 karşılığı). */
export function sayiKisalt(n: number): string {
  if (n >= 1000) {
    const b = n / 1000;
    return b >= 100 || Number.isInteger(b)
      ? `${Math.round(b).toLocaleString("tr-TR")}B`
      : `${b.toFixed(1).replace(".", ",")}B`;
  }
  return n.toLocaleString("tr-TR");
}

export { slugla };
