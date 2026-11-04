"use client";

import { useState, type ReactNode } from "react";
import { ChevronRight, Check, Play, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Yuzen, type Yerlesim } from "@/components/ui/Yuzen";

export type AyarSecenek<T> = {
  deger: T; ad: string; alt?: string; rozet?: string; ikon?: LucideIcon; on?: ReactNode; kredi?: number;
  /** Izgara modunda kart görseli; `video` varsa üzerine gelince oynar. */
  kapak?: string; video?: string;
};

/**
 * Ayar satırı (video stüdyosundaki model/hareket satırı deseni): cam ikon + ad + seçili değer (küçük resimle);
 * tıklayınca yanda açılan seçici. `izgara` verilirse seçenekler görsel kartlar olarak dizilir.
 */
export function AyarSatiri<T extends string | number>({ ikon: I, renk, ad, deger, secenekler, onSec, yerlesim = "sag-ust", genislik = 280, izgara }: {
  ikon: LucideIcon; renk: string; ad: string; deger: T; secenekler: AyarSecenek<T>[]; onSec: (v: T) => void; yerlesim?: Yerlesim; genislik?: number; izgara?: 2 | 3;
}) {
  const [acik, setAcik] = useState(false);
  const [uzerinde, setUzerinde] = useState<T | null>(null);
  const sec = secenekler.find((s) => s.deger === deger);
  return (
    <div className="relative">
      <button onClick={() => setAcik((v) => !v)} aria-haspopup="listbox" aria-expanded={acik}
        className={cn("hf-btn panel-ic panel-ic-hover flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5", acik && "ring-1 ring-inset ring-aksan/40")}>
        <span className="flex min-w-0 items-center gap-3 text-[13.5px] font-medium text-metin">
          {sec?.kapak ? <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/15">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={sec.kapak} alt="" className="h-full w-full object-cover" /></span>
            : sec?.on ? <span className="flex shrink-0 [&>*]:!h-8 [&>*]:!w-8">{sec.on}</span>
            : <span className={cn("glass-ikon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", renk)}><I className="h-4 w-4" /></span>}
          <span className="min-w-0 text-left"><span className="block text-[11.5px] font-medium text-metin-3">{ad}</span><span className="block truncate text-[13.5px] font-semibold text-metin">{sec?.ad}</span></span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {sec?.kredi !== undefined && <span className="rounded-md bg-aksan/10 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-aksan">✦{sec.kredi}</span>}
          <ChevronRight className={cn("h-4 w-4 text-metin-3 transition-transform", acik && "translate-x-0.5 text-aksan")} />
        </span>
      </button>
      <Yuzen acik={acik} onKapat={() => setAcik(false)} yerlesim={yerlesim} bosluk={10} etiket={ad} className="menu-surface max-h-[min(78vh,600px)] overflow-y-auto rounded-[18px] p-2 [scrollbar-width:thin]" style={{ width: `min(${izgara ? Math.max(genislik, izgara * 150) : genislik}px, calc(100vw - 24px))` }}>
        <p className="flex items-center gap-2 px-1.5 pb-2 pt-0.5 text-[12.5px] font-semibold text-metin"><span className={cn("glass-ikon flex h-6 w-6 items-center justify-center rounded-md", renk)}><I className="h-3.5 w-3.5" /></span>{ad}</p>
        {izgara ? (
          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(130px, calc((100vw - 64px) / 2)), 1fr))`, maxWidth: izgara * 160 }}>
            {secenekler.map((s) => {
              const aktif = s.deger === deger;
              return (
                <button key={String(s.deger)} role="option" aria-selected={aktif} onClick={() => { onSec(s.deger); setAcik(false); }}
                  onMouseEnter={() => setUzerinde(s.deger)} onMouseLeave={() => setUzerinde(null)}
                  className={cn("group relative aspect-[4/3] overflow-hidden rounded-xl bg-black text-left ring-1 transition-shadow", aktif ? "ring-2 ring-aksan" : "ring-white/10 hover:ring-white/35")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {s.kapak && <img src={s.kapak} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                  {s.video && uzerinde === s.deger && <video src={s.video} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />}
                  {!s.kapak && s.ikon && <span className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(80%_70%_at_50%_30%,rgba(34,211,238,0.12),transparent_70%)]"><s.ikon className="h-6 w-6 text-metin-2" /></span>}
                  <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  {s.video && uzerinde !== s.deger && <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-white/85"><Play className="h-2.5 w-2.5 translate-x-px fill-current" /></span>}
                  {aktif && <span className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-aksan text-zemin"><Check className="h-3 w-3" strokeWidth={3} /></span>}
                  <span className="absolute inset-x-2 bottom-1.5">
                    <span className="hf-baslik block truncate text-[12px] leading-tight text-white">{s.ad.toLocaleUpperCase("tr")}</span>
                    {s.alt && <span className="block truncate text-[9.5px] leading-tight text-white/70">{s.alt}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        ) : secenekler.map((s) => {
          const aktif = s.deger === deger;
          return (
            <button key={String(s.deger)} role="option" aria-selected={aktif} onClick={() => { onSec(s.deger); setAcik(false); }}
              className={cn("flex w-full items-center gap-3 rounded-[12px] px-2 py-2 text-left transition-colors", aktif ? "bg-aksan/10 ring-1 ring-inset ring-aksan/40" : "hover:bg-white/[0.06]")}>
              {s.kapak ? <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={s.kapak} alt="" className="h-full w-full object-cover" /></span>
                : s.on ?? (s.ikon && <span className={cn("glass-ikon flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", aktif && "glass-ikon-cyan")}><s.ikon className={cn("h-[18px] w-[18px]", aktif ? "text-aksan" : "text-metin-2")} /></span>)}
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[13.5px] font-semibold text-metin">{s.ad}{s.rozet && <span className="rounded-full bg-aksan/15 px-1.5 py-px text-[10px] font-semibold text-aksan">{s.rozet}</span>}</span>
                {s.alt && <span className="block truncate text-[11.5px] text-metin-3">{s.alt}</span>}
              </span>
              {s.kredi !== undefined && <span className="shrink-0 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-metin-2">✦{s.kredi}</span>}
              {aktif && <Check className="h-4 w-4 shrink-0 text-aksan" />}
            </button>
          );
        })}
      </Yuzen>
    </div>
  );
}
