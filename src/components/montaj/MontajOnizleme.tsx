"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, ChevronsLeft, ChevronsRight, Maximize2, Repeat, Volume2, VolumeX, Plus, Scan, LayoutTemplate, Sparkles, Type as TypeIcon, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/Tooltip";
import { useMontaj, montajToplamSure, type MontajProje } from "@/store/useMontaj";
import { kareCiz, OLCU, type MedyaHavuzu } from "@/lib/montajMotor";
import { zamanKodu, tumKlipler } from "./ortak";
import { fontlariYukle } from "./fontlar";
import { MontajTuval } from "./MontajTuval";
import { MontajBaglam } from "./MontajBaglam";

/**
 * Önizleme: dışa aktarmayla AYNI çizim fonksiyonu (kareCiz). Canvas kapsayıcıya oranla sığar;
 * cihaz piksel oranıyla keskin çizilir. Oynarken her karede, dururken playhead değişince çizilir.
 */
export function MontajOnizleme({ proje, havuz, dongu, setDongu, sessiz, setSessiz, onMedyaAc, asistan }: {
  proje: MontajProje; havuz: MedyaHavuzu;
  dongu: boolean; setDongu: (v: boolean) => void; sessiz: boolean; setSessiz: (v: boolean) => void;
  onMedyaAc: (panel?: "medya" | "sablon" | "uret" | "yazi") => void;
  /** Önizlemenin altındaki kurgu asistanı kutusu (masaüstü). */
  asistan?: React.ReactNode;
}) {
  const playhead = useMontaj((s) => s.playhead);
  const oynuyor = useMontaj((s) => s.oynuyor);
  useMontaj((s) => s.seciliKlipId); // seçim değişince yeniden çiz (seçili klip animasyonsuz görünür)
  const st = useMontaj.getState;
  const kapRef = useRef<HTMLDivElement>(null);
  const tuvalRef = useRef<HTMLCanvasElement>(null);
  const [kutu, setKutu] = useState({ w: 640, h: 360 });
  const [guvenli, setGuvenli] = useState(false);
  const dikey = proje.enBoy === "9:16" || proje.enBoy === "4:5";
  const toplam = montajToplamSure(proje);
  const [W, H] = OLCU["1080p"][proje.enBoy];
  const bos = toplam <= 0;

  /* Kapsayıcıya oranla sığdır. */
  useEffect(() => {
    const el = kapRef.current; if (!el) return;
    const olc = () => {
      // İç boşluk düşülür: tuval kenarlara yapışmasın (tutamaklar dışa taşabildiği için kırpma artık sınır çizmiyor)
      const cs = getComputedStyle(el);
      const r = { width: el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), height: el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) };
      const o = W / H;
      let w = r.width, h = w / o;
      if (h > r.height) { h = r.height; w = h * o; }
      setKutu({ w: Math.max(80, Math.floor(w)), h: Math.max(45, Math.floor(h)) });
    };
    olc();
    const ro = new ResizeObserver(olc); ro.observe(el);
    return () => ro.disconnect();
  }, [W, H]);

  /* Çizim: playhead ya da proje değişince + medya hazır olunca. */
  const ciz = () => {
    const c = tuvalRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const p = useMontaj.getState().projeler.find((x) => x.id === proje.id); if (!p) return;
    const d = useMontaj.getState();
    kareCiz(ctx, p, d.playhead, c.width, c.height, havuz, d.oynuyor ? null : d.seciliKlipId);
  };
  useEffect(() => {
    const c = tuvalRef.current; if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(kutu.w * dpr); c.height = Math.round(kutu.h * dpr);
    ciz();
  }, [kutu]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { havuz.onHazir = () => { if (!useMontaj.getState().oynuyor) requestAnimationFrame(ciz); }; return () => { havuz.onHazir = null; }; }); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { ciz(); }); // her değişimde (playhead, klip ayarları)
  useEffect(() => { void fontlariYukle().then(() => requestAnimationFrame(ciz)); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const atla = (t: number) => { st().oynatDurdur(false); st().playheadAyarla(Math.max(0, Math.min(toplam, t))); };
  const kare = 1 / proje.fps;
  const tamEkran = () => { void kapRef.current?.parentElement?.requestFullscreen?.().catch(() => {}); };
  const ib = "flex h-9 w-9 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-white/[0.08] hover:text-metin disabled:pointer-events-none disabled:opacity-30";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={kapRef} className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-2 pt-4 lg:px-6">
        <div className="relative rounded-[8px] bg-black" style={{ width: kutu.w, height: kutu.h }}>
          {/* Seçim tutamakları kenardan taşabilsin diye kırpma yalnız tuvalde (tam kadraj klibin köşe ve döndürme tutamakları görünür) */}
          <canvas ref={tuvalRef} className="block h-full w-full rounded-[8px]" style={{ width: kutu.w, height: kutu.h }} aria-label="Montaj önizlemesi" />
          {/* Güvenli alan: dikey platformların arayüzünün kapladığı bölgeler (TikTok · Reels · Shorts) */}
          {guvenli && dikey && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[8px]">
              <div className="absolute inset-x-0 top-0 h-[11%] bg-rose-500/20 ring-1 ring-inset ring-rose-400/50" />
              <div className="absolute inset-x-0 bottom-0 h-[22%] bg-rose-500/20 ring-1 ring-inset ring-rose-400/50" />
              <div className="absolute bottom-[22%] right-0 top-[38%] w-[15%] bg-rose-500/20 ring-1 ring-inset ring-rose-400/50" />
              <span className="absolute left-2 top-[12%] rounded bg-black/70 px-1.5 py-0.5 text-[10.5px] font-medium text-rose-100">Uygulama arayüzü · yazıları buraya koyma</span>
            </div>
          )}
          {!bos && <MontajTuval proje={proje} havuz={havuz} W={kutu.w} H={kutu.h} gw={kutu.w} gh={kutu.h} />}
          {bos && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[8px] bg-[#141517] p-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.085] text-metin"><Upload className="h-5 w-5" /></span>
              <span className="text-[16px] font-semibold text-metin">Montajın burada canlanır</span>
              <span className="max-w-[320px] text-[13px] leading-relaxed text-metin-2">Medya ekle, hazır bir şablonla başla ya da eksik sahneyi AI ile üret.</span>
              <button onClick={() => onMedyaAc("medya")} className="mt-1 flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.97]"><Plus className="h-4 w-4" />Medya ekle</button>
              <div className="flex flex-wrap justify-center gap-1.5">
                {([["sablon", "Şablonla başla", LayoutTemplate], ["uret", "AI ile üret", Sparkles], ["yazi", "Yazıyla başla", TypeIcon]] as const).map(([p, ad, Ik]) => (
                  <button key={p} onClick={() => onMedyaAc(p)} className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.085] px-3 text-[12.5px] text-metin-2 transition hover:bg-white/[0.12] hover:text-metin active:scale-95"><Ik className="h-3.5 w-3.5" />{ad}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {!bos && <MontajBaglam proje={proje} havuzKare={() => {
        const k = tumKlipler(proje).find((x) => x.id === useMontaj.getState().seciliKlipId);
        const v = k ? havuz.videoAl(k) : null;
        if (!v || v.readyState < 2) return null;
        const c = document.createElement("canvas"); c.width = v.videoWidth; c.height = v.videoHeight;
        c.getContext("2d")!.drawImage(v, 0, 0); return c.toDataURL("image/jpeg", 0.9);
      }} />}
      {/* Oynatma çubuğu */}
      <div className="grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 sm:px-4">
        <span className="truncate whitespace-nowrap text-[13px] tabular-nums text-metin">{zamanKodu(playhead, proje.fps)} <span className="text-metin-3 max-sm:hidden">/ {zamanKodu(toplam, proje.fps)}</span></span>
        <div className="flex items-center gap-0.5">
          <Tooltip label="Başa · Home"><button onClick={() => atla(0)} disabled={bos} aria-label="Başa" className={ib}><SkipBack className="h-4 w-4" /></button></Tooltip>
          <span className="hidden sm:contents"><Tooltip label="Bir kare geri · sol ok"><button onClick={() => atla(playhead - kare)} disabled={bos} aria-label="Bir kare geri" className={ib}><ChevronsLeft className="h-4 w-4" /></button></Tooltip></span>
          <button onClick={() => { havuz.sesBaslat(); if (!oynuyor && playhead >= toplam - 0.02) st().playheadAyarla(0); st().oynatDurdur(); }} disabled={bos} aria-label={oynuyor ? "Duraklat" : "Oynat"}
            className="mx-1.5 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0b0c0e] transition-transform hover:scale-105 active:scale-95 disabled:opacity-30">
            {oynuyor ? <Pause className="h-[18px] w-[18px] fill-current" /> : <Play className="h-[18px] w-[18px] translate-x-px fill-current" />}
          </button>
          <span className="hidden sm:contents"><Tooltip label="Bir kare ileri · sağ ok"><button onClick={() => atla(playhead + kare)} disabled={bos} aria-label="Bir kare ileri" className={ib}><ChevronsRight className="h-4 w-4" /></button></Tooltip></span>
          <Tooltip label="Sona · End"><button onClick={() => atla(toplam)} disabled={bos} aria-label="Sona" className={ib}><SkipForward className="h-4 w-4" /></button></Tooltip>
        </div>
        <div className="flex items-center justify-end gap-0.5">
          <span className="hidden sm:contents"><Tooltip label={dongu ? "Döngü açık" : "Döngü kapalı"}><button onClick={() => setDongu(!dongu)} aria-pressed={dongu} aria-label="Döngü" className={cn(ib, dongu && "bg-white/[0.1] text-white")}><Repeat className="h-4 w-4" /></button></Tooltip></span>
          {dikey && <Tooltip label={guvenli ? "Güvenli alanı gizle" : "Güvenli alanı göster (TikTok · Reels · Shorts)"}><button onClick={() => setGuvenli(!guvenli)} aria-pressed={guvenli} aria-label="Güvenli alan" className={cn(ib, guvenli && "bg-white/[0.1] text-white")}><Scan className="h-4 w-4" /></button></Tooltip>}
          <Tooltip label={sessiz ? "Önizleme sesini aç" : "Önizlemeyi sessize al"}><button onClick={() => setSessiz(!sessiz)} aria-pressed={sessiz} aria-label="Ses" className={cn(ib, sessiz && "text-amber-300")}>{sessiz ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button></Tooltip>
          <span className="hidden sm:contents"><Tooltip label="Tam ekran"><button onClick={tamEkran} aria-label="Tam ekran" className={ib}><Maximize2 className="h-4 w-4" /></button></Tooltip></span>
        </div>
      </div>
      {asistan && <div className="flex shrink-0 justify-center px-4 pb-4">{asistan}</div>}
    </div>
  );
}
