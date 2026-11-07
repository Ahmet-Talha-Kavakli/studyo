/* ============================================================
   CANVAS VERİ MODELİ — node tipleri, handle tip güvenliği,
   model katalogları, kısayollar. Referans birebir.

   Mimari not (referanstan çıkan KRİTİK karar):
   Higgsfield'da ayarlar node kartının İÇİNDE değil, sağdaki
   inspector panelindedir. Kart sade kalır: etiket + gövde + alt bar.
   ============================================================ */

import type { ModelTur } from "./catalog";

/** Handle veri tipi — bağlantı yalnız aynı tipler arasında kurulur. */
export type HandleTip = "metin" | "gorsel" | "video" | "ses" | "dokuman";

export type NodeTur =
  | "istem"      // Prompt — tek T çıkışı, ayar yok
  | "gorsel"     // Image Generation
  | "video"      // Video Generation
  | "ses"        // Voiceover / Audio Generation
  | "llm"        // LLM
  | "metin"      // Text (utility)
  | "sticky"     // Sticky Note
  | "sekil"      // Rectangle / Circle
  | "cizim"      // Draw — serbest çizim (SVG path)
  | "ok"         // Arrow / çizgi — iki nokta arası
  | "yorum"      // Comment pin
  | "tepki";     // Reaction (emoji)

/** Node tipi meta — etiket, handle'lar, kredi, üretim türü. */
export interface NodeMeta {
  ad: string;                 // kartın üstündeki gri etiket
  girisler: HandleTip[];      // sol handle'lar (yukarıdan aşağı)
  cikis: HandleTip | null;    // sağ handle
  kredi?: number;             // GENERATE ✦N
  uretimTuru?: ModelTur;      // gerçek motora geçen tür
  placeholder?: string;
  uretici: boolean;           // sağ panel açar mı
}

export const NODE_META: Record<NodeTur, NodeMeta> = {
  istem: {
    ad: "İstem", girisler: [], cikis: "metin", uretici: false,
    placeholder: "İstemini buraya yaz",
  },
  gorsel: {
    ad: "Görsel Üretimi", girisler: ["gorsel", "metin"], cikis: "gorsel",
    kredi: 7, uretimTuru: "gorsel", uretici: true,
    placeholder: "Ne üretmek istediğini anlat...",
  },
  video: {
    ad: "Video Üretimi", girisler: ["gorsel", "video", "ses", "metin"], cikis: "video",
    kredi: 68, uretimTuru: "video", uretici: true,
    placeholder: "Videoyu anlat...",
  },
  ses: {
    ad: "Seslendirme", girisler: ["metin"], cikis: "ses",
    kredi: 10, uretimTuru: "ses", uretici: true,
    placeholder: "Hayal ettiğin sesi anlat...",
  },
  llm: {
    ad: "LLM", girisler: ["gorsel", "dokuman", "video", "metin"], cikis: "metin",
    kredi: 2, uretimTuru: "gorsel", uretici: true,
    placeholder: "Yönergelerini gir...",
  },
  metin: { ad: "Metin", girisler: [], cikis: "metin", uretici: false },
  sticky: { ad: "Yapışkan Not", girisler: [], cikis: null, uretici: false },
  sekil: { ad: "Şekil", girisler: [], cikis: null, uretici: false },
  cizim: { ad: "Çizim", girisler: [], cikis: null, uretici: false },
  ok: { ad: "Ok", girisler: [], cikis: null, uretici: false },
  yorum: { ad: "Yorum", girisler: [], cikis: null, uretici: false },
  tepki: { ad: "Tepki", girisler: [], cikis: null, uretici: false },
};

/** Node tipine göre varsayılan boyut (referans: üretici 310×310). */
export function varsayilanBoyut(tip: NodeTur): { g: number; y: number } {
  switch (tip) {
    /* Referanstan ÖLÇÜLEN boyutlar (retina 2x → CSS px). */
    case "gorsel":
    case "video": return { g: 300, y: 300 };
    case "ses":   return { g: 297, y: 261 };
    case "llm":   return { g: 340, y: 320 };
    case "istem": return { g: 297, y: 152 };
    case "metin": return { g: 220, y: 54 };
    case "sticky": return { g: 200, y: 200 };
    case "sekil": return { g: 160, y: 160 };
    case "cizim": return { g: 240, y: 180 };
    case "ok": return { g: 180, y: 100 };
    case "yorum": return { g: 34, y: 34 };
    case "tepki": return { g: 40, y: 40 };
  }
}

/* ══════════ MODEL KATALOĞU (referans birebir) ══════════ */

