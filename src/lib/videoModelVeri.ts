/* Video modelleri — video stüdyosunun model seçicisi, composer davranışı ve kredi hesabı.
   /modeller kataloğu da buradan beslenir; bir modelin kredisi ya da özelliği tek yerden değişir. */

import { modelBul } from "@/lib/videoModelSpec";
import { videoErisim } from "@/lib/videoSaglayici";

/** Varsayılan en-boy oranları (spec'i olmayan modeller için). */
export const VIDEO_ORANLAR = ["16:9", "9:16", "1:1", "4:5", "Auto"];

// Higgsfield birebir: her modelde çözünürlük + süre aralığı + ses meta-chip'leri.
// ── Video model varyantı (Higgsfield birebir: çözünürlük + süre aralığı + ses rozeti) ──
export type VideoRozet = "Yeni" | "Hızlı" | "Özel" | "Vayra";
// Higgsfield birebir görsel-kutu tipleri (higg-video-model analizi):
//  tek       → "Görsel yükle veya üret" tek kutu
//  kareler   → Başlangıç karesi + Son kare (ikili)
//  medya     → "Medya yükle" (görsel/video[/ses])
//  edit      → düzenlenecek video kutusu (Edit modu)
//  hareket   → Motion Control: kopyalanacak hareket videosu + karakter görseli
export type VideoKutu = "tek" | "kareler" | "medya" | "edit" | "hareket";
export type VideoModel = {
  ad: string;
  coz: string;          // varsayılan çözünürlük (720p/1080p/4K/512p)
  sureAralik: string;   // "3-15sn"
  ses?: boolean;        // ses üretimi (🔊)
  rozet?: VideoRozet;
  kredi: number;
  // ── Higgsfield birebir composer davranışı ──
  kutu?: VideoKutu;         // görsel-kutu tipi (varsayılan "tek")
  varsayilanSure?: number;  // model açılınca seçilen süre (sn)
  varsayilanOran?: string;  // "16:9" / "9:16" / "Auto" / "1:1"
  oranGizli?: boolean;      // oran çipini gizle (Minimax, Higgsfield DoP…)
  cozGizli?: boolean;       // çözünürlük çipini gizle (Sora 2, Wan 2.2…)
  enhance?: boolean;        // "İyileştir" çipi göster
  cokCekim?: boolean;       // "Çok çekimli" toggle göster (Kling 3.0, Seedance Pro, Veo Fast)
  sesToggle?: boolean;      // ayrı "Ses" toggle satırı (Kling 2.6, Seedance 1.5 Pro)
  bitrate?: boolean;        // Bitrate seçici (Seedance 2.0)
  medyaTipi?: string;       // medya kutusu alt-metni ("Görsel", "Görsel & Video", "Görsel, Video veya Ses")
  medyaSayisi?: number;     // "en fazla N" (Veo Ingredients=3, Kling Edit=4)
  not?: string;            // model altı bilgi notu ("İnsan yüzü desteklenmez" gibi)
};
// ── Model ailesi: Featured'da düz varyant, "tum"da hover→flyout varyant listesi (Higgsfield birebir) ──
export type ModelAile = {
  ad: string;
  ozet: string;         // "tum" grubunda gösterilen açıklama
  grup: "one" | "tum";
  varyantlar: VideoModel[];
};
export const MODEL_AILELERI: ModelAile[] = [
  // ═══ Öne çıkan modeller (Featured) — her aile tek varyant, düz liste ═══
  { ad: "Kling 4.0", ozet: "En yeni Kling: 4K, sesli, çok çekimli", grup: "one", varyantlar: [
    { ad: "Kling 4.0", coz: "4K", sureAralik: "3-15sn", ses: true, rozet: "Yeni", kredi: 52 },
  ] },
  { ad: "Seedance 2.5", ozet: "30 sn'ye kadar, sesli, ilk ve son kare", grup: "one", varyantlar: [
    { ad: "Seedance 2.5", coz: "1080p", sureAralik: "4-30sn", ses: true, rozet: "Yeni", kredi: 50 },
  ] },
  { ad: "Seedance", ozet: "Sinematik, çok-çekimli video üretimi", grup: "one", varyantlar: [
    { ad: "Seedance 2.0", coz: "4K", sureAralik: "4-15sn", kredi: 42 },
  ]},
  { ad: "Seedance 2.0 Mini", ozet: "Hafif, hızlı çekim", grup: "one", varyantlar: [
    { ad: "Seedance 2.0 Mini", coz: "720p", sureAralik: "4-15sn", rozet: "Yeni", kredi: 20 },
  ]},
  { ad: "Seedance 2.0 Fast", ozet: "Hızlı Seedance", grup: "one", varyantlar: [
    { ad: "Seedance 2.0 Fast", coz: "720p", sureAralik: "4-15sn", kredi: 24 },
  ]},
  { ad: "Gemini Omni Flash", ozet: "Google — hızlı, akıllı üretim", grup: "one", varyantlar: [
    { ad: "Gemini Omni Flash", coz: "720p", sureAralik: "4-10sn", rozet: "Yeni", kredi: 24 },
  ]},
  { ad: "Google Veo 3.1 Lite", ozet: "Google — sesli, hafif", grup: "one", varyantlar: [
    { ad: "Google Veo 3.1 Lite", coz: "1080p", sureAralik: "4-8sn", ses: true, rozet: "Yeni", kredi: 40 },
  ]},
  { ad: "Wan 2.7", ozet: "Kamera kontrollü, sesli, daha özgür", grup: "one", varyantlar: [
    { ad: "Wan 2.7", coz: "1080p", sureAralik: "2-15sn", rozet: "Yeni", kredi: 30 },
  ]},
  { ad: "MiniMax H3 Max", ozet: "Sesli, güçlü hareket ve fizik", grup: "one", varyantlar: [
    { ad: "MiniMax H3 Max", coz: "1080p", sureAralik: "6-10sn", ses: true, rozet: "Yeni", kredi: 36 },
  ]},
  { ad: "FLUX 3 Max Video", ozet: "Black Forest Labs: keskin detay, ilk ve son kare", grup: "one", varyantlar: [
    { ad: "FLUX 3 Max Video", coz: "1080p", sureAralik: "5-10sn", rozet: "Yeni", kredi: 44 },
  ]},
  { ad: "HappyHorse", ozet: "Yüksek dinamik, VFX hazır", grup: "one", varyantlar: [
    { ad: "HappyHorse 1.1", coz: "1080p", sureAralik: "3-15sn", ses: true, rozet: "Yeni", kredi: 30 },
  ]},
  // ═══ Tüm modeller (aile → varyant flyout) ═══
  { ad: "Minimax Hailuo", ozet: "Yüksek dinamik, VFX hazır, en hızlı ve ekonomik", grup: "tum", varyantlar: [
    { ad: "MiniMax H3 Max", coz: "1080p", sureAralik: "6-10sn", ses: true, rozet: "Yeni", kredi: 36 },
    { ad: "MiniMax H3", coz: "1080p", sureAralik: "6-10sn", rozet: "Yeni", kredi: 24 },
    { ad: "Minimax Hailuo 2.3 Fast", coz: "1080p", sureAralik: "6-10sn", kredi: 18 },
    { ad: "Minimax Hailuo 2.3", coz: "1080p", sureAralik: "6-10sn", kredi: 20 },
    { ad: "Minimax Hailuo 02 Fast", coz: "512p", sureAralik: "6-10sn", kredi: 14 },
    { ad: "Minimax Hailuo 02", coz: "1080p", sureAralik: "6-10sn", kredi: 18 },
  ]},
  { ad: "Kling", ozet: "Gelişmiş video kontrolüyle kusursuz hareket", grup: "tum", varyantlar: [
    { ad: "Kling 4.0", coz: "4K", sureAralik: "3-15sn", ses: true, rozet: "Yeni", kredi: 52 },
    { ad: "Kling 3.0", coz: "4K", sureAralik: "3-15sn", ses: true, kredi: 48 },
    { ad: "Kling 3.0 Turbo", coz: "1080p", sureAralik: "3-15sn", ses: true, rozet: "Yeni", kredi: 32 },
    { ad: "Kling 3.0 Omni", coz: "4K", sureAralik: "3-15sn", rozet: "Özel", kredi: 54 },
    { ad: "Kling 3.0 Omni Edit", coz: "1080p", sureAralik: "3-10sn", rozet: "Özel", kredi: 48 },
    { ad: "Kling 2.6", coz: "1080p", sureAralik: "5-10sn", ses: true, kredi: 40 },
    { ad: "Kling O1 Video", coz: "1080p", sureAralik: "5-10sn", kredi: 40 },
    { ad: "Kling O1 Video Edit", coz: "1080p", sureAralik: "3-10sn", kredi: 44 },
    { ad: "Kling Motion Control", coz: "1080p", sureAralik: "3-30sn", kredi: 46 },
  ]},
  { ad: "OpenAI Sora 2", ozet: "Sesli çok-çekimli video üretimi", grup: "tum", varyantlar: [
    { ad: "Sora 2", coz: "720p", sureAralik: "4-12sn", ses: true, kredi: 60 },
    { ad: "Sora 2 Pro", coz: "1080p", sureAralik: "4-12sn", ses: true, kredi: 72 },
    { ad: "Sora 2 Max", coz: "1080p", sureAralik: "4-12sn", rozet: "Vayra", kredi: 80 },
    { ad: "Sora 2 Pro Max", coz: "1080p", sureAralik: "4-12sn", rozet: "Vayra", kredi: 90 },
  ]},
  { ad: "Google Veo", ozet: "Ses kontrolüyle hassas video", grup: "tum", varyantlar: [
    { ad: "Google Veo 3.1 Lite", coz: "1080p", sureAralik: "4-8sn", ses: true, rozet: "Yeni", kredi: 40 },
    { ad: "Google Veo 3.1 Fast", coz: "1080p", sureAralik: "4-8sn", ses: true, kredi: 44 },
    { ad: "Google Veo 3.1", coz: "1080p", sureAralik: "4-8sn", ses: true, kredi: 55 },
    { ad: "Google Veo 3 Fast", coz: "1080p", sureAralik: "8sn", ses: true, kredi: 50 },
    { ad: "Google Veo 3", coz: "1080p", sureAralik: "8sn", ses: true, kredi: 55 },
  ]},
  { ad: "Vayra", ozet: "Gelişmiş kamera kontrolleri ve efekt presetleri", grup: "tum", varyantlar: [
    { ad: "Vayra Lite", coz: "720p", sureAralik: "3-5sn", kredi: 7 },
    { ad: "Vayra Standard", coz: "720p", sureAralik: "3-5sn", kredi: 12 },
    { ad: "Vayra Turbo", coz: "720p", sureAralik: "3-5sn", kredi: 10 },
  ]},
  { ad: "Wan", ozet: "Kamera kontrollü, sesli, daha özgür video", grup: "tum", varyantlar: [
    { ad: "Wan 3.0 Prime", coz: "1080p", sureAralik: "5-15sn", ses: true, rozet: "Yeni", kredi: 34 },
    { ad: "Wan 2.7", coz: "1080p", sureAralik: "2-15sn", kredi: 30 },
    { ad: "Wan 2.6", coz: "1080p", sureAralik: "5-15sn", rozet: "Yeni", kredi: 28 },
    { ad: "Wan 2.5", coz: "1080p", sureAralik: "5-10sn", ses: true, kredi: 26 },
    { ad: "Wan 2.5 Fast", coz: "1080p", sureAralik: "5-10sn", ses: true, kredi: 22 },
    { ad: "Wan 2.2", coz: "720p", sureAralik: "5sn", kredi: 18 },
    { ad: "Wan 2.2 Fast", coz: "720p", sureAralik: "5sn", kredi: 16 },
  ]},
  { ad: "Seedance ", ozet: "Sinematik, çok-çekimli video üretimi", grup: "tum", varyantlar: [
    { ad: "Seedance 2.5", coz: "1080p", sureAralik: "4-30sn", ses: true, rozet: "Yeni", kredi: 50 },
    { ad: "Seedance 2.0 Fast", coz: "720p", sureAralik: "4-15sn", kredi: 24 },
    { ad: "Seedance 2.0 Mini", coz: "720p", sureAralik: "4-15sn", rozet: "Özel", kredi: 20 },
    { ad: "Seedance 2.0", coz: "4K", sureAralik: "4-15sn", kredi: 42 },
    { ad: "Seedance 1.5 Pro", coz: "720p", sureAralik: "4-12sn", kredi: 30 },
    { ad: "Seedance Pro", coz: "1080p", sureAralik: "5-10sn", kredi: 34 },
    { ad: "Seedance Pro Fast", coz: "1080p", sureAralik: "5-10sn", kredi: 28 },
  ]},
  { ad: "HappyHorse ", ozet: "Alibaba: yüksek dinamik, sesli, VFX hazır", grup: "tum", varyantlar: [
    { ad: "HappyHorse 1.1", coz: "1080p", sureAralik: "3-15sn", ses: true, rozet: "Yeni", kredi: 30 },
  ]},
  { ad: "FLUX Video", ozet: "Black Forest Labs: istemden, görselden ve iki kareden", grup: "tum", varyantlar: [
    { ad: "FLUX 3 Max Video", coz: "1080p", sureAralik: "5-10sn", rozet: "Yeni", kredi: 44 },
  ]},
  { ad: "Luma Ray", ozet: "Sinematik ışık, ilk ve son kare", grup: "tum", varyantlar: [
    { ad: "Luma Ray 3", coz: "1080p", sureAralik: "5-9sn", rozet: "Yeni", kredi: 46 },
  ]},
  { ad: "LTX", ozet: "Lightricks: hızlı, sesli, 4K'ya kadar", grup: "tum", varyantlar: [
    { ad: "LTX-2.5 Fast", coz: "4K", sureAralik: "6-10sn", ses: true, rozet: "Hızlı", kredi: 16 },
  ]},
  { ad: "PixVerse", ozet: "Akıcı hareket, efekt ve stil", grup: "tum", varyantlar: [
    { ad: "PixVerse V6", coz: "1080p", sureAralik: "5-8sn", ses: true, rozet: "Yeni", kredi: 22 },
  ]},
  { ad: "Vidu", ozet: "Tutarlı karakter, anime ve sesli kısa klip", grup: "tum", varyantlar: [
    { ad: "Vidu Q3", coz: "1080p", sureAralik: "4-8sn", ses: true, rozet: "Yeni", kredi: 26 },
  ]},
  { ad: "Grok Imagine", ozet: "Gelişmiş video kontrolüyle kusursuz hareket", grup: "tum", varyantlar: [
    { ad: "Grok Imagine", coz: "720p", sureAralik: "1-15sn", kredi: 20 },
    { ad: "Grok Imagine 1.5", coz: "720p", sureAralik: "1-15sn", rozet: "Yeni", kredi: 22 },
    { ad: "Grok Imagine Edit", coz: "720p", sureAralik: "1-15sn", kredi: 24 },
  ]},
];
// Tüm varyantları düz listeye indir (arama + kredi/coz aramak için).
export const TUM_VARYANTLAR: VideoModel[] = MODEL_AILELERI.flatMap((a) => a.varyantlar);

