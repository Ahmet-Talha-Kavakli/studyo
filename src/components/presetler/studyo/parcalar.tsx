"use client";

/** Preset stüdyosunun ortak parçaları: galeri diliyle (K1 kart, cam rozet, parlak kredi jetonu, beyaz kayan segment). */

import { useEffect, useRef, useState } from "react";
import { LayoutGroup, motion } from "framer-motion";
import { Check, ChevronDown, Wand2 } from "lucide-react";
import { KrediJeton } from "@/components/ui/KrediHap";
import { cn } from "@/lib/utils";

export const yay = { type: "spring" as const, stiffness: 420, damping: 34 };
export const ease = [0.22, 1, 0.36, 1] as const;

/** Kredi: sitenin her yerindeki gibi küçük jeton + sayı (parlak top yok). */
export function KrediParlak({ n, koyu }: { n: number | string; koyu?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-[13px] font-semibold tabular-nums", koyu ? "text-black/75" : "text-white/85")}>
      <KrediJeton boyut={12} />{n}
    </span>
  );
}

/** Örnek videolu seçim karosu: posterle durur, üzerine gelince ya da seçiliyken oynar; seçili beyaz halka + tik. */
export function VideoKaro({ ad, alt, gorsel, video, secili, onSec, rol = "radio", oran = "4/3" }: {
  ad: string; alt?: string; gorsel: string; video?: string; secili: boolean; onSec: () => void; rol?: "radio" | "checkbox"; oran?: string;
}) {
  const [ustunde, setUstunde] = useState(false);
  const oyna = !!video && (ustunde || secili);
  return (
    <button type="button" role={rol} aria-checked={secili} onClick={onSec} title={alt}
      onPointerEnter={(e) => { if (e.pointerType === "mouse") setUstunde(true); }} onPointerLeave={() => setUstunde(false)}
      className="group text-left">
      <span className={cn("relative block overflow-hidden rounded-[14px] bg-black outline outline-2 -outline-offset-2 transition-[outline-color]", secili ? "outline-white" : "outline-transparent")} style={{ aspectRatio: oran }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={gorsel} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {oyna && <video src={video} poster={gorsel} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />}
        <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        {secili && <motion.span initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={yay} className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-black"><Check className="h-3 w-3" strokeWidth={3.2} /></motion.span>}
        <span className="absolute inset-x-2 bottom-1.5 line-clamp-1 text-[12px] font-semibold text-white">{ad}</span>
      </span>
      {alt && <span className="mt-1 block truncate px-0.5 text-[11.5px] text-white/45">{alt}</span>}
    </button>
  );
}

/** Çip (Video stüdyosunun SEG dili): yuvarlak görsel ya da simge + küçük etiket + değer. */
export function Cip({ etiket, deger, gorsel, ikon, acik, onClick, devre, ok = true }: {
  etiket: string; deger: React.ReactNode; gorsel?: string; ikon?: React.ReactNode; acik?: boolean; onClick?: () => void; devre?: boolean; ok?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} disabled={devre} aria-expanded={onClick ? acik : undefined}
      className={cn("flex h-12 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full pl-1.5 pr-3.5 text-left transition-[background-color,transform] duration-200 active:scale-[0.97]", acik ? "bg-white/[0.13]" : "bg-white/[0.07] hover:bg-white/[0.11]", devre && "pointer-events-none opacity-35")}>
      {gorsel
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={gorsel} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-inset ring-white/20" />
        : <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.08] text-white/80">{ikon}</span>}
      <span className="flex min-w-0 flex-col items-start leading-none">
        <span className="text-[11px] text-white/55">{etiket}</span>
        <span className="mt-1 flex max-w-[150px] items-center gap-1 text-[13px] font-medium text-white"><span className="truncate">{deger}</span>{ok && onClick && <ChevronDown className={cn("h-3 w-3 shrink-0 text-white/45 transition-transform", acik && "rotate-180")} />}</span>
      </span>
    </button>
  );
}

/** Beyaz kayan segment. */
export function Segment<T extends string>({ id, secenek, deger, set, kucuk }: { id: string; secenek: { id: T; ad: React.ReactNode }[]; deger: T; set: (v: T) => void; kucuk?: boolean }) {
  return (
    <LayoutGroup id={id}>
      <div role="radiogroup" className="flex w-max max-w-full overflow-x-auto rounded-full bg-white/[0.05] p-1 [scrollbar-width:none]">
        {secenek.map((o) => (
          <button key={o.id} type="button" role="radio" aria-checked={deger === o.id} onClick={() => set(o.id)}
            className={cn("relative flex shrink-0 items-center gap-1.5 rounded-full font-medium active:scale-[0.97]", kucuk ? "h-7 px-3 text-[12.5px]" : "h-8 px-3.5 text-[13px]")}>
            {deger === o.id && <motion.span layoutId={id + "-z"} className="absolute inset-0 rounded-full bg-white" transition={yay} />}
            <span className={cn("relative flex items-center gap-1.5 transition-colors", deger === o.id ? "text-black" : "text-white/60 hover:text-white")}>{o.ad}</span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
}

/** Anahtar. */
export function Anahtar({ acik, onDegis, etiket }: { acik: boolean; onDegis: () => void; etiket: string }) {
  return (
    <button type="button" role="switch" aria-checked={acik} aria-label={etiket} onClick={onDegis}
      className={cn("relative h-[24px] w-[42px] shrink-0 rounded-full transition-colors duration-300", acik ? "bg-white" : "bg-white/15")}>
      <motion.span layout transition={yay} className={cn("absolute top-[3px] h-[18px] w-[18px] rounded-full", acik ? "right-[3px] bg-[#0a0a0b]" : "left-[3px] bg-white")} />
    </button>
  );
}

/**
 * Yayın önizlemesi: galerideki K1 kartın aynısı (yazısız tam video, sol üstte cam "Senin" rozeti,
 * altta cam hapta ad + kredi). Önizleme olduğu için hap hep açık.
 */
export function YayinKarti({ ad, kapak, kapakVideo, kredi }: { ad: string; kapak?: string; kapakVideo?: string; kredi: number }) {
  const v = useRef<HTMLVideoElement>(null);
  useEffect(() => { void v.current?.play().catch(() => {}); }, [kapakVideo]);
  return (
    <div className="relative aspect-[9/16] overflow-hidden rounded-[14px] bg-[#111113] ring-1 ring-white/[0.08]">
      {kapakVideo
        ? <video ref={v} key={kapakVideo} src={kapakVideo} poster={kapak} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
        : kapak
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={kapak} alt="" className="absolute inset-0 h-full w-full object-cover" />
          : <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[linear-gradient(165deg,rgba(85,214,253,0.22),#111113_70%)] px-6 text-center"><Wand2 className="h-6 w-6 text-white/70" /><span className="text-[12.5px] text-white/55">Kapak seçince burada görünür</span></span>}
      <span className="absolute left-2 top-2 inline-flex h-[22px] items-center gap-1.5 rounded-full bg-black/35 pl-2 pr-2.5 text-[11.5px] font-semibold text-white ring-1 ring-inset ring-white/[0.14] backdrop-blur-xl"><Wand2 className="h-3 w-3 text-white/80" />Senin</span>
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
      <span className="absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-full bg-black/45 py-1.5 pl-3 pr-1.5 ring-1 ring-white/[0.15] backdrop-blur-xl">
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-white">{ad || "Adsız efekt"}</span>
        <span className="flex h-7 shrink-0 items-center rounded-full bg-white px-2.5"><KrediParlak n={kredi} koyu /></span>
      </span>
    </div>
  );
}
