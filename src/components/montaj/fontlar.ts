import { Inter, Montserrat, Anton, Bebas_Neue, Playfair_Display, Caveat, Oswald, Space_Grotesk, DM_Serif_Display, Poppins, Archivo_Black, Lobster } from "next/font/google";
import { fontKaydet } from "@/lib/montajMotor";

/**
 * Montaj yazı tipleri — tuval (önizleme + dışa aktarma) gerçek aile adlarıyla çizer.
 * Hepsi Türkçe karakterler için latin-ext içerir.
 */
const inter = Inter({ subsets: ["latin", "latin-ext"], weight: ["300", "500", "700", "800", "900"], display: "swap" });
const montserrat = Montserrat({ subsets: ["latin", "latin-ext"], weight: ["500", "700", "900"], display: "swap" });
const anton = Anton({ subsets: ["latin", "latin-ext"], weight: "400", display: "swap" });
const bebas = Bebas_Neue({ subsets: ["latin", "latin-ext"], weight: "400", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin", "latin-ext"], weight: ["500", "800"], style: ["normal", "italic"], display: "swap" });
const caveat = Caveat({ subsets: ["latin", "latin-ext"], weight: ["500", "700"], display: "swap" });
const oswald = Oswald({ subsets: ["latin", "latin-ext"], weight: ["400", "700"], display: "swap" });
const grotesk = Space_Grotesk({ subsets: ["latin", "latin-ext"], weight: ["500", "700"], display: "swap" });
const dmSerif = DM_Serif_Display({ subsets: ["latin", "latin-ext"], weight: "400", display: "swap" });
const poppins = Poppins({ subsets: ["latin", "latin-ext"], weight: ["500", "700", "900"], display: "swap" });
const archivo = Archivo_Black({ subsets: ["latin", "latin-ext"], weight: "400", display: "swap" });
const lobster = Lobster({ subsets: ["latin", "latin-ext"], weight: "400", display: "swap" });

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
