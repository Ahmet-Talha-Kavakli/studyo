/**
 * Finansal özet — aylık P&L, plan gelir kırılımı, provider maliyet dağılımı.
 * Seri verisinden (gelir/maliyet) türetilir + statik gider kalemleri.
 */
import type { GunSeri } from "./seriler";
import { PLANLAR } from "../tablolar";
import { PROVIDERLAR } from "../tablolar";
import { prng, tohumla, normal } from "../cekirdek";

export interface PLSatir {
  etiket: string;
  tutar: number; // ₺ (gider ise negatif)
  tur: "gelir" | "gider" | "sonuc";
  yuzde?: number; // brüt gelire oran
}

/** Aylık P&L: Brüt → İadeler → Net gelir → Provider → Storage/CDN → Komisyon → Reklam → Net kâr. */
export function plTablo(seri: GunSeri[]): PLSatir[] {
  const son30 = seri.slice(-30);
  const brut = son30.reduce((a, g) => a + g.gelir, 0);
  const provider = son30.reduce((a, g) => a + g.maliyet, 0);
  const iade = Math.round(brut * 0.032);
  const netGelir = brut - iade;
  const storage = Math.round(brut * 0.018);
  const komisyon = Math.round(brut * 0.029); // Stripe/iyzico
  const reklam = Math.round(brut * 0.14); // Meta/Google
  const digerGider = Math.round(brut * 0.04);
  const netKar = netGelir - provider - storage - komisyon - reklam - digerGider;

  const y = (t: number) => +((t / brut) * 100).toFixed(1);
  return [
    { etiket: "Brüt gelir", tutar: brut, tur: "gelir", yuzde: 100 },
    { etiket: "İadeler & chargeback", tutar: -iade, tur: "gider", yuzde: y(iade) },
    { etiket: "Net gelir", tutar: netGelir, tur: "sonuc", yuzde: y(netGelir) },
    { etiket: "Provider maliyeti", tutar: -provider, tur: "gider", yuzde: y(provider) },
    { etiket: "Storage & CDN", tutar: -storage, tur: "gider", yuzde: y(storage) },
    { etiket: "Ödeme komisyonu", tutar: -komisyon, tur: "gider", yuzde: y(komisyon) },
    { etiket: "Reklam harcaması", tutar: -reklam, tur: "gider", yuzde: y(reklam) },
    { etiket: "Diğer giderler", tutar: -digerGider, tur: "gider", yuzde: y(digerGider) },
    { etiket: "Net kâr", tutar: netKar, tur: "sonuc", yuzde: y(netKar) },
  ];
}

/** Plan bazlı gelir dağılımı (aktif abonelerden). */
export function planGelir(kullanicilar: { plan: string; ayCiro: number; durum: string }[]): { etiket: string; deger: number; renk: string }[] {
  const renk: Record<string, string> = {
    baslangic: "#55d6fd", arti: "#a78bfa", ultra: "#f472b6", kurumsal: "#34d399",
  };
  return PLANLAR.filter((p) => p.id !== "baslangic" || true).map((p) => {
    const deger = kullanicilar
      .filter((k) => k.plan === p.id && k.durum === "aktif")
      .reduce((a, k) => a + k.ayCiro, 0);
    return { etiket: p.ad, deger, renk: renk[p.id] ?? "#9aa0a8" };
  }).filter((x) => x.deger > 0);
}

/** Provider maliyet dağılımı (son 30 gün). */
export function providerMaliyet(): { etiket: string; deger: number; alt: string }[] {
  return PROVIDERLAR.map((pr) => {
    const r = prng(tohumla(`vayra-admin-prov-mal-${pr.id}`));
    const harcama = Math.round((3000 + normal(r) * 8000));
    return { etiket: pr.ad, deger: harcama, alt: `$${harcama.toLocaleString("tr-TR")}` };
  }).sort((a, b) => b.deger - a.deger);
}
