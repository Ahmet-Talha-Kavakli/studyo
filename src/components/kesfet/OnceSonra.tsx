"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, animate, motion } from "framer-motion";
import { ArrowRight, ChevronsLeftRight } from "lucide-react";
import { ONCE_SONRA } from "./veri";
import { Belir, Kap, butonSinif } from "./ortak";
import { cn } from "@/lib/utils";

/**
 * Önce / Sonra karşılaştırması — sürüklenebilir ayraç.
 * İlk görünüşte ayraç kendiliğinden bir kez gidip gelir (etkileşim ipucu);
 * kullanıcı dokunduğu an bu tanıtım iptal olur.
 */
export function OnceSonra() {
  const [secili, setSecili] = useState(0);
  const o = ONCE_SONRA[secili];

  return (
    <section className="py-16 sm:py-20">
      <Kap className="grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <Belir>
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-vurgu">Düzenle & büyüt</p>
          <div className="mb-8 flex flex-wrap gap-1.5">
            {ONCE_SONRA.map((x, i) => (
              <button key={x.id} onClick={() => setSecili(i)}
                className={cn("rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                  i === secili ? "border-white bg-white text-zemin" : "border-white/[0.12] text-metin-2 hover:border-white/25 hover:text-white")}>
                {x.ad}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
              <h2 className="text-balance text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-[44px]">{o.baslik}</h2>
              <p className="mt-4 max-w-[440px] text-[15.5px] leading-relaxed text-metin-2">{o.ozet}</p>
              <Link href={o.href} className={cn(butonSinif("ikincil"), "mt-8")}>{o.ad} aracını dene <ArrowRight className="h-4 w-4" /></Link>
            </motion.div>
          </AnimatePresence>
        </Belir>

        <Belir gecikme={0.1}>
          <Karsilastir key={o.id} once={o.once} sonra={o.sonra} onceFiltre={o.onceFiltre} />
        </Belir>
      </Kap>
    </section>
  );
}

function Karsilastir({ once, sonra, onceFiltre }: { once: string; sonra: string; onceFiltre?: string }) {
  const kutuRef = useRef<HTMLDivElement>(null);
  const [konum, setKonum] = useState(50);
  const surukle = useRef(false);
  const dokunuldu = useRef(false);

  // Görünür olunca bir kez tanıtım salınımı.
  useEffect(() => {
    const el = kutuRef.current;
    if (!el) return;
    let iptal: (() => void) | undefined;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || dokunuldu.current) return;
      io.disconnect();
      const a = animate(50, [50, 22, 78, 50], {
        duration: 2.4, ease: "easeInOut", delay: 0.3,
        onUpdate: (v) => { if (!dokunuldu.current) setKonum(v); },
      });
      iptal = () => a.stop();
    }, { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); iptal?.(); };
  }, []);

  const ayarla = (clientX: number) => {
    const r = kutuRef.current?.getBoundingClientRect();
    if (!r) return;
    setKonum(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  };

  return (
    <div ref={kutuRef}
      onPointerDown={(e) => { dokunuldu.current = true; surukle.current = true; e.currentTarget.setPointerCapture(e.pointerId); ayarla(e.clientX); }}
      onPointerMove={(e) => { if (surukle.current) ayarla(e.clientX); }}
      onPointerUp={() => { surukle.current = false; }}
      onPointerCancel={() => { surukle.current = false; }}
      onLostPointerCapture={() => { surukle.current = false; }}
      className="relative aspect-[4/3] cursor-ew-resize touch-none select-none overflow-hidden rounded-[24px] border border-white/[0.07] bg-yuzey">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={sonra} alt="Sonra" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={once} alt="Önce" draggable={false} className="absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: `inset(0 ${100 - konum}% 0 0)`, filter: onceFiltre }} />

      <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1 text-[12px] font-medium text-white backdrop-blur-md">Önce</span>
      <span className="pointer-events-none absolute right-4 top-4 rounded-full bg-black/55 px-3 py-1 text-[12px] font-medium text-white backdrop-blur-md">Sonra</span>

      {/* Ayraç */}
      <div className="pointer-events-none absolute inset-y-0" style={{ left: `${konum}%` }}>
        <span className="absolute inset-y-0 -left-px w-[2px] bg-white" />
        <span
          role="slider" aria-label="Karşılaştırma ayracı" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(konum)} tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") { dokunuldu.current = true; setKonum((k) => Math.min(100, Math.max(0, k + (e.key === "ArrowLeft" ? -5 : 5)))); }
          }}
          className="pointer-events-auto absolute left-0 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-zemin focus:outline-none focus-visible:ring-4 focus-visible:ring-aksan/50">
          <ChevronsLeftRight className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}
