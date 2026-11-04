/* Görsel modelleri — görsel stüdyosunun model seçicisi, composer davranışı ve GERÇEK sağlayıcı eşlemesi.
   /modeller kataloğu ve sunucudaki görsel adaptörleri de buradan beslenir (SSR güvenli, anahtar yok).
   Sağlayıcı alanları resmî dokümanlardan doğrulandı (22.10.2026): Gemini Interactions API,
   OpenAI Images, BytePlus ModelArk Seedream, fal.ai kuyruk şemaları. */

/** Görsel stüdyosunun çözünürlük kademeleri (birleşik liste; her model kendi alt kümesini kullanır). */
export const GORSEL_COZUNURLUKLER = ["1K", "1.5K", "2K", "3K", "4K"];

// Model composer davranışı:
//   "standart" → istem + oran/çözünürlük/adet çipleri
//   "swap"     → iki yükleme kutusu (kaynak yüz/karakter + hedef görsel)
//   "flux"     → FLUX.2 Flex: istem + Yönlendirme (guidance) ve adım ayarı (gerçek parametre)
//   "kontext"  → görsel gerektiren düzenleme modeli (referans zorunlu)
//   "recraft"  → istem + Vektör (SVG) + Standart/Pro kalite + palet (gerçek `colors`)
//   "vary"     → Nano Banana ailesi → Çiz çipi
export type ModelTip = "standart" | "swap" | "flux" | "kontext" | "recraft" | "vary";

export type GorselSaglayici = "gemini" | "seedream" | "openai" | "fal";

/** Sağlayıcıya giden gerçek model ve yetenekleri. */
export type GorselApi = {
  saglayici: GorselSaglayici;
  /** Sağlayıcıdaki model kimliği (fal'da metinden görsel uç noktası). */
  model: string;
  /** fal: referans/kaynak görsel varken kullanılan uç nokta. */
  duzenleModel?: string;
  /** fal: vektör (SVG) uç noktası. */
  vektorModel?: string;
  /** fal: "Pro/HD" kalite uç noktası. */
  proModel?: string;
  /** Desteklenen oranlar (composer menüsü bunu süzer). */
  oranlar: string[];
  /** Desteklenen çözünürlük kademeleri (boş: model belirler). */
  cozunurluklar: string[];
  /** Referans görsel sınırı (0: referans almaz). */
  refMax: number;
  /** Referans/kaynak görsel zorunlu mu (düzenleme modelleri). */
  refZorunlu?: boolean;
  tohum?: boolean;
  negatif?: boolean;
  seffaf?: boolean;
  /** OpenAI kalite değerleri. */
  kaliteler?: string[];
  /** fal parametre biçimi. */
  falBicim?: "flux2" | "kontext" | "recraft" | "zimage" | "grok" | "kling" | "wan" | "ideogram";
  /** Vayra'nın stil reçetesi (Ruh modelleri) — istemin önüne eklenir ve bilgi panelinde görünür. */
  recete?: "ruh" | "sinema";
};

export type GorselModel = {
  ad: string;
  ozet: string;
  rozet?: "Yeni" | "Sınırsız";
  grup?: "one" | "tum";
  tip?: ModelTip;
  kredi?: number;
  cizim?: boolean;
  cozunurluk?: boolean;
  kaliteSeviye?: string[];
  sinirsizToggle?: boolean;
  adetGizli?: boolean;
  soul?: boolean;
  varsayilanOran?: string;
  /** Bilgi için: hangi temel modelle çalıştığı (Vayra adlı modellerde dürüstlük). */
  temel?: string;
  /** Yalnız kendi aracında kullanılır (görsel stüdyosu model listesinde görünmez). */
  gizli?: boolean;
  api: GorselApi;
};

const TUM_ORAN = ["9:16", "4:5", "3:4", "2:3", "1:1", "5:4", "4:3", "3:2", "16:9", "21:9"];
const ORAN_8 = ["9:16", "3:4", "2:3", "1:1", "4:3", "3:2", "16:9", "21:9"];
const GEMINI = (model: string, cozunurluklar: string[], o: Partial<GorselApi> = {}): GorselApi =>
  ({ saglayici: "gemini", model, oranlar: TUM_ORAN, cozunurluklar, refMax: 14, ...o });