export interface CvModel {
  ad: string;
  ozet?: string;
  rozet?: "YENİ" | "ÖZEL" | "PREMIUM";
  cozunurluk?: string;
  sure?: string;
  sesli?: boolean;
}

export const GORSEL_MODELLER: CvModel[] = [
  { ad: "Vayra Soul 2.0", ozet: "Yeni nesil ultra-gerçekçi moda görselleri" },
  { ad: "Soul Cinema", ozet: "Sinema kalitesinde görsel üretimi" },
  { ad: "GPT Image 2", ozet: "Neredeyse kusursuz metin işlemeli 4K görseller", rozet: "YENİ" },
  { ad: "Seedream 5.0 Pro", ozet: "Akıllı görsel muhakemeyle tutarlı görseller", rozet: "YENİ" },
  { ad: "Seedream 5.0 Lite", ozet: "Akıllı görsel muhakeme" },
  { ad: "Seedream 4.5", ozet: "ByteDance'in yeni nesil 4K görsel düzenleme modeli" },
  { ad: "Nano Banana Pro", ozet: "Google'ın amiral gemisi üretim modeli" },
  { ad: "Nano Banana 2", ozet: "Flash hızında pro kalite", rozet: "YENİ" },
];

export const VIDEO_MODELLER: CvModel[] = [
  { ad: "Seedance 2.0", cozunurluk: "4K", sure: "4sn-15sn" },
  { ad: "Seedance 2.0 Mini", cozunurluk: "720p", sure: "4sn-15sn", rozet: "YENİ" },
  { ad: "Seedance 2.0 Fast", cozunurluk: "720p", sure: "4sn-15sn" },
  { ad: "Gemini Omni Flash", cozunurluk: "720p", sure: "4sn-10sn", rozet: "YENİ" },
  { ad: "Kling 3.0", cozunurluk: "4K", sure: "3sn-15sn", sesli: true },
  { ad: "Kling 3.0 Turbo", cozunurluk: "1080p", sure: "3sn-15sn", sesli: true, rozet: "YENİ" },
  { ad: "Kling 3.0 Motion Control", cozunurluk: "1080p", sure: "3sn-30sn" },
  { ad: "HappyHorse", cozunurluk: "1080p", sure: "3sn-15sn", sesli: true, rozet: "YENİ" },
  { ad: "Grok Imagine" },
];

export const SES_MODELLER: CvModel[] = [
  { ad: "Eleven v3", ozet: "Satır içi etiketlerle duygu ve sunum kontrolü" },
  { ad: "MiniMax Speech 2.8 HD", ozet: "Yüksek doğrulukta tek sesli anlatım" },
  { ad: "VibeVoice", ozet: "Sesli kitap ve podcast için uzun format anlatım" },
  { ad: "Seed Speech", ozet: "30+ dilde çok dilli konuşma" },
];

export const LLM_MODELLER: CvModel[] = [
  { ad: "Claude Sonnet 4.6", ozet: "Anthropic'in dengeli muhakeme modeli" },
  { ad: "Claude Opus 4.7", ozet: "Derin muhakeme için en yetenekli model" },
  { ad: "GPT 5.5", ozet: "OpenAI'ın amiral gemisi dil modeli" },
  { ad: "GPT 5.4 Mini", ozet: "Hızlı yanıtlar için yalın GPT-5.4" },
  { ad: "Gemini 3.1 Pro", ozet: "Google'ın amiral gemisi muhakeme modeli" },
];

export function modelListesi(tip: NodeTur): CvModel[] {
  if (tip === "video") return VIDEO_MODELLER;
  if (tip === "ses") return SES_MODELLER;
  if (tip === "llm") return LLM_MODELLER;
  return GORSEL_MODELLER;
}

export function varsayilanModel(tip: NodeTur): string | undefined {
  switch (tip) {
    case "gorsel": return "GPT Image 2";
    case "video": return "Seedance 2.0";
    case "ses": return "Eleven v3";
    case "llm": return "Claude Sonnet 4.6";
    default: return undefined;
  }
}

/* ══════════ AYAR SEÇENEKLERİ (referans birebir) ══════════ */

export const ORANLAR = ["1:1", "3:2", "2:3", "16:9", "9:16", "4:3", "3:4", "21:9"];
export const VIDEO_ORANLAR = ["16:9", "9:16", "4:3", "3:4", "1:1", "21:9"];
export const GORSEL_COZUNURLUK = ["1k", "2k", "4k"];
export const VIDEO_COZUNURLUK = ["480p", "720p", "1080p", "4k"];
export const KALITELER = ["Düşük", "Orta", "Yüksek"];

