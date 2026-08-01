/**
 * Flow çekirdeği — deterministik PRNG + zaman + biçimleme (SSR güvenli).
 * Instagram-tarzı topluluk için; admin çekirdeğinden bağımsız (Flow kendi evreni).
 */

export function prng(tohum: number) {
  let a = tohum >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function tohumla(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export const tamsayi = (r: () => number, min: number, max: number) => Math.floor(r() * (max - min) + min);
export const sec = <T,>(r: () => number, d: readonly T[]): T => d[Math.floor(r() * d.length)];
export function agirlikliSec<T>(r: () => number, cift: readonly (readonly [T, number])[]): T {
  const t = cift.reduce((a, [, w]) => a + w, 0); let x = r() * t;
  for (const [d, w] of cift) if ((x -= w) <= 0) return d;
  return cift[cift.length - 1][0];
}

/* Flow sabit "şimdi" — SSR güvenli (2026-07-26 21:30) */
export const SIMDI = Date.UTC(2026, 6, 26, 21, 30, 0);
export const DK = 60000, SAAT = 3600000, GUN = 86400000;

/** Instagram tarzı görece zaman: "8s", "3d", "5sa", "2g", "3h" */
export function goreceKisa(ms: number): string {
  const fark = SIMDI - ms;
  if (fark < 60000) return `${Math.max(1, Math.floor(fark / 1000))}s`;
  if (fark < SAAT) return `${Math.floor(fark / DK)}d`;
  if (fark < GUN) return `${Math.floor(fark / SAAT)}sa`;
  if (fark < 7 * GUN) return `${Math.floor(fark / GUN)}g`;
  return `${Math.floor(fark / (7 * GUN))}h`;
}

/** Instagram sayı biçimi: 12,4 B · 1,2 Mn */
export function sayiKisa(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",").replace(",0", "")} Mn`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(".", ",").replace(",0", "")} B`;
  return new Intl.NumberFormat("tr-TR").format(n);
}
export const sayiTam = (n: number) => new Intl.NumberFormat("tr-TR").format(Math.round(n));
