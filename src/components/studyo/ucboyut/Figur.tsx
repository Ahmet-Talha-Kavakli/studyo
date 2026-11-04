"use client";

import { useId } from "react";
import { motion, type TargetAndTransition, type Transition } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Mini iskelet figürleri — animasyon ve poz seçicilerinde hareketi/duruşu görselle anlatır.
 * Eklemler (omuz, kalça) etrafında döner; `oynat` kapalıyken figür ilk karede durur.
 */
type Hareket = "kos" | "nefes" | "alkis" | "el" | "otur" | "zipla" | "vurus" | "dans";
type Kare = { govde?: TargetAndTransition; kolS?: TargetAndTransition; kolG?: TargetAndTransition; bacakS?: TargetAndTransition; bacakG?: TargetAndTransition; sure: number };

export function hareketTuru(ad: string): Hareket {
  const a = ad.toLocaleLowerCase("tr");
  if (/koş|yürü/.test(a)) return "kos";
  if (/alkış/.test(a)) return "alkis";
  if (/selam/.test(a)) return "el";
  if (/otur/.test(a)) return "otur";
  if (/zıpla|takla|düş/.test(a)) return "zipla";
  if (/yumruk|tekme|kılıç|savun/.test(a)) return "vurus";
  if (/dans|salsa|dönüş/.test(a)) return "dans";
  return "nefes";
}

const KARELER: Record<Hareket, Kare> = {
  kos: { govde: { y: [0, -2, 0, -2, 0] }, kolS: { rotate: [-40, 40, -40] }, kolG: { rotate: [40, -40, 40] }, bacakS: { rotate: [28, -28, 28] }, bacakG: { rotate: [-28, 28, -28] }, sure: 0.8 },
  nefes: { govde: { y: [0, 1, 0] }, kolS: { rotate: [8, 12, 8] }, kolG: { rotate: [-8, -12, -8] }, sure: 2.4 },
  alkis: { kolS: { rotate: [-30, -70, -30] }, kolG: { rotate: [30, 70, 30] }, sure: 0.6 },
  el: { kolS: { rotate: [10, 10, 10] }, kolG: { rotate: [-150, -120, -150] }, sure: 0.7 },
  otur: { govde: { y: [0, 12, 12, 0] }, bacakS: { rotate: [0, 70, 70, 0] }, bacakG: { rotate: [0, 70, 70, 0] }, kolS: { rotate: [10, -40, -40, 10] }, kolG: { rotate: [-10, -40, -40, -10] }, sure: 2.4 },
  zipla: { govde: { y: [0, 4, -14, 0] }, bacakS: { rotate: [0, 25, -10, 0] }, bacakG: { rotate: [0, -25, 10, 0] }, kolS: { rotate: [10, 30, -150, 10] }, kolG: { rotate: [-10, -30, 150, -10] }, sure: 1.1 },
  vurus: { govde: { rotate: [0, 0, 6, 0] }, kolS: { rotate: [30, 30, 30, 30] }, kolG: { rotate: [-20, -20, -95, -20] }, bacakS: { rotate: [15, 15, 15, 15] }, bacakG: { rotate: [-15, -15, -15, -15] }, sure: 0.9 },
  dans: { govde: { rotate: [-8, 8, -8], y: [0, -2, 0] }, kolS: { rotate: [-130, -40, -130] }, kolG: { rotate: [40, 130, 40] }, bacakS: { rotate: [10, -15, 10] }, bacakG: { rotate: [15, -10, 15] }, sure: 1.2 },
};

const ilk = (t?: TargetAndTransition): TargetAndTransition => {
  if (!t) return {};
  const o: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(t)) o[k] = Array.isArray(v) ? v[0] : v;
  return o as TargetAndTransition;
};