/** Ses ön ayarları — referans: monospace büyük harf lime isimler. */
export interface SesOnAyar { ad: string; cinsiyet: "Kadın" | "Erkek" }
export const SES_ON_AYARLAR: SesOnAyar[] = [
  { ad: "ROXIE", cinsiyet: "Kadın" },
  { ad: "ARTHUR", cinsiyet: "Erkek" },
  { ad: "CILLIAN", cinsiyet: "Erkek" },
  { ad: "BROOKS", cinsiyet: "Erkek" },
  { ad: "TALLULAH", cinsiyet: "Kadın" },
  { ad: "HANA", cinsiyet: "Kadın" },
  { ad: "GIDEON", cinsiyet: "Erkek" },
  { ad: "ROMAN", cinsiyet: "Erkek" },
  { ad: "SKYE", cinsiyet: "Kadın" },
  { ad: "MABEL", cinsiyet: "Kadın" },
  { ad: "STERLING", cinsiyet: "Erkek" },
];

/* ══════════ EKLEME PALETİ (referans birebir gruplar) ══════════ */

export interface PaletOge {
  tip: NodeTur;
  ad: string;
  grup: string;
  renk: string;   // ikon karesi gradyanı
  yeni?: boolean;
}

export const PALET: PaletOge[] = [
  { tip: "istem",  ad: "İstem",            grup: "",          renk: "#6B6D70" },
  { tip: "gorsel", ad: "Görsel Üretici",   grup: "",          renk: "#4FA8E8" },
  { tip: "video",  ad: "Video Üretici",    grup: "",          renk: "#8B5CF6" },
  { tip: "ses",    ad: "Ses Üretici",      grup: "",          renk: "#F0496B" },
  { tip: "llm",    ad: "LLM Asistanı",     grup: "",          renk: "#55D6FD" },
  { tip: "gorsel", ad: "Görsel Üretici",   grup: "Görsel",    renk: "#4FA8E8" },
  { tip: "video",  ad: "Video Üretici",    grup: "Video",     renk: "#8B5CF6" },
  { tip: "ses",    ad: "Seslendirme",      grup: "Ses",       renk: "#F0496B" },
  { tip: "metin",  ad: "Metin",            grup: "Yardımcı",  renk: "#A3A555" },
  { tip: "sticky", ad: "Yapışkan Not",     grup: "Yardımcı",  renk: "#C8B84A" },
];

/* ══════════ KISAYOLLAR (referans birebir) ══════════ */

export const KISAYOLLAR: { baslik: string; ogeler: [string, string][] }[] = [
  {
    baslik: "Gezinme",
    ogeler: [
      ["Yakınlaştır", "⌘="], ["Uzaklaştır", "⌘-"],
      ["Yüzde 100 Yakınlık", "⌘0"], ["Ekrana Sığdır", "⇧1"],
    ],
  },
  {
    baslik: "Düzenleme",
    ogeler: [
      ["Geri Al", "⌘Z"], ["Yinele", "⇧⌘Z"],
      ["Bağlantılarla Kopyala", "⌘C"], ["Yalnız Node Kopyala", "⇧⌘C"],
      ["Seçimi Çoğalt", "⌘D"], ["Tümünü Seç", "⌘A"],
      ["Seçimi Sil", "Delete"], ["Grupla", "⌘G"], ["Grubu Çöz", "⇧⌘G"],
      ["Öne Getir", "]"], ["Arkaya Gönder", "["],
      ["En Öne", "⌘]"], ["En Arkaya", "⌘["],
      ["Seçime Sığdır", "⇧2"], ["Seçimi Temizle", "Esc"],
    ],
  },
  {
    baslik: "Araçlar",
    ogeler: [
      ["Seçim Modu", "V"], ["Kaydırma Modu", "H"], ["Yorum Modu", "C"],
      ["Geçici Kaydırma", "Boşluk"], ["Yapışkan Not", "N"], ["Metin", "T"],
      ["Dikdörtgen", "R"], ["Daire", "O"], ["Çizim", "D"],
      ["Silgi", "E"], ["Tepki", "S"], ["Görsel Üretimi", "I"],
    ],
  },
];

/** Hızlı tepki emojileri — referans: 👍 ❤️ 🔥 ✅ ⚠️ 🚫 */
export const HIZLI_TEPKILER = ["👍", "❤️", "🔥", "✅", "⚠️", "🚫"];

