/**
 * Upscale verisi — modeller, hazır ayarlar, kredi. SSR güvenli.
 * Modeller fal.ai kuyruk API'si ile çalışır (tek FAL_KEY); parametre adları fal'ın OpenAPI
 * şemalarından doğrulandı (22.10.2026). Model, görünen adla değil `id` ile yönlendirilir.
 */

export type UpscaleTur = "gorsel" | "video";
export type UpscaleModelId = "seedvr" | "topaz" | "clarity" | "crystal" | "ideogram" | "recraft" | "flashvsr" | "seedvr-video";

export const TOPAZ_ALT: { id: string; ad: string; ozet: string }[] = [
  { id: "Standard V2", ad: "Standart", ozet: "Genel amaçlı, dengeli" },
  { id: "High Fidelity V2", ad: "Yüksek sadakat", ozet: "Yüksek kaliteli fotoğraflarda ince detay" },
  { id: "Low Resolution V2", ad: "Düşük çözünürlük", ozet: "Küçük, web ya da ekran görüntüleri" },
  { id: "Recovery V2", ad: "Kurtarma", ozet: "Çok bozuk, eski fotoğraflar" },
  { id: "CGI", ad: "CGI ve illüstrasyon", ozet: "Render, çizim, oyun varlıkları" },
  { id: "Text Refine", ad: "Metin ve logo", ozet: "Okunabilir yazı, keskin kenar" },
  { id: "Redefine", ad: "Yeniden tanımla", ozet: "Üretken: yeni detay ekler (yaratıcı)" },
  { id: "Wonder 3", ad: "Wonder", ozet: "Üretken netlik; çok küçük görsellerde en iyi" },
  { id: "Standard MAX", ad: "Standart MAX", ozet: "En yüksek kalite, daha yavaş" },
];

export type UpscaleModel = {
  id: UpscaleModelId; ad: string; saglayici: "fal"; falId: string; tur: UpscaleTur;
  ozet: string; olcekler: number[]; hiz: "Hızlı" | "Orta" | "Yavaş"; eksen: "Sadık" | "Dengeli" | "Yaratıcı";
  /** Çıktı kenarı sınırı (px) — aşan ölçekler devre dışı. */
  maxKenar: number;
};

export const UPSCALE_MODELLERI: UpscaleModel[] = [
  { id: "seedvr", ad: "SeedVR2", saglayici: "fal", falId: "fal-ai/seedvr/upscale/image", tur: "gorsel", ozet: "Hızlı ve sadık; her türde iyi başlangıç", olcekler: [2, 4, 6, 8, 10], hiz: "Hızlı", eksen: "Sadık", maxKenar: 10000 },
  { id: "topaz", ad: "Topaz", saglayici: "fal", falId: "fal-ai/topaz/upscale/image", tur: "gorsel", ozet: "Profesyonel; içeriğe göre alt modeller, yüz iyileştirme", olcekler: [2, 3, 4], hiz: "Orta", eksen: "Dengeli", maxKenar: 16000 },
  { id: "clarity", ad: "Clarity", saglayici: "fal", falId: "fal-ai/clarity-upscaler", tur: "gorsel", ozet: "Yaratıcı; istemle yeni doku ve detay ekler", olcekler: [2, 3, 4], hiz: "Yavaş", eksen: "Yaratıcı", maxKenar: 8000 },
  { id: "crystal", ad: "Crystal", saglayici: "fal", falId: "fal-ai/crystal-upscaler", tur: "gorsel", ozet: "Magnific benzeri yaratıcı büyütme; yaratıcılık ayarlı", olcekler: [2, 4, 6, 8], hiz: "Orta", eksen: "Yaratıcı", maxKenar: 16000 },
  { id: "ideogram", ad: "Ideogram Upscale", saglayici: "fal", falId: "fal-ai/ideogram/upscale", tur: "gorsel", ozet: "Benzerlik ve detay ayarlı; yazılı görsellerde güçlü", olcekler: [], hiz: "Orta", eksen: "Dengeli", maxKenar: 8000 },
  { id: "recraft", ad: "Recraft Crisp", saglayici: "fal", falId: "fal-ai/recraft/upscale/crisp", tur: "gorsel", ozet: "Grafik, logo ve vektör benzeri görsellerde net kenar", olcekler: [], hiz: "Hızlı", eksen: "Sadık", maxKenar: 8000 },
  { id: "flashvsr", ad: "FlashVSR", saglayici: "fal", falId: "fal-ai/flashvsr/upscale/video", tur: "video", ozet: "Hızlı video büyütme; sesi korur", olcekler: [2, 3, 4], hiz: "Hızlı", eksen: "Sadık", maxKenar: 4096 },
  { id: "seedvr-video", ad: "SeedVR2 Video", saglayici: "fal", falId: "fal-ai/seedvr/upscale/video", tur: "video", ozet: "Yüksek kaliteli video restorasyonu", olcekler: [2, 3, 4], hiz: "Orta", eksen: "Dengeli", maxKenar: 4096 },
];
export const upscaleModel = (id: string) => UPSCALE_MODELLERI.find((m) => m.id === id);

