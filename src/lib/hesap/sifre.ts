import "server-only";
import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "crypto";
import { SIFRE_KURALLARI, YAYGIN_SIFRE } from "./tipler";

/**
 * Şifre özeti: scrypt (N=2^15, r=8, p=1, 64 bayt), 16 bayt rastgele tuz.
 * Biçim: "s1$<N>$<r>$<p>$<tuz>$<özet>" (base64url). Parametreler kayıtta durur; ileride artırılırsa eski
 * özetler yine doğrulanır ve girişte yeniden özetlenir (yenidenOzetle).
 * Karşılaştırma timingSafeEqual ile; hesap yoksa da aynı süre harcanır (hesap var mı yok mu süreden anlaşılmasın).
 */
const N = 1 << 15, R = 8, P = 1, UZUNLUK = 64;
const BELLEK = 128 * N * R * 2;
export const SIFRE_EN_UZUN = 256;

function scryptP(sifre: string, tuz: Buffer, n: number, r: number, p: number): Promise<Buffer> {
  const o: ScryptOptions = { N: n, r, p, maxmem: Math.max(BELLEK, 128 * n * r * 2) };
  return new Promise((coz, red) => scrypt(sifre.normalize("NFKC"), tuz, UZUNLUK, o, (e, k) => (e ? red(e) : coz(k))));
}

export async function sifreOzetle(sifre: string): Promise<string> {
  const tuz = randomBytes(16);
  const k = await scryptP(sifre, tuz, N, R, P);
  return `s1$${N}$${R}$${P}$${tuz.toString("base64url")}$${k.toString("base64url")}`;
}

/** Sabit tuzlu sahte özet: hesap yokken de scrypt bir kez çalışsın. */
let SAHTE: Promise<string> | null = null;
const sahteOzet = () => (SAHTE ??= sifreOzetle(randomBytes(18).toString("base64url")));

export async function sifreDogrula(sifre: string, kayit: string | undefined | null): Promise<boolean> {
  const hedef = kayit || (await sahteOzet());
  const p = hedef.split("$");
  if (p.length !== 6 || p[0] !== "s1") return false;
  const [n, r, pp] = [Number(p[1]), Number(p[2]), Number(p[3])];
  if (!(n > 1 && n <= 1 << 20 && r > 0 && r <= 32 && pp > 0 && pp <= 4)) return false;
  const beklenen = Buffer.from(p[5], "base64url");
  let k: Buffer;
  try { k = await scryptP(String(sifre).slice(0, SIFRE_EN_UZUN), Buffer.from(p[4], "base64url"), n, r, pp); } catch { return false; }
  const esit = k.length === beklenen.length && timingSafeEqual(k, beklenen);
  return esit && !!kayit;
}

/** Kayıttaki parametreler güncel değilse true: girişte yeni parametreyle yeniden özetlenir. */
export const yenidenOzetle = (kayit: string) => !kayit.startsWith(`s1$${N}$${R}$${P}$`);

/** Sunucu şifre politikası. Hata yoksa null. */
export function sifrePolitikasi(sifre: unknown, g: { email?: string; ad?: string } = {}): string | null {
  if (typeof sifre !== "string" || !sifre) return "Şifre gir.";
  if (sifre.length > SIFRE_EN_UZUN) return `Şifre en çok ${SIFRE_EN_UZUN} karakter olabilir.`;
  const eksik = SIFRE_KURALLARI.filter((k) => !k.test(sifre)).map((k) => k.ad.toLocaleLowerCase("tr-TR"));
  if (eksik.length) return `Şifre şu koşulları karşılamalı: ${eksik.join(", ")}.`;
  if (YAYGIN_SIFRE.test(sifre) || /^(.)\1+$/.test(sifre)) return "Bu şifre çok yaygın, kolay tahmin edilir. Başka bir şifre seç.";
  const kucuk = sifre.toLocaleLowerCase("tr-TR");
  const yerel = g.email?.split("@")[0]?.toLocaleLowerCase("tr-TR");
  if (yerel && yerel.length >= 4 && kucuk.includes(yerel)) return "Şifre e-posta adresini içermesin.";
  return null;
}
