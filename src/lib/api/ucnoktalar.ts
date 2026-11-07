/**
 * Uç nokta kataloğu — Dokümantasyon, Konsol ve Örnekler bu listeden beslenir.
 * Yollar `/v1` köküne görelidir; gerçek adres `${origin}/api/v1`.
 */

import { UST_ALANLAR, type Alan } from "./sema";

export type Yontem = "GET" | "POST" | "PUT" | "DELETE";

export interface UcNokta {
  id: string;
  grup: string;
  yontem: Yontem;
  yol: string;
  ad: string;
  ozet: string;
  kapsam: "yok" | "read" | "generate" | "full";
  yolParam?: Alan[];
  sorgu?: Alan[];
  govde?: Alan[];
  ornekGovde?: Record<string, unknown>;
  ornekYanit: unknown;
  yanitKodu: number;
  hatalar: string[];
  notlar?: string[];
}

const GEN_ORNEK = {
  id: "gen_8f2c1a9b3d4e5f6a7b8c9d0e",
  object: "generation",
  model: "nano-banana-pro",
  type: "image",
  status: "succeeded",
  input: { prompt: "Kapadokya üzerinde gün doğumunda sıcak hava balonları", aspect_ratio: "16:9", resolution: "2K", num_images: 1 },
  output: { urls: ["https://vayra.ai/api/v1/files/gen_8f2c1a9b3d4e5f6a7b8c9d0e/0"], content_type: "image/png" },
  error: null,
  credits: 5,
  environment: "live",
  simulated: false,
  provider: "gemini",
  metadata: { siparis: "A-1042" },
  webhook_url: null,
  created_at: "2026-10-20T09:41:07.112Z",
  started_at: "2026-10-20T09:41:07.604Z",
  completed_at: "2026-10-20T09:41:11.930Z",
  metrics: { queue_ms: 492, run_ms: 4326 },
  urls: { get: "https://vayra.ai/api/v1/generations/gen_8f2c…", cancel: "https://vayra.ai/api/v1/generations/gen_8f2c…/cancel" },
};

const ID: Alan = { ad: "id", tip: "string", zorunlu: true, aciklama: "Üretim kimliği (gen_…)." };

