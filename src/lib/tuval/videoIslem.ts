"use client";

import { kayitBicimi } from "@/lib/montajMotor";

/**
 * Tarayıcıda video işleme (ücretsiz): klipleri sırayla bir tuvale çizer, seslerini WebAudio ile karıştırır,
 * MediaRecorder ile kaydeder. Kes/hızlandır, birleştir (geçişli) ve videoya ses ekle bu motoru kullanır.
 * Kayıt gerçek zamanlıdır (10 sn'lik klip ≈ 10 sn sürer; hız ayarı süreyi kısaltır).
 */
export type Klip = { url: string; bas?: number; son?: number; hiz?: number };
export type VideoIsAyar = { gecis?: "yok" | "karartma" | "beyaz"; gecisSn?: number; klipSes?: number; ses?: { url: string; seviye?: number; dongu?: boolean }; maksGenislik?: number };

async function blobUrl(url: string) {
  if (url.startsWith("blob:") || url.startsWith("data:")) return url;
  const r = await fetch(url); if (!r.ok) throw new Error("Medya açılamadı");
  return URL.createObjectURL(await r.blob());
}

function videoAc(src: string): Promise<HTMLVideoElement> {
  return new Promise((ok, hata) => {
    const v = document.createElement("video");
    v.preload = "auto"; v.playsInline = true; v.crossOrigin = "anonymous"; v.src = src;
    v.onloadedmetadata = () => ok(v); v.onerror = () => hata(new Error("Video açılamadı"));
  });
}
const ara = (v: HTMLVideoElement, t: number) => new Promise<void>((ok) => { if (Math.abs(v.currentTime - t) < 0.02) return ok(); v.addEventListener("seeked", () => ok(), { once: true }); v.currentTime = t; setTimeout(ok, 3000); });

export async function videoIsle(klipler: Klip[], ayar: VideoIsAyar = {}, iptal?: () => boolean): Promise<{ blob: Blob; mime: string; uzanti: string; sure: number; w: number; h: number }> {
  const bicim = kayitBicimi(); if (!bicim) throw new Error("Bu tarayıcı video kaydını desteklemiyor");
  if (!klipler.length) throw new Error("Klip yok");
  const kaynaklar = await Promise.all(klipler.map((k) => blobUrl(k.url)));
  const videolar = await Promise.all(kaynaklar.map(videoAc));
  const ilk = videolar[0];
  const k0 = Math.min(1, (ayar.maksGenislik ?? 1920) / (ilk.videoWidth || 1280));
  const W = Math.round(((ilk.videoWidth || 1280) * k0) / 2) * 2, H = Math.round(((ilk.videoHeight || 720) * k0) / 2) * 2;
  const tuval = document.createElement("canvas"); tuval.width = W; tuval.height = H;
  const x = tuval.getContext("2d")!;

  const ses = new AudioContext(); const hedef = ses.createMediaStreamDestination();
  const klipKazanc = ses.createGain(); klipKazanc.gain.value = ayar.klipSes ?? 1; klipKazanc.connect(hedef);
  videolar.forEach((v) => { try { ses.createMediaElementSource(v).connect(klipKazanc); } catch { /* sessiz klip */ } });
  let arka: HTMLAudioElement | null = null;
  if (ayar.ses) {
    arka = new Audio(await blobUrl(ayar.ses.url)); arka.crossOrigin = "anonymous"; arka.loop = !!ayar.ses.dongu;
    const g = ses.createGain(); g.gain.value = ayar.ses.seviye ?? 1; ses.createMediaElementSource(arka).connect(g); g.connect(hedef);
  }
  const akis = new MediaStream([...tuval.captureStream(30).getVideoTracks(), ...hedef.stream.getAudioTracks()]);
  const kayit = new MediaRecorder(akis, { mimeType: bicim.mime, videoBitsPerSecond: 8_000_000 });
  const parcalar: Blob[] = []; kayit.ondataavailable = (e) => { if (e.data.size) parcalar.push(e.data); };
  const bitti = new Promise<void>((ok) => { kayit.onstop = () => ok(); });

  const ciz = (v: HTMLVideoElement, perde = 0, renk = "#000") => {
    x.fillStyle = "#000"; x.fillRect(0, 0, W, H);
    const o = Math.min(W / v.videoWidth, H / v.videoHeight); const w = v.videoWidth * o, h = v.videoHeight * o;
    x.drawImage(v, (W - w) / 2, (H - h) / 2, w, h);
    if (perde > 0) { x.globalAlpha = Math.min(1, perde); x.fillStyle = renk; x.fillRect(0, 0, W, H); x.globalAlpha = 1; }
  };

  await ses.resume();
  for (let i = 0; i < videolar.length; i++) await ara(videolar[i], klipler[i].bas ?? 0);
  ciz(videolar[0], ayar.gecis && ayar.gecis !== "yok" ? 1 : 0);
  kayit.start(250);
  if (arka) void arka.play();
  const basZaman = performance.now();
  const gs = ayar.gecis && ayar.gecis !== "yok" ? ayar.gecisSn ?? 0.4 : 0; const gr = ayar.gecis === "beyaz" ? "#fff" : "#000";
  for (let i = 0; i < videolar.length; i++) {
    if (iptal?.()) break;
    const v = videolar[i]; const k = klipler[i];
    const bas = k.bas ?? 0, son = Math.min(k.son ?? v.duration, v.duration || k.son || 0);
    v.playbackRate = Math.min(4, Math.max(0.25, k.hiz ?? 1));
    await v.play().catch(() => { v.muted = true; return v.play(); });
    await new Promise<void>((ok) => {
      const adim = () => {
        if (iptal?.()) return ok();
        const t = v.currentTime;
        const perde = gs ? Math.max(i > 0 || ayar.gecis ? 1 - (t - bas) / gs : 0, i < videolar.length - 1 ? 1 - (son - t) / gs : 0, 0) : 0;
        ciz(v, perde, gr);
        if (t >= son - 0.03 || v.ended) { v.pause(); return ok(); }
        requestAnimationFrame(adim);
      };
      requestAnimationFrame(adim);
    });
  }
  kayit.stop(); arka?.pause();
  await bitti;
  void ses.close();
  kaynaklar.forEach((u, i) => { if (u !== klipler[i].url) URL.revokeObjectURL(u); });
  if (iptal?.()) throw new Error("İptal edildi");
  return { blob: new Blob(parcalar, { type: bicim.mime.split(";")[0] }), mime: bicim.mime, uzanti: bicim.uzanti, sure: (performance.now() - basZaman) / 1000, w: W, h: H };
}
