import { SABLON_OZETLERI } from "./sablonlar/ozet";
import type { ProjeTur } from "./tipler";

/**
 * Vayra Build vitrini: ana sayfa duvarında akan proje ekranları. Görseller Build şablonlarının gerçek önizleme
 * kapaklarıdır; karoya tıklayınca kutuya o tür ve şablonun tarifi (istem olarak) dolar.
 */
export type DuvarKaro = { g: string; ad: string; tur: ProjeTur; istem: string; telefon?: boolean };

export const DUVAR: DuvarKaro[] = SABLON_OZETLERI.map((s) => ({ g: s.kapak, ad: s.ad, tur: s.tur, istem: s.aciklama }));

/** Duvarın sıraları: her sıra listeyi farklı bir yerden başlatır ve farklı adımla dolaşır; en az 8 karo. */
export function duvarSiralari(n = 5, uzunluk = 8): DuvarKaro[][] {
  const L = DUVAR.length;
  return Array.from({ length: n }, (_, s) => Array.from({ length: uzunluk }, (_, i) => DUVAR[(s * 3 + i * (s % 2 ? 1 : L > 3 ? 3 : 1)) % L]));
}
