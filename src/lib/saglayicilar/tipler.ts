/** Sağlayıcı katmanı ortak tipler — sunucu tarafı. */

export type UretimTuru = "gorsel" | "video" | "ses" | "3d";

/** Görsel işlemleri: üretim, talimatla düzenleme, maskeli düzenleme, arka plan, genişletme, değiştirme. */
export type GorselIslem = "uret" | "duzenle" | "maske" | "arkaplan" | "genislet" | "swap-yuz" | "swap-karakter" | "giydir" | "sil" | "zemin-degistir" | "isik" | "cizim" | "eskiz";

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
    /** Video düzenleme (yeniden çerçeveleme): kaynak video. */
    videoUrl?: string;
    /** Video: son kare (desteklenen modellerde). */
    bitisKareUrl?: string;
    cokCekim?: boolean;
    /* Ses: mod (seslendirme | sesdegistir | ceviri), ses kimliği ve ayarlar. */
    mod?: string;
    sesId?: string;
    dil?: string;
    hiz?: number;
    kararlilik?: number;
    benzerlik?: number;
    stil?: number;
    hedefDil?: string;
    kaynakDil?: string;
    konusmaciSayisi?: number;
    gurultuTemizle?: boolean;
    kaynakAd?: string;
    /** Çeviri: dosya yerine bağlantıdan kaynak (YouTube, TikTok, doğrudan medya). */
    kaynakUrl?: string;
    /** Topluluk sesinin sahibinin kimliği (public_owner_id). */
    paylasimSahibi?: string;
    bicim?: string;
    tohum?: number;
    /** Diyalog satırları (konuşmacı başına ses). */
    diyalog?: { metin: string; sesId: string; ses?: string; sahip?: string }[];
    /** Metin normalizasyonu (sayı/tarih/kısaltmayı yazıya çevirme). */
    normalizasyon?: "auto" | "on" | "off";
    /** Telaffuz sözlüğü (takma ad kuralları). */
    telaffuz?: { kelime: string; okunus: string }[];
    /** Ses ortamı efektleri (ElevenLabs audio effects). */
    ortam?: { filtre?: string; gurultu?: string; mekan?: string; mesafe?: number };
    /** Konuşmacı güçlendirme (use_speaker_boost). */
    konusmaciGuclendir?: boolean;
    /** Kelime zaman damgaları istensin mi (karaoke ve altyazı). */
    zamanDamgasi?: boolean;
    /** Ses efekti ayarları. */
    efektSn?: number;
    dongu?: boolean;
    istemEtkisi?: number;
    /* Görsel: işlem türü ve gerçek parametreler (istem metnine gömülmez). */
    islem?: GorselIslem;
    /** Eskizden görsel: çizime bağlılık (siki | dengeli | serbest). */
    sadakat?: "siki" | "dengeli" | "serbest";
    /** Kullanıcının referans görselleri (depo adresleri). */
    referanslar?: string[];
    /** Stil referansları (ruh panosu). */
    stilRefler?: string[];
    /** Pano gücü: stil referansının ne kadar baskın uygulanacağı. */
    stilGuc?: "hafif" | "dengeli" | "guclu";
    /** Bölgesel düzenleme maskesi (beyaz = düzenlenecek alan). */
    maskeUrl?: string;
    negatif?: string;
    seffaf?: boolean;
    /** Kalite seviyesi (modelin kendi değer adıyla eşlenir). */
    kalite?: string;
    vektor?: boolean;
    yonlendirme?: number;
    adim?: number;
    renkler?: string[]; stilAd?: string; stilIstem?: string; refRolleri?: string[];
    /** İstem geliştirici: istemi zenginleştirip İngilizceye çevir. */
    gelistir?: boolean;
    /** Sanal giydirme (FASHN): giysi kategorisi, fotoğraf türü, kalite modu. */
    giysi?: { kategori?: string; foto?: string; mod?: string };
    /** Düzenleme motoru (maskeli düzenleme: "flux" | "ideogram" | "bria"); ışık yönü ("Left"…). */
    motor?: string; yon?: string;
    /** Genişletme tuvali (piksel): tuval boyutu, görselin sol üst konumu ve tuvaldeki boyutu. */
    kanvas?: { w: number; h: number; x: number; y: number; gw: number; gh: number };
    /** İstem yalnız iç talimat (kullanıcı bir şey yazmadı). */
    istemsiz?: boolean;
    /** Seslendirmeyi akışlı uç noktadan iste (ses parçaları üretilirken çalınır). */
    akis?: boolean;
    /** Eğitilmiş karakter LoRA'sı (fal flux-lora). */
    lora?: { url: string; olcek?: number };
    /** Arka plan kaldırmada zemin: "seffaf" | "beyaz" | "#rrggbb". */
    zemin?: string;
  };
  /** Saklanmayan büyük girdiler — ör. kaynak ses/video dosyasının data URL'i. */
  girdi?: { kaynak?: string; gorseller?: string[]; referanslar?: import("@/lib/elementCekirdek").ElementReferans[] };
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
