import { MODELLER } from "@/lib/catalog";

/** Vayra MCP sunucusunun kimliği ve desteklediği protokol sürümleri (en yenisi önce). */
export const MCP_SUNUCU = { name: "vayra", title: "Vayra", version: "1.0.0" };
export const MCP_SURUMLER = ["2025-06-18", "2025-03-26", "2024-11-05"];

export interface McpArac {
  name: string;
  title: string;
  description: string;
  inputSchema: { type: "object"; properties: Record<string, unknown>; required?: string[]; additionalProperties?: boolean };
  annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean; idempotentHint?: boolean; openWorldHint?: boolean };
}

const MODEL_IDLERI = MODELLER.map((m) => m.id);
const TURLER = ["image", "video", "audio", "music", "3d"];

/** Ajanın göreceği araçlar — açıklamalar modelin doğru aracı seçmesi için yazıldı. */
export const MCP_ARACLAR: McpArac[] = [
  {
    name: "list_models", title: "Modelleri listele",
    description: "Vayra'daki üretim modellerini (görsel, video, ses, müzik, 3D) kimlik, tür ve kredi bedeliyle listeler. Hangi modeli kullanacağını seçmeden önce çağır.",
    inputSchema: { type: "object", properties: { type: { type: "string", enum: TURLER, description: "Yalnız bu türdeki modeller." } }, additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "get_model", title: "Model ayrıntısı",
    description: "Bir modelin girdi şemasını (prompt, oran, süre, çözünürlük … alanları, varsayılanları ve sınırları) döndürür. generate çağrısındaki input nesnesini buna göre kur.",
    inputSchema: { type: "object", properties: { model: { type: "string", enum: MODEL_IDLERI, description: "Model kimliği, ör. nano-banana-pro." } }, required: ["model"], additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "generate", title: "Üret",
    description: "Seçilen modelle görsel, video, ses, müzik ya da 3D üretir ve kredi harcar. wait=true (varsayılan) üretim bitene kadar en çok yaklaşık 55 sn bekler ve çıktı adreslerini döndürür; uzun videolarda wait=false verip get_generation ile durumu sorgula.",
    inputSchema: {
      type: "object",
      properties: {
        model: { type: "string", enum: MODEL_IDLERI, description: "Model kimliği." },
        input: { type: "object", description: "Modele özgü girdiler; en az { \"prompt\": \"…\" }. Alanlar için get_model.", properties: { prompt: { type: "string" } }, required: ["prompt"] },
        wait: { type: "boolean", default: true, description: "Bitene kadar bekle." },
        metadata: { type: "object", description: "Üretime iliştirilecek en çok 16 anahtar." },
      },
      required: ["model", "input"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  {
    name: "get_generation", title: "Üretimi getir",
    description: "Bir üretimin durumunu, kredi bedelini ve tamamlandıysa çıktı adreslerini döndürür.",
    inputSchema: { type: "object", properties: { id: { type: "string", description: "gen_ ile başlayan üretim kimliği." } }, required: ["id"], additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "list_generations", title: "Üretimleri listele",
    description: "Bu anahtarla son 24 saatte başlatılan üretimleri yeniden eskiye listeler.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        status: { type: "string", enum: ["queued", "processing", "succeeded", "failed", "canceled"] },
        model: { type: "string", enum: MODEL_IDLERI },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "cancel_generation", title: "Üretimi iptal et",
    description: "Kuyrukta ya da işlenmekte olan bir üretimi durdurur; kredisi iade edilir. Bitmiş üretimler iptal edilemez.",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"], additionalProperties: false },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "get_account", title: "Hesap ve bakiye",
    description: "Anahtarın ortamını (canlı/test), kullanılabilir krediyi, aylık sınırı ve bu ay harcananı döndürür.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
];
