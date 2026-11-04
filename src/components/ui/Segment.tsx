"use client";

import { cn } from "@/lib/utils";

/** Segment kontrolü (2–6 seçenek) — nötr, ses/müzik panelleri ortak dili. */
export function Segment<T extends string | number | boolean>({ deger, onDegis, secenekler, etiket, kucuk }: {
  deger: T; onDegis: (v: T) => void; secenekler: [T, string][]; etiket?: string; kucuk?: boolean;
}) {
  return (
    <div className="flex rounded-xl bg-white/[0.05] p-1" role="radiogroup" aria-label={etiket}>
      {secenekler.map(([v, a]) => (
        <button key={String(v)} type="button" role="radio" aria-checked={deger === v} onClick={() => onDegis(v)}
          className={cn("flex-1 rounded-[9px] px-2 transition-colors", kucuk ? "py-1 text-[12.5px]" : "py-1.5 text-[13px]",
            deger === v ? "bg-white/[0.1] font-medium text-metin" : "text-metin-2 hover:text-metin")}>{a}</button>
      ))}
    </div>
  );
}

/** Açma/kapama satırı. */
export function AcKapa({ acik, onDegis, baslik, alt, devreDisi }: { acik: boolean; onDegis: () => void; baslik: string; alt?: string; devreDisi?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={acik} onClick={onDegis} disabled={devreDisi}
      className="flex w-full items-center gap-3 rounded-xl py-2 text-left disabled:cursor-not-allowed disabled:opacity-45">
      <span className="min-w-0 flex-1"><span className="block text-[13.5px] text-metin">{baslik}</span>{alt && <span className="block text-[12px] text-metin-3">{alt}</span>}</span>
      <span className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", acik ? "bg-white" : "bg-white/[0.15]")}>
        <span className={cn("absolute left-0 top-0.5 h-4 w-4 rounded-full transition-transform", acik ? "translate-x-[18px] bg-[#111113]" : "translate-x-0.5 bg-white")} />
      </span>
    </button>
  );
}
