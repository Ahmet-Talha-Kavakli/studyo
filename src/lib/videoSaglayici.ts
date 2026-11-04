/**
 * Video modeli → gerçek sağlayıcı eşlemesi ve modelin İZİNLİ ayarları (tek kaynak).
 * Stüdyonun çipleri (süre, çözünürlük, oran, ses, son kare) ve sunucu adaptörlerinin
 * doğrulaması buradan beslenir; arayüzde seçilen her değer sağlayıcıya gerçekten gider.
 *
 * Değerler sağlayıcı belgelerinden (22.10.2026):
 *  • Kling yeni API — /text-to-video/{model}, /image-to-video/{model}, GET /tasks
 *  • Seedance (BytePlus ModelArk) — /contents/generations/tasks
 *  • MiniMax — api.minimax.io /v1/video_generation
 *  • Gemini Omni Flash — /v1beta/interactions (Veo 3.1 önizlemesinin halefi)
 *  • fal.ai kuyruğu — Kling 4.0, MiniMax H3, FLUX 3 Max Video, Wan 3.0 Prime, HappyHorse 1.1, LTX-2.5,
 *    PixVerse V6, Vidu Q3, Luma Ray 3 (03.11.2026; uç noktaları fal model sayfalarından)
 *  • Luma Ray Reframe (fal) — videoyu yeni orana genişletir (31.10.2026; Ray 2 uç noktası 05.11.2026'da kapanıyor, önce Ray 3.2 denenir)
 */

export type VideoSaglayiciAd = "kling" | "seedance" | "minimax" | "omni" | "luma" | "fal";

/** fal.ai uç noktaları: istemden, görselden ve iki kareden üretim ayrı uçlardır. */
export type FalUclar = {
  metin?: string;
  gorsel?: string;
  /** Başlangıç + bitiş karesi ayrı uçtaysa. */
  kareler?: string;
  /** Süre biçimi: sayı (5), metin ("5") ya da saniye ekiyle ("5s"). */
  sure?: "sayi" | "metin" | "s";
  /** Bitiş karesinin alan adı (modele göre değişir). */
  sonAlan?: string;
  /** Model negatif istemi kendi alanında alır. */
  negatif?: boolean;
  /** Model tohum (seed) alır. */
  tohum?: boolean;
};

export type VideoGercek = {
  durum: "gercek";
  saglayici: VideoSaglayiciAd;
  /** Sağlayıcıdaki model kimliği (Kling'de yol parçası). */
  modelId: string;
  /** Boşsa süre sağlayıcıda seçilemez (model belirler). */
  sureler: number[];
  cozler: string[];
  /** Boşsa oran seçilemez. "Auto" = sağlayıcının uyarlamalı oranı. */
  oranlar: string[];
  /** "toggle": ses açılıp kapanabilir; "yok": model ses üretmez. */
  ses: "toggle" | "yok";
  sonKare: boolean;
  /** Model yalnız görselden video üretir. */
  gorselGerekli?: boolean;
  cokCekim?: boolean;
  /** fal modellerinde uç noktaları. */
  fal?: FalUclar;
  /** Süre + çözünürlük birlikte kısıtlı (ör. 1080P yalnız 6 sn). */
  kisit?: { coz: string; sureler: number[] }[];
};
export type VideoErisim = VideoGercek | { durum: "kapandi"; neden: string } | { durum: "yakinda"; neden: string };

const ARALIK = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const SEEDANCE_ORAN = ["Auto", "16:9", "4:3", "1:1", "3:4", "9:16", "21:9"];
const KLING_ORAN = ["16:9", "9:16", "1:1"];
const GENIS_ORAN = ["16:9", "9:16", "1:1", "4:3", "3:4"];

