/**
 * Fiyatlandırmanın TEK kaynağı.
 *
 * /fiyatlandirma, /panel/kredi, kredi modalı, ana sayfa fiyat bölümü ve
 * useAuth'un kredi kotası buradan okur. Plan tanımları catalog.PLANLAR'dan
 * gelir (TL); bu dosya onu tamamlayan dönem, paket, sınırsız erişim, hız ve
 * "kredin neye yeter" hesaplarını taşır. Tüm fiyatlar Türk lirası, KDV hariç.
 */
import { MODELLER, PLANLAR, type AIModel, type Plan } from "@/lib/catalog";

export type PlanId = "baslangic" | "arti" | "ultra" | "kurumsal";
export type Donem = "aylik" | "yillik";

/** Yıllık ödemede indirim oranı (aylık eşdeğer fiyata uygulanır). */
export const YILLIK_INDIRIM = 0.2;

/** Kurumsal planın kredi havuzu (sözleşmeye göre değişir; kota hesabı için taban). */
const KURUMSAL_KREDI = 12000;

export const BIREYSEL_PLANLAR = PLANLAR.filter((p) => p.id !== "kurumsal");
export const KURUMSAL_PLAN = PLANLAR.find((p) => p.id === "kurumsal")!;

export function planBul(id: string): Plan | undefined {
  return PLANLAR.find((p) => p.id === id);
}

/** Planın aylık kredi kotası — useAuth'un kredi halkası bunu kullanır. */
export const PLAN_KREDI: Record<PlanId, number> = {
  baslangic: planBul("baslangic")!.kredi,
  arti: planBul("arti")!.kredi,
  ultra: planBul("ultra")!.kredi,
  kurumsal: KURUMSAL_KREDI,
};

/** Ultra'da seçilebilen aylık kredi kademeleri; fiyat krediyle orantılı ölçeklenir. */
export const ULTRA_KREDI_KADEMELERI = [3000, 6000, 9000];

/** Aylık eşdeğer fiyat (TL). kredi verilirse plan fiyatı ona oranlanır (Ultra kademeleri). */
export function aylikFiyat(p: Plan, donem: Donem, kredi = p.kredi): number {
  const taban = p.fiyatTRY * (kredi / p.kredi);
  return Math.round(donem === "yillik" ? taban * (1 - YILLIK_INDIRIM) : taban);
}

/** Kredi başına maliyet (TL, kuruş hassasiyetinde). */
export function krediBasina(fiyatTL: number, kredi: number): number {
  return fiyatTL / kredi;
}

/* ── "Kredin neye yeter" — temsilî model maliyetleri ──
   Kart ve paketlerdeki "yaklaşık X görsel / Y video" bu modellerle hesaplanır.
   Değerler catalog.MODELLER'den okunur; model fiyatı değişirse burası da değişir. */
const modelKredi = (id: string) => MODELLER.find((m) => m.id === id)!.kredi;
export const ORNEK_MALIYET = {
  gorsel: { kredi: modelKredi("nano-banana-pro"), ad: "Nano Banana Pro görsel" },
  video: { kredi: modelKredi("seedance-2"), ad: "Seedance 2.0 video" },
  ses: { kredi: modelKredi("eleven-tts"), ad: "ElevenLabs seslendirme" },
  muzik: { kredi: modelKredi("vayra-muse-2"), ad: "Vayra Muse 2 şarkı" },
  uc: { kredi: modelKredi("meshy-metin3d"), ad: "Metinden 3D model" },
};

export function neYeter(kredi: number) {
  return {
    gorsel: Math.floor(kredi / ORNEK_MALIYET.gorsel.kredi),
    video: Math.floor(kredi / ORNEK_MALIYET.video.kredi),
    ses: Math.floor(kredi / ORNEK_MALIYET.ses.kredi),
  };
}

/* ── Tek seferlik kredi paketleri (süresi dolmaz) ── */
export type Paket = { kredi: number; fiyat: number; populer?: boolean };
export const KREDI_PAKETLERI: Paket[] = [
  { kredi: 100, fiyat: 199 },
  { kredi: 500, fiyat: 849 },
  { kredi: 1000, fiyat: 1599 },
  { kredi: 2500, fiyat: 3749, populer: true },
  { kredi: 5000, fiyat: 6999 },
  { kredi: 10000, fiyat: 12999 },
];

