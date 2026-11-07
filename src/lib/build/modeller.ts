/**
 * Vayra Build model kataloğu (istemci + sunucu). Kimlikler sağlayıcıların ve OpenRouter'ın canlı
 * model listesinden alındı (2026-11-05); hepsi araç çağırmayı (tool calling) destekler.
 *  dogrudan: sağlayıcının kendi API'sindeki kimlik (anahtar varsa doğrudan gidilir)
 *  or:       OpenRouter kimliği (OPENROUTER_API_KEY varsa tek anahtarla bütün modeller)
 *  fiyat:    milyon token başına USD (girdi / çıktı); krediye 1 kredi = 0,02 USD ile çevrilir
 */
export type BuildSaglayici = "anthropic" | "openai" | "google" | "moonshot" | "deepseek" | "xai" | "qwen" | "zai" | "mistral" | "minimax" | "xiaomi" | "cohere" | "meta";

export type BuildModel = {
  id: string;
  ad: string;
  saglayici: BuildSaglayici;
  alt: string;
  dogrudan?: string;
  or?: string;
  fiyat: [number, number];
  /** 1-5: kod kalitesi ve hız (seçicideki çubuklar). */
  zeka: number;
  hiz: number;
  gorsel: boolean;
  /** Seçicinin üstünde, "Önerilen" grubunda. */
  one?: boolean;
};

export const SAGLAYICILAR: Record<BuildSaglayici, { ad: string; logo: string; anahtar?: string; tek?: boolean }> = {
  anthropic: { ad: "Anthropic", logo: "/marka/renkli/claude-color.svg", anahtar: "ANTHROPIC_API_KEY" },
  openai: { ad: "OpenAI", logo: "/marka/renkli/openai.svg", anahtar: "OPENAI_API_KEY", tek: true },
  google: { ad: "Google", logo: "/marka/renkli/gemini-color.svg", anahtar: "GEMINI_API_KEY" },
  moonshot: { ad: "Moonshot AI", logo: "/marka/renkli/kimi-color.svg", anahtar: "MOONSHOT_API_KEY" },
  deepseek: { ad: "DeepSeek", logo: "/marka/renkli/deepseek-color.svg", anahtar: "DEEPSEEK_API_KEY" },
  xai: { ad: "xAI", logo: "/marka/renkli/grok.svg", anahtar: "XAI_API_KEY", tek: true },
  qwen: { ad: "Alibaba Qwen", logo: "/marka/renkli/qwen-color.svg" },
  zai: { ad: "Z.ai", logo: "/marka/renkli/zai.svg", tek: true },
  mistral: { ad: "Mistral AI", logo: "/marka/renkli/mistral-color.svg" },
  minimax: { ad: "MiniMax", logo: "/marka/renkli/minimax-color.svg" },
  xiaomi: { ad: "Xiaomi", logo: "/marka/renkli/xiaomi.svg" },
  cohere: { ad: "Cohere", logo: "/marka/renkli/cohere-color.svg" },
  meta: { ad: "Meta", logo: "/marka/renkli/meta-color.svg" },
};

