/**
 * Tür renk kodlaması — her çıktı türü her yüzeyde aynı renkle tanınır.
 * Renkler globals.css @theme'deki --color-tur-* token'larından gelir.
 * Tailwind sınıfları tam yazılır (dinamik birleştirme derlenmez).
 */
export type RenkTuru = "gorsel" | "video" | "ses" | "muzik" | "3d" | "canvas" | "vurgu";

/** İkon karosu: renkli yarı saydam zemin + renkli ikon + ince halka. */
export const IKON_KARO: Record<RenkTuru, string> = {
  gorsel: "bg-tur-gorsel/12 text-tur-gorsel ring-tur-gorsel/20",
  video: "bg-tur-video/12 text-tur-video ring-tur-video/20",
  ses: "bg-tur-ses/12 text-tur-ses ring-tur-ses/20",
  muzik: "bg-tur-muzik/12 text-tur-muzik ring-tur-muzik/20",
  "3d": "bg-tur-3d/12 text-tur-3d ring-tur-3d/20",
  canvas: "bg-tur-canvas/12 text-tur-canvas ring-tur-canvas/20",
  vurgu: "bg-vurgu/15 text-vurgu ring-vurgu/25",
};

/** Yalnız metin rengi. */
export const METIN_RENK: Record<RenkTuru, string> = {
  gorsel: "text-tur-gorsel", video: "text-tur-video", ses: "text-tur-ses",
  muzik: "text-tur-muzik", "3d": "text-tur-3d", canvas: "text-tur-canvas", vurgu: "text-vurgu",
};

/** Hover'da karonun dolduğu varyant (menü satırları). */
export const IKON_KARO_HOVER: Record<RenkTuru, string> = {
  gorsel: "group-hover:bg-tur-gorsel group-hover:text-[#0a0a0b]",
  video: "group-hover:bg-tur-video group-hover:text-[#0a0a0b]",
  ses: "group-hover:bg-tur-ses group-hover:text-[#0a0a0b]",
  muzik: "group-hover:bg-tur-muzik group-hover:text-[#0a0a0b]",
  "3d": "group-hover:bg-tur-3d group-hover:text-[#0a0a0b]",
  canvas: "group-hover:bg-tur-canvas group-hover:text-[#0a0a0b]",
  vurgu: "group-hover:bg-vurgu group-hover:text-white",
};

/** Model türü (catalog) → renk. */
export function modelTurRenk(tur: string): RenkTuru {
  if (tur === "gorsel" || tur === "video" || tur === "ses" || tur === "muzik" || tur === "3d") return tur;
  return "vurgu";
}
