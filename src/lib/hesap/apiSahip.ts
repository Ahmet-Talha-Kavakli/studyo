import "server-only";
import path from "path";
import { HESAP_KOK, jsonOku, jsonYaz, kilitle, ozet } from "./depo";

/**
 * Vayra API anahtarı → sahip hesap. Anahtarlar veritabanısız doğrulanır (sağlama toplamı), sahibini taşımaz;
 * bu yüzden canlı anahtar, panel oturum açıkken anahtar ayarlarını ilk kez yüklediğinde (PUT /v1/keys/self)
 * o oturumun hesabına bağlanır. Bir anahtar tek hesaba bağlanır; kredi o hesabın defterinden kesilir.
 *   api-anahtar/<kid özeti>.json  { uid, baglanma }
 */
const dosya = (kid: string) => path.join(HESAP_KOK, "api-anahtar", `${ozet(kid)}.json`);

export async function apiSahibi(kid: string): Promise<string | null> {
  return (await jsonOku<{ uid: string }>(dosya(kid)))?.uid ?? null;
}

/** Anahtarı hesaba bağlar. Başka hesaba bağlıysa "baska" döner ve değiştirmez. */
export async function apiSahipBagla(kid: string, uid: string): Promise<"tamam" | "baska"> {
  return kilitle(`api-sahip:${kid}`, async () => {
    const v = await jsonOku<{ uid: string }>(dosya(kid));
    if (v?.uid === uid) return "tamam";
    if (v?.uid) return "baska";
    await jsonYaz(dosya(kid), { uid, baglanma: Date.now() });
    return "tamam";
  });
}
