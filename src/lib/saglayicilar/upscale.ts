import { readFile } from "fs/promises";
import path from "path";
import { DEPO_KOK, MIME, dosyaKaydet } from "@/lib/dosyaDepo";
import { upscaleModel, TOPAZ_ALT, type UpscaleAyar, type UpscaleModelId } from "@/lib/upscaleVeri";

/**
 * fal.ai kuyruk API'si ile görsel/video büyütme. İş iki adımda yürür: `upscaleBaslat` işi kuyruğa
 * koyar ve fal'ın döndürdüğü durum/sonuç adreslerini bir jetonda saklar; `upscaleSorgula` jetonla
 * durumu sorar, bitince çıktıyı depoya kopyalar (fal adresleri geçicidir). Anahtar istemciye gitmez.
 */
const FAL_KUYRUK = "https://queue.fal.run/";
export const falBagli = () => Boolean(process.env.FAL_KEY);
const baslik = () => ({ Authorization: `Key ${process.env.FAL_KEY}`, "Content-Type": "application/json" });

const sinirla = (v: number | undefined, min: number, max: number) => (v == null || Number.isNaN(v) ? undefined : Math.min(max, Math.max(min, v)));

/** Yerel depo/public adresini fal'ın okuyabileceği data URI'ye çevirir. */
export async function girdiHazirla(url: string): Promise<string> {
  if (/^(data:(image|video)\/|https:\/\/)/.test(url)) return url;
  let dosya: string | undefined;
  const depo = url.match(/^\/api\/dosya\/([a-z]+)\/([0-9a-f-]{36}\.[a-z0-9]{2,4})$/);
  if (depo) dosya = path.join(DEPO_KOK, depo[1], depo[2]);
  else if (/^\/[\w\-./]+\.(png|jpe?g|webp|mp4|webm|mov)$/i.test(url) && !url.includes("..")) dosya = path.join(process.cwd(), "public", url);
  if (!dosya) throw new Error("Kaynak dosya okunamadı.");
  const uz = dosya.split(".").pop()!.toLowerCase();
  const mime = uz === "webm" ? "video/webm" : uz === "jpeg" ? "image/jpeg" : MIME[uz] ?? "application/octet-stream";
  return `data:${mime};base64,${(await readFile(dosya)).toString("base64")}`;
}