export function videoModelBul(ad: string): VideoModel | undefined {
  return TUM_VARYANTLAR.find((v) => v.ad === ad);
}

// ─────────────────────────────────────────────────────────────────────────
// Higgsfield birebir: model ADINA göre composer davranışını türet (higg-video-model
// analizi). Bir yerde toplanır ki liste sade kalsın, "kalıntı" olmasın.
// ─────────────────────────────────────────────────────────────────────────
export type VideoOzellik = {
  kutu: VideoKutu; sure: number; oran?: string; oranGizli: boolean; cozGizli: boolean;
  enhance: boolean; cokCekim: boolean; sesToggle: boolean; bitrate: boolean;
  medyaTipi?: string; medyaSayisi?: number; not?: string; kredi: number; coz: string;
  /** Süre sağlayıcıda seçilemiyor (model belirler). */
  sureGizli?: boolean;
  sureler: number[];   // modele özel süre seçenekleri (sn)
  cozler: string[];    // modele özel çözünürlük seçenekleri
  oranlar: string[];   // modelin desteklediği en-boy oranları (oran çipi gizliyse boş)
};
// "6-10sn" / "4-15sn" / "8sn" → seçilebilir süre listesi (sn). Higgsfield birebir aralık.
export function sureListesi(aralik: string): number[] {
  const m = aralik.replace(/sn/gi, "").split("-").map((x) => parseInt(x.trim(), 10)).filter((n) => !isNaN(n));
  if (m.length === 1) return [m[0]];
  const [a, b] = m;
  const HAM = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 30];
  const liste = HAM.filter((s) => s >= a && s <= b);
  if (!liste.includes(a)) liste.unshift(a);
  if (!liste.includes(b)) liste.push(b);
  return [...new Set(liste)].sort((x, y) => x - y);
}
// Varsayılan çözünürlüğe göre modelin sunduğu çözünürlük seti (Higgsfield birebir kademeler).
export function cozListesi(coz: string): string[] {
  const TABAN = ["480p", "512p", "720p", "768p", "1080p", "4K"];
  const sira = TABAN.indexOf(coz);
  if (coz === "512p") return ["512p"];
  if (coz === "768p") return ["768p"];
  if (coz === "480p") return ["480p", "720p"];
  if (coz === "4K") return ["720p", "1080p", "4K"];
  if (sira < 0) return [coz];
  // 720p/1080p → o değere kadar kademeler
  return TABAN.filter((c) => !["512p", "768p"].includes(c)).filter((c) => TABAN.indexOf(c) <= sira);
}
/**
 * Composer davranışı + modelin GERÇEK kısıtları. Oran, çözünürlük ve süre havuzları ölçülmüş
 * model spec'inden (videoModelSpec) gelir; böylece ör. Veo 3.1'e desteklemediği 1:1 oran sunulmaz.
 * Kredi her zaman stüdyo kataloğundan (MODEL_AILELERI) gelir.
 */