export const BUILD_MODELLERI: BuildModel[] = [
  { id: "claude-opus-5-5", ad: "Claude Opus 5.5", saglayici: "anthropic", alt: "Varsayılan. Büyük projeler, temiz mimari, en az hata", or: "anthropic/claude-opus-5.5", fiyat: [4, 20], zeka: 5, hiz: 3, gorsel: true, one: true },
  { id: "claude-fable-5-1", ad: "Claude Fable 5.1", saglayici: "anthropic", alt: "En yetenekli Claude; zor oyun mantığı ve uzun işler", or: "anthropic/claude-fable-5.1", fiyat: [8, 40], zeka: 5, hiz: 2, gorsel: true },
  { id: "claude-sonnet-5-5", ad: "Claude Sonnet 5.5", saglayici: "anthropic", alt: "Hızlı ve güçlü; günlük değişikliklerin çoğu", or: "anthropic/claude-sonnet-5.5", fiyat: [2, 10], zeka: 4, hiz: 4, gorsel: true, one: true },
  { id: "claude-haiku-5-5", ad: "Claude Haiku 5.5", saglayici: "anthropic", alt: "En hızlı Claude; küçük düzeltmeler", or: "anthropic/claude-haiku-5.5", fiyat: [0.1, 0.5], zeka: 3, hiz: 5, gorsel: true },
  { id: "gpt-6-astra", ad: "GPT-6 Astra", saglayici: "openai", alt: "OpenAI'ın amiral modeli; karmaşık uygulamalar", dogrudan: "gpt-6-astra", or: "openai/gpt-6-astra", fiyat: [5, 25], zeka: 5, hiz: 3, gorsel: true, one: true },
  { id: "gpt-6.1-sol", ad: "GPT-6.1 Sol", saglayici: "openai", alt: "Güçlü ve dengeli", dogrudan: "gpt-6.1-sol", or: "openai/gpt-6.1-sol", fiyat: [2, 10], zeka: 5, hiz: 3, gorsel: true },
  { id: "gpt-6.1-terra", ad: "GPT-6.1 Terra", saglayici: "openai", alt: "Hızlı ve ekonomik", dogrudan: "gpt-6.1-terra", or: "openai/gpt-6.1-terra", fiyat: [1, 5], zeka: 4, hiz: 4, gorsel: true },
  { id: "gpt-6-luna", ad: "GPT-6 Luna", saglayici: "openai", alt: "En hafif GPT; küçük işler", dogrudan: "gpt-6-luna", or: "openai/gpt-6-luna", fiyat: [0.3, 1.5], zeka: 3, hiz: 5, gorsel: true },
  { id: "gemini-4-argon", ad: "Gemini 4 Argon", saglayici: "google", alt: "Google'ın en yetenekli modeli; çok modlu, uzun bağlam", dogrudan: "gemini-4-argon", or: "google/gemini-4-argon", fiyat: [2, 10], zeka: 5, hiz: 3, gorsel: true, one: true },
  { id: "gemini-3.8-flash", ad: "Gemini 3.8 Flash", saglayici: "google", alt: "Hızlı arayüz işleri", dogrudan: "gemini-3.8-flash", or: "google/gemini-3.8-flash", fiyat: [0.83, 4.13], zeka: 4, hiz: 5, gorsel: true },
  { id: "kimi-k3.1-pro", ad: "Kimi K3.1 Pro", saglayici: "moonshot", alt: "Moonshot'un en yeni modeli; ajan ve kod işlerinde güçlü", dogrudan: "kimi-k3.1-pro", or: "moonshotai/kimi-k3.1-pro", fiyat: [2, 10], zeka: 5, hiz: 3, gorsel: true, one: true },
  { id: "kimi-k3", ad: "Kimi K3", saglayici: "moonshot", alt: "Açık ağırlıklı dev model", dogrudan: "kimi-k3", or: "moonshotai/kimi-k3", fiyat: [0.19, 16], zeka: 5, hiz: 3, gorsel: true },
  { id: "kimi-k2.7-code", ad: "Kimi K2.7 Code", saglayici: "moonshot", alt: "Koda özel, ekonomik", dogrudan: "kimi-k2.7-code", or: "moonshotai/kimi-k2.7-code", fiyat: [0.6, 3.5], zeka: 4, hiz: 4, gorsel: false },
  { id: "deepseek-v4-pro", ad: "DeepSeek V4 Pro", saglayici: "deepseek", alt: "Derin akıl yürütme, çok düşük fiyat", dogrudan: "deepseek-v4-pro", or: "deepseek/deepseek-v4-pro", fiyat: [0.11, 4.28], zeka: 5, hiz: 3, gorsel: false, one: true },
  { id: "deepseek-v4.1-flash", ad: "DeepSeek V4.1 Flash", saglayici: "deepseek", alt: "Neredeyse bedava, hızlı", dogrudan: "deepseek-flash", or: "deepseek/deepseek-v4.1-flash", fiyat: [0.04, 0.5], zeka: 4, hiz: 5, gorsel: true },
  { id: "grok-4.7", ad: "Grok 4.7", saglayici: "xai", alt: "xAI'ın en yeni modeli; kod ve ajan işleri", dogrudan: "grok-4.7", or: "x-ai/grok-4.7", fiyat: [2, 6], zeka: 5, hiz: 4, gorsel: true, one: true },
  { id: "grok-build-0.1", ad: "Grok Build 0.1", saglayici: "xai", alt: "Uygulama yapımına özel", dogrudan: "grok-build-0.1", or: "x-ai/grok-build-0.1", fiyat: [1, 2], zeka: 4, hiz: 4, gorsel: false },
  { id: "qwen3.8-max-prime", ad: "Qwen 3.8 Max Prime", saglayici: "qwen", alt: "Alibaba'nın en güçlü modeli", or: "qwen/qwen3.8-max-prime", fiyat: [4, 12], zeka: 5, hiz: 3, gorsel: false, one: true },
  { id: "qwen3.8-flash", ad: "Qwen 3.8 Flash", saglayici: "qwen", alt: "Hızlı ve ucuz", or: "qwen/qwen3.8-flash", fiyat: [0.15, 0.47], zeka: 3, hiz: 5, gorsel: false },
  { id: "glm-5.3-prime", ad: "GLM 5.3 Prime", saglayici: "zai", alt: "Uzun soluklu kod işleri", or: "z-ai/glm-5.3-prime", fiyat: [2.8, 8.8], zeka: 5, hiz: 3, gorsel: false, one: true },
  { id: "glm-5.3", ad: "GLM 5.3", saglayici: "zai", alt: "Açık ağırlıklı, ekonomik", or: "z-ai/glm-5.3", fiyat: [0.07, 1.4], zeka: 4, hiz: 4, gorsel: false },
  { id: "mistral-large-4", ad: "Mistral Large 4", saglayici: "mistral", alt: "Avrupa'nın amiral modeli", or: "mistralai/mistral-large-4-0", fiyat: [0.7, 2.1], zeka: 4, hiz: 4, gorsel: true },
  { id: "devstral", ad: "Devstral", saglayici: "mistral", alt: "Mistral'in kod ajanı modeli", or: "mistralai/devstral-2512", fiyat: [0.4, 2], zeka: 4, hiz: 4, gorsel: false },
  { id: "minimax-m3", ad: "MiniMax M3", saglayici: "minimax", alt: "Ajan işlerinde güçlü, uygun fiyat", or: "minimax/minimax-m3", fiyat: [0.3, 1.2], zeka: 4, hiz: 4, gorsel: false },
  { id: "minimax-m3.1-flash", ad: "MiniMax M3.1 Flash", saglayici: "minimax", alt: "En yeni MiniMax, hızlı", or: "minimax/minimax-m3.1-flash", fiyat: [0.15, 0.6], zeka: 3, hiz: 5, gorsel: false },
  { id: "mimo-v2.6-pro", ad: "MiMo V2.6 Pro", saglayici: "xiaomi", alt: "Xiaomi'nin akıl yürüten modeli", or: "xiaomi/mimo-v2.6-pro", fiyat: [0.43, 0.87], zeka: 4, hiz: 4, gorsel: false },
  { id: "command-a-plus", ad: "Command A Plus", saglayici: "cohere", alt: "Kurumsal işler", or: "cohere/command-a-plus", fiyat: [0.3, 1.5], zeka: 3, hiz: 4, gorsel: false },
  { id: "llama-4-maverick", ad: "Llama 4 Maverick", saglayici: "meta", alt: "Meta'nın açık modeli", or: "meta-llama/llama-4-maverick", fiyat: [0.35, 1], zeka: 3, hiz: 4, gorsel: true },
];

