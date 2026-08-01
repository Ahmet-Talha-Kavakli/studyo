"use client";

import { motion } from "framer-motion";
import { Reveal } from "./Reveal";
import { PenLine, Cpu, Download } from "lucide-react";

const adimlar = [
  { n: "01", ikon: PenLine, ad: "Anlat", ozet: "Fikrini yaz veya bir görsel yükle. İstersen karakterini Ruh ID ile eğit." },
  { n: "02", ikon: Cpu, ad: "Üret", ozet: "Modeli seç, kamera ve stili ayarla. Vayra saniyeler içinde işler." },
  { n: "03", ikon: Download, ad: "Yayınla", ozet: "4K'ya kadar indir, kitaplığına kaydet, doğrudan sosyal medyaya taşı." },
];

export function HowItWorks() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-28">
      <Reveal>
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-vayra-300">
            Nasıl çalışır
          </span>
          <h2 className="hf-baslik mt-3 text-4xl md:text-5xl">
            Üç adımda profesyonel içerik
          </h2>
        </div>
      </Reveal>

      <div className="relative mt-16 grid gap-8 md:grid-cols-3">
        {/* Bağlantı çizgisi */}
        <div className="pointer-events-none absolute left-0 right-0 top-16 hidden h-px bg-gradient-to-r from-transparent via-white/15 to-transparent md:block" />
        {adimlar.map((a, i) => (
          <Reveal key={a.n} i={i}>
            <div className="relative text-center">
              <motion.div
                whileHover={{ scale: 1.06, rotate: 3 }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-ink-850 shadow-xl"
              >
                <a.ikon className="h-7 w-7 text-vayra-300" />
              </motion.div>
              <div className="mt-5 text-sm font-mono text-white/30">{a.n}</div>
              <h3 className="mt-1 text-xl font-semibold">{a.ad}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-white/55">{a.ozet}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
