/* ============================================================
   VAYRA API — Sunucu tarafı yardımcıları (v1 REST katmanı).

   · Bellek-içi rate limiter (anahtar başına kayan pencere)
   · Bellek-içi istek deposu (request_id → durum; durum sorgulama besler)
   · Standart hata/başarı gövdeleri (Higgsfield/Stripe deseni)

   NOT: Bellek-içi olduğu için sunucu yeniden başlayınca sıfırlanır — demo-gerçekçi.
   Gerçek üründe Redis/DB kullanılır. Vercel'de tek instance varsayımıyla çalışır.
   ============================================================ */

// ── Rate limiter (kayan pencere, dakika başına) ──
type Vuruslar = { zamanlar: number[] };
const rlHarita = new Map<string, Vuruslar>();

export function rateLimit(anahtar: string, limit: number, pencereMs = 60_000): {
  izin: boolean; kalan: number; sifirlanma: number;
} {
  const simdi = Date.now();
  const kayit = rlHarita.get(anahtar) ?? { zamanlar: [] };
  kayit.zamanlar = kayit.zamanlar.filter((t) => simdi - t < pencereMs);
  const izin = kayit.zamanlar.length < limit;
  if (izin) kayit.zamanlar.push(simdi);
  rlHarita.set(anahtar, kayit);
  const enEski = kayit.zamanlar[0] ?? simdi;
  return { izin, kalan: Math.max(0, limit - kayit.zamanlar.length), sifirlanma: Math.ceil((enEski + pencereMs) / 1000) };
}

// ── İstek deposu (request_id → kayıt) ──
export type IstekDurum = "queued" | "in_progress" | "completed" | "failed" | "nsfw" | "canceled";
export interface IstekKaydi {
  request_id: string;
  status: IstekDurum;
  model: string;
  tur: string;
  prompt: string;
  created_at: number;
  completed_at: number | null;
  credits: number;
  output_url: string | null;
  error: string | null;
  meta: Record<string, unknown>;
}
const istekDepo = new Map<string, IstekKaydi>();

export function istekOlustur(k: { model: string; tur: string; prompt: string; credits: number; meta?: Record<string, unknown> }): IstekKaydi {
  const request_id = `req_${rndHex(12)}`;
  const kayit: IstekKaydi = {
    request_id,
    status: "queued",
    model: k.model,
    tur: k.tur,
    prompt: k.prompt,
    credits: k.credits,
    created_at: Date.now(),
    completed_at: null,
    output_url: null,
    error: null,
    meta: k.meta ?? {},
  };
  istekDepo.set(request_id, kayit);
  // depo şişmesin — 1000 kayıt sınırı
  if (istekDepo.size > 1000) { const ilk = istekDepo.keys().next().value; if (ilk) istekDepo.delete(ilk); }
  return kayit;
}

export function istekGetir(id: string): IstekKaydi | undefined { return istekDepo.get(id); }
export function istekGuncelle(id: string, patch: Partial<IstekKaydi>): IstekKaydi | undefined {
  const k = istekDepo.get(id); if (!k) return undefined;
  const yeni = { ...k, ...patch }; istekDepo.set(id, yeni); return yeni;
}

export function rndHex(bayt: number): string {
  const b = new Uint8Array(bayt);
  crypto.getRandomValues(b);
  return Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
}

// ── Standart yanıt gövdeleri ──
export function hataGovde(kod: string, mesaj: string, ek?: Record<string, unknown>) {
  return { error: { type: kod, message: mesaj, ...ek } };
}

export const HATA_KODLARI: Record<string, { http: number; mesaj: string }> = {
  gecersiz_json: { http: 400, mesaj: "İstek gövdesi geçerli JSON değil." },
  eksik_prompt: { http: 400, mesaj: "'prompt' alanı zorunludur." },
  gecersiz_model: { http: 404, mesaj: "Model bulunamadı." },
  yetkisiz: { http: 401, mesaj: "Geçersiz veya eksik API anahtarı. Authorization: Bearer <anahtar> gönderin." },
  hiz_limiti: { http: 429, mesaj: "Hız limiti aşıldı. Bir süre sonra tekrar deneyin." },
  moderasyon: { http: 422, mesaj: "İstek moderasyon politikasını ihlal ediyor." },
  bulunamadi: { http: 404, mesaj: "Kaynak bulunamadı." },
  sunucu: { http: 500, mesaj: "Sunucu hatası." },
};
