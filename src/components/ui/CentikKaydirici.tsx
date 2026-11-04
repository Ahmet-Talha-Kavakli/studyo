"use client";

import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Çentikli kaydırıcı (Suno "Advanced Options" deseni): koyu satır içinde dikey çentikler,
 * camgöbeği hap tutamaç, sağda değer. `bos` verilirse (ör. "Otomatik") tutamaç gizlenir ve
 * tüm çentikler sönük kalır; ize dokunmak değeri seçer. Erişilebilirlik görünmez native
 * range girdisiyle sağlanır.
 */
export function CentikKaydirici({ etiket, deger, min, max, adim = 1, onDegis, yaz, bos, onSifirla, sifirlaEtiket = "Sıfırla", centik = 12 }: {
  etiket: string; deger: number; min: number; max: number; adim?: number; onDegis: (v: number) => void;
  yaz: (v: number) => string; bos?: string; onSifirla?: () => void; sifirlaEtiket?: string; centik?: number;
}) {
  const oran = Math.min(1, Math.max(0, (deger - min) / (max - min)));
  return (
    <div className="flex h-12 items-center gap-3 rounded-xl bg-black/30 px-3.5 transition-shadow focus-within:ring-1 focus-within:ring-aksan/50">
      <span className="w-14 shrink-0 text-[13.5px] text-metin-2">{etiket}</span>
      <div className="relative h-8 min-w-0 flex-1">
        <div className="pointer-events-none absolute inset-x-1 inset-y-0 flex items-center justify-between">
          {Array.from({ length: centik }, (_, i) => (
            <span key={i} className={cn("h-4 w-[2px] rounded-full transition-colors", !bos && i / (centik - 1) <= oran + 0.001 ? "bg-white/50" : "bg-white/[0.13]")} />
          ))}
        </div>
        {!bos && (
          <span className="pointer-events-none absolute top-1/2 h-7 w-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-aksan shadow-[0_0_0_3px_rgba(10,10,12,0.6)]"
            style={{ left: `calc(4px + ${oran} * (100% - 8px))` }} />
        )}
        <input type="range" min={min} max={max} step={adim} value={deger} onChange={(e) => onDegis(Number(e.target.value))}
          aria-label={etiket} aria-valuetext={bos ?? yaz(deger)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
      </div>
      <span className={cn("w-[68px] shrink-0 text-right text-[13px] tabular-nums", bos ? "text-metin-3" : "text-metin")}>{bos ?? yaz(deger)}</span>
      {onSifirla && (
        <button type="button" onClick={onSifirla} aria-label={sifirlaEtiket} title={sifirlaEtiket}
          className="-mr-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-metin-2 transition-colors hover:bg-white/[0.12] hover:text-metin">
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