const GERCEK: Record<string, VideoGercek> = {
  "Kling 3.0": { durum: "gercek", saglayici: "kling", modelId: "kling-3.0", sureler: ARALIK(3, 15), cozler: ["720p", "1080p", "4K"], oranlar: KLING_ORAN, ses: "toggle", sonKare: true, cokCekim: true },
  "Kling 3.0 Turbo": { durum: "gercek", saglayici: "kling", modelId: "kling-3.0-turbo", sureler: ARALIK(3, 15), cozler: ["720p", "1080p"], oranlar: KLING_ORAN, ses: "yok", sonKare: false },
  "Kling 2.6": { durum: "gercek", saglayici: "kling", modelId: "kling-2.6", sureler: [5, 10], cozler: ["720p", "1080p"], oranlar: KLING_ORAN, ses: "toggle", sonKare: true },
  "Seedance 2.5": { durum: "gercek", saglayici: "seedance", modelId: "dreamina-seedance-2-5-260628", sureler: ARALIK(4, 30), cozler: ["480p", "720p", "1080p"], oranlar: SEEDANCE_ORAN, ses: "toggle", sonKare: true },
  "Seedance 2.0": { durum: "gercek", saglayici: "seedance", modelId: "dreamina-seedance-2-0-260128", sureler: ARALIK(4, 15), cozler: ["480p", "720p", "1080p", "4K"], oranlar: SEEDANCE_ORAN, ses: "toggle", sonKare: true },
  "Seedance 2.0 Fast": { durum: "gercek", saglayici: "seedance", modelId: "dreamina-seedance-2-0-fast-260128", sureler: ARALIK(4, 15), cozler: ["480p", "720p"], oranlar: SEEDANCE_ORAN, ses: "toggle", sonKare: true },
  "Seedance 1.5 Pro": { durum: "gercek", saglayici: "seedance", modelId: "seedance-1-5-pro-251215", sureler: ARALIK(4, 12), cozler: ["480p", "720p", "1080p"], oranlar: SEEDANCE_ORAN, ses: "toggle", sonKare: true },
  "Seedance Pro": { durum: "gercek", saglayici: "seedance", modelId: "seedance-1-0-pro-250528", sureler: ARALIK(2, 12), cozler: ["480p", "720p", "1080p"], oranlar: SEEDANCE_ORAN.slice(1), ses: "yok", sonKare: true },
  "Minimax Hailuo 2.3": { durum: "gercek", saglayici: "minimax", modelId: "MiniMax-Hailuo-2.3", sureler: [6, 10], cozler: ["768p", "1080p"], oranlar: [], ses: "yok", sonKare: false, kisit: [{ coz: "1080p", sureler: [6] }] },
  "Minimax Hailuo 2.3 Fast": { durum: "gercek", saglayici: "minimax", modelId: "MiniMax-Hailuo-2.3-Fast", sureler: [6, 10], cozler: ["768p", "1080p"], oranlar: [], ses: "yok", sonKare: false, gorselGerekli: true, kisit: [{ coz: "1080p", sureler: [6] }] },
  "Minimax Hailuo 02": { durum: "gercek", saglayici: "minimax", modelId: "MiniMax-Hailuo-02", sureler: [6, 10], cozler: ["768p", "1080p"], oranlar: [], ses: "yok", sonKare: true, kisit: [{ coz: "1080p", sureler: [6] }] },
  "Luma Ray Reframe": { durum: "gercek", saglayici: "luma", modelId: "ray-reframe", sureler: [], cozler: [], oranlar: ["1:1", "16:9", "9:16", "4:3", "3:4", "21:9", "9:21"], ses: "yok", sonKare: false },
  // ── fal.ai ──
  "Kling 4.0": { durum: "gercek", saglayici: "fal", modelId: "kling-v4", sureler: ARALIK(3, 15), cozler: ["720p", "1080p", "4K"], oranlar: KLING_ORAN, ses: "toggle", sonKare: true, cokCekim: true,
    fal: { metin: "kling/v4/text-to-video", gorsel: "kling/v4/image-to-video", sure: "metin", sonAlan: "tail_image_url", negatif: true } },
  "MiniMax H3 Max": { durum: "gercek", saglayici: "fal", modelId: "minimax-h3-max", sureler: [6, 10], cozler: ["768p", "1080p"], oranlar: KLING_ORAN, ses: "toggle", sonKare: false,
    fal: { metin: "minimax/h3-max/text-to-video", gorsel: "minimax/h3-max/image-to-video", sure: "metin" } },
  "MiniMax H3": { durum: "gercek", saglayici: "fal", modelId: "minimax-h3", sureler: [6, 10], cozler: ["768p", "1080p"], oranlar: [], ses: "yok", sonKare: false, gorselGerekli: true,
    fal: { gorsel: "minimax/h3/image-to-video", sure: "metin" } },
  "FLUX 3 Max Video": { durum: "gercek", saglayici: "fal", modelId: "flux-3-max-video", sureler: [5, 10], cozler: ["720p", "1080p"], oranlar: GENIS_ORAN, ses: "yok", sonKare: true,
    fal: { metin: "blackforestlabs/flux-3-max/text-to-video", gorsel: "blackforestlabs/flux-3-max/image-to-video", kareler: "blackforestlabs/flux-3-max/keyframes-to-video", sonAlan: "end_image_url", tohum: true } },
  "Wan 3.0 Prime": { durum: "gercek", saglayici: "fal", modelId: "wan-3.0-prime", sureler: [5, 10, 15], cozler: ["720p", "1080p"], oranlar: [], ses: "toggle", sonKare: false, gorselGerekli: true,
    fal: { gorsel: "alibaba/wan-3.0-prime/image-to-video", sure: "metin", negatif: true, tohum: true } },
  "HappyHorse 1.1": { durum: "gercek", saglayici: "fal", modelId: "happy-horse-1.1", sureler: ARALIK(3, 15), cozler: ["720p", "1080p"], oranlar: KLING_ORAN, ses: "toggle", sonKare: false,
    fal: { metin: "alibaba/happy-horse/v1.1/text-to-video", tohum: true } },
  "LTX-2.5 Fast": { durum: "gercek", saglayici: "fal", modelId: "ltx-2.5-fast", sureler: [6, 8, 10], cozler: ["1080p", "4K"], oranlar: [], ses: "toggle", sonKare: false, gorselGerekli: true,
    fal: { gorsel: "lightricks/ltx-2.5/image-to-video/fast", tohum: true } },
  "PixVerse V6": { durum: "gercek", saglayici: "fal", modelId: "pixverse-v6", sureler: [5, 8], cozler: ["540p", "720p", "1080p"], oranlar: [], ses: "toggle", sonKare: false, gorselGerekli: true,
    fal: { gorsel: "fal-ai/pixverse/v6/image-to-video", sure: "metin", negatif: true, tohum: true } },
  "Vidu Q3": { durum: "gercek", saglayici: "fal", modelId: "vidu-q3", sureler: [4, 5, 8], cozler: ["540p", "720p", "1080p"], oranlar: [], ses: "toggle", sonKare: false, gorselGerekli: true,
    fal: { gorsel: "fal-ai/vidu/q3/image-to-video", tohum: true } },
  "Luma Ray 3": { durum: "gercek", saglayici: "fal", modelId: "ray-3", sureler: [5, 9], cozler: ["720p", "1080p"], oranlar: [], ses: "yok", sonKare: true, gorselGerekli: true,
    fal: { gorsel: "fal-ai/luma-dream-machine/ray-3/image-to-video", sure: "s", sonAlan: "end_image_url" } },
  "Gemini Omni Flash": { durum: "gercek", saglayici: "omni", modelId: "gemini-omni-1.1-flash", sureler: [], cozler: ["360p", "720p", "1080p", "4K"], oranlar: ["16:9", "9:16"], ses: "yok", sonKare: true },
};

