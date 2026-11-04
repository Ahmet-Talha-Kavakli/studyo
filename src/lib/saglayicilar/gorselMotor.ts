import { gorselBoyut, gorselModelBul, type GorselApi, type GorselModel } from "@/lib/gorselModelVeri";
import { falBoyut, falCalistir, falHazir } from "./fal";
import { base64Parca, dataUriYap, gorselGirdileri, gorselIstem, hexRgb, type GorselGirdi } from "./gorselOrtak";
import type { GorselIslem, SaglayiciIstek, SaglayiciSonuc } from "./tipler";
import { istemHazir, istemIsle, turkceMi } from "./istem";

/**
 * Görsel motoru — katalog modelini GERÇEK sağlayıcı/model kimliğine yönlendirir (ad eşleşmesiyle
 * tahmin yok) ve seçilen oran, çözünürlük, kalite, referans, maske gibi ayarları sağlayıcının
 * kendi parametreleriyle gönderir. Sağlayıcı bağlı değilse `null` döner (çağıran demo üretir).
 *
 * Kaynaklar (22.10.2026): Gemini Interactions API, OpenAI Images, BytePlus ModelArk Seedream,
 * fal.ai kuyruk OpenAPI şemaları.
 */

export const gorselHazir = {
  gemini: () => Boolean(process.env.GEMINI_API_KEY),
  seedream: () => Boolean(process.env.BYTEPLUS_API_KEY),
  openai: () => Boolean(process.env.OPENAI_API_KEY),
  fal: falHazir,
};

type Sonuc = { cikti: string; model: string; gonderilenIstem?: string; tohum?: number; genislik?: number; yukseklik?: number };

