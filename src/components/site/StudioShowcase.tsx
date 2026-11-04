"use client";

import Link from "next/link";
import { Clapperboard, Megaphone, Box, AudioLines, UserRound, ArrowUpRight } from "lucide-react";
import { Reveal } from "./Reveal";
import { STUDYOLAR } from "@/lib/catalog";

const ikonMap: Record<string, typeof Box> = {
  clapperboard: Clapperboard,
  megaphone: Megaphone,
  box: Box,
  "audio-lines": AudioLines,
  "user-round": UserRound,
};

export function StudioShowcase() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-28">
      <Reveal>
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-vayra-300">
            Stüdyolar
          </span>
          <h2 className="hf-baslik mt-3 text-4xl md:text-5xl">
            Her iş için özel bir stüdyo
          </h2>
          <p className="mt-4 text-lg text-white/60">
            Rakiplerin sunduğu her şey — ve fazlası. 3D ve ses üretimi yalnızca Vayra&apos;da.
          </p>
        </div>
      </Reveal>

      <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {STUDYOLAR.map((s, i) => {
          const Ikon = ikonMap[s.ikon] ?? Box;
          return (
            <Reveal key={s.id} i={i}>
              <Link
                href={s.href.replace("/panel", "/urunler")}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-yuzey p-7 transition-all duration-300 hover:border-white/20 hover:bg-yuzey-3"
              >
                {s.fark && (
                  <span className="absolute right-5 top-5 rounded-full bg-cyan-glow/15 px-2.5 py-1 text-[11px] font-semibold text-cyan-glow">
                    Vayra Farkı
                  </span>
                )}
                <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${s.renk}`}>
                  <Ikon className="h-7 w-7 text-white" strokeWidth={2} />
                </div>
                <h3 className="flex items-center gap-2 text-xl font-semibold">
                  {s.ad}
                  <ArrowUpRight className="h-4 w-4 text-white/30 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-white/55">{s.ozet}</p>
                <div className="mt-auto pt-6">
                  <span className="text-sm font-medium text-vayra-300 transition-colors group-hover:text-vayra-200">
                    Keşfet →
                  </span>
                </div>
                <div className="pointer-events-none absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-vayra-500/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
