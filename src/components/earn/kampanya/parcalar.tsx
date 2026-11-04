"use client";

/** Earn kampanya ve gönderi sayfalarının ortak küçük parçaları. */

import { useEffect } from "react";
import { LayoutGroup, animate, motion, useMotionValue, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

export const yay = { type: "spring" as const, stiffness: 420, damping: 34 };
export const ease = [0.22, 1, 0.36, 1] as const;

/** Değere yumuşak sayan sayaç; değer motion value olarak doğrudan DOM'a yazılır (React yeniden çizmez). */
export function Sayac({ hedef, sure = 1.1, bicim }: { hedef: number; sure?: number; bicim: (n: number) => string }) {
  const mv = useMotionValue(0);
  const metin = useTransform(mv, (v) => bicim(v));
  useEffect(() => { const c = animate(mv, hedef, { duration: sure, ease: [0.22, 1, 0.36, 1] }); return () => c.stop(); }, [hedef, sure, mv]);
  return <motion.span>{metin}</motion.span>;
}

/** Beyaz kayan zeminli, sayılı segment. */
export function Segment<T extends string>({ id, secenek, deger, set, className }: { id: string; secenek: { id: T; ad: string; n?: number }[]; deger: T; set: (v: T) => void; className?: string }) {
  return (
    <LayoutGroup id={id}>
      <div role="radiogroup" className={cn("flex max-w-full overflow-x-auto rounded-full bg-white/[0.04] p-1 ring-1 ring-white/[0.08] [scrollbar-width:none]", className)}>
        {secenek.map((o) => (
          <button key={o.id} role="radio" aria-checked={deger === o.id} onClick={() => set(o.id)} className="relative flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium active:scale-[0.97]">
            {deger === o.id && <motion.span layoutId={id + "-z"} className="absolute inset-0 rounded-full bg-white" transition={yay} />}
            <span className={cn("relative transition-colors", deger === o.id ? "text-black" : "text-white/60 hover:text-white")}>{o.ad}</span>
            {o.n !== undefined && <span className={cn("relative text-[11.5px] tabular-nums", deger === o.id ? "text-black/45" : "text-white/40")}>{o.n}</span>}
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
}

/** Kalın yuvarlak yüzey (genel bakış diliyle). */
export const yuzey = "rounded-[26px] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] ring-1 ring-white/[0.08]";
