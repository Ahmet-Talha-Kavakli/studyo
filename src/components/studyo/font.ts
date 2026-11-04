import { Instrument_Serif } from "next/font/google";

/** Stüdyo başlık yüzü — sayfa başlıkları, boş durum ve şarkı/ses adı gibi büyük başlıklar.
 *  Denetimler (düğme, etiket, girdi) arayüz yazı tipinde kalır. */
export const ekranFont = Instrument_Serif({ subsets: ["latin", "latin-ext"], weight: "400", style: ["normal", "italic"], variable: "--font-ekran", display: "swap" });