/** Vayra ayarlarını modelin fal şemasına çevirir (şemada olmayan alan gönderilmez). */
export function falGirdisi(model: UpscaleModelId, kaynak: string, olcek: number, a: UpscaleAyar): Record<string, unknown> {
  const tohum = a.tohum != null && Number.isInteger(a.tohum) ? { seed: a.tohum } : {};
  switch (model) {
    case "seedvr":
      return { image_url: kaynak, ...(a.hedef && ["1080p", "1440p", "2160p"].includes(a.hedef) ? { upscale_mode: "target", target_resolution: a.hedef } : { upscale_mode: "factor", upscale_factor: sinirla(olcek, 1, 10) ?? 2 }),
        noise_scale: sinirla(a.gren, 0, 1) ?? 0.1, output_format: "png", ...tohum };
    case "topaz": {
      const alt = TOPAZ_ALT.some((t) => t.id === a.topazModel) ? a.topazModel! : "Standard V2";
      const g: Record<string, unknown> = { image_url: kaynak, model: alt, upscale_factor: sinirla(olcek, 1, 4) ?? 2, output_format: "png" };
      if (alt === "Redefine") {
        g.creativity = Math.round(sinirla(a.yaraticilik, 1, 6) ?? 3);
        g.texture = Math.round(sinirla(a.doku, 1, 5) ?? 3);
        if (a.istem?.trim()) g.prompt = a.istem.trim().slice(0, 1024); else g.autoprompt = true;
      } else {
        g.face_enhancement = !!a.yuz;
        if (a.yuz) g.face_enhancement_strength = sinirla(a.yuzGuc, 0, 1) ?? 0.8;
        if (a.yuz && a.yuzYaraticilik != null) g.face_enhancement_creativity = sinirla(a.yuzYaraticilik, 0, 1);
        if (a.odak && ["All", "Foreground", "Background"].includes(a.odak)) g.subject_detection = a.odak;
        for (const [k, v] of [["sharpen", a.keskinlik], ["denoise", a.gurultu], ["fix_compression", a.sikistirma]] as const) {
          const s = sinirla(v, 0, 1); if (s != null && s > 0) g[k] = s;
        }
      }
      return g;
    }
    case "clarity": {
      const g: Record<string, unknown> = { image_url: kaynak, upscale_factor: sinirla(olcek, 1, 4) ?? 2, creativity: sinirla(a.yaraticilik, 0, 1) ?? 0.35, resemblance: sinirla(a.benzerlik, 0, 1) ?? 0.6, ...tohum };
      if (a.istem?.trim()) g.prompt = a.istem.trim().slice(0, 1000);
      if (a.yonlendirme != null) g.guidance_scale = sinirla(a.yonlendirme, 0, 20);
      if (a.adim != null) g.num_inference_steps = Math.round(sinirla(a.adim, 4, 50) ?? 18);
      if (a.negatif?.trim()) g.negative_prompt = a.negatif.trim().slice(0, 500);
      return g;
    }
    case "crystal":
      return { image_url: kaynak, scale_factor: sinirla(olcek, 1, 200) ?? 2, creativity: sinirla(a.yaraticilik, 0, 10) ?? 0, output_format: "png" };
    case "ideogram": {
      const g: Record<string, unknown> = { image_url: kaynak, resemblance: Math.round(sinirla(a.benzerlik, 1, 100) ?? 50), detail: Math.round(sinirla(a.detay, 1, 100) ?? 50), expand_prompt: false, ...tohum };
      if (a.istem?.trim()) g.prompt = a.istem.trim().slice(0, 1000);
      return g;
    }
    case "recraft":
      return { image_url: kaynak };
    case "flashvsr":
      return { video_url: kaynak, upscale_factor: sinirla(olcek, 1, 4) ?? 2, acceleration: "regular", quality: a.kalite === "maximum" ? 90 : a.kalite === "medium" ? 55 : 70, color_fix: a.renkDuzelt ?? true, preserve_audio: a.sesKoru ?? true, ...tohum };
    case "seedvr-video":
      return { video_url: kaynak, upscale_mode: "factor", upscale_factor: sinirla(olcek, 1, 4) ?? 2, noise_scale: sinirla(a.gren, 0, 1) ?? 0.1, ...tohum };
  }
}

type Jeton = { d: string; s: string; m: UpscaleModelId };
const jetonYaz = (j: Jeton) => Buffer.from(JSON.stringify(j)).toString("base64url");
/** Jeton yalnız fal kuyruk adreslerine izin verir — anahtar başka bir sunucuya gönderilemez. */
export function jetonOku(t: string): Jeton | null {
  try {
    const j = JSON.parse(Buffer.from(t, "base64url").toString()) as Jeton;
    if (typeof j.d !== "string" || typeof j.s !== "string" || !upscaleModel(j.m)) return null;
    if (!j.d.startsWith(FAL_KUYRUK) || !j.s.startsWith(FAL_KUYRUK)) return null;
    return j;
  } catch { return null; }
}

async function falHata(r: Response): Promise<string> {
  const t = await r.text().catch(() => "");
  try {
    const j = JSON.parse(t) as { detail?: unknown };
    const d = Array.isArray(j.detail) ? (j.detail[0] as { msg?: string })?.msg : typeof j.detail === "string" ? j.detail : undefined;
    if (d) return d.slice(0, 200);
  } catch { /* düz metin */ }
  return t.slice(0, 200) || `HTTP ${r.status}`;
}

