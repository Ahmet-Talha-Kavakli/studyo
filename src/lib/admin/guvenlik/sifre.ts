/**
 * Şifre hash — Web Crypto SHA-256 + salt. İzomorfik (tarayıcı + Node 20+).
 * Düz şifre HİÇBİR ZAMAN saklanmaz; sadece salt + hash tutulur.
 */

function kripto(): Crypto {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) return globalThis.crypto;
  throw new Error("Web Crypto yok");
}

function baytHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Rastgele salt üret (hex). */
export function saltUret(uzunluk = 16): string {
  const b = new Uint8Array(uzunluk);
  kripto().getRandomValues(b);
  return baytHex(b);
}

/** SHA-256(salt + şifre) → hex. */
export async function sifreHash(sifre: string, salt: string): Promise<string> {
  const veri = new TextEncoder().encode(salt + ":" + sifre);
  const buf = await kripto().subtle.digest("SHA-256", veri);
  return baytHex(new Uint8Array(buf));
}

/** Sabit-zamanlı hex karşılaştırma (timing attack direnci). */
export function esitMi(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let fark = 0;
  for (let i = 0; i < a.length; i++) fark |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return fark === 0;
}

/** Şifre doğrula. */
export async function sifreDogrula(sifre: string, salt: string, hash: string): Promise<boolean> {
  const h = await sifreHash(sifre, salt);
  return esitMi(h, hash);
}
