import type { SaglayiciAdapter, SaglayiciIstek, SaglayiciSonuc, UretimTuru } from "./tipler";

/**
 * Google Gemini adaptörü — GÖRSEL (gemini image) + VİDEO (Veo).
 * GEMINI_API_KEY ile çalışır. Site görsel motoruyla aynı anahtar, aynı canlı reçete.
 */

const BASE = "https://generativelanguage.googleapis.com/v1beta";

/* Higgsfield-seviye canlılık reçetesi (görsel). */
function gorselRecete(prompt: string, oran?: string): string {
  const o = { "9:16": "vertical 9:16", "16:9": "horizontal 16:9 cinematic widescreen", "1:1": "square 1:1", "4:3": "horizontal 4:3", "3:4": "vertical 3:4 portrait" }[oran ?? "1:1"] ?? "square 1:1";
  return `A hyper-realistic, cinematic, vividly alive image. ${o} aspect ratio. ${prompt}. Professional cinema camera, rich cinematic color grade, subtle film grain, dramatic natural lighting, high dynamic range, lifelike texture, premium editorial quality — never flat, never dead, never generic stock.`;
}

async function bekle(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

export const geminiGorselAdapter: SaglayiciAdapter = {
  ad: "gemini",
  hazir() { return Boolean(process.env.GEMINI_API_KEY); },
  destekler(tur: UretimTuru) { return tur === "gorsel"; },
  async uret(istek: SaglayiciIstek): Promise<SaglayiciSonuc> {
    const key = process.env.GEMINI_API_KEY!;
    const model = "gemini-3-pro-image"; // en kaliteli; hız gerekirse gemini-3.1-flash-image
    const r = await fetch(`${BASE}/models/${model}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: gorselRecete(istek.prompt, istek.meta?.oran) }] }],
        generationConfig: { responseModalities: ["IMAGE"] },
      }),
    });
    if (!r.ok) throw new Error(`Gemini görsel ${r.status}: ${(await r.text()).slice(0, 180)}`);
    const d = (await r.json()) as { candidates?: { content?: { parts?: { inlineData?: { data: string; mimeType?: string } }[] } }[] };
    const part = d.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    if (!part?.inlineData) throw new Error("Gemini görsel: çıktı yok");
    return {
      dataUri: `data:${part.inlineData.mimeType ?? "image/png"};base64,${part.inlineData.data}`,
      saglayici: "gemini",
      gercek: true,
      detay: { model },
    };
  },
};

/**
 * Veo video adaptörü — Google Veo 3.1 (Gemini API üzerinden).
 * Uzun süren üretim: predict-long-running → poll.
 */
export const veoVideoAdapter: SaglayiciAdapter = {
  ad: "veo",
  hazir() { return Boolean(process.env.GEMINI_API_KEY); },
  destekler(tur: UretimTuru) { return tur === "video"; },
  async uret(istek: SaglayiciIstek): Promise<SaglayiciSonuc> {
    const key = process.env.GEMINI_API_KEY!;
    const model = "veo-3.1-generate-preview";
    // 1) Uzun-çalışan operasyon başlat
    const baslat = await fetch(`${BASE}/models/${model}:predictLongRunning?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: istek.prompt.slice(0, 2000) }],
        parameters: { aspectRatio: istek.meta?.oran ?? "16:9" },
      }),
    });
    if (!baslat.ok) throw new Error(`Veo başlat ${baslat.status}: ${(await baslat.text()).slice(0, 180)}`);
    const op = (await baslat.json()) as { name: string };
    // 2) Poll (video üretimi 1-3dk sürebilir)
    for (let i = 0; i < 40; i++) {
      await bekle(6000);
      const dur = await fetch(`${BASE}/${op.name}?key=${key}`);
      const d = (await dur.json()) as { done?: boolean; response?: { generateVideoResponse?: { generatedSamples?: { video?: { uri?: string } }[] } }; error?: { message?: string } };
      if (d.error) throw new Error(`Veo: ${d.error.message}`);
      if (d.done) {
        const uri = d.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
        if (!uri) throw new Error("Veo: video URI yok");
        return { ciktiUrl: `${uri}&key=${key}`, saglayici: "veo", gercek: true, detay: { model } };
      }
    }
    throw new Error("Veo: zaman aşımı");
  },
};
