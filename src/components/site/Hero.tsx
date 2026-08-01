"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MODELLER } from "@/lib/catalog";

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  return (
    <section ref={ref} className="relative flex min-h-screen items-center overflow-hidden pt-24">
      {/* Aurora arka plan */}
      <motion.div style={{ scale }} className="pointer-events-none absolute inset-0 -z-10">
        {/* Higgsfield tek-vurgu disiplini: tek, hafif cyan hale (mor/amber glow kaldırıldı) */}
        <div className="absolute left-1/2 top-1/3 h-[460px] w-[720px] -translate-x-1/2 rounded-full bg-cyan-glow/12 blur-[160px]" />
      </motion.div>

      {/* Izgara */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent)",
        }}
      />

      <motion.div style={{ y, opacity }} className="mx-auto w-full max-w-6xl px-4 text-center">
        {/* Rozet */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm backdrop-blur-md"
        >
          <span className="flex h-2 w-2 rounded-full bg-emerald-400">
            <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />
          </span>
          <span className="text-white/80">Yeni: 3D Stüdyo & Ses Stüdyosu yayında</span>
          <Sparkles className="h-3.5 w-3.5 text-amber-glow" />
        </motion.div>

        {/* Başlık */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="hf-baslik mx-auto max-w-4xl text-balance text-5xl leading-[0.95] sm:text-6xl md:text-7xl"
        >
          Fikirden yayına<br />
          <span className="text-glow">tek sinematik panel</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-white/60 md:text-xl"
        >
          15+ video modeli, editorial görsel, <span className="text-white">3D modelleme</span> ve
          stüdyo kalitesinde <span className="text-white">ses üretimi</span> — hepsi Vayra&apos;da.
          Kamera kontrolü, karakter tutarlılığı ve dakikalar içinde reklam.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link href="/kayit">
            <Button size="lg" variant="primary" className="group">
              Ücretsiz üretmeye başla
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link href="/kesfet">
            <Button size="lg" variant="glass">
              <Play className="h-4 w-4" /> Örnekleri izle
            </Button>
          </Link>
        </motion.div>

        {/* Model şeridi */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-14"
        >
          <p className="mb-4 text-xs uppercase tracking-widest text-white/35">
            Sektörün en iyi modelleri tek çatı altında
          </p>
          <div className="relative mx-auto max-w-4xl overflow-hidden">
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {MODELLER.slice(0, 12).map((m) => (
                <span
                  key={m.id}
                  className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/70 backdrop-blur-sm"
                >
                  {m.ad}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll ipucu */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="flex h-9 w-6 items-start justify-center rounded-full border border-white/20 p-1.5">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
            className="h-1.5 w-1.5 rounded-full bg-white/60"
          />
        </div>
      </motion.div>
    </section>
  );
}
