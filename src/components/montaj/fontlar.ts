import localFont from "next/font/local";
import { fontKaydet } from "@/lib/montajMotor";

/**
 * Montaj yazı tipleri — tuval (önizleme + dışa aktarma) gerçek aile adlarıyla çizer.
 * Dosyalar projede (yazitipi/, Google Fonts tam TTF, Türkçe karakterler dahil): derleme sırasında
 * Google Fonts'a bağlanılmaz (Vercel derlemesi next/font/google yüzünden kırılıyordu, 2026-11-04).
 */
const inter = localFont({ src: [{ path: "./yazitipi/inter-300.ttf", weight: "300", style: "normal" }, { path: "./yazitipi/inter-500.ttf", weight: "500", style: "normal" }, { path: "./yazitipi/inter-700.ttf", weight: "700", style: "normal" }, { path: "./yazitipi/inter-800.ttf", weight: "800", style: "normal" }, { path: "./yazitipi/inter-900.ttf", weight: "900", style: "normal" }], display: "swap", fallback: ["system-ui", "sans-serif"] }); // Inter
const montserrat = localFont({ src: [{ path: "./yazitipi/montserrat-500.ttf", weight: "500", style: "normal" }, { path: "./yazitipi/montserrat-700.ttf", weight: "700", style: "normal" }, { path: "./yazitipi/montserrat-900.ttf", weight: "900", style: "normal" }], display: "swap", fallback: ["system-ui", "sans-serif"] }); // Montserrat
const anton = localFont({ src: [{ path: "./yazitipi/anton-400.ttf", weight: "400", style: "normal" }], display: "swap", fallback: ["system-ui", "sans-serif"] }); // Anton
const bebas = localFont({ src: [{ path: "./yazitipi/bebas-400.ttf", weight: "400", style: "normal" }], display: "swap", fallback: ["system-ui", "sans-serif"] }); // Bebas Neue
const playfair = localFont({ src: [{ path: "./yazitipi/playfair-500i.ttf", weight: "500", style: "italic" }, { path: "./yazitipi/playfair-800i.ttf", weight: "800", style: "italic" }, { path: "./yazitipi/playfair-500.ttf", weight: "500", style: "normal" }, { path: "./yazitipi/playfair-800.ttf", weight: "800", style: "normal" }], display: "swap", fallback: ["system-ui", "sans-serif"] }); // Playfair Display
const caveat = localFont({ src: [{ path: "./yazitipi/caveat-500.ttf", weight: "500", style: "normal" }, { path: "./yazitipi/caveat-700.ttf", weight: "700", style: "normal" }], display: "swap", fallback: ["system-ui", "sans-serif"] }); // Caveat
const oswald = localFont({ src: [{ path: "./yazitipi/oswald-400.ttf", weight: "400", style: "normal" }, { path: "./yazitipi/oswald-700.ttf", weight: "700", style: "normal" }], display: "swap", fallback: ["system-ui", "sans-serif"] }); // Oswald
const grotesk = localFont({ src: [{ path: "./yazitipi/grotesk-500.ttf", weight: "500", style: "normal" }, { path: "./yazitipi/grotesk-700.ttf", weight: "700", style: "normal" }], display: "swap", fallback: ["system-ui", "sans-serif"] }); // Space Grotesk
const dmSerif = localFont({ src: [{ path: "./yazitipi/dmSerif-400.ttf", weight: "400", style: "normal" }], display: "swap", fallback: ["system-ui", "sans-serif"] }); // DM Serif Display
const poppins = localFont({ src: [{ path: "./yazitipi/poppins-500.ttf", weight: "500", style: "normal" }, { path: "./yazitipi/poppins-700.ttf", weight: "700", style: "normal" }, { path: "./yazitipi/poppins-900.ttf", weight: "900", style: "normal" }], display: "swap", fallback: ["system-ui", "sans-serif"] }); // Poppins
const archivo = localFont({ src: [{ path: "./yazitipi/archivo-400.ttf", weight: "400", style: "normal" }], display: "swap", fallback: ["system-ui", "sans-serif"] }); // Archivo Black
const lobster = localFont({ src: [{ path: "./yazitipi/lobster-400.ttf", weight: "400", style: "normal" }], display: "swap", fallback: ["system-ui", "sans-serif"] }); // Lobster

export type MontajFont = { id: string; ad: string; tur: "Sans" | "Serif" | "Gösteri" | "El yazısı"; aile: string; agirlik?: number };

export const FONTLAR: MontajFont[] = [
  { id: "inter", ad: "Inter", tur: "Sans", aile: inter.style.fontFamily },
  { id: "montserrat", ad: "Montserrat", tur: "Sans", aile: montserrat.style.fontFamily },
  { id: "poppins", ad: "Poppins", tur: "Sans", aile: poppins.style.fontFamily },
  { id: "grotesk", ad: "Space Grotesk", tur: "Sans", aile: grotesk.style.fontFamily },
  { id: "anton", ad: "Anton", tur: "Gösteri", aile: anton.style.fontFamily, agirlik: 400 },
  { id: "bebas", ad: "Bebas Neue", tur: "Gösteri", aile: bebas.style.fontFamily, agirlik: 400 },
  { id: "oswald", ad: "Oswald", tur: "Gösteri", aile: oswald.style.fontFamily },
  { id: "archivo", ad: "Archivo Black", tur: "Gösteri", aile: archivo.style.fontFamily, agirlik: 400 },
  { id: "playfair", ad: "Playfair", tur: "Serif", aile: playfair.style.fontFamily },
  { id: "dmserif", ad: "DM Serif", tur: "Serif", aile: dmSerif.style.fontFamily, agirlik: 400 },
  { id: "caveat", ad: "Caveat", tur: "El yazısı", aile: caveat.style.fontFamily },
  { id: "lobster", ad: "Lobster", tur: "El yazısı", aile: lobster.style.fontFamily, agirlik: 400 },
];

fontKaydet(Object.fromEntries(FONTLAR.map((f) => [f.id, { aile: f.aile, agirlik: f.agirlik }])));

let yuklendi: Promise<void> | null = null;
/** Tüm yazı tiplerini tarayıcıya yükler (tuval, yüklenmemiş fontu yedekle çizer). */
export function fontlariYukle(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return Promise.resolve();
  yuklendi ??= Promise.all(FONTLAR.flatMap((f) => [400, 700, 900].map((w) => document.fonts.load(`${f.agirlik ?? w} 32px ${f.aile}`, "Aa İşĞüÇöÜ").catch(() => [])))).then(() => undefined);
  return yuklendi;
}
