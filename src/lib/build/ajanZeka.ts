import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { baglantiBul, claudeBagli, disTur, modelBagli } from "./disAjan";
import { BUILD_MODELLERI, krediHesapla, modelBul, type BuildModel } from "./modeller";

/**
 * Küçük yardımcı model çağrıları (yargıç, sınıflandırma, özet): JSON yanıt ister ve ayrıştırır. Claude bağlıysa
 * Claude Sonnet, değilse önce istenen model, yoksa bağlı ilk model kullanılır. Hiçbir model bağlı değilse null döner;
 * çağıran sezgisel yola düşer ve arayüz bunu dürüstçe belirtir.
 */
export function yardimciModel(tercih?: string): BuildModel | null {
  if (claudeBagli()) return modelBul("claude-sonnet-5-5");
  const t = tercih ? modelBul(tercih) : null;
  if (t && t.saglayici !== "anthropic" && modelBagli(t)) return t;
  return BUILD_MODELLERI.find((m) => m.saglayici !== "anthropic" && modelBagli(m)) ?? null;
}

/** İlk dengeli JSON nesnesini metinden çıkarır. */
export function jsonCikar<T>(metin: string): T | null {
  const bas = metin.indexOf("{");
  if (bas < 0) return null;
  let d = 0, tirnak = false, kac = false;
  for (let i = bas; i < metin.length; i++) {
    const c = metin[i];
    if (tirnak) { if (kac) kac = false; else if (c === "\\") kac = true; else if (c === '"') tirnak = false; continue; }
    if (c === '"') tirnak = true;
    else if (c === "{") d++;
    else if (c === "}" && --d === 0) { try { return JSON.parse(metin.slice(bas, i + 1)) as T; } catch { return null; } }
  }
  return null;
}

export async function zekaJson<T>(g: { sistem: string; istem: string; model?: string; signal?: AbortSignal; enCok?: number }): Promise<{ veri: T | null; metin: string; kredi: number; model: string } | null> {
  const m = yardimciModel(g.model);
  if (!m) return null;
  const signal = g.signal ?? AbortSignal.timeout(60_000);
  const sistem = `${g.sistem}\n\nYalnız geçerli bir JSON nesnesiyle yanıt ver; açıklama ya da kod bloğu ekleme.`;
  try {
    if (m.saglayici === "anthropic") {
      const r = await new Anthropic().messages.create({ model: m.id, max_tokens: g.enCok ?? 2000, system: sistem, messages: [{ role: "user", content: g.istem }] }, { signal });
      const metin = r.content.map((b) => (b.type === "text" ? b.text : "")).join("");
      return { veri: jsonCikar<T>(metin), metin, kredi: krediHesapla(m, { girdi: r.usage.input_tokens, cikti: r.usage.output_tokens }), model: m.id };
    }
    let metin = "";
    const y = await disTur({
      model: m, baglanti: baglantiBul(m)!, sistem, gecmis: [{ role: "user", content: [{ type: "text", text: g.istem }] }], araclar: [], efor: "low", signal,
      olay: { dusunce: () => {}, metin: (s) => { metin += s; }, aracBasla: () => {}, aracGirdi: () => {} },
    });
    return { veri: jsonCikar<T>(metin), metin, kredi: krediHesapla(m, y.kullanim), model: m.id };
  } catch { return null; }
}
