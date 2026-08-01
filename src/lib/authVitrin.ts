/**
 * Auth modalı sol panel vitrini — Higgsfield'in "Seedance 2.0 4K / Higgsfield Soul"
 * dönen ürün tanıtım kartlarının Vayra karşılığı. Her slide: büyük görsel (stok
 * tohumu), başlık, açıklama, kalite rozetleri. Alt geçiş çizgileriyle döner.
 */
export interface VitrinSlide {
  id: string;
  baslik: string;
  aciklama: string;
  tohum: string;      // onizlemeArka görsel tohumu (video yüklenene kadar poster)
  kategori: string;   // stok görsel kategorisi
  video?: string;     // /gercek/preset-video/<video>.mp4 — arka planda oynayan tanıtım klibi
  rozetler: string[];
}

export const AUTH_VITRIN: VitrinSlide[] = [
  {
    id: "video", baslik: "Vayra Video 4K", aciklama: "Metinden sinematik, tam 4K çözünürlükte video üret.",
    tohum: "auth-video-sinematik-4k", kategori: "sinematik", video: "orbit-360", rozetler: ["4K Çözünürlük", "Sinematik"],
  },
  {
    id: "muzik", baslik: "Vayra Müzik", aciklama: "Fikrinden vokalli, tam prodüksiyon şarkı — saniyeler içinde.",
    tohum: "auth-muzik-neon-studio", kategori: "soyut", video: "elevate", rozetler: ["2 Varyant", "Stem Ayır"],
  },
  {
    id: "kimlik", baslik: "Vayra Ruh Kimliği", aciklama: "Görsel ve videolarda tutarlı karakterlerle hikâye anlat.",
    tohum: "auth-kimlik-portre-tutarli", kategori: "portre", video: "float-spin", rozetler: ["Tutarlı Karakter", "2K Kalite"],
  },
  {
    id: "3d", baslik: "Vayra 3D Stüdyo", aciklama: "Metin veya görselden üretime hazır 3D model, rig ve baskı.",
    tohum: "auth-3d-model-uretim", kategori: "3d", video: "action-figure", rozetler: ["Metin→3D", "Rig & Baskı"],
  },
];