/** Gelişmiş ayarlar (modele göre kullanılanlar sağlayıcıya gider). */
export type UpscaleAyar = {
  topazModel?: string;
  yuz?: boolean; yuzGuc?: number;
  keskinlik?: number; gurultu?: number; sikistirma?: number;
  yaraticilik?: number; benzerlik?: number; doku?: number; istem?: string;
  /** SeedVR: gren/gürültü ölçeği (0–1); hedef çözünürlük modu (ölçek yerine). */
  gren?: number; hedef?: "1080p" | "1440p" | "2160p";
  /** Topaz: odak (subject_detection) ve yüz yaratıcılığı. */
  odak?: "All" | "Foreground" | "Background"; yuzYaraticilik?: number;
  /** Clarity gelişmiş; Ideogram detay. */
  yonlendirme?: number; adim?: number; negatif?: string; detay?: number;
  /** Video */
  kalite?: "medium" | "high" | "maximum"; renkDuzelt?: boolean; sesKoru?: boolean;
  tohum?: number;
};

export const HAZIR_AYARLAR: { id: string; ad: string; ozet: string; model: UpscaleModelId; olcek: number; ayar: UpscaleAyar }[] = [
  { id: "oto", ad: "Otomatik", ozet: "Hızlı, sadık büyütme", model: "seedvr", olcek: 2, ayar: { gren: 0.1 } },
  { id: "portre", ad: "Portre", ozet: "Yüz iyileştirmeli", model: "topaz", olcek: 2, ayar: { topazModel: "High Fidelity V2", yuz: true, yuzGuc: 0.8 } },
  { id: "foto", ad: "Fotoğraf", ozet: "Doğal, dengeli", model: "topaz", olcek: 4, ayar: { topazModel: "Standard V2", yuz: true, yuzGuc: 0.6 } },
  { id: "eski", ad: "Eski fotoğraf", ozet: "Bozulma onarımı", model: "topaz", olcek: 2, ayar: { topazModel: "Recovery V2", sikistirma: 0.6, gurultu: 0.4, yuz: true, yuzGuc: 0.7 } },
  { id: "dusuk", ad: "Düşük çözünürlük", ozet: "Küçük görseller", model: "topaz", olcek: 4, ayar: { topazModel: "Low Resolution V2", sikistirma: 0.4 } },
  { id: "illustrasyon", ad: "İllüstrasyon", ozet: "Çizim, anime, 3D", model: "topaz", olcek: 4, ayar: { topazModel: "CGI" } },
  { id: "metin", ad: "Metin ve logo", ozet: "Keskin kenar", model: "recraft", olcek: 0, ayar: {} },
  { id: "yaratici", ad: "Yaratıcı detay", ozet: "Yeni doku ekler", model: "clarity", olcek: 2, ayar: { yaraticilik: 0.45, benzerlik: 0.6 } },
];

/** Çıktı boyutu (Recraft Crisp ölçeği model belirler — 2× varsayılır, bilgi amaçlı). */
export function ciktiBoyutu(w: number, h: number, olcek: number): { w: number; h: number; mp: number } {
  const k = olcek || 2;
  return { w: Math.round(w * k), h: Math.round(h * k), mp: (w * k * h * k) / 1e6 };
}

/**
 * Kredi: çıktı megapikseline göre (rakiplerdeki gibi). SeedVR her başlayan 8 MP için 1; Topaz her
 * başlayan 24 MP için 4; Clarity her başlayan 2 MP için 1; Recraft 1. Video: saniye × ölçek.
 */
export function upscaleKredi(model: UpscaleModelId, ciktiMp: number, sureSn = 0, olcek = 2): number {
  switch (model) {
    case "seedvr": return Math.max(1, Math.ceil(ciktiMp / 8));
    case "topaz": return 4 * Math.max(1, Math.ceil(ciktiMp / 24));
    case "clarity": return Math.max(2, Math.ceil(ciktiMp / 2));
    case "crystal": return Math.max(2, Math.ceil(ciktiMp / 4));
    case "ideogram": return 2;
    case "recraft": return 1;
    case "flashvsr": return Math.max(2, Math.ceil(sureSn * 0.5 * (olcek / 2)));
    case "seedvr-video": return Math.max(4, Math.ceil(sureSn * 1.2 * (olcek / 2)));
  }
}

/** Yerel (tarayıcı) büyütmede çıktı sınırı. */
export const YEREL_MAX_MP = 64;
export const GIRDI_MAX_MB = { gorsel: 25, video: 40 };

/** Büyüt stüdyosunu bir kaynakla açar (kitaplık, görüntüleyici, üretim detayı buradan gelir). */
export const upscaleAdresi = (kaynakUrl: string, uretimId?: string) =>
  `/panel/upscale?kaynak=${encodeURIComponent(kaynakUrl)}${uretimId ? `&uretim=${encodeURIComponent(uretimId)}` : ""}`;