/* ── Model bazında sınırsız teklifler (/panel/kredi?sekme=sinirsiz) ──
   Fiyat: gunlukTaban × kalite çarpanı × gün çarpanı. Uzun süre günlük maliyeti düşürür. */
export type SinirsizTeklif = {
  model: string; gorsel: string; kaliteler: { ad: string; carpan: number }[];
  gunlukTaban: number; esZamanli: number; maxSure?: string;
};
export const SINIRSIZ_TEKLIFLER: SinirsizTeklif[] = [
  { model: "nano-banana-pro", gorsel: "/gercek/sinirsiz/unl-nano-banana-pro.webp", kaliteler: [{ ad: "2K", carpan: 1 }, { ad: "4K", carpan: 1.4 }], gunlukTaban: 149, esZamanli: 4 },
  { model: "seedance-2", gorsel: "/gercek/sinirsiz/unl-seedance.webp", kaliteler: [{ ad: "720p", carpan: 1 }, { ad: "1080p", carpan: 2 }], gunlukTaban: 1490, esZamanli: 1, maxSure: "15 sn'ye kadar" },
  { model: "kling-3", gorsel: "/gercek/sinirsiz/unl-kling.webp", kaliteler: [{ ad: "1080p", carpan: 1 }, { ad: "4K", carpan: 1.7 }], gunlukTaban: 990, esZamanli: 1, maxSure: "10 sn'ye kadar" },
  { model: "gpt-image-2", gorsel: "/gercek/sinirsiz/unl-gpt-image.webp", kaliteler: [{ ad: "1K", carpan: 1 }, { ad: "2K", carpan: 1.3 }, { ad: "4K", carpan: 2 }], gunlukTaban: 299, esZamanli: 2 },
  { model: "seedream-5", gorsel: "/gercek/galeri/urun3.webp", kaliteler: [{ ad: "2K", carpan: 1 }, { ad: "4K", carpan: 1.5 }], gunlukTaban: 199, esZamanli: 4 },
  { model: "hailuo-23", gorsel: "/gercek/panel/gal-seedance-2.webp", kaliteler: [{ ad: "768p", carpan: 1 }, { ad: "1080p", carpan: 1.6 }], gunlukTaban: 590, esZamanli: 2, maxSure: "6 sn'ye kadar" },
  { model: "flux-2", gorsel: "/gercek/galeri/soyut4.webp", kaliteler: [{ ad: "1K", carpan: 1 }, { ad: "2K", carpan: 1.3 }], gunlukTaban: 129, esZamanli: 4 },
  { model: "eleven-tts", gorsel: "/gercek/arac/ses-ilham-dalga.webp", kaliteler: [{ ad: "Standart", carpan: 1 }], gunlukTaban: 99, esZamanli: 4 },
];
export const SINIRSIZ_GUNLER = [
  { gun: 1, carpan: 1, ozet: "Dene, taahhüt yok" },
  { gun: 7, carpan: 5, ozet: "Bir proje ya da kampanya için" },
  { gun: 30, carpan: 15, ozet: "Sürekli, yoğun üretim için" },
];
export function sinirsizFiyat(t: SinirsizTeklif, kaliteIdx: number, gunIdx: number) {
  return Math.round((t.gunlukTaban * t.kaliteler[kaliteIdx].carpan * SINIRSIZ_GUNLER[gunIdx].carpan) / 10) * 10 - 1;
}

/** Hız seviyelerinin yoğun saatte ortalama bekleme süresi (sn). */
export const HIZ_BEKLEME: Record<string, number> = { standart: 130, oncelikli: 40, turbo: 0 };
/** Ek eşzamanlı üretim (hız sekmesi) — aylık. */
export const EK_ESZAMANLI = [
  { adet: 0, fiyat: 0 }, { adet: 2, fiyat: 149 }, { adet: 4, fiyat: 249 }, { adet: 8, fiyat: 449 },
];

/* ── Hız / öncelik ── */
export const HIZ_SEVIYELERI = [
  { id: "standart", ad: "Standart", ozet: "Sıradaki işlerle birlikte kuyrukta.", kat: "1×", fiyat: 0 },
  { id: "oncelikli", ad: "Öncelikli", ozet: "Yoğun saatlerde kuyruğun önüne geçer.", kat: "2×", fiyat: 299, populer: true },
  { id: "turbo", ad: "Turbo", ozet: "Ayrılmış kapasitede, beklemeden çalışır.", kat: "4×", fiyat: 799 },
];

