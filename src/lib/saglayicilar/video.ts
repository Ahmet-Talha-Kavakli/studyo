import { readFile } from "fs/promises";
import path from "path";
import { dosyaKaydet, DEPO_KOK } from "@/lib/dosyaDepo";
import { videoAyarDogrula, videoErisim, cozSaglayici, type VideoGercek } from "@/lib/videoSaglayici";
import { falHam } from "./fal";
import { girdiHazirla } from "./upscale";
import type { SaglayiciAdapter, SaglayiciIstek, SaglayiciSonuc, UretimTuru } from "./tipler";

/**
 * Video sağlayıcıları — Kling (yeni API), Seedance (BytePlus), MiniMax Hailuo, Gemini Omni Flash.
 * Ortak kurallar:
 *  • Ayarlar (süre, çözünürlük, oran, ses, başlangıç/son kare) modelin izinli değerlerine göre
 *    doğrulanır ve sağlayıcıya GERÇEKTEN gönderilir; uymayan istek açıklayıcı hatayla reddedilir.
 *  • Sağlayıcıların geçici çıktı adresleri (1 sa – 30 gün) sunucuda indirilip kalıcı depoya yazılır.
 */

const bekle = (ms: number) => new Promise((r) => setTimeout(r, ms));
const MIME_UZ: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" };

/** Görseli sağlayıcıya gidecek biçime çevirir: data URL / http olduğu gibi; yerel yol → data URL. */
export async function gorselHazirla(url?: string): Promise<string | undefined> {
  if (!url) return undefined;
  if (/^(data:image\/|https?:\/\/)/.test(url)) return url;
  let dosya: string | undefined;
  const depo = url.match(/^\/api\/dosya\/([a-z]+)\/([0-9a-f-]{36}\.[a-z0-9]{2,4})$/);
  if (depo) dosya = path.join(DEPO_KOK, depo[1], depo[2]);
  else if (/^\/[\w\-./]+\.(png|jpe?g|webp)$/i.test(url) && !url.includes("..")) dosya = path.join(process.cwd(), "public", url);
  if (!dosya) throw new Error("Başlangıç karesi okunamadı.");
  const uz = dosya.split(".").pop()!.toLowerCase();
  return `data:${MIME_UZ[uz] ?? "image/png"};base64,${(await readFile(dosya)).toString("base64")}`;
}
const hamBase64 = (d: string) => d.replace(/^data:[^;]+;base64,/, "");

/**
 * İstemdeki @elementlerin referans görselleri (her elementin ana görseli önce, sonra diğer açılar),
 * sağlayıcıya gidecek biçimde (data URL / http). `max` modelin referans sınırıdır.
 */
export async function referansGorselleri(istek: SaglayiciIstek, max: number): Promise<string[]> {
  const refs = istek.girdi?.referanslar ?? [];
  const sirali: string[] = [];
  for (let tur = 0; tur < 4; tur++) for (const r of refs) if (r.gorseller[tur]) sirali.push(r.gorseller[tur]);
  const hazir: string[] = [];
  for (const g of sirali.slice(0, max)) { const d = await gorselHazirla(g).catch(() => undefined); if (d) hazir.push(d); }
  return hazir;
}

/** Sağlayıcının adresindeki videoyu indirip depoya yazar. */
async function kalicilastir(url: string, baslik?: Record<string, string>): Promise<string> {
  const r = await fetch(url, baslik ? { headers: baslik } : undefined);
  if (!r.ok) throw new Error(`Video indirilemedi (${r.status})`);
  return dosyaKaydet("video", await r.arrayBuffer(), r.headers.get("content-type")?.split(";")[0] || "video/mp4");
}

async function hataMetni(r: Response) { return (await r.text().catch(() => "")).slice(0, 240); }

