"use client";

import { cn } from "@/lib/utils";
import { AD } from "@/components/admin/ui/temel";

/* Isı haritası: 7 gün ve 24 saat; değerler ham sayıdır, renk en yüksek değere göre ölçeklenir. */

const GUNLER = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export function Heatmap({ veri, birim = "olay" }: { veri: number[][]; birim?: string }) {
  const max = Math.max(1, ...veri.flat());
  const renk = (v: number) => (v === 0 ? "rgba(255,255,255,0.035)" : `rgba(85, 214, 253, ${0.15 + (v / max) * 0.8})`);
  return (
    <div className="overflow-x-auto ad-ince-scroll">
      <div className="min-w-[560px]">
        <div className="mb-1 flex gap-[3px] pl-8">
          {Array.from({ length: 24 }).map((_, s) => <span key={s} className={cn("flex-1 text-center text-[9px]", AD.metin3)}>{s % 3 === 0 ? s : ""}</span>)}
        </div>
        {veri.map((satir, g) => (
          <div key={g} className="mb-[3px] flex items-center gap-[3px]">
            <span className={cn("w-7 shrink-0 text-[10px]", AD.metin3)}>{GUNLER[g]}</span>
            {satir.map((v, s) => <span key={s} title={`${GUNLER[g]} ${String(s).padStart(2, "0")}:00, ${v} ${birim}`} className="h-4 flex-1 rounded-[3px]" style={{ background: renk(v) }} />)}
          </div>
        ))}
      </div>
    </div>
  );
}
