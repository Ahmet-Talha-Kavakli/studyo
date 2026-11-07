"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Heart, Star, Quote, Maximize2, Pause, Play, Repeat, SkipBack, SkipForward, Volume2, VolumeX, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { Rozet } from "@/components/studyo/hf";
import { sureBicim, type Parca } from "@/store/useMuzik";
import { sesCalici, useCalici } from "@/lib/sesCalici";
import { CalanCubuklar, Kapak } from "./ortak";
import { modelKisa, parcaCal } from "./ParcaSatiri";

const ikonDugme = "bg-white/[0.075] ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-metin-2 transition-colors hover:text-metin disabled:opacity-30";

/**
 * Çalar çubuğu: kapak + ad + model çipi, önceki / çal / sonraki, klavyeyle sarılabilen
 * ilerleme, ses düzeyi, tekrar, beğen, indir, aç. Kısayollar (bir alan odakta değilken):
 * Boşluk oynat/duraklat · ←/→ 5 sn · J/K önceki/sonraki.
 */
export function MuzikCubugu({ liste, onAc, onIndir, onBegen, tekrar, onTekrar }: {
  liste: Parca[]; onAc: (id: string) => void; onIndir: (p: Parca) => void; onBegen: (p: Parca) => void; tekrar: boolean; onTekrar: () => void;
}) {
  const cal = useCalici();
  const p = cal.id ? liste.find((x) => x.id === cal.id) : undefined;
  const i = p ? liste.findIndex((x) => x.id === p.id) : -1;
  const oran = cal.toplam ? Math.min(1, cal.an / cal.toplam) : 0;
  const git = (y: 1 | -1) => { const n = liste[i + y]; if (n) void parcaCal(n); };

  // Parça bitince: tekrar açıksa baştan, değilse sıradaki.
  useEffect(() => {
    if (!p || !cal.bitis) return;
    const t = setTimeout(() => { if (tekrar) void parcaCal(p); else if (liste[i + 1]) void parcaCal(liste[i + 1]); }, 250);
    return () => clearTimeout(t);
    // yalnız bitiş olayında
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cal.bitis]);

  useEffect(() => {
    const tus = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (!p || e.defaultPrevented || t.closest("input, textarea, select, button, a, [role=slider], [contenteditable=true]") || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === " ") { e.preventDefault(); void parcaCal(p); }
      else if (e.key === "ArrowRight") sesCalici.atla(5);
      else if (e.key === "ArrowLeft") sesCalici.atla(-5);
      else if (e.key.toLowerCase() === "k") git(1);
      else if (e.key.toLowerCase() === "j") git(-1);
    };
    window.addEventListener("keydown", tus);
    return () => window.removeEventListener("keydown", tus);
  });

  const ilerlemeTus = (e: React.KeyboardEvent) => {
    if (!cal.toplam) return;
    const y = e.key === "ArrowRight" || e.key === "ArrowUp" ? cal.an + 5 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? cal.an - 5
      : e.key === "Home" ? 0 : e.key === "End" ? cal.toplam - 0.5 : null;
    if (y === null) return;
    e.preventDefault(); e.stopPropagation(); sesCalici.konum(y);
  };

  return (
    <AnimatePresence>
      {p && (
        <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0, transition: { duration: 0.15 } }} transition={{ type: "spring", stiffness: 420, damping: 36 }}
          className="sticky bottom-0 z-30 mt-auto px-2 pb-2 pt-2" role="region" aria-label="Müzik çalar">
          <div className="relative flex items-center gap-3 overflow-hidden border-t border-white/[0.06] bg-[#141517] px-3 py-2 sm:gap-4">
            {/* Mobilde ilerleme kartın üst kenarında ince çizgi */}
            <span className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-white/[0.065] sm:hidden"><span className="block h-full bg-aksan" style={{ width: `${oran * 100}%` }} /></span>

            <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:max-w-[34%] sm:flex-none lg:w-[30%]">
              <button onClick={() => onAc(p.id)} title="Ayrıntıyı aç" className="relative shrink-0 rounded-xl">
                <Kapak src={p.kapak} boyut={44} yuvarlak={11} aktif={cal.calisiyor} />
                
              </button>
              <button onClick={() => onAc(p.id)} className="min-w-0 text-left">
                <span className="flex items-center gap-1.5">
                  {cal.calisiyor && <CalanCubuklar className="shrink-0" />}
                  <span className="truncate text-[13.5px] font-semibold text-metin">{p.ad}</span>
                </span>
                <span className="mt-0.5 flex items-center gap-1">
                  {p.sesUrl
                    ? <span className="bg-white/[0.075] inline-flex items-center gap-1 rounded-md px-1.5 py-px text-[10.5px] font-medium text-metin-2"><ModelLogo ad={p.model} boyut={11} />{modelKisa(p.model)}</span>
                    : <span className="truncate text-[10.5px] text-metin-3">{modelKisa(p.model)}</span>}
                </span>
              </button>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:hidden">
              <button onClick={() => void parcaCal(p)} aria-label={cal.calisiyor ? "Duraklat" : "Oynat"} className="flex h-10 w-10 items-center justify-center rounded-full bg-aksan text-zemin">
                {cal.calisiyor ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
              </button>
              <button onClick={() => git(1)} disabled={i < 0 || i >= liste.length - 1} aria-label="Sonraki parça" className={ikonDugme}><SkipForward className="h-3.5 w-3.5 fill-current" /></button>
            </div>

            <div className="hidden min-w-0 flex-1 flex-col items-center gap-1 sm:flex">
              <div className="flex items-center gap-2">
                <button onClick={onTekrar} aria-pressed={tekrar} aria-label="Tekrarla" title="Tekrarla" className={cn(ikonDugme, tekrar && "text-aksan ring-1 ring-aksan")}><Repeat className="h-3.5 w-3.5" /></button>
                <button onClick={() => git(-1)} disabled={i <= 0} aria-label="Önceki parça (J)" className={ikonDugme}><SkipBack className="h-3.5 w-3.5 fill-current" /></button>
                <button onClick={() => void parcaCal(p)} aria-label={cal.calisiyor ? "Duraklat" : "Oynat"}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-aksan text-zemin transition-transform hover:scale-105">
                  {cal.calisiyor ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
                </button>
                <button onClick={() => git(1)} disabled={i < 0 || i >= liste.length - 1} aria-label="Sonraki parça (K)" className={ikonDugme}><SkipForward className="h-3.5 w-3.5 fill-current" /></button>
                <button onClick={() => onBegen(p)} aria-pressed={p.begeni === 1} title={p.begeni === 1 ? "Favorilerden çıkar" : "Favorilere ekle"} aria-label={p.begeni === 1 ? "Favorilerden çıkar" : "Favorilere ekle"} className={cn(ikonDugme, p.begeni === 1 && "!text-aksan")}>
                  <Star className={cn("h-3.5 w-3.5", p.begeni === 1 && "fill-current")} />
                </button>
              </div>
              <div className="flex w-full max-w-xl items-center gap-2.5">
                <span className="w-9 text-right text-[11px] tabular-nums text-metin-3">{sureBicim(cal.an)}</span>
                <div onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); sesCalici.konum(((e.clientX - r.left) / r.width) * cal.toplam); }}
                  onKeyDown={ilerlemeTus} tabIndex={0} role="slider" aria-label="İlerleme" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(oran * 100)}
                  aria-valuetext={`${sureBicim(cal.an)} / ${sureBicim(cal.toplam)}`}
                  className="group/ilerleme relative h-4 flex-1 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-aksan/70">
                  <span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/[0.08]" />
                  <span className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-aksan/50 to-aksan" style={{ width: `${oran * 100}%` }} />
                  <span className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-aksan bg-white opacity-0 transition-opacity group-hover/ilerleme:opacity-100 group-focus-visible/ilerleme:opacity-100" style={{ left: `${oran * 100}%` }} />
                </div>
                <span className="w-9 text-[11px] tabular-nums text-metin-3">{sureBicim(cal.toplam)}</span>
              </div>
            </div>

            <div className="hidden shrink-0 items-center justify-end gap-1.5 lg:flex lg:w-[30%]">
              <span className="bg-white/[0.075] flex h-8 items-center gap-2 rounded-full pl-1 pr-3">
                <button onClick={() => sesCalici.duzey(cal.duzey > 0 ? 0 : 1)} aria-label={cal.duzey > 0 ? "Sesi kapat" : "Sesi aç"} className="flex h-6 w-6 items-center justify-center rounded-full text-metin-2 hover:text-metin">
                  {cal.duzey > 0 ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                </button>
                <input type="range" min={0} max={1} step={0.05} value={cal.duzey} onChange={(e) => sesCalici.duzey(Number(e.target.value))} aria-label="Ses düzeyi" aria-valuetext={`yüzde ${Math.round(cal.duzey * 100)}`}
                  className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/15 accent-[var(--color-aksan)]" />
              </span>
              <button onClick={() => onIndir(p)} aria-label="İndir" title="İndir" className={ikonDugme}><Download className="h-3.5 w-3.5" /></button>
              <button onClick={() => onAc(p.id)} aria-label="Ayrıntıyı aç" title="Ayrıntıyı aç" className={ikonDugme}><Maximize2 className="h-3.5 w-3.5" /></button>
              <button onClick={() => sesCalici.durdur()} aria-label="Çaları kapat" title="Kapat" className={ikonDugme}><X className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
