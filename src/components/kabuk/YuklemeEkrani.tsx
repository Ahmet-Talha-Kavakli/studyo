"use client";

/**
 * Yükleme ekranı (kullanıcı seçimi A "Işık izi", 2026-11-04).
 * Marka işareti soldan sağa çizilerek belirir; ardından üzerinden camgöbeği ışık ve ince beyaz parıltı geçer.
 * Altında başı parlayan ilerleme çizgisi ve sırayla değişen durum cümlesi. Yalnız transform/opacity/mask
 * canlanır (bulanıklık animasyonu yok); hareketi azalt açıkken her şey durgun kalır.
 * tam=true: tüm ekranı kaplar (marka açılışı). Aksi hâlde bulunduğu alanı doldurur (route yüklemesi).
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const VARSAYILAN = ["Stüdyo hazırlanıyor", "Modeller ısınıyor", "Projelerin getiriliyor", "Neredeyse hazır"];

export function YuklemeIsigi({ durumlar = VARSAYILAN, kucuk = false }: { durumlar?: string[]; kucuk?: boolean }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (durumlar.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % durumlar.length), 1700);
    return () => clearInterval(t);
  }, [durumlar.length]);

  return (
    <div role="status" aria-live="polite" aria-label="Yükleniyor" className="yk-kok flex flex-col items-center">
      <div className={cn("relative", kucuk ? "h-[38px] w-[120px]" : "h-[58px] w-[182px]")}>
        {/* zemin parıltısı: durgun degrade, yalnız opaklığı nefes alır */}
        <span aria-hidden className="yk-taban pointer-events-none absolute left-1/2 top-[70%] h-[120%] w-[190%] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(closest-side, rgba(85,214,253,0.22), rgba(85,214,253,0.06) 55%, transparent)" }} />
        <div className="yk-ciz absolute inset-0">
          {/* sönük taban işaret */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/vayra-mark-kirpik.png" alt="" draggable={false} className="yk-isaret absolute inset-0 h-full w-full object-contain opacity-[0.3] saturate-[0.7]" />
          {/* camgöbeği ışık bandı */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/vayra-mark-kirpik.png" alt="" draggable={false} className="yk-isaret yk-bant absolute inset-0 h-full w-full object-contain" />
          {/* ince beyaz parıltı */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/vayra-mark-kirpik.png" alt="" draggable={false} className="yk-isaret yk-parilti absolute inset-0 h-full w-full object-contain brightness-[2.4] saturate-0" />
        </div>
      </div>

      <div className={cn("relative overflow-hidden rounded-full bg-white/[0.07]", kucuk ? "mt-6 h-[2px] w-[132px]" : "mt-9 h-[2px] w-[168px]")} aria-hidden>
        <span className="yk-cizgi absolute inset-y-0 left-0 w-[45%] rounded-full" style={{ background: "linear-gradient(90deg, transparent, rgba(85,214,253,0.55) 70%, #e9fbff)" }} />
      </div>

      <div className="relative mt-4 h-5 w-64 overflow-hidden text-center text-[13.5px] font-medium tracking-[-0.005em] text-white/50">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={i} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-x-0">
            {durumlar[i]}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Route yüklemesi: bulunduğu alanı kaplar, içeriği ortalar. */
export function YuklemeEkrani({ durumlar, className }: { durumlar?: string[]; className?: string }) {
  return (
    <div className={cn("flex min-h-[70vh] w-full flex-1 items-center justify-center bg-zemin px-4", className)}>
      <YuklemeIsigi durumlar={durumlar} />
    </div>
  );
}
