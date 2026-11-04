"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { MedyaHavuzu, kareCiz, OLCU } from "@/lib/montajMotor";
import { montajToplamSure, type MontajProje } from "@/store/useMontaj";
import { fontlariYukle } from "@/components/montaj/fontlar";
import { kisaSure } from "@/components/montaj/ortak";

export type OynaticiTutamak = { git: (t: number) => void; oynat: () => void; durdur: () => void };

/**
 * Explainer önizleme oynatıcısı: derlenen montaj projesini tuvalde gerçek zamanlı çizer
 * (dışa aktarmayla aynı motor). Alt şerit sahne bölümlerini gösterir; tıklayınca o sahneye gider.
 */
export const ExOynatici = forwardRef<OynaticiTutamak, {
  proje: MontajProje; anlar: number[]; basliklar: string[]; secili: number; onSahne: (i: number) => void; sinif?: string;
  /** Bölüm rengi (çok parçalı şeritte gruplamayı gösterir). */
  renkler?: string[];
  /** İnce çubuk: sahne adları yerine yalnız ilerleme ve sahne sınırları (dışarıda ayrı bir sahne şeridi varken). */
  ince?: boolean;
  /** Sol üstteki sayaç etiketi (varsayılan "Sahne"). */
  etiket?: string;
  /** İnce çubukta çentik konumları (verilmezse her sahne sınırı; çok sahnede kesik çizgi gibi durmasın diye yalnız bölüm sınırları verilebilir). */
  kesitler?: number[];
  /** Her karede oynatma anı (state değil; dışarıda doğrudan style güncellemek için). */
  onZaman?: (t: number) => void;
}>(function ExOynatici({ proje, anlar, basliklar, secili, onSahne, sinif, renkler, ince, etiket = "Sahne", kesitler, onZaman }, ref) {
  const havuz = useMemo(() => new MedyaHavuzu(true), []);
  const tuvalRef = useRef<HTMLCanvasElement>(null);
  const kapRef = useRef<HTMLDivElement>(null);
  const [t, setT] = useState(0);
  const tRef = useRef(0);
  const [oynuyor, setOynuyor] = useState(false);
  const [sessiz, setSessiz] = useState(false);
  const [dongu, setDongu] = useState(false);
  const [kutu, setKutu] = useState({ w: 640, h: 360 });
  const toplam = montajToplamSure(proje);
  const [W, H] = OLCU["1080p"][proje.enBoy];
  const projeRef = useRef(proje); projeRef.current = proje;
  const zamanRef = useRef(onZaman); zamanRef.current = onZaman;
  // Bir dakikayı geçen projede iki taraf da dk:sn (0 sn / 3:20 karışık durmasın)
  const sure = (x: number) => (toplam >= 60 ? `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, "0")}` : kisaSure(x));

  useEffect(() => () => havuz.kapat(), [havuz]);
  useEffect(() => { havuz.anaSes(sessiz ? 0 : 1); }, [sessiz, havuz]);

  /* Kutuyu orana sığdır */
  useEffect(() => {
    const el = kapRef.current; if (!el) return;
    const olc = () => { const r = el.getBoundingClientRect(); const o = W / H; let w = r.width, h = w / o; if (h > r.height) { h = r.height; w = h * o; } setKutu({ w: Math.max(120, Math.floor(w)), h: Math.max(68, Math.floor(h)) }); };
    olc(); const ro = new ResizeObserver(olc); ro.observe(el); return () => ro.disconnect();
  }, [W, H]);

  const ciz = () => {
    const c = tuvalRef.current; const ctx = c?.getContext("2d"); if (!c || !ctx) return;
    kareCiz(ctx, projeRef.current, tRef.current, c.width, c.height, havuz);
  };
  useEffect(() => { havuz.onHazir = () => { if (!oynuyor) requestAnimationFrame(ciz); }; return () => { havuz.onHazir = null; }; }); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const c = tuvalRef.current; if (!c) return; const dpr = Math.min(2, window.devicePixelRatio || 1); c.width = Math.round(kutu.w * dpr); c.height = Math.round(kutu.h * dpr); ciz(); }, [kutu]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { void fontlariYukle().then(() => requestAnimationFrame(ciz)); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  /* Proje değişince (metin, görsel…) yeniden çiz ve medyayı senkronla */
  useEffect(() => { havuz.senkronla(proje, tRef.current, oynuyor); ciz(); }, [proje]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Oynatma döngüsü */
  useEffect(() => {
    if (!oynuyor) { havuz.senkronla(projeRef.current, tRef.current, false); return; }
    havuz.sesBaslat();
    let son = performance.now(), ram = 0;
    const tik = (n: number) => {
      const dt = (n - son) / 1000; son = n;
      let yeni = tRef.current + dt;
      if (yeni >= toplam) { if (dongu) yeni = 0; else { /* bitince kararmış son karede kalmasın: başa dön */ const b = Math.min(toplam, 0.8); tRef.current = b; setT(b); zamanRef.current?.(b); setOynuyor(false); havuz.senkronla(projeRef.current, b, false); ciz(); return; } }
      tRef.current = yeni; setT(yeni); zamanRef.current?.(yeni);
      havuz.senkronla(projeRef.current, yeni, true); ciz();
      ram = requestAnimationFrame(tik);
    };
    ram = requestAnimationFrame(tik);
    return () => cancelAnimationFrame(ram);
  }, [oynuyor, toplam, dongu]); // eslint-disable-line react-hooks/exhaustive-deps

  const git = (yeni: number) => { tRef.current = Math.max(0, Math.min(toplam, yeni)); setT(tRef.current); zamanRef.current?.(tRef.current); havuz.senkronla(projeRef.current, tRef.current, oynuyor); ciz(); };
  useImperativeHandle(ref, () => ({ git, oynat: () => { havuz.sesBaslat(); setOynuyor(true); }, durdur: () => setOynuyor(false) }));

  /* Oynarken aktif sahneyi bildir */
  const aktif = anlar.reduce((a, s, i) => (t >= s - 0.001 ? i : a), 0);
  useEffect(() => { if (oynuyor && aktif !== secili) onSahne(aktif); }, [aktif, oynuyor]); // eslint-disable-line react-hooks/exhaustive-deps

  const oynatDurdur = () => { havuz.sesBaslat(); if (!oynuyor && t >= toplam - 0.05) git(0); setOynuyor((v) => !v); };
  const seritRef = useRef<HTMLDivElement>(null);
  const seritGit = (e: React.PointerEvent) => {
    const el = seritRef.current; if (!el) return;
    const ayarla = (x: number) => { const r = el.getBoundingClientRect(); git(((x - r.left) / r.width) * toplam); };
    ayarla(e.clientX);
    const tasi = (ev: PointerEvent) => ayarla(ev.clientX);
    const birak = () => { window.removeEventListener("pointermove", tasi); window.removeEventListener("pointerup", birak); };
    window.addEventListener("pointermove", tasi); window.addEventListener("pointerup", birak);
  };
  const ib = "flex h-9 w-9 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-white/[0.08] hover:text-metin";

  return (
    <div className={cn("flex min-h-0 flex-col", sinif)}>
      <div ref={kapRef} className="relative flex min-h-0 flex-1 items-center justify-center">
        <div className="group relative overflow-hidden rounded-[10px] bg-black ring-1 ring-white/[0.08]" style={{ width: kutu.w, height: kutu.h }}>
          <canvas ref={tuvalRef} className="block h-full w-full" style={{ width: kutu.w, height: kutu.h }} onClick={oynatDurdur} aria-label="Explainer önizlemesi" />
          {!oynuyor && (
            <button onClick={oynatDurdur} aria-label="Oynat" className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white opacity-0 ring-1 ring-white/25 backdrop-blur-md transition-all hover:scale-105 focus-visible:opacity-100 group-hover:opacity-100">
              <Play className="ml-0.5 h-6 w-6 fill-current" />
            </button>
          )}
          {etiket && anlar.length > 1 && <span className="pointer-events-none absolute left-2.5 top-2.5 rounded-full bg-black/55 px-2 py-0.5 text-[11.5px] font-medium text-white/90 backdrop-blur">{etiket} {aktif + 1}/{anlar.length}</span>}
        </div>
      </div>
      {/* Sahne şeridi + oynatma çubuğu */}
      <div className="mt-3 shrink-0">
        {ince ? (
          <div ref={seritRef} onPointerDown={seritGit} className="group/s relative flex h-4 cursor-pointer items-center" role="slider" aria-label="Zaman" aria-valuemin={0} aria-valuemax={Math.round(toplam)} aria-valuenow={Math.round(t)}>
            <span className="absolute inset-x-0 h-1 rounded-full bg-white/[0.12] transition-[height] group-hover/s:h-1.5" />
            <span className="absolute left-0 h-1 rounded-full bg-white transition-[height] group-hover/s:h-1.5" style={{ width: `${(t / Math.max(0.01, toplam)) * 100}%` }} />
            {(kesitler ?? anlar.slice(1)).filter((s) => s > 0.01).map((s) => <span key={s} className="absolute h-2.5 w-[2px] -translate-x-1/2 rounded-full bg-[#111214]" style={{ left: `${(s / Math.max(0.01, toplam)) * 100}%` }} />)}
            <span className="absolute h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-white" style={{ left: `${(t / Math.max(0.01, toplam)) * 100}%` }} />
          </div>
        ) : (
        <div ref={seritRef} onPointerDown={seritGit} className={cn("relative flex h-7 cursor-pointer", anlar.length > 24 ? "gap-px" : "gap-[3px]")} role="slider" aria-label="Zaman" aria-valuemin={0} aria-valuemax={Math.round(toplam)} aria-valuenow={Math.round(t)}>
          {anlar.map((s, i) => {
            const son = anlar[i + 1] ?? toplam, gen = ((son - s) / Math.max(0.01, toplam)) * 100;
            const dolu = Math.max(0, Math.min(1, (t - s) / Math.max(0.01, son - s)));
            return (
              <div key={i} title={`${i + 1}. ${basliklar[i] ?? ""}`} onDoubleClick={() => { git(s); onSahne(i); }}
                className={cn("relative h-full overflow-hidden transition-colors", anlar.length > 24 ? "rounded-[3px]" : "rounded-md", i === secili ? "bg-white/15 ring-1 ring-inset ring-white/50" : "bg-white/[0.06] hover:bg-white/[0.1]")} style={{ width: `${gen}%` }}>
                {renkler?.[i] && <span className="absolute inset-x-0 bottom-0 h-[3px]" style={{ background: renkler[i] }} />}
                <span className="absolute inset-y-0 left-0 bg-white/25" style={{ width: `${dolu * 100}%` }} />
                {anlar.length <= 24 && gen > 3.2 && <span className="relative block truncate px-1.5 pt-[5px] text-[10px] font-semibold text-metin-2">{gen > 7 && basliklar[i] ? `${i + 1}. ${basliklar[i]}` : i + 1}</span>}
              </div>
            );
          })}
          <span className="pointer-events-none absolute -bottom-1 -top-1 w-0.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]" style={{ left: `${(t / Math.max(0.01, toplam)) * 100}%` }} />
        </div>
        )}
        <div className="mt-2 flex items-center gap-1">
          <button onClick={() => { const i = Math.max(0, aktif - (t - anlar[aktif] < 0.6 ? 1 : 0)); git(anlar[i] ?? 0); onSahne(i); }} aria-label="Önceki sahne" className={ib}><SkipBack className="h-4 w-4" /></button>
          <button onClick={oynatDurdur} aria-label={oynuyor ? "Duraklat" : "Oynat"} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0b0c0e] transition-transform hover:scale-105">{oynuyor ? <Pause className="h-[18px] w-[18px] fill-current" /> : <Play className="ml-0.5 h-[18px] w-[18px] fill-current" />}</button>
          <button onClick={() => { const i = Math.min(anlar.length - 1, aktif + 1); git(anlar[i] ?? 0); onSahne(i); }} aria-label="Sonraki sahne" className={ib}><SkipForward className="h-4 w-4" /></button>
          <span className="ml-2 text-[13px] font-medium tabular-nums text-metin">{sure(t)} <span className="text-metin-3">/ {sure(toplam)}</span></span>
          <span className="ml-auto flex items-center gap-0.5">
            <button onClick={() => setDongu((v) => !v)} aria-pressed={dongu} aria-label="Döngü" className={cn(ib, dongu && "text-metin bg-white/[0.08]")}><Repeat className="h-4 w-4" /></button>
            <button onClick={() => setSessiz((v) => !v)} aria-label={sessiz ? "Sesi aç" : "Sessize al"} className={ib}>{sessiz ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>
            <button onClick={() => void kapRef.current?.requestFullscreen?.().catch(() => {})} aria-label="Tam ekran" className={ib}><Maximize2 className="h-4 w-4" /></button>
          </span>
        </div>
      </div>
    </div>
  );
});
