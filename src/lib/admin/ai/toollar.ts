/**
 * Yönetim asistanının araç tanımları (Claude'a gönderilen şemalar).
 * Okuma araçları sunucuda doğrudan çalışır; yazma araçları arayüzde onaydan geçer ve gerçek yönetici işlemi ucunu çağırır.
 */

export interface ToolTanim {
  name: string;
  description: string;
  input_schema: { type: "object"; properties: Record<string, unknown>; required?: string[] };
  yaz: boolean;
}

export const TOOLLAR: ToolTanim[] = [
  { name: "kullanici_bul", yaz: false, description: "Ada, e-postaya ya da kimliğe göre kullanıcı arar.",
    input_schema: { type: "object", properties: { sorgu: { type: "string", description: "Arama metni (ad, e-posta, kimlik)" }, durum: { type: "string", description: "hepsi, aktif, askida, dogrulanmamis, admin (isteğe bağlı)" } }, required: ["sorgu"] } },
  { name: "kullanici_detay", yaz: false, description: "Bir kullanıcının planı, kredisi, harcaması, ödemeleri, oturumları ve Build proje sayısı.",
    input_schema: { type: "object", properties: { kullaniciId: { type: "string" } }, required: ["kullaniciId"] } },
  { name: "gelir_ozet", yaz: false, description: "Son 30 günün gelir özeti (para birimi başına ayrı), ülke kırılımı, iadeler, etkin abonelikler.", input_schema: { type: "object", properties: {} } },
  { name: "job_ozet", yaz: false, description: "Üretim işleri: son 24 saat ve 7 gün, başarı oranı, süren işler, en çok kullanılan kaynaklar.", input_schema: { type: "object", properties: {} } },
  { name: "kullanim_ozet", yaz: false, description: "Son 30 gün kullanım: aktif kullanıcı, huni, stüdyo bazında kredi, plan dağılımı.", input_schema: { type: "object", properties: {} } },
  { name: "en_cok_harcayan", yaz: false, description: "Son 30 günde en çok kredi harcayan kullanıcılar.", input_schema: { type: "object", properties: { adet: { type: "number", description: "Kaç kullanıcı (varsayılan 10)" } } } },
  { name: "yayin_durumu", yaz: false, description: "Yayın hazırlığı: eksik ve uyarı veren ayarlar.", input_schema: { type: "object", properties: {} } },
  { name: "kredi_ekle", yaz: true, description: "Kullanıcıya kredi ekler. Neden zorunlu. Yönetici onayı gerekir.",
    input_schema: { type: "object", properties: { kullaniciId: { type: "string" }, miktar: { type: "number" }, sebep: { type: "string" } }, required: ["kullaniciId", "miktar", "sebep"] } },
  { name: "kredi_dus", yaz: true, description: "Kullanıcının bakiyesinden kredi düşer. Neden zorunlu. Yönetici onayı gerekir.",
    input_schema: { type: "object", properties: { kullaniciId: { type: "string" }, miktar: { type: "number" }, sebep: { type: "string" } }, required: ["kullaniciId", "miktar", "sebep"] } },
  { name: "plan_degistir", yaz: true, description: "Kullanıcının planını değiştirir (baslangic, arti, ultra, kurumsal). Yönetici onayı gerekir.",
    input_schema: { type: "object", properties: { kullaniciId: { type: "string" }, plan: { type: "string" } }, required: ["kullaniciId", "plan"] } },
  { name: "hesabi_askiya_al", yaz: true, description: "Hesabı askıya alır: giriş yapılamaz, oturumlar geçersiz olur. Çift onay gerekir.",
    input_schema: { type: "object", properties: { kullaniciId: { type: "string" }, sebep: { type: "string" } }, required: ["kullaniciId", "sebep"] } },
];

export function claudeToollar() {
  return TOOLLAR.map(({ name, description, input_schema }) => ({ name, description, input_schema }));
}

export function toolBul(name: string) {
  return TOOLLAR.find((t) => t.name === name);
}
