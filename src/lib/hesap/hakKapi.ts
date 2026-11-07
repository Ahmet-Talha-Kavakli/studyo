import "server-only";
import { kayitOku } from "@/lib/odeme/depo";
import { haklarOzeti } from "@/lib/odeme/motor";
import type { HaklarYaniti, HizHakki, SinirsizHak } from "@/lib/odeme/tipler";
import { sinirsizKapsar } from "@/lib/krediTarife";

/**
 * Süreli haklar (sınırsız erişim, hız) sunucudaki ödeme kaydından okunur. Tarayıcıdaki ekler deposuna ve
 * istemcinin gönderdiği meta.sinirsiz bayrağına güvenilmez: kredi kesilip kesilmeyeceğine yalnız bu kayıt karar verir.
 */
export async function sunucuHaklari(uid: string): Promise<HaklarYaniti> {
  try { return haklarOzeti(await kayitOku(uid)); } catch { return { sinirsiz: [], hiz: null }; }
}

/** İşi kapsayan etkin sınırsız hak (yoksa null). */
export async function sinirsizHakki(uid: string, g: { tur: string; model?: string; meta?: Record<string, unknown> }): Promise<SinirsizHak | null> {
  if (g.tur !== "video" && g.tur !== "gorsel") return null;
  return sinirsizKapsar((await sunucuHaklari(uid)).sinirsiz, g);
}

/** Etkin hız hakkı (yoksa standart). */
export async function hizHakki(uid: string): Promise<Pick<HizHakki, "seviye" | "ekEsZamanli"> & { bitis?: number }> {
  const h = (await sunucuHaklari(uid)).hiz;
  return h ? { seviye: h.seviye, ekEsZamanli: h.ekEsZamanli, bitis: h.bitis } : { seviye: "standart", ekEsZamanli: 0 };
}
