import "server-only";
import { randomBytes } from "crypto";
import path from "path";
import { D, eskiBelirtecleriTemizle, jsonOku, jsonYaz, kilitle, ozet, sil } from "./depo";

/**
 * Tek kullanımlık belirteçler: e-posta doğrulama, şifre sıfırlama, e-posta değişikliği, iki adım bekleyen girişi,
 * OAuth durumu. Belirtecin kendisi yalnız kullanıcıya gider; depoda SHA-256 özeti dosya adıdır.
 */
export type BelirtecTuru = "dogrula" | "sifirla" | "eposta" | "iki-adim" | "oauth";

interface Kayit<T> { tur: BelirtecTuru; veri: T; bitis: number; deneme: number; olusturma: number }

const dosya = (b: string) => path.join(D.belirtec, `${ozet(`belirtec:${b}`)}.json`);
const BICIM = /^[A-Za-z0-9_-]{32,96}$/;

export async function belirtecUret<T>(tur: BelirtecTuru, veri: T, sureMs: number): Promise<string> {
  void eskiBelirtecleriTemizle().catch(() => {});
  const b = randomBytes(32).toString("base64url");
  await jsonYaz(dosya(b), { tur, veri, bitis: Date.now() + sureMs, deneme: 0, olusturma: Date.now() } satisfies Kayit<T>);
  return b;
}

/** Belirteci tüketmeden okur (süresi ya da türü uymuyorsa null). */
export async function belirtecOku<T>(b: unknown, tur: BelirtecTuru): Promise<(Kayit<T> & { belirtec: string }) | null> {
  if (typeof b !== "string" || !BICIM.test(b)) return null;
  const k = await jsonOku<Kayit<T>>(dosya(b));
  if (!k || k.tur !== tur) return null;
  if (k.bitis < Date.now()) { await sil(dosya(b)); return null; }
  return { ...k, belirtec: b };
}

/** Belirteci bir kez kullanır: geçerliyse verisini döndürür ve siler. Aynı anda iki kullanım olamaz. */
export async function belirtecKullan<T>(b: unknown, tur: BelirtecTuru): Promise<T | null> {
  if (typeof b !== "string" || !BICIM.test(b)) return null;
  return kilitle(`belirtec:${ozet(b)}`, async () => {
    const k = await belirtecOku<T>(b, tur);
    if (!k) return null;
    await sil(dosya(b));
    return k.veri;
  });
}

/** Hatalı denemeyi sayar; sınır aşılınca belirteç silinir ve false döner. */
export async function belirtecDeneme(b: string, sinir: number): Promise<boolean> {
  return kilitle(`belirtec:${ozet(b)}`, async () => {
    const k = await jsonOku<Kayit<unknown>>(dosya(b));
    if (!k) return false;
    k.deneme += 1;
    if (k.deneme >= sinir) { await sil(dosya(b)); return false; }
    await jsonYaz(dosya(b), k);
    return true;
  });
}

export const belirtecSil = (b: string) => (BICIM.test(b) ? sil(dosya(b)) : Promise.resolve());
