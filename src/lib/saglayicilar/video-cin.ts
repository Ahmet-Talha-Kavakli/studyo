import type { SaglayiciAdapter, SaglayiciIstek, SaglayiciSonuc, UretimTuru } from "./tipler";

/**
 * Çinli video sağlayıcıları — MiniMax Hailuo + Kling.
 * Her ikisi de uzun-çalışan: görev başlat → poll → çıktı URL.
 */

async function bekle(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

/* ── MiniMax Hailuo (uluslararası endpoint) ── */
export const minimaxVideoAdapter: SaglayiciAdapter = {
  ad: "minimax",
  hazir() { return Boolean(process.env.MINIMAX_API_KEY); },
  destekler(tur: UretimTuru) { return tur === "video"; },
  async uret(istek: SaglayiciIstek): Promise<SaglayiciSonuc> {
    const key = process.env.MINIMAX_API_KEY!;
    const baslik = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
    // 1) Görev oluştur
    const baslat = await fetch("https://api.minimaxi.chat/v1/video_generation", {
      method: "POST", headers: baslik,
      body: JSON.stringify({ model: "MiniMax-Hailuo-2.3", prompt: istek.prompt.slice(0, 2000) }),
    });
    if (!baslat.ok) throw new Error(`MiniMax başlat ${baslat.status}: ${(await baslat.text()).slice(0, 160)}`);
    const b = (await baslat.json()) as { task_id?: string; base_resp?: { status_msg?: string } };
    if (!b.task_id) throw new Error(`MiniMax: ${b.base_resp?.status_msg ?? "task_id yok"}`);
    // 2) Poll
    for (let i = 0; i < 40; i++) {
      await bekle(6000);
      const dur = await fetch(`https://api.minimaxi.chat/v1/query/video_generation?task_id=${b.task_id}`, { headers: baslik });
      const d = (await dur.json()) as { status?: string; file_id?: string };
      if (d.status === "Success" && d.file_id) {
        // 3) file_id → indirilebilir URL
        const dosya = await fetch(`https://api.minimaxi.chat/v1/files/retrieve?file_id=${d.file_id}`, { headers: baslik });
        const f = (await dosya.json()) as { file?: { download_url?: string } };
        const url = f.file?.download_url;
        if (!url) throw new Error("MiniMax: indirme URL yok");
        return { ciktiUrl: url, saglayici: "minimax", gercek: true, detay: { model: "MiniMax-Hailuo-2.3" } };
      }
      if (d.status === "Fail") throw new Error("MiniMax: üretim başarısız");
    }
    throw new Error("MiniMax: zaman aşımı");
  },
};

/* ── Kling (uluslararası/Singapur endpoint, Bearer token) ── */
export const klingVideoAdapter: SaglayiciAdapter = {
  ad: "kling",
  hazir() { return Boolean(process.env.KLING_API_KEY); },
  destekler(tur: UretimTuru) { return tur === "video"; },
  async uret(istek: SaglayiciIstek): Promise<SaglayiciSonuc> {
    const key = process.env.KLING_API_KEY!;
    const baslik = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
    const base = "https://api-singapore.klingai.com/v1/videos/text2video";
    // 1) Görev oluştur
    const baslat = await fetch(base, {
      method: "POST", headers: baslik,
      body: JSON.stringify({
        model_name: "kling-v1",
        prompt: istek.prompt.slice(0, 2000),
        duration: (istek.meta?.sure?.replace(/\D/g, "")) || "5",
        aspect_ratio: istek.meta?.oran ?? "16:9",
      }),
    });
    const bt = await baslat.text();
    if (!baslat.ok) throw new Error(`Kling başlat ${baslat.status}: ${bt.slice(0, 160)}`);
    const b = JSON.parse(bt) as { code?: number; message?: string; data?: { task_id?: string } };
    if (b.code !== 0 || !b.data?.task_id) throw new Error(`Kling: ${b.message ?? "task_id yok"}`);
    const taskId = b.data.task_id;
    // 2) Poll
    for (let i = 0; i < 50; i++) {
      await bekle(6000);
      const dur = await fetch(`${base}/${taskId}`, { headers: baslik });
      const d = (await dur.json()) as { data?: { task_status?: string; task_result?: { videos?: { url?: string }[] } } };
      const st = d.data?.task_status;
      if (st === "succeed") {
        const url = d.data?.task_result?.videos?.[0]?.url;
        if (!url) throw new Error("Kling: video URL yok");
        return { ciktiUrl: url, saglayici: "kling", gercek: true, detay: { model: "kling-v1" } };
      }
      if (st === "failed") throw new Error("Kling: üretim başarısız");
    }
    throw new Error("Kling: zaman aşımı");
  },
};
