/**
 * Admin çekirdeği — deterministik veri üretimi için sabit-tohumlu PRNG + yardımcılar.
 * SSR güvenli (Math.random / Date.now KULLANILMAZ; her şey tohumdan türer).
 * Böylece server ve client aynı seed'i üretir, hydration uyuşmazlığı olmaz.
 */

/** Mulberry32 — hızlı, deterministik 32-bit PRNG. */
export function prng(tohum: number) {
  let a = tohum >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Metinden deterministik tohum (string → uint32). */
export function tohumla(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** [min,max) aralığında tam sayı. */
export function tamsayi(r: () => number, min: number, max: number): number {
  return Math.floor(r() * (max - min) + min);
}

/** Diziden ağırlıksız rastgele seçim. */
export function sec<T>(r: () => number, dizi: readonly T[]): T {
  return dizi[Math.floor(r() * dizi.length)];
}

/** Ağırlıklı seçim: [[deger, agirlik], ...] */
export function agirlikliSec<T>(r: () => number, cift: readonly (readonly [T, number])[]): T {
  const toplam = cift.reduce((a, [, w]) => a + w, 0);
  let x = r() * toplam;
  for (const [d, w] of cift) {
    if ((x -= w) <= 0) return d;
  }
  return cift[cift.length - 1][0];
}

/** Gaussian benzeri (0..1 ortalamalı) — daha doğal dağılım. */
export function normal(r: () => number): number {
  return (r() + r() + r()) / 3;
}

/* ── Sabit referans günü ── */
/** "Bugün" — SSR güvenli sabit an (2026-07-27). Tüm zaman serileri buna göre geriye üretilir. */
export const BUGUN = Date.UTC(2026, 6, 27, 12, 0, 0);
export const GUN = 86400000;
export const SAAT = 3600000;
export const DK = 60000;

/** N gün önceki gün başlangıcı (ms). */
export function gunOnce(n: number): number {
  return BUGUN - n * GUN;
}

/** ms → "26 Tem", "3 saat önce" gibi TR görece etiket. */
export function goreceZaman(ms: number): string {
  const fark = BUGUN - ms;
  if (fark < 0) return "az önce";
  const dk = Math.floor(fark / 60000);
  if (dk < 1) return "az önce";
  if (dk < 60) return `${dk} dk önce`;
  const sa = Math.floor(dk / 60);
  if (sa < 24) return `${sa} saat önce`;
  const g = Math.floor(sa / 24);
  if (g < 30) return `${g} gün önce`;
  const ay = Math.floor(g / 30);
  return `${ay} ay önce`;
}

const AYLAR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
/** ms → "26 Tem 2026" */
export function tarihEtiket(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCDate()} ${AYLAR[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
/** ms → "26 Tem 14:32" */
export function tarihSaat(ms: number): string {
  const d = new Date(ms);
  const ss = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${d.getUTCDate()} ${AYLAR[d.getUTCMonth()]} ${ss}:${mm}`;
}

/* ── Para / sayı biçimleme ── */
const trNum = new Intl.NumberFormat("tr-TR");
const trNum2 = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function sayi(n: number): string {
  return trNum.format(Math.round(n));
}
/** ₺ tutarı — 12.340 ₺ */
export function para(n: number): string {
  return `${trNum.format(Math.round(n))} ₺`;
}
/** $ tutarı — provider maliyetleri dolar. */
export function dolar(n: number): string {
  return `$${trNum2.format(n)}`;
}
/** Kısa sayı — 12,4M / 1,2B */
export function kisaSayi(n: number): string {
  if (n >= 1_000_000) return `${trNum2.format(n / 1_000_000).replace(",00", "")}M`;
  if (n >= 1000) return `${trNum2.format(n / 1000).replace(",00", "")}B`;
  return trNum.format(Math.round(n));
}
/** Yüzde — %12,4 */
export function yuzde(n: number, basamak = 1): string {
  return `%${n.toFixed(basamak).replace(".", ",")}`;
}
/** Kısa para — 12,4B ₺ / 1,2M ₺ */
export function kisaPara(n: number): string {
  return `${kisaSayi(n)} ₺`;
}