export function videoModelOzellik(ad: string): VideoOzellik {
  return erisimUygula(ad, videoModelOzellikSpec(ad));
}

/**
 * Sağlayıcısı bağlı modelde çipler sağlayıcının GERÇEK izinli değerlerinden gelir (videoSaglayici);
 * böylece seçilen her süre/çözünürlük/oran/ses sağlayıcıya gider. Sağlayıcıda karşılığı olmayan
 * kontroller (ör. "bit hızı") gösterilmez.
 */
function erisimUygula(ad: string, t: VideoOzellik): VideoOzellik {
  const e = videoErisim(ad);
  if (e.durum !== "gercek") return t;
  t.sureGizli = !e.sureler.length;
  t.sureler = e.sureler;
  if (e.sureler.length && !e.sureler.includes(t.sure)) t.sure = e.sureler.includes(5) ? 5 : e.sureler[0];
  // Sağlayıcıda "istemi iyileştir" parametresi yok (MiniMax'ta varsayılan açık): çip gösterilmez.
  t.enhance = false;
  t.cozler = e.cozler; t.cozGizli = false;
  if (!e.cozler.includes(t.coz)) t.coz = e.cozler.includes("720p") ? "720p" : e.cozler[0];
  t.oranlar = e.oranlar; t.oranGizli = !e.oranlar.length;
  if (e.oranlar.length && (!t.oran || !e.oranlar.includes(t.oran))) t.oran = e.oranlar[0];
  t.sesToggle = e.ses === "toggle";
  t.cokCekim = !!e.cokCekim;
  t.bitrate = false;
  t.kutu = e.sonKare ? "kareler" : "tek";
  if (e.gorselGerekli) t.not = "Bu model yalnız görselden video üretir; başlangıç karesi gerekli.";
  return t;
}

