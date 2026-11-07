import "server-only";
import { modelBagli } from "./disAjan";
import { krediHesapla, modelBul, type BuildModel } from "./modeller";
import { motoruCalistir } from "./sohbetMotoru";
import type { SohbetParca } from "./sohbetDepo";
import { bellekEtiketiniGizle } from "./sohbetYol";

/**
 * Araçsız, tek seferlik model çağrısı (tuval düzenleme, takip soruları, sesli özet metni gibi yan işler).
 * Model bu sunucuya bağlı değilse hata döner; sahte sonuç üretilmez.
 */
export type TekSonuc = { metin: string; kredi: number; model: BuildModel } | { hata: string; durum: number };

export async function tekSeferlik(g: { model?: string; sistem: string; ileti: string; efor?: "low" | "medium" | "high" | "max"; signal?: AbortSignal }): Promise<TekSonuc> {
  const model = modelBul(g.model);
  if (!modelBagli(model)) return { hata: `${model.ad} bu sunucuya bağlı değil. Model seçiciden bağlı bir model seç.`, durum: 503 };
  const parcalar: SohbetParca[] = [];
  const r = await motoruCalistir({
    model, sistem: g.sistem, gecmis: [{ role: "user", content: [{ type: "text", text: g.ileti }] }], efor: g.efor ?? "low",
    izin: () => "kapali", ozel: [], sunucu: [], parcalar, yaz: () => {}, yurut: async () => ({ icerik: "", hata: true }),
    kaydet: async () => {}, signal: g.signal ?? AbortSignal.timeout(120_000),
  });
  if (r.durum === "hata") return { hata: r.hata ?? "Model yanıt vermedi.", durum: 502 };
  const metin = bellekEtiketiniGizle(parcalar.filter((p) => p.tur === "metin").map((p) => (p as { metin: string }).metin).join("")).trim();
  if (!metin) return { hata: "Model boş yanıt döndürdü. Tekrar dene.", durum: 502 };
  return { metin, kredi: krediHesapla(model, r.kullanim), model };
}

/** Metnin içindeki ilk JSON nesnesini çıkarır (kod çiti olsa da). */
export function jsonBul<T>(t: string): T | null {
  const temiz = t.replace(/```(?:json)?/gi, "");
  const bas = temiz.indexOf("{");
  if (bas < 0) return null;
  for (let son = temiz.lastIndexOf("}"); son > bas; son = temiz.lastIndexOf("}", son - 1)) {
    try { return JSON.parse(temiz.slice(bas, son + 1)) as T; } catch { /* daha kısa dene */ }
  }
  return null;
}
