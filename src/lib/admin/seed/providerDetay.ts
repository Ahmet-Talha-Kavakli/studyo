/**
 * Provider sağlık & harcama detayı — her provider için deterministik son-5dk metrikleri,
 * latency dağılımı (p50/p95/p99), 24s + 30 günlük harcama serisi, circuit breaker durumu,
 * tahmini bakiye tükenme günü. prng(tohumla(`prov-${id}`)) → SSR-safe.
 */
import { prng, tohumla, normal, tamsayi } from "../cekirdek";
import { PROVIDERLAR, type AdminProvider } from "../tablolar";

export type CircuitDurum = "kapali" | "yarim" | "acik";
export type SaglikDurum = "saglikli" | "uyari" | "kritik";

export interface ProviderDetay {
  id: string;
  ad: string;
  bakiyeUsd: number;
  alarmEsigiUsd: number;
  basariOran: number;      // son 5 dk %
  p50: number;
  p95: number;
  p99: number;
  son24sHarcama: number;   // USD
  gunlukHarcama: number;   // USD (30g ortalama)
  aylikHarcamaSerisi: number[]; // 30 gün USD
  circuitDurum: CircuitDurum;
  tahminiTukenmeGun: number;     // bakiye / günlük harcama
  saglik: SaglikDurum;
  istek5dk: number;
  hata5dk: number;
}

function detayUret(pr: AdminProvider, i: number): ProviderDetay {
  const r = prng(tohumla(`prov-${pr.id}`));
  const taban = 380 + i * 110;

  const basariOran = +(95.5 + normal(r) * 4).toFixed(1);
  const p50 = taban + Math.round(normal(r) * 180);
  const p95 = taban * 2 + Math.round(normal(r) * 520);
  const p99 = Math.round(taban * 3.3 + normal(r) * 1100);

  // 30 günlük harcama serisi — hafif yukarı trend + gürültü
  const aylikHarcamaSerisi = Array.from({ length: 30 }, (_, g) => {
    const rg = prng(tohumla(`prov-harca-${pr.id}-${g}`));
    const trend = 1 + g * 0.012;
    return Math.round((90 + i * 30) * trend * (0.7 + normal(rg) * 0.7));
  });

  const gunlukHarcama = Math.round(aylikHarcamaSerisi.slice(-7).reduce((a, x) => a + x, 0) / 7);
  const son24sHarcama = aylikHarcamaSerisi[aylikHarcamaSerisi.length - 1];
  const tahminiTukenmeGun = gunlukHarcama > 0 ? Math.round(pr.bakiyeUsd / gunlukHarcama) : 999;

  const circuitDurum: CircuitDurum = basariOran < 94 ? "acik" : basariOran < 97 ? "yarim" : "kapali";

  const bakiyeDusuk = pr.bakiyeUsd < pr.alarmEsigiUsd;
  const tukenmeYakin = tahminiTukenmeGun < 7;
  const saglik: SaglikDurum =
    circuitDurum === "acik" || bakiyeDusuk || tukenmeYakin
      ? "kritik"
      : circuitDurum === "yarim" || tahminiTukenmeGun < 14 || basariOran < 98
        ? "uyari"
        : "saglikli";

  const istek5dk = tamsayi(r, 800, 9000);
  const hata5dk = Math.round(istek5dk * ((100 - basariOran) / 100));

  return {
    id: pr.id,
    ad: pr.ad,
    bakiyeUsd: pr.bakiyeUsd,
    alarmEsigiUsd: pr.alarmEsigiUsd,
    basariOran: Math.min(100, basariOran),
    p50,
    p95,
    p99,
    son24sHarcama,
    gunlukHarcama,
    aylikHarcamaSerisi,
    circuitDurum,
    tahminiTukenmeGun,
    saglik,
    istek5dk,
    hata5dk,
  };
}

let _cache: Record<string, ProviderDetay> | null = null;

/** Tüm provider'ların sağlık detayı (id → detay), bir kez cache'lenir. */
export function providerDetaylari(): Record<string, ProviderDetay> {
  if (_cache) return _cache;
  const out: Record<string, ProviderDetay> = {};
  PROVIDERLAR.forEach((pr, i) => {
    out[pr.id] = detayUret(pr, i);
  });
  _cache = out;
  return _cache;
}

/** Tek provider detayı. */
export function providerDetay(id: string): ProviderDetay | undefined {
  return providerDetaylari()[id];
}
