/**
 * Job detay verisi — job id'sinden deterministik: input parametreleri, işlem timeline'ı,
 * provider request/response payload, maliyet kırılımı, moderasyon skorları.
 */
import { prng, tohumla, tamsayi, sec, BUGUN } from "../cekirdek";
import type { AdminJob } from "./index";

const USD_TRY = 33;

export interface JobInput {
  prompt: string;
  negatif: string;
  seed: number;
  steps: number;
  cfg: number;
  cozunurluk: string;
  sure: string;
  oran: string;
  fps: number;
}

export function jobInput(j: AdminJob): JobInput {
  const r = prng(tohumla(`jinput-${j.id}`));
  return {
    prompt: j.prompt,
    negatif: sec(r, ["bulanık, düşük kalite", "distorsiyon, artefakt", "—", "watermark, metin"]),
    seed: tamsayi(r, 1, 999999999),
    steps: tamsayi(r, 20, 50),
    cfg: +(3 + r() * 9).toFixed(1),
    cozunurluk: sec(r, ["720p", "1080p", "4K"]),
    sure: j.tur === "video" ? sec(r, ["5sn", "10sn", "15sn"]) : "—",
    oran: sec(r, ["16:9", "9:16", "1:1", "4:3"]),
    fps: j.tur === "video" ? sec(r, [24, 30]) : 0,
  };
}

export interface TimelineAdim {
  ad: string;
  zaman: number;
  sureMs: number;
  durum: "tamam" | "aktif" | "bekliyor" | "hata";
}

export function jobTimeline(j: AdminJob): TimelineAdim[] {
  const bas = j.olusturma;
  const adimlar = ["Oluşturuldu", "Kuyruğa alındı", "Provider'a gönderildi", "İşleniyor", "Tamamlandı"];
  const durumIndex = j.durum === "kuyrukta" ? 1 : j.durum === "isleniyor" ? 3 : j.durum === "hata" ? 3 : 5;
  let t = bas;
  return adimlar.map((ad, i) => {
    const r = prng(tohumla(`jtl-${j.id}-${i}`));
    const sureMs = tamsayi(r, 200, 20000);
    const nokta = t;
    t += sureMs;
    const durum: TimelineAdim["durum"] =
      i < durumIndex ? "tamam" : i === durumIndex ? (j.durum === "hata" ? "hata" : "aktif") : "bekliyor";
    return { ad, zaman: nokta, sureMs, durum };
  });
}

export interface MaliyetKirilim {
  providerUsd: number;
  storageUsd: number;
  alinanKredi: number;
  gelirTry: number;
  maliyetTry: number;
  netMarj: number;
}

export function jobMaliyet(j: AdminJob): MaliyetKirilim {
  const gelirTry = j.kredi * 0.33;
  const maliyetTry = j.maliyetUsd * USD_TRY;
  return {
    providerUsd: j.maliyetUsd,
    storageUsd: +(j.maliyetUsd * 0.08).toFixed(3),
    alinanKredi: j.kredi,
    gelirTry: +gelirTry.toFixed(2),
    maliyetTry: +maliyetTry.toFixed(2),
    netMarj: +(gelirTry - maliyetTry).toFixed(2),
  };
}

/** Provider request/response payload (JSON, debug için). */
export function jobPayload(j: AdminJob): { istek: object; yanit: object } {
  const inp = jobInput(j);
  return {
    istek: {
      model: j.modelId,
      prompt: j.prompt,
      negative_prompt: inp.negatif,
      seed: inp.seed,
      steps: inp.steps,
      guidance_scale: inp.cfg,
      resolution: inp.cozunurluk,
      ...(j.tur === "video" ? { duration: inp.sure, fps: inp.fps } : {}),
    },
    yanit: j.durum === "hata"
      ? { error: j.hataKodu, message: "Provider returned an error", request_id: j.id }
      : { status: "succeeded", output_url: `https://cdn.vayra.ai/${j.id}.${j.tur === "video" ? "mp4" : "png"}`, request_id: j.id, processing_time_ms: j.sureMs },
  };
}

export interface Moderasyon {
  nsfw: number;
  siddet: number;
  unlu: number;
  telif: number;
  sonuc: "temiz" | "flag" | "engellendi";
}

export function jobModerasyon(j: AdminJob): Moderasyon {
  const r = prng(tohumla(`jmod-${j.id}`));
  const telif = +(j.unluEslesme * (r() > 0.9 ? 1 : 0.3)).toFixed(2);
  const enYuksek = Math.max(j.nsfw, j.siddet, j.unluEslesme, telif);
  return {
    nsfw: j.nsfw, siddet: j.siddet, unlu: j.unluEslesme, telif,
    sonuc: enYuksek > 0.8 ? "engellendi" : enYuksek > 0.5 ? "flag" : "temiz",
  };
}

/** Başarısız joblar hata koduna göre gruplu (son 24s). */
export function hataGruplari(joblar: AdminJob[]): { kod: string; sayi: number }[] {
  const esik = BUGUN - 86400000;
  const say = new Map<string, number>();
  for (const j of joblar) if (j.durum === "hata" && j.olusturma > esik && j.hataKodu) say.set(j.hataKodu, (say.get(j.hataKodu) ?? 0) + 1);
  return [...say.entries()].map(([kod, sayi]) => ({ kod, sayi })).sort((a, b) => b.sayi - a.sayi);
}

/** Stuck joblar — 10dk+ işleniyor. */
export function stuckJoblar(joblar: AdminJob[]): AdminJob[] {
  return joblar.filter((j) => j.durum === "isleniyor" && j.sureMs > 600000).slice(0, 20);
}

/** Saatlik generation hacmi — GERÇEK job oluşturma zamanlarından (son 24s, 2'şer saat kova). */
export function saatlikHacim(joblar: AdminJob[]): { etiket: string; deger: number }[] {
  const kovalar = Array(12).fill(0);
  const esik = BUGUN - 86400000;
  for (const j of joblar) {
    if (j.olusturma < esik) continue;
    const saatFark = Math.floor((BUGUN - j.olusturma) / 3600000); // 0-23 saat önce
    const kova = 11 - Math.min(11, Math.floor(saatFark / 2)); // en yeni sağda
    kovalar[kova]++;
  }
  return kovalar.map((deger, i) => ({ etiket: `${(11 - i) * 2}sa`, deger }));
}