/** Ortak hazırlık: model tanımı + doğrulanmış ayarlar + kareler. */
async function hazirla(istek: SaglayiciIstek) {
  const e = videoErisim(istek.model);
  if (e.durum !== "gercek") throw new Error(e.neden);
  const m = istek.meta ?? {};
  const d = videoAyarDogrula(istek.model, { sure: m.sure, cozunurluk: m.cozunurluk, oran: m.oran, gorselUrl: m.gorselUrl, bitisKareUrl: m.bitisKareUrl });
  if (d.hata) throw new Error(d.hata);
  return {
    t: e as VideoGercek, sure: d.sure, coz: d.coz!, oran: d.oran,
    ses: e.ses === "toggle" ? m.ses === "Açık" : false,
    ilk: await gorselHazirla(m.gorselUrl), son: await gorselHazirla(m.bitisKareUrl),
    cokCekim: !!m.cokCekim,
  };
}

/* ── Kling (yeni API, API Key ile Bearer) ── */
const KLING = "https://api-singapore.klingai.com";
export const klingVideoAdapter: SaglayiciAdapter = {
  ad: "kling",
  hazir() { return Boolean(process.env.KLING_API_KEY); },
  destekler(tur: UretimTuru) { return tur === "video"; },
  async uret(istek: SaglayiciIstek): Promise<SaglayiciSonuc> {
    const h = await hazirla(istek);
    const baslik = { Authorization: `Bearer ${process.env.KLING_API_KEY}`, "Content-Type": "application/json" };
    const settings: Record<string, unknown> = { resolution: cozSaglayici(h.coz, "kling"), ...(h.sure ? { duration: h.sure } : {}) };
    if (h.t.ses === "toggle") settings.audio = h.ses ? "native" : "off";
    if (h.t.cokCekim) settings.multi_shot = h.cokCekim;
    const options = { watermark_info: { enabled: false } };
    const kare = (d: string) => (d.startsWith("data:") ? hamBase64(d) : d);
    const [yol, govde] = h.ilk
      ? [`/image-to-video/${h.t.modelId}`, {
          contents: [{ type: "prompt", text: istek.prompt.slice(0, 3072) }, { type: "first_frame", url: kare(h.ilk) }, ...(h.son ? [{ type: "last_frame", url: kare(h.son) }] : [])],
          settings, options,
        }]
      : [`/text-to-video/${h.t.modelId}`, { prompt: istek.prompt.slice(0, 3072), settings: { ...settings, ...(h.oran ? { aspect_ratio: h.oran } : {}) }, options }];
    const r = await fetch(KLING + yol, { method: "POST", headers: baslik, body: JSON.stringify(govde) });
    if (!r.ok) throw new Error(`Kling başlatılamadı (${r.status}): ${await hataMetni(r)}`);
    const b = (await r.json()) as { code?: number; message?: string; data?: { id?: string } };
    if (b.code !== 0 || !b.data?.id) throw new Error(`Kling: ${b.message ?? "görev oluşturulamadı"}`);
    for (let i = 0; i < 48; i++) {
      await bekle(6000);
      const s = (await (await fetch(`${KLING}/tasks?task_ids=${b.data.id}`, { headers: baslik })).json()) as {
        data?: { status?: string; message?: string; outputs?: { type?: string; url?: string }[] }[];
      };
      const g = s.data?.[0];
      if (g?.status === "succeeded") {
        const url = g.outputs?.find((o) => o.type === "video")?.url;
        if (!url) throw new Error("Kling: video adresi dönmedi.");
        return { ciktiUrl: await kalicilastir(url), saglayici: "kling", gercek: true, detay: { model: h.t.modelId } };
      }
      if (g?.status === "failed") throw new Error(`Kling: ${g.message || "üretim başarısız"}`);
    }
    throw new Error("Kling: zaman aşımı (görev sağlayıcıda sürüyor olabilir).");
  },
};