/* ── Ayrıntılı plan karşılaştırması ──
   Değer: true/false (var/yok) ya da metin. Sütun sırası: Başlangıç, Artı, Ultra, Kurumsal. */
export type Hucre = boolean | string;
export const KARSILASTIRMA: { grup: string; satirlar: { ad: string; ipucu?: string; d: [Hucre, Hucre, Hucre, Hucre] }[] }[] = [
  {
    grup: "Krediler",
    satirlar: [
      { ad: "Aylık kredi", d: [String(PLAN_KREDI.baslangic), "1.000", "3.000 – 9.000", "Özel havuz"] },
      { ad: "Kullanılmayan kredi devri", ipucu: "Bir sonraki aya devreder", d: [false, true, true, true] },
      { ad: "Ek kredi paketi alma", d: [true, true, true, true] },
      { ad: "Kredi başına maliyet", d: ["Standart", "%20 daha düşük", "%60'a kadar düşük", "Sözleşmeye göre"] },
    ],
  },
  {
    grup: "Üretim",
    satirlar: [
      { ad: "Model erişimi", d: ["Seçili modeller", "Tüm modeller", "Tüm modeller", "Tüm modeller + özel"] },
      { ad: "Aynı anda video üretimi", d: ["2", "6", "8", "Özel"] },
      { ad: "Aynı anda görsel üretimi", d: ["2", "8", "8", "Özel"] },
      { ad: "Maksimum çözünürlük", d: ["1080p", "2K", "4K", "4K"] },
      { ad: "Filigransız çıktı", d: [true, true, true, true] },
      { ad: "Öncelikli kuyruk", d: [false, true, true, true] },
      { ad: "Yeni modellere erken erişim", d: [false, true, true, true] },
    ],
  },
  {
    grup: "Stüdyolar",
    satirlar: [
      { ad: "Görsel & Video stüdyosu", d: [true, true, true, true] },
      { ad: "3D & Ses stüdyosu", d: [false, true, true, true] },
      { ad: "Sinema & Pazarlama stüdyosu", d: [false, true, true, true] },
      { ad: "Canvas iş akışları", d: [false, true, true, true] },
      { ad: "Tutarlı karakter (Ruh ID)", d: [false, "5 kimlik", "Sınırsız", "Sınırsız"] },
      { ad: "Topaz büyütme", d: [false, false, true, true] },
    ],
  },
  {
    grup: "Ekip & geliştirici",
    satirlar: [
      { ad: "API & MCP erişimi", d: [false, false, true, true] },
      { ad: "Ticari kullanım hakkı", d: [true, true, true, true] },
      { ad: "SSO & ekip yönetimi", d: [false, false, false, true] },
      { ad: "Özel model eğitimi", d: [false, false, false, true] },
      { ad: "SLA & atanmış destek", d: [false, false, false, true] },
    ],
  },
];

/* ── Model kredi tablosu ── */
export const MODEL_TURLERI: { id: AIModel["tur"]; ad: string }[] = [
  { id: "video", ad: "Video" }, { id: "gorsel", ad: "Görsel" }, { id: "ses", ad: "Ses" },
  { id: "muzik", ad: "Müzik" }, { id: "3d", ad: "3D" },
];

/** Sağlayıcı → renkli logo (public/marka/renkli). Yoksa Vayra işareti kullanılır. */
const L = "/marka/renkli";
export const SAGLAYICI_LOGO: Record<string, string> = {
  ByteDance: `${L}/bytedance-color.svg`,
  Google: `${L}/gemini-color.svg`,
  Kuaishou: `${L}/kling-color.svg`,
  OpenAI: `${L}/openai.svg`,
  Alibaba: `${L}/qwen-color.svg`,
  MiniMax: `${L}/minimax-color.svg`,
  "Black Forest Labs": `${L}/flux.svg`,
  ElevenLabs: `${L}/elevenlabs.svg`,
};
export const VAYRA_LOGO = "/brand/vayra-mark.png";