/** Emoji picker havuzu — kategorisiz tek liste (referans birebir). */
export const EMOJILER = [
  "😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","🫠","😉","😊","😇",
  "🥰","😍","🤩","😘","😗","☺️","😚","😙","🥲","😋","😛","😜","🤪","😝",
  "🤗","🤭","🫢","🤫","🤔","🫡","🤐","🤨","😐","😑","😶","😏","😒","🙄",
  "😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🤧","🥵",
  "🥶","🥴","😵","🤯","🤠","🥳","🥸","😎","🤓","🧐","😕","🫤","😟","🙁",
  "🥹","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩",
  "😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹","👺",
  "👻","👽","👾","🤖","😺","😸","😹","😻","😼","😽","🙀","😿","😾",
  "🙈","🙉","🙊","💌","💘","💝","💖","💗","💓","💞","💕","🩷","❣️","💔",
  "❤️","🧡","💛","💚","💙","💜","🤎","🖤","🤍","💯","💢","💥","💫","💦",
  "👍","👎","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉","👆",
  "👇","☝️","👋","🤚","🖐️","✋","🖖","👏","🙌","🫶","🤲","🤝","🙏","✍️",
  "⌨️","🖱️","🖲️","💽","💻","💿","📀","🧮","🎥","🎞️","📽️","🎬","📺","📷",
  "📸","📹","📼","🔍","🔎","🕯️","💡","🔦","🏮","🪔","📔","📕","📖","📗",
  "📝","💼","📁","📂","🗂️","📅","📆","🗒️","🗓️","📇","📈","📉","📊","📋",
  "📌","📍","📎","🖇️","📏","📐","✂️","🗃️","🗄️","🗑️","🔒","🔓","🔏","🔐",
  "🔬","🧪","🩸","💊","🛏️","🛋️","🪑","🚽","🚿","🛁","🧴","⭐","🌟","✨",
  "⚡","🔥","🌈","☀️","🌙","⛅","☁️","🌧️","❄️","🎉","🎊","🎈","🎁","🏆",
];

/** Sticky not renkleri (referans pastel paleti). */
export const STICKY_RENKLER = ["#F3E9A8", "#C7D6F5", "#C9EAD0", "#F3D6E4", "#E0D6F3", "#FFFFFF"];

/** Klasör renkleri — "Yeni klasör" modalı (7 renk, ilki lime seçili). */
export const KLASOR_RENKLER = ["#55D6FD", "#4FA8E8", "#8B5CF6", "#F0496B", "#4ADE80", "#F59E0B", "#94A3B8"];

/** Çizim kalemi renkleri. */
export const KALEM_RENKLER = ["#FFFFFF", "#E5484D", "#E8912E", "#F5C542", "#3FB950", "#3D7BFF", "#9B59D0"];

/* ══════════ ŞEKİLLER (referans birebir — 3×6 = 18 şekil) ══════════ */
export type SekilTur =
  | "kare" | "daire" | "elips" | "elmas" | "ucgen" | "tersUcgen"
  | "paralel" | "yamuk" | "altigen" | "besgen" | "sekizgen" | "yildiz"
  | "arti" | "solOk" | "sagOk" | "chevron" | "balon" | "silindir";

/** Her şeklin SVG path'i — 100×100 kutuya normalize (viewBox 0 0 100 100). */
export const SEKIL_PATH: Record<SekilTur, string> = {
  kare:      "M 12 4 H 88 A 8 8 0 0 1 96 12 V 88 A 8 8 0 0 1 88 96 H 12 A 8 8 0 0 1 4 88 V 12 A 8 8 0 0 1 12 4 Z",
  daire:     "M 50 4 A 46 46 0 1 1 49.9 4 Z",
  elips:     "M 50 18 A 46 32 0 1 1 49.9 18 Z",
  elmas:     "M 50 4 L 96 50 L 50 96 L 4 50 Z",
  ucgen:     "M 50 6 L 96 92 L 4 92 Z",
  tersUcgen: "M 4 8 L 96 8 L 50 94 Z",
  paralel:   "M 26 12 H 96 L 74 88 H 4 Z",
  yamuk:     "M 26 12 H 74 L 96 88 H 4 Z",
  altigen:   "M 28 10 H 72 L 96 50 L 72 90 H 28 L 4 50 Z",
  besgen:    "M 50 4 L 95 37 L 78 92 H 22 L 5 37 Z",
  sekizgen:  "M 32 5 H 68 L 95 32 V 68 L 68 95 H 32 L 5 68 V 32 Z",
  yildiz:    "M 50 4 L 62 37 H 96 L 68 58 L 79 92 L 50 71 L 21 92 L 32 58 L 4 37 H 38 Z",
  arti:      "M 36 6 H 64 V 36 H 94 V 64 H 64 V 94 H 36 V 64 H 6 V 36 H 36 Z",
  solOk:     "M 40 12 L 8 50 L 40 88 V 66 H 94 V 34 H 40 Z",
  sagOk:     "M 60 12 L 92 50 L 60 88 V 66 H 6 V 34 H 60 Z",
  chevron:   "M 10 12 H 56 L 90 50 L 56 88 H 10 L 44 50 Z",
  balon:     "M 12 10 H 88 A 8 8 0 0 1 96 18 V 62 A 8 8 0 0 1 88 70 H 44 L 22 92 V 70 H 12 A 8 8 0 0 1 4 62 V 18 A 8 8 0 0 1 12 10 Z",
  silindir:  "M 12 22 A 38 14 0 0 1 88 22 V 78 A 38 14 0 0 1 12 78 Z M 12 22 A 38 14 0 0 0 88 22",
};