/* ── Seedance (BytePlus ModelArk) ── */
const ARK = "https://ark.ap-southeast.bytepluses.com/api/v3";
export const seedanceVideoAdapter: SaglayiciAdapter = {
  ad: "seedance",
  hazir() { return Boolean(process.env.BYTEPLUS_API_KEY); },
  destekler(tur: UretimTuru) { return tur === "video"; },
  async uret(istek: SaglayiciIstek): Promise<SaglayiciSonuc> {
    const h = await hazirla(istek);
    const baslik = { Authorization: `Bearer ${process.env.BYTEPLUS_API_KEY}`, "Content-Type": "application/json" };
    const icerik: Record<string, unknown>[] = [{ type: "text", text: istek.prompt.slice(0, 2000) }];
    if (h.ilk) icerik.push({ type: "image_url", image_url: { url: h.ilk }, role: "first_frame" });
    if (h.son) icerik.push({ type: "image_url", image_url: { url: h.son }, role: "last_frame" });
    // @element görselleri: Seedance 2.x referans görsel (kare modu ile birlikte kullanılamaz — belgeye göre).
    if (!h.ilk && !h.son && /dreamina-seedance-2-/.test(h.t.modelId)) {
      const refs = await referansGorselleri(istek, h.t.modelId.includes("2-5") ? 30 : 9);
      for (const url of refs) icerik.push({ type: "image_url", image_url: { url }, role: "reference_image" });
    }
    const govde: Record<string, unknown> = {
      model: h.t.modelId, content: icerik, resolution: cozSaglayici(h.coz, "seedance"), watermark: false,
      ...(h.sure ? { duration: h.sure } : {}),
      ...(h.oran ? { ratio: h.oran === "Auto" ? "adaptive" : h.oran } : {}),
      ...(h.t.ses === "toggle" ? { generate_audio: h.ses } : {}),
    };
    const r = await fetch(`${ARK}/contents/generations/tasks`, { method: "POST", headers: baslik, body: JSON.stringify(govde) });
    if (!r.ok) throw new Error(`Seedance başlatılamadı (${r.status}): ${await hataMetni(r)}`);
    const b = (await r.json()) as { id?: string };
    if (!b.id) throw new Error("Seedance: görev oluşturulamadı.");
    for (let i = 0; i < 48; i++) {
      await bekle(6000);
      const d = (await (await fetch(`${ARK}/contents/generations/tasks/${b.id}`, { headers: baslik })).json()) as {
        status?: string; content?: { video_url?: string }; error?: { message?: string };
      };
      if (d.status === "succeeded") {
        if (!d.content?.video_url) throw new Error("Seedance: video adresi dönmedi.");
        return { ciktiUrl: await kalicilastir(d.content.video_url), saglayici: "seedance", gercek: true, detay: { model: h.t.modelId } };
      }
      if (d.status === "failed" || d.status === "expired" || d.status === "cancelled") throw new Error(`Seedance: ${d.error?.message ?? d.status}`);
    }
    throw new Error("Seedance: zaman aşımı (görev sağlayıcıda sürüyor olabilir).");
  },
};

/* ── MiniMax Hailuo ── */
const MINIMAX = "https://api.minimax.io/v1";
export const minimaxVideoAdapter: SaglayiciAdapter = {
  ad: "minimax",
  hazir() { return Boolean(process.env.MINIMAX_API_KEY); },
  destekler(tur: UretimTuru) { return tur === "video"; },
  async uret(istek: SaglayiciIstek): Promise<SaglayiciSonuc> {
    const h = await hazirla(istek);
    const baslik = { Authorization: `Bearer ${process.env.MINIMAX_API_KEY}`, "Content-Type": "application/json" };
    const govde: Record<string, unknown> = {
      model: h.t.modelId, prompt: istek.prompt.slice(0, 2000), resolution: cozSaglayici(h.coz, "minimax"),
      ...(h.sure ? { duration: h.sure } : {}),
      ...(h.ilk ? { first_frame_image: h.ilk } : {}), ...(h.son ? { last_frame_image: h.son } : {}),
    };
    const r = await fetch(`${MINIMAX}/video_generation`, { method: "POST", headers: baslik, body: JSON.stringify(govde) });
    if (!r.ok) throw new Error(`MiniMax başlatılamadı (${r.status}): ${await hataMetni(r)}`);
    const b = (await r.json()) as { task_id?: string; base_resp?: { status_code?: number; status_msg?: string } };
    if (!b.task_id) throw new Error(`MiniMax: ${b.base_resp?.status_msg ?? "görev oluşturulamadı"}`);
    for (let i = 0; i < 48; i++) {
      await bekle(6000);
      const d = (await (await fetch(`${MINIMAX}/query/video_generation?task_id=${b.task_id}`, { headers: baslik })).json()) as { status?: string; file_id?: string };
      if (d.status === "Success" && d.file_id) {
        const f = (await (await fetch(`${MINIMAX}/files/retrieve?file_id=${d.file_id}`, { headers: baslik })).json()) as { file?: { download_url?: string } };
        if (!f.file?.download_url) throw new Error("MiniMax: indirme adresi dönmedi.");
        return { ciktiUrl: await kalicilastir(f.file.download_url), saglayici: "minimax", gercek: true, detay: { model: h.t.modelId } };
      }
      if (d.status === "Fail") throw new Error("MiniMax: üretim başarısız.");
    }
    throw new Error("MiniMax: zaman aşımı (görev sağlayıcıda sürüyor olabilir).");
  },
};

