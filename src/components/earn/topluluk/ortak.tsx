"use client";

/** Earn topluluk sayfaları (Hesaplar, Yardım) için ortak parçalar: başlık, bölüm, beyaz kayan segment, marka renkleri. */

import { LayoutGroup, motion } from "framer-motion";
import type { Platform } from "@/lib/earn/kampanyalar";
import { cn } from "@/lib/utils";

export const yay = { type: "spring" as const, stiffness: 420, damping: 34 };
export const ease = [0.22, 1, 0.36, 1] as const;

/** Platformların marka rengi: kartın köşesindeki hafif ışık ve vurgu için. */
export const MARKA: Record<Platform, { isik: string; vurgu: string }> = {
  instagram: { isik: "rgba(225,48,108,0.22)", vurgu: "#f472b6" },
  tiktok: { isik: "rgba(37,244,238,0.16)", vurgu: "#5ef0ea" },
  youtube: { isik: "rgba(255,0,51,0.2)", vurgu: "#ff5a72" },
  x: { isik: "rgba(255,255,255,0.1)", vurgu: "#e5e7eb" },
};

export const VARSAYILAN_AVATAR = "/gercek/gorsel/gorsel-karakter-Talha.webp";

export function Baslik({ baslik, alt, sag }: { baslik: string; alt?: string; sag?: React.ReactNode }) {
  return (
    <motion.header initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease }} className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 max-w-[640px]">
        <h1 className="text-[30px] font-semibold tracking-[-0.035em] text-white sm:text-[36px]">{baslik}</h1>
        {alt && <p className="mt-1.5 text-[15px] leading-relaxed text-white/60">{alt}</p>}
      </div>
      {sag}
    </motion.header>
  );
}

export function Bolum({ id, baslik, alt, sag, children, className }: { id?: string; baslik: string; alt?: string; sag?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={cn("mt-14 scroll-mt-24", className)}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-[22px] font-semibold tracking-[-0.03em] text-white sm:text-[24px]">{baslik}</h2>{alt && <p className="mt-1 text-[14px] text-white/55">{alt}</p>}</div>
        {sag}
      </div>
      {children}
    </section>
  );
}

export function Segment<T extends string>({ id, secenek, deger, set, className }: { id: string; secenek: { id: T; ad: string }[]; deger: T; set: (v: T) => void; className?: string }) {
  return (
    <LayoutGroup id={id}>
      <div role="radiogroup" className={cn("flex w-max max-w-full overflow-x-auto rounded-full bg-white/[0.04] p-1 ring-1 ring-white/[0.08] [scrollbar-width:none]", className)}>
        {secenek.map((o) => (
          <button key={o.id} type="button" role="radio" aria-checked={deger === o.id} onClick={() => set(o.id)} className="relative h-8 shrink-0 rounded-full px-4 text-[13px] font-medium active:scale-[0.97]">
            {deger === o.id && <motion.span layoutId={id + "-z"} className="absolute inset-0 rounded-full bg-white" transition={yay} />}
            <span className={cn("relative transition-colors", deger === o.id ? "text-black" : "text-white/60 hover:text-white")}>{o.ad}</span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
}

/** Kart yüzeyi: genel bakıştaki koyu degrade + ince halka. */
export const yuzey = "rounded-[26px] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] ring-1 ring-white/[0.08]";