const SEEDREAM = (model: string, cozunurluklar: string[], refMax: number): GorselApi =>
  ({ saglayici: "seedream", model, oranlar: TUM_ORAN, cozunurluklar, refMax });
const OPENAI_KALITE = ["Düşük", "Orta", "Yüksek"];

export const GORSEL_MODELLER: GorselModel[] = [
  // ── Öne çıkan ──
  { ad: "Vayra Ruh 2.0", ozet: "Ultra-gerçekçi moda görselleri · Nano Banana Pro + Ruh reçetesi", grup: "one", kredi: 4, soul: true, cozunurluk: true, varsayilanOran: "3:4", temel: "Nano Banana Pro",
    api: GEMINI("gemini-3-pro-image", ["1K", "2K", "4K"], { recete: "ruh" }) },
  { ad: "Vayra Ruh Sinema", ozet: "Sinema kalitesinde kare · Nano Banana 2.1 + sinema reçetesi", grup: "one", kredi: 3, soul: true, cozunurluk: true, varsayilanOran: "16:9", temel: "Nano Banana 2.1",
    api: GEMINI("gemini-nano-banana-2.1", ["1K", "2K", "4K"], { recete: "sinema" }) },
  { ad: "Nano Banana 2.1", ozet: "Google'ın en yeni görsel modeli; 14 oran, 4K", rozet: "Yeni", grup: "one", tip: "vary", cizim: true, kredi: 3, cozunurluk: true, varsayilanOran: "3:4",
    api: GEMINI("gemini-nano-banana-2.1", ["1K", "2K", "4K"]) },
  { ad: "Nano Banana Pro", ozet: "Google'ın amiral gemisi; metin ve detayda en iyi", grup: "one", tip: "vary", cizim: true, kredi: 4, cozunurluk: true, varsayilanOran: "3:4",
    api: GEMINI("gemini-3-pro-image", ["1K", "2K", "4K"]) },
  { ad: "GPT Image 2.5", ozet: "OpenAI'nin en yetenekli görsel modeli", rozet: "Yeni", grup: "one", kredi: 8, kaliteSeviye: [...OPENAI_KALITE, "En yüksek"], cozunurluk: true, varsayilanOran: "1:1",
    api: { saglayici: "openai", model: "gpt-image-2.5-sunburst", oranlar: TUM_ORAN, cozunurluklar: ["1K", "2K", "4K"], refMax: 16, seffaf: true, kaliteler: ["low", "medium", "high", "max"] } },
  { ad: "GPT Image 2", ozet: "Neredeyse kusursuz metinle 4K görsel", grup: "one", kredi: 7, kaliteSeviye: OPENAI_KALITE, cozunurluk: true, varsayilanOran: "1:1",
    api: { saglayici: "openai", model: "gpt-image-2", oranlar: TUM_ORAN, cozunurluklar: ["1K", "2K", "4K"], refMax: 16, kaliteler: ["low", "medium", "high"] } },
  { ad: "Seedream 5.0 Pro", ozet: "Akıl yürüten, tutarlı görseller; Türkçe istem", rozet: "Yeni", grup: "one", kredi: 3, cozunurluk: true, varsayilanOran: "3:4",
    api: SEEDREAM("dola-seedream-5-0-pro-260628", ["1K", "1.5K", "2K"], 10) },
  { ad: "Seedream 5.0 lite", ozet: "Hızlı ve uygun; 4K'ya kadar", rozet: "Sınırsız", grup: "one", kredi: 2, cozunurluk: true, sinirsizToggle: true, varsayilanOran: "3:4",
    api: SEEDREAM("seedream-5-0-260128", ["2K", "3K", "4K"], 14) },
  { ad: "FLUX.2 Pro", ozet: "BFL'nin fotogerçekçi modeli; referansla düzenler", grup: "one", kredi: 2, cozunurluk: true, varsayilanOran: "3:4",
    api: { saglayici: "fal", model: "fal-ai/flux-2-pro", duzenleModel: "fal-ai/flux-2-pro/edit", oranlar: TUM_ORAN, cozunurluklar: ["1K", "2K"], refMax: 8, tohum: true, falBicim: "flux2" } },
  { ad: "Recraft V4.1", ozet: "Tasarım, logo ve vektör; gerçek renk paleti", rozet: "Yeni", grup: "one", tip: "recraft", kredi: 1.25, kaliteSeviye: ["Standart", "Pro"], varsayilanOran: "1:1",
    api: { saglayici: "fal", model: "fal-ai/recraft/v4.1/text-to-image", proModel: "fal-ai/recraft/v4.1/pro/text-to-image", vektorModel: "fal-ai/recraft/v4.1/text-to-vector", oranlar: TUM_ORAN, cozunurluklar: [], refMax: 0, falBicim: "recraft" } },

  // ── Tüm modeller ──
  { ad: "Auto", ozet: "Bağlı en iyi model seçilir; hangisi kullanıldı bilgi panelinde yazar", grup: "tum", kredi: 3, cozunurluk: true, varsayilanOran: "1:1",
    api: GEMINI("gemini-nano-banana-2.1", ["1K", "2K"]) },
  { ad: "Nano Banana 2", ozet: "Flash hızında Pro kalite", grup: "tum", tip: "vary", cizim: true, kredi: 3, cozunurluk: true, varsayilanOran: "3:4",
    api: GEMINI("gemini-3.1-flash-image", ["1K", "2K", "4K"]) },
  { ad: "Nano Banana 2 Lite", ozet: "Hızlı, hafif; 1K", grup: "tum", tip: "vary", cizim: true, kredi: 1, varsayilanOran: "3:4",
    api: GEMINI("gemini-3.1-flash-lite-image", ["1K"]) },
  { ad: "Nano Banana", ozet: "Google'ın ilk nesil görsel modeli", grup: "tum", tip: "vary", cizim: true, kredi: 1, varsayilanOran: "3:4",
    api: GEMINI("gemini-2.5-flash-image", [], { refMax: 3 }) },
  { ad: "Vayra Ruh", ozet: "Moda görselleri · Nano Banana 2 + Ruh reçetesi", grup: "tum", kredi: 3, soul: true, cozunurluk: true, varsayilanOran: "3:4", temel: "Nano Banana 2",
    api: GEMINI("gemini-3.1-flash-image", ["1K", "2K", "4K"], { recete: "ruh" }) },
  { ad: "Vayra Yüz Değiştir", ozet: "Hedef görseldeki yüzü kendi fotoğrafınla değiştir", grup: "tum", tip: "swap", kredi: 2, adetGizli: true, varsayilanOran: "3:4", temel: "fal Face Swap",
    api: { saglayici: "fal", model: "fal-ai/face-swap", oranlar: [], cozunurluklar: [], refMax: 2, refZorunlu: true } },
  { ad: "Vayra Karakter LoRA", ozet: "Eğitilmiş karakterinle FLUX üretimi", grup: "tum", gizli: true, kredi: 2, cozunurluk: true, varsayilanOran: "3:4", temel: "FLUX LoRA (fal)",
    api: { saglayici: "fal", model: "fal-ai/flux-lora", oranlar: ["1:1", "3:4", "4:3", "2:3", "3:2", "9:16", "16:9", "4:5"], cozunurluklar: ["1K", "2K"], refMax: 0, tohum: true } },
  { ad: "Vayra Giydir", ozet: "Ürünü seçtiğin model fotoğrafına giydir (sanal deneme)", grup: "tum", tip: "swap", gizli: true, kredi: 3, adetGizli: true, varsayilanOran: "3:4", temel: "FASHN v1.6 (fal)",
    api: { saglayici: "fal", model: "fal-ai/fashn/tryon/v1.6", oranlar: [], cozunurluklar: [], refMax: 2, refZorunlu: true } },
  { ad: "Vayra Karakter Değiştir", ozet: "Hedef görseldeki kişiyi kendi karakterinle değiştir", grup: "tum", tip: "swap", kredi: 4, adetGizli: true, varsayilanOran: "3:4", temel: "Nano Banana Pro",
    api: GEMINI("gemini-3-pro-image", [], { refMax: 2, refZorunlu: true }) },
  { ad: "Seedream 5.0 Flash", ozet: "Seedream 5.0'ın hızlı sürümü", rozet: "Yeni", grup: "tum", kredi: 2, cozunurluk: true, varsayilanOran: "3:4",
    api: SEEDREAM("dola-seedream-5-0-flash-260915", ["1K", "1.5K", "2K"], 10) },
  { ad: "Seedream 4.5", ozet: "ByteDance'in 4K görsel modeli", grup: "tum", kredi: 2, cozunurluk: true, varsayilanOran: "3:4",
    api: SEEDREAM("seedream-4-5-251128", ["2K", "4K"], 14) },
  { ad: "Seedream 4.0", ozet: "Görsel düzenlemede güçlü", grup: "tum", kredi: 1, cozunurluk: true, varsayilanOran: "3:4",
    api: SEEDREAM("seedream-4-0-250828", ["1K", "2K", "4K"], 14) },
  { ad: "GPT Image 1.5", ozet: "Gerçek-renk hassas render; şeffaf arka plan", grup: "tum", kredi: 3, kaliteSeviye: OPENAI_KALITE, varsayilanOran: "1:1",
    api: { saglayici: "openai", model: "gpt-image-1.5", oranlar: ["2:3", "1:1", "3:2"], cozunurluklar: [], refMax: 16, seffaf: true, kaliteler: ["low", "medium", "high"] } },
  { ad: "GPT Image", ozet: "Çok yönlü metinden görsele; şeffaf arka plan", grup: "tum", kredi: 2, kaliteSeviye: OPENAI_KALITE, varsayilanOran: "1:1",
    api: { saglayici: "openai", model: "gpt-image-1", oranlar: ["2:3", "1:1", "3:2"], cozunurluklar: [], refMax: 16, seffaf: true, kaliteler: ["low", "medium", "high"] } },
  { ad: "Ideogram 3", ozet: "Yazı ve tipografide güçlü; stil ve palet", rozet: "Yeni", grup: "tum", kredi: 2, kaliteSeviye: ["Turbo", "Dengeli", "Kalite"], varsayilanOran: "1:1",
    api: { saglayici: "fal", model: "fal-ai/ideogram/v3", oranlar: TUM_ORAN, cozunurluklar: [], refMax: 3, tohum: true, negatif: true, falBicim: "ideogram" } },
  { ad: "Grok Imagine", ozet: "xAI'nin çok yönlü görsel stilleri", grup: "tum", kredi: 1, cozunurluk: true, varsayilanOran: "1:1",
    api: { saglayici: "fal", model: "xai/grok-imagine-image", duzenleModel: "xai/grok-imagine-image/edit", oranlar: ["9:16", "3:4", "2:3", "1:1", "4:3", "3:2", "16:9"], cozunurluklar: ["1K", "2K"], refMax: 3, falBicim: "grok" } },
  { ad: "Recraft V4.1 Utility", ozet: "Düz, eşit ışıkla sade sahneler", grup: "tum", tip: "recraft", kredi: 1.25, varsayilanOran: "1:1",
    api: { saglayici: "fal", model: "fal-ai/recraft/v4.1/utility/text-to-image", oranlar: TUM_ORAN, cozunurluklar: [], refMax: 0, falBicim: "recraft" } },
  { ad: "Z-Image", ozet: "Anında gerçekçi portreler", grup: "tum", kredi: 0.25, varsayilanOran: "3:4",
    api: { saglayici: "fal", model: "fal-ai/z-image/turbo", duzenleModel: "fal-ai/z-image/turbo/image-to-image", oranlar: TUM_ORAN, cozunurluklar: [], refMax: 1, tohum: true, falBicim: "zimage" } },
  { ad: "Kling O3", ozet: "Kling'in fotogerçekçi görsel modeli; 4K", grup: "tum", kredi: 1, cozunurluk: true, varsayilanOran: "3:4",
    api: { saglayici: "fal", model: "fal-ai/kling-image/o3/text-to-image", duzenleModel: "fal-ai/kling-image/o3/image-to-image", oranlar: ORAN_8, cozunurluklar: ["1K", "2K", "4K"], refMax: 10, falBicim: "kling" } },
  { ad: "FLUX.2 Flex", ozet: "Yönlendirme ve adım ayarlı FLUX.2", grup: "tum", tip: "flux", kredi: 3, cozunurluk: true, varsayilanOran: "3:4",
    api: { saglayici: "fal", model: "fal-ai/flux-2-flex", duzenleModel: "fal-ai/flux-2-flex/edit", oranlar: TUM_ORAN, cozunurluklar: ["1K", "2K"], refMax: 8, tohum: true, falBicim: "flux2" } },
  { ad: "FLUX.2 Max", ozet: "FLUX.2'nin en yüksek kalitesi", grup: "tum", kredi: 4, cozunurluk: true, varsayilanOran: "3:4",
    api: { saglayici: "fal", model: "fal-ai/flux-2-max", duzenleModel: "fal-ai/flux-2-max/edit", oranlar: TUM_ORAN, cozunurluklar: ["1K", "2K"], refMax: 8, tohum: true, falBicim: "flux2" } },
  { ad: "Flux Kontext Max", ozet: "Bir görseli talimatla hassas düzenle", grup: "tum", tip: "kontext", kredi: 2, varsayilanOran: "3:4",
    api: { saglayici: "fal", model: "fal-ai/flux-pro/kontext/max", oranlar: ORAN_8, cozunurluklar: [], refMax: 1, refZorunlu: true, tohum: true, falBicim: "kontext" } },
  { ad: "Çoklu Referans", ozet: "Birden çok görseli tek sahnede birleştir (Kontext Max)", grup: "tum", tip: "kontext", kredi: 2, varsayilanOran: "3:4", temel: "Flux Kontext Max",
    api: { saglayici: "fal", model: "fal-ai/flux-pro/kontext/max/multi", oranlar: ORAN_8, cozunurluklar: [], refMax: 4, refZorunlu: true, tohum: true, falBicim: "kontext" } },
  { ad: "WAN 2.2", ozet: "Yüksek sadakatli sinematik görseller", grup: "tum", kredi: 1, varsayilanOran: "3:4",
    api: { saglayici: "fal", model: "fal-ai/wan/v2.2-a14b/text-to-image", duzenleModel: "fal-ai/wan/v2.2-a14b/image-to-image", oranlar: TUM_ORAN, cozunurluklar: [], refMax: 1, tohum: true, negatif: true, falBicim: "wan" } },
];

