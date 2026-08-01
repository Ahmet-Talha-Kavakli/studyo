/**
 * AI asistan tool tanımları — Claude'a gönderilen şemalar.
 * READ tool'lar sunucuda doğrudan çalışır (onaysız).
 * WRITE tool'lar frontend'de kademeli onaydan geçer (roller.ts risk).
 */

export interface ToolTanim {
  name: string;
  description: string;
  input_schema: { type: "object"; properties: Record<string, unknown>; required?: string[] };
  yaz: boolean; // true = write (onay gerekir)
}

export const TOOLLAR: ToolTanim[] = [
  // ── READ (serbest) ──
  {
    name: "kullanici_bul", yaz: false,
    description: "Ada, e-postaya, ID'ye veya duruma göre kullanıcı arar. Sonuç listesi döner.",
    input_schema: { type: "object", properties: { sorgu: { type: "string", description: "Arama metni (ad/email/ID)" }, durum: { type: "string", description: "aktif/banli/askida vb (opsiyonel)" } }, required: ["sorgu"] },
  },
  {
    name: "kullanici_detay", yaz: false,
    description: "Bir kullanıcının tam detayını döner: plan, kredi, harcama, güven skoru, durum.",
    input_schema: { type: "object", properties: { kullaniciId: { type: "string" } }, required: ["kullaniciId"] },
  },
  {
    name: "gelir_ozet", yaz: false,
    description: "Genel gelir özeti: MRR, ARR, net kâr, marj, churn, ARPU, LTV/CAC.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "job_ozet", yaz: false,
    description: "Job/üretim istatistikleri: toplam, 24s, başarı oranı, kuyruk, ortalama süre.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "model_marj", yaz: false,
    description: "Model başına marj analizi — hangi modeller para kazandırıyor/kaybettiriyor.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "en_cok_harcayan", yaz: false,
    description: "En çok kredi harcayan kullanıcıları listeler.",
    input_schema: { type: "object", properties: { adet: { type: "number", description: "Kaç kullanıcı (varsayılan 10)" } } },
  },
  // ── WRITE (onay gerekir) ──
  {
    name: "kredi_ekle", yaz: true,
    description: "Bir kullanıcıya kredi ekler. Sebep zorunlu. Onay gerektirir.",
    input_schema: { type: "object", properties: { kullaniciId: { type: "string" }, miktar: { type: "number" }, sebep: { type: "string" } }, required: ["kullaniciId", "miktar", "sebep"] },
  },
  {
    name: "plan_degistir", yaz: true,
    description: "Kullanıcının planını değiştirir (baslangic/arti/ultra/kurumsal). Onay gerektirir.",
    input_schema: { type: "object", properties: { kullaniciId: { type: "string" }, plan: { type: "string" } }, required: ["kullaniciId", "plan"] },
  },
  {
    name: "kullanici_banla", yaz: true,
    description: "Bir kullanıcıyı banlar. YÜKSEK RİSK — çift onay gerektirir.",
    input_schema: { type: "object", properties: { kullaniciId: { type: "string" }, sebep: { type: "string" } }, required: ["kullaniciId"] },
  },
  {
    name: "kupon_olustur", yaz: true,
    description: "İndirim veya bonus kredi kuponu oluşturur. Onay gerektirir.",
    input_schema: { type: "object", properties: { kod: { type: "string" }, tur: { type: "string", description: "yuzde/bonus_kredi" }, deger: { type: "number" } }, required: ["kod", "tur", "deger"] },
  },
];

/** Claude API'ye gönderilecek tool listesi (yaz alanı çıkarılır). */
export function claudeToollar() {
  return TOOLLAR.map(({ name, description, input_schema }) => ({ name, description, input_schema }));
}

export function toolBul(name: string) {
  return TOOLLAR.find((t) => t.name === name);
}
