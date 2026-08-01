/**
 * TOTP (RFC 6238) — gerçek 2FA algoritması. Web Crypto HMAC-SHA1, 30sn pencere, 6 hane.
 * Base32 secret + otpauth:// URI + Google Authenticator/Authy uyumlu.
 * Bağımlılıksız.
 */

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** Rastgele Base32 secret üret (2FA kurulumu). */
export function secretUret(uzunluk = 20): string {
  const b = new Uint8Array(uzunluk);
  globalThis.crypto.getRandomValues(b);
  let s = "";
  for (const x of b) s += B32[x % 32];
  return s;
}

function base32Coz(s: string): Uint8Array {
  const temiz = s.toUpperCase().replace(/=+$/, "").replace(/\s/g, "");
  let bit = 0, deger = 0;
  const cikti: number[] = [];
  for (const c of temiz) {
    const idx = B32.indexOf(c);
    if (idx === -1) continue;
    deger = (deger << 5) | idx;
    bit += 5;
    if (bit >= 8) {
      cikti.push((deger >>> (bit - 8)) & 0xff);
      bit -= 8;
    }
  }
  return new Uint8Array(cikti);
}

/** Belirli bir zaman adımı için TOTP kodu üret. */
export async function totpKod(secret: string, zamanMs: number = 0, adim = 30): Promise<string> {
  const anahtar = base32Coz(secret);
  const sayac = Math.floor(zamanMs / 1000 / adim);
  const buf = new ArrayBuffer(8);
  const dv = new DataView(buf);
  dv.setUint32(4, sayac >>> 0, false);
  dv.setUint32(0, Math.floor(sayac / 2 ** 32), false);

  const key = await globalThis.crypto.subtle.importKey(
    "raw", anahtar as BufferSource, { name: "HMAC", hash: "SHA-1" }, false, ["sign"],
  );
  const imza = new Uint8Array(await globalThis.crypto.subtle.sign("HMAC", key, buf));
  const offset = imza[imza.length - 1] & 0x0f;
  const bin = ((imza[offset] & 0x7f) << 24) | (imza[offset + 1] << 16) | (imza[offset + 2] << 8) | imza[offset + 3];
  return (bin % 1_000_000).toString().padStart(6, "0");
}

/** Girilen kodu doğrula (±1 pencere toleransı). */
export async function totpDogrula(secret: string, kod: string, zamanMs: number, adim = 30): Promise<boolean> {
  const temiz = kod.replace(/\s/g, "");
  for (const kaydir of [-1, 0, 1]) {
    const k = await totpKod(secret, zamanMs + kaydir * adim * 1000, adim);
    if (k === temiz) return true;
  }
  return false;
}

/** otpauth:// URI (QR için). */
export function otpauthUri(secret: string, hesap = "admin", yayinci = "Vayra"): string {
  return `otpauth://totp/${encodeURIComponent(yayinci)}:${encodeURIComponent(hesap)}?secret=${secret}&issuer=${encodeURIComponent(yayinci)}&algorithm=SHA1&digits=6&period=30`;
}
