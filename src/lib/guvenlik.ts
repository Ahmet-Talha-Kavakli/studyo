/**
 * Hesap güvenliği yardımcıları — tarayıcıda Web Crypto ile.
 *
 * - Şifre: PBKDF2-SHA256, 120.000 tur, 16 bayt rastgele tuz. Şifrenin kendisi
 *   hiçbir yerde saklanmaz; yalnız özet ve tuz.
 * - İki adımlı doğrulama: RFC 6238 TOTP (SHA-1, 6 hane, 30 sn). Google
 *   Authenticator, 1Password, Authy ile uyumlu; ±1 adım saat kayması kabul edilir.
 * - Yedek kodlar: 10 adet, tek kullanımlık.
 */

const hex = (b: ArrayBuffer | Uint8Array) => Array.from(b instanceof Uint8Array ? b : new Uint8Array(b), (x) => x.toString(16).padStart(2, "0")).join("");
const hexBayt = (h: string) => new Uint8Array(h.match(/.{2}/g)!.map((x) => parseInt(x, 16)));
const rastgele = (n: number) => crypto.getRandomValues(new Uint8Array(n));

/* ── Şifre ── */

export async function sifreOzeti(sifre: string, tuzHex?: string): Promise<{ hash: string; tuz: string }> {
  const tuz = tuzHex ? hexBayt(tuzHex) : rastgele(16);
  const anahtar = await crypto.subtle.importKey("raw", new TextEncoder().encode(sifre), "PBKDF2", false, ["deriveBits"]);
  const bitler = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: tuz, iterations: 120_000 }, anahtar, 256);
  return { hash: hex(bitler), tuz: hex(tuz) };
}

export async function sifreDogrula(sifre: string, kayit: { hash: string; tuz: string }): Promise<boolean> {
  const { hash } = await sifreOzeti(sifre, kayit.tuz);
  // Sabit zamanlı karşılaştırma
  if (hash.length !== kayit.hash.length) return false;
  let fark = 0;
  for (let i = 0; i < hash.length; i++) fark |= hash.charCodeAt(i) ^ kayit.hash.charCodeAt(i);
  return fark === 0;
}

export function sifreGucu(s: string): { puan: 0 | 1 | 2 | 3 | 4; etiket: string; eksikler: string[] } {
  const eksikler: string[] = [];
  if (s.length < 10) eksikler.push("en az 10 karakter");
  if (!/[a-zçğıöşü]/.test(s) || !/[A-ZÇĞİÖŞÜ]/.test(s)) eksikler.push("büyük ve küçük harf");
  if (!/\d/.test(s)) eksikler.push("rakam");
  if (!/[^A-Za-z0-9çğıöşüÇĞİÖŞÜ]/.test(s)) eksikler.push("sembol");
  const yaygin = /^(123456|password|sifre|qwerty|111111|abc123|vayra)/i.test(s);
  let puan = Math.min(4, Math.max(0, 4 - eksikler.length + (s.length >= 14 ? 1 : 0) - (yaygin ? 2 : 0))) as 0 | 1 | 2 | 3 | 4;
  if (s.length < 8) puan = Math.min(puan, 1) as 0 | 1;
  return { puan, etiket: ["Çok zayıf", "Zayıf", "Orta", "Güçlü", "Çok güçlü"][puan], eksikler };
}

/* ── TOTP ── */

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32(b: Uint8Array): string {
  let bit = 0, deger = 0, s = "";
  for (const x of b) { deger = (deger << 8) | x; bit += 8; while (bit >= 5) { s += B32[(deger >>> (bit - 5)) & 31]; bit -= 5; } }
  if (bit > 0) s += B32[(deger << (5 - bit)) & 31];
  return s;
}
export function base32Coz(s: string): Uint8Array {
  const temiz = s.replace(/[\s=-]/g, "").toUpperCase();
  let bit = 0, deger = 0;
  const cikti: number[] = [];
  for (const c of temiz) { const i = B32.indexOf(c); if (i < 0) continue; deger = (deger << 5) | i; bit += 5; if (bit >= 8) { cikti.push((deger >>> (bit - 8)) & 255); bit -= 8; } }
  return new Uint8Array(cikti);
}

export const totpSirUret = () => base32(rastgele(20));

export async function totp(sir: string, zaman = Date.now(), adim = 0): Promise<string> {
  const sayac = Math.floor(zaman / 1000 / 30) + adim;
  const msj = new ArrayBuffer(8);
  const v = new DataView(msj);
  v.setUint32(0, Math.floor(sayac / 2 ** 32));
  v.setUint32(4, sayac >>> 0);
  const anahtar = await crypto.subtle.importKey("raw", base32Coz(sir), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const imza = new Uint8Array(await crypto.subtle.sign("HMAC", anahtar, msj));
  const o = imza[imza.length - 1] & 15;
  const kod = (((imza[o] & 127) << 24) | (imza[o + 1] << 16) | (imza[o + 2] << 8) | imza[o + 3]) % 1_000_000;
  return String(kod).padStart(6, "0");
}

export async function totpDogrula(sir: string, kod: string): Promise<boolean> {
  const k = kod.replace(/\D/g, "");
  if (k.length !== 6) return false;
  for (const adim of [0, -1, 1]) if ((await totp(sir, Date.now(), adim)) === k) return true;
  return false;
}

export const otpauthAdresi = (email: string, sir: string) =>
  `otpauth://totp/${encodeURIComponent(`Vayra:${email}`)}?secret=${sir}&issuer=Vayra&algorithm=SHA1&digits=6&period=30`;

/** 10 tek kullanımlık yedek kod: "4f2k-9xq7" biçiminde (karışabilecek harfler yok). */
export function yedekKodlarUret(): string[] {
  const alfabe = "23456789abcdefghjkmnpqrstuvwxyz";
  return Array.from({ length: 10 }, () => {
    const b = rastgele(8);
    const s = Array.from(b, (x) => alfabe[x % alfabe.length]).join("");
    return `${s.slice(0, 4)}-${s.slice(4)}`;
  });
}

/* ── Cihaz ── */

export function cihazBilgisi(ua = typeof navigator !== "undefined" ? navigator.userAgent : "") {
  const tarayici = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Tarayıcı";
  const surum = ua.match(/(?:Edg|OPR|Firefox|Chrome|Version)\/(\d+)/)?.[1];
  const isletim = /Windows NT 10/.test(ua) ? "Windows" : /Windows/.test(ua) ? "Windows" : /iPhone|iPad/.test(ua) ? "iOS" : /Mac OS X/.test(ua) ? "macOS" : /Android/.test(ua) ? "Android" : /Linux/.test(ua) ? "Linux" : "Bilinmeyen sistem";
  const tur: "masaustu" | "mobil" | "tablet" = /iPad|Tablet/.test(ua) ? "tablet" : /Mobi|iPhone|Android/.test(ua) ? "mobil" : "masaustu";
  return { tarayici: surum ? `${tarayici} ${surum}` : tarayici, isletim, tur };
}
