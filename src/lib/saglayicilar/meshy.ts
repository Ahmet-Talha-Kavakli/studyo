import type { SaglayiciAdapter, SaglayiciIstek, SaglayiciSonuc, UretimTuru } from "./tipler";

/**
 * Meshy AI 3D üretim adaptörü — gerçek text-to-3D / image-to-3D API.
 * MESHY_API_KEY tanımlıysa gerçek çağrı yapar; task oluşturur ve poll ederek bekler.
 * Sıfır bağımlılık: native fetch.
 */
const TEMEL = "https://api.meshy.ai/openapi";

async function bekle(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export const meshyAdapter: SaglayiciAdapter = {
  ad: "meshy",

  hazir() {
    return Boolean(process.env.MESHY_API_KEY);
  },

  destekler(tur: UretimTuru) {
    return tur === "3d";
  },

  async uret(istek: SaglayiciIstek): Promise<SaglayiciSonuc> {
    const anahtar = process.env.MESHY_API_KEY!;
    const baslik = { Authorization: `Bearer ${anahtar}`, "Content-Type": "application/json" };
    const gorsel = istek.meta?.gorselUrl;

    // image-to-3d veya text-to-3d
    const olusturYol = gorsel ? `${TEMEL}/v1/image-to-3d` : `${TEMEL}/v2/text-to-3d`;
    const govde = gorsel
      ? { image_url: gorsel, enable_pbr: true }
      : { mode: "preview", prompt: istek.prompt.slice(0, 600), art_style: "realistic", should_remesh: true };

    const olustur = await fetch(olusturYol, {
      method: "POST",
      headers: baslik,
      body: JSON.stringify(govde),
    });
    if (!olustur.ok) {
      const t = await olustur.text().catch(() => "");
      throw new Error(`Meshy oluştur ${olustur.status}: ${t.slice(0, 200)}`);
    }
    const { result: taskId } = (await olustur.json()) as { result: string };

    // Poll — 3D üretimi uzun sürer; makul bir tavan koyuyoruz.
    const durumYol = gorsel ? `${TEMEL}/v1/image-to-3d` : `${TEMEL}/v2/text-to-3d`;
    for (let i = 0; i < 40; i++) {
      await bekle(3000);
      const durumYanit = await fetch(`${durumYol}/${taskId}`, { headers: baslik });
      if (!durumYanit.ok) continue;
      const d = (await durumYanit.json()) as {
        status: string;
        progress?: number;
        model_urls?: { glb?: string };
        thumbnail_url?: string;
      };
      if (d.status === "SUCCEEDED") {
        return {
          ciktiUrl: d.model_urls?.glb ?? d.thumbnail_url,
          saglayici: "meshy",
          gercek: true,
          detay: { taskId, thumbnail: d.thumbnail_url, glb: d.model_urls?.glb },
        };
      }
      if (d.status === "FAILED") throw new Error("Meshy task FAILED");
    }
    throw new Error("Meshy zaman aşımı");
  },
};
