import { createCipheriv, createECDH, createPrivateKey, createSign, hkdfSync, randomBytes } from "crypto";

/**
 * Web Push için saf şifreleme işleri (bağımlılıksız, Node crypto):
 *  - VAPID anahtar çifti üretme (RFC 8292; web-push aracının ürettiği biçimle aynı: ham P-256, base64url).
 *  - VAPID JWT'si (ES256, IEEE P1363 imza) ve Authorization başlığı.
 *  - Yükün aes128gcm ile şifrelenmesi (RFC 8291 + RFC 8188): tarayıcı yükü yalnız kendi anahtarıyla açabilir.
 * Sunucuya özel içe aktarma yoktur; birim denemesi bu dosyayı doğrudan çalıştırır.
 */
export const b64u = (b: Buffer | Uint8Array) => Buffer.from(b).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export const b64uCoz = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

export type VapidCifti = { genel: string; ozel: string };

/** Yeni VAPID çifti: genel 65 baytlık sıkıştırılmamış nokta, özel 32 baytlık skaler (ikisi de base64url). */
export function vapidUret(): VapidCifti {
  const e = createECDH("prime256v1");
  e.generateKeys();
  return { genel: b64u(e.getPublicKey()), ozel: b64u(e.getPrivateKey()) };
}

/** Anahtar çiftinin biçimi doğru mu (genel 65 bayt 0x04 ile başlar, özel 32 bayt ve genelle eşleşir). */
export function vapidGecerli(c: Partial<VapidCifti>): boolean {
  try {
    if (!c.genel || !c.ozel) return false;
    const g = b64uCoz(c.genel), o = b64uCoz(c.ozel);
    if (g.length !== 65 || g[0] !== 4 || o.length !== 32) return false;
    const e = createECDH("prime256v1");
    e.setPrivateKey(o);
    return e.getPublicKey().equals(g);
  } catch { return false; }
}

/** VAPID Authorization başlığı: "vapid t=<jwt>, k=<genel>". aud: abonelik adresinin kökeni. */
export function vapidBasligi(endpoint: string, c: VapidCifti, konu: string, omurSn = 12 * 3600): string {
  const aud = new URL(endpoint).origin;
  const g = b64uCoz(c.genel);
  const jwk = { kty: "EC", crv: "P-256", d: c.ozel, x: b64u(g.subarray(1, 33)), y: b64u(g.subarray(33, 65)) };
  const anahtar = createPrivateKey({ key: jwk, format: "jwk" });
  const bas = b64u(Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const govde = b64u(Buffer.from(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + omurSn, sub: konu })));
  const imzalayan = createSign("SHA256");
  imzalayan.update(`${bas}.${govde}`);
  const imza = imzalayan.sign({ key: anahtar, dsaEncoding: "ieee-p1363" });
  return `vapid t=${bas}.${govde}.${b64u(imza)}, k=${c.genel}`;
}

/**
 * Yükü aes128gcm ile şifreler (RFC 8291). p256dh ve auth tarayıcının PushSubscription anahtarlarıdır.
 * Çıktı: salt(16) | kayıt boyu(4) | anahtar uzunluğu(1) | gönderenin geçici genel anahtarı(65) | şifreli metin + etiket.
 */
export function yukSifrele(yuk: Buffer, p256dh: string, auth: string, deneme?: { salt?: Buffer; gecici?: Buffer }): Buffer {
  const uaGenel = b64uCoz(p256dh), yetki = b64uCoz(auth);
  if (uaGenel.length !== 65 || yetki.length < 16) throw new Error("Abonelik anahtarları geçersiz.");
  const e = createECDH("prime256v1");
  if (deneme?.gecici) e.setPrivateKey(deneme.gecici); else e.generateKeys();
  const asGenel = e.getPublicKey();
  const ortak = e.computeSecret(uaGenel);
  const bilgi = Buffer.concat([Buffer.from("WebPush: info\0", "latin1"), uaGenel, asGenel]);
  const ikm = Buffer.from(hkdfSync("sha256", ortak, yetki, bilgi, 32));
  const salt = deneme?.salt ?? randomBytes(16);
  const cek = Buffer.from(hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: aes128gcm\0", "latin1"), 16));
  const nonce = Buffer.from(hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: nonce\0", "latin1"), 12));
  const sifre = createCipheriv("aes-128-gcm", cek, nonce);
  const metin = Buffer.concat([sifre.update(Buffer.concat([yuk, Buffer.from([2])])), sifre.final(), sifre.getAuthTag()]);
  const rs = Buffer.alloc(4); rs.writeUInt32BE(4096, 0);
  return Buffer.concat([salt, rs, Buffer.from([asGenel.length]), asGenel, metin]);
}
