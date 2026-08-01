/**
 * Live Ops — gerçek zamanlı görünen metrikler. Client'ta bir "tik" sayacıyla
 * çağrılır (her 5sn tik++), böylece deterministik ama canlı-dalgalanan değerler.
 * SSR-safe: tik parametreden gelir, Date.now render'da kullanılmaz.
 */
import { prng, tohumla, normal, tamsayi } from "../cekirdek";
import { PROVIDERLAR } from "../tablolar";

export interface LiveMetrik {
  kuyruk: number;
  isleniyor: number;
  kapasite: number;
  son5Baslatilan: number;
  son5Tamamlanan: number;
  son5Basarisiz: number;
  anlikAktif: number;
  hataOran15dk: number; // %
  hata5xx: number;
  ortBeklemeSn: number;
}

export interface ProviderLatency {
  ad: string;
  p50: number;
  p95: number;
  p99: number;
  basariOran: number;
  devreKesici: "kapali" | "yarim" | "acik";
}

/** Tik bazlı canlı metrik — tik her 5sn'de artar. */
export function liveMetrik(tik: number): LiveMetrik {
  const r = prng(tohumla(`live-${tik}`));
  const kuyruk = 40 + Math.round(normal(r) * 60);
  const kapasite = 120;
  return {
    kuyruk,
    isleniyor: Math.min(kapasite, 60 + Math.round(normal(r) * 45)),
    kapasite,
    son5Baslatilan: 80 + tamsayi(r, 0, 60),
    son5Tamamlanan: 75 + tamsayi(r, 0, 55),
    son5Basarisiz: tamsayi(r, 0, 8),
    anlikAktif: 820 + Math.round(normal(r) * 380),
    hataOran15dk: +(1.2 + normal(r) * 2.5).toFixed(1),
    hata5xx: tamsayi(r, 0, 14),
    ortBeklemeSn: +(3 + normal(r) * 9).toFixed(1),
  };
}

/** Provider latency (tik bazlı). */
export function providerLatency(tik: number): ProviderLatency[] {
  return PROVIDERLAR.map((pr, i) => {
    const r = prng(tohumla(`lat-${pr.id}-${tik}`));
    const taban = 400 + i * 120;
    const basari = +(96 + normal(r) * 4).toFixed(1);
    return {
      ad: pr.ad,
      p50: taban + Math.round(normal(r) * 200),
      p95: taban * 2 + Math.round(normal(r) * 600),
      p99: taban * 3.4 + Math.round(normal(r) * 1200),
      basariOran: Math.min(100, basari),
      devreKesici: basari < 94 ? "acik" : basari < 97 ? "yarim" : "kapali",
    };
  });
}

/** Canlı son-5dk mini seri (16 nokta) — sparkline için. */
export function liveSeri(tik: number, taban = 100): number[] {
  return Array.from({ length: 16 }, (_, i) => {
    const r = prng(tohumla(`liveseri-${tik}-${i}`));
    return Math.round(taban * (0.6 + normal(r) * 0.8));
  });
}
