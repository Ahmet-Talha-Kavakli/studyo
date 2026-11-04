import type { SaglayiciAdapter, SaglayiciIstek, SaglayiciSonuc, UretimTuru } from "./tipler";

/**
 * Replicate video adaptörü — gerçek text-to-video (ör. bytedance/seedance, kling).
 * REPLICATE_API_TOKEN + REPLICATE_VIDEO_MODEL tanımlıysa gerçek çağrı yapar ve poll eder.
 */
async function bekle(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export const replicateVideoAdapter: SaglayiciAdapter = {
  ad: "replicate",

  hazir() {
    return Boolean(process.env.REPLICATE_API_TOKEN && process.env.REPLICATE_VIDEO_MODEL);
  },

  destekler(tur: UretimTuru) {
    return tur === "video";
  },

  async uret(istek: SaglayiciIstek): Promise<SaglayiciSonuc> {
    const token = process.env.REPLICATE_API_TOKEN!;
    const modelRef = process.env.REPLICATE_VIDEO_MODEL!; // "owner/model:version"
    const baslik = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    const olustur = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: baslik,
      body: JSON.stringify({
        version: modelRef.includes(":") ? modelRef.split(":")[1] : modelRef,
        input: {
          prompt: istek.prompt.slice(0, 2000),
          aspect_ratio: istek.meta?.oran ?? "16:9",
          duration: Number(istek.meta?.sure?.replace(/\D/g, "")) || 5,
        },
      }),
    });
    if (!olustur.ok) {
      const t = await olustur.text().catch(() => "");
      throw new Error(`Replicate oluştur ${olustur.status}: ${t.slice(0, 200)}`);
    }
    let tahmin = (await olustur.json()) as { id: string; status: string; output?: unknown; urls: { get: string } };

    for (let i = 0; i < 60 && ["starting", "processing"].includes(tahmin.status); i++) {
      await bekle(3000);
      const y = await fetch(tahmin.urls.get, { headers: baslik });
      tahmin = (await y.json()) as typeof tahmin;
    }
    if (tahmin.status !== "succeeded") throw new Error(`Replicate durum: ${tahmin.status}`);

    const cikti = Array.isArray(tahmin.output) ? tahmin.output[0] : tahmin.output;
    return {
      ciktiUrl: typeof cikti === "string" ? cikti : undefined,
      saglayici: "replicate",
      gercek: true,
      detay: { model: modelRef },
    };
  },
};
