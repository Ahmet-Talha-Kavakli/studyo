/* ============================================================
   CANVAS TEMA — referans ekran görüntülerinden PIL ile ÖLÇÜLEN
   değerler. Tahmin YOK; her sabitin yanında ölçüm kaynağı var.

   Ölçüm notu: referanslar retina 2x (3024×1964) → mantıksal
   1512×982. Aşağıdaki px değerleri MANTIKSAL (CSS) px'tir.
   ============================================================ */

/** Marka aksanı — aktif nav, rozetler, Share butonu. */
export const CV_LIME = "#55D6FD";

/** Zeminler ve yüzeyler. */
export const CV = {
  /* ── Tuval ── */
  tuval: "#0F1113",          // sonsuz tuval zemini
  /* Nokta ızgarası: %100 zoom karesinde ölçüldü — aralık 17.5px, renk #131517.
     Kullanıcı "daha açık olsun" dedi → bir tık yukarı (#2A2D30). */
  tuvalNokta: "#2A2D30",

  /* ── Anasayfa ── */
  sayfa: "#0E1012",          // en alt sayfa zemini
  sayfaUst: "#0F1113",       // kart alanı üstü
  heroMerkez: "#1E3A7A",     // hero radyal gradyan merkezi (navbar hizası)
  heroOrta: "#193167",
  heroAlt: "#111C33",        // sekme çubuğu hizası
  heroKenar: "#0E131D",      // radyal gradyan kenarda söner

  /* ── Kartlar ── */
  kart: "#1C1F23",           // "Yeni tuval" kartı zemini
  kartMavi: "#1D222D",       // tuval kartı (mavimsi mock)
  kartHover: "#2E323D",      // hover'da açılan thumbnail
  kartKenar: "#1B1E21",      // 1px, neredeyse görünmez
  kartMock: "#787B81",       // thumbnail içindeki "Vayra Canvas" metni

  /* ── Sekme / pill ── */
  pillAktif: "#272A30",
  pillAktifMavi: "#272D37",  // hero mavisi üzerindeyken
  pillPasif: "#8F9094",      // pasif sekme metni
  ayrac: "#2A2E36",
  rozetZemin: "#242D29",     // "Hızlı Başlangıç" rozeti (lime %10)
  rozetZeminAktif: "#3B433D",

  /* ── Araç çubuğu (tuval altı) ── */
  bar: "#1C1E21",            // çubuk zemini
  barKenar: "#333538",       // çubuk kenarlığı
  barHover: "#25272A",
  barIkon: "#313235",        // pasif buton dolgusu
  barAktif: "#F3F3F3",       // aktif buton (beyaz daire)

  /* ── Menü / popover ── */
  menu: "#1D222A",           // üst (hafif gradyan)
  menuAlt: "#1A1D22",
  menuKenar: "#303748",
  menuAyrac: "#23262B",
  tehlike: "#D53E3A",        // Sil

  /* ── Emoji picker / reaksiyon ── */
  panel: "#1C1E20",
  panelAra: "#24262A",       // arama alanı dolgusu
  panelPlaceholder: "#656668",
  emojiHover: "#2E3033",
  reaksiyonBar: "#1B1D20",

  /* ── Yorum ── */
  yorumKutu: "#040506",      // canvas'tan DAHA KOYU (çukur efekti)
  yorumKenar: "#131414",
  yorumPlaceholder: "#4F5050",
  yorumGonder: "#4E5051",
  yorumOk: "#131517",
  pinHalka: "#3C7DF6",       // işbirliği mavisi
  cozulduPill: "#2E3032",
  toggleKapali: "#5F636D",

  /* ── Metin ── */
  metin: "#FDFDFD",
  metinIkincil: "#434549",   // "Son düzenleme…" — kasıtlı sönük
  metinNav: "#7382A5",       // navbar (mavi hero üzerinde)
  metinGri: "#898A8B",

  /* ── Node ── */
  node: "#1C1E20",           // node gövdesi (prompt/ses/LLM)
  nodeUretici: "#141618",    // görsel/video üretici gövdesi (daha koyu)
  nodeEtiket: "#777879",     // kartın DIŞINDA, üstündeki gri etiket (ölçüldü)
  nodeKenar: "#26282A",      // seçilmemiş kart 1px kenarlığı — kart tuvalden AYRIŞIR
  nodeAyrac: "#2C2D2E",      // kart içi bölüm ayırıcıları
  nodeBaslik: "#616263",     // kart içi bölüm başlığı ("Kullanıcı İstemi")
  nodeAlt: "#8A8B8C",        // kart içi alt bar ("Seedance 2.0 | 1:1")
  nodeAltPipe: "#434546",    // alt bardaki "|" — metinden çok daha sönük
  nodePlaceholder: "#777879",// kart içi placeholder (ölçüldü, sandığımızdan açık)
  filigran: "#2D2E30",       // boş üretici node ortasındaki logo (26×26)
  handle: "#303132",         // bağlantı noktası zemini
  handleKenar: "#2C2D2E",
  handleAktif: "#C2C2C2",    // bağlıyken/hover
  kablo: "#9E9F9F",          // bağlantı çizgisi (bezier, ok ucu YOK)

  /* ── Panel / çip ── */
  panelSag: "#28292B",       // sağ inspector paneli (bardan bir tık açık)
  cip: "#252729",            // koyu meta çip
  cipUst: "#333538",         // seçili/hover çip

  /* ── Araç panelleri (metin/sticky/şekil/çizim) ── */
  panelAlt: "#1F2024",       // metin toolbar + font/boyut/hiza dropdown
  panelSecili: "#3A3C3E",    // dropdown seçili satır
  panelAyrac: "#38393C",
  tooltip: "#171717",        // TÜM tooltip'ler (panellerden farklı!)
  ikonSonuk: "#57585B",      // kilit / çöp — kırmızı DEĞİL, nötr gri
  limeSonuk: "#4F5B2A",      // devre dışı GENERATE
  limeIz: "#3F4530",         // çizim kalınlığı seçili zemini
  tutamacMavi: "#488AEE",    // sticky kenar "+" ekleme tutamacı
  modal: "#1F2220",          // Ses seçme modalı
  scrim: "#050607",          // modal arka plan karartması

  /* ── Seçim ── */
  secim: "#3F84ED",          // node seçim çerçevesi + tutamaçlar
  odak: "#5B9BFF",           // klavye odak halkası
} as const;

