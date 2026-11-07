import "server-only";
import { appendFile, mkdir } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";

/**
 * Sunucuda içerik denetiminin engellediği istemler: .veri/yonetim/moderasyon.ndjson.
 * Kullanıcı kimliği bilinmez (denetim işlevi isteği görmez); yalnız zaman, kategori ve istemin ilk 200 karakteri tutulur.
 * Aynı istem bir dakika içinde tekrar gelirse yeniden yazılmaz.
 */
export const MODERASYON_DOSYASI = path.join(DEPO_KOK, "yonetim", "moderasyon.ndjson");

type G = { __vayraModerasyonKaydi?: (k: string, istem: string) => void; __vayraModerasyonSon?: Map<string, number> };
const g = globalThis as unknown as G;

export function moderasyonKaydiniKur() {
  if (g.__vayraModerasyonKaydi) return;
  const son = (g.__vayraModerasyonSon ??= new Map());
  g.__vayraModerasyonKaydi = (kategori, istem) => {
    const kisa = String(istem ?? "").replace(/\s+/g, " ").trim().slice(0, 200);
    const anahtar = `${kategori}:${kisa}`;
    if ((son.get(anahtar) ?? 0) > Date.now() - 60_000) return;
    son.set(anahtar, Date.now());
    if (son.size > 500) son.clear();
    void mkdir(path.dirname(MODERASYON_DOSYASI), { recursive: true })
      .then(() => appendFile(MODERASYON_DOSYASI, `${JSON.stringify({ zaman: Date.now(), kategori, istem: kisa })}\n`, { mode: 0o600 }))
      .catch(() => {});
  };
}