const KAPANDI: [RegExp, string][] = [
  [/sora/i, "OpenAI Sora API'si 24.09.2026'da kapandı."],
  [/veo 3\.1/i, "Gemini API'deki Veo 3.1 önizlemesi 22.10.2026'da kapandı; yerine Gemini Omni Flash'ı kullan."],
  [/veo 3\b/i, "Veo 3 modelleri 30.06.2026'da kapandı."],
];

export function videoErisim(ad: string): VideoErisim {
  const g = GERCEK[ad];
  if (g) return g;
  const k = KAPANDI.find(([r]) => r.test(ad));
  if (k) return { durum: "kapandi", neden: k[1] };
  return { durum: "yakinda", neden: "Bu model için sağlayıcı bağlantısı henüz yok." };
}
export const videoGercekMi = (ad: string) => videoErisim(ad).durum === "gercek";

/** Sağlayıcının çözünürlük yazımı. */
export function cozSaglayici(coz: string, saglayici: VideoSaglayiciAd): string {
  const c = coz.toLowerCase();
  if (saglayici === "minimax") return c.toUpperCase();
  return c === "4k" ? "4k" : c;
}

/** İstenen ayarı modelin izinli değerlerine göre doğrular; uymuyorsa açıklayıcı hata. */
export function videoAyarDogrula(ad: string, m: { sure?: string; cozunurluk?: string; oran?: string; gorselUrl?: string; bitisKareUrl?: string }): { hata?: string; sure?: number; coz?: string; oran?: string } {
  const e = videoErisim(ad);
  if (e.durum !== "gercek") return { hata: e.neden };
  const sure = m.sure ? parseInt(m.sure, 10) : undefined;
  if (sure !== undefined && e.sureler.length && !e.sureler.includes(sure)) return { hata: `${ad} ${sure} sn desteklemiyor (${e.sureler[0]}–${e.sureler[e.sureler.length - 1]} sn).` };
  const coz = m.cozunurluk && e.cozler.some((c) => c.toLowerCase() === m.cozunurluk!.toLowerCase()) ? m.cozunurluk : e.cozler[0];
  if (m.cozunurluk && coz !== m.cozunurluk) return { hata: `${ad} ${m.cozunurluk} desteklemiyor.` };
  const kisit = e.kisit?.find((k) => k.coz.toLowerCase() === coz.toLowerCase());
  if (kisit && sure !== undefined && !kisit.sureler.includes(sure)) return { hata: `${ad} ${coz} çözünürlükte yalnız ${kisit.sureler.join("/")} sn üretir.` };
  const oran = m.oran && e.oranlar.includes(m.oran) ? m.oran : e.oranlar[0];
  if (e.gorselGerekli && !m.gorselUrl) return { hata: `${ad} yalnız görselden video üretir; başlangıç karesi ekle.` };
  if (m.bitisKareUrl && !e.sonKare) return { hata: `${ad} son kare desteklemiyor.` };
  // Sağlayıcıların hiçbiri yalnız bitiş karesiyle üretmiyor (Kling sessizce yok sayıyordu).
  if (m.bitisKareUrl && !m.gorselUrl) return { hata: "Bitiş karesi yalnız başlangıç karesiyle birlikte kullanılabilir." };
  return { sure: sure ?? e.sureler[0], coz, oran };
}
