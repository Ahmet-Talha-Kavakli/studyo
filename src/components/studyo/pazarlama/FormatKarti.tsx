"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { pazGercek } from "@/lib/gercekVeri";
import type { PazStil } from "@/lib/pazarlamaVeri";

/**
 * Format kartı (9:16) — formatın üç gerçek karesi; üzerine gelince kareler hikâye gibi akar
 * (üstte ilerleme çizgileri). Ad ve özet kartın içinde, alttaki koyu geçişin üstünde.
 */
export function FormatKarti({ s, sec, onSec }: { s: PazStil; sec: boolean; onSec: () => void }) {
  const [ust, setUst] = useState(false);
  const [kare, setKare] = useState(0);
  useEffect(() => {
    if (!ust) { setKare(0); return; }
    const t = setInterval(() => setKare((k) => (k + 1) % 3), 1100);
    return () => clearInterval(t);
  }, [ust]);
  return (
    <motion.button whileTap={{ scale: 0.98 }} onClick={onSec} aria-pressed={sec} aria-label={`${s.ad}: ${s.ozet}`}
      onPointerEnter={(e) => e.pointerType === "mouse" && setUst(true)} onPointerLeave={() => setUst(false)} onFocus={() => setUst(true)} onBlur={() => setUst(false)}
      className={cn("group relative block aspect-[9/16] w-full overflow-hidden rounded-[20px] bg-white/[0.04] text-left transition-[outline-color,transform] duration-300 hover:-translate-y-1",
        "outline outline-1 -outline-offset-1 outline-white/[0.08] hover:outline-white/25")}>
      <AnimatePresence initial={false}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <motion.img key={kare} src={pazGercek(s.tohumlar[kare])} alt="" loading="lazy" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: ust ? 1.07 : 1 }} exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 0.35 }, scale: { duration: 1.4, ease: "linear" } }} className="absolute inset-0 h-full w-full object-cover" />
      </AnimatePresence>
      <span className="absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-black/90 via-black/45 to-transparent" />
      <span className={cn("absolute inset-x-2.5 top-2.5 flex gap-1 transition-opacity", ust ? "opacity-100" : "opacity-0")}>
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
            {ust && <motion.span key={`${i}-${kare}`} className="block h-full bg-white" initial={{ width: i < kare ? "100%" : "0%" }} animate={{ width: i <= kare ? "100%" : "0%" }} transition={{ duration: i === kare ? 1.1 : 0, ease: "linear" }} />}
          </span>
        ))}
      </span>
      <span className={cn("absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[11px] font-medium text-white/90 backdrop-blur-sm transition-opacity", ust && "opacity-0")}>
        <Clock className="h-3 w-3" />{s.sure}
      </span>
      {sec && <span className="absolute right-2.5 top-2.5 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-black">Seçili</span>}
      {sec && <span className="pointer-events-none absolute inset-0 rounded-[20px] ring-2 ring-inset ring-white" />}
      <span className="absolute inset-x-3 bottom-3">
        <span className="block text-[15px] font-semibold leading-tight text-white">{s.ad}</span>
        <span className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-white/70">{s.ozet}</span>
      </span>
    </motion.button>
  );
}