export const gorselModelBul = (ad: string) => GORSEL_MODELLER.find((m) => m.ad === ad);

// En-boy oranları — dikeyden yataya sıralı; w/h oran ikonunu gerçek orana göre çizer.
export const GORSEL_ORANLAR: { deger: string; w: number; h: number; sinematik?: boolean }[] = [
  { deger: "9:16", w: 9, h: 16 },
  { deger: "4:5", w: 4, h: 5 },
  { deger: "3:4", w: 3, h: 4 },
  { deger: "2:3", w: 2, h: 3 },
  { deger: "1:1", w: 1, h: 1 },
  { deger: "5:4", w: 5, h: 4 },
  { deger: "4:3", w: 4, h: 3 },
  { deger: "3:2", w: 3, h: 2 },
  { deger: "16:9", w: 16, h: 9, sinematik: true },
  { deger: "21:9", w: 21, h: 9, sinematik: true },
];

/** Çözünürlüğe göre kredi çarpanı (4K ~2×, 3K ~1.5×). */
export const cozunurlukCarpani = (c?: string) => (c === "4K" ? 2 : c === "3K" ? 1.5 : 1);

/** Modelin bu oran/çözünürlükte üreteceği yaklaşık piksel boyutu (bilgi ve sağlayıcı parametresi için). */
export function gorselBoyut(oran: string, cozunurluk?: string): { w: number; h: number } {
  const [a, b] = oran.split(":").map(Number);
  const r = a && b ? a / b : 1;
  const kenar = { "1K": 1024, "1.5K": 1536, "2K": 2048, "3K": 3072, "4K": 4096 }[cozunurluk ?? "1K"] ?? 1024;
  const alan = kenar * kenar;
  const h = Math.sqrt(alan / r), w = h * r;
  const yuvarla = (n: number) => Math.max(16, Math.round(n / 16) * 16);
  return { w: yuvarla(w), h: yuvarla(h) };
}
