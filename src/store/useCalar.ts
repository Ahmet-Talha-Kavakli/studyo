"use client";

import { create } from "zustand";
import { bestele, type BesteAyar } from "@/lib/muzikMotoru";

/**
 * Global kalıcı müzik çalar — tek AudioContext, sayfa gezerken durmaz.
 * Bir şarkı ayarını (BesteAyar) alır, motorla sentezler (cache'li), gerçek
 * AudioBufferSourceNode ile çalar. Konum/oynatma durumu store'da; sabit alt
 * player barı ve tüm çalar butonları bunu paylaşır. Zustand — SSR güvenli
 * (AudioContext yalnızca tarayıcıda, ilk oynatmada kurulur).
 */

export interface CalarSarki {
  id: string;
  baslik: string;
  ayar: BesteAyar;
  renk?: string;
  kapak?: string; // css background / url
}

interface CalarState {
  aktif: CalarSarki | null;
  caliyor: boolean;
  konum: number;   // saniye
  sure: number;    // saniye
  ses: number;     // 0..1
  tekrar: boolean; // parça bitince baştan çal (loop)
  cal: (s: CalarSarki) => void;
  duraklat: () => void;
  devam: () => void;
  calDurdur: () => void;
  seek: (saniye: number) => void;
  sesAyarla: (v: number) => void;
  tekrarAyarla: (v: boolean) => void;
  kapat: () => void;
}

// Tarayıcı-yalnız audio durumu (store dışında, tekil).
let ctx: AudioContext | null = null;
let gainNode: GainNode | null = null;
let kaynak: AudioBufferSourceNode | null = null;
let buffer: AudioBuffer | null = null;
let baslangicCtxAn = 0;    // ctx.currentTime oynatma başında
let baslangicKonum = 0;    // buffer içindeki offset
let raf = 0;
const bufferCache = new Map<string, AudioBuffer>();

function ctxAl(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
  }
  return ctx;
}

function bufferAl(s: CalarSarki): AudioBuffer | null {
  const c = ctxAl();
  if (!c) return null;
  const anahtar = `${s.ayar.tohum}|${s.ayar.bpm}|${s.ayar.key}|${s.ayar.minor}|${Math.round(s.ayar.sure)}|${s.ayar.enstrumantal}|${(s.ayar.stemler || []).join(",")}`;
  const onbellek = bufferCache.get(anahtar);
  if (onbellek) return onbellek;
  const { sol, sag, sr } = bestele(s.ayar);
  const buf = c.createBuffer(2, sol.length, sr);
  buf.copyToChannel(sol, 0);
  buf.copyToChannel(sag, 1);
  if (bufferCache.size > 24) bufferCache.clear(); // bellek koru
  bufferCache.set(anahtar, buf);
  return buf;
}

export const useCalar = create<CalarState>((set, get) => {
  const tik = () => {
    if (!ctx || !get().caliyor) return;
    const konum = baslangicKonum + (ctx.currentTime - baslangicCtxAn);
    const sure = buffer?.duration ?? get().sure;
    if (konum >= sure) { get().calDurdur(); return; }
    set({ konum });
    raf = requestAnimationFrame(tik);
  };

  const oynat = (offset: number) => {
    const c = ctxAl();
    if (!c || !buffer || !gainNode) return;
    if (c.state === "suspended") c.resume();
    if (kaynak) { try { kaynak.onended = null; kaynak.stop(); } catch {} kaynak = null; }
    kaynak = c.createBufferSource();
    kaynak.buffer = buffer;
    kaynak.connect(gainNode);
    kaynak.onended = () => {
      // Doğal bitiş (durdurma değil) → tekrar açıksa baştan çal, değilse başa sar & durdur.
      if (get().caliyor && baslangicKonum + (c.currentTime - baslangicCtxAn) >= (buffer?.duration ?? 0) - 0.05) {
        if (get().tekrar) {
          set({ konum: 0 });
          oynat(0); // loop
        } else {
          set({ caliyor: false, konum: 0 });
          baslangicKonum = 0;
        }
      }
    };
    baslangicCtxAn = c.currentTime;
    baslangicKonum = offset;
    kaynak.start(0, offset);
    set({ caliyor: true });
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tik);
  };

  const durdurKaynak = () => {
    if (kaynak) { try { kaynak.onended = null; kaynak.stop(); } catch {} kaynak = null; }
    cancelAnimationFrame(raf);
  };

  return {
    aktif: null,
    caliyor: false,
    konum: 0,
    sure: 0,
    ses: 0.85,
    tekrar: false,

    cal: (s) => {
      const c = ctxAl();
      if (!c) return;
      buffer = bufferAl(s);
      if (gainNode) gainNode.gain.value = get().ses;
      set({ aktif: s, konum: 0, sure: buffer?.duration ?? s.ayar.sure });
      oynat(0);
    },
    duraklat: () => { durdurKaynak(); set({ caliyor: false }); },
    devam: () => { if (get().aktif && buffer) oynat(get().konum); },
    calDurdur: () => { durdurKaynak(); set({ caliyor: false, konum: 0 }); baslangicKonum = 0; },
    seek: (saniye) => {
      const sure = get().sure;
      const k = Math.max(0, Math.min(sure, saniye));
      set({ konum: k });
      if (get().caliyor) oynat(k); else baslangicKonum = k;
    },
    sesAyarla: (v) => { const vv = Math.max(0, Math.min(1, v)); if (gainNode) gainNode.gain.value = vv; set({ ses: vv }); },
    tekrarAyarla: (v) => set({ tekrar: v }),
    kapat: () => { durdurKaynak(); set({ aktif: null, caliyor: false, konum: 0 }); },
  };
});
