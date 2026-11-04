"use client";

import { useState } from "react";
import { ChevronDown, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Yuzen } from "@/components/ui/Yuzen";

/** Komut kutusu çipi: simge + değer; tıklayınca yukarı açılan popover. */
export function KCip({ ikon, deger, etiket, acik, setAcik, genislik = 300, children, vurgu, buyuk, sag, iri, okGizli }: {
  ikon: React.ReactNode; deger: React.ReactNode; etiket: string; acik: boolean; setAcik: (v: boolean) => void; genislik?: number; children: React.ReactNode; vurgu?: boolean;
  /** Popover başlık şeridinin sağı (sayaç, Kaldır vb.). */
  sag?: React.ReactNode;
  /** En büyük boy (tek satırlık geniş komut çubukları için). */
  iri?: boolean;
  /** Aşağı oku gizle (sığmayan tek satırlık komut çubukları). */
  okGizli?: boolean;
  /** Büyük boy: daha yüksek hap, büyük küçük resim, üstte etiket. */
  buyuk?: boolean;
}) {
  return (
    <div className="relative">
      <button onClick={() => setAcik(!acik)} aria-expanded={acik} title={etiket}
        className={cn("flex items-center rounded-full ring-1 ring-inset transition-[color,background-color,transform] active:scale-[0.97]", iri ? "h-14 gap-3 pl-2 pr-3.5 text-[14.5px]" : buyuk ? "h-12 gap-2.5 pl-1.5 pr-3 text-[13.5px]" : "h-9 gap-1.5 pl-1.5 pr-2.5 text-[13px] font-medium", acik ? "bg-white/[0.12] text-metin ring-white/20" : vurgu ? "bg-amber-300/10 text-amber-100 ring-amber-300/30" : "bg-white/[0.08] text-metin ring-transparent hover:bg-white/[0.13]")}>
        <span className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.1] text-white/85", iri ? "h-10 w-10" : buyuk ? "h-9 w-9" : "h-6 w-6")}>{ikon}</span>
        {buyuk || iri ? <span className="flex max-w-[180px] flex-col items-start leading-tight"><span className={cn("whitespace-nowrap text-white/55", iri ? "text-[11.5px]" : "text-[11px]")}>{etiket}</span><span className="max-w-full truncate whitespace-nowrap font-medium">{deger}</span></span> : <span className="whitespace-nowrap">{deger}</span>}
        {!okGizli && <ChevronDown className={cn("h-3.5 w-3.5 text-metin-3 transition-transform", acik && "rotate-180")} />}
      </button>
      <Yuzen acik={acik} onKapat={() => setAcik(false)} yerlesim="ust-sol" bosluk={10} etiket={etiket}
        className="flex max-h-[min(70vh,600px)] flex-col overflow-hidden rounded-[18px] border border-white/[0.09] bg-[#1b1c1f]" style={{ width: `min(${genislik}px, calc(100vw - 24px))` }}>
        <div className="flex min-h-[44px] shrink-0 items-center gap-2 border-b border-white/[0.06] px-3.5 py-2"><span className="min-w-0 flex-1 text-[13.5px] font-semibold text-metin">{etiket}</span>{sag}</div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2 [scrollbar-width:thin]">{children}</div>
      </Yuzen>
    </div>
  );
}

/** Görselli ızgara seçeneği. */
export function IzgaraSec({ sec, ad, alt, kapak, video, onClick, oran = "aspect-[4/3]" }: { sec: boolean; ad: string; alt?: string; kapak?: string; video?: string; onClick: () => void; oran?: string }) {
  const [oyna, setOyna] = useState(false);
  return (
    <button onClick={onClick} aria-pressed={sec} onPointerEnter={(e) => e.pointerType === "mouse" && setOyna(true)} onPointerLeave={() => setOyna(false)} className="group min-w-0 text-left">
      <span className={cn("relative block overflow-hidden rounded-[12px] bg-white/[0.04] transition-[outline-color]", oran, sec ? "outline outline-2 -outline-offset-2 outline-white" : "outline outline-1 -outline-offset-1 outline-white/[0.1] group-hover:outline-white/30")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {kapak ? <img src={kapak} alt="" loading="lazy" className="absolute inset-0 -z-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]" /> : <span className="absolute inset-0 flex items-center justify-center text-metin-3"><ImageIcon className="h-5 w-5" /></span>}
        {video && oyna && <video src={video} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />}
      </span>
      <span className={cn("mt-1 block truncate text-[12.5px] font-medium", sec ? "text-metin" : "text-metin-2")}>{ad}</span>
      {alt && <span className="line-clamp-2 block text-[11.5px] leading-snug text-metin-3">{alt}</span>}
    </button>
  );
}
