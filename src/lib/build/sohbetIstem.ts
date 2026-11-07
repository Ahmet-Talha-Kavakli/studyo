import "server-only";
import { randomBytes } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { sahipOzeti } from "./depo";

/**
 * Kayıtlı istemlerim: kullanıcının sık kullandığı istemler (kısayol adıyla "/" menüsünde çıkar, {degisken} alanları
 * doldurulur). Dosya: .veri/build/sohbet-istem/<özet>.json, sahip başına en çok 200.
 */
export type KayitliIstem = { id: string; ad: string; baslik: string; metin: string; zaman: number; kullanim: number };
const dosya = (sahip: string) => path.join(DEPO_KOK, "build", "sohbet-istem", `${sahipOzeti(sahip)}.json`);
const kilitler = new Map<string, Promise<unknown>>();

export async function istemleriOku(sahip: string): Promise<KayitliIstem[]> {
  try { return (JSON.parse(await readFile(dosya(sahip), "utf8")) as { istemler: KayitliIstem[] }).istemler ?? []; } catch { return []; }
}
export function istemleriDegistir<T>(sahip: string, f: (l: KayitliIstem[]) => T): Promise<T> {
  const k = sahipOzeti(sahip);
  const is = (kilitler.get(k) ?? Promise.resolve()).then(async () => {
    const l = await istemleriOku(sahip);
    const r = f(l);
    await mkdir(path.dirname(dosya(sahip)), { recursive: true });
    await writeFile(dosya(sahip), JSON.stringify({ istemler: l.slice(0, 200) }));
    return r;
  });
  kilitler.set(k, is.catch(() => {}));
  return is;
}
/** Kısayol adı: küçük harf, Türkçe karakterler korunur, boşluk tire olur. */
export const kisayolAdi = (s: string) => s.toLocaleLowerCase("tr").replace(/^\/+/, "").replace(/\s+/g, "-").replace(/[^\p{L}\p{N}_-]/gu, "").slice(0, 32);
export const yeniIstemId = () => randomBytes(6).toString("base64url");