/* ═════════════ Gemini (Nano Banana) — Interactions API ═════════════ */
async function gemini(api: GorselApi, istem: string, g: GorselGirdi, o: { oran?: string; cozunurluk?: string; ekGorseller?: string[] }): Promise<Sonuc> {
  const gorseller = [...g.icerik, ...g.stil, ...(o.ekGorseller ?? [])];
  const input: Record<string, unknown>[] = [{ type: "text", text: istem }];
  for (const u of gorseller) {
    const p = base64Parca(await dataUriYap(u));
    input.push({ type: "image", mime_type: p.mime, data: p.veri });
  }
  const bicim: Record<string, unknown> = { type: "image", mime_type: "image/png" };
  if (o.oran && o.oran !== "Auto") bicim.aspect_ratio = o.oran;
  if (api.cozunurluklar.length && o.cozunurluk && api.cozunurluklar.includes(o.cozunurluk)) bicim.image_size = o.cozunurluk;
  const r = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
    body: JSON.stringify({ model: api.model, input: input.length === 1 ? istem : input, response_format: bicim }),
  });
  if (!r.ok) throw new Error(`Gemini ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const d = (await r.json()) as { steps?: { type?: string; content?: { type?: string; data?: string; mime_type?: string }[] }[]; output_image?: { data?: string; mime_type?: string } };
  let img: { data?: string; mime_type?: string } | undefined = d.output_image;
  for (const s of d.steps ?? []) for (const c of s.content ?? []) if (c.type === "image" && c.data) img = c;
  if (!img?.data) throw new Error("Gemini: görsel dönmedi (istem reddedilmiş olabilir).");
  return { cikti: `data:${img.mime_type ?? "image/png"};base64,${img.data}`, model: api.model, gonderilenIstem: istem };
}

/* ═════════════ Seedream (BytePlus ModelArk) ═════════════ */
// Resmî önerilen boyutlar (ModelArk 1541523): 5.0 pro/flash ve 2K/3K/4K aileleri.
const SEEDREAM_TABLO: Record<string, Record<string, string>> = {
  "1K": { "1:1": "1024x1024", "4:3": "1152x864", "3:4": "864x1152", "16:9": "1424x800", "9:16": "800x1424", "3:2": "1248x832", "2:3": "832x1248", "21:9": "1568x672" },
  "1.5K": { "1:1": "1536x1536", "4:3": "1792x1344", "3:4": "1344x1792", "16:9": "2048x1152", "9:16": "1152x2048", "3:2": "1872x1248", "2:3": "1248x1872", "21:9": "2352x1008" },
  "2K-pro": { "1:1": "2048x2048", "4:3": "2368x1776", "3:4": "1776x2368", "16:9": "2816x1584", "9:16": "1584x2816", "3:2": "2496x1664", "2:3": "1664x2496", "21:9": "3136x1344" },
  "2K": { "1:1": "2048x2048", "4:3": "2304x1728", "3:4": "1728x2304", "16:9": "2848x1600", "9:16": "1600x2848", "3:2": "2496x1664", "2:3": "1664x2496", "21:9": "3136x1344" },
  "3K": { "1:1": "3072x3072", "4:3": "3456x2592", "3:4": "2592x3456", "16:9": "4096x2304", "9:16": "2304x4096", "3:2": "3744x2496", "2:3": "2496x3744", "21:9": "4704x2016" },
  "4K": { "1:1": "4096x4096", "4:3": "4704x3520", "3:4": "3520x4704", "16:9": "5504x3040", "9:16": "3040x5504", "3:2": "4992x3328", "2:3": "3328x4992", "21:9": "6240x2656" },
};
export function seedreamBoyut(api: GorselApi, oran = "1:1", cozunurluk?: string): string {
  const kademe = api.cozunurluklar.includes(cozunurluk ?? "") ? cozunurluk! : api.cozunurluklar[api.cozunurluklar.length - 1] ?? "2K";
  const pro = /dola-seedream-5-0/.test(api.model);
  const tablo = SEEDREAM_TABLO[kademe === "2K" && pro ? "2K-pro" : kademe];
  if (tablo?.[oran]) return tablo[oran];
  // Tabloda olmayan oran (4:5, 5:4): kademe alanını koruyarak hesapla.
  const b = gorselBoyut(oran, kademe);
  return `${b.w}x${b.h}`;
}
async function seedream(api: GorselApi, istem: string, g: GorselGirdi, o: { oran?: string; cozunurluk?: string }): Promise<Sonuc> {
  const refs = [...g.icerik, ...g.stil].slice(0, api.refMax);
  const govde: Record<string, unknown> = {
    model: api.model, prompt: istem.slice(0, 3000), size: seedreamBoyut(api, o.oran, o.cozunurluk),
    watermark: false, response_format: "url",
    ...(/seedream-5|dola-seedream/.test(api.model) ? { output_format: "png" } : {}),
    ...(refs.length ? { image: refs.length === 1 ? refs[0] : refs } : {}),
  };
  const r = await fetch("https://ark.ap-southeast.bytepluses.com/api/v3/images/generations", {
    method: "POST", headers: { Authorization: `Bearer ${process.env.BYTEPLUS_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify(govde),
  });
  if (!r.ok) throw new Error(`Seedream ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const d = (await r.json()) as { data?: { url?: string; b64_json?: string; size?: string; error?: { message?: string } }[]; error?: { message?: string } };
  if (d.error?.message) throw new Error(`Seedream: ${d.error.message}`);
  const ilk = d.data?.[0];
  if (ilk?.error?.message) throw new Error(`Seedream: ${ilk.error.message}`);
  const cikti = ilk?.url ?? (ilk?.b64_json ? `data:image/png;base64,${ilk.b64_json}` : undefined);
  if (!cikti) throw new Error("Seedream: çıktı yok");
  const [w, h] = (ilk?.size ?? "").split("x").map(Number);
  return { cikti, model: api.model, gonderilenIstem: istem, ...(w && h ? { genislik: w, yukseklik: h } : {}) };
}

/* ═════════════ OpenAI Images ═════════════ */
export function openaiBoyut(api: GorselApi, oran = "1:1", cozunurluk?: string): string {
  if (api.model === "gpt-image-1" || api.model === "gpt-image-1.5") return oran === "3:2" ? "1536x1024" : oran === "2:3" ? "1024x1536" : "1024x1024";
  if (oran === "Auto") return "auto";
  // gpt-image-2+: serbest WxH — kenarlar 16'nın katı, oran ≤ 3:1, en fazla 3840x2160 alanı.
  const [a, b] = oran.split(":").map(Number);
  const r = Math.min(3, Math.max(1 / 3, a / b || 1));
  const uzun = { "1K": 1536, "2K": 2560, "4K": 3840 }[cozunurluk ?? "1K"] ?? 1536;
  let w = r >= 1 ? uzun : uzun * r, h = r >= 1 ? uzun / r : uzun;
  const maks = 3840 * 2160;
  if (w * h > maks) { const k = Math.sqrt(maks / (w * h)); w *= k; h *= k; }
  const y = (n: number) => Math.max(16, Math.floor(n / 16) * 16);
  return `${y(w)}x${y(h)}`;
}
const OPENAI_KALITE: Record<string, string> = { "Düşük": "low", "Orta": "medium", "Yüksek": "high", "En yüksek": "max" };
async function openai(api: GorselApi, istem: string, g: GorselGirdi, o: { oran?: string; cozunurluk?: string; kalite?: string; seffaf?: boolean }): Promise<Sonuc> {
  const refs = [...g.icerik, ...g.stil].slice(0, api.refMax);
  const kalite = OPENAI_KALITE[o.kalite ?? ""];
  const govde: Record<string, unknown> = {
    model: api.model, prompt: istem.slice(0, 32000), size: openaiBoyut(api, o.oran, o.cozunurluk), n: 1,
    ...(kalite && api.kaliteler?.includes(kalite) ? { quality: kalite } : {}),
    ...(o.seffaf && api.seffaf ? { background: "transparent", output_format: "png" } : {}),
  };
  const duzenle = refs.length > 0;
  if (duzenle) govde.images = refs.map((u) => ({ image_url: u }));
  const r = await fetch(`https://api.openai.com/v1/images/${duzenle ? "edits" : "generations"}`, {
    method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify(govde),
  });
  if (!r.ok) throw new Error(`OpenAI ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const d = (await r.json()) as { data?: { b64_json?: string }[] };
  const b64 = d.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI: çıktı yok");
  return { cikti: `data:image/png;base64,${b64}`, model: api.model, gonderilenIstem: istem };
}

/* ═════════════ fal.ai ═════════════ */
async function fal(api: GorselApi, istem: string, g: GorselGirdi, istek: SaglayiciIstek, negatifAyri: boolean): Promise<Sonuc> {
  const m = istek.meta ?? {};
  const oran = m.oran && m.oran !== "Auto" ? m.oran : undefined;
  const boyut = gorselBoyut(oran ?? "1:1", api.cozunurluklar.includes(m.cozunurluk ?? "") ? m.cozunurluk : "1K");
  const refs = [...g.icerik, ...g.stil];
  const tohum = api.tohum && Number.isInteger(m.tohum) ? { seed: m.tohum } : {};
  const negatif = negatifAyri && m.negatif?.trim() ? { negative_prompt: m.negatif.trim() } : {};
  let uc = api.model;
  let girdi: Record<string, unknown> = { prompt: istem };
  switch (api.falBicim) {
    case "flux2":
      if (refs.length) { uc = api.duzenleModel ?? uc; girdi.image_urls = refs.slice(0, api.refMax); }
      girdi = { ...girdi, image_size: oran || !refs.length ? falBoyut(oran, boyut.w, boyut.h) : "auto", output_format: "png", safety_tolerance: "2", ...tohum };
      if (/flex/.test(api.model)) {
        if (m.yonlendirme) girdi.guidance_scale = Math.min(10, Math.max(1.5, m.yonlendirme));
        if (m.adim) girdi.num_inference_steps = Math.min(50, Math.max(2, Math.round(m.adim)));
      }
      break;
    case "kontext":
      if (!refs.length) throw new Error("Bu model düzenlenecek bir görsel ister.");
      girdi = { ...girdi, ...(/multi/.test(uc) ? { image_urls: refs.slice(0, api.refMax) } : { image_url: refs[0] }), ...(oran ? { aspect_ratio: oran } : {}), num_images: 1, output_format: "png", ...tohum };
      break;
    case "recraft":
      if (m.vektor && api.vektorModel) uc = api.vektorModel;
      else if (m.kalite === "Pro" && api.proModel) uc = api.proModel;
      girdi = { ...girdi, image_size: falBoyut(oran, boyut.w, boyut.h), ...(m.renkler?.length ? { colors: m.renkler.slice(0, 10).map(hexRgb) } : {}) };
      break;
    case "zimage":
      if (refs.length && api.duzenleModel) { uc = api.duzenleModel; girdi.image_url = refs[0]; girdi.strength = 0.6; }
      girdi = { ...girdi, image_size: refs.length && !oran ? "auto" : falBoyut(oran, boyut.w, boyut.h), num_images: 1, output_format: "png", ...tohum };
      break;
    case "grok":
      if (refs.length && api.duzenleModel) { uc = api.duzenleModel; girdi.image_urls = refs.slice(0, 3); }
      girdi = { ...girdi, aspect_ratio: oran ?? (refs.length ? "auto" : "1:1"), resolution: m.cozunurluk === "2K" ? "2k" : "1k", num_images: 1, output_format: "png" };
      break;
    case "kling":
      if (refs.length && api.duzenleModel) { uc = api.duzenleModel; girdi.image_urls = refs.slice(0, api.refMax); }
      girdi = { ...girdi, ...(oran ? { aspect_ratio: oran } : {}), resolution: api.cozunurluklar.includes(m.cozunurluk ?? "") ? m.cozunurluk : "1K", num_images: 1, output_format: "png" };
      break;
    case "wan":
      if (refs.length && api.duzenleModel) { uc = api.duzenleModel; girdi.image_url = refs[0]; girdi.strength = 0.5; if (oran && ["16:9", "9:16", "1:1"].includes(oran)) girdi.aspect_ratio = oran; }
      else girdi.image_size = falBoyut(oran, boyut.w, boyut.h);
      girdi = { ...girdi, ...negatif, ...tohum, enable_safety_checker: true };
      break;
    case "ideogram": {
      const hiz: Record<string, string> = { Turbo: "TURBO", Dengeli: "BALANCED", Kalite: "QUALITY" };
      girdi = { ...girdi, ...negatif, image_size: falBoyut(oran, boyut.w, boyut.h), num_images: 1, rendering_speed: hiz[m.kalite ?? ""] ?? "BALANCED", expand_prompt: false, ...tohum,
        ...(refs.length ? { image_urls: refs.slice(0, api.refMax) } : {}) };
      break;
    }
    default:
      break;
  }
  const c = await falCalistir(uc, girdi);
  return { cikti: c.url, model: uc, gonderilenIstem: istem, tohum: c.tohum, genislik: c.genislik, yukseklik: c.yukseklik };
}

/* ═════════════ Düzenleme işlemleri (görüntüleyici araçları) ═════════════ */
const DUZENLEYICI_SIRA = ["Nano Banana 2.1", "GPT Image 2.5", "Seedream 5.0 Pro", "FLUX.2 Pro"];
const ilkHazir = (adlar: string[]) => adlar.map(gorselModelBul).find((m): m is GorselModel => !!m && gorselHazir[m.api.saglayici]());

async function islemCalistir(islem: GorselIslem, istek: SaglayiciIstek): Promise<Sonuc | null> {
  const m = istek.meta ?? {};
  if (!m.gorselUrl) throw new Error("Düzenlenecek görsel yok.");
  // Şeffaf arka plan: gerçek ayırma modeli (fal BiRefNet). Düz renk zemin talimatla düzenlenir.
  if (islem === "arkaplan" && (m.zemin ?? "seffaf") === "seffaf" && falHazir()) {
    const g = await gorselGirdileri(istek, 1);
    const c = await falCalistir("fal-ai/birefnet/v2", { image_url: g.icerik[0], model: "General Use (Heavy)", output_format: "png", refine_foreground: true });
    return { cikti: c.url, model: "fal-ai/birefnet/v2", genislik: c.genislik, yukseklik: c.yukseklik };
  }
  if (islem === "maske" && falHazir() && m.maskeUrl) {
    const g = await gorselGirdileri(istek, 1);
    // Kullanıcının seçtiği maskeli düzenleme motoru (izinli liste).
    const [uc, girdi] = m.motor === "ideogram"
      ? ["fal-ai/ideogram/v3/edit", { prompt: istek.prompt, image_url: g.icerik[0], mask_url: g.maske, rendering_speed: "BALANCED", num_images: 1, expand_prompt: false }]
      : m.motor === "bria"
        ? ["fal-ai/bria/genfill", { prompt: istek.prompt, image_url: g.icerik[0], mask_url: g.maske, num_images: 1 }]
        : ["fal-ai/flux-pro/v1/fill", { prompt: istek.prompt, image_url: g.icerik[0], mask_url: g.maske, num_images: 1, output_format: "png", safety_tolerance: "2" }];
    const c = await falCalistir(uc, girdi);
    return { cikti: c.url, model: uc, gonderilenIstem: istek.prompt, genislik: c.genislik, yukseklik: c.yukseklik };
  }
  // Nesne silme: istemsiz, maskeli (Bria Eraser).
  if (islem === "sil" && falHazir() && m.maskeUrl) {
    const g = await gorselGirdileri(istek, 1);
    const c = await falCalistir("fal-ai/bria/eraser", { image_url: g.icerik[0], mask_url: g.maske, mask_type: "manual" });
    return { cikti: c.url, model: "fal-ai/bria/eraser", genislik: c.genislik, yukseklik: c.yukseklik };
  }
  // Arka planı istemle yeni bir sahneyle değiştir (Bria Background Replace).
  if (islem === "zemin-degistir" && falHazir()) {
    const g = await gorselGirdileri(istek, 1);
    const c = await falCalistir("fal-ai/bria/background/replace", { image_url: g.icerik[0], prompt: istek.prompt, num_images: 1, refine_prompt: true });
    return { cikti: c.url, model: "fal-ai/bria/background/replace", gonderilenIstem: istek.prompt, genislik: c.genislik, yukseklik: c.yukseklik };
  }
  // Yeniden ışıklandırma (IC-Light v2): ışık yönü + tarif.
  if (islem === "isik" && falHazir()) {
    const g = await gorselGirdileri(istek, 1);
    const yon = ["None", "Left", "Right", "Top", "Bottom"].includes(m.yon ?? "") ? m.yon : "None";
    const c = await falCalistir("fal-ai/iclight-v2", { image_url: g.icerik[0], prompt: istek.prompt, initial_latent: yon, num_images: 1, output_format: "png" });
    return { cikti: c.url, model: "fal-ai/iclight-v2", gonderilenIstem: istek.prompt, genislik: c.genislik, yukseklik: c.yukseklik };
  }
  if (islem === "genislet" && falHazir() && m.motor !== "yaratici") {
    const g = await gorselGirdileri(istek, 1);
    // Kullanıcının istemi iç talimat değilse sağlayıcıya gider (boşsa çevre kendiliğinden devam ettirilir).
    const istem = m.istemsiz ? "" : istek.prompt;
    const k = m.kanvas;
    const tam = (n: number) => Math.max(1, Math.round(n));
    if (m.motor === "ideogram" && k) {
      const c = await falCalistir("fal-ai/ideogram/v3/reframe", { image_url: g.icerik[0], image_size: { width: tam(k.w), height: tam(k.h) }, rendering_speed: "BALANCED", num_images: 1 });
      return { cikti: c.url, model: "fal-ai/ideogram/v3/reframe", genislik: c.genislik, yukseklik: c.yukseklik };
    }
    if (m.motor === "luma" && m.oran && ["1:1", "16:9", "9:16", "4:3", "3:4", "21:9", "9:21"].includes(m.oran)) {
      const c = await falCalistir("fal-ai/luma-photon/reframe", { image_url: g.icerik[0], aspect_ratio: m.oran, ...(istem ? { prompt: istem } : {}) });
      return { cikti: c.url, model: "fal-ai/luma-photon/reframe", gonderilenIstem: istem || undefined, genislik: c.genislik, yukseklik: c.yukseklik };
    }
    if (k && k.w * k.h < 25_000_000) {
      const c = await falCalistir("fal-ai/bria/expand", {
        image_url: g.icerik[0], canvas_size: [tam(k.w), tam(k.h)], original_image_size: [tam(k.gw), tam(k.gh)], original_image_location: [Math.round(k.x), Math.round(k.y)],
        prompt: istem, ...(m.negatif?.trim() ? { negative_prompt: m.negatif.trim() } : {}),
      });
      return { cikti: c.url, model: "fal-ai/bria/expand", gonderilenIstem: istem || undefined, genislik: c.genislik, yukseklik: c.yukseklik };
    }
    if (m.oran && ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9"].includes(m.oran)) {
      const c = await falCalistir("fal-ai/bria/expand", { image_url: g.icerik[0], aspect_ratio: m.oran, prompt: istem });
      return { cikti: c.url, model: "fal-ai/bria/expand", genislik: c.genislik, yukseklik: c.yukseklik };
    }
  }
  if (islem === "arkaplan" && (m.zemin ?? "seffaf") === "seffaf") {
    // Şeffaf çıktı yalnız ayırma modeli (fal) ya da OpenAI şeffaf arka planla mümkün.
    const o = gorselModelBul("GPT Image 1.5")!;
    if (!gorselHazir.openai()) throw new Error("Şeffaf arka plan için fal.ai ya da OpenAI bağlı olmalı.");
    const g = await gorselGirdileri(istek, 1);
    return openai(o.api, "Remove the background completely, keep the subject exactly as is with clean edges.", g, { seffaf: true });
  }
  // Talimatla düzenleme: kaynak görsel + talimat, bağlı ilk düzenleme modeli.
  const d = ilkHazir(DUZENLEYICI_SIRA);
  if (!d) return null;
  const g = await gorselGirdileri(istek, d.api.refMax);
  let talimat = istek.prompt;
  const ek: string[] = [];
  if ((islem === "maske" || islem === "sil") && g.maske) {
    if (d.api.saglayici !== "gemini") throw new Error("Bölgesel düzenleme için fal.ai ya da Gemini bağlı olmalı.");
    if (islem === "sil") talimat = "Remove the object in the masked area and fill it naturally with the surrounding background.";
    ek.push(g.maske);
    talimat = `${talimat}\n\nThe last image is a mask: change ONLY the white area of the first image, keep everything else pixel-identical.`;
  }
  if (islem === "genislet") {
    const yer = m.kanvas ? `placed about ${Math.round(((m.kanvas.x + m.kanvas.gw / 2) / m.kanvas.w) * 100)}% from the left and ${Math.round(((m.kanvas.y + m.kanvas.gh / 2) / m.kanvas.h) * 100)}% from the top` : "centered";
    talimat = `${m.istemsiz ? "" : `${talimat}\n\n`}Outpaint the first image to a ${m.oran} canvas: keep the existing content unchanged and ${yer}, naturally extend the surroundings.`;
  }
  // Çizerek düzenle: görseldeki el çizimi notlar (ok, kutu, karalama, yazı) talimattır; uygulanır ve notlar silinir.
  if (islem === "cizim") talimat = `The image contains hand-drawn annotations on top of a picture (colored arrows, boxes, circles, scribbles and short text notes). Treat them as edit instructions: ${istek.prompt}

Apply exactly what the annotations ask, ${m.sadakat === "serbest" ? "adapting the surroundings (light, shadows, reflections, style) so the edit blends naturally" : m.sadakat === "siki" ? "change ONLY the marked areas and keep every other pixel, the framing and the lighting identical" : "keep everything else unchanged"}, and output a clean final image with ALL annotation marks, arrows, outlines and note text completely removed.`;
  // Eskizden görsel: kaba çizimin kompozisyonu korunur, bitmiş görsele dönüştürülür.
  if (islem === "eskiz") talimat = `Turn this rough hand-drawn sketch into a finished, detailed, high-quality image. ${istek.prompt}

Follow the sketch's composition, object placement, proportions and perspective ${m.sadakat === "serbest" ? "loosely, improving it creatively" : m.sadakat === "siki" ? "very closely" : "faithfully"}. Do not keep any sketch lines or paper texture.`;
  if (islem === "zemin-degistir") talimat = `Keep the main subject exactly as is and replace the entire background with: ${istek.prompt}`;
  if (islem === "isik") talimat = `Relight this image: ${istek.prompt}${m.yon && m.yon !== "None" ? `. Main light comes from the ${m.yon.toLowerCase()}` : ""}. Keep the subject, composition and identity unchanged.`;
  if (islem === "arkaplan") talimat = `Remove the background and place the subject on a plain ${m.zemin === "beyaz" || !m.zemin ? "pure white" : m.zemin} background. Keep the subject exactly as is.`;
  const o = { oran: islem === "genislet" ? m.oran : undefined, cozunurluk: m.cozunurluk };
  switch (d.api.saglayici) {
    case "gemini": return gemini(d.api, talimat, g, { ...o, ekGorseller: ek });
    case "openai": return openai(d.api, talimat, g, o);
    case "seedream": return seedream(d.api, talimat, g, o);
    default: return fal(d.api, talimat, g, { ...istek, prompt: talimat, meta: { ...m, oran: o.oran } }, false);
  }
}

