/**
 * Bağlam penceresi (istemci + sunucu): modelin token sınırı ve kaba token tahmini. Sınırlar sağlayıcıların ve
 * OpenRouter'ın model listesinden (2026-11-05). Doluluk yüzde 80'e gelince sunucu eski mesajları özetler.
 */
const SINIR: Record<string, number> = {
  "claude-opus-5-5": 1_000_000, "claude-fable-5-1": 1_000_000, "claude-sonnet-5-5": 1_000_000, "claude-haiku-5-5": 1_000_000,
  "gpt-6-astra": 1_050_000, "gpt-6.1-sol": 1_050_000, "gpt-6.1-terra": 1_050_000, "gpt-6-luna": 1_050_000,
  "gemini-4-argon": 1_048_576, "gemini-3.8-flash": 1_048_576,
  "kimi-k3.1-pro": 1_048_576, "kimi-k3": 1_048_576, "kimi-k2.7-code": 262_144,
  "deepseek-v4-pro": 1_048_576, "deepseek-v4.1-flash": 1_048_576,
  "grok-4.7": 500_000, "grok-build-0.1": 256_000,
  "qwen3.8-max-prime": 1_000_000, "qwen3.8-flash": 1_000_000,
  "glm-5.3-prime": 1_000_000, "glm-5.3": 1_048_576,
  "mistral-large-4": 1_048_576, devstral: 262_144,
  "minimax-m3": 1_048_576, "minimax-m3.1-flash": 1_048_576,
  "mimo-v2.6-pro": 1_050_000, "command-a-plus": 192_000, "llama-4-maverick": 524_288,
};
/** Elle girilen (Özel) modellerde sınır bilinmez: güvenli taraf 128 bin. */
export const baglamSiniri = (modelId?: string | null) => SINIR[modelId ?? ""] ?? 128_000;
export const SIKISTIRMA_ESIGI = 0.8;
/** Türkçe metinde ortalama 3,5 karakter bir token. */
export const tokenTahmini = (karakter: number) => Math.ceil(karakter / 3.5);
export const GORSEL_TOKEN = 1600;
/** Sistem istemi ve araç tanımları için pay (yanıt sırasında model gerçek sayıyı bildirir). */
export const SISTEM_PAYI = 4000;
