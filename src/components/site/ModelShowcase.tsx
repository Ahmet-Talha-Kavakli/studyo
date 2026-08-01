"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Zap } from "lucide-react";
import { Reveal } from "./Reveal";
import { onizlemeArka } from "@/lib/utils";
import { kesfetArka } from "@/lib/gercekVeri";

// Öne çıkan modeller — büyük sinematik tanıtım kartları
const showcaseModelleri = [
  { ad: "Ruh 2.0", tur: "Görsel", ozet: "Kültür-yerli editorial foto modeli", rozet: "Vayra", kredi: 4 },
  { ad: "Seedance 2.0", tur: "Video", ozet: "Senkron sesli çok çekimli filmler", rozet: "Pro", kredi: 42 },
  { ad: "Meshy 3D", tur: "3D", ozet: "Metinden üretime hazır 3D model", rozet: "Yeni", kredi: 25 },
  { ad: "ElevenLabs", tur: "Ses", ozet: "32 dilde ultra-gerçekçi seslendirme", rozet: "Vayra", kredi: 3 },
];

export function ModelShowcase() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-28">
      <Reveal>
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-vayra-300">Modeller</span>
          <h2 className="hf-baslik mt-3 text-4xl md:text-5xl">En iyi modeller, tek çatı altında</h2>
          <p className="mt-4 text-lg text-white/60">Video, görsel, 3D ve ses — her biri kendi alanının zirvesinde.</p>
        </div>
      </Reveal>

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {showcaseModelleri.map((m, i) => (
          <Reveal key={m.ad} i={i}>
            <Link href="/modeller"
              className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-3xl border border-white/10">
              {/* Arka plan */}
              <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                style={{ background: kesfetArka(m.ad + m.tur, "sinematik") }} />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent" />

              {/* Üst rozetler */}
              <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
                <span className="rounded-full bg-ink-950/50 px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm">{m.tur}</span>
                <span className="flex items-center gap-1 rounded-full bg-ink-950/50 px-2 py-1 text-[11px] font-medium text-amber-glow backdrop-blur-sm">
                  <Zap className="h-2.5 w-2.5" /> {m.kredi}
                </span>
              </div>

              {/* Alt içerik */}
              <div className="relative p-5">
                <span className={`mb-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  m.rozet === "Vayra" ? "bg-cyan-glow/20 text-cyan-glow" : m.rozet === "Yeni" ? "bg-emerald-400/20 text-emerald-300" : "bg-iris-500/20 text-iris-300"
                }`}>{m.rozet}</span>
                <h3 className="flex items-center gap-1.5 text-xl font-bold">
                  {m.ad}
                  <ArrowUpRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                </h3>
                <p className="mt-1 text-sm text-white/70">{m.ozet}</p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
