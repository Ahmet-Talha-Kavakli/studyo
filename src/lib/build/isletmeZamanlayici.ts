import "server-only";
import { epostaKurulu } from "./bulutEposta";
import { artikTemizle, isletmeOku, isletmeProjeleri } from "./isletme";
import { mutabakat, siparisler, terkHatirlat, yorumIstekleri, kurlariGuncelle } from "./isletmeMagaza";
import { hatirlatmalariGonder } from "./isletmeRandevu";

/**
 * Vayra İşletme zamanlayıcısı (5 dakikada bir): ödenmiş siparişlerin mutabakatı (varyant stoğu, sipariş e-postaları),
 * randevu hatırlatmaları, teslimden sonra yorum istekleri ve süresi gelen terk edilen sepet hatırlatmaları. İşletme uçlarından biri ilk çağrıldığında
 * başlar (instrumentation-node'a eklenirse sunucu açılışında başlar). E-postadaki bağlantılar için son görülen köken
 * kullanılır.
 */
type G = { __vayraIsletmeZaman?: ReturnType<typeof setInterval>; __vayraIsletmeKoken?: Map<string, string>; __vayraIsletmeSahip?: Map<string, number>; __vayraIsletmeTur?: () => Promise<void> };
const g = globalThis as unknown as G;
const kokenler = (g.__vayraIsletmeKoken ??= new Map<string, string>());
const sahipler = (g.__vayraIsletmeSahip ??= new Map<string, number>());

export const kokenNotEt = (id: string, koken: string) => { if (/^https?:\/\/[^/]+$/.test(koken)) kokenler.set(id, koken); };
const kokenAl = (id: string) => kokenler.get(id) ?? [...kokenler.values()][0] ?? (process.env.VAYRA_ANA_ALAN ? `https://${process.env.VAYRA_ANA_ALAN}` : "http://localhost:3100");
/** Sahip paneli canlı sohbeti açtı (çevrim içi göstergesi için, 2 dakika geçerli). */
export const sahipGorundu = (id: string) => sahipler.set(id, Date.now());
export const sahipCevrimici = (id: string) => Date.now() - (sahipler.get(id) ?? 0) < 120_000;

async function tur() {
  const l = await isletmeProjeleri();
  for (const id of l) {
    try {
      if (await artikTemizle(id)) continue;
      const koken = kokenAl(id);
      await mutabakat(id, koken, true);
      await hatirlatmalariGonder(id, koken);
      await yorumIstekleri(id, koken);
      const v = await isletmeOku(id);
      // Ek para birimlerinin otomatik kurları günde bir kez yenilenir.
      if (v.magaza.ekParaBirimleri.some((e) => e.otomatik) && Date.now() - (v.magaza.kurlar?.z ?? 0) > 20 * 3600_000) await kurlariGuncelle(id).catch(() => null);
      if (v.magaza.terk.acik && epostaKurulu()) {
        const sinir = Date.now() - v.magaza.terk.saat * 3600_000, alt = Date.now() - 7 * 864e5;
        const sl = await siparisler(id, "canli");
        const odeyen = new Map<string, number>();
        for (const s of sl) if (s.durum === "odendi" || s.durum === "iade") odeyen.set(s.eposta, Math.max(odeyen.get(s.eposta) ?? 0, s.olusturma));
        const adaylar = sl.filter((s) => (s.durum === "bekliyor" || s.durum === "basarisiz") && !s.isletme?.hatirlatma && s.olusturma < sinir && s.olusturma > alt && (odeyen.get(s.eposta) ?? 0) < s.olusturma);
        const goruldu = new Set<string>();
        for (const s of adaylar.slice(0, 20)) { if (goruldu.has(s.eposta)) continue; goruldu.add(s.eposta); await terkHatirlat(id, s.siparisNo, koken).catch(() => {}); }
      }
    } catch { /* bir projenin hatası diğerlerini durdurmaz */ }
  }
}
export function isletmeZamanlayici() {
  g.__vayraIsletmeTur = tur;
  if (g.__vayraIsletmeZaman) return;
  g.__vayraIsletmeZaman = setInterval(() => { (g.__vayraIsletmeTur ?? tur)().catch(() => {}); }, 5 * 60_000);
  setTimeout(() => { (g.__vayraIsletmeTur ?? tur)().catch(() => {}); }, 20_000);
}