/** Sticky not pastel paleti (referans 10 renk, 5. si varsayılan). */
export const STICKY_PALET = [
  "#FDFDFB", "#E4E5E2", "#F0B4A3", "#F7CB94", "#FAE196",
  "#ADDEB2", "#B3E3DC", "#B1CEF2", "#CAB9F1", "#EFBBDD",
];

/** Çizim kalemi renkleri (referans 8 + renk çarkı). */
export const CIZIM_PALET = [
  "#FFFFFF", "#EC5545", "#F2A43C", "#F9D84A",
  "#68CE67", "#3B82F7", "#B360EA", "#1C1C1E",
];

/* ── Ölçüler (mantıksal px) ── */
export const CV_OLCU = {
  /* Anasayfa */
  konteyner: 1184,           // içerik genişliği (x=155..1339)
  kartGenislik: 278,
  kartAdim: 302,             // pitch
  kartBosluk: 24,            // gap
  kartRadius: 16,
  thumbOran: "16 / 10",      // 556/344 = 1.616 — 16:9 DEĞİL
  pillYukseklik: 30,

  /* Tuval araç çubuğu — ölçülen buton merkezleri:
     505 549 | 606 650 694 | 751 795 839 883 | 940 988
     adım 44px, gruplar arası 57px → ayraç boşluğu 13px.
     Kapsül: 510×57, alt kenardan 20px, tam ortalanmış. */
  barGenislik: 510,
  barYukseklik: 57,
  barAlt: 20,
  barButon: 40,
  barAdim: 44,
  barGrupBosluk: 13,
  barRadius: 28,

  /* Node */
  nodeRadius: 10,
  /* Giriş ve çıkış handle'ları FARKLI: giriş 24px daire, çıkış 31×23 oval. */
  handleGiris: 24,
  handleGirisOfset: 30,      // kart kenarından (24+6)
  handleGirisAdim: 34,       // dikey pitch — kart ortasına GRUPLANIR
  handleCikisG: 31,
  handleCikisY: 23,
  tutamac: 7,                // seçim köşe tutamacı (KARE)

  /* Nokta ızgarası — %100 zoom'da ÖLÇÜLEN aralık 17.5px (fiziksel 35px / 2).
     Eskiden 64px'ti; referanstan 3.6 kat seyrekti. Zoom ile ölçeklenir. */
  noktaAdim: 18,
  noktaCap: 1,
} as const;

/** Nokta ızgarası CSS'i — tuval ve hero için ortak.
    `adim` number olarak açık yazılır: CV_OLCU `as const` olduğu için
    varsayılanı doğrudan kullanmak parametreyi literal 20'ye daraltırdı. */
export function noktaIzgara(renk: string, adim: number = CV_OLCU.noktaAdim): React.CSSProperties {
  return {
    backgroundImage: `radial-gradient(${renk} ${CV_OLCU.noktaCap}px, transparent ${CV_OLCU.noktaCap}px)`,
    backgroundSize: `${adim}px ${adim}px`,
  };
}