/* ── Fiyat SSS ── */
export const FIYAT_SSS: { s: string; c: string }[] = [
  { s: "Kredi sistemi nasıl çalışır?", c: "Her üretim, seçtiğin modele, kaliteye ve süreye göre belirli bir kredi harcar. Maliyeti üretmeden önce görürsün. Planın her ay kredi yükler; gerekirse ek paket alırsın." },
  { s: "Kullanmadığım krediler ne olur?", c: "Artı ve üzeri planlarda kullanılmayan aylık kredi bir sonraki aya devreder. Tek seferlik paketlerle aldığın kredilerin süresi hiç dolmaz." },
  { s: "Planımı istediğim zaman değiştirebilir miyim?", c: "Evet. Yükseltme anında geçerli olur ve fark günlük olarak hesaplanır. Düşürme bir sonraki fatura döneminde başlar." },
  { s: "Yıllık ödemede ne kazanırım?", c: "Yıllık ödemede aylık fiyat %20 düşer. Kredilerin yine her ay yenilenir." },
  { s: "Hangi ödeme yöntemlerini kabul ediyorsunuz?", c: "Türk lirası ile kredi ve banka kartı. Kurumsal müşteriler için havale ve e-fatura seçenekleri var." },
  { s: "Ürettiklerimi ticari olarak kullanabilir miyim?", c: "Evet. Tüm planlarda ürettiğin içerikleri reklam, ürün ve kampanyalarında ticari olarak kullanabilirsin." },
  { s: "İptal edersem ne olur?", c: "İstediğin an iptal edebilirsin. Dönem sonuna kadar planın ve kredilerin kullanılabilir kalır, otomatik yenileme durur." },
];

/* ═══════════════════ Fiyat sayfası: kart katmanı ═══════════════════
   Rakip sayfalarındaki yoğunluk (Higgsfield / Krea / Magnific) için kartların
   ihtiyaç duyduğu ek veri. Sütun sırası her yerde: ücretsiz, başlangıç, artı, ultra. */

export type KartPlanId = "ucretsiz" | "baslangic" | "arti" | "ultra";
export const KART_PLANLARI: KartPlanId[] = ["ucretsiz", "baslangic", "arti", "ultra"];

/** Ücretsiz katman — catalog'da plan değil (abonelik yok); yalnız sitede kart olarak görünür. */
export const UCRETSIZ = {
  id: "ucretsiz" as const, ad: "Ücretsiz", ozet: "Vayra'yı tanımak için.",
  hosgeldin: 50, gunluk: 10, cta: "Ücretsiz başla",
};

/** Kartın kısa etiketi (rozet) ve hedef kitlesi. */
export const PLAN_ETIKET: Record<KartPlanId, { kime: string; rozet?: string }> = {
  ucretsiz: { kime: "İlk kez deneyenler için" },
  baslangic: { kime: "İlk projelerini üretenler için" },
  arti: { kime: "Her gün içerik üretenler için", rozet: "En çok tercih edilen" },
  ultra: { kime: "Yoğun üretim ve stüdyolar için", rozet: "En iyi değer" },
};

/** Kart / karşılaştırma için planın aylık kredisi. Ücretsiz: hoş geldin + 30 gün × günlük. */
export function kartKredi(id: KartPlanId): number {
  return id === "ucretsiz" ? UCRETSIZ.hosgeldin + UCRETSIZ.gunluk * 30 : PLAN_KREDI[id];
}

/** Aynı anda çalışan iş sayısı. */
export const ESZAMANLI: Record<KartPlanId, { video: number; gorsel: number }> = {
  ucretsiz: { video: 1, gorsel: 1 }, baslangic: { video: 2, gorsel: 2 }, arti: { video: 6, gorsel: 8 }, ultra: { video: 8, gorsel: 8 },
};

/** Plan başına sınırsız (kredi düşmeyen) modeller. Model kimliği catalog.MODELLER'den. */
export type SinirsizHak = { model: string; etiket: string };
export const PLAN_SINIRSIZ: Record<KartPlanId, SinirsizHak[]> = {
  ucretsiz: [],
  baslangic: [],
  arti: [{ model: "nano-banana-pro", etiket: "1K · sınırsız" }, { model: "hailuo-23", etiket: "7 gün sınırsız" }],
  ultra: [
    { model: "nano-banana-pro", etiket: "2K · sınırsız" }, { model: "hailuo-23", etiket: "sınırsız" },
    { model: "seedream-5", etiket: "2K · sınırsız" }, { model: "wan-27", etiket: "7 gün sınırsız" },
  ],
};
/** Kartlarda "sınırsız modeller" kutusunda her zaman gösterilen satırlar (yoksa gri ✗). */
export const SINIRSIZ_VITRIN = ["nano-banana-pro", "hailuo-23", "seedream-5"];

