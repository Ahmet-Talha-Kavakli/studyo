"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { AIModel } from "@/lib/catalog";
import { modelKapak } from "@/lib/api/gorsel";
import { TUR_ADI } from "@/lib/api/sema";
import { ModelLogo } from "@/components/kitaplik/Simgeler";

export function ModelKarti({ m, istek, i = 0 }: { m: AIModel; istek?: number; i?: number }) {
  const birim = m.tur === "gorsel" ? "görsel başına" : m.kisit?.krediSn ? "saniye başına" : "istek başına";
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ type: "spring", stiffness: 420, damping: 34, delay: Math.min(i, 12) * 0.025 }}>
      <Link href={`/panel/api/modeller/${m.id}`} className="group flex h-full flex-col overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] ring-1 ring-white/[0.08] transition hover:ring-white/[0.2]">
        <div className="relative aspect-[16/9] overflow-hidden bg-[#0c0c0e]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={modelKapak(m.id)} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25" />
          <span className="absolute left-3 top-3 inline-flex h-7 items-center rounded-full bg-black/50 px-2.5 text-[12px] font-medium text-white ring-1 ring-white/[0.12] backdrop-blur">{TUR_ADI[m.tur]}</span>
          {m.rozet && <span className="absolute right-3 top-3 inline-flex h-7 items-center rounded-full bg-black/50 px-2.5 text-[12px] font-medium text-white ring-1 ring-white/[0.12] backdrop-blur">{m.rozet}</span>}
          <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/55 ring-1 ring-white/[0.14] backdrop-blur"><ModelLogo ad={`${m.ad} ${m.saglayici} ${m.id}`} boyut={18} /></span>
            <span className="flex h-9 w-9 translate-y-1 items-center justify-center rounded-full bg-white text-black opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"><ArrowUpRight className="h-4 w-4" /></span>
          </div>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="truncate text-[16px] font-semibold tracking-[-0.01em] text-white">{m.ad}</h3>
            <span className="shrink-0 text-[12.5px] text-white/55">{m.saglayici}</span>
          </div>
          <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-white/65">{m.aciklama}</p>
          <div className="mt-auto flex items-end justify-between gap-2 pt-4">
            <code className="truncate font-mono text-[11.5px] text-white/50">{m.id}</code>
            <span className="shrink-0 text-right leading-tight">
              <span className="block text-[17px] font-semibold tabular-nums text-white">{m.kisit?.krediSn ?? m.kredi}<span className="ml-1 text-[12px] font-normal text-white/55">kredi</span></span>
              <span className="block text-[11.5px] text-white/45">{birim}</span>
            </span>
          </div>
          {istek !== undefined && istek > 0 && <p className="mt-3 border-t border-white/[0.06] pt-2.5 text-[12px] text-white/60">{istek} istek gönderdin</p>}
        </div>
      </Link>
    </motion.div>
  );
}