/**
 * İstem geliştirici: "Geliştir" açıksa istem zenginleştirilip İngilizceye çevrilir; araç talimatları
 * ve Türkçe istemler (modellerin çoğu Türkçeyi resmî olarak desteklemez) yalnız çevrilir.
 * Yardımcı bağlı değilse ya da hata verirse istem olduğu gibi gider.
 */
async function istemiHazirla(istek: SaglayiciIstek, islem: GorselIslem): Promise<SaglayiciIstek> {
  if (!istemHazir() || islem === "swap-yuz" || islem === "swap-karakter" || islem === "arkaplan" || islem === "giydir" || islem === "sil") return istek;
  const gelistir = !!istek.meta?.gelistir && islem === "uret";
  if (!gelistir && !turkceMi(istek.prompt)) return istek;
  try {
    return { ...istek, prompt: await istemIsle(istek.prompt, gelistir ? "gelistir" : "cevir") };
  } catch {
    return istek;
  }
}

/**
 * Diğer stüdyoların kullandığı adlar (Ruh 2.0, Vayra Photodump…) katalogdaki modele çözülür; bilgi
 * panelinde "→ çözülen model" olarak görünür. Tanınmayan ad gerçek sağlayıcıya gitmez (demo).
 */
const TAKMA_AD: Record<string, string> = {
  "Ruh 2.0": "Vayra Ruh 2.0", "Ruh Sinema": "Vayra Ruh Sinema", "Ruh": "Vayra Ruh",
  "Vayra Moodboard": "Nano Banana 2.1", "Vayra Photodump": "Nano Banana 2.1", "Vayra Instadump": "Nano Banana 2.1", "Vayra Fashion": "Nano Banana Pro",
};
export function katalogCoz(ad: string): GorselModel | undefined {
  const t = gorselModelBul(ad) ?? gorselModelBul(TAKMA_AD[ad.trim()] ?? "");
  if (t) return t;
  if (/nano.?banana/i.test(ad)) return gorselModelBul("Nano Banana 2.1");
  if (/seedream/i.test(ad)) return gorselModelBul("Seedream 5.0 Pro");
  if (/gpt.?image/i.test(ad)) return gorselModelBul("GPT Image 2");
  if (/flux/i.test(ad)) return gorselModelBul("FLUX.2 Pro");
  return undefined;
}

