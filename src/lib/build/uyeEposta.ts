import "server-only";
import { EPOSTA_TURLERI, sablonDoldur, type EpostaTur } from "./epostaSablon";
import { epostaSablonu } from "./uye";

/** Projenin şablonuyla doldurulmuş üye e-postası: konu, metin, düğme, site adı ve marka (epostaGonder'e verilir). */
export async function sablonluEposta(id: string, tur: EpostaTur, site: string, kisi: { ad?: string; eposta?: string }, adres: string) {
  const { sablon, marka } = await epostaSablonu(id, tur);
  const d = { site, ad: kisi.ad ?? "", eposta: kisi.eposta ?? "", sure: EPOSTA_TURLERI.find((t) => t.id === tur)!.sure };
  return { konu: sablonDoldur(sablon.konu, d), metin: sablonDoldur(sablon.metin, d), dugme: { ad: sablonDoldur(sablon.dugme, d), adres }, site, marka };
}
