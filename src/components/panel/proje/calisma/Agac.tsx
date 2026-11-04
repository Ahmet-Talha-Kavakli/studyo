"use client";

/**
 * VS Code gezgini dilinde ağaç satırı: 30 px yükseklik, düzey başına 16 px girinti,
 * her düzeyde dikey girinti çizgisi (ağacın üzerine gelince belirginleşir), açılır ok,
 * 16 px simge, ad, sağda soluk bilgi ve üzerine gelince beliren eylemler.
 */

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const GIRINTI = 16;

export function Agac({ children, etiket, className }: { children: React.ReactNode; etiket: string; className?: string }) {
  return <div role="tree" aria-label={etiket} className={cn("group/agac", className)}>{children}</div>;
}

export function AgacSatiri({ d, altVar, acik, onAcKapat, secili, aktifYol, href, onClick, simge, ad, bilgi, eylem, title, onDragOver, onDragLeave, onDrop, hedef }: {
  d: number; altVar?: boolean; acik?: boolean; onAcKapat?: () => void; secili?: boolean; aktifYol?: number[];
  href?: string; onClick?: () => void; simge?: React.ReactNode; ad: React.ReactNode; bilgi?: React.ReactNode; eylem?: React.ReactNode; title?: string;
  onDragOver?: (e: React.DragEvent) => void; onDragLeave?: () => void; onDrop?: (e: React.DragEvent) => void; hedef?: boolean;
}) {
  const ic = (
    <>
      <span className="min-w-0 flex-1 truncate">{ad}</span>
      {bilgi !== undefined && <span className={cn("shrink-0 tabular-nums transition-opacity", typeof bilgi === "number" ? "min-w-5 rounded-full bg-white/[0.07] px-1.5 text-center text-[11px] font-medium leading-[18px] text-white/60" : "text-[11.5px]", typeof bilgi !== "number" && (secili ? "text-white/60" : "text-white/40"), eylem && "group-hover/as:opacity-0")}>{bilgi}</span>}
    </>
  );
  return (
    <motion.div role="treeitem" aria-level={d + 1} aria-expanded={altVar ? !!acik : undefined} aria-selected={!!secili} title={title}
      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
      className={cn("group/as relative flex h-[28px] items-center gap-1 rounded-[7px] pr-1 text-[13px] transition-colors",
        secili ? "bg-white/[0.09] font-medium text-white ring-1 ring-inset ring-white/[0.12]" : "text-white/70 hover:bg-white/[0.045] hover:text-white",
        hedef && "bg-white/[0.12] outline outline-1 -outline-offset-1 outline-white/60")}
      style={{ paddingLeft: 4 + d * GIRINTI }}>
      {Array.from({ length: d }, (_, i) => (
        <span key={i} aria-hidden className={cn("pointer-events-none absolute inset-y-0 w-px transition-colors",
          aktifYol?.includes(i) ? "bg-white/[0.24]" : "bg-white/[0.07] group-hover/agac:bg-white/[0.14]")} style={{ left: 4 + i * GIRINTI + 8.5 }} />
      ))}
      {altVar ? (
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAcKapat?.(); }} aria-label={acik ? "Daralt" : "Genişlet"} tabIndex={-1}
          className="relative z-10 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] text-white/50 hover:bg-white/[0.08] hover:text-white">
          <ChevronRight className={cn("h-3.5 w-3.5 transition-transform duration-200 ease-out", acik && "rotate-90")} strokeWidth={2.2} />
        </button>
      ) : <span className="h-[18px] w-[18px] shrink-0" />}
      {simge && <span className="mr-0.5 flex h-[18px] w-5 shrink-0 items-center justify-center">{simge}</span>}
      {href ? <Link href={href} className="flex min-w-0 flex-1 items-center gap-1.5 outline-none after:absolute after:inset-0 after:content-['']">{ic}</Link>
        : <button onClick={onClick} className="flex min-w-0 flex-1 items-center gap-1.5 text-left outline-none after:absolute after:inset-0 after:content-['']">{ic}</button>}
      {eylem && <span className="relative z-10 flex shrink-0 translate-x-1 items-center gap-0.5 opacity-0 transition-[opacity,translate] duration-200 focus-within:translate-x-0 focus-within:opacity-100 group-hover/as:translate-x-0 group-hover/as:opacity-100">{eylem}</span>}
    </motion.div>
  );
}

export function AgacEylem({ onClick, etiket, children }: { onClick: () => void; etiket: string; children: React.ReactNode }) {
  return (
    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }} aria-label={etiket} title={etiket}
      className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] text-white/55 transition-colors hover:bg-white/[0.1] hover:text-white active:scale-[0.92]">{children}</button>
  );
}

/** Bölüm başlığı (VS Code "GEZGİN" bölümleri gibi ama cümle düzeninde): açılır, sağda eylemler. */
export function AgacBolumu({ ad, acik, onAcKapat, eylem, children, sayi }: { ad: string; acik: boolean; onAcKapat: () => void; eylem?: React.ReactNode; children: React.ReactNode; sayi?: number }) {
  return (
    <section className="mt-3 border-t border-white/[0.06] pt-2">
      <div className="group/ab flex h-8 items-center rounded-[8px] pr-1">
        <button onClick={onAcKapat} aria-expanded={acik} className="flex h-full min-w-0 flex-1 items-center gap-1.5 pl-1 text-left text-[12.5px] font-semibold text-white/60 transition-colors hover:text-white">
          <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 transition-transform duration-200 ease-out", acik && "rotate-90")} strokeWidth={2.2} />
          <span className="truncate">{ad}</span>
          {sayi !== undefined && <span className="ml-0.5 rounded-full bg-white/[0.07] px-1.5 text-[11px] font-medium tabular-nums text-white/55">{sayi}</span>}
        </button>
        {eylem && <span className="flex items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover/ab:opacity-100 [section:hover_&]:opacity-100">{eylem}</span>}
      </div>
      <AnimatePresence initial={false}>
        {acik && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden"><div className="pt-0.5">{children}</div></motion.div>}
      </AnimatePresence>
    </section>
  );
}
