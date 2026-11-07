import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";

/**
 * Gizli değer kasası (AES-256-GCM). Anahtar: VAYRA_SIFRE_ANAHTARI ortam değişkeni (her biçimde metin; SHA-256 ile
 * 32 bayta indirgenir) ya da ilk kullanımda .veri/build/.kasa-anahtari dosyasına üretilen rastgele 32 bayt.
 * Şifreli değerler "v1:<iv>:<etiket>:<veri>" (base64url) biçimindedir; tarayıcıya ve modele asla gönderilmez.
 */
let anahtar: Buffer | null = null;
function kasaAnahtari(): Buffer {
  if (anahtar) return anahtar;
  const env = process.env.VAYRA_SIFRE_ANAHTARI;
  if (env) return (anahtar = createHash("sha256").update(env).digest());
  const f = path.join(DEPO_KOK, "build", ".kasa-anahtari");
  if (existsSync(f)) return (anahtar = Buffer.from(readFileSync(f, "utf8").trim(), "base64url"));
  mkdirSync(path.dirname(f), { recursive: true });
  const yeni = randomBytes(32);
  writeFileSync(f, yeni.toString("base64url"), { mode: 0o600 });
  return (anahtar = yeni);
}

export function sifrele(metin: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", kasaAnahtari(), iv);
  const veri = Buffer.concat([c.update(metin, "utf8"), c.final()]);
  return `v1:${iv.toString("base64url")}:${c.getAuthTag().toString("base64url")}:${veri.toString("base64url")}`;
}

export function coz(s: string | undefined | null): string | null {
  if (!s) return null;
  const [v, iv, etiket, veri] = s.split(":");
  if (v !== "v1" || !iv || !etiket || veri === undefined) return null;
  try {
    const d = createDecipheriv("aes-256-gcm", kasaAnahtari(), Buffer.from(iv, "base64url"));
    d.setAuthTag(Buffer.from(etiket, "base64url"));
    return Buffer.concat([d.update(Buffer.from(veri, "base64url")), d.final()]).toString("utf8");
  } catch { return null; }
}

/** Gösterim için maskeler: son 4 karakter. */
export const maskele = (s: string) => (s.length <= 4 ? "••••" : `••••${s.slice(-4)}`);