function videoModelOzellikSpec(ad: string): VideoOzellik {
  const t = videoModelOzellikHam(ad);
  const sp = modelBul(ad);
  if (!sp) return t;
  t.oranlar = sp.oranlar ?? [];
  t.oranGizli = !t.oranlar.length;
  if (t.oranlar.length && (!t.oran || !t.oranlar.includes(t.oran))) t.oran = sp.oran && t.oranlar.includes(sp.oran) ? sp.oran : t.oranlar[0];
  const cozler = sp.cozler ?? (sp.coz ? [sp.coz] : null);
  if (cozler) { t.cozler = cozler; if (!cozler.includes(t.coz)) t.coz = sp.coz && cozler.includes(sp.coz) ? sp.coz : cozler[cozler.length - 1]; }
  const sureler = sp.sureler ?? (sp.sure ? [sp.sure] : null);
  if (sureler) { t.sureler = sureler; if (!sureler.includes(t.sure)) t.sure = sp.sure && sureler.includes(sp.sure) ? sp.sure : sureler[sureler.length - 1]; }
  return t;
}

function videoModelOzellikHam(ad: string): VideoOzellik {
  const v = videoModelBul(ad);
  const t: VideoOzellik = {
    kutu: "tek", sure: 5, oran: "16:9", oranGizli: false, cozGizli: false,
    enhance: true, cokCekim: false, sesToggle: false, bitrate: false,
    kredi: v?.kredi ?? 30, coz: v?.coz ?? "1080p",
    sureler: sureListesi(v?.sureAralik ?? "4-10sn"), cozler: cozListesi(v?.coz ?? "1080p"), oranlar: VIDEO_ORANLAR,
  };
  const has = (s: string) => ad.toLowerCase().includes(s.toLowerCase());

  // Minimax Hailuo — tek/kareler, 6s, 768p, oran yok
  if (has("Minimax Hailuo")) { t.sure = 6; t.coz = "768p"; t.oranGizli = true; t.kutu = /02\b/.test(ad) ? "kareler" : "tek"; return t; }
  // Kling 3.0 (baz) — kareler, 10s, 4K, çok çekim + sesToggle(off)
  if (ad === "Kling 3.0") { t.kutu = "kareler"; t.sure = 10; t.oran = "16:9"; t.cokCekim = true; t.enhance = true; return t; }
  if (ad === "Kling 3.0 Turbo") { t.sure = 5; t.oran = "16:9"; return t; }
  if (has("Kling 3.0 Omni Edit")) { t.kutu = "edit"; t.sure = 5; return t; }
  if (has("Kling 3.0 Omni")) { t.kutu = "medya"; t.medyaTipi = "Karakter, kişi ya da nesne"; t.sure = 5; t.oran = "1:1"; t.cokCekim = true; return t; }
  if (ad === "Kling 2.6") { t.sure = 5; t.oran = "16:9"; t.cozGizli = true; t.sesToggle = true; return t; }
  if (has("Kling O1 Video Edit")) { t.kutu = "edit"; t.medyaSayisi = 4; return t; }
  if (has("Kling O1")) { t.kutu = "kareler"; t.sure = 5; t.oran = "1:1"; t.not = "Videonu düzenlemek için Düzenle moduna geç."; return t; }
  if (has("Kling 2.5 Turbo")) { t.kutu = "kareler"; t.sure = 5; return t; }
  if (has("Kling 2.1 Master")) { t.sure = 5; return t; }
  if (has("Kling 2.1")) { t.kutu = "kareler"; t.sure = 5; t.coz = "720p"; return t; }
  if (has("Kling Motion Control") || has("Motion Control")) { t.kutu = "hareket"; t.sure = 5; return t; }
  // Sora 2 — tek(opsiyonel), 12s, 16:9, enhance yok
  if (has("Sora 2")) { t.sure = 12; t.oran = "16:9"; t.enhance = false; t.cozGizli = ad === "Sora 2"; if (has("Max")) t.not = has("Pro") ? undefined : "İnsan yüzü girdisi desteklenmez."; return t; }
  // Google Veo
  if (has("Veo 3.1 Fast")) { t.sure = 8; t.oran = "16:9"; t.cokCekim = true; return t; }
  if (has("Veo 3.1 Lite")) { t.sure = 8; t.oran = "Auto"; t.coz = "720p"; return t; }
  if (has("Veo 3")) { t.oran = "16:9"; t.coz = "720p"; return t; }
  // Gemini Omni Flash — medya (görsel/video)
  if (has("Gemini Omni")) { t.kutu = "medya"; t.medyaTipi = "Görsel veya Video"; t.sure = 8; t.oran = "16:9"; return t; }
  // Vayra DoP (Higgsfield DoP karşılığı) — Mix + Advanced, oran/coz gizli
  if (has("Vayra")) { t.sure = 5; t.oranGizli = true; t.cozGizli = true; return t; }
  // Wan
  if (ad === "Wan 2.7") { t.kutu = "kareler"; t.sure = 12; t.coz = "1080p"; t.oranGizli = true; t.enhance = false; return t; }
  if (ad === "Wan 2.6") { t.kutu = "medya"; t.medyaTipi = "Görsel veya Video"; t.sure = 5; t.coz = "720p"; t.oranGizli = true; t.cokCekim = true; return t; }
  if (has("Wan 2.5")) { t.sure = 5; t.oran = "16:9"; t.coz = has("Fast") ? "720p" : "480p"; return t; }
  if (has("Wan 2.2")) { t.sure = 5; t.oranGizli = true; t.cozGizli = true; return t; }
  // Seedance
  if (has("Seedance 2.0")) { t.kutu = "medya"; t.medyaTipi = "Görsel, Video veya Ses"; t.sure = 15; t.oran = "Auto"; t.coz = "720p"; t.bitrate = !has("Mini"); t.enhance = false; return t; }
  if (has("Seedance 1.5 Pro")) { t.kutu = "kareler"; t.sure = 8; t.oran = "Auto"; t.coz = "720p"; t.sesToggle = true; return t; }
  if (has("Seedance Pro")) { t.sure = 5; t.coz = "720p"; t.oranGizli = true; t.cokCekim = true; return t; }
  // Grok Imagine
  if (has("Grok Imagine Edit")) { t.kutu = "edit"; t.enhance = false; return t; }
  if (has("Grok Imagine 1.5")) { t.sure = 5; t.coz = "720p"; t.oranGizli = true; t.enhance = false; return t; }
  if (has("Grok Imagine")) { t.sure = 15; t.oran = "Auto"; t.coz = "720p"; t.enhance = false; return t; }
  // HappyHorse
  if (has("HappyHorse")) { t.sure = 12; t.oran = "16:9"; t.coz = "1080p"; t.enhance = false; return t; }
  return t;
}

// Video kredi maliyeti — önce varyant kataloğu, sonra aile kuralı (Higgsfield birebir). CTA + uret() ortak kullanır.
export function videoKrediHesap(model: string): number {
  const v = videoModelBul(model);
  if (v) return v.kredi;
  if (/sora/i.test(model)) return 60;
  if (/veo/i.test(model)) return 55;
  if (/kling/i.test(model)) return 48;
  if (/seedance/i.test(model)) return 42;
  if (/wan/i.test(model)) return 38;
  if (/hailuo|minimax/i.test(model)) return 20;
  if (/gemini/i.test(model)) return 24;
  return 7;
}
