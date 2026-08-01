import type { SaglayiciAdapter, SaglayiciIstek, SaglayiciSonuc, UretimTuru } from "./tipler";

/**
 * BytePlus ModelArk — ByteDance modelleri (Çin hesabı olmadan, uluslararası).
 * Seedream 5.0 (görsel) + Seedance 2.0 (video). BYTEPLUS_API_KEY ile Bearer.
 */

const BASE = "https://ark.ap-southeast.bytepluses.com/api/v3";
async function bekle(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function baslik(): Record<string, string> {
  return { Authorization: `Bearer ${process.env.BYTEPLUS_API_KEY}`, "Content-Type": "application/json" };
}

/* ── Seedream 5.0 — görsel ── */
export const seedreamGorselAdapter: SaglayiciAdapter = {
  ad: "seedream",
  hazir() { return Boolean(process.env.BYTEPLUS_API_KEY); },
  destekler(tur: UretimTuru) { return tur === "gorsel"; },
  async uret(istek: SaglayiciIstek): Promise<SaglayiciSonuc> {
    const r = await fetch(`${BASE}/images/generations`, {
      method: "POST", headers: baslik(),
      body: JSON.stringify({
        model: "seedream-5-0-260128",
        prompt: istek.prompt.slice(0, 2000),
        size: "2K", // BytePlus: 1K/2K/4K
      }),
    });
    if (!r.ok) throw new Error(`Seedream ${r.status}: ${(await r.text()).slice(0, 160)}`);
    const d = (await r.json()) as { data?: { url?: string; b64_json?: string }[] };
    const ilk = d.data?.[0];
    if (ilk?.b64_json) return { dataUri: `data:image/png;base64,${ilk.b64_json}`, saglayici: "seedream", gercek: true, detay: { model: "seedream-5-0" } };
    if (ilk?.url) return { ciktiUrl: ilk.url, saglayici: "seedream", gercek: true, detay: { model: "seedream-5-0" } };
    throw new Error("Seedream: çıktı yok");
  },
};

/* ── Seedance 2.0 — video (görev başlat → poll) ── */
export const seedanceVideoAdapter: SaglayiciAdapter = {
  ad: "seedance",
  hazir() { return Boolean(process.env.BYTEPLUS_API_KEY); },
  destekler(tur: UretimTuru) { return tur === "video"; },
  async uret(istek: SaglayiciIstek): Promise<SaglayiciSonuc> {
    // Kısa/ucuz varyant varsayılan; premium için "dreamina-seedance-2-0-260128"
    const model = "dreamina-seedance-2-0-fast-260128";
    const icerik: { type: string; text?: string; image_url?: { url: string } }[] = [{ type: "text", text: istek.prompt.slice(0, 2000) }];
    if (istek.meta?.gorselUrl) icerik.push({ type: "image_url", image_url: { url: istek.meta.gorselUrl } });

    const baslat = await fetch(`${BASE}/contents/generations/tasks`, {
      method: "POST", headers: baslik(),
      body: JSON.stringify({ model, content: icerik }),
    });
    if (!baslat.ok) throw new Error(`Seedance başlat ${baslat.status}: ${(await baslat.text()).slice(0, 160)}`);
    const b = (await baslat.json()) as { id?: string };
    if (!b.id) throw new Error("Seedance: task id yok");

    for (let i = 0; i < 50; i++) {
      await bekle(6000);
      const dur = await fetch(`${BASE}/contents/generations/tasks/${b.id}`, { headers: baslik() });
      const d = (await dur.json()) as { status?: string; content?: { video_url?: string } };
      if (d.status === "succeeded") {
        const url = d.content?.video_url;
        if (!url) throw new Error("Seedance: video URL yok");
        return { ciktiUrl: url, saglayici: "seedance", gercek: true, detay: { model } };
      }
      if (d.status === "failed") throw new Error("Seedance: üretim başarısız");
    }
    throw new Error("Seedance: zaman aşımı");
  },
};
