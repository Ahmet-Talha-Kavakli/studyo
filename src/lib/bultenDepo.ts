import "server-only";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { dizinListe, jsonOku, jsonYaz, kilitle, ozet } from "@/lib/hesap/depo";

/**
 * Blog bülteni aboneleri: .veri/bulten/<e-posta özeti>.json. Yönetim panelinde (Büyüme) listelenir.
 */
export const BULTEN_KOK = path.join(DEPO_KOK, "bulten");
export interface BultenAbonesi { email: string; konular: string[]; ilk: number; zaman: number }

const dosya = (email: string) => path.join(BULTEN_KOK, `${ozet(`bulten:${email}`)}.json`);

/** Aboneliği kaydeder ya da günceller. Daha önce kayıtlıysa true döner. */
export async function bultenKaydet(email: string, konular: string[]): Promise<boolean> {
  return kilitle(`bulten:${email}`, async () => {
    const once = await jsonOku<BultenAbonesi>(dosya(email));
    await jsonYaz(dosya(email), { email, konular, ilk: once?.ilk ?? Date.now(), zaman: Date.now() } satisfies BultenAbonesi);
    return !!once;
  });
}

export async function bultenAboneleri(): Promise<BultenAbonesi[]> {
  const l = await Promise.all((await dizinListe(BULTEN_KOK)).filter((a) => a.endsWith(".json")).map((a) => jsonOku<BultenAbonesi>(path.join(BULTEN_KOK, a))));
  return l.filter((x): x is BultenAbonesi => !!x?.email).sort((a, b) => b.ilk - a.ilk);
}
