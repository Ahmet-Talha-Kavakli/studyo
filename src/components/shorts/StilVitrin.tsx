"use client";

/**
 * Stil uygula vitrini: aynı klip, stilden stile soldan silinerek geçer (clip-path), sağda sıradaki stiller
 * ilerleme çubuklu liste olarak akar. Seçili stil hep ilk sırada; listeden tıklanınca o stil seçilir.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";

const SURE = 2600;
const ease = [0.22, 1, 0.36, 1] as const;

export function StilVitrin({ stiller, secili, onSec }: { stiller: { ad: string; kapak: string; tohum: string }[]; secili: string; onSec: (t: string) => void }) {
  const ilk = stiller.find((s) => s.tohum === secili) ?? stiller[0];
  const liste = [ilk, ...stiller.filter((s) => s.tohum !== ilk.tohum).slice(0, 3)];
  const [aktif, setAktif] = useState(0);
  useEffect(() => { setAktif(0); }, [secili]);
  useEffect(() => { const t = setInterval(() => setAktif((v) => (v + 1) % liste.length), SURE); return () => clearInterval(t); }, [liste.length, secili]);
  const s = liste[aktif];
  return (
    <div className="grid grid-cols-[minmax(0,190px)_minmax(0,1fr)] gap-3 max-sm:grid-cols-[minmax(0,118px)_minmax(0,1fr)]">
      <div className="relative aspect-[9/16] overflow-hidden rounded-[18px] bg-black ring-1 ring-inset ring-white/15">
        <AnimatePresence initial={false}>
          <motion.img key={s.tohum} src={s.kapak} alt="" initial={{ clipPath: "inset(0 100% 0 0)" }} animate={{ clipPath: "inset(0 0% 0 0)" }} exit={{ opacity: 1 }} transition={{ duration: 0.75, ease }}
            className="absolute inset-0 h-full w-full object-cover" />
        </AnimatePresence>
        <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/25" />
        <span className="absolute inset-x-2 bottom-2.5 flex items-center gap-1.5 rounded-full bg-black/45 px-2 py-1 text-[11px] text-white/90 backdrop-blur-xl">
          <Mic className="h-3 w-3 shrink-0" />
          <span className="flex h-4 flex-1 items-center justify-between">{Array.from({ length: 14 }, (_, i) => <span key={i} className="sh-dalga w-[2px] rounded-full bg-white/85" style={{ animationDelay: `${(i % 5) * 0.12}s`, height: 6 + ((i * 37) % 10) }} />)}</span>
        </span>
      </div>
      <div className="flex min-w-0 flex-col">
        <p className="px-1 text-[12.5px] text-white/60">Aynı klip, farklı stil</p>
        <div className="mt-2 flex flex-col gap-1.5">
          {liste.map((x, i) => {
            const a = i === aktif;
            return (
              <button key={x.tohum} type="button" onClick={() => onSec(x.tohum)}
                className={cn("relative flex items-center gap-2.5 overflow-hidden rounded-[12px] p-1.5 text-left transition-colors", a ? "bg-white/[0.12]" : "hover:bg-white/[0.06]")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={x.kapak} alt="" className="h-11 w-[25px] shrink-0 rounded-[6px] object-cover ring-1 ring-inset ring-white/10" />
                <span className={cn("min-w-0 flex-1 truncate text-[13.5px] font-medium", a ? "text-white" : "text-white/65")}>{x.ad}</span>
                {i === 0 && <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10.5px] font-semibold text-black">Seçili</span>}
                {a && <motion.span key={`p${aktif}-${secili}`} aria-hidden className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-white/70" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: SURE / 1000, ease: "linear" }} />}
              </button>
            );
          })}
        </div>
        <p className="mt-auto px-1 pt-3 text-[12px] leading-snug text-white/55">Konuşma, ses ve tempo aynı kalır; yalnız görsel dil baştan üretilir.</p>
      </div>
    </div>
  );
}