/** Modele erişim için gereken en düşük plan. Listede olmayanlar Başlangıç'tan itibaren açıktır. */
const ERISIM_SIRA: KartPlanId[] = ["ucretsiz", "baslangic", "arti", "ultra"];
export const MODEL_MIN_PLAN: Record<string, KartPlanId> = {
  "ruh-2": "ucretsiz", "flux-2": "ucretsiz", "nano-banana-pro": "ucretsiz", "hailuo-23": "ucretsiz", "eleven-tts": "ucretsiz", "vayra-muse-lite": "ucretsiz",
  "veo-31": "arti", "sora-2": "arti", "kling-3": "arti", "eleven-klon": "arti", "meshy-animasyon": "arti", "ruh-sinema": "arti",
  "meshy-metin3d": "arti", "meshy-gorsel3d": "arti", "meshy-doku": "arti",
};
export function modelErisim(modelId: string, plan: KartPlanId): boolean {
  const min = MODEL_MIN_PLAN[modelId] ?? "baslangic";
  return ERISIM_SIRA.indexOf(plan) >= ERISIM_SIRA.indexOf(min);
}
export function sinirsizMi(modelId: string, plan: KartPlanId): SinirsizHak | undefined {
  return PLAN_SINIRSIZ[plan].find((s) => s.model === modelId);
}

/** Kartlardaki özellik listesi — planda olmayanlar gri ve çarpıyla gösterilir. */
export const KART_OZELLIKLERI: { ad: string; d: [boolean, boolean, boolean, boolean]; yeni?: boolean }[] = [
  { ad: "Filigransız, ticari kullanıma açık çıktı", d: [false, true, true, true] },
  { ad: "Tüm görsel modelleri", d: [false, true, true, true] },
  { ad: "Tüm video modelleri (Veo, Sora, Kling)", d: [false, false, true, true] },
  { ad: "3D ve ses stüdyosu", d: [false, false, true, true] },
  { ad: "Sinema ve Pazarlama stüdyosu", d: [false, false, true, true] },
  { ad: "Canvas iş akışları", d: [false, false, true, true], yeni: true },
  { ad: "Kullanılmayan kredi devri", d: [false, false, true, true] },
  { ad: "Öncelikli kuyruk ve erken erişim", d: [false, false, true, true] },
  { ad: "4K çıktı ve Topaz büyütme", d: [false, false, false, true] },
  { ad: "API ve MCP erişimi", d: [false, false, false, true], yeni: true },
];

/* ── Ekip planı: kredi havuzu kaydırıcısı, fiyat kredi başı sabit ── */
export const EKIP = {
  ad: "Ekip", ozet: "Ajanslar ve büyüyen yaratıcı ekipler için ortak çalışma alanı.",
  kademeler: [5000, 10000, 20000, 40000, 80000],
  krediBasinaTL: 0.85, // aylık; yıllıkta YILLIK_INDIRIM uygulanır
  uyeler: "10 üyeye kadar",
  ozellikler: [
    "Ortak kredi havuzu, koltuk başı ücret yok", "Ortak projeler ve marka kitleri", "Üye bazında harcama limiti",
    "Model erişimini yönetici belirler", "Tüm stüdyolar ve modeller", "Öncelikli destek",
  ],
  ozellikDisi: ["SSO ve denetim kayıtları", "Özel sözleşme ve SLA"],
};
export function ekipFiyat(kredi: number, donem: Donem): number {
  const taban = kredi * EKIP.krediBasinaTL;
  return Math.round(donem === "yillik" ? taban * (1 - YILLIK_INDIRIM) : taban);
}
export const KURUMSAL_OZELLIK = [
  "Sözleşmeye özel kredi havuzu", "Sınırsız üye", "SAML SSO ve rol yönetimi", "Denetim kayıtları",
  "Özel model eğitimi", "SLA ve atanmış başarı yöneticisi", "Fatura ile ödeme, e-fatura",
];

export const tl = (n: number) => `₺${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: n < 10 ? 2 : 0 }).format(n)}`;
/** Kredi başına fiyat — her zaman iki kuruş hanesi (₺1,04 · ₺0,88). */
export const tlKurus = (n: number) => `₺${new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}`;
export const sayi = (n: number) => new Intl.NumberFormat("tr-TR").format(n);
