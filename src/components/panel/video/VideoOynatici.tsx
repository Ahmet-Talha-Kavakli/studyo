"use client";

import { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Uretim } from "@/store/useProjeler";
import { cn, saltUrl } from "@/lib/utils";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";

/**
 * Video oynatıcı + lightbox — Higgsfield Video Studio player: cyan scrubber,
 * ▶/pause, ses, süre, fullscreen. Gerçek videoUrl varsa oynatır; yoksa gradient
 * önizleme + dekoratif oynatma göstergesi.
 */
export function VideoLightbox({ uretim, onKapat }: { uretim: Uretim | null; onKapat: () => void }) {
  useScrollKilit(uretim !== null); // madde 10
  useEscKapat(uretim !== null, onKapat); // Escape ile kapat
  return (
    <AnimatePresence>
      {uretim && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-sm" onClick={onKapat} />
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-6" onClick={onKapat}>
            <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
              <button onClick={onKapat} aria-label="Kapat"
                className="absolute -top-10 right-0 flex h-9 w-9 items-center justify-center rounded-full glass-ikon text-white/80">
                <X className="h-5 w-5" />
              </button>
              <VideoPlayer uretim={uretim} buyuk />
              <div className="mt-3 rounded-xl border border-white/10 bg-ink-900/60 p-4">
                <p className="text-sm font-medium">{uretim.baslik}</p>
                <p className="mt-0.5 text-xs text-white/50">{uretim.prompt}</p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-white/60">
                  <span className="rounded bg-white/8 px-1.5 py-0.5">{uretim.model}</span>
                  {uretim.meta?.cozunurluk && <span className="rounded bg-white/8 px-1.5 py-0.5">◈ {uretim.meta.cozunurluk}</span>}
                  {uretim.meta?.sure && <span className="rounded bg-white/8 px-1.5 py-0.5">⏱ {uretim.meta.sure}</span>}
                  {uretim.meta?.oran && <span className="rounded bg-white/8 px-1.5 py-0.5">▢ {uretim.meta.oran}</span>}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function VideoPlayer({ uretim, buyuk }: { uretim: Uretim; buyuk?: boolean }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [oynuyor, setOynuyor] = useState(false);
  const [sessiz, setSessiz] = useState(true);
  const [ilerleme, setIlerleme] = useState(0);
  const [sure, setSure] = useState(0);
  const [suan, setSuan] = useState(0);

  const gercekVideo = !!uretim.videoUrl;

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const g = () => { setIlerleme(v.duration ? (v.currentTime / v.duration) * 100 : 0); setSuan(v.currentTime); };
    const m = () => setSure(v.duration || 0);
    v.addEventListener("timeupdate", g);
    v.addEventListener("loadedmetadata", m);
    return () => { v.removeEventListener("timeupdate", g); v.removeEventListener("loadedmetadata", m); };
  }, [gercekVideo]);

  const oynatDurdur = () => {
    const v = ref.current;
    if (v) { if (oynuyor) v.pause(); else v.play().catch(() => {}); setOynuyor(!oynuyor); }
    else setOynuyor((o) => !o); // demo modu
  };

  const arananSure = gercekVideo ? sure : 4;
  const arananSuan = gercekVideo ? suan : ilerleme / 100 * 4;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  // Demo modunda dekoratif ilerleme animasyonu.
  useEffect(() => {
    if (gercekVideo || !oynuyor) return;
    const t = setInterval(() => setIlerleme((p) => (p >= 100 ? 0 : p + 2)), 100);
    return () => clearInterval(t);
  }, [oynuyor, gercekVideo]);

  // gorselUrl artık ham URL, onizlemeArka CSS'i veya düz gradyan olabilir.
  // saltUrl ile poster/<img> için temiz URL çıkar; yoksa CSS'i arka plan olarak bırak.
  const posterUrl = saltUrl(uretim.gorselUrl);
  const arkaPlan = !posterUrl && uretim.gorselUrl ? uretim.gorselUrl : undefined;

  return (
    <div className={cn("group relative overflow-hidden rounded-2xl bg-ink-950", buyuk ? "aspect-video" : "aspect-video")}
      style={arkaPlan ? { background: arkaPlan } : posterUrl ? { background: `url("${posterUrl}") center/cover no-repeat` } : undefined}>
      {gercekVideo ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video ref={ref} src={uretim.videoUrl} muted={sessiz} loop playsInline
          className="h-full w-full object-cover" poster={posterUrl} />
      ) : null}

      {/* Orta oynat butonu */}
      <button onClick={oynatDurdur} aria-label={oynuyor ? "Durdur" : "Oynat"}
        className={cn("absolute inset-0 flex items-center justify-center transition-opacity", oynuyor && gercekVideo ? "opacity-0 group-hover:opacity-100" : "opacity-100")}>
        <span className="flex h-14 w-14 items-center justify-center rounded-full glass-ikon text-white  transition-transform hover:scale-110">
          {oynuyor ? <Pause className="h-6 w-6" /> : <Play className="ml-0.5 h-6 w-6" />}
        </span>
      </button>

      {/* Alt kontrol barı */}
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-2.5 bg-gradient-to-t from-ink-950/80 to-transparent px-3 pb-2.5 pt-6 opacity-0 transition-opacity group-hover:opacity-100">
        <button onClick={oynatDurdur} className="text-white/90 hover:text-white">{oynuyor ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-cyan-glow transition-all" style={{ width: `${ilerleme}%` }} />
        </div>
        <span className="font-mono text-[11px] text-white/80">{fmt(arananSuan)} / {fmt(arananSure)}</span>
        <button onClick={() => { setSessiz((s) => !s); if (ref.current) ref.current.muted = !sessiz; }} className="text-white/90 hover:text-white">
          {sessiz ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <button onClick={() => ref.current?.requestFullscreen?.()} className="text-white/90 hover:text-white"><Maximize2 className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