/* ── Luma Ray Reframe (fal) — videoyu yeni en-boy oranına genişletir; yeni alan sahneye uygun üretilir ── */
const LUMA_REFRAME_UC = ["fal-ai/luma-dream-machine/ray-3.2/reframe", "fal-ai/luma-dream-machine/ray-2/reframe"];
const LUMA_ORAN = ["1:1", "16:9", "9:16", "4:3", "3:4", "21:9", "9:21"];
export const lumaReframeAdapter: SaglayiciAdapter = {
  ad: "luma",
  hazir() { return Boolean(process.env.FAL_KEY); },
  destekler(tur: UretimTuru) { return tur === "video"; },
  async uret(istek: SaglayiciIstek): Promise<SaglayiciSonuc> {
    const m = istek.meta ?? {};
    if (!m.videoUrl) throw new Error("Çerçevelenecek video yok.");
    if (!m.oran || !LUMA_ORAN.includes(m.oran)) throw new Error("Luma Reframe yalnız 1:1, 16:9, 9:16, 4:3, 3:4, 21:9 ve 9:21 oranlarını destekler.");
    const girdi = { video_url: await girdiHazirla(m.videoUrl), aspect_ratio: m.oran, ...(m.istemsiz || !istek.prompt.trim() ? {} : { prompt: istek.prompt.slice(0, 5000) }) };
    // Yeni sürüm uç noktası yoksa (henüz yayında değil ya da adı farklı) bir öncekine düşer.
    let son: unknown;
    for (const uc of LUMA_REFRAME_UC) {
      try {
        const o = (await falHam(uc, girdi, 290_000)) as { video?: { url?: string } };
        if (!o.video?.url) throw new Error("Luma video döndürmedi.");
        return { ciktiUrl: await kalicilastir(o.video.url), saglayici: "luma", gercek: true, detay: { model: uc } };
      } catch (e) {
        son = e;
        if (!/404|not found|does not exist|unknown|bulunamad/i.test(e instanceof Error ? e.message : "")) break;
      }
    }
    throw son instanceof Error ? son : new Error("Luma Reframe başarısız.");
  },
};