/** Görsel isteğini gerçek sağlayıcıyla çalıştırır; bağlı sağlayıcı yoksa `null`. */
export async function gorselUret(istekHam: SaglayiciIstek): Promise<SaglayiciSonuc | null> {
  const islem = istekHam.meta?.islem ?? "uret";
  const istek = await istemiHazirla(istekHam, islem);
  const m = istek.meta ?? {};
  let s: Sonuc | null;
  let modelAd = istek.model;
  if (islem === "duzenle" || islem === "maske" || islem === "arkaplan" || islem === "genislet" || islem === "sil" || islem === "zemin-degistir" || islem === "isik" || islem === "cizim" || islem === "eskiz") {
    s = await islemCalistir(islem, istek);
  } else {
    let tanim = katalogCoz(istek.model);
    if (istek.model === "Auto") tanim = ilkHazir(["Nano Banana 2.1", "Seedream 5.0 Pro", "GPT Image 2", "FLUX.2 Pro"]);
    if (!tanim || !gorselHazir[tanim.api.saglayici]()) return null;
    modelAd = tanim.ad;
    const api = tanim.api;
    if (tanim.ad === "Vayra Karakter LoRA") {
      // Eğitilmiş LoRA ile üretim: istemdeki tetik kelimesi kişiyi çağırır.
      if (!m.lora?.url || !/^https:\/\//.test(m.lora.url)) throw new Error("Karakterin eğitilmiş LoRA'sı bulunamadı.");
      const [ow, oh] = (m.oran ?? "3:4").split(":").map(Number);
      const r = ow && oh ? ow / oh : 0.75, taban = m.cozunurluk === "2K" ? 1536 : 1024;
      const w = Math.round((r >= 1 ? taban : taban * r) / 16) * 16, h = Math.round((r >= 1 ? taban / r : taban) / 16) * 16;
      const c = await falCalistir(api.model, {
        prompt: istek.prompt, loras: [{ path: m.lora.url, scale: Math.min(1.5, Math.max(0.3, m.lora.olcek ?? 1)) }], image_size: { width: w, height: h },
        num_inference_steps: 28, guidance_scale: 3.5, num_images: 1, output_format: "png", enable_safety_checker: true, ...(Number.isInteger(m.tohum) ? { seed: m.tohum } : {}),
      });
      s = { cikti: c.url, model: api.model, gonderilenIstem: istek.prompt, tohum: c.tohum, genislik: c.genislik, yukseklik: c.yukseklik };
    } else if (islem === "giydir") {
      // Sanal giydirme — fal FASHN v1.6. meta.referanslar: [model fotoğrafı, giysi fotoğrafı]
      const g = await gorselGirdileri(istek, 2);
      if (g.icerik.length < 2) throw new Error("Model ve ürün fotoğrafı gerekli.");
      const gy = m.giysi ?? {};
      const kat = ["tops", "bottoms", "one-pieces", "auto"].includes(gy.kategori ?? "") ? gy.kategori : "auto";
      const foto = ["auto", "model", "flat-lay"].includes(gy.foto ?? "") ? gy.foto : "auto";
      const mod = ["performance", "balanced", "quality"].includes(gy.mod ?? "") ? gy.mod : "balanced";
      const c = await falCalistir(api.model, {
        model_image: g.icerik[0], garment_image: g.icerik[1], category: kat, garment_photo_type: foto, mode: mod,
        num_samples: 1, segmentation_free: true, output_format: "png", ...(Number.isInteger(m.tohum) ? { seed: m.tohum } : {}),
      });
      s = { cikti: c.url, model: api.model, genislik: c.genislik, yukseklik: c.yukseklik };
    } else if (islem === "swap-yuz") {
      const g = await gorselGirdileri(istek, 2);
      if (g.icerik.length < 2) throw new Error("Kaynak yüz ve hedef görsel gerekli.");
      // meta.referanslar: [kaynak yüz, hedef görsel]
      const c = await falCalistir(api.model, { swap_image_url: g.icerik[0], base_image_url: g.icerik[1] });
      s = { cikti: c.url, model: api.model, genislik: c.genislik, yukseklik: c.yukseklik };
    } else if (islem === "swap-karakter") {
      const g = await gorselGirdileri(istek, 2);
      if (g.icerik.length < 2) throw new Error("Kaynak karakter ve hedef görsel gerekli.");
      const talimat = "Replace the person in the second image with the character from the first image. Keep the second image's pose, clothing, scene, framing and lighting; match the first image's face, hair and identity exactly.";
      s = await gemini(api, talimat, g, {});
    } else {
      const g = await gorselGirdileri(istek, api.refMax);
      if (api.refZorunlu && !g.icerik.length) throw new Error(`${tanim.ad} düzenlenecek bir görsel ister — referans ekle.`);
      const negatifAyri = !!api.negatif;
      const istem = gorselIstem(istek, api, g, negatifAyri);
      const o = { oran: m.oran, cozunurluk: m.cozunurluk, kalite: m.kalite, seffaf: m.seffaf };
      switch (api.saglayici) {
        case "gemini": s = await gemini(api, istem, g, o); break;
        case "seedream": s = await seedream(api, istem, g, o); break;
        case "openai": s = await openai(api, istem, g, o); break;
        case "fal": s = await fal(api, istem, g, istek, negatifAyri); break;
      }
    }
  }
  if (!s) return null;
  return {
    ...(s.cikti.startsWith("data:") ? { dataUri: s.cikti } : { ciktiUrl: s.cikti }),
    saglayici: gorselModelBul(modelAd)?.api.saglayici ?? "gorsel",
    gercek: true,
    detay: { model: s.model, vayraModel: modelAd, gonderilenIstem: s.gonderilenIstem, tohum: s.tohum, genislik: s.genislik, yukseklik: s.yukseklik },
  };
}
