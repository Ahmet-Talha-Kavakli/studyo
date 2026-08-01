"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Reveal } from "./Reveal";

export function FinalCTA() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-28">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-vayra-900/60 via-ink-850 to-ink-900 p-12 text-center md:p-20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-vayra-500/25 blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 h-56 w-56 rounded-full bg-cyan-glow/15 blur-[110px]" />
          </div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative text-4xl font-bold tracking-tight md:text-6xl"
          >
            Hayal et. Vayra üretsin.
          </motion.h2>
          <p className="relative mx-auto mt-5 max-w-xl text-lg text-white/60">
            Kredi kartı gerekmez. Bugün ücretsiz kredilerle başla, ilk sinematik
            içeriğini dakikalar içinde yayınla.
          </p>
          <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/kayit">
              <Button size="lg" variant="primary" className="group">
                Ücretsiz başla
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/fiyatlandirma">
              <Button size="lg" variant="glass">Planları gör</Button>
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