export const VARSAYILAN_MODEL = "claude-opus-5-5";
const ONEK: Record<string, BuildSaglayici> = { openai: "openai", google: "google", moonshotai: "moonshot", deepseek: "deepseek", "x-ai": "xai", qwen: "qwen", "z-ai": "zai", mistralai: "mistral", minimax: "minimax", xiaomi: "xiaomi", cohere: "cohere", "meta-llama": "meta" };

/**
 * Kimlikten model. "ozel:<openrouter-kimliği>" kullanıcının elle girdiği modeldir (OpenRouter'daki her model);
 * fiyatı bilinmediği için orta bir değerle sayılır. Claude her zaman yerleşik (Anthropic SDK) modellerden gelir.
 */
export function modelBul(id?: string | null): BuildModel {
  if (id?.startsWith("ozel:")) {
    const or = id.slice(5);
    const onek = or.split("/")[0];
    if (/^[a-z0-9._-]+\/[a-z0-9._:-]+$/i.test(or) && onek !== "anthropic") {
      return { id, ad: or.split("/").pop()!, saglayici: ONEK[onek] ?? "meta", alt: "Özel model (OpenRouter)", or, fiyat: [2, 10], zeka: 4, hiz: 3, gorsel: true };
    }
  }
  return BUILD_MODELLERI.find((m) => m.id === id) ?? BUILD_MODELLERI[0];
}

/** Kullanım → kredi (1 kredi = 0,02 USD, yukarı yuvarlanır; en az 1). Önbellekten okunan girdi onda bir fiyatla sayılır. */
export function krediHesapla(m: BuildModel, u: { girdi: number; cikti: number; onbellek?: number; yazilan?: number }): number {
  const [gi, ci] = m.fiyat;
  const usd = (u.girdi * gi + u.cikti * ci + (u.onbellek ?? 0) * gi * 0.1 + (u.yazilan ?? 0) * gi * 1.25) / 1e6;
  return usd > 0 ? Math.max(1, Math.ceil(usd / 0.02)) : 0;
}

/** Turdan önce gösterilen tahmin (kredi). Opus 5.5 çıktı fiyatına göre ölçeklenir; ucuz modellerde düşer. */
export function krediTahmini(mod: "yap" | "plan" | "sohbet", dosyaSayisi: number, m: BuildModel): number {
  const taban = mod === "sohbet" ? 0.5 : mod === "plan" ? 1 : !dosyaSayisi ? 8 : Math.min(6, 1.5 + dosyaSayisi * 0.3);
  return Math.max(1, Math.round(taban * (m.fiyat[1] / 20)));
}
