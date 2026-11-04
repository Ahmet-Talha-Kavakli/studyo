/**
 * Vayra API hata kataloğu — sunucu yanıtları ve Hata Referansı sayfası bu tek
 * listeden beslenir. Gövde biçimi:
 *   { "error": { "type", "code", "message", "param"?, "request_id", "doc_url" } }
 */

export type HataTuru =
  | "invalid_request_error" | "authentication_error" | "permission_error" | "not_found_error"
  | "rate_limit_error" | "insufficient_credits_error" | "content_policy_error" | "conflict_error" | "api_error";

export interface HataTanim {
  kod: string;
  tur: HataTuru;
  http: number;
  mesaj: string;
  neden: string;
  cozum: string;
  yenidenDene: boolean;
}

export const HATALAR: HataTanim[] = [
  { kod: "invalid_json", tur: "invalid_request_error", http: 400, mesaj: "İstek gövdesi geçerli JSON değil.", neden: "Gövde ayrıştırılamadı: eksik tırnak, sondaki virgül ya da yanlış Content-Type.", cozum: "Content-Type: application/json gönder ve gövdeyi bir JSON doğrulayıcıdan geçir.", yenidenDene: false },
  { kod: "parameter_missing", tur: "invalid_request_error", http: 400, mesaj: "Zorunlu bir alan eksik.", neden: "`model`, `input` ya da modelin zorunlu bir girdi alanı (çoğunlukla `prompt`) gönderilmedi.", cozum: "Yanıttaki `param` alanı eksik alanı söyler. Modelin şemasına GET /v1/models/{id} ile bak.", yenidenDene: false },
  { kod: "parameter_invalid", tur: "invalid_request_error", http: 400, mesaj: "Bir alanın değeri geçersiz.", neden: "Tür, aralık ya da izinli değerler dışında bir değer verildi; ya da şemada olmayan bir alan gönderildi.", cozum: "`errors` dizisindeki her kaydı düzelt. Enum alanlar yalnız listelenen değerleri kabul eder.", yenidenDene: false },
  { kod: "invalid_api_key", tur: "authentication_error", http: 401, mesaj: "API anahtarı eksik ya da geçersiz.", neden: "Authorization başlığı yok, biçimi yanlış ya da anahtarın sağlama toplamı tutmuyor.", cozum: "Authorization: Bearer vy_live_… başlığını gönder. Anahtarı panelden kopyalarken boşluk kalmadığından emin ol.", yenidenDene: false },
  { kod: "api_key_revoked", tur: "authentication_error", http: 401, mesaj: "Bu anahtar iptal edildi.", neden: "Anahtar panelden silindi ya da döndürüldü.", cozum: "API Anahtarları sayfasından yeni bir anahtar oluştur ve ortam değişkenini güncelle.", yenidenDene: false },
  { kod: "api_key_expired", tur: "authentication_error", http: 401, mesaj: "Bu anahtarın süresi doldu.", neden: "Anahtar döndürülürken eskisine bir bitiş zamanı verildi ve bu zaman geçti.", cozum: "Yeni anahtarı kullan.", yenidenDene: false },
  { kod: "insufficient_scope", tur: "permission_error", http: 403, mesaj: "Anahtarın bu işlem için yetkisi yok.", neden: "Salt okunur bir anahtarla üretim başlatıldı ya da yalnız üretim yetkili bir anahtarla anahtar ayarları değiştirilmeye çalışıldı.", cozum: "Gerekli kapsamda bir anahtar kullan ya da anahtarın kapsamını panelden genişlet.", yenidenDene: false },
  { kod: "resource_not_found", tur: "not_found_error", http: 404, mesaj: "Kaynak bulunamadı.", neden: "Yol ya da kimlik yanlış; üretim kayıtları 24 saat saklanır.", cozum: "Kimliği ve yolu kontrol et. Eski üretimler için kendi tarafında `output` adreslerini sakla.", yenidenDene: false },
  { kod: "model_not_found", tur: "not_found_error", http: 404, mesaj: "Böyle bir model yok.", neden: "Model kimliği yanlış yazıldı ya da model kaldırıldı.", cozum: "GET /v1/models ile güncel listeyi al.", yenidenDene: false },
  { kod: "not_cancelable", tur: "conflict_error", http: 409, mesaj: "Üretim artık iptal edilemez.", neden: "Üretim tamamlandı, başarısız oldu ya da zaten iptal edildi.", cozum: "Durumu GET /v1/generations/{id} ile kontrol et.", yenidenDene: false },
  { kod: "idempotency_conflict", tur: "conflict_error", http: 409, mesaj: "Bu Idempotency-Key farklı bir gövdeyle kullanıldı.", neden: "Aynı anahtar 24 saat içinde başka parametrelerle yeniden gönderildi.", cozum: "Her farklı istek için yeni bir Idempotency-Key üret (ör. UUID).", yenidenDene: false },
  { kod: "insufficient_credits", tur: "insufficient_credits_error", http: 402, mesaj: "Kredi bakiyesi yetersiz.", neden: "Hesaptaki kredi bu üretimin maliyetini karşılamıyor.", cozum: "Faturalama sayfasından kredi yükle ya da test anahtarıyla dene (test üretimleri kredi harcamaz).", yenidenDene: false },
  { kod: "spend_limit_reached", tur: "insufficient_credits_error", http: 402, mesaj: "Anahtarın aylık harcama sınırına ulaşıldı.", neden: "Anahtara tanımlanan aylık kredi sınırı bu ay doldu.", cozum: "Sınırı API Anahtarları sayfasından yükselt ya da ayın başını bekle.", yenidenDene: false },
  { kod: "content_policy_violation", tur: "content_policy_error", http: 422, mesaj: "İstem içerik politikasına takıldı.", neden: "İstem, kullanım politikasındaki bir kategoriye girdi. Kredi düşülmez.", cozum: "İstemi yeniden yaz. Yanıttaki `category` hangi kurala takıldığını söyler.", yenidenDene: false },
  { kod: "rate_limit_exceeded", tur: "rate_limit_error", http: 429, mesaj: "Hız limiti aşıldı.", neden: "Anahtar başına dakikalık istek sınırı aşıldı.", cozum: "Retry-After başlığı kadar bekle; üstel geri çekilme uygula. Sınırı Hız Limitleri sayfasından anahtar başına ayarlayabilirsin.", yenidenDene: true },
  { kod: "provider_error", tur: "api_error", http: 502, mesaj: "Model sağlayıcısı hata döndürdü.", neden: "Üretimi yapan alt sağlayıcı geçici olarak yanıt vermedi. Kredi iade edilir.", cozum: "Birkaç saniye sonra yeniden dene.", yenidenDene: true },
  { kod: "internal_error", tur: "api_error", http: 500, mesaj: "Beklenmeyen bir hata oluştu.", neden: "Vayra tarafında bir sorun.", cozum: "Yeniden dene; sürerse request_id ile destek@vayra.ai adresine yaz.", yenidenDene: true },
];

export const hataBul = (kod: string) => HATALAR.find((h) => h.kod === kod) ?? HATALAR[HATALAR.length - 1];

export const HATA_TURU_ADI: Record<HataTuru, string> = {
  invalid_request_error: "Geçersiz istek",
  authentication_error: "Kimlik doğrulama",
  permission_error: "Yetki",
  not_found_error: "Bulunamadı",
  rate_limit_error: "Hız limiti",
  insufficient_credits_error: "Kredi",
  content_policy_error: "İçerik politikası",
  conflict_error: "Çakışma",
  api_error: "Sunucu",
};
