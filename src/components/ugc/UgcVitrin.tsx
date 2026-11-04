"use client";

/**
 * UGC hero mekanizması: ürün, oyuncu × kanca ızgarası. Her hücre o oyuncunun kendi fotoğrafı + ürün + kanca
 * altyazısı; hücreler sırayla "oynar" (beyaz çerçeve + ilerleme çubuğu), ilgili oyuncu ve kanca başlığı birlikte yanar.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const SURE = 2200;
const ease = [0.22, 1, 0.36, 1] as const;

export function UgcVitrin({ urun, oyuncular, kancalar }: {
  urun: { ad: string; gorsel: string; fayda: string };
  oyuncular: { ad: string; gorsel: string }[];
  kancalar: string[];
}) {
  const [aktif, setAktif] = useState(0);
  const n = oyuncular.length * kancalar.length;
  useEffect(() => { const t = setInterval(() => setAktif((v) => (v + 1) % n), SURE); return () => clearInterval(t); }, [n]);
  const aKanca = Math.floor(aktif / oyuncular.length);
  return (
    <div>
      <div className="flex items-center gap-3 rounded-[16px] bg-white/[0.06] p-2 ring-1 ring-inset ring-white/[0.1]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <motion.img key={urun.gorsel} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4, ease }} src={urun.gorsel} alt="" className="h-11 w-11 shrink-0 rounded-[10px] bg-white object-cover" />
        <span className="min-w-0 flex-1 leading-tight"><span className="block truncate text-[14px] font-semibold text-white">{urun.ad}</span><span className="block truncate text-[12.5px] text-white/60">{urun.fayda}</span></span>
        <span className="shrink-0 rounded-full bg-white/[0.1] px-2.5 py-1 text-[12px] font-medium tabular-nums text-white/85">{n} reklam</span>
      </div>
      {/* Kancalar: hangi kanca oynuyorsa o yanar */}
      <div className="mt-2.5 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${kancalar.length}, minmax(0, 1fr))` }}>
        {kancalar.map((k, ki) => (
          <span key={k} className={cn("flex items-center gap-2 rounded-[12px] px-2 py-1.5 text-[12px] leading-snug transition-colors duration-300", ki === aKanca ? "bg-white/[0.14] text-white" : "bg-white/[0.04] text-white/55")}>
            <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors", ki === aKanca ? "bg-white text-black" : "bg-white/[0.1] text-white/70")}>{String.fromCharCode(65 + ki)}</span>
            <span className="line-clamp-2">{k}</span>
          </span>
        ))}
      </div>
      {/* Oyuncu sütunları × kanca satırları */}
      <div className={cn("mt-2.5 grid gap-2", oyuncular.length * kancalar.length === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3")}>
        {kancalar.flatMap((k, ki) => oyuncular.map((o, oi) => {
          const i = ki * oyuncular.length + oi, a = i === aktif;
          return (
            <motion.div key={`${ki}-${oi}`} animate={{ opacity: a ? 1 : 0.6, y: a ? -3 : 0 }} transition={{ duration: 0.4, ease }}
              className={cn("relative aspect-[9/16] overflow-hidden rounded-[12px] max-sm:aspect-[4/5] bg-black ring-1 ring-inset", a ? "ring-white/80" : "ring-white/10")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={o.gorsel} alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30" />
              <span className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-black">{String.fromCharCode(65 + ki)}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={urun.gorsel} alt="" className="absolute bottom-[34%] right-1.5 h-[22%] w-[42%] rounded-[8px] bg-white object-cover ring-2 ring-white/80" />
              <span className="absolute inset-x-1.5 bottom-3 leading-tight"><span className="block text-[11px] font-semibold text-white/75">{o.ad}</span><span className="line-clamp-3 text-[10.5px] font-bold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.8)] max-sm:text-[12px]">{k}</span></span>
              <span className="absolute inset-x-0 bottom-0 h-[3px] bg-white/15">{a && <motion.span key={`p${aktif}`} className="block h-full bg-white" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: SURE / 1000, ease: "linear" }} />}</span>
            </motion.div>
          );
        }))}
      </div>
    </div>
  );
}
