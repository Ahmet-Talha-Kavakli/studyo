"use client";

/* Sağ kenar çubuklarını sürükleyerek boyutlandırma (Sürümler, Geçmiş, çekmeceler).
   Genişlik bir motion değerinde tutulur: sürüklerken React yeniden çizmez, kare başına
   bir kez (rAF) yazılır. Genişlik tarayıcıda anahtar başına hatırlanır. */

import { useEffect, useState } from "react";
import { useMotionValue, useTransform, type MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

const oku = (anahtar: string) => { try { return Number(localStorage.getItem("vayra-kenar-" + anahtar)); } catch { return NaN; } };
const yaz = (anahtar: string, v: number) => { try { localStorage.setItem("vayra-kenar-" + anahtar, String(Math.round(v))); } catch { /* depolama kapalı */ } };

/** Kenar çubuğu genişliği: kayıtlı değer varsa onu, yoksa varsayılanı verir. */
export function useKenarGenisligi(anahtar: string, varsayilan: number, min = 200, max = 560) {
  const en = useMotionValue(varsayilan);
  useEffect(() => {
    const k = oku(anahtar);
    if (k >= min && k <= max) en.set(k);
  }, [anahtar, en, min, max]);
  return en;
}

/** Telefonda tam genişlik kalan paneller için: genişliği CSS değişkeni (--yan-en) olarak verir. */
export function useKenarStili(anahtar: string, varsayilan: number, min = 280, max = 640) {
  const en = useKenarGenisligi(anahtar, varsayilan, min, max);
  const px = useTransform(en, (v) => `${v}px`);
  return { en, stil: { "--yan-en": px } as unknown as React.CSSProperties, min, max, varsayilan, anahtar };
}

/** Kenar çubuğunun sol kenarına konan sürükleme tutamacı. Ebeveyn `relative` olmalı. */
export function KenarTutamac({ en, anahtar, varsayilan, min = 200, max = 560, etiket = "Panel genişliği", className, taraf = "sag" }: {
  en: MotionValue<number>; anahtar: string; varsayilan: number; min?: number; max?: number; etiket?: string; className?: string;
  /** Panelin ekrandaki yeri: sağ panelin tutamacı sol kenarda, sol panelinki sağ kenarda durur. */
  taraf?: "sag" | "sol";
}) {
  const yon = taraf === "sol" ? -1 : 1;
  const [surukle, setSurukle] = useState(false);
  const sinirla = (v: number) => Math.min(max, Math.max(min, v));
  const basla = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const el = e.currentTarget, bas = e.clientX, ilk = en.get();
    el.setPointerCapture(e.pointerId);
    setSurukle(true);
    document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none";
    let kare = 0, son = bas;
    const hareket = (ev: PointerEvent) => {
      son = ev.clientX;
      if (kare) return;
      kare = requestAnimationFrame(() => { kare = 0; en.set(sinirla(ilk - yon * (son - bas))); });
    };
    const birak = () => {
      cancelAnimationFrame(kare);
      el.removeEventListener("pointermove", hareket); el.removeEventListener("pointerup", birak); el.removeEventListener("pointercancel", birak);
      document.body.style.cursor = ""; document.body.style.userSelect = "";
      setSurukle(false); yaz(anahtar, en.get());
    };
    el.addEventListener("pointermove", hareket); el.addEventListener("pointerup", birak); el.addEventListener("pointercancel", birak);
  };
  return (
    <div role="separator" aria-orientation="vertical" aria-label={etiket} aria-valuemin={min} aria-valuemax={max} tabIndex={0}
      title="Sürükleyerek genişlet, çift tıkla sıfırla"
      onPointerDown={basla}
      onDoubleClick={() => { en.set(varsayilan); yaz(anahtar, varsayilan); }}
      onKeyDown={(e) => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); const v = sinirla(en.get() + yon * (e.key === "ArrowLeft" ? 24 : -24)); en.set(v); yaz(anahtar, v); } }}
      className={cn("group/tut absolute inset-y-0 z-20 flex w-2.5 cursor-col-resize touch-none items-center justify-center outline-none max-md:hidden", taraf === "sol" ? "right-0" : "left-0", className)}>
      <span className={cn("absolute inset-y-0 w-px", taraf === "sol" ? "right-0" : "left-0", " transition-colors duration-150", surukle ? "bg-white/60" : "bg-transparent group-hover/tut:bg-white/30 group-focus-visible/tut:bg-white/50")} />
      <span className={cn("absolute top-1/2 h-10 w-[5px] -translate-y-1/2 rounded-full transition-[opacity,background-color] duration-150", surukle ? "bg-white opacity-100" : "bg-white/50 opacity-0 group-hover/tut:opacity-100")} />
    </div>
  );
}