export const UC_NOKTALAR: UcNokta[] = [
  {
    id: "uretim-olustur", grup: "Üretimler", yontem: "POST", yol: "/generations", ad: "Üretim başlat",
    ozet: "Bir modelle görsel, video, ses, müzik ya da 3D üretimi başlatır. Yanıt hemen döner (201, status: queued); sonucu durum sorgusu, webhook ya da `sync: true` ile alırsın.",
    kapsam: "generate", govde: UST_ALANLAR,
    ornekGovde: { model: "nano-banana-pro", input: { prompt: "Kapadokya üzerinde gün doğumunda sıcak hava balonları", aspect_ratio: "16:9" }, metadata: { siparis: "A-1042" } },
    ornekYanit: { ...GEN_ORNEK, status: "queued", output: null, started_at: null, completed_at: null, metrics: { queue_ms: null, run_ms: null } },
    yanitKodu: 201,
    hatalar: ["parameter_missing", "parameter_invalid", "model_not_found", "content_policy_violation", "insufficient_credits", "spend_limit_reached", "idempotency_conflict", "rate_limit_exceeded"],
    notlar: [
      "Idempotency-Key başlığı gönderirsen aynı istek 24 saat içinde tekrarlandığında yeni üretim açılmaz, ilki döner (idempotent-replayed: true).",
      "Kredi üretim tamamlandığında kesinleşir; başarısız ya da iptal edilen üretimin kredisi iade edilir.",
      "Test anahtarıyla (vy_test_…) yapılan üretimler kredi harcamaz ve örnek çıktı döndürür.",
    ],
  },
  {
    id: "uretim-getir", grup: "Üretimler", yontem: "GET", yol: "/generations/{id}", ad: "Üretimi getir",
    ozet: "Üretimin güncel durumunu ve tamamlandıysa çıktı adreslerini döndürür. Durum sırasıyla queued, processing, ardından succeeded, failed ya da canceled olur.",
    kapsam: "read", yolParam: [ID], ornekYanit: GEN_ORNEK, yanitKodu: 200, hatalar: ["resource_not_found"],
    notlar: ["Sorgulamayı 1–2 saniye aralıkla yap; uzun işlerde webhook daha verimli.", "Üretim kayıtları 24 saat saklanır. Çıktıları kendi depolamana kopyala."],
  },
  {
    id: "uretim-listele", grup: "Üretimler", yontem: "GET", yol: "/generations", ad: "Üretimleri listele",
    ozet: "Bu anahtarla yapılan üretimleri yeniden eskiye listeler. İmleç tabanlı sayfalama.",
    kapsam: "read",
    sorgu: [
      { ad: "limit", tip: "integer", min: 1, max: 100, varsayilan: 20, aciklama: "Sayfa boyutu." },
      { ad: "status", tip: "enum", secenekler: ["queued", "processing", "succeeded", "failed", "canceled"], aciklama: "Duruma göre süz." },
      { ad: "model", tip: "string", aciklama: "Modele göre süz." },
      { ad: "starting_after", tip: "string", aciklama: "Önceki sayfanın `next_cursor` değeri." },
    ],
    ornekYanit: { object: "list", data: [GEN_ORNEK], has_more: true, next_cursor: "gen_8f2c1a9b3d4e5f6a7b8c9d0e" },
    yanitKodu: 200, hatalar: [],
  },
  {
    id: "uretim-iptal", grup: "Üretimler", yontem: "POST", yol: "/generations/{id}/cancel", ad: "Üretimi iptal et",
    ozet: "Kuyrukta ya da işlenmekte olan bir üretimi durdurur ve kredisini iade eder.",
    kapsam: "generate", yolParam: [ID],
    ornekYanit: { ...GEN_ORNEK, status: "canceled", output: null, credits: 0 }, yanitKodu: 200, hatalar: ["resource_not_found", "not_cancelable"],
  },
  {
    id: "model-listele", grup: "Modeller", yontem: "GET", yol: "/models", ad: "Modelleri listele",
    ozet: "Kullanılabilir tüm modelleri girdi şemalarıyla birlikte döndürür.",
    kapsam: "read", sorgu: [{ ad: "type", tip: "enum", secenekler: ["image", "video", "audio", "music", "3d"], aciklama: "Türe göre süz." }],
    ornekYanit: { object: "list", total: 1, data: [{ id: "nano-banana-pro", object: "model", name: "Nano Banana Pro", type: "image", provider: "Google", credits: 5, pricing: "per_image", input_schema: [{ name: "prompt", type: "string", required: true }] }] },
    yanitKodu: 200, hatalar: [],
  },
  {
    id: "model-getir", grup: "Modeller", yontem: "GET", yol: "/models/{id}", ad: "Modeli getir",
    ozet: "Tek bir modelin ayrıntısı ve tam girdi şeması (tür, zorunluluk, varsayılan, izinli değerler, aralık).",
    kapsam: "read", yolParam: [{ ad: "id", tip: "string", zorunlu: true, aciklama: "Model kimliği." }],
    ornekYanit: { id: "nano-banana-pro", object: "model", name: "Nano Banana Pro", type: "image", provider: "Google", credits: 5, pricing: "per_image", capabilities: ["Metin", "Yüksek çözünürlük"], input_schema: [{ name: "prompt", type: "string", required: true, description: "Üretilecek görselin tanımı." }, { name: "aspect_ratio", type: "enum", required: false, default: "1:1", enum: ["1:1", "16:9", "9:16"] }] },
    yanitKodu: 200, hatalar: ["model_not_found"],
  },
  {
    id: "hesap", grup: "Hesap", yontem: "GET", yol: "/account", ad: "Hesap ve bakiye",
    ozet: "Anahtarın ortamını, kapsamını, kullanılabilir krediyi, aylık harcamayı ve hız limitini döndürür.",
    kapsam: "read",
    ornekYanit: { object: "account", key: { id: "key_3fa91c0d2b7e4a18", name: "Üretim sunucusu", environment: "live", scope: "full", expires_at: null }, credits: { available: 1840, monthly_limit: 5000, spent_this_month: 312 }, rate_limit: { requests_per_minute: 60 } },
    yanitKodu: 200, hatalar: [],
  },
  {
    id: "teslimler", grup: "Webhook'lar", yontem: "GET", yol: "/webhooks/deliveries", ad: "Teslim günlüğü",
    ozet: "Bu anahtarın olayları için yapılan webhook teslimlerini ve her denemenin HTTP sonucunu listeler.",
    kapsam: "full", sorgu: [{ ad: "limit", tip: "integer", min: 1, max: 200, varsayilan: 50, aciklama: "Kayıt sayısı." }],
    ornekYanit: { object: "list", data: [{ id: "dlv_1a2b3c4d5e6f7a8b", event: "generation.completed", url: "https://ornek.com/vayra/webhook", state: "succeeded", attempts: [{ at: "2026-10-20T09:41:12.010Z", status: 200, duration_ms: 184, error: null }] }] },
    yanitKodu: 200, hatalar: ["insufficient_scope"],
  },
  {
    id: "teslim-yeniden", grup: "Webhook'lar", yontem: "POST", yol: "/webhooks/deliveries/{id}/redeliver", ad: "Teslimi yeniden gönder",
    ozet: "Kayıtlı bir teslimi aynı gövde, olay kimliği ve imzayla yeniden gönderir. Uç noktan bir süre kapalı kaldıysa kaçırılan olayları böyle tamamlarsın; deneme teslimin geçmişine eklenir.",
    kapsam: "full", yolParam: [{ ad: "id", tip: "string", zorunlu: true, aciklama: "Teslim kimliği (dlv_…)." }],
    ornekYanit: { object: "delivery", id: "dlv_1a2b3c4d5e6f7a8b", event: "generation.completed", state: "succeeded", attempts: [{ at: "2026-10-20T09:41:12.010Z", status: 503, duration_ms: 10000, error: "HTTP 503" }, { at: "2026-10-20T10:02:40.118Z", status: 200, duration_ms: 176, error: null }] },
    yanitKodu: 200, hatalar: ["resource_not_found", "insufficient_scope"],
  },
  {
    id: "webhook-test", grup: "Webhook'lar", yontem: "POST", yol: "/webhooks/test", ad: "Test olayı gönder",
    ozet: "Verilen adrese imzalı örnek bir olay gönderir ve uç noktanın yanıtını döndürür.",
    kapsam: "full",
    govde: [
      { ad: "url", tip: "uri", zorunlu: true, aciklama: "Olayın gönderileceği adres." },
      { ad: "secret", tip: "string", zorunlu: true, aciklama: "İmza sırrı (whsec_…)." },
      { ad: "event", tip: "enum", secenekler: ["generation.completed", "generation.failed", "generation.started", "generation.canceled", "credits.low"], varsayilan: "generation.completed", aciklama: "Olay türü." },
    ],
    ornekGovde: { url: "https://ornek.com/vayra/webhook", secret: "whsec_…", event: "generation.completed" },
    ornekYanit: { object: "delivery_attempt", event: "generation.completed", ok: true, status: 200, duration_ms: 212, error: null, response: "ok" },
    yanitKodu: 200, hatalar: ["parameter_invalid", "insufficient_scope"],
  },
  {
    id: "anahtar-iptal", grup: "Anahtarlar", yontem: "DELETE", yol: "/keys/self", ad: "Anahtarı iptal et",
    ozet: "İsteği yapan anahtarı kalıcı olarak iptal eder. Sızdığını düşündüğün bir anahtarı kodundan da kapatabilirsin.",
    kapsam: "read", ornekYanit: { id: "key_3fa91c0d2b7e4a18", object: "key", revoked: true }, yanitKodu: 200, hatalar: [],
  },
  {
    id: "ping", grup: "Sistem", yontem: "GET", yol: "/ping", ad: "Sağlık kontrolü",
    ozet: "API'nin ayakta olduğunu doğrular. Kimlik gerektirmez, hız limitine sayılmaz.",
    kapsam: "yok", ornekYanit: { ok: true, service: "vayra-api", version: "v1", time: "2026-10-20T09:41:07.112Z" }, yanitKodu: 200, hatalar: [],
  },
];

export const UC_GRUPLARI = Array.from(new Set(UC_NOKTALAR.map((u) => u.grup)));
export const ucBul = (id: string) => UC_NOKTALAR.find((u) => u.id === id);

export const YONTEM_RENK: Record<Yontem, string> = {
  GET: "text-emerald-300 bg-emerald-400/10 ring-emerald-400/25",
  POST: "text-sky-300 bg-sky-400/10 ring-sky-400/25",
  PUT: "text-amber-300 bg-amber-400/10 ring-amber-400/25",
  DELETE: "text-rose-300 bg-rose-400/10 ring-rose-400/25",
};
