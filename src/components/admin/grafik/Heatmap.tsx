"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AD } from "@/components/admin/ui/temel";

/* Isı haritası — 7 gün × 24 saat generation yoğunluğu (peak kapasite planlaması). */

const GUNLER = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export function Heatmap({ veri }: { veri: number[][] }) {
  // veri[gun][saat] = 0-100
  const renk = (v: number) => {
    const a = 0.08 + (v / 100) * 0.9;
    return `rgba(85, 214, 253, ${a})`;
  };
  return (
    <div className="overflow-x-auto ad-ince-scroll">
      <div className="min-w-[560px]">
        <div className="mb-1 flex gap-[3px] pl-8">
          {Array.from({ length: 24 }).map((_, s) => (
            <span key={s} className={cn("flex-1 text-center text-[8px]", AD.metin3)}>{s % 3 === 0 ? s : ""}</span>
          ))}
        </div>
        {veri.map((satir, g) => (
          <div key={g} className="mb-[3px] flex items-center gap-[3px]">
            <span className={cn("w-7 shrink-0 text-[10px]", AD.metin3)}>{GUNLER[g]}</span>
            {satir.map((v, s) => (
              <motion.span key={s} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: (g * 24 + s) * 0.001 }}
                title={`${GUNLER[g]} ${s}:00 · %${v}`}
                className="h-4 flex-1 rounded-[3px]" style={{ background: renk(v) }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