export async function upscaleBaslat(g: { model: UpscaleModelId; kaynakUrl: string; olcek: number; ayar?: UpscaleAyar }): Promise<{ jeton: string }> {
  if (!falBagli()) throw new Error("Büyütme sağlayıcısı (fal.ai) bağlı değil.");
  const m = upscaleModel(g.model);
  if (!m) throw new Error("Bilinmeyen model.");
  if (m.olcekler.length && !m.olcekler.includes(g.olcek)) throw new Error(`${m.ad} için ölçek ${m.olcekler.map((o) => `${o}×`).join(", ")} olabilir.`);
  const kaynak = await girdiHazirla(g.kaynakUrl);
  if (m.tur === "video" !== kaynak.startsWith("data:video/") && kaynak.startsWith("data:")) throw new Error(m.tur === "video" ? "Bu model video bekliyor." : "Bu model görsel bekliyor.");
  const r = await fetch(FAL_KUYRUK + m.falId, { method: "POST", headers: baslik(), body: JSON.stringify(falGirdisi(m.id, kaynak, g.olcek, g.ayar ?? {})) });
  if (!r.ok) throw new Error(`fal: ${await falHata(r)}`);
  const j = (await r.json()) as { request_id?: string; status_url?: string; response_url?: string };
  if (!j.status_url || !j.response_url) throw new Error("fal: kuyruk yanıtı eksik.");
  return { jeton: jetonYaz({ d: j.status_url, s: j.response_url, m: m.id }) };
}

export type UpscaleDurum =
  | { durum: "kuyrukta"; sira?: number }
  | { durum: "isleniyor" }
  | { durum: "tamam"; url: string; genislik?: number; yukseklik?: number }
  | { durum: "hata"; hata: string };

export async function upscaleSorgula(jeton: string): Promise<UpscaleDurum> {
  if (!falBagli()) return { durum: "hata", hata: "Büyütme sağlayıcısı bağlı değil." };
  const j = jetonOku(jeton);
  if (!j) return { durum: "hata", hata: "Geçersiz iş." };
  const r = await fetch(j.d, { headers: baslik() });
  if (!r.ok && r.status !== 202) return { durum: "hata", hata: `fal: ${await falHata(r)}` };
  const s = (await r.json()) as { status?: string; queue_position?: number; error?: string };
  if (s.status === "IN_QUEUE") return { durum: "kuyrukta", sira: s.queue_position };
  if (s.status === "IN_PROGRESS") return { durum: "isleniyor" };
  if (s.status !== "COMPLETED") return { durum: "hata", hata: s.error || "fal: bilinmeyen durum" };
  if (s.error) return { durum: "hata", hata: `fal: ${s.error}`.slice(0, 200) };

  const c = await fetch(j.s, { headers: baslik() });
  if (!c.ok) return { durum: "hata", hata: `fal: ${await falHata(c)}` };
  const o = (await c.json()) as { image?: { url?: string; width?: number; height?: number; content_type?: string }; images?: { url?: string; width?: number; height?: number; content_type?: string }[]; video?: { url?: string; content_type?: string } };
  if (!o.image && o.images?.[0]) o.image = o.images[0];
  const cikti = upscaleModel(j.m)!.tur === "video" ? o.video : o.image;
  if (!cikti?.url) return { durum: "hata", hata: "fal: çıktı adresi yok." };
  const d = await fetch(cikti.url);
  if (!d.ok) return { durum: "hata", hata: `Çıktı indirilemedi (${d.status})` };
  const mime = (d.headers.get("content-type")?.split(";")[0] || cikti.content_type || (upscaleModel(j.m)!.tur === "video" ? "video/mp4" : "image/png")).trim();
  const url = await dosyaKaydet("upscale", await d.arrayBuffer(), mime);
  const g = o.image;
  return { durum: "tamam", url, ...(g?.width && g?.height ? { genislik: g.width, yukseklik: g.height } : {}) };
}
