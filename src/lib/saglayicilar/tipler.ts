/** Sağlayıcı katmanı ortak tipler — sunucu tarafı. */

export type UretimTuru = "gorsel" | "video" | "ses" | "3d";

export interface SaglayiciIstek {
  tur: UretimTuru;
  model: string;
  prompt: string;
  meta?: {
    oran?: string;
    cozunurluk?: string;
    sure?: string;
    ses?: string;
    gorselUrl?: string;
  };
}

export interface SaglayiciSonuc {
  /** Gerçek çıktı URL'i (varsa). Yoksa istemci deterministik önizleme üretir. */
  ciktiUrl?: string;
  /** base64 data-uri (ses/görsel doğrudan gömülebilir). */
  dataUri?: string;
  /** Bu sonucu hangi sağlayıcı üretti: "eleven", "meshy", "openai" ... veya "simulasyon". */
  saglayici: string;
  /** Gerçek API mı yoksa simülasyon mu? Şeffaflık için istemciye taşınır. */
  gercek: boolean;
  /** Ek meta (süre, model id vb.) */
  detay?: Record<string, unknown>;
}

export interface SaglayiciAdapter {
  ad: string;
  /** Ortam anahtarı mevcut mu? */
  hazir(): boolean;
  /** Bu adaptör verilen türü destekliyor mu? */
  destekler(tur: UretimTuru): boolean;
  uret(istek: SaglayiciIstek): Promise<SaglayiciSonuc>;
}