/** Hareketli figür (animasyon kartı). */
export function HareketFigur({ ad, oynat, className, parlak }: { ad: string; oynat: boolean; className?: string; parlak?: boolean }) {
  const k = KARELER[hareketTuru(ad)];
  const tr: Transition = { duration: k.sure, repeat: Infinity, ease: "easeInOut" };
  const al = (t?: TargetAndTransition) => (oynat ? t ?? {} : ilk(t));
  const eklem = (x: number, y: number) => ({ transformOrigin: `${x}px ${y}px`, transformBox: "view-box" as const });
  const id = useId().replace(/:/g, "");
  const [a, b] = parlak ? ["#f4f5f7", "#9aa0aa"] : ["#c9ccd2", "#6b7079"];
  /* Uzuv: koyu kenarlı kalın kapsül + üstte ince ışık çizgisi (kil manken görünümü). */
  const uzuv = (d: string, w: number) => (<><path d={d} stroke={`url(#${id}u)`} strokeWidth={w} /><path d={d} stroke="#ffffff" strokeOpacity={parlak ? 0.35 : 0.18} strokeWidth={w * 0.28} transform="translate(-1.1 -0.6)" /></>);
  return (
    <svg viewBox="0 0 100 100" className={cn("overflow-visible", className)} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <linearGradient id={`${id}u`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient>
        <radialGradient id={`${id}k`} cx="0.35" cy="0.3" r="0.75"><stop offset="0" stopColor={parlak ? "#ffffff" : "#e2e4e8"} /><stop offset="0.6" stopColor={a} /><stop offset="1" stopColor={b} /></radialGradient>
        <radialGradient id={`${id}g`} cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#000" stopOpacity="0.55" /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx="50" cy="91" rx="20" ry="4.5" fill={`url(#${id}g)`} />
      <motion.g animate={al(k.govde)} transition={tr} style={eklem(50, 86)}>
        <motion.g animate={al(k.bacakG)} transition={tr} style={eklem(52, 57)}>{uzuv("M53 57l7 26", 7.5)}</motion.g>
        <motion.g animate={al(k.kolG)} transition={tr} style={eklem(56, 34)}>{uzuv("M57 35l11 17", 6)}</motion.g>
        <path d="M44 31.5h12l-1.5 15h-9z" fill={`url(#${id}u)`} stroke={`url(#${id}u)`} strokeWidth="6" />
        <path d="M45.5 49h9l1 6.5h-11z" fill={`url(#${id}u)`} stroke={`url(#${id}u)`} strokeWidth="4" />
        <path d="M45 33.5h4" stroke="#fff" strokeOpacity={parlak ? 0.45 : 0.22} strokeWidth="2.2" />
        <motion.g animate={al(k.bacakS)} transition={tr} style={eklem(47, 57)}>{uzuv("M47 57l-7 26", 7.5)}</motion.g>
        <motion.g animate={al(k.kolS)} transition={tr} style={eklem(44, 34)}>{uzuv("M43 35l-11 17", 6)}</motion.g>
        <path d="M50 24.5v5" stroke={`url(#${id}u)`} strokeWidth="5" />
        <ellipse cx="50" cy="17.5" rx="7.2" ry="8.2" fill={`url(#${id}k)`} />
      </motion.g>
    </svg>
  );
}

/** Duruş figürü (poz kartı): serbest, A-poz, T-poz. */
export function PozFigur({ id, className }: { id: string; className?: string }) {
  const kollar = id === "t" ? "M50 36H24M50 36h26" : id === "a" ? "M50 36L31 54M50 36l19 18" : "M50 36l-8 22M50 36l12 19";
  const bacaklar = id === "serbest" ? "M50 58l-6 27M50 58l11 26" : "M50 58l-10 27M50 58l10 27";
  return (
    <svg viewBox="0 0 100 100" className={cn("overflow-visible", className)} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="50" cy="90" rx="24" ry="4" fill="currentColor" stroke="none" opacity=".12" />
      <circle cx="50" cy="21" r="8" fill="currentColor" stroke="none" />
      <path d="M50 32v26" />
      <path d={kollar} />
      <path d={bacaklar} />
    </svg>
  );
}

/** 5 basamaklı ölçer (hız, detay). */
export function Olcer({ ad, deger }: { ad: string; deger: number }) {
  return (
    <span className="flex items-center gap-1.5 text-[11.5px] text-metin-2" title={`${ad}: ${deger}/5`}>
      {ad}
      <span className="flex gap-[3px]">
        {[1, 2, 3, 4, 5].map((i) => <span key={i} className={cn("h-[6px] w-3 rounded-full", i <= deger ? "bg-aksan" : "bg-white/[0.12]")} />)}
      </span>
    </span>
  );
}
