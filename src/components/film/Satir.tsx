"use client";

/* Film editörünün sağ panelindeki gruplu ayar listesi: tek kap içinde ince çizgiyle ayrılmış satırlar.
   Satır solda küçük önizleme, ortada ad ve değer, sağda ok; tıklayınca seçenekler soldan açılır
   (liste ya da görselli/videolu ızgara). */

import { useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Yuzen } from "@/components/ui/Yuzen";

export function Grup({ baslik, sag, children }: { baslik?: string; sag?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      {baslik && <p className="mb-2 flex items-center justify-between px-0.5 text-[13px] font-semibold text-metin">{baslik}{sag && <span className="text-[12px] font-normal text-metin-3">{sag}</span>}</p>}
      <div className="divide-y divide-white/[0.06] overflow-hidden rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.06]">{children}</div>
    </section>
  );
}

export type SatirSecenek<T extends string> = { deger: T; ad: string; alt?: string; kapak?: string; video?: string; on?: React.ReactNode; sag?: React.ReactNode; rozet?: string };

export function Satir<T extends string>({ ad, deger, on, secenekler, onSec, izgara, genislik = 320, oran = "aspect-[16/10]", ek, not }: {
  ad: string; deger: T; on?: React.ReactNode; secenekler: SatirSecenek<T>[]; onSec: (v: T) => void; not?: string;
  izgara?: 2 | 3; genislik?: number; oran?: string; ek?: React.ReactNode;
}) {
  const [acik, setAcik] = useState(false);
  const [ustunde, setUstunde] = useState<string | null>(null);
  const sec = secenekler.find((s) => s.deger === deger);
  return (
    <div className="relative">
      <button onClick={() => setAcik((v) => !v)} aria-expanded={acik}
        className={cn("flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]", acik && "bg-white/[0.05]")}>
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[9px] bg-white/[0.08] text-metin">
          {on ?? (sec?.kapak
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={sec.kapak} alt="" className="h-full w-full object-cover" />
            : null)}
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block text-[12px] text-metin-3">{ad}</span>
          <span className="mt-0.5 block truncate text-[13.5px] font-semibold text-metin">{sec?.ad}</span>
        </span>
        {ek}
        <ChevronRight className={cn("h-4 w-4 shrink-0 text-metin-3 transition-transform", acik && "text-metin")} />
      </button>
      <Yuzen acik={acik} onKapat={() => setAcik(false)} yerlesim="sol-ust" bosluk={10} etiket={ad}
        className="max-h-[70vh] overflow-y-auto rounded-[18px] border border-white/[0.09] bg-[#161618] p-1.5 [scrollbar-width:thin]" style={{ width: `min(${genislik}px, calc(100vw - 24px))` }}>
        <p className="px-2 pb-2 pt-1 text-[13px] font-semibold text-metin">{ad}</p>
        {izgara ? (
          <div className={cn("grid gap-x-2 gap-y-2.5 p-1", izgara === 3 ? "grid-cols-3" : "grid-cols-2")}>
            {secenekler.map((s) => {
              const a = s.deger === deger;
              return (
                <button key={s.deger} onClick={() => { onSec(s.deger); setAcik(false); }} aria-pressed={a} className="group min-w-0 text-left"
                  onPointerEnter={(e) => e.pointerType === "mouse" && setUstunde(s.deger)} onPointerLeave={() => setUstunde(null)}>
                  <span className={cn("relative block overflow-hidden rounded-[12px] bg-black ring-inset", oran, a ? "ring-2 ring-aksan" : "ring-1 ring-white/[0.08] group-hover:ring-white/30")}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {s.kapak && <img src={s.kapak} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
                    {s.video && ustunde === s.deger && <video src={s.video} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />}
                    {a && <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-aksan text-zemin"><Check className="h-3 w-3" strokeWidth={3.5} /></span>}
                  </span>
                  <span className={cn("mt-1 block truncate px-0.5 text-[12.5px] font-medium", a ? "text-aksan" : "text-metin-2 group-hover:text-metin")}>{s.ad}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-0.5">
            {secenekler.map((s) => {
              const a = s.deger === deger;
              return (
                <button key={s.deger} onClick={() => { onSec(s.deger); setAcik(false); }} aria-pressed={a}
                  className={cn("flex w-full items-center gap-3 rounded-[12px] px-2.5 py-2 text-left transition-colors hover:bg-white/[0.05]", a && "bg-white/[0.06]")}>
                  {s.on}
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="flex items-center gap-1.5 text-[13.5px] font-semibold text-metin">{s.ad}{s.rozet && <span className="rounded-full bg-aksan/15 px-1.5 py-px text-[10.5px] font-semibold text-aksan">{s.rozet}</span>}</span>
                    {s.alt && <span className="mt-0.5 block truncate text-[12px] text-metin-3">{s.alt}</span>}
                  </span>
                  {s.sag}
                  <span className="flex w-4 shrink-0 justify-end">{a && <Check className="h-4 w-4 text-aksan" />}</span>
                </button>
              );
            })}
          </div>
        )}
        {not && <p className="mx-1 mt-1.5 border-t border-white/[0.06] px-1.5 pb-1 pt-2 text-[12px] leading-snug text-metin-3">{not}</p>}
      </Yuzen>
    </div>
  );
}

/** Satır içinde anahtar (switch). */
export function AnahtarSatir({ ad, alt, acik, onDegis, on }: { ad: string; alt: string; acik: boolean; onDegis: () => void; on?: React.ReactNode }) {
  return (
    <button onClick={onDegis} role="switch" aria-checked={acik} className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]">
      {on && <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-white/[0.06] text-metin-2">{on}</span>}
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block text-[13.5px] font-semibold text-metin">{ad}</span>
        <span className="mt-0.5 block text-[12px] leading-snug text-metin-3">{alt}</span>
      </span>
      <span className={cn("relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors", acik ? "bg-white" : "bg-white/15")}><span className={cn("absolute top-[3px] h-4 w-4 rounded-full transition-[left,background-color]", acik ? "left-[19px] bg-[#0a0a0b]" : "left-[3px] bg-white")} /></span>
    </button>
  );
}