/** Panelde 3 satır × 6 sütun sırası (referans birebir). */
export const SEKIL_SIRA: SekilTur[] = [
  "kare", "daire", "elips", "elmas", "ucgen", "tersUcgen",
  "paralel", "yamuk", "altigen", "besgen", "sekizgen", "yildiz",
  "arti", "solOk", "sagOk", "chevron", "balon", "silindir",
];

/* ══════════ METİN BİÇİMLENDİRME (referans birebir) ══════════ */

/** Font aileleri — dropdown'da her satır KENDİ fontuyla render edilir. */
export const FONTLAR = [
  { ad: "Varsayılan", css: "inherit" },
  { ad: "Sans", css: "ui-sans-serif, system-ui, sans-serif" },
  { ad: "Serif", css: "ui-serif, Georgia, serif" },
  { ad: "Mono", css: "ui-monospace, SFMono-Regular, monospace" },
  { ad: "Yuvarlak", css: "ui-rounded, 'SF Pro Rounded', sans-serif" },
  { ad: "Display", css: "'Archivo Black', Impact, sans-serif" },
] as const;

/** Punto ön ayarları — sağda sayı gösterilir (referans birebir). */
export const PUNTOLAR: { ad: string; px: number }[] = [
  { ad: "Çok Küçük", px: 12 },
  { ad: "Küçük", px: 14 },
  { ad: "Orta", px: 16 },
  { ad: "Büyük", px: 20 },
  { ad: "Çok Büyük", px: 24 },
  { ad: "Başlık", px: 32 },
  { ad: "Gösterim", px: 48 },
];

export type Hiza = "sol" | "orta" | "sag" | "yasla";
export const HIZALAR: { deger: Hiza; ad: string }[] = [
  { deger: "sol", ad: "Sola" },
  { deger: "orta", ad: "Ortala" },
  { deger: "sag", ad: "Sağa" },
  { deger: "yasla", ad: "İki yana yasla" },
];

/** Metin rengi paleti — biçimlendirme çubuğundaki renk yuvarlağı. */
export const METIN_RENKLER = [
  "#FFFFFF", "#8A8A8F", "#EC5545", "#F2A43C", "#F9D84A",
  "#68CE67", "#3B82F7", "#B360EA", "#EFBBDD", "#111111",
];

/* ══════════ OK STİLLERİ (referans birebir — 9 stil, 3 grup) ══════════
   Referans çubuğu: [kıvrık ok · eğik ok · düz-diyagonal ok · sade çizgi]
   | [yatay çizgi · yatay ok] | [diyagonal · kesikli · noktalı]        */
export type OkStil =
  | "kivrik" | "egik" | "diyagonal" | "sade"
  | "duz" | "duzOk"
  | "cizgi" | "kesikli" | "noktali";

export interface OkStilBilgi {
  stil: OkStil;
  /** Ok ucu var mı (yoksa düz çizgi). */
  ucVar: boolean;
  /** Eğri mi (bezier) yoksa düz mü. */
  egri: boolean;
  /** SVG strokeDasharray — kesikli/noktalı için. */
  desen?: string;
  grupSonu?: boolean;
}

export const OK_STILLERI: OkStilBilgi[] = [
  { stil: "kivrik",    ucVar: true,  egri: true },
  { stil: "egik",      ucVar: true,  egri: false },
  { stil: "diyagonal", ucVar: true,  egri: false },
  { stil: "sade",      ucVar: false, egri: false, grupSonu: true },
  { stil: "duz",       ucVar: false, egri: false },
  { stil: "duzOk",     ucVar: true,  egri: false, grupSonu: true },
  { stil: "cizgi",     ucVar: false, egri: false },
  { stil: "kesikli",   ucVar: false, egri: false, desen: "7 5" },
  { stil: "noktali",   ucVar: false, egri: false, desen: "1.5 6" },
];
