import "server-only";
import path from "path";
import { dizinListe } from "@/lib/hesap/depo";
import { ODEME_KOK, eskileriTemizle } from "./depo";
import { abonelikDenetle } from "./motor";
import { zamanlayiciDamgala } from "@/lib/admin/zamanlayiciIzle";

/**
 * Abonelik denetimi: bütün hesapların dönem sonu, yenileme hatırlatması ve Stripe eşitlemesi.
 * Hem dış zamanlayıcı ucu (/api/odeme/zamanlayici) hem de sunucu içi saatlik döngü kullanır.
 */
export async function abonelikleriDenetle(): Promise<{ denetlenen: number; hatali: number }> {
  let denetlenen = 0, hatali = 0;
  for (const ad of await dizinListe(path.join(ODEME_KOK, "kullanici"))) {
    const uid = ad.replace(/\.json$/, "");
    if (!/^u_[A-Za-z0-9_-]{16}$/.test(uid)) continue;
    try { await abonelikDenetle(uid); denetlenen++; } catch { hatali++; }
  }
  await eskileriTemizle().catch(() => {});
  return { denetlenen, hatali };
}

const g = globalThis as unknown as { __vayraOdemeZamanlayici?: ReturnType<typeof setInterval> };
/** Sürekli çalışan sunucuda saatte bir denetim (ilki açılıştan 2 dakika sonra). */
export function odemeZamanlayiciBaslat() {
  if (g.__vayraOdemeZamanlayici) return;
  const calis = () => { const bas = Date.now(); abonelikleriDenetle().then(() => zamanlayiciDamgala("odeme", bas), (e) => zamanlayiciDamgala("odeme", bas, e)); };
  setTimeout(calis, 120_000);
  g.__vayraOdemeZamanlayici = setInterval(calis, 3_600_000);
}
