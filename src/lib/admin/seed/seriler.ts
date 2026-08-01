/**
 * Zaman serileri — 90 günlük gelir/maliyet/kayıt/job/aktif kullanıcı + saatlik heatmap.
 * Deterministik, hafif büyüme trendi + haftalık dalgalanma.
 */
import { prng, tohumla, normal, BUGUN, GUN } from "../cekirdek";

export interface GunSeri {
  gun: number; // ms (gün başı)
  gelir: number; // ₺
  maliyet: number; // ₺ (provider)
  kayit: number;
  yeniAbone: number;
  churn: number;
  job: number;
  aktifKullanici: number;
}

export function uretSeriler(gunSayisi = 90): GunSeri[] {
  const seri: GunSeri[] = [];
  for (let i = gunSayisi - 1; i >= 0; i--) {
    const r = prng(tohumla(`vayra-admin-seri-v2-${i}`));
    const gun = BUGUN - i * GUN;
    const buyume = 1 + (gunSayisi - i) / gunSayisi * 0.6; // zamanla büyüme
    const haftaGun = new Date(gun).getUTCDay();
    const haftaSonu = haftaGun === 0 || haftaGun === 6 ? 1.18 : 1; // hafta sonu daha aktif
    const gurultu = 0.85 + normal(r) * 0.3;
    const tabanGelir = 14000 * buyume * haftaSonu * gurultu;
    seri.push({
      gun,
      gelir: Math.round(tabanGelir),
      maliyet: Math.round(tabanGelir * (0.28 + normal(r) * 0.08)),
      kayit: Math.round(120 * buyume * haftaSonu * gurultu),
      yeniAbone: Math.round(28 * buyume * gurultu),
      churn: Math.round(9 * gurultu),
      job: Math.round(1800 * buyume * haftaSonu * gurultu),
      aktifKullanici: Math.round(2400 * buyume * haftaSonu * gurultu),
    });
  }
  return seri;
}

/** Saatlik generation heatmap: 7 gün × 24 saat yoğunluk (0-100). */
export function uretHeatmap(): number[][] {
  const mat: number[][] = [];
  for (let g = 0; g < 7; g++) {
    const satir: number[] = [];
    for (let s = 0; s < 24; s++) {
      const r = prng(tohumla(`vayra-admin-heat-${g}-${s}`));
      // Gündüz + akşam pikleri (09-12, 19-23)
      const pik = (s >= 9 && s <= 12) || (s >= 19 && s <= 23) ? 1.6 : s >= 2 && s <= 6 ? 0.25 : 1;
      const haftaSonu = g >= 5 ? 1.2 : 1;
      satir.push(Math.min(100, Math.round(40 * pik * haftaSonu * (0.7 + normal(r) * 0.6))));
    }
    mat.push(satir);
  }
  return mat;
}