/* ── fal.ai video modelleri (tek FAL_KEY): istem, görsel ve iki kare uçları modele göre seçilir ── */
export const falVideoAdapter: SaglayiciAdapter = {
  ad: "fal",
  hazir() { return Boolean(process.env.FAL_KEY); },
  destekler(tur: UretimTuru) { return tur === "video"; },
  async uret(istek: SaglayiciIstek): Promise<SaglayiciSonuc> {
    const h = await hazirla(istek);
    const u = h.t.fal;
    if (!u) throw new Error(`${istek.model} için fal uç noktası tanımlı değil.`);
    const m = istek.meta ?? {};
    const uc = h.ilk && h.son && u.kareler ? u.kareler : h.ilk ? u.gorsel : u.metin;
    if (!uc) throw new Error(h.ilk ? `${istek.model} görselden üretmiyor; kareyi kaldırıp istemle dene.` : `${istek.model} yalnız görselden video üretir; başlangıç karesi ekle.`);
    const girdi: Record<string, unknown> = { prompt: istek.prompt.slice(0, 4000) };
    if (h.ilk) girdi.image_url = h.ilk;
    if (h.son) girdi[u.sonAlan ?? "end_image_url"] = h.son;
    if (h.sure) girdi.duration = u.sure === "metin" ? String(h.sure) : u.sure === "s" ? `${h.sure}s` : h.sure;
    if (h.coz) girdi.resolution = cozSaglayici(h.coz, "fal");
    if (h.oran && !h.ilk) girdi.aspect_ratio = h.oran;
    if (h.t.ses === "toggle") girdi.generate_audio = h.ses;
    if (h.t.cokCekim) girdi.multi_shot = h.cokCekim;
    if (u.negatif && m.negatif) girdi.negative_prompt = m.negatif.slice(0, 1000);
    if (u.tohum && m.tohum !== undefined && Number.isFinite(Number(m.tohum))) girdi.seed = Number(m.tohum);
    const o = (await falHam(uc, girdi, 590_000)) as { video?: { url?: string }; videos?: { url?: string }[] };
    const url = o.video?.url ?? o.videos?.[0]?.url;
    if (!url) throw new Error(`${istek.model} video döndürmedi (içerik filtresi olabilir).`);
    return { ciktiUrl: await kalicilastir(url), saglayici: "fal", gercek: true, detay: { model: uc } };
  },
};

/* ── Gemini Omni Flash (Veo 3.1 önizlemesinin halefi) — Interactions API ── */
export const omniVideoAdapter: SaglayiciAdapter = {
  ad: "omni",
  hazir() { return Boolean(process.env.GEMINI_API_KEY); },
  destekler(tur: UretimTuru) { return tur === "video"; },
  async uret(istek: SaglayiciIstek): Promise<SaglayiciSonuc> {
    const h = await hazirla(istek);
    const key = process.env.GEMINI_API_KEY!;
    const parca = (d: string) => ({ type: "image", data: hamBase64(d), mime_type: d.match(/^data:([^;]+)/)?.[1] ?? "image/png" });
    const kareler = [h.ilk, h.son].filter((x): x is string => !!x);
    for (const k of kareler) if (!k.startsWith("data:")) throw new Error("Gemini Omni kareleri yüklenmiş görsel olmalı.");
    // Kare yoksa @element görselleri referans olarak gider (reference_to_video).
    const refs = kareler.length ? [] : (await referansGorselleri(istek, 3)).filter((d) => d.startsWith("data:"));
    const govde: Record<string, unknown> = {
      model: h.t.modelId,
      input: kareler.length || refs.length ? [...[...kareler, ...refs].map(parca), { type: "text", text: istek.prompt.slice(0, 4000) }] : istek.prompt.slice(0, 4000),
      response_format: { type: "video", resolution: cozSaglayici(h.coz, "omni"), ...(h.oran ? { aspect_ratio: h.oran } : {}) },
      ...(kareler.length ? { generation_config: { video_config: { task: "image_to_video" } } } : refs.length ? { generation_config: { video_config: { task: "reference_to_video" } } } : {}),
    };
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST", headers: { "x-goog-api-key": key, "Content-Type": "application/json" }, body: JSON.stringify(govde),
    });
    if (!r.ok) throw new Error(`Gemini Omni (${r.status}): ${await hataMetni(r)}`);
    const j = (await r.json()) as { steps?: { type?: string; content?: { type?: string; data?: string; uri?: string; mime_type?: string }[] }[] };
    const video = j.steps?.flatMap((s) => s.content ?? []).find((c) => c.type === "video");
    if (video?.data) return { ciktiUrl: await dosyaKaydet("video", Buffer.from(video.data, "base64"), video.mime_type ?? "video/mp4"), saglayici: "omni", gercek: true, detay: { model: h.t.modelId } };
    if (video?.uri) return { ciktiUrl: await kalicilastir(video.uri, { "x-goog-api-key": key }), saglayici: "omni", gercek: true, detay: { model: h.t.modelId } };
    throw new Error("Gemini Omni video döndürmedi (içerik filtresi olabilir).");
  },
};
