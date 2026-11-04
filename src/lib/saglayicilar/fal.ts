/**
 * fal.ai kuyruk API'si — tek FAL_KEY ile pek çok görsel modeli. İş kuyruğa konur, fal'ın döndürdüğü
 * durum/sonuç adresleri yoklanır (görsel üretimi genelde saniyeler sürer; istek içinde beklenir).
 */
const KUYRUK = "https://queue.fal.run/";
export const falHazir = () => Boolean(process.env.FAL_KEY);
const baslik = () => ({ Authorization: `Key ${process.env.FAL_KEY}`, "Content-Type": "application/json" });
const bekle = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function falHata(r: Response): Promise<string> {
  const t = await r.text().catch(() => "");
  try {
    const j = JSON.parse(t) as { detail?: unknown };
    const d = Array.isArray(j.detail) ? (j.detail[0] as { msg?: string })?.msg : typeof j.detail === "string" ? j.detail : undefined;
    if (d) return d.slice(0, 200);
  } catch { /* düz metin */ }
  return t.slice(0, 200) || `HTTP ${r.status}`;
}

export type FalCikti = { url: string; genislik?: number; yukseklik?: number; tohum?: number };

/** Uç noktayı çalıştırır ve ilk çıktı görselini döndürür (`images[]` ya da tek `image`). */
export async function falCalistir(uc: string, girdi: Record<string, unknown>, sureMs = 240_000): Promise<FalCikti> {
  const o = (await falHam(uc, girdi, sureMs)) as { images?: { url?: string; width?: number; height?: number }[]; image?: { url?: string; width?: number; height?: number }; seed?: number; has_nsfw_concepts?: boolean[] };
  if (o.has_nsfw_concepts?.[0]) throw new Error("İçerik güvenlik filtresine takıldı.");
  const g = o.images?.[0] ?? o.image;
  if (!g?.url) throw new Error("fal: çıktı yok.");
  return { url: g.url, genislik: g.width, yukseklik: g.height, tohum: o.seed };
}

/** Kuyruğa gönderir, biter bitmez ham JSON yanıtı döner (maske gibi görsel dışı çıktılar için). */
export async function falHam(uc: string, girdi: Record<string, unknown>, sureMs = 240_000): Promise<unknown> {
  const r = await fetch(KUYRUK + uc, { method: "POST", headers: baslik(), body: JSON.stringify(girdi) });
  if (!r.ok) throw new Error(`fal: ${await falHata(r)}`);
  const is = (await r.json()) as { status_url?: string; response_url?: string };
  if (!is.status_url?.startsWith(KUYRUK) || !is.response_url?.startsWith(KUYRUK)) throw new Error("fal: kuyruk yanıtı eksik.");
  const son = Date.now() + sureMs;
  let aralik = 800;
  while (Date.now() < son) {
    await bekle(aralik);
    aralik = Math.min(3000, aralik * 1.4);
    const s = await fetch(is.status_url, { headers: baslik() });
    if (!s.ok && s.status !== 202) throw new Error(`fal: ${await falHata(s)}`);
    const d = (await s.json()) as { status?: string; error?: string };
    if (d.status === "IN_QUEUE" || d.status === "IN_PROGRESS") continue;
    if (d.status !== "COMPLETED") throw new Error(`fal: ${d.error || "bilinmeyen durum"}`);
    if (d.error) throw new Error(`fal: ${d.error}`.slice(0, 200));
    const c = await fetch(is.response_url, { headers: baslik() });
    if (!c.ok) throw new Error(`fal: ${await falHata(c)}`);
    return c.json();
  }
  throw new Error("fal: zaman aşımı (iş sağlayıcıda sürüyor olabilir).");
}

/** fal'ın hazır boyut adları; diğer oranlar `{width, height}` olarak gider. */
const SIZE6: Record<string, string> = { "1:1": "square_hd", "3:4": "portrait_4_3", "9:16": "portrait_16_9", "4:3": "landscape_4_3", "16:9": "landscape_16_9" };
export function falBoyut(oran: string | undefined, w: number, h: number, ozel = true): string | { width: number; height: number } {
  if (ozel) return { width: w, height: h };
  return SIZE6[oran ?? "1:1"] ?? "square_hd";
}
