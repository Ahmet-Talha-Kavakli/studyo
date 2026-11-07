import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { ozet } from "./depo";

/**
 * İki adımlı doğrulama (RFC 6238 TOTP: HMAC-SHA1, 6 hane, 30 saniye). Google Authenticator, 1Password, Authy ile uyumlu.
 * Bir önceki ve bir sonraki adım saat kaymasına karşı kabul edilir; kullanılan adım kaydedilir, aynı kod ikinci kez geçmez.
 * Yedek kodlar 10 adet, tek kullanımlık; yalnız özetleri saklanır, düz hâli bir kez gösterilir.
 */
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32(b: Buffer): string {
  let bit = 0, deger = 0, s = "";
  for (const x of b) { deger = (deger << 8) | x; bit += 8; while (bit >= 5) { s += B32[(deger >>> (bit - 5)) & 31]; bit -= 5; } }
  if (bit > 0) s += B32[(deger << (5 - bit)) & 31];
  return s;
}
export function base32Coz(s: string): Buffer {
  let bit = 0, deger = 0;
  const cikti: number[] = [];
  for (const c of s.replace(/[\s=-]/g, "").toUpperCase()) {
    const i = B32.indexOf(c);
    if (i < 0) continue;
    deger = (deger << 5) | i; bit += 5;
    if (bit >= 8) { cikti.push((deger >>> (bit - 8)) & 255); bit -= 8; }
  }
  return Buffer.from(cikti);
}

export const totpSirUret = () => base32(randomBytes(20));
export const anlikAdim = (zaman = Date.now()) => Math.floor(zaman / 30_000);

export function totpKod(sir: string, adim: number): string {
  const msj = Buffer.alloc(8);
  msj.writeUInt32BE(Math.floor(adim / 2 ** 32), 0);
  msj.writeUInt32BE(adim >>> 0, 4);
  const imza = createHmac("sha1", base32Coz(sir)).update(msj).digest();
  const o = imza[imza.length - 1] & 15;
  const kod = (((imza[o] & 127) << 24) | (imza[o + 1] << 16) | (imza[o + 2] << 8) | imza[o + 3]) % 1_000_000;
  return String(kod).padStart(6, "0");
}

/** Kod geçerliyse kullanılan adımı döndürür; sonAdim ve öncesi (yeniden kullanım) reddedilir. */
export function totpDogrula(sir: string, kod: string, sonAdim = 0): number | null {
  const k = String(kod ?? "").replace(/\D/g, "");
  if (k.length !== 6) return null;
  const simdi = anlikAdim();
  for (const adim of [simdi, simdi - 1, simdi + 1]) {
    if (adim <= sonAdim) continue;
    const a = Buffer.from(totpKod(sir, adim)), b = Buffer.from(k);
    if (timingSafeEqual(a, b)) return adim;
  }
  return null;
}

export const otpauthAdresi = (email: string, sir: string) =>
  `otpauth://totp/${encodeURIComponent(`Vayra:${email}`)}?secret=${sir}&issuer=Vayra&algorithm=SHA1&digits=6&period=30`;

/** "4f2k-9xq7" biçiminde 10 kod (karışabilecek harfler yok). */
export function yedekKodlarUret(): string[] {
  const alfabe = "23456789abcdefghjkmnpqrstuvwxyz";
  return Array.from({ length: 10 }, () => {
    const s = Array.from(randomBytes(8), (x) => alfabe[x % alfabe.length]).join("");
    return `${s.slice(0, 4)}-${s.slice(4)}`;
  });
}
export const yedekNormal = (k: string) => String(k ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
export const yedekOzeti = (k: string) => ozet(`yedek:${yedekNormal(k)}`);
